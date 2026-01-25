const { Pool } = require('pg')
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

async function checkS3FileExists(s3Key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: 'only-you-coaching',
      Key: s3Key
    }))
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('🔍 Diagnostic rapide des thumbnails...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get 20 random videos to check
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail,
        category
      FROM videos_new
      WHERE "isPublished" = true
      ORDER BY RANDOM()
      LIMIT 30
    `)

    console.log(`📋 Test de ${result.rows.length} vidéos aléatoires...\n`)

    let validCount = 0
    let invalidCount = 0
    const problems = []

    for (const video of result.rows) {
      let status = 'ok'
      let reason = ''

      if (!video.thumbnail || video.thumbnail.trim() === '') {
        status = 'problem'
        reason = 'NO_THUMBNAIL_URL'
        invalidCount++
        problems.push({ video, reason })
      } else {
        // Extract S3 key
        try {
          const url = new URL(video.thumbnail)
          let s3Key = decodeURIComponent(url.pathname.substring(1))

          // Check if file exists
          const exists = await checkS3FileExists(s3Key)
          
          if (!exists) {
            status = 'problem'
            reason = 'FILE_NOT_IN_S3'
            invalidCount++
            problems.push({ video, reason, s3Key, url: video.thumbnail })
          } else {
            validCount++
          }
        } catch (urlError) {
          status = 'problem'
          reason = 'INVALID_URL_FORMAT'
          invalidCount++
          problems.push({ video, reason })
        }
      }
    }

    console.log('📊 RÉSULTATS:')
    console.log(`   ✅ Thumbnails valides: ${validCount}/${result.rows.length}`)
    console.log(`   ❌ Thumbnails problématiques: ${invalidCount}/${result.rows.length}`)
    console.log(`   📊 Taux d'erreur: ${Math.round(invalidCount / result.rows.length * 100)}%\n`)

    if (problems.length > 0) {
      console.log(`\n❌ DÉTAIL DES PROBLÈMES:\n`)
      problems.forEach((p, i) => {
        console.log(`${i + 1}. "${p.video.title}"`)
        console.log(`   Catégorie: ${p.video.category}`)
        console.log(`   Problème: ${p.reason}`)
        if (p.s3Key) {
          console.log(`   S3 Key cherché: ${p.s3Key}`)
          console.log(`   URL: ${p.url.substring(0, 100)}...`)
        } else if (p.video.thumbnail) {
          console.log(`   URL: ${p.video.thumbnail.substring(0, 100)}`)
        }
        console.log()
      })

      console.log('\n💡 CONCLUSION:')
      if (problems.every(p => p.reason === 'FILE_NOT_IN_S3')) {
        console.log('   ⚠️  Les URLs existent mais les FICHIERS sont MANQUANTS dans S3')
        console.log('   📝 Solution: Corriger les chemins OU générer les thumbnails manquants')
      } else if (problems.some(p => p.reason === 'NO_THUMBNAIL_URL')) {
        console.log('   ⚠️  Certaines vidéos n\'ont pas d\'URL de thumbnail dans la base')
        console.log('   📝 Solution: Générer et assigner les thumbnails manquants')
      } else {
        console.log('   ⚠️  Problèmes mixtes détectés')
      }
    } else {
      console.log('✅ Tous les thumbnails testés sont valides!')
      console.log('💡 Si vous voyez encore des fallbacks, il peut y avoir:')
      console.log('   - Un problème de cache navigateur')
      console.log('   - Un problème avec les URLs signées')
      console.log('   - D\'autres vidéos non testées qui ont des problèmes')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
