#!/usr/bin/env node
/**
 * Script pour générer les thumbnails manquants
 * Utilise l'endpoint API pour générer les thumbnails des vidéos qui n'en ont pas
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

if (!hasAwsCredentials) {
  console.error('❌ AWS credentials not configured')
  process.exit(1)
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * Lister tous les objets dans S3 avec un préfixe
 */
async function listObjects(prefix) {
  const objects = []
  let continuationToken = undefined
  
  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })
    
    const response = await s3Client.send(command)
    
    if (response.Contents) {
      objects.push(...response.Contents)
    }
    
    continuationToken = response.NextContinuationToken
  } while (continuationToken)
  
  return objects
}

/**
 * Vérifier si un thumbnail existe pour une vidéo
 */
function getThumbnailKey(videoKey) {
  // Video/groupes-musculaires/abdos/1. Titre.mp4
  // -> thumbnails/Video/groupes-musculaires/abdos/1. Titre-thumb.jpg
  return videoKey.replace(/\.(mp4|mov|avi)$/i, '-thumb.jpg').replace(/^Video\//, 'thumbnails/Video/')
}

async function main() {
  console.log('🔍 Vérification des thumbnails manquants...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Lister toutes les vidéos
    console.log('📹 Récupération des vidéos...')
    const videos = await listObjects('Video/groupes-musculaires/')
    const videoFiles = videos.filter(v => 
      v.Key && v.Key.match(/\.(mp4|mov|avi)$/i) && !v.Key.includes('thumbnails/')
    )
    
    console.log(`   ✅ ${videoFiles.length} vidéos trouvées\n`)
    
    // 2. Lister tous les thumbnails existants
    console.log('🖼️  Récupération des thumbnails existants...')
    const thumbnails = await listObjects('thumbnails/Video/groupes-musculaires/')
    const thumbnailKeys = new Set(thumbnails.map(t => t.Key).filter(Boolean))
    
    console.log(`   ✅ ${thumbnailKeys.size} thumbnails existants\n`)
    
    // 3. Trouver les vidéos sans thumbnail
    const videosWithoutThumbnail = videoFiles.filter(video => {
      const expectedThumbnailKey = getThumbnailKey(video.Key)
      return !thumbnailKeys.has(expectedThumbnailKey)
    })
    
    console.log(`   ❌ ${videosWithoutThumbnail.length} vidéos sans thumbnail\n`)
    
    if (videosWithoutThumbnail.length === 0) {
      console.log('✅ Toutes les vidéos ont un thumbnail !\n')
      return
    }
    
    // 4. Afficher les recommandations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('💡 Options pour générer les thumbnails :\n')
    console.log('   1. Vérifier la Lambda :')
    console.log('      → Aller dans AWS Console > Lambda')
    console.log('      → Vérifier que la fonction est configurée avec un déclencheur S3')
    console.log('      → Vérifier les logs CloudWatch pour voir les erreurs\n')
    console.log('   2. Générer manuellement via l\'API :')
    console.log(`      → Appeler POST ${API_BASE_URL}/api/videos/generate-missing-thumbnails`)
    console.log('      → Cela générera les thumbnails pour toutes les vidéos sans thumbnail\n')
    console.log('   3. Attendre que la Lambda se déclenche :')
    console.log('      → Si l\'upload vient de se terminer, la Lambda peut prendre quelques minutes')
    console.log('      → Relancer ce script dans quelques minutes\n')
    
    // 5. Afficher quelques exemples
    console.log('📋 Exemples de vidéos sans thumbnail (premiers 10) :\n')
    videosWithoutThumbnail.slice(0, 10).forEach((video, i) => {
      const filename = video.Key.split('/').pop()
      console.log(`   ${i + 1}. ${filename}`)
    })
    if (videosWithoutThumbnail.length > 10) {
      console.log(`   ... et ${videosWithoutThumbnail.length - 10} autres\n`)
    } else {
      console.log('')
    }
    
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
