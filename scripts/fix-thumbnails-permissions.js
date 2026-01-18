#!/usr/bin/env node

/**
 * Script pour corriger les permissions S3 pour les thumbnails
 * 
 * Ce script met à jour la bucket policy S3 pour permettre l'accès public aux thumbnails.
 * 
 * Usage:
 *   node scripts/fix-thumbnails-permissions.js
 * 
 * Prérequis:
 *   - AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY doivent être configurés
 *   - AWS_REGION doit être configuré (défaut: eu-north-1)
 *   - AWS_S3_BUCKET_NAME doit être configuré (défaut: only-you-coaching)
 */

const { S3Client, GetBucketPolicyCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3')

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ Erreur: AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY doivent être configurés')
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
 * Récupère la politique actuelle du bucket
 */
async function getCurrentPolicy() {
  try {
    const command = new GetBucketPolicyCommand({ Bucket: BUCKET_NAME })
    const response = await s3Client.send(command)
    return JSON.parse(response.Policy)
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      return null
    }
    throw error
  }
}

/**
 * Met à jour la politique du bucket
 */
async function updateBucketPolicy() {
  console.log('🔧 Correction des permissions S3 pour les thumbnails...\n')
  console.log(`Bucket: ${BUCKET_NAME}`)
  console.log(`Region: ${AWS_REGION}\n`)

  // Récupérer la politique actuelle
  let currentPolicy = await getCurrentPolicy()

  // Définir les statements requis
  const requiredStatements = [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${BUCKET_NAME}/Video/*`
    },
    {
      Sid: 'PublicReadThumbnails',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${BUCKET_NAME}/thumbnails/*`
    },
    {
      Sid: 'PublicReadPhotos',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${BUCKET_NAME}/Photos/*`
    }
  ]

  if (!currentPolicy) {
    console.log('📝 Aucune politique existante trouvée. Création d\'une nouvelle politique...')
    currentPolicy = {
      Version: '2012-10-17',
      Statement: requiredStatements
    }
  } else {
    console.log('📝 Mise à jour de la politique existante...')
    
    // Vérifier et corriger les statements existants
    const existingStatements = currentPolicy.Statement || []
    const existingSids = new Set(existingStatements.map(s => s.Sid))
    
    // Corriger les statements qui ont Resource comme tableau
    const correctedStatements = existingStatements.map(stmt => {
      if (Array.isArray(stmt.Resource)) {
        console.log(`   ⚠️  Correction du statement "${stmt.Sid}": Resource était un tableau`)
        // Prendre le premier élément du tableau (ou utiliser le pattern principal)
        if (stmt.Sid === 'PublicReadThumbnails') {
          return {
            ...stmt,
            Resource: `arn:aws:s3:::${BUCKET_NAME}/thumbnails/*`
          }
        } else if (stmt.Sid === 'PublicReadPhotos') {
          return {
            ...stmt,
            Resource: `arn:aws:s3:::${BUCKET_NAME}/Photos/*`
          }
        } else {
          return {
            ...stmt,
            Resource: stmt.Resource[0] // Prendre le premier élément
          }
        }
      }
      return stmt
    })
    
    // Ajouter les statements manquants
    const newStatements = requiredStatements.filter(s => !existingSids.has(s.Sid))
    
    if (newStatements.length > 0) {
      console.log(`   ✅ Ajout de ${newStatements.length} nouveau(x) statement(s)`)
      correctedStatements.push(...newStatements)
    }
    
    currentPolicy.Statement = correctedStatements
  }

  console.log('\n📋 Nouvelle politique:')
  console.log(JSON.stringify(currentPolicy, null, 2))
  console.log()

  // Appliquer la nouvelle politique
  console.log('💾 Application de la nouvelle politique...')
  try {
    const putPolicyCommand = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(currentPolicy)
    })
    await s3Client.send(putPolicyCommand)
    console.log('   ✅ Politique mise à jour avec succès!\n')
    
    console.log('📝 Étapes suivantes:')
    console.log('   1. Vérifiez que "Block public access" est désactivé dans la console S3')
    console.log('   2. Testez une URL de thumbnail:')
    console.log(`      curl -I "https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/thumbnails/Video/..."`)
    console.log('   3. Vous devriez recevoir 200 OK au lieu de 403 Forbidden\n')
    
  } catch (error) {
    console.error('   ❌ Erreur lors de la mise à jour:', error.message)
    if (error.message.includes('BlockPublicAccess')) {
      console.error('\n   ⚠️  IMPORTANT: Vous devez désactiver "Block public access" dans la console S3')
      console.error('      Permissions → Block public access (bucket settings) → Edit')
      console.error('      Décochez tous les paramètres et confirmez\n')
    }
    process.exit(1)
  }
}

// Exécuter le script
updateBucketPolicy().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
