#!/usr/bin/env node
/**
 * Script pour lister tous les thumbnails dans S3
 * Affiche le chemin complet et permet de les retrouver facilement
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
  // Format: thumbnails/Video/groupes-musculaires/{region}/...
  if (parts.length >= 4 && parts[0] === 'thumbnails' && parts[1] === 'Video' && parts[2] === 'groupes-musculaires') {
    return parts[3]
  }
  return null
}

async function main() {
  console.log('🔍 Liste des thumbnails dans S3\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(`📦 Bucket : ${BUCKET_NAME}`)
  console.log(`📂 Chemin : thumbnails/Video/groupes-musculaires/\n`)
  
  try {
    // Lister tous les thumbnails
    const thumbnails = await listObjects('thumbnails/Video/groupes-musculaires/')
    const thumbnailFiles = thumbnails.filter(t => 
      t.Key && t.Key.match(/\.(jpg|jpeg|png)$/i)
    )
    
    console.log(`✅ ${thumbnailFiles.length} thumbnails trouvés\n`)
    
    if (thumbnailFiles.length === 0) {
      console.log('⚠️  Aucun thumbnail trouvé')
      console.log('   Les thumbnails sont générés par la Lambda automatiquement.')
      console.log('   Vérifiez les logs CloudWatch de la Lambda pour voir la progression.\n')
      return
    }
    
    // Grouper par région
    const byRegion = new Map()
    for (const thumbnail of thumbnailFiles) {
      const region = extractRegion(thumbnail.Key) || 'unknown'
      if (!byRegion.has(region)) {
        byRegion.set(region, [])
      }
      byRegion.get(region).push(thumbnail)
    }
    
    // Afficher par région
    console.log('📊 Thumbnails par région :\n')
    for (const [region, regionThumbnails] of Array.from(byRegion.entries()).sort()) {
      console.log(`   ${region.padEnd(20)} : ${regionThumbnails.length} thumbnails`)
    }
    console.log('')
    
    // Afficher les chemins complets
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📍 Chemins S3 complets (premiers 20) :\n')
    
    thumbnailFiles.slice(0, 20).forEach((thumbnail, i) => {
      const s3Path = `s3://${BUCKET_NAME}/${thumbnail.Key}`
      const region = extractRegion(thumbnail.Key) || 'unknown'
      const filename = thumbnail.Key.split('/').pop()
      const sizeKB = ((thumbnail.Size || 0) / 1024).toFixed(1)
      
      console.log(`${(i + 1).toString().padStart(2)}. [${region}]`)
      console.log(`    ${s3Path}`)
      console.log(`    📄 ${filename} (${sizeKB} KB)`)
      console.log('')
    })
    
    if (thumbnailFiles.length > 20) {
      console.log(`   ... et ${thumbnailFiles.length - 20} autres thumbnails\n`)
    }
    
    // Instructions pour accéder dans AWS Console
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('🌐 Comment accéder aux thumbnails dans AWS Console :\n')
    console.log('   1. Allez sur https://console.aws.amazon.com/s3')
    console.log(`   2. Ouvrez le bucket : ${BUCKET_NAME}`)
    console.log('   3. Naviguez vers : thumbnails/Video/groupes-musculaires/')
    console.log('   4. Vous verrez les dossiers par région (abdos, biceps, etc.)')
    console.log('   5. Ouvrez un dossier pour voir les thumbnails\n')
    
    // URL directe
    console.log('🔗 URL directe dans AWS Console :\n')
    console.log(`   https://s3.console.aws.amazon.com/s3/buckets/${BUCKET_NAME}?region=${AWS_REGION}&prefix=thumbnails/Video/groupes-musculaires/&showversions=false\n`)
    
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
