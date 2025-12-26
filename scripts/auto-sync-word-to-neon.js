/**
 * Script automatisé : Word → Neon
 * 
 * Ce script :
 * 1. Parse le fichier Word pour extraire les métadonnées
 * 2. Synchronise les vidéos depuis S3 vers Neon
 * 3. Match les métadonnées avec les vidéos par numéro
 * 4. Met à jour Neon avec les métadonnées
 * 
 * Usage: node scripts/auto-sync-word-to-neon.js <chemin-word> [--region=<region>]
 * 
 * Exemple: 
 *   node scripts/auto-sync-word-to-neon.js "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx" --region=abdos
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const mammoth = require('mammoth')
const AdmZip = require('adm-zip')
const fs = require('fs')
const path = require('path')

// Prefer Neon DATABASE_URL
const envPath = path.join(__dirname, '..', '.env.local')
let databaseUrl = process.env.DATABASE_URL

if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('DATABASE_URL=') && line.includes('neon.tech')) {
        databaseUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '')
        break
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de lire .env.local')
  }
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false
})

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'eu-north-1' 
})
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const S3_BASE_URL = `https://${bucketName}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com`

/**
 * Encode S3 key to properly formatted URL path
 * Encodes each segment separately to preserve slashes
 */
function encodeS3KeyToUrl(key) {
  return key.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

/**
 * Build properly encoded S3 URL from key
 */
function buildS3Url(key) {
  const encodedKey = encodeS3KeyToUrl(key)
  return `${S3_BASE_URL}/${encodedKey}`
}

/**
 * Extract text from Word document
 */
async function extractTextFromWord(wordPath) {
  try {
    // Try mammoth first
    const result = await mammoth.extractRawText({ path: wordPath })
    return result.value
  } catch (error) {
    // Fallback to manual extraction
    console.warn('⚠️  mammoth failed, trying manual extraction...')
    try {
      const zip = new AdmZip(wordPath)
      const xmlContent = zip.readAsText('word/document.xml')
      const text = xmlContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text
    } catch (error2) {
      throw new Error(`Failed to extract text: ${error2.message}`)
    }
  }
}

/**
 * Parse exercises from text
 */
function parseExercisesFromText(text, region) {
  const exercises = []
  
  // Pattern 1: Numbered list (1., 2., etc.)
  const numberedPattern = /(\d+)\.\s*([^\n]+(?:\n(?!\d+\.)[^\n]+)*)/g
  let match
  
  while ((match = numberedPattern.exec(text)) !== null) {
    const number = parseInt(match[1], 10)
    const content = match[2].trim()
    const metadata = extractMetadataFromContent(content, number, region)
    if (metadata) {
      exercises.push(metadata)
    }
  }
  
  // Pattern 2: "Vidéo X" pattern
  const videoPattern = /[Vv]id[ée]o\s+(\d+)[\s:\.]+([^\n]+(?:\n(?!Vidéo|vidéo)[^\n]+)*)/g
  while ((match = videoPattern.exec(text)) !== null) {
    const number = parseInt(match[1], 10)
    const content = match[2].trim()
    const metadata = extractMetadataFromContent(content, number, region)
    if (metadata) {
      const existing = exercises.find(e => e.videoNumber === number)
      if (!existing) {
        exercises.push(metadata)
      }
    }
  }
  
  return exercises
}

/**
 * Extract metadata from exercise content
 */
function extractMetadataFromContent(content, videoNumber, region) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return null
  
  const metadata = {
    videoNumber,
    region: region || 'abdos',
    muscleCible: null,
    positionDepart: null,
    mouvement: null,
    intensite: null,
    serie: null,
    contreIndication: null,
    title: null
  }
  
  // Patterns for French metadata
  const patterns = {
    muscleCible: /[Mm]uscle[s]?\s+[Cc]ible[s]?:?\s*(.+)/i,
    positionDepart: /[Pp]osition\s+[Dd][ée]part:?\s*(.+)/i,
    mouvement: /[Mm]ouvement:?\s*(.+)/i,
    intensite: /[Ii]ntensit[ée]:?\s*(.+)/i,
    serie: /[Ss][ée]rie[s]?:?\s*(.+)/i,
    contreIndication: /[Cc]ontre[-\s]?[Ii]ndication[s]?:?\s*(.+)/i
  }
  
  // Extract metadata
  for (const line of lines) {
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = line.match(pattern)
      if (match && !metadata[key]) {
        metadata[key] = match[1].trim()
      }
    }
  }
  
  // Title is usually the first line without metadata keywords
  const titleLine = lines.find(l => {
    const lower = l.toLowerCase()
    return !lower.includes('muscle') && 
           !lower.includes('position') && 
           !lower.includes('mouvement') &&
           !lower.includes('intensité') &&
           !lower.includes('série') &&
           !lower.includes('contre')
  })
  
  metadata.title = titleLine || lines[0] || `Exercice ${videoNumber}`
  
  return metadata
}

/**
 * Extract video number from S3 key or title
 */
function extractVideoNumber(videoUrl, title) {
  // From URL: Video/programmes-predefinis/abdos/12. Exercice.mp4
  const urlMatch = videoUrl.match(/(?:^|\/)(\d+)(?:\.\s)/i)
  if (urlMatch) {
    return parseInt(urlMatch[1], 10)
  }
  
  // From title: "12. Exercice"
  const titleMatch = title.match(/^(\d+)\.\s/)
  if (titleMatch) {
    return parseInt(titleMatch[1], 10)
  }
  
  return null
}

/**
 * Sync videos from S3 to Neon
 */
async function syncVideosFromS3(region) {
  console.log(`\n📥 2. Synchronisation des vidéos depuis S3...\n`)
  
  const prefix = `Video/programmes-predefinis/${region}/`
  const videos = []
  let continuationToken = null
  
  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken
    })
    
    const response = await s3Client.send(listCommand)
    
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.Key.match(/\.(mp4|mov|avi)$/i) && !obj.Key.includes('thumbnails/')) {
          videos.push(obj.Key)
        }
      }
    }
    
    continuationToken = response.NextContinuationToken
  } while (continuationToken)
  
  console.log(`   ✅ ${videos.length} vidéo(s) trouvée(s) dans S3\n`)
  
  // For each video, check if it exists in Neon, if not, add it
  let syncedCount = 0
  let skippedCount = 0
  
  for (const s3Key of videos) {
    const filename = s3Key.split('/').pop() || ''
    // Generate full S3 URL with proper encoding
    const videoUrl = buildS3Url(s3Key)
    
    // Generate title from filename
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
    const cleaned = nameWithoutExt.replace(/^\d+\.\s*/, '')
    const withSpaces = cleaned.replace(/[-_]/g, ' ')
    const title = withSpaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    // Check if video exists
    const existing = await pool.query(
      'SELECT id FROM videos_new WHERE "videoUrl" LIKE $1',
      [`%${s3Key}%`]
    )
    
    if (existing.rows && existing.rows.length > 0) {
      skippedCount++
      continue
    }
    
    // Insert video
    const now = new Date().toISOString()
    await pool.query(`
      INSERT INTO videos_new (
        title, description, "videoUrl", thumbnail, duration,
        difficulty, category, region, "muscleGroups", targeted_muscles,
        "videoType", "isPublished", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, NULL, 0, $4, $5, $6, $7, $8, $9, true, $10, $10)
    `, [
      title,
      `Exercice: ${title}`,
      videoUrl,
      'intermediaire',
      'Predefined Programs',
      region,
      [],
      [region],
      'PROGRAMMES',
      now
    ])
    
    syncedCount++
    console.log(`   ✅ Synchronisé: ${title}`)
  }
  
  console.log(`\n   📊 ${syncedCount} synchronisée(s), ${skippedCount} déjà existante(s)\n`)
  
  return videos.length
}

/**
 * Update videos in Neon with metadata from Word
 */
async function updateVideosWithMetadata(exercises, region) {
  console.log(`\n📝 3. Mise à jour des métadonnées dans Neon...\n`)
  
  let updatedCount = 0
  let notFoundCount = 0
  
  for (const exercise of exercises) {
    const { videoNumber, title, muscleCible, positionDepart, mouvement, intensite, serie, contreIndication } = exercise
    
    // Find video by number and region
    const videos = await pool.query(`
      SELECT id, title, "videoUrl"
      FROM videos_new
      WHERE region = $1
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
    `, [region])
    
    // Find video by number
    let video = null
    for (const v of videos.rows) {
      const num = extractVideoNumber(v.videoUrl, v.title)
      if (num === videoNumber) {
        video = v
        break
      }
    }
    
    if (!video) {
      console.log(`   ⚠️  Vidéo ${videoNumber} non trouvée pour la région ${region}`)
      notFoundCount++
      continue
    }
    
    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString()
    }
    
    // Map Titre exercice → exo_title
    if (title) updateData.exo_title = title
    
    // Helper function to remove trailing dots
    const removeTrailingDot = (text) => {
      if (!text) return text
      return text.trim().replace(/\.$/, '')
    }
    
    // Map Muscle cible → targeted_muscles (convert string to array)
    if (muscleCible) {
      // Split by comma and clean up, remove trailing dots
      const muscles = muscleCible
        .split(',')
        .map(m => removeTrailingDot(m.trim()))
        .filter(m => m.length > 0)
      updateData.targeted_muscles = muscles
    }
    
    if (positionDepart) updateData.startingPosition = positionDepart
    if (mouvement) updateData.movement = mouvement
    if (intensite) updateData.intensity = removeTrailingDot(intensite)
    if (serie) updateData.series = removeTrailingDot(serie)
    if (contreIndication) updateData.constraints = removeTrailingDot(contreIndication)
    
    // Update video
    const setClause = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const values = Object.values(updateData)
    values.push(video.id)
    
    await pool.query(
      `UPDATE videos_new SET ${setClause} WHERE id = $${values.length}`,
      values
    )
    
    console.log(`   ✅ Vidéo ${videoNumber} (${video.title}) mise à jour`)
    updatedCount++
  }
  
  console.log(`\n   📊 ${updatedCount} mise(s) à jour, ${notFoundCount} non trouvée(s)\n`)
}

/**
 * Main function
 */
async function main() {
  const wordPath = process.argv[2]
  const regionArg = process.argv.find(arg => arg.startsWith('--region='))
  const region = regionArg ? regionArg.split('=')[1] : null
  
  if (!wordPath) {
    console.error('❌ Usage: node scripts/auto-sync-word-to-neon.js <chemin-word> [--region=<region>]')
    console.error('   Exemple: node scripts/auto-sync-word-to-neon.js "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx" --region=abdos')
    process.exit(1)
  }
  
  if (!region) {
    console.error('❌ Région manquante. Utilisez --region=<region>')
    console.error('   Exemple: --region=abdos')
    process.exit(1)
  }
  
  console.log('🚀 Automatisation Word → Neon\n')
  console.log(`📄 Fichier Word: ${wordPath}`)
  console.log(`📍 Région: ${region}\n`)
  
  try {
    // Step 1: Parse Word
    console.log('📋 1. Extraction des métadonnées depuis le Word...\n')
    const text = await extractTextFromWord(wordPath)
    console.log(`   ✅ Texte extrait (${text.length} caractères)`)
    
    const exercises = parseExercisesFromText(text, region)
    console.log(`   ✅ ${exercises.length} exercice(s) extrait(s)\n`)
    
    if (exercises.length === 0) {
      console.log('⚠️  Aucun exercice trouvé dans le Word')
      console.log('   Vérifiez le format du document\n')
    } else {
      console.log('   Exemples d\'exercices extraits:')
      exercises.slice(0, 3).forEach(ex => {
        console.log(`   - Vidéo ${ex.videoNumber}: ${ex.title}`)
        if (ex.positionDepart) console.log(`     Position: ${ex.positionDepart}`)
        if (ex.mouvement) console.log(`     Mouvement: ${ex.mouvement}`)
      })
      console.log('')
    }
    
    // Step 2: Sync videos from S3
    const videoCount = await syncVideosFromS3(region)
    
    // Step 3: Update videos with metadata
    if (exercises.length > 0) {
      await updateVideosWithMetadata(exercises, region)
    }
    
    // Summary
    console.log('✅ Automatisation terminée!\n')
    console.log('📊 Résumé:')
    console.log(`   - Exercices extraits du Word: ${exercises.length}`)
    console.log(`   - Vidéos dans S3: ${videoCount}`)
    console.log(`   - Métadonnées mises à jour: ${exercises.length}`)
    console.log('')
    console.log('💡 Prochaines étapes:')
    console.log('   1. Identifier les vidéos: node scripts/identify-program-videos.js ' + region)
    console.log('   2. Configurer l\'ordre dans lib/program-orders.ts')
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

