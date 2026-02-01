#!/usr/bin/env node

/**
 * Script Node.js pour vérifier l'accès S3 à la galerie de photos
 * Usage: node scripts/check-s3-gallery-access.js
 * 
 * Nécessite:
 * - AWS SDK v3 installé (@aws-sdk/client-s3)
 * - Variables d'environnement: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 */

const { S3Client, ListObjectsV2Command, GetBucketPolicyCommand, GetPublicAccessBlockCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const https = require('https')

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const REGION = process.env.AWS_REGION || 'eu-north-1'
const GALLERY_PATH = 'Photos/Training/gallery/'

const s3Client = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkHttpAccess(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode)
    }).on('error', () => {
      resolve(0)
    })
  })
}

async function main() {
  log('========================================', 'blue')
  log('Vérification de l\'accès S3 - Galerie', 'blue')
  log('========================================', 'blue')
  console.log('')

  // Vérifier les credentials
  log('1. Vérification des credentials AWS...', 'blue')
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    log('❌ Les credentials AWS ne sont pas configurés', 'red')
    console.log('')
    console.log('Configurez-les avec:')
    console.log('  export AWS_ACCESS_KEY_ID=your_key')
    console.log('  export AWS_SECRET_ACCESS_KEY=your_secret')
    console.log('  export AWS_REGION=eu-north-1')
    console.log('  export AWS_S3_BUCKET_NAME=only-you-coaching')
    process.exit(1)
  }
  log('✅ Credentials AWS configurés', 'green')
  console.log(`   Region: ${REGION}`)
  console.log(`   Bucket: ${BUCKET_NAME}`)
  console.log('')

  // Lister les objets dans le dossier gallery
  log(`2. Vérification du dossier '${GALLERY_PATH}'...`, 'blue')
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: GALLERY_PATH,
      MaxKeys: 100,
    })

    const response = await s3Client.send(command)
    const objects = response.Contents || []

    // Filtrer les images
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const images = objects
      .filter(obj => {
        if (!obj.Key) return false
        const ext = obj.Key.split('.').pop()?.toLowerCase()
        return ext && imageExtensions.includes(ext)
      })
      .sort((a, b) => (a.Key || '').localeCompare(b.Key || ''))

    if (images.length === 0) {
      log('❌ Aucune image trouvée dans le dossier', 'red')
      console.log('')
      console.log(`   Le dossier ${GALLERY_PATH} existe mais ne contient pas d'images`)
      console.log('   Uploadez des images avec:')
      console.log(`   aws s3 cp photo.jpg s3://${BUCKET_NAME}/${GALLERY_PATH}photo.jpg`)
    } else {
      log(`✅ ${images.length} image(s) trouvée(s)`, 'green')
      console.log('')
      console.log('   Premières images:')
      images.slice(0, 5).forEach(img => {
        const size = img.Size ? `(${Math.round(img.Size / 1024)} KB)` : ''
        console.log(`   - ${img.Key?.replace(GALLERY_PATH, '')} ${size}`)
      })
    }
    console.log('')

    // Vérifier la bucket policy
    log('3. Vérification de la bucket policy...', 'blue')
    try {
      const policyCommand = new GetBucketPolicyCommand({
        Bucket: BUCKET_NAME,
      })
      const policyResponse = await s3Client.send(policyCommand)
      const policy = JSON.parse(policyResponse.Policy || '{}')

      const hasPhotosPolicy = policy.Statement?.some((stmt) => {
        const resource = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource]
        return resource.some(r => r && r.includes('Photos'))
      })

      if (hasPhotosPolicy) {
        log('✅ Bucket policy trouvée avec accès à Photos/*', 'green')
      } else {
        log('⚠️  Bucket policy présente mais ne semble pas inclure Photos/*', 'yellow')
      }
    } catch (error) {
      if (error.name === 'NoSuchBucketPolicy') {
        log('⚠️  Aucune bucket policy configurée', 'yellow')
        console.log('   Les images ne seront pas accessibles publiquement')
        console.log('   Configurez une bucket policy pour permettre l\'accès public à Photos/*')
      } else {
        log(`⚠️  Erreur lors de la lecture de la policy: ${error.message}`, 'yellow')
      }
    }
    console.log('')

    // Vérifier Block Public Access
    log('4. Vérification de Block Public Access...', 'blue')
    try {
      const blockCommand = new GetPublicAccessBlockCommand({
        Bucket: BUCKET_NAME,
      })
      const blockResponse = await s3Client.send(blockCommand)
      const config = blockResponse.PublicAccessBlockConfiguration

      if (config.BlockPublicAcls || config.BlockPublicPolicy || config.RestrictPublicBuckets || config.IgnorePublicAcls) {
        log('⚠️  Block Public Access est partiellement activé', 'yellow')
        console.log(`   BlockPublicAcls: ${config.BlockPublicAcls}`)
        console.log(`   BlockPublicPolicy: ${config.BlockPublicPolicy}`)
        console.log(`   RestrictPublicBuckets: ${config.RestrictPublicBuckets}`)
        console.log(`   IgnorePublicAcls: ${config.IgnorePublicAcls}`)
        console.log('   Cela peut empêcher l\'accès public même avec une bucket policy')
      } else {
        log('✅ Block Public Access n\'est pas activé', 'green')
      }
    } catch (error) {
      if (error.name === 'NoSuchPublicAccessBlockConfiguration') {
        log('✅ Block Public Access n\'est pas configuré', 'green')
        console.log('   L\'accès public est possible (si la bucket policy le permet)')
      } else {
        log(`⚠️  Erreur lors de la lecture: ${error.message}`, 'yellow')
      }
    }
    console.log('')

    // Tester l'accès public à une image
    if (images.length > 0) {
      log('5. Test d\'accès public à une image...', 'blue')
      const firstImage = images[0]
      const imageKey = firstImage.Key || ''
      const encodedKey = imageKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${encodedKey}`

      console.log(`   Test de l'URL: ${publicUrl}`)

      const httpCode = await checkHttpAccess(publicUrl)

      if (httpCode === 200) {
        log('✅ L\'image est accessible publiquement (HTTP 200)', 'green')
      } else if (httpCode === 403) {
        log('❌ Accès refusé (HTTP 403)', 'red')
        console.log('   L\'image n\'est pas accessible publiquement')
        console.log('   Vérifiez la bucket policy et Block Public Access')
      } else if (httpCode === 404) {
        log('❌ Image non trouvée (HTTP 404)', 'red')
        console.log('   Vérifiez que le chemin est correct')
      } else if (httpCode === 0) {
        log('⚠️  Impossible de tester l\'accès HTTP', 'yellow')
      } else {
        log(`⚠️  Code HTTP: ${httpCode}`, 'yellow')
      }
      console.log('')
    }

    // Résumé
    log('========================================', 'blue')
    log('Résumé', 'blue')
    log('========================================', 'blue')
    console.log('')
    console.log(`Bucket: ${BUCKET_NAME}`)
    console.log(`Région: ${REGION}`)
    console.log(`Dossier: ${GALLERY_PATH}`)
    console.log(`Nombre d'images: ${images.length}`)
    console.log('')

    if (images.length === 0) {
      log('❌ Aucune image trouvée dans la galerie', 'red')
      console.log(`   Uploadez des images dans: s3://${BUCKET_NAME}/${GALLERY_PATH}`)
    } else {
      log('✅ Images trouvées dans S3', 'green')
      console.log('   Vérifiez que les permissions permettent l\'accès public')
    }

  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red')
    console.log('')
    console.log('Vérifiez:')
    console.log('  - Le nom du bucket est correct')
    console.log('  - La région est correcte')
    console.log('  - Les credentials ont les permissions nécessaires')
    console.log('  - Le dossier Photos/Training/gallery/ existe')
    process.exit(1)
  }
}

main().catch(console.error)
