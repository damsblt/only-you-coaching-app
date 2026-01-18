/**
 * Script pour synchroniser les thumbnails depuis S3 vers Neon
 * Vérifie tous les thumbnails générés sur S3 et met à jour la base de données
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')

const databaseUrl = process.env.DATABASE_URL
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const awsRegion = process.env.AWS_REGION || 'eu-west-3'
const s3BucketName = process.env.S3_BUCKET_NAME || 'only-you-coaching'

if (!databaseUrl || !awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const sql = neon(databaseUrl)
const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
})

/**
 * Extract video S3 key from thumbnail key
 * thumbnails/Video/groupes-musculaires/dos/1. Tirage...-thumb.jpg
 * -> Video/groupes-musculaires/dos/1. Tirage....mp4
 */
function getVideoKeyFromThumbnail(thumbnailKey) {
  // Remove thumbnails/ prefix
  let videoKey = thumbnailKey.replace(/^thumbnails\//, '')
  
  // Remove -thumb.jpg suffix and add .mp4
  videoKey = videoKey.replace(/-thumb\.jpg$/i, '.mp4')
  
  return videoKey
}

/**
 * Build S3 URL
 */
function buildS3Url(key) {
  return `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`
}

/**
 * Find video in database by S3 key
 */
async function findVideoByS3Key(s3Key) {
  try {
    const searchPattern = `%${s3Key}%`
    const result = await sql`
      SELECT id, title, thumbnail, "videoUrl"
      FROM videos_new
      WHERE "videoUrl" LIKE ${searchPattern}
      LIMIT 1
    `
    return result && result.length > 0 ? result[0] : null
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    return null
  }
}

async function syncThumbnailsForRegion(region) {
  console.log(`\n📦 Synchronisation: ${region}`)
  console.log('─'.repeat(60))
  
  const thumbnailPrefix = `thumbnails/Video/groupes-musculaires/${region}/`
  
  try {
    // Lister tous les thumbnails de cette région
    const command = new ListObjectsV2Command({
      Bucket: s3BucketName,
      Prefix: thumbnailPrefix,
    })
    
    const response = await s3Client.send(command)
    const thumbnails = (response.Contents || []).filter(obj => {
      const key = obj.Key || ''
      return key.match(/\.jpg$/i)
    })
    
    console.log(`   📹 ${thumbnails.length} thumbnails trouvés sur S3`)
    
    let updatedCount = 0
    let alreadySetCount = 0
    let notFoundCount = 0
    
    for (const thumbnailObj of thumbnails) {
      const thumbnailKey = thumbnailObj.Key || ''
      const thumbnailUrl = buildS3Url(thumbnailKey)
      
      // Extraire la clé vidéo correspondante
      const videoKey = getVideoKeyFromThumbnail(thumbnailKey)
      
      // Trouver la vidéo dans la base
      const video = await findVideoByS3Key(videoKey)
      
      if (!video) {
        console.log(`   ⚠️  Vidéo non trouvée: ${videoKey}`)
        notFoundCount++
        continue
      }
      
      // Vérifier si le thumbnail est déjà défini
      if (video.thumbnail && video.thumbnail === thumbnailUrl) {
        alreadySetCount++
        continue
      }
      
      // Mettre à jour le thumbnail
      await sql`
        UPDATE videos_new
        SET thumbnail = ${thumbnailUrl}, "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      
      console.log(`   ✅ ${video.title}`)
      updatedCount++
    }
    
    console.log(`\n   📊 Résumé ${region}:`)
    console.log(`      ✅ Mis à jour: ${updatedCount}`)
    console.log(`      ⏭️  Déjà défini: ${alreadySetCount}`)
    console.log(`      ⚠️  Vidéo non trouvée: ${notFoundCount}`)
    
    return { updatedCount, alreadySetCount, notFoundCount, region }
    
  } catch (error) {
    console.error(`   ❌ Erreur pour ${region}:`, error.message)
    return { updatedCount: 0, alreadySetCount: 0, notFoundCount: 0, region, error: error.message }
  }
}

async function main() {
  console.log('\n🔄 Synchronisation des thumbnails depuis S3 vers Neon...\n')
  console.log(`⏰ ${new Date().toLocaleString()}\n`)
  
  const regions = ['dos', 'pectoraux', 'abdos', 'biceps', 'triceps', 'epaules', 'streching', 'cardio', 'bande']
  
  const results = []
  
  for (const region of regions) {
    const result = await syncThumbnailsForRegion(region)
    results.push(result)
    
    // Petite pause entre les régions
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Résumé global
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ GLOBAL')
  console.log(`${'='.repeat(60)}\n`)
  
  let totalUpdated = 0
  let totalAlreadySet = 0
  let totalNotFound = 0
  
  results.forEach(r => {
    console.log(`${r.region.padEnd(15)} - ✅ ${r.updatedCount} mis à jour | ⏭️  ${r.alreadySetCount} déjà défini | ⚠️  ${r.notFoundCount} non trouvés`)
    totalUpdated += r.updatedCount
    totalAlreadySet += r.alreadySetCount
    totalNotFound += r.notFoundCount
  })
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TOTAL: ${totalUpdated} thumbnails mis à jour`)
  console.log(`       ${totalAlreadySet} déjà définis`)
  console.log(`       ${totalNotFound} vidéos non trouvées`)
  console.log(`${'='.repeat(60)}\n`)
  
  // Vérification finale
  const finalStats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN thumbnail IS NOT NULL AND thumbnail != '' THEN 1 END) as with_thumbnail
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    AND "videoUrl" LIKE '%groupes-musculaires%'
  `
  
  const percentage = ((finalStats[0].with_thumbnail / finalStats[0].total) * 100).toFixed(1)
  
  console.log('📊 ÉTAT FINAL:')
  console.log(`   ${finalStats[0].with_thumbnail}/${finalStats[0].total} vidéos avec thumbnail (${percentage}%)`)
  console.log('')
  
  console.log('✅ Synchronisation terminée!\n')
}

main()
