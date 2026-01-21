const { Pool } = require('pg')
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const os = require('os')

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const execAsync = promisify(exec)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

function extractS3Key(url) {
  try {
    const urlObj = new URL(url)
    return decodeURIComponent(urlObj.pathname.substring(1))
  } catch {
    return null
  }
}

async function streamToBuffer(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function generateThumbnail(videoId, videoUrl, videoTitle) {
  const s3Key = extractS3Key(videoUrl)
  if (!s3Key) {
    console.log('   ❌ URL invalide')
    return null
  }

  console.log(`   📥 Téléchargement: ${s3Key}`)

  // Create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thumbnail-'))
  const videoPath = path.join(tempDir, 'video.mp4')
  const thumbnailPath = path.join(tempDir, 'thumbnail.jpg')

  try {
    // Download video from S3
    const getCommand = new GetObjectCommand({
      Bucket: 'only-you-coaching',
      Key: s3Key
    })
    
    const response = await s3Client.send(getCommand)
    const videoBuffer = await streamToBuffer(response.Body)
    fs.writeFileSync(videoPath, videoBuffer)
    
    console.log(`   ✅ Téléchargé (${Math.round(videoBuffer.length / 1024 / 1024)}MB)`)

    // Generate thumbnail with ffmpeg
    console.log('   🎬 Génération du thumbnail...')
    await execAsync(`ffmpeg -i "${videoPath}" -ss 5 -vframes 1 -q:v 2 "${thumbnailPath}" -y 2>&1`)
    
    if (!fs.existsSync(thumbnailPath)) {
      console.log('   ❌ Échec de génération')
      return null
    }

    console.log('   ✅ Thumbnail généré')

    // Generate thumbnail key based on video key
    const videoBasename = path.basename(s3Key, path.extname(s3Key))
    const thumbnailKey = `thumbnails/${videoBasename}-thumb.jpg`

    console.log(`   📤 Upload vers S3: ${thumbnailKey}`)

    // Upload to S3
    const thumbnailBuffer = fs.readFileSync(thumbnailPath)
    const putCommand = new PutObjectCommand({
      Bucket: 'only-you-coaching',
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000'
    })

    await s3Client.send(putCommand)
    console.log('   ✅ Uploadé sur S3')

    const thumbnailUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${thumbnailKey}`
    return thumbnailUrl

  } catch (error) {
    console.error('   ❌ Erreur:', error.message)
    return null
  } finally {
    // Cleanup
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
      fs.rmdirSync(tempDir)
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  console.log('🎬 Génération des thumbnails manquants...\n')

  // Check if ffmpeg is available
  try {
    await execAsync('ffmpeg -version')
    console.log('✅ ffmpeg disponible\n')
  } catch {
    console.error('❌ ffmpeg n\'est pas installé. Installez-le avec: brew install ffmpeg')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get videos without thumbnails
    const result = await pool.query(`
      SELECT id, title, "videoUrl"
      FROM videos_new
      WHERE "isPublished" = true 
        AND (thumbnail IS NULL OR thumbnail = '')
      ORDER BY title
    `)

    console.log(`📋 ${result.rows.length} vidéos sans thumbnail\n`)

    for (const video of result.rows) {
      console.log(`\n🎥 "${video.title}"`)
      
      const thumbnailUrl = await generateThumbnail(video.id, video.videoUrl, video.title)
      
      if (thumbnailUrl) {
        // Update database
        await pool.query(
          'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
          [thumbnailUrl, video.id]
        )
        console.log(`   ✅ Base de données mise à jour`)
      }
    }

    console.log('\n\n✅ Traitement terminé!\n')

    // Final stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(thumbnail) as with_thumbnail
      FROM videos_new
      WHERE "isPublished" = true
    `)
    
    const stats = statsResult.rows[0]
    console.log('📊 Statistiques finales:')
    console.log(`   Total: ${stats.total}`)
    console.log(`   Avec thumbnail: ${stats.with_thumbnail}`)
    console.log(`   Sans thumbnail: ${parseInt(stats.total) - parseInt(stats.with_thumbnail)}`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
