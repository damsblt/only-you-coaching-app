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

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '')
}

async function main() {
  console.log('🔧 Correction des chemins de thumbnails pour "Jambes et Fessiers"...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get all thumbnails from S3 root
    console.log('📥 Récupération de la liste des thumbnails depuis S3...')
    const listCommand = new ListObjectsV2Command({
      Bucket: 'only-you-coaching',
      Prefix: 'thumbnails/',
      MaxKeys: 2000
    })

    const s3Response = await s3Client.send(listCommand)
    const allThumbnails = s3Response.Contents || []
    console.log(`   ✅ ${allThumbnails.length} thumbnails trouvés\n`)

    // Get jambes/fessiers videos with incorrect paths
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
        AND thumbnail LIKE '%Video/groupes-musculaires%'
      ORDER BY title
    `)

    console.log(`📋 ${result.rows.length} vidéos avec chemins incorrects à corriger\n`)

    let fixed = 0
    let notFound = 0

    for (const video of result.rows) {
      console.log(`\n🎥 "${video.title}"`)
      
      // Normalize video title for matching
      const normalizedTitle = normalizeString(video.title)
      
      // Find matching thumbnail
      const matching = allThumbnails.filter(obj => {
        const key = obj.Key.toLowerCase()
        const normalizedKey = normalizeString(key)
        
        // Try to match by normalized title
        return normalizedKey.includes(normalizedTitle.substring(0, 15)) ||
               normalizedTitle.substring(0, 15).includes(normalizedKey.substring(0, 15))
      })

      if (matching.length > 0) {
        // Use the first match
        const thumbnailKey = matching[0].Key
        const newThumbnailUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${thumbnailKey}`
        
        console.log(`   ✅ Trouvé: ${thumbnailKey}`)
        console.log(`   Ancienne URL: ${video.thumbnail.substring(0, 80)}...`)
        console.log(`   Nouvelle URL: ${newThumbnailUrl.substring(0, 80)}...`)
        
        // Update database
        await pool.query(
          'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
          [newThumbnailUrl, video.id]
        )
        
        console.log(`   ✅ Base de données mise à jour`)
        fixed++
      } else {
        console.log(`   ❌ Aucun thumbnail correspondant trouvé`)
        notFound++
      }
    }

    console.log('\n\n📊 Résumé:')
    console.log(`   Corrigés: ${fixed}`)
    console.log(`   Non trouvés: ${notFound}`)
    console.log(`   Total traité: ${result.rows.length}`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
