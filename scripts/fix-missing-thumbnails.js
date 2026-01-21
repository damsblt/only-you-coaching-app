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

async function main() {
  console.log('🔧 Recherche et correction des thumbnails manquants...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get videos without thumbnails
    const result = await pool.query(`
      SELECT id, title, "videoUrl", thumbnail
      FROM videos_new
      WHERE "isPublished" = true 
        AND (thumbnail IS NULL OR thumbnail = '')
      ORDER BY title
    `)

    console.log(`📋 ${result.rows.length} vidéos sans thumbnail trouvées\n`)

    for (const video of result.rows) {
      console.log(`\n🎥 "${video.title}"`)
      console.log(`   ID: ${video.id}`)
      console.log(`   VideoURL: ${video.videoUrl}`)

      // Extract video name from title for searching
      const searchName = video.title
        .toLowerCase()
        .replace(/[àáâäæã]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôöœõ]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      console.log(`   Recherche: *${searchName}*`)

      // Search for matching thumbnails in S3
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: 'only-you-coaching',
          Prefix: 'thumbnails/',
          MaxKeys: 1000
        })

        const s3Response = await s3Client.send(listCommand)
        
        if (s3Response.Contents) {
          // Try to find a matching thumbnail
          const matching = s3Response.Contents.filter(obj => {
            const key = obj.Key.toLowerCase()
            // Remove accents from S3 key for comparison
            const normalizedKey = key
              .replace(/[àáâäæã]/g, 'a')
              .replace(/[èéêë]/g, 'e')
              .replace(/[ìíîï]/g, 'i')
              .replace(/[òóôöœõ]/g, 'o')
              .replace(/[ùúûü]/g, 'u')
              .replace(/[ç]/g, 'c')
            
            return normalizedKey.includes(searchName.substring(0, 20))
          })

          if (matching.length > 0) {
            const thumbnailKey = matching[0].Key
            const thumbnailUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/${thumbnailKey}`
            
            console.log(`   ✅ Thumbnail trouvé: ${thumbnailKey}`)
            
            // Update database
            await pool.query(
              'UPDATE videos_new SET thumbnail = $1 WHERE id = $2',
              [thumbnailUrl, video.id]
            )
            
            console.log(`   ✅ Base de données mise à jour`)
          } else {
            console.log(`   ❌ Aucun thumbnail trouvé dans S3`)
            console.log(`   💡 Suggestion: Désactiver cette vidéo ou générer le thumbnail manuellement`)
          }
        }
      } catch (s3Error) {
        console.error(`   ❌ Erreur S3:`, s3Error.message)
      }
    }

    console.log('\n✅ Traitement terminé!\n')
    
    // Re-check stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(thumbnail) as with_thumbnail
      FROM videos_new
      WHERE "isPublished" = true
    `)
    
    const stats = statsResult.rows[0]
    const withoutThumbnail = parseInt(stats.total) - parseInt(stats.with_thumbnail)
    
    console.log('📊 Nouvelles statistiques:')
    console.log(`   Total: ${stats.total}`)
    console.log(`   Avec thumbnail: ${stats.with_thumbnail}`)
    console.log(`   Sans thumbnail: ${withoutThumbnail}`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
