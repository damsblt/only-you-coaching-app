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

function normalizeString(str) {
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
  console.log('🔧 Correction de TOUS les chemins de thumbnails incorrects...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get all thumbnails from S3
    console.log('📥 Récupération de TOUS les thumbnails depuis S3...')
    let allThumbnails = []
    let continuationToken = undefined

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: 'only-you-coaching',
        Prefix: 'thumbnails/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken
      })

      const s3Response = await s3Client.send(listCommand)
      if (s3Response.Contents) {
        allThumbnails = allThumbnails.concat(s3Response.Contents)
      }
      continuationToken = s3Response.NextContinuationToken
    } while (continuationToken)

    console.log(`   ✅ ${allThumbnails.length} thumbnails trouvés\n`)

    // Get all published videos
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail,
        "videoUrl"
      FROM videos_new
      WHERE "isPublished" = true
      ORDER BY title
    `)

    console.log(`📋 Vérification de ${result.rows.length} vidéos...\n`)

    let fixed = 0
    let alreadyOk = 0
    let notFound = 0

    for (const video of result.rows) {
      if (!video.thumbnail || video.thumbnail.trim() === '') {
        continue
      }

      // Extract S3 key
      let s3Key
      try {
        const url = new URL(video.thumbnail)
        try {
          s3Key = decodeURIComponent(url.pathname.substring(1))
        } catch {
          s3Key = url.pathname.substring(1)
        }
      } catch {
        continue
      }

      // Check if file exists
      const exists = await checkS3FileExists(s3Key)
      
      if (exists) {
        alreadyOk++
        if (alreadyOk % 100 === 0) {
          console.log(`   ✅ ${alreadyOk} vidéos vérifiées et OK...`)
        }
        continue
      }

      // File doesn't exist, try to find it
      console.log(`\n🔍 "${video.title}"`)
      console.log(`   ❌ Fichier non trouvé: ${s3Key}`)
      
      // Normalize video title for matching
      const normalizedTitle = normalizeString(video.title)
      
      // Find matching thumbnail
      const matching = allThumbnails.filter(obj => {
        const key = obj.Key.toLowerCase()
        const normalizedKey = normalizeString(key)
        
        // Try various matching strategies
        const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 3)
        const keyWords = normalizedKey.split(/\s+/).filter(w => w.length > 3)
        
        // Check if key contains significant title words
        if (titleWords.length > 0) {
          const matchCount = titleWords.filter(word => normalizedKey.includes(word)).length
          return matchCount >= Math.min(2, titleWords.length)
        }
        
        return normalizedKey.includes(normalizedTitle.substring(0, 15)) ||
               normalizedTitle.substring(0, 15).includes(normalizedKey.substring(0, 15))
      })

      if (matching.length > 0) {
        // Use the first match (or best match if multiple)
        const thumbnailKey = matching[0].Key
        const newThumbnailUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${thumbnailKey}`
        
        console.log(`   ✅ Trouvé: ${thumbnailKey}`)
        console.log(`   📝 Mise à jour...`)
        
        // Update database
        await pool.query(
          'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
          [newThumbnailUrl, video.id]
        )
        
        console.log(`   ✅ Mis à jour`)
        fixed++
      } else {
        console.log(`   ❌ Aucun thumbnail correspondant trouvé`)
        notFound++
      }
    }

    console.log('\n\n📊 RÉSUMÉ FINAL:')
    console.log(`   ✅ Déjà OK: ${alreadyOk}`)
    console.log(`   ✅ Corrigés: ${fixed}`)
    console.log(`   ❌ Non trouvés: ${notFound}`)
    console.log(`   📋 Total traité: ${result.rows.length}`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
