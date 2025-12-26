/**
 * Script pour ingérer les métadonnées dans Neon
 * 
 * Format d'entrée (JSON ou format texte simple):
 * 
 * Option 1: Fichier JSON
 * [
 *   {
 *     "videoNumber": 12,
 *     "region": "abdos",
 *     "muscleCible": "Abdominaux",
 *     "positionDepart": "Allongé sur le dos",
 *     "mouvement": "Relever le buste",
 *     "intensite": "Moyenne",
 *     "serie": "3x15",
 *     "contreIndication": "Problèmes de dos"
 *   },
 *   ...
 * ]
 * 
 * Option 2: Format texte simple (dans un fichier .txt)
 * Vidéo 12 (abdos):
 *   - Muscle cible: Abdominaux
 *   - Position départ: Allongé sur le dos
 *   - Mouvement: Relever le buste
 *   - Intensité: Moyenne
 *   - Série: 3x15
 *   - Contre-indication: Problèmes de dos
 * 
 * Usage: 
 *   node scripts/ingest-metadata-to-neon.js <fichier-json-ou-txt> [--dry-run]
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
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

const DRY_RUN = process.argv.includes('--dry-run')

/**
 * Parse text format to JSON
 */
function parseTextFormat(text) {
  const exercises = []
  const sections = text.split(/Vidéo\s+(\d+)\s*\(([^)]+)\):/i)
  
  for (let i = 1; i < sections.length; i += 3) {
    const videoNumber = parseInt(sections[i], 10)
    const region = sections[i + 1].trim()
    const content = sections[i + 2] || ''
    
    const exercise = {
      videoNumber,
      region,
      title: null,
      muscleCible: null,
      positionDepart: null,
      mouvement: null,
      intensite: null,
      serie: null,
      contreIndication: null
    }
    
    // Parse metadata lines
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    for (const line of lines) {
      const titreMatch = line.match(/Titre\s+exercice:\s*(.+)/i)
      if (titreMatch) exercise.title = titreMatch[1].trim()
      
      const muscleMatch = line.match(/Muscle\s+cible:\s*(.+)/i)
      if (muscleMatch) exercise.muscleCible = muscleMatch[1].trim()
      
      const positionMatch = line.match(/Position\s+d[ée]part:\s*(.+)/i)
      if (positionMatch) exercise.positionDepart = positionMatch[1].trim()
      
      const mouvementMatch = line.match(/Mouvement:\s*(.+)/i)
      if (mouvementMatch) exercise.mouvement = mouvementMatch[1].trim()
      
      const intensiteMatch = line.match(/Intensit[ée]:\s*(.+)/i)
      if (intensiteMatch) exercise.intensite = intensiteMatch[1].trim()
      
      const serieMatch = line.match(/S[ée]rie:\s*(.+)/i)
      if (serieMatch) exercise.serie = serieMatch[1].trim()
      
      const contreMatch = line.match(/Contre[-\s]?indication:\s*(.+)/i)
      if (contreMatch) exercise.contreIndication = contreMatch[1].trim()
    }
    
    exercises.push(exercise)
  }
  
  return exercises
}

/**
 * Load metadata from file (JSON or text format)
 */
function loadMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Try JSON first
  try {
    return JSON.parse(content)
  } catch (error) {
    // If not JSON, try text format
    return parseTextFormat(content)
  }
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
  console.log(`\n📥 Synchronisation des vidéos depuis S3 (région: ${region})...\n`)
  
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
    
    if (!DRY_RUN) {
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
    }
    
    syncedCount++
    console.log(`   ${DRY_RUN ? '🔍 [DRY-RUN]' : '✅'} Synchronisé: ${title}`)
  }
  
  console.log(`\n   📊 ${syncedCount} synchronisée(s), ${skippedCount} déjà existante(s)\n`)
  
  return videos.length
}

/**
 * Update videos in Neon with metadata
 */
async function updateVideosWithMetadata(exercises, region) {
  console.log(`\n📝 Mise à jour des métadonnées dans Neon...\n`)
  
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
    
    if (!DRY_RUN) {
      // Update video
      const setClause = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
      const values = Object.values(updateData)
      values.push(video.id)
      
      await pool.query(
        `UPDATE videos_new SET ${setClause} WHERE id = $${values.length}`,
        values
      )
    }
    
    console.log(`   ${DRY_RUN ? '🔍 [DRY-RUN]' : '✅'} Vidéo ${videoNumber} (${video.title})`)
    if (title) console.log(`      → Titre exercice: ${title}`)
    if (muscleCible) console.log(`      → Muscle cible: ${muscleCible}`)
    if (positionDepart) console.log(`      → Position: ${positionDepart}`)
    if (mouvement) console.log(`      → Mouvement: ${mouvement}`)
    if (intensite) console.log(`      → Intensité: ${intensite}`)
    if (serie) console.log(`      → Série: ${serie}`)
    if (contreIndication) console.log(`      → Contre-indication: ${contreIndication}`)
    updatedCount++
  }
  
  console.log(`\n   📊 ${updatedCount} mise(s) à jour, ${notFoundCount} non trouvée(s)\n`)
}

/**
 * Main function
 */
async function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('❌ Usage: node scripts/ingest-metadata-to-neon.js <fichier-json-ou-txt> [--dry-run]')
    console.error('\n   Format texte:')
    console.error('   Vidéo 12 (abdos):')
    console.error('     - Muscle cible: Abdominaux')
    console.error('     - Position départ: Allongé sur le dos')
    console.error('     - Mouvement: Relever le buste')
    console.error('     - Intensité: Moyenne')
    console.error('     - Série: 3x15')
    console.error('     - Contre-indication: Problèmes de dos')
    process.exit(1)
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`)
    process.exit(1)
  }
  
  console.log('🚀 Ingestion des métadonnées dans Neon\n')
  console.log(`📄 Fichier: ${filePath}`)
  if (DRY_RUN) {
    console.log('🔍 Mode DRY-RUN (aucune modification)\n')
  }
  
  try {
    // Load metadata
    console.log('📋 1. Chargement des métadonnées...\n')
    const exercises = loadMetadata(filePath)
    console.log(`   ✅ ${exercises.length} exercice(s) chargé(s)\n`)
    
    if (exercises.length === 0) {
      console.log('⚠️  Aucun exercice trouvé dans le fichier')
      process.exit(1)
    }
    
    // Group by region
    const byRegion = {}
    for (const ex of exercises) {
      const region = ex.region || 'abdos'
      if (!byRegion[region]) {
        byRegion[region] = []
      }
      byRegion[region].push(ex)
    }
    
    // Process each region
    for (const [region, regionExercises] of Object.entries(byRegion)) {
      console.log(`\n📍 Traitement de la région: ${region}`)
      console.log(`   ${regionExercises.length} exercice(s)\n`)
      
      // Step 1: Sync videos from S3
      await syncVideosFromS3(region)
      
      // Step 2: Update with metadata
      await updateVideosWithMetadata(regionExercises, region)
    }
    
    // Summary
    console.log('\n✅ Ingestion terminée!\n')
    console.log('📊 Résumé:')
    console.log(`   - Exercices traités: ${exercises.length}`)
    console.log(`   - Régions: ${Object.keys(byRegion).join(', ')}`)
    if (DRY_RUN) {
      console.log('\n💡 Pour appliquer les changements, relancez sans --dry-run')
    }
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

