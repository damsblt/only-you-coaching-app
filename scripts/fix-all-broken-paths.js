const { Pool } = require('pg')
const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

function normalizeForMatch(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '')
}

async function checkS3FileExists(s3Key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: 'only-you-coaching',
      Key: s3Key
    }))
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('🔧 Correction massive des chemins de thumbnails...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Step 1: Get ALL thumbnails from S3 root
    console.log('📥 Chargement de tous les thumbnails depuis S3...')
    const listCommand = new ListObjectsV2Command({
      Bucket: 'only-you-coaching',
      Prefix: 'thumbnails/',
      MaxKeys: 2000
    })

    const s3Response = await s3Client.send(listCommand)
    const allThumbnails = (s3Response.Contents || [])
      .filter(obj => obj.Key.endsWith('-thumb.jpg') || obj.Key.endsWith('-thumb.jpeg') || obj.Key.endsWith('-thumb.png'))
    
    console.log(`   ✅ ${allThumbnails.length} thumbnails trouvés dans S3\n`)

    // Create a searchable map by normalized filename
    const thumbnailMap = new Map()
    allThumbnails.forEach(obj => {
      const filename = path.basename(obj.Key)
      const normalized = normalizeForMatch(filename)
      if (!thumbnailMap.has(normalized)) {
        thumbnailMap.set(normalized, [])
      }
      thumbnailMap.get(normalized).push(obj.Key)
    })

    // Step 2: Find all videos with broken thumbnail paths
    console.log('🔍 Recherche des vidéos avec chemins cassés...')
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail
      FROM videos_new
      WHERE "isPublished" = true
        AND thumbnail IS NOT NULL
        AND thumbnail != ''
        AND thumbnail LIKE '%Video/groupes-musculaires%'
      ORDER BY title
    `)

    console.log(`   📋 ${result.rows.length} vidéos avec chemins potentiellement cassés\n`)

    let fixed = 0
    let notFound = 0
    let alreadyOk = 0

    for (const video of result.rows) {
      // Extract current S3 key
      let currentS3Key
      try {
        const url = new URL(video.thumbnail)
        currentS3Key = decodeURIComponent(url.pathname.substring(1))
      } catch {
        continue
      }

      // Check if current file exists
      const exists = await checkS3FileExists(currentS3Key)
      if (exists) {
        alreadyOk++
        continue
      }

      // File doesn't exist, try to find it
      const currentFilename = path.basename(currentS3Key)
      const normalizedFilename = normalizeForMatch(currentFilename)

      // Try exact match first
      if (thumbnailMap.has(normalizedFilename)) {
        const matches = thumbnailMap.get(normalizedFilename)
        const newS3Key = matches[0] // Use first match
        const newUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${newS3Key}`

        console.log(`✅ "${video.title}"`)
        console.log(`   Ancien: ${currentS3Key}`)
        console.log(`   Nouveau: ${newS3Key}`)

        await pool.query(
          'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
          [newUrl, video.id]
        )

        fixed++
        continue
      }

      // Try fuzzy match by title
      const normalizedTitle = normalizeForMatch(video.title)
      let bestMatch = null
      let bestScore = 0

      for (const [normalizedKey, s3Keys] of thumbnailMap.entries()) {
        // Calculate similarity score
        let score = 0
        const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2)
        
        for (const word of titleWords) {
          if (normalizedKey.includes(word)) {
            score += word.length
          }
        }

        if (score > bestScore && score > 5) { // Minimum threshold
          bestScore = score
          bestMatch = s3Keys[0]
        }
      }

      if (bestMatch) {
        const newUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${bestMatch}`

        console.log(`🔄 "${video.title}"`)
        console.log(`   Ancien: ${currentS3Key}`)
        console.log(`   Nouveau: ${bestMatch}`)

        await pool.query(
          'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
          [newUrl, video.id]
        )

        fixed++
      } else {
        console.log(`❌ Pas trouvé: "${video.title}" (${currentFilename})`)
        notFound++
      }
    }

    console.log('\n\n📊 RÉSUMÉ:')
    console.log(`   ✅ Déjà OK: ${alreadyOk}`)
    console.log(`   ✅ Corrigés: ${fixed}`)
    console.log(`   ❌ Non trouvés: ${notFound}`)
    console.log(`   📋 Total: ${result.rows.length}`)

    if (notFound > 0) {
      console.log('\n💡 Pour les vidéos non trouvées, il faudra:')
      console.log('   1. Soit générer les thumbnails avec ffmpeg')
      console.log('   2. Soit les uploader manuellement dans S3')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
