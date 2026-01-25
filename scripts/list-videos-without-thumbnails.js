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

async function checkS3Exists(s3Key) {
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
  console.log('📋 Liste des vidéos SANS thumbnail valide...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail,
        category,
        region,
        difficulty
      FROM videos_new
      WHERE "isPublished" = true
      ORDER BY title
    `)

    const videosWithoutThumbnail = []

    console.log(`🔍 Vérification de ${result.rows.length} vidéos...\n`)

    for (const video of result.rows) {
      if (!video.thumbnail || video.thumbnail.trim() === '') {
        videosWithoutThumbnail.push({ ...video, reason: 'NULL' })
        continue
      }

      // Check if file exists in S3
      try {
        const url = new URL(video.thumbnail)
        const s3Key = decodeURIComponent(url.pathname.substring(1))
        const exists = await checkS3Exists(s3Key)
        
        if (!exists) {
          videosWithoutThumbnail.push({ ...video, reason: 'NOT_IN_S3', s3Key })
        }
      } catch {
        videosWithoutThumbnail.push({ ...video, reason: 'INVALID_URL' })
      }
    }

    console.log(`\n❌ ${videosWithoutThumbnail.length} vidéos SANS thumbnail valide:\n`)

    // Group by category/region
    const byCategory = {}
    videosWithoutThumbnail.forEach(v => {
      const key = v.region || v.category || 'Non catégorisé'
      if (!byCategory[key]) byCategory[key] = []
      byCategory[key].push(v)
    })

    console.log('📊 Par catégorie:')
    Object.entries(byCategory).forEach(([category, videos]) => {
      console.log(`\n📁 ${category}: ${videos.length} vidéos`)
      videos.forEach((v, i) => {
        console.log(`   ${i + 1}. "${v.title}" (${v.difficulty || 'N/A'})`)
      })
    })

    console.log(`\n\n💡 SOLUTION:`)
    console.log(`   Ces ${videosWithoutThumbnail.length} vidéos auront l'image de fallback`)
    console.log(`   Options:`)
    console.log(`   1. Lambda n'a pas généré leurs thumbnails`)
    console.log(`   2. Les thumbnails ont été supprimés de S3`)
    console.log(`   3. Les noms de fichiers ne correspondent pas`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
