#!/usr/bin/env node

/**
 * Script pour vérifier si les thumbnails existent dans S3
 */

const { createClient } = require('@supabase/supabase-js')
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3')
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
 * Extrait la clé S3 depuis l'URL (essaye les deux versions : encodée et décodée)
 */
function extractS3Key(url) {
  try {
    const urlObj = new URL(url)
    const encodedKey = urlObj.pathname.substring(1) // Enlever le slash initial
    const decodedKey = decodeURIComponent(encodedKey)
    return { encoded: encodedKey, decoded: decodedKey }
  } catch (error) {
    return null
  }
}

/**
 * Vérifie si un objet existe dans S3 (essaye les deux versions : encodée et décodée)
 */
async function checkS3ObjectExists(keys) {
  // Essayer d'abord la version décodée (la plus probable)
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: keys.decoded,
    })
    await s3Client.send(command)
    return { exists: true, key: keys.decoded, error: null }
  } catch (error) {
    if (error.name === 'NotFound') {
      // Essayer la version encodée
      try {
        const command2 = new HeadObjectCommand({
          Bucket: bucketName,
          Key: keys.encoded,
        })
        await s3Client.send(command2)
        return { exists: true, key: keys.encoded, error: null }
      } catch (error2) {
        return { exists: false, key: null, error: error2.name || error2.message }
      }
    }
    return { exists: false, key: null, error: error.name || error.message }
  }
}

async function main() {
  console.log('🔍 Vérification des thumbnails dans S3...\n')

  // Récupérer quelques vidéos avec leurs thumbnails
  const { data: videos, error } = await supabase
    .from('videos_new')
    .select('id, title, thumbnail')
    .eq('isPublished', true)
    .not('thumbnail', 'is', null)
    .limit(10)

  if (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }

  console.log(`📥 Vérification de ${videos.length} thumbnails...\n`)

  let exists = 0
  let notExists = 0

  for (const video of videos) {
    const s3Keys = extractS3Key(video.thumbnail)
    if (!s3Keys) {
      console.log(`📹 ${video.title}`)
      console.log(`   ❌ Impossible d'extraire la clé S3`)
      notExists++
      continue
    }

    console.log(`📹 ${video.title}`)
    console.log(`   Clé encodée: ${s3Keys.encoded.substring(0, 60)}...`)
    console.log(`   Clé décodée: ${s3Keys.decoded.substring(0, 60)}...`)
    
    const result = await checkS3ObjectExists(s3Keys)
    
    if (result.exists) {
      exists++
      console.log(`   ✅ Existe dans S3 (clé utilisée: ${result.key.substring(0, 60)}...)`)
    } else {
      notExists++
      console.log(`   ❌ N'existe pas dans S3 (${result.error})`)
    }
    console.log()
  }

  console.log('='.repeat(50))
  console.log('📊 Résumé:')
  console.log(`   ✅ Existent dans S3: ${exists}`)
  console.log(`   ❌ N'existent pas: ${notExists}`)
  console.log(`   📊 Total: ${videos.length}`)
  console.log('='.repeat(50))
  
  if (notExists > 0) {
    console.log('\n💡 Les fichiers n\'existent pas dans S3 aux chemins attendus.')
    console.log('   Cela peut expliquer pourquoi ils ne sont pas accessibles publiquement.')
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

