/**
 * Script pour analyser la différence entre les vidéos dans S3 et Neon
 * pour comprendre pourquoi il y a 57 vidéos dans S3 mais 143 dans Neon
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

// Prefer Neon DATABASE_URL over Supabase
const envPath = path.join(__dirname, '..', '.env.local')
let databaseUrl = process.env.DATABASE_URL

if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('DATABASE_URL=') && line.includes('neon.tech')) {
        databaseUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '')
        break
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de lire .env.local')
  }
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false
})

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'eu-north-1' 
})
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'

async function analyzeDifference() {
  console.log('🔍 Analyse de la différence entre S3 et Neon...\n')
  
  try {
    // 1. Lister les vidéos dans S3
    console.log('📋 1. Liste des vidéos dans S3...')
    const s3Videos = []
    let continuationToken = null
    
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'Video/programmes-predefinis/',
        ContinuationToken: continuationToken
      })
      
      const response = await s3Client.send(listCommand)
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Key.match(/\.(mp4|mov|avi)$/i) && !obj.Key.includes('thumbnails/')) {
            s3Videos.push(obj.Key)
          }
        }
      }
      
      continuationToken = response.NextContinuationToken
    } while (continuationToken)
    
    console.log(`   ✅ ${s3Videos.length} vidéo(s) trouvée(s) dans S3\n`)
    
    // 2. Lister les vidéos dans Neon
    console.log('📋 2. Liste des vidéos dans Neon...')
    const neonResult = await pool.query(`
      SELECT id, title, "videoUrl", region, category, "videoType"
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
    `)
    
    const neonVideos = neonResult.rows || []
    console.log(`   ✅ ${neonVideos.length} vidéo(s) trouvée(s) dans Neon\n`)
    
    // 3. Extraire les clés S3 des URLs Neon
    console.log('📋 3. Extraction des clés S3 depuis les URLs Neon...')
    const neonS3Keys = neonVideos.map(video => {
      try {
        const url = new URL(video.videoUrl)
        return url.pathname.substring(1) // Remove leading slash
      } catch (error) {
        return null
      }
    }).filter(key => key !== null)
    
    console.log(`   ✅ ${neonS3Keys.length} clé(s) S3 extraite(s) depuis Neon\n`)
    
    // 4. Comparer
    console.log('📊 4. Analyse des différences...\n')
    
    const s3KeysSet = new Set(s3Videos)
    const neonKeysSet = new Set(neonS3Keys)
    
    // Vidéos dans Neon mais pas dans S3
    const inNeonNotInS3 = neonS3Keys.filter(key => !s3KeysSet.has(key))
    console.log(`❌ Vidéos dans Neon mais PAS dans S3: ${inNeonNotInS3.length}`)
    if (inNeonNotInS3.length > 0) {
      console.log('   Exemples:')
      inNeonNotInS3.slice(0, 10).forEach(key => {
        const video = neonVideos.find(v => {
          try {
            return new URL(v.videoUrl).pathname.substring(1) === key
          } catch {
            return false
          }
        })
        console.log(`   - ${key}`)
        if (video) {
          console.log(`     Titre: ${video.title}`)
          console.log(`     Région: ${video.region || 'N/A'}`)
        }
        console.log('')
      })
      if (inNeonNotInS3.length > 10) {
        console.log(`   ... et ${inNeonNotInS3.length - 10} autre(s)\n`)
      }
    }
    
    // Vidéos dans S3 mais pas dans Neon
    const inS3NotInNeon = s3Videos.filter(key => !neonKeysSet.has(key))
    console.log(`\n✅ Vidéos dans S3 mais PAS dans Neon: ${inS3NotInNeon.length}`)
    if (inS3NotInNeon.length > 0) {
      console.log('   Exemples:')
      inS3NotInNeon.slice(0, 10).forEach(key => {
        console.log(`   - ${key}`)
      })
      if (inS3NotInNeon.length > 10) {
        console.log(`   ... et ${inS3NotInNeon.length - 10} autre(s)\n`)
      }
    }
    
    // Doublons dans Neon (même clé S3)
    const duplicateKeys = []
    const seenKeys = new Set()
    neonS3Keys.forEach(key => {
      if (seenKeys.has(key)) {
        duplicateKeys.push(key)
      } else {
        seenKeys.add(key)
      }
    })
    
    if (duplicateKeys.length > 0) {
      console.log(`\n⚠️  Doublons détectés dans Neon: ${duplicateKeys.length} clé(s) en double`)
      console.log('   Exemples:')
      duplicateKeys.slice(0, 5).forEach(key => {
        const videos = neonVideos.filter(v => {
          try {
            return new URL(v.videoUrl).pathname.substring(1) === key
          } catch {
            return false
          }
        })
        console.log(`   - ${key} (${videos.length} entrée(s) dans Neon)`)
        videos.forEach(v => {
          console.log(`     * ${v.title} (ID: ${v.id})`)
        })
        console.log('')
      })
    }
    
    // Statistiques par région
    console.log('\n📊 5. Statistiques par région dans Neon:\n')
    const regionStats = {}
    neonVideos.forEach(video => {
      const region = video.region || 'unknown'
      regionStats[region] = (regionStats[region] || 0) + 1
    })
    
    Object.entries(regionStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([region, count]) => {
        console.log(`   ${region}: ${count} vidéo(s)`)
      })
    
    // Résumé
    console.log('\n📊 Résumé:\n')
    console.log(`   S3: ${s3Videos.length} vidéo(s)`)
    console.log(`   Neon: ${neonVideos.length} vidéo(s)`)
    console.log(`   Différence: ${neonVideos.length - s3Videos.length} vidéo(s)`)
    console.log(`   Dans Neon mais pas S3: ${inNeonNotInS3.length}`)
    console.log(`   Dans S3 mais pas Neon: ${inS3NotInNeon.length}`)
    if (duplicateKeys.length > 0) {
      console.log(`   Doublons dans Neon: ${duplicateKeys.length}`)
    }
    
    console.log('\n💡 Explications possibles:')
    console.log('   1. Vidéos supprimées de S3 mais pas de Neon (anciennes vidéos)')
    console.log('   2. Doublons dans Neon (même vidéo enregistrée plusieurs fois)')
    console.log('   3. URLs différentes (anciennes URLs vs nouvelles)')
    console.log('   4. Vidéos synchronisées depuis d\'autres sources')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

analyzeDifference()















