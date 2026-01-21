const { Pool } = require('pg')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const https = require('https')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

async function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode)
    }).on('error', () => {
      resolve(null)
    })
  })
}

async function main() {
  console.log('🔍 Test des URLs signées pour "Jambes et Fessiers"...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get some jambes/fessiers videos
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail,
        "videoUrl"
      FROM videos_new
      WHERE "isPublished" = true 
        AND (
          "muscleGroups"::text ILIKE '%jambes%' 
          OR "muscleGroups"::text ILIKE '%fessiers%'
        )
        AND thumbnail IS NOT NULL
        AND thumbnail != ''
      ORDER BY title
      LIMIT 5
    `)

    console.log(`📋 Test de ${result.rows.length} vidéos...\n`)

    for (const video of result.rows) {
      console.log(`\n🎥 "${video.title}"`)
      console.log(`   URL originale: ${video.thumbnail.substring(0, 80)}...`)

      // Extract S3 key
      let s3Key
      try {
        const urlObj = new URL(video.thumbnail)
        s3Key = decodeURIComponent(urlObj.pathname.substring(1))
      } catch {
        s3Key = video.thumbnail
      }

      console.log(`   S3 Key: ${s3Key}`)

      // Test original URL
      const originalStatus = await testUrl(video.thumbnail)
      console.log(`   Test URL originale: ${originalStatus || 'ERREUR'}`)

      // Generate signed URL
      try {
        const command = new GetObjectCommand({
          Bucket: 'only-you-coaching',
          Key: s3Key
        })

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
        console.log(`   URL signée générée: ${signedUrl.substring(0, 80)}...`)

        // Test signed URL
        const signedStatus = await testUrl(signedUrl)
        console.log(`   Test URL signée: ${signedStatus || 'ERREUR'}`)

        if (signedStatus === 200) {
          console.log('   ✅ URL signée fonctionne!')
        } else {
          console.log(`   ❌ URL signée ne fonctionne pas (status: ${signedStatus})`)
        }
      } catch (error) {
        console.error(`   ❌ Erreur génération URL signée:`, error.message)
      }
    }

    console.log('\n\n📊 Résumé: Les URLs signées devraient fonctionner correctement.')
    console.log('💡 Si les thumbnails ne s\'affichent pas en production, vérifiez:')
    console.log('   1. Les logs de l\'API /api/videos')
    console.log('   2. La console du navigateur (erreurs CORS ou 403)')
    console.log('   3. Que les variables AWS sont bien définies en production')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
