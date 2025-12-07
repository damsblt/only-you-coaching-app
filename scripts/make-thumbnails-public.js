#!/usr/bin/env node

/**
 * Script pour rendre les thumbnails publics dans S3
 */

const { createClient } = require('@supabase/supabase-js')
const { S3Client, PutObjectAclCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const path = require('path')

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const awsRegion = process.env.AWS_REGION || 'eu-north-1'
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

if (!awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ Variables d\'environnement AWS manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
})

/**
 * Extrait la clé S3 depuis l'URL (décodée)
 */
function extractS3Key(url) {
  try {
    const urlObj = new URL(url)
    const encodedPath = urlObj.pathname
    const decodedPath = decodeURIComponent(encodedPath)
    return decodedPath.substring(1) // Enlever le slash initial
  } catch (error) {
    return null
  }
}

/**
 * Rend un objet public dans S3
 */
async function makeObjectPublic(key) {
  try {
    const command = new PutObjectAclCommand({
      Bucket: bucketName,
      Key: key,
      ACL: 'public-read'
    })
    await s3Client.send(command)
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error.name || error.message }
  }
}

async function main() {
  console.log('🔍 Rendre les thumbnails publics dans S3...\n')

  // Option 1: Utiliser les URLs depuis Supabase
  console.log('📥 Option 1: Récupération des thumbnails depuis Supabase...')
  const { data: videos, error } = await supabase
    .from('videos_new')
    .select('id, title, thumbnail')
    .eq('isPublished', true)
    .not('thumbnail', 'is', null)
    .limit(50) // Commencer avec 50 pour tester

  if (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }

  console.log(`✅ ${videos.length} vidéos trouvées\n`)

  let updated = 0
  let errors = 0
  const thumbnailKeys = new Set()

  // Extraire les clés S3 uniques des thumbnails
  for (const video of videos) {
    const s3Key = extractS3Key(video.thumbnail)
    if (s3Key && s3Key.startsWith('thumbnails/')) {
      thumbnailKeys.add(s3Key)
    }
  }

  console.log(`📋 ${thumbnailKeys.size} thumbnails uniques à rendre publics\n`)

  // Rendre chaque thumbnail public
  for (const key of thumbnailKeys) {
    console.log(`📷 ${key.substring(0, 60)}...`)
    
    const result = await makeObjectPublic(key)
    
    if (result.success) {
      updated++
      console.log(`   ✅ Rendu public\n`)
    } else {
      errors++
      console.log(`   ❌ Erreur: ${result.error}\n`)
    }
  }

  console.log('='.repeat(50))
  console.log('📊 Résumé:')
  console.log(`   ✅ Rendus publics: ${updated}`)
  console.log(`   ❌ Erreurs: ${errors}`)
  console.log(`   📊 Total: ${thumbnailKeys.size}`)
  console.log('='.repeat(50))
  
  if (updated > 0) {
    console.log('\n💡 Les thumbnails devraient maintenant être accessibles publiquement.')
    console.log('   Vous pouvez tester avec le script test-thumbnail-accessibility.js')
  }
  
  console.log('\n⚠️  Note: Ce script a traité seulement les 50 premières vidéos.')
  console.log('   Pour traiter toutes les vidéos, augmentez la limite dans le script.')
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

