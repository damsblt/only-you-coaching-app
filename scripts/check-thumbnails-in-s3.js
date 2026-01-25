#!/usr/bin/env node
/**
 * Script pour vérifier les thumbnails dans S3
 * Liste tous les thumbnails et compare avec les vidéos
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
 * Extraire la région depuis la clé S3
 */
function extractRegion(key) {
  const parts = key.split('/')
  // Format: Video/groupes-musculaires/{region}/...
  // Format: thumbnails/Video/groupes-musculaires/{region}/...
  if (parts.length >= 3 && parts[1] === 'groupes-musculaires') {
    return parts[2]
  }
  return null
}

/**
 * Extraire le nom de fichier vidéo depuis la clé thumbnail
 */
function getVideoKeyFromThumbnail(thumbnailKey) {
  // thumbnails/Video/groupes-musculaires/abdos/1. Titre-thumb.jpg
  // -> Video/groupes-musculaires/abdos/1. Titre.mp4
  if (!thumbnailKey.startsWith('thumbnails/')) {
    return null
  }
  
  const withoutPrefix = thumbnailKey.substring('thumbnails/'.length)
  const withoutSuffix = withoutPrefix.replace(/-thumb\.jpg$/i, '')
  
  // Essayer différentes extensions
  const extensions = ['.mp4', '.mov', '.avi']
  for (const ext of extensions) {
    const potentialKey = withoutSuffix + ext
    return potentialKey
  }
  
  return withoutSuffix + '.mp4' // Default
}

async function main() {
  console.log('🔍 Vérification des thumbnails dans S3\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Lister toutes les vidéos
    console.log('📹 Récupération des vidéos...')
    const videos = await listObjects('Video/groupes-musculaires/')
    const videoFiles = videos.filter(v => 
      v.Key && v.Key.match(/\.(mp4|mov|avi)$/i) && !v.Key.includes('thumbnails/')
    )
    
    console.log(`   ✅ ${videoFiles.length} vidéos trouvées\n`)
    
    // 2. Lister tous les thumbnails
    console.log('🖼️  Récupération des thumbnails...')
    const thumbnails = await listObjects('thumbnails/Video/groupes-musculaires/')
    const thumbnailFiles = thumbnails.filter(t => 
      t.Key && t.Key.match(/\.(jpg|jpeg|png)$/i)
    )
    
    console.log(`   ✅ ${thumbnailFiles.length} thumbnails trouvés\n`)
    
    // 3. Analyser par région
    console.log('📊 Analyse par région :\n')
    
    const videosByRegion = new Map()
    const thumbnailsByRegion = new Map()
    
    for (const video of videoFiles) {
      const region = extractRegion(video.Key) || 'unknown'
      if (!videosByRegion.has(region)) {
        videosByRegion.set(region, [])
      }
      videosByRegion.get(region).push(video)
    }
    
    for (const thumbnail of thumbnailFiles) {
      const region = extractRegion(thumbnail.Key) || 'unknown'
      if (!thumbnailsByRegion.has(region)) {
        thumbnailsByRegion.set(region, [])
      }
      thumbnailsByRegion.get(region).push(thumbnail)
    }
    
    // Afficher les statistiques par région
    const allRegions = new Set([...videosByRegion.keys(), ...thumbnailsByRegion.keys()])
    
    let totalVideos = 0
    let totalThumbnails = 0
    
    for (const region of Array.from(allRegions).sort()) {
      const videoCount = videosByRegion.get(region)?.length || 0
      const thumbnailCount = thumbnailsByRegion.get(region)?.length || 0
      const percentage = videoCount > 0 ? ((thumbnailCount / videoCount) * 100).toFixed(1) : 0
      
      totalVideos += videoCount
      totalThumbnails += thumbnailCount
      
      const status = videoCount === thumbnailCount ? '✅' : videoCount > thumbnailCount ? '⚠️' : '❌'
      console.log(`   ${status} ${region.padEnd(20)} : ${videoCount.toString().padStart(3)} vidéos, ${thumbnailCount.toString().padStart(3)} thumbnails (${percentage}%)`)
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 Résumé global :\n')
    console.log(`   📹 Total vidéos : ${totalVideos}`)
    console.log(`   🖼️  Total thumbnails : ${totalThumbnails}`)
    console.log(`   📈 Taux de couverture : ${totalVideos > 0 ? ((totalThumbnails / totalVideos) * 100).toFixed(1) : 0}%`)
    console.log(`   ❌ Thumbnails manquants : ${Math.max(0, totalVideos - totalThumbnails)}\n`)
    
    // 4. Vérifier les correspondances
    console.log('🔗 Vérification des correspondances...\n')
    
    const videoKeys = new Set(videoFiles.map(v => v.Key))
    const thumbnailKeys = new Set(thumbnailFiles.map(t => t.Key))
    
    let matchedCount = 0
    let unmatchedVideos = []
    let unmatchedThumbnails = []
    
    for (const thumbnail of thumbnailFiles) {
      const videoKey = getVideoKeyFromThumbnail(thumbnail.Key)
      if (videoKey && videoKeys.has(videoKey)) {
        matchedCount++
      } else {
        unmatchedThumbnails.push(thumbnail.Key)
      }
    }
    
    for (const video of videoFiles) {
      const expectedThumbnailKey = `thumbnails/${video.Key.replace(/\.(mp4|mov|avi)$/i, '-thumb.jpg')}`
      if (!thumbnailKeys.has(expectedThumbnailKey)) {
        unmatchedVideos.push(video.Key)
      }
    }
    
    console.log(`   ✅ Thumbnails correspondants : ${matchedCount}`)
    console.log(`   ❌ Vidéos sans thumbnail : ${unmatchedVideos.length}`)
    console.log(`   ⚠️  Thumbnails orphelins : ${unmatchedThumbnails.length}\n`)
    
    // 5. Afficher quelques exemples de vidéos sans thumbnail
    if (unmatchedVideos.length > 0) {
      console.log('📋 Exemples de vidéos sans thumbnail (premiers 10) :\n')
      unmatchedVideos.slice(0, 10).forEach((key, i) => {
        const region = extractRegion(key) || 'unknown'
        const filename = key.split('/').pop()
        console.log(`   ${i + 1}. [${region}] ${filename}`)
      })
      if (unmatchedVideos.length > 10) {
        console.log(`   ... et ${unmatchedVideos.length - 10} autres\n`)
      } else {
        console.log('')
      }
    }
    
    // 6. Recommandations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('💡 Recommandations :\n')
    
    if (totalThumbnails === 0) {
      console.log('   ⚠️  Aucun thumbnail trouvé dans S3')
      console.log('   → Vérifier que la Lambda est bien configurée et déclenchée')
      console.log('   → Vérifier les logs CloudWatch de la Lambda')
    } else if (totalThumbnails < totalVideos) {
      console.log(`   ⚠️  ${totalVideos - totalThumbnails} vidéos n'ont pas de thumbnail`)
      console.log('   → La Lambda peut encore être en train de générer les thumbnails')
      console.log('   → Attendre quelques minutes et relancer ce script')
    } else if (totalThumbnails === totalVideos) {
      console.log('   ✅ Toutes les vidéos ont un thumbnail !')
      console.log('   → Vous pouvez maintenant synchroniser les thumbnails vers Neon')
    } else {
      console.log(`   ⚠️  ${totalThumbnails - totalVideos} thumbnails en trop`)
      console.log('   → Certains thumbnails peuvent être orphelins (vidéos supprimées)')
    }
    
    console.log('')
    
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
