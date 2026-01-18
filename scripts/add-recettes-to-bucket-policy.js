#!/usr/bin/env node

/**
 * Script pour ajouter les permissions publiques pour le dossier recettes/
 * à la politique de bucket S3 existante
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
  console.error('   Assurez-vous que AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY sont définis dans .env.local')
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
  console.log('🔧 Ajout des permissions publiques pour recettes/ dans la politique S3...\n')
  console.log(`📦 Bucket: ${bucketName}`)
  console.log(`🌍 Region: ${awsRegion}\n`)

  // 1. Récupérer la politique actuelle
  console.log('1️⃣  Récupération de la politique actuelle...')
  let currentPolicy = null
  try {
    const getPolicyCommand = new GetBucketPolicyCommand({ Bucket: bucketName })
    const policyResponse = await s3Client.send(getPolicyCommand)
    if (policyResponse.Policy) {
      currentPolicy = JSON.parse(policyResponse.Policy)
      console.log('   ✅ Politique actuelle trouvée')
      console.log(`   ${currentPolicy.Statement.length} règle(s) existante(s)`)
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

  // 2. Vérifier si la règle pour recettes existe déjà
  const recettesRuleExists = currentPolicy.Statement.some(
    stmt => stmt.Resource && (
      Array.isArray(stmt.Resource)
        ? stmt.Resource.some(r => r.includes('recettes'))
        : stmt.Resource.includes('recettes')
    )
  )

  if (recettesRuleExists) {
    console.log('   ✅ La règle pour recettes/ existe déjà dans la politique')
    console.log('   Pas besoin de mise à jour.')
    console.log('\n💡 Si les fichiers retournent toujours "Access Denied":')
    console.log('   1. Vérifiez les paramètres "Block public access" dans la console S3')
    console.log('   2. Assurez-vous que les fichiers existent dans s3://' + bucketName + '/recettes/')
    return
  }

  // 3. Ajouter la règle pour recettes
  console.log('2️⃣  Ajout de la règle pour recettes/...')
  const recettesRule = {
    Sid: 'PublicReadRecettes',
    Effect: 'Allow',
    Principal: '*',
    Action: 's3:GetObject',
    Resource: `arn:aws:s3:::${bucketName}/recettes/*`
  }

  currentPolicy.Statement.push(recettesRule)
  console.log('   ✅ Règle ajoutée')
  console.log()

  // 4. Appliquer la nouvelle politique
  console.log('3️⃣  Application de la nouvelle politique...')
  try {
    const putPolicyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(currentPolicy, null, 2)
    })
    await s3Client.send(putPolicyCommand)
    console.log('   ✅ Politique mise à jour avec succès!')
    console.log()
    console.log('📋 Politique mise à jour:')
    console.log(JSON.stringify(currentPolicy, null, 2))
    console.log()
    console.log('💡 Prochaines étapes:')
    console.log('   1. Attendez quelques secondes pour la propagation des changements')
    console.log('   2. Testez une URL:')
    console.log(`      https://${bucketName}.s3.${awsRegion}.amazonaws.com/recettes/Recettes_Vol.I/15.png`)
    console.log('   3. Si toujours 403, vérifiez dans la console S3:')
    console.log('      - Permissions > Block public access (doit être désactivé)')
    console.log('      - Permissions > Bucket policy (doit contenir la règle recettes)')
  } catch (error) {
    console.error('   ❌ Erreur lors de la mise à jour:', error.message)
    if (error.name === 'AccessDenied') {
      console.error('\n💡 Vérifiez les permissions IAM:')
      console.error('   L\'utilisateur doit avoir la permission s3:PutBucketPolicy')
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
