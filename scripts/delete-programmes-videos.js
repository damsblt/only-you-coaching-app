/**
 * Script pour supprimer les vidéos des programmes prédéfinis de S3 et Neon
 * 
 * Usage: node scripts/delete-programmes-videos.js [--dry-run]
 * 
 * Options:
 *   --dry-run: Affiche ce qui sera supprimé sans supprimer réellement
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const { S3Client, ListObjectsV2Command, DeleteObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

// Prefer Neon DATABASE_URL over Supabase
// Read .env.local file to get the last DATABASE_URL (which should be Neon)
const envPath = path.join(__dirname, '..', '.env.local')
let databaseUrl = process.env.DATABASE_URL

// If DATABASE_URL points to Supabase, try to find Neon URL in .env.local
if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const neonUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m)
    if (neonUrlMatch && neonUrlMatch[1].includes('neon.tech')) {
      databaseUrl = neonUrlMatch[1].trim().replace(/^["']|["']$/g, '')
      console.log('📌 Utilisation de l\'URL Neon trouvée dans .env.local\n')
    }
  } catch (error) {
    console.warn('⚠️  Impossible de lire .env.local, utilisation de DATABASE_URL par défaut')
  }
}

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const region = process.env.AWS_REGION || 'eu-north-1'

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

// Use pg Pool for direct PostgreSQL connection
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false
})

const s3Client = new S3Client({ region })

const isDryRun = process.argv.includes('--dry-run')

async function deleteProgrammesVideos() {
  console.log('🗑️  Suppression des vidéos programmes-predefinis...\n')
  
  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN: Aucune suppression ne sera effectuée\n')
  }
  
  try {
    // 1. Lister toutes les vidéos dans programmes-predefinis/ dans S3
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
          // Only include video files, not thumbnails
          if (obj.Key && obj.Key.match(/\.(mp4|mov|avi)$/i) && !obj.Key.includes('thumbnails/')) {
            s3Videos.push(obj.Key)
          }
        }
      }
      
      continuationToken = response.NextContinuationToken
    } while (continuationToken)
    
    console.log(`   ✅ ${s3Videos.length} vidéo(s) trouvée(s) dans S3\n`)
    
    // 2. Trouver les vidéos correspondantes dans Neon
    console.log('📋 2. Recherche des vidéos correspondantes dans Neon...')
    const neonVideos = []
    
    try {
      for (const s3Key of s3Videos) {
        const searchPattern = `%${s3Key}%`
        const result = await pool.query(
          'SELECT id, title, "videoUrl" FROM videos_new WHERE "videoUrl" LIKE $1',
          [searchPattern]
        )
        if (result.rows && result.rows.length > 0) {
          neonVideos.push({
            id: result.rows[0].id,
            title: result.rows[0].title,
            videoUrl: result.rows[0].videoUrl,
            s3Key
          })
        }
      }
      console.log(`   ✅ ${neonVideos.length} vidéo(s) trouvée(s) dans Neon\n`)
    } catch (dbError) {
      console.warn(`   ⚠️  Erreur de connexion à la base de données: ${dbError.message}`)
      console.warn(`   ⚠️  Continuons avec la suppression S3 uniquement...\n`)
    }
    
    // 3. Afficher le résumé
    console.log('📊 Résumé:\n')
    console.log(`   S3: ${s3Videos.length} vidéo(s)`)
    console.log(`   Neon: ${neonVideos.length} vidéo(s)`)
    console.log(`   À supprimer: ${s3Videos.length} vidéo(s) de S3, ${neonVideos.length} vidéo(s) de Neon\n`)
    
    if (s3Videos.length === 0 && neonVideos.length === 0) {
      console.log('✅ Aucune vidéo à supprimer')
      return
    }
    
    // 4. Demander confirmation (sauf en dry-run)
    if (!isDryRun) {
      console.log('⚠️  ATTENTION: Cette action est irréversible!')
      console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    // 5. Supprimer de S3
    if (s3Videos.length > 0) {
      console.log('🗑️  3. Suppression des vidéos de S3...')
      
      if (isDryRun) {
        console.log('   [DRY-RUN] Les vidéos suivantes seraient supprimées:')
        s3Videos.slice(0, 10).forEach(key => console.log(`     - ${key}`))
        if (s3Videos.length > 10) {
          console.log(`     ... et ${s3Videos.length - 10} autre(s)`)
        }
      } else {
        // Delete in batches of 1000 (S3 limit)
        const batchSize = 1000
        for (let i = 0; i < s3Videos.length; i += batchSize) {
          const batch = s3Videos.slice(i, i + batchSize)
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: batch.map(key => ({ Key: key }))
            }
          })
          
          const response = await s3Client.send(deleteCommand)
          console.log(`   ✅ Supprimé ${batch.length} vidéo(s) (batch ${Math.floor(i / batchSize) + 1})`)
          
          if (response.Errors && response.Errors.length > 0) {
            console.error('   ❌ Erreurs:', response.Errors)
          }
        }
        console.log(`   ✅ ${s3Videos.length} vidéo(s) supprimée(s) de S3\n`)
      }
    }
    
    // 6. Supprimer de Neon
    if (neonVideos.length > 0) {
      console.log('🗑️  4. Suppression des vidéos de Neon...')
      
      if (isDryRun) {
        console.log('   [DRY-RUN] Les vidéos suivantes seraient supprimées:')
        neonVideos.slice(0, 10).forEach(video => console.log(`     - ${video.title} (${video.id})`))
        if (neonVideos.length > 10) {
          console.log(`     ... et ${neonVideos.length - 10} autre(s)`)
        }
      } else {
        let deletedCount = 0
        for (const video of neonVideos) {
          try {
            await pool.query('DELETE FROM videos_new WHERE id = $1', [video.id])
            deletedCount++
            if (deletedCount % 10 === 0) {
              process.stdout.write(`   ✅ ${deletedCount}/${neonVideos.length} supprimée(s)...\r`)
            }
          } catch (error) {
            console.error(`   ❌ Erreur lors de la suppression de ${video.id}:`, error.message)
          }
        }
        console.log(`\n   ✅ ${deletedCount} vidéo(s) supprimée(s) de Neon\n`)
      }
    }
    
    // 7. Supprimer aussi les thumbnails associés
    console.log('🗑️  5. Suppression des thumbnails associés...')
    const thumbnailKeys = []
    
    for (const s3Key of s3Videos) {
      // Generate thumbnail key
      const pathParts = s3Key.split('/')
      pathParts.pop()
      const basePath = pathParts.join('/')
      const videoId = s3Key.split('/').pop().replace(/\.(mp4|mov|avi)$/i, '')
      const thumbnailKey = `thumbnails/${basePath}/${videoId}-thumb.jpg`
      thumbnailKeys.push(thumbnailKey)
    }
    
    if (isDryRun) {
      console.log(`   [DRY-RUN] ${thumbnailKeys.length} thumbnail(s) seraient supprimés`)
    } else {
      // Delete thumbnails
      const batchSize = 1000
      for (let i = 0; i < thumbnailKeys.length; i += batchSize) {
        const batch = thumbnailKeys.slice(i, i + batchSize)
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: batch.map(key => ({ Key: key }))
          }
        })
        
        await s3Client.send(deleteCommand)
      }
      console.log(`   ✅ ${thumbnailKeys.length} thumbnail(s) supprimé(s)\n`)
    }
    
    console.log('✅ Terminé!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

deleteProgrammesVideos()

