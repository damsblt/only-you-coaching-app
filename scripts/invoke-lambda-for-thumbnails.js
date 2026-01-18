/**
 * Script pour invoquer la Lambda AWS pour générer les thumbnails des vidéos existantes
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

const databaseUrl = process.env.DATABASE_URL
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const awsRegion = process.env.AWS_REGION || 'eu-west-3'

if (!databaseUrl || !awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const sql = neon(databaseUrl)
const lambdaClient = new LambdaClient({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
})

const LAMBDA_FUNCTION_NAME = 'only-you-coaching-thumbnail-generator'
const BATCH_SIZE = 10 // Process 10 videos at a time to avoid overwhelming Lambda

/**
 * Extract S3 key from video URL
 */
function extractS3Key(videoUrl) {
  try {
    const url = new URL(videoUrl)
    // URL format: https://bucket.s3.region.amazonaws.com/path/to/video.mp4
    return decodeURIComponent(url.pathname.substring(1))
  } catch (error) {
    return null
  }
}

/**
 * Create S3 event payload for Lambda
 */
function createS3EventPayload(s3Key, bucketName = 'only-you-coaching') {
  return {
    Records: [
      {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        eventName: 'ObjectCreated:Put',
        s3: {
          bucket: {
            name: bucketName
          },
          object: {
            key: s3Key
          }
        }
      }
    ]
  }
}

/**
 * Invoke Lambda for a single video
 */
async function invokeLambdaForVideo(video) {
  try {
    const s3Key = extractS3Key(video.videoUrl)
    if (!s3Key) {
      return { success: false, error: 'Invalid video URL' }
    }
    
    const payload = createS3EventPayload(s3Key)
    
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      InvocationType: 'RequestResponse', // Wait for response
      Payload: JSON.stringify(payload)
    })
    
    const response = await lambdaClient.send(command)
    
    // Check response
    if (response.StatusCode === 200) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload))
      if (result.statusCode === 200) {
        return { success: true }
      } else {
        return { success: false, error: result.body || 'Lambda returned error' }
      }
    } else {
      return { success: false, error: `Lambda status code: ${response.StatusCode}` }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('\n🚀 Génération des thumbnails via Lambda AWS...\n')
  
  // Récupérer toutes les vidéos sans thumbnail dans groupes-musculaires
  const videosWithoutThumbnail = await sql`
    SELECT id, title, region, "videoUrl"
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    AND (thumbnail IS NULL OR thumbnail = '')
    AND "videoUrl" LIKE '%groupes-musculaires%'
    ORDER BY region, exo_title, title
  `
  
  console.log(`📹 ${videosWithoutThumbnail.length} vidéos sans thumbnail à traiter\n`)
  
  if (videosWithoutThumbnail.length === 0) {
    console.log('✅ Tous les thumbnails sont déjà générés!\n')
    return
  }
  
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let currentRegion = ''
  
  // Process in batches to avoid overwhelming Lambda
  for (let i = 0; i < videosWithoutThumbnail.length; i++) {
    const video = videosWithoutThumbnail[i]
    
    if (video.region !== currentRegion) {
      currentRegion = video.region
      console.log(`\n📦 Région: ${currentRegion}`)
    }
    
    const result = await invokeLambdaForVideo(video)
    
    if (result.success) {
      console.log(`✅ [${i + 1}/${videosWithoutThumbnail.length}] ${video.title}`)
      successCount++
    } else {
      console.log(`❌ [${i + 1}/${videosWithoutThumbnail.length}] ${video.title}`)
      console.log(`   Erreur: ${result.error}`)
      errorCount++
    }
    
    // Wait 2 seconds between each Lambda invocation to avoid throttling
    // Lambda has 300s timeout so it should complete in time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Progress indicator every 10 videos
    if ((i + 1) % 10 === 0) {
      console.log(`\n   📊 Progrès: ${i + 1}/${videosWithoutThumbnail.length} (${successCount} ✅ | ${errorCount} ❌)\n`)
    }
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ FINAL')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Thumbnails générés: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`⏭️  Ignorés: ${skippedCount}`)
  console.log(`${'='.repeat(60)}\n`)
  
  if (successCount > 0) {
    console.log('✅ Génération terminée avec succès!\n')
    console.log('💡 Vérifiez les thumbnails sur S3 : s3://only-you-coaching/thumbnails/Video/groupes-musculaires/\n')
  } else {
    console.log('⚠️  Aucun thumbnail généré. Vérifiez les erreurs ci-dessus.\n')
  }
}

main()
