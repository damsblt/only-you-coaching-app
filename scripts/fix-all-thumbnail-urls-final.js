const { Pool } = require('pg')
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

// Create a map of S3 files for quick lookup
async function buildS3ThumbnailMap() {
  console.log('📥 Construction de la carte des thumbnails S3...')
  
  const thumbnailsMap = new Map()
  let continuationToken = undefined
  let totalFiles = 0

  do {
    const command = new ListObjectsV2Command({
      Bucket: 'only-you-coaching',
      Prefix: 'thumbnails/',
      MaxKeys: 1000,
      ContinuationToken: continuationToken
    })

    const response = await s3Client.send(command)
    
    if (response.Contents) {
      response.Contents.forEach(obj => {
        const key = obj.Key
        const filename = path.basename(key).toLowerCase()
        
        // Store by filename (normalized) and full key
        if (!thumbnailsMap.has(filename)) {
          thumbnailsMap.set(filename, [])
        }
        thumbnailsMap.get(filename).push(key)
        totalFiles++
      })
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  console.log(`   ✅ ${totalFiles} thumbnails indexés\n`)
  return thumbnailsMap
}

function normalizeFilename(filename) {
  return filename
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\.jpg$|\.jpeg$|\.png$/i, '')
    .replace(/[^a-z0-9]/g, '')
}

function findBestMatch(videoTitle, thumbnailsMap) {
  const normalizedTitle = normalizeFilename(videoTitle)
  
  // Try exact matches first
  for (const [filename, keys] of thumbnailsMap.entries()) {
    const normalizedFilename = normalizeFilename(filename)
    if (normalizedFilename === normalizedTitle + 'thumbjpg' || 
        normalizedFilename.includes(normalizedTitle)) {
      return keys[0] // Return first match
    }
  }

  // Try fuzzy match by title words
  const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2)
  let bestMatch = null
  let bestScore = 0

  for (const [filename, keys] of thumbnailsMap.entries()) {
    const normalizedFilename = normalizeFilename(filename)
    let score = 0

    for (const word of titleWords) {
      if (normalizedFilename.includes(word)) {
        score += word.length
      }
    }

    if (score > bestScore && score > 5) {
      bestScore = score
      bestMatch = keys[0]
    }
  }

  return bestMatch
}

async function main() {
  console.log('🔧 Correction FINALE de tous les thumbnails...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Build S3 map
    const thumbnailsMap = await buildS3ThumbnailMap()

    // Get ALL videos
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail
      FROM videos_new
      WHERE "isPublished" = true
      ORDER BY title
    `)

    console.log(`📋 Traitement de ${result.rows.length} vidéos...\n`)

    let alreadyOk = 0
    let fixed = 0
    let notFound = 0
    let nullThumbnails = 0

    for (const [index, video] of result.rows.entries()) {
      if ((index + 1) % 100 === 0) {
        console.log(`   ⏳ Progression: ${index + 1}/${result.rows.length}`)
      }

      // Skip videos without thumbnail
      if (!video.thumbnail || video.thumbnail.trim() === '') {
        nullThumbnails++
        continue
      }

      // Extract current S3 key
      let currentS3Key
      try {
        const url = new URL(video.thumbnail)
        currentS3Key = decodeURIComponent(url.pathname.substring(1))
      } catch {
        continue
      }

      // Check if current key exists in our map
      const currentFilename = path.basename(currentS3Key).toLowerCase()
      
      if (thumbnailsMap.has(currentFilename) && 
          thumbnailsMap.get(currentFilename).includes(currentS3Key)) {
        // File exists with exact path
        alreadyOk++
        continue
      }

      // File doesn't exist or path is wrong - find best match
      const bestMatchKey = findBestMatch(video.title, thumbnailsMap)

      if (bestMatchKey) {
        const newUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${bestMatchKey}`
        
        // Only update if different
        if (bestMatchKey !== currentS3Key) {
          await pool.query(
            'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
            [newUrl, video.id]
          )
          
          if (fixed < 10) { // Log first 10 changes
            console.log(`✅ "${video.title}"`)
            console.log(`   ${currentS3Key.substring(0, 80)}`)
            console.log(`   → ${bestMatchKey.substring(0, 80)}\n`)
          }
          
          fixed++
        } else {
          alreadyOk++
        }
      } else {
        if (notFound < 10) { // Log first 10 not found
          console.log(`❌ Pas trouvé: "${video.title}"`)
        }
        notFound++
      }
    }

    console.log('\n\n📊 RÉSUMÉ FINAL:')
    console.log(`   ✅ Déjà OK: ${alreadyOk}`)
    console.log(`   ✅ Corrigés: ${fixed}`)
    console.log(`   ⚠️  Sans thumbnail: ${nullThumbnails}`)
    console.log(`   ❌ Non trouvés: ${notFound}`)
    console.log(`   📋 Total: ${result.rows.length}`)
    console.log()
    console.log(`📈 Taux de succès: ${Math.round((alreadyOk + fixed) / result.rows.length * 100)}%`)

    if (notFound > 0) {
      console.log(`\n⚠️  ${notFound} vidéos n'ont pas de thumbnail correspondant dans S3`)
      console.log('💡 Ces vidéos afficheront l\'image de fallback')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
