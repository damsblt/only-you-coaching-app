const { Pool } = require('pg')
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

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

async function main() {
  console.log('🔍 Diagnostic COMPLET de tous les thumbnails...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get all published videos
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail,
        "videoUrl",
        category,
        "muscleGroups"
      FROM videos_new
      WHERE "isPublished" = true
      ORDER BY title
    `)

    const total = result.rows.length
    let nullThumbnails = 0
    let emptyThumbnails = 0
    let invalidUrls = 0
    let fileNotFound = 0
    let validThumbnails = 0
    const problematicVideos = []

    console.log(`📊 Analyse de ${total} vidéos...\n`)

    for (const video of result.rows) {
      let status = 'ok'
      let reason = ''

      if (!video.thumbnail) {
        nullThumbnails++
        status = 'problem'
        reason = 'NULL'
        problematicVideos.push({ ...video, reason })
      } else if (video.thumbnail.trim() === '') {
        emptyThumbnails++
        status = 'problem'
        reason = 'EMPTY'
        problematicVideos.push({ ...video, reason })
      } else {
        // Extract S3 key and check if file exists
        try {
          const url = new URL(video.thumbnail)
          let s3Key
          try {
            s3Key = decodeURIComponent(url.pathname.substring(1))
          } catch {
            s3Key = url.pathname.substring(1)
          }

          // Check if file exists in S3
          const exists = await checkS3FileExists(s3Key)
          if (!exists) {
            fileNotFound++
            status = 'problem'
            reason = 'FILE_NOT_FOUND'
            problematicVideos.push({ ...video, reason, s3Key })
          } else {
            validThumbnails++
          }
        } catch (urlError) {
          invalidUrls++
          status = 'problem'
          reason = 'INVALID_URL'
          problematicVideos.push({ ...video, reason })
        }
      }
    }

    console.log('📊 STATISTIQUES GLOBALES:')
    console.log(`   Total vidéos: ${total}`)
    console.log(`   ✅ Thumbnails valides: ${validThumbnails}`)
    console.log(`   ❌ Thumbnails problématiques: ${total - validThumbnails}`)
    console.log()
    console.log('   Détail des problèmes:')
    console.log(`   - NULL: ${nullThumbnails}`)
    console.log(`   - Vide (empty): ${emptyThumbnails}`)
    console.log(`   - URL invalide: ${invalidUrls}`)
    console.log(`   - Fichier non trouvé dans S3: ${fileNotFound}`)
    console.log()

    if (problematicVideos.length > 0) {
      console.log(`\n❌ ${problematicVideos.length} VIDÉOS PROBLÉMATIQUES:\n`)
      
      // Group by reason
      const byReason = {}
      problematicVideos.forEach(v => {
        if (!byReason[v.reason]) byReason[v.reason] = []
        byReason[v.reason].push(v)
      })

      for (const [reason, videos] of Object.entries(byReason)) {
        console.log(`\n📋 ${reason} (${videos.length} vidéos):`)
        videos.slice(0, 10).forEach((v, i) => {
          console.log(`   ${i + 1}. "${v.title}"`)
          if (v.s3Key) console.log(`      S3 Key: ${v.s3Key}`)
          if (v.thumbnail) console.log(`      URL: ${v.thumbnail.substring(0, 80)}...`)
        })
        if (videos.length > 10) {
          console.log(`   ... et ${videos.length - 10} autres`)
        }
      }
    } else {
      console.log('✅ Tous les thumbnails sont valides!')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
