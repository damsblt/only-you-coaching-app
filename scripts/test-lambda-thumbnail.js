/**
 * Script pour tester que la Lambda génère bien les thumbnails
 * 
 * Usage: node scripts/test-lambda-thumbnail.js
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')

const databaseUrl = process.env.DATABASE_URL
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const region = process.env.AWS_REGION || 'eu-north-1'

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)
const s3Client = new S3Client({ region })

async function testLambdaThumbnail() {
  console.log('🧪 Test de la génération de thumbnails par Lambda...\n')
  
  try {
    // 1. Trouver des vidéos sans thumbnail dans Neon
    console.log('📋 1. Recherche de vidéos sans thumbnail...')
    const videosWithoutThumbnail = await sql.query(`
      SELECT id, title, "videoUrl", thumbnail
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
        AND (thumbnail IS NULL OR thumbnail = '')
        AND "isPublished" = true
      LIMIT 10
    `)
    
    const rows = videosWithoutThumbnail.rows || videosWithoutThumbnail
    console.log(`   ✅ ${rows.length} vidéo(s) sans thumbnail trouvée(s)\n`)
    
    if (rows.length === 0) {
      console.log('✅ Toutes les vidéos ont un thumbnail!')
      return
    }
    
    // 2. Vérifier si les vidéos existent dans S3
    console.log('📋 2. Vérification de l\'existence dans S3...')
    for (const video of rows) {
      try {
        const videoUrl = new URL(video.videoUrl)
        const s3Key = videoUrl.pathname.substring(1) // Remove leading slash
        
        // Check if video exists in S3
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: s3Key,
          MaxKeys: 1
        })
        
        const response = await s3Client.send(listCommand)
        const exists = response.Contents && response.Contents.length > 0
        
        console.log(`   ${exists ? '✅' : '❌'} ${video.title}`)
        console.log(`      S3 Key: ${s3Key}`)
        console.log(`      Existe dans S3: ${exists ? 'Oui' : 'Non'}`)
        console.log(`      Thumbnail: ${video.thumbnail || 'Aucun'}\n`)
      } catch (error) {
        console.error(`   ❌ Erreur pour ${video.title}:`, error.message)
      }
    }
    
    // 3. Vérifier les thumbnails dans S3
    console.log('📋 3. Vérification des thumbnails dans S3...')
    const thumbnailPrefix = 'thumbnails/Video/programmes-predefinis/'
    const listThumbnailsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: thumbnailPrefix,
      MaxKeys: 100
    })
    
    const thumbnailsResponse = await s3Client.send(listThumbnailsCommand)
    const thumbnails = thumbnailsResponse.Contents || []
    console.log(`   ✅ ${thumbnails.length} thumbnail(s) trouvé(s) dans S3\n`)
    
    // 4. Vérifier que les thumbnails sont bien liés dans Neon
    console.log('📋 4. Vérification des thumbnails dans Neon...')
    const videosWithThumbnail = await sql.query(`
      SELECT id, title, thumbnail
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
        AND thumbnail IS NOT NULL
        AND thumbnail != ''
        AND "isPublished" = true
      LIMIT 10
    `)
    
    const videosWithThumbnailRows = videosWithThumbnail.rows || videosWithThumbnail
    console.log(`   ✅ ${videosWithThumbnailRows.length} vidéo(s) avec thumbnail dans Neon\n`)
    
    // 5. Résumé
    console.log('📊 Résumé:\n')
    console.log(`   Vidéos sans thumbnail: ${rows.length}`)
    console.log(`   Thumbnails dans S3: ${thumbnails.length}`)
    console.log(`   Vidéos avec thumbnail dans Neon: ${videosWithThumbnailRows.length}\n`)
    
    // 6. Recommandations
    if (rows.length > 0) {
      console.log('💡 Recommandations:\n')
      console.log('   1. Vérifiez que la Lambda est bien configurée avec:')
      console.log('      - DATABASE_URL (variable d\'environnement)')
      console.log('      - S3_BUCKET_NAME (variable d\'environnement)')
      console.log('      - Lambda layer avec ffmpeg\n')
      console.log('   2. Vérifiez les logs Lambda:')
      console.log('      aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --follow\n')
      console.log('   3. Pour déclencher manuellement la Lambda, uploader une vidéo:')
      console.log('      aws s3 cp test-video.mp4 s3://only-you-coaching/Video/programmes-predefinis/machine/test.mp4\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

testLambdaThumbnail()
















