#!/usr/bin/env node
/**
 * Script pour invoquer la Lambda manuellement pour toutes les vidéos existantes
 * dans s3://only-you-coaching/Video/groupes-musculaires/
 * 
 * Cela déclenchera la génération des thumbnails pour toutes les vidéos
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const LAMBDA_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME || 'only-you-coaching-thumbnail-generator'

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

if (!hasAwsCredentials) {
  console.error('❌ AWS credentials not configured')
  console.error('   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local')
  process.exit(1)
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const lambdaClient = new LambdaClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * Créer un événement S3 simulé pour la Lambda
 */
function createS3Event(videoKey, bucketName = BUCKET_NAME) {
  // Encoder la clé comme S3 le ferait
  const encodedKey = encodeURIComponent(videoKey).replace(/%2F/g, '/')
  
  return {
    Records: [
      {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: AWS_REGION,
        eventTime: new Date().toISOString(),
        eventName: 'ObjectCreated:Put',
        s3: {
          s3SchemaVersion: '1.0',
          configurationId: 'thumbnail-generation-trigger',
          bucket: {
            name: bucketName,
            ownerIdentity: {
              principalId: 'AIDACKCEVSQ6C2EXAMPLE'
            },
            arn: `arn:aws:s3:::${bucketName}`
          },
          object: {
            key: encodedKey,
            size: 0, // Size not needed for thumbnail generation
            eTag: '0123456789abcdef0123456789abcdef',
            sequencer: '0A1B2C3D4E5F678901'
          }
        }
      }
    ]
  }
}

/**
 * Invoquer la Lambda pour une vidéo
 */
async function invokeLambdaForVideo(videoKey) {
  try {
    const event = createS3Event(videoKey)
    
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      InvocationType: 'Event', // Asynchronous invocation
      Payload: JSON.stringify(event)
    })
    
    const response = await lambdaClient.send(command)
    
    return {
      success: true,
      statusCode: response.StatusCode,
      requestId: response.RequestId
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Lister toutes les vidéos dans Video/groupes-musculaires/
 */
async function listAllVideos() {
  const videos = []
  let continuationToken = undefined
  
  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Video/groupes-musculaires/',
      ContinuationToken: continuationToken,
    })
    
    const response = await s3Client.send(command)
    
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.Key.match(/\.(mp4|mov|avi)$/i) && !obj.Key.includes('thumbnails/')) {
          videos.push(obj.Key)
        }
      }
    }
    
    continuationToken = response.NextContinuationToken
  } while (continuationToken)
  
  return videos
}

/**
 * Grouper les vidéos par région
 */
function groupVideosByRegion(videos) {
  const byRegion = new Map()
  
  for (const videoKey of videos) {
    const parts = videoKey.split('/')
    // Format: Video/groupes-musculaires/{region}/{filename}
    if (parts.length >= 3 && parts[1] === 'groupes-musculaires') {
      const region = parts[2]
      if (!byRegion.has(region)) {
        byRegion.set(region, [])
      }
      byRegion.get(region).push(videoKey)
    }
  }
  
  return byRegion
}

async function main() {
  console.log('🚀 Invocation de la Lambda pour toutes les vidéos\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(`📂 Dossier : Video/groupes-musculaires/`)
  console.log(`🔧 Lambda : ${LAMBDA_FUNCTION_NAME}`)
  console.log(`🌍 Région : ${AWS_REGION}\n`)
  
  try {
    // 1. Lister toutes les vidéos
    console.log('📹 Récupération des vidéos...')
    const videos = await listAllVideos()
    console.log(`   ✅ ${videos.length} vidéos trouvées\n`)
    
    if (videos.length === 0) {
      console.log('⚠️  Aucune vidéo trouvée\n')
      return
    }
    
    // 2. Grouper par région
    const videosByRegion = groupVideosByRegion(videos)
    console.log('📊 Répartition par région :\n')
    for (const [region, regionVideos] of Array.from(videosByRegion.entries()).sort()) {
      console.log(`   ${region.padEnd(20)} : ${regionVideos.length} vidéos`)
    }
    console.log('')
    
    // 3. Demander confirmation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`⚠️  Vous allez invoquer la Lambda pour ${videos.length} vidéos`)
    console.log('   Cela générera les thumbnails pour toutes ces vidéos\n')
    console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n')
    
    // Attendre 5 secondes
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 4. Invoquer la Lambda pour chaque vidéo
    console.log('🔄 Invocation de la Lambda...\n')
    
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Traiter par batch pour éviter de surcharger
    const BATCH_SIZE = 5 // Réduire à 5 pour éviter les limites de taux
    const DELAY_BETWEEN_BATCHES = 3000 // 3 secondes entre les batches
    const DELAY_BETWEEN_INVOCATIONS = 200 // 200ms entre les invocations
    
    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
      const batch = videos.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(videos.length / BATCH_SIZE)
      
      console.log(`📦 Batch ${batchNumber}/${totalBatches} (${batch.length} vidéos)...`)
      
      // Traiter séquentiellement pour éviter les limites de taux
      const batchResults = []
      for (const videoKey of batch) {
        try {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_INVOCATIONS))
          const filename = videoKey.split('/').pop()
          const result = await invokeLambdaForVideo(videoKey)
          
          if (result.success) {
            successCount++
            batchResults.push({ videoKey, filename, success: true })
          } else {
            // Vérifier si c'est une erreur de limite de taux
            if (result.error && (result.error.includes('TooManyRequestsException') || result.error.includes('Throttling'))) {
              console.log(`   ⏳ ${filename}: Limite de taux, attente de 5 secondes...`)
              await new Promise(resolve => setTimeout(resolve, 5000))
              // Réessayer une fois
              const retryResult = await invokeLambdaForVideo(videoKey)
              if (retryResult.success) {
                successCount++
                batchResults.push({ videoKey, filename, success: true })
              } else {
                errorCount++
                errors.push({ videoKey, filename, error: retryResult.error })
                batchResults.push({ videoKey, filename, success: false, error: retryResult.error })
              }
            } else {
              errorCount++
              errors.push({ videoKey, filename, error: result.error })
              batchResults.push({ videoKey, filename, success: false, error: result.error })
            }
          }
        } catch (error) {
          const filename = videoKey.split('/').pop()
          errorCount++
          errors.push({ videoKey, filename, error: error.message })
          batchResults.push({ videoKey, filename, success: false, error: error.message })
        }
      }
      
      // Afficher les résultats du batch
      for (const result of batchResults) {
        if (result.success) {
          console.log(`   ✅ ${result.filename}`)
        } else {
          console.log(`   ❌ ${result.filename}: ${result.error}`)
        }
      }
      
      // Attendre entre les batches (sauf pour le dernier)
      if (i + BATCH_SIZE < videos.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }
    
    // 5. Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 Résumé :\n')
    console.log(`   ✅ Invoquées avec succès : ${successCount}`)
    console.log(`   ❌ Erreurs : ${errorCount}`)
    console.log(`   📹 Total : ${videos.length}\n`)
    
    if (errors.length > 0) {
      console.log('❌ Erreurs détaillées :\n')
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.filename}`)
        console.log(`      Erreur: ${err.error}\n`)
      })
      if (errors.length > 10) {
        console.log(`   ... et ${errors.length - 10} autres erreurs\n`)
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('💡 Note :')
    console.log('   La Lambda s\'exécute de manière asynchrone.')
    console.log('   Les thumbnails seront générés dans les prochaines minutes.')
    console.log('   Vous pouvez vérifier les logs CloudWatch pour suivre la progression.\n')
    console.log('   Pour vérifier les thumbnails générés :')
    console.log('   node scripts/check-thumbnails-in-s3.js\n')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
