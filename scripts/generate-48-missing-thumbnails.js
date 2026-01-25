const { Pool } = require('pg')
const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { createWriteStream, createReadStream, unlinkSync, existsSync } = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')
const path = require('path')
const { pipeline } = require('stream/promises')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const execPromise = promisify(exec)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

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

async function downloadFromS3(s3Key, localPath) {
  const command = new GetObjectCommand({
    Bucket: 'only-you-coaching',
    Key: s3Key
  })
  
  const response = await s3Client.send(command)
  await pipeline(response.Body, createWriteStream(localPath))
}

async function uploadToS3(localPath, s3Key) {
  const fileStream = createReadStream(localPath)
  
  await s3Client.send(new PutObjectCommand({
    Bucket: 'only-you-coaching',
    Key: s3Key,
    Body: fileStream,
    ContentType: 'image/jpeg'
  }))
}

async function generateThumbnail(videoPath, thumbnailPath) {
  // Generate thumbnail at 2 seconds
  const command = `ffmpeg -i "${videoPath}" -ss 00:00:02 -vframes 1 -vf "scale=640:-1" -y "${thumbnailPath}"`
  await execPromise(command)
}

async function main() {
  console.log('🎬 Génération des 48 thumbnails manquants...\n')

  // Check if ffmpeg is available
  try {
    await execPromise('ffmpeg -version')
  } catch {
    console.error('❌ ffmpeg n\'est pas installé!')
    console.error('💡 Installez-le avec: brew install ffmpeg')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get videos with broken thumbnail paths
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail,
        "videoUrl"
      FROM videos_new
      WHERE "isPublished" = true
        AND thumbnail IS NOT NULL
        AND thumbnail != ''
        AND thumbnail LIKE '%Video/groupes-musculaires%'
      ORDER BY title
    `)

    console.log(`📋 Vérification de ${result.rows.length} vidéos...\n`)

    const videosNeedingThumbnails = []

    // Find videos that still don't have valid thumbnails
    for (const video of result.rows) {
      let s3Key
      try {
        const url = new URL(video.thumbnail)
        s3Key = decodeURIComponent(url.pathname.substring(1))
      } catch {
        continue
      }

      const exists = await checkS3FileExists(s3Key)
      if (!exists && video.videoUrl) {
        videosNeedingThumbnails.push(video)
      }
    }

    console.log(`🎯 ${videosNeedingThumbnails.length} vidéos nécessitent un thumbnail\n`)

    let generated = 0
    let failed = 0

    for (const [index, video] of videosNeedingThumbnails.entries()) {
      console.log(`\n[${index + 1}/${videosNeedingThumbnails.length}] "${video.title}"`)

      try {
        // Extract video S3 key
        let videoS3Key
        try {
          const videoUrl = new URL(video.videoUrl)
          videoS3Key = decodeURIComponent(videoUrl.pathname.substring(1))
        } catch {
          videoS3Key = video.videoUrl
        }

        console.log(`   📥 Téléchargement de la vidéo...`)
        const tempVideoPath = path.join(__dirname, `temp-video-${Date.now()}.mp4`)
        await downloadFromS3(videoS3Key, tempVideoPath)

        console.log(`   🎨 Génération du thumbnail...`)
        const tempThumbnailPath = path.join(__dirname, `temp-thumb-${Date.now()}.jpg`)
        await generateThumbnail(tempVideoPath, tempThumbnailPath)

        // Create thumbnail S3 key (simple filename at root)
        const thumbnailFilename = video.title
          .replace(/[^a-z0-9]/gi, '-')
          .replace(/-+/g, '-')
          .toLowerCase() + '-thumb.jpg'
        const thumbnailS3Key = `thumbnails/${thumbnailFilename}`

        console.log(`   📤 Upload vers S3: ${thumbnailS3Key}`)
        await uploadToS3(tempThumbnailPath, thumbnailS3Key)

        // Update database
        const newThumbnailUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${thumbnailS3Key}`
        await pool.query(
          'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
          [newThumbnailUrl, video.id]
        )

        console.log(`   ✅ Thumbnail généré et mis à jour`)
        generated++

        // Cleanup
        if (existsSync(tempVideoPath)) unlinkSync(tempVideoPath)
        if (existsSync(tempThumbnailPath)) unlinkSync(tempThumbnailPath)

      } catch (error) {
        console.error(`   ❌ Erreur:`, error.message)
        failed++
      }
    }

    console.log('\n\n📊 RÉSUMÉ:')
    console.log(`   ✅ Générés: ${generated}`)
    console.log(`   ❌ Échecs: ${failed}`)
    console.log(`   📋 Total: ${videosNeedingThumbnails.length}`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
