#!/usr/bin/env node

/**
 * Script pour vérifier la configuration du bucket S3
 */

const { S3Client, GetBucketPolicyCommand, GetBucketCorsCommand, GetBucketAclCommand, GetPublicAccessBlockCommand } = require('@aws-sdk/client-s3')
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
  console.log('🔍 Vérification de la configuration du bucket S3...\n')
  console.log(`📦 Bucket: ${bucketName}\n`)

  // 1. Vérifier la politique de bucket
  console.log('1️⃣  Vérification de la politique de bucket...')
  try {
    const policyCommand = new GetBucketPolicyCommand({ Bucket: bucketName })
    const policyResponse = await s3Client.send(policyCommand)
    if (policyResponse.Policy) {
      const policy = JSON.parse(policyResponse.Policy)
      console.log('   ✅ Politique de bucket trouvée:')
      console.log('   ', JSON.stringify(policy, null, 2))
    } else {
      console.log('   ⚠️  Aucune politique de bucket configurée')
    }
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      console.log('   ⚠️  Aucune politique de bucket configurée')
    } else {
      console.log('   ❌ Erreur:', error.message)
    }
  }
  console.log()

  // 2. Vérifier CORS
  console.log('2️⃣  Vérification de la configuration CORS...')
  try {
    const corsCommand = new GetBucketCorsCommand({ Bucket: bucketName })
    const corsResponse = await s3Client.send(corsCommand)
    if (corsResponse.CORSRules && corsResponse.CORSRules.length > 0) {
      console.log('   ✅ Configuration CORS trouvée:')
      corsResponse.CORSRules.forEach((rule, index) => {
        console.log(`   Règle ${index + 1}:`, JSON.stringify(rule, null, 2))
      })
    } else {
      console.log('   ⚠️  Aucune configuration CORS')
    }
  } catch (error) {
    if (error.name === 'NoSuchCORSConfiguration') {
      console.log('   ⚠️  Aucune configuration CORS')
    } else {
      console.log('   ❌ Erreur:', error.message)
    }
  }
  console.log()

  // 3. Vérifier le blocage d'accès public
  console.log('3️⃣  Vérification du blocage d\'accès public...')
  try {
    const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName })
    const publicAccessResponse = await s3Client.send(publicAccessCommand)
    const config = publicAccessResponse.PublicAccessBlockConfiguration
    if (config) {
      console.log('   Configuration du blocage d\'accès public:')
      console.log('   BlockPublicAcls:', config.BlockPublicAcls)
      console.log('   IgnorePublicAcls:', config.IgnorePublicAcls)
      console.log('   BlockPublicPolicy:', config.BlockPublicPolicy)
      console.log('   RestrictPublicBuckets:', config.RestrictPublicBuckets)
      
      if (config.BlockPublicPolicy) {
        console.log('   ⚠️  ATTENTION: BlockPublicPolicy est activé!')
        console.log('   Les politiques de bucket publiques sont bloquées.')
      }
      if (config.RestrictPublicBuckets) {
        console.log('   ⚠️  ATTENTION: RestrictPublicBuckets est activé!')
        console.log('   L\'accès public aux buckets est restreint.')
      }
    } else {
      console.log('   ✅ Pas de blocage d\'accès public configuré')
    }
  } catch (error) {
    if (error.name === 'NoSuchPublicAccessBlockConfiguration') {
      console.log('   ✅ Pas de blocage d\'accès public configuré')
    } else {
      console.log('   ❌ Erreur:', error.message)
    }
  }
  console.log()

  // 4. Vérifier ACL
  console.log('4️⃣  Vérification de l\'ACL du bucket...')
  try {
    const aclCommand = new GetBucketAclCommand({ Bucket: bucketName })
    const aclResponse = await s3Client.send(aclCommand)
    console.log('   ACL du bucket:', aclResponse.Grants ? aclResponse.Grants.length + ' grants trouvés' : 'Aucun grant')
    if (aclResponse.Grants) {
      aclResponse.Grants.forEach((grant, index) => {
        console.log(`   Grant ${index + 1}:`, {
          Grantee: grant.Grantee.Type,
          Permission: grant.Permission
        })
      })
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('💡 Recommandations:')
  console.log('   Si BlockPublicPolicy est activé, vous devez le désactiver')
  console.log('   pour que les politiques de bucket publiques fonctionnent.')
  console.log('   Ou utilisez une politique de bucket qui contourne ce blocage.')
  console.log('='.repeat(50))
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

