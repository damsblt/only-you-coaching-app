#!/usr/bin/env node

/**
 * Script pour mettre à jour la politique de bucket S3
 * Ajoute une règle pour rendre le dossier thumbnails/ public
 */

const { S3Client, GetBucketPolicyCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3')
const path = require('path')

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const awsRegion = process.env.AWS_REGION || 'eu-north-1'
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

if (!awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ Variables d\'environnement AWS manquantes')
  process.exit(1)
}

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
})

async function main() {
  console.log('🔧 Mise à jour de la politique de bucket S3...\n')
  console.log(`📦 Bucket: ${bucketName}\n`)

  // 1. Récupérer la politique actuelle
  console.log('1️⃣  Récupération de la politique actuelle...')
  let currentPolicy = null
  try {
    const getPolicyCommand = new GetBucketPolicyCommand({ Bucket: bucketName })
    const policyResponse = await s3Client.send(getPolicyCommand)
    if (policyResponse.Policy) {
      currentPolicy = JSON.parse(policyResponse.Policy)
      console.log('   ✅ Politique actuelle trouvée')
      console.log('   ', JSON.stringify(currentPolicy, null, 2))
    }
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      console.log('   ⚠️  Aucune politique actuelle')
      currentPolicy = {
        Version: '2012-10-17',
        Statement: []
      }
    } else {
      console.error('   ❌ Erreur:', error.message)
      process.exit(1)
    }
  }
  console.log()

  // 2. Vérifier si la règle pour thumbnails existe déjà
  const thumbnailsRuleExists = currentPolicy.Statement.some(
    stmt => stmt.Resource && (
      Array.isArray(stmt.Resource)
        ? stmt.Resource.some(r => r.includes('thumbnails'))
        : stmt.Resource.includes('thumbnails')
    )
  )

  if (thumbnailsRuleExists) {
    console.log('   ✅ La règle pour thumbnails existe déjà dans la politique')
    console.log('   Pas besoin de mise à jour.')
    return
  }

  // 3. Ajouter la règle pour thumbnails
  console.log('2️⃣  Ajout de la règle pour thumbnails...')
  const thumbnailsRule = {
    Sid: 'PublicReadThumbnails',
    Effect: 'Allow',
    Principal: '*',
    Action: 's3:GetObject',
    Resource: [
      'arn:aws:s3:::only-you-coaching/thumbnails/*',
      'arn:aws:s3:::only-you-coaching/thumbnails/**/*'
    ]
  }

  currentPolicy.Statement.push(thumbnailsRule)
  console.log('   Nouvelle politique:')
  console.log('   ', JSON.stringify(currentPolicy, null, 2))
  console.log()

  // 4. Appliquer la nouvelle politique
  console.log('3️⃣  Application de la nouvelle politique...')
  try {
    const putPolicyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(currentPolicy)
    })
    await s3Client.send(putPolicyCommand)
    console.log('   ✅ Politique mise à jour avec succès!')
    console.log()
    console.log('💡 Les thumbnails devraient maintenant être accessibles publiquement.')
    console.log('   Vous pouvez tester en ouvrant une URL de thumbnail dans votre navigateur.')
  } catch (error) {
    console.error('   ❌ Erreur lors de la mise à jour:', error.message)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

