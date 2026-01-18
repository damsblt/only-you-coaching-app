/**
 * Script pour générer les thumbnails manquants en batch
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

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

function getThumbnailKey(videoUrl) {
  try {
    const url = new URL(videoUrl)
    const videoPath = decodeURIComponent(url.pathname).substring(1)
    const pathWithoutExt = videoPath.replace(/\.[^/.]+$/, '')
    return `${pathWithoutExt}.jpg`
  } catch (error) {
    return null
  }
}

function getThumbnailUrl(thumbnailKey) {
  return `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(thumbnailKey).replace(/%2F/g, '/')}`
}

async function checkIfThumbnailExists(thumbnailUrl) {
  try {
    const response = await fetch(thumbnailUrl, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

async function generateThumbnailForVideo(video) {
  try {
    const thumbnailKey = getThumbnailKey(video.videoUrl)
    if (!thumbnailKey) {
      return { success: false, error: 'Invalid video URL' }
    }
    
    const thumbnailUrl = getThumbnailUrl(thumbnailKey)
    
    // Vérifier si le thumbnail existe déjà sur S3
    const exists = await checkIfThumbnailExists(thumbnailUrl)
    
    if (exists) {
      // Le thumbnail existe sur S3, juste mettre à jour la DB
      await sql`
        UPDATE videos_new
        SET thumbnail = ${thumbnailUrl}, "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      return { success: true, message: 'Thumbnail trouvé sur S3' }
    } else {
      // Le thumbnail n'existe pas sur S3
      // On pourrait le générer ici, mais pour l'instant on va juste marquer comme manquant
      return { success: false, error: 'Thumbnail non trouvé sur S3' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('\n🎬 Recherche et mise à jour des thumbnails...\n')
  
  // Récupérer toutes les vidéos sans thumbnail
  const videosWithoutThumbnail = await sql`
    SELECT id, title, region, "videoUrl"
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    AND (thumbnail IS NULL OR thumbnail = '')
    ORDER BY region, exo_title, title
  `
  
  console.log(`📹 ${videosWithoutThumbnail.length} vidéos sans thumbnail\n`)
  
  if (videosWithoutThumbnail.length === 0) {
    console.log('✅ Tous les thumbnails sont déjà configurés!\n')
    return
  }
  
  let foundCount = 0
  let notFoundCount = 0
  let errorCount = 0
  let currentRegion = ''
  
  for (let i = 0; i < videosWithoutThumbnail.length; i++) {
    const video = videosWithoutThumbnail[i]
    
    if (video.region !== currentRegion) {
      currentRegion = video.region
      console.log(`\n📦 Région: ${currentRegion}`)
    }
    
    const result = await generateThumbnailForVideo(video)
    
    if (result.success) {
      console.log(`✅ [${i + 1}/${videosWithoutThumbnail.length}] ${video.title} - ${result.message}`)
      foundCount++
    } else if (result.error === 'Thumbnail non trouvé sur S3') {
      if (notFoundCount < 10) {
        console.log(`⚠️  [${i + 1}/${videosWithoutThumbnail.length}] ${video.title} - Thumbnail manquant`)
      } else if (notFoundCount === 10) {
        console.log('   ... (autres thumbnails manquants)')
      }
      notFoundCount++
    } else {
      console.log(`❌ [${i + 1}/${videosWithoutThumbnail.length}] ${video.title} - ${result.error}`)
      errorCount++
    }
    
    // Attendre 100ms entre chaque vérification
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Thumbnails trouvés sur S3: ${foundCount}`)
  console.log(`⚠️  Thumbnails manquants sur S3: ${notFoundCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`${'='.repeat(60)}\n`)
  
  if (notFoundCount > 0) {
    console.log('💡 Les thumbnails manquants devront être générés manuellement')
    console.log('   ou via l\'interface d\'administration.\n')
  }
  
  console.log('✅ Vérification terminée!\n')
}

main()
