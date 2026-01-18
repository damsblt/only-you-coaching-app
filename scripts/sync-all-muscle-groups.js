/**
 * Script pour synchroniser toutes les vidéos de groupes musculaires depuis S3
 */

require('dotenv').config({ path: '.env.local' })
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const awsRegion = process.env.AWS_REGION || 'eu-west-3'
const s3BucketName = process.env.S3_BUCKET_NAME || 'only-you-coaching'

if (!databaseUrl || !awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const sql = neon(databaseUrl)
const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
})

// Régions à synchroniser
const muscleGroups = [
  { prefix: 'Video/groupes-musculaires/dos/', region: 'dos', displayName: 'Dos' },
  { prefix: 'Video/groupes-musculaires/pectoraux/', region: 'pectoraux', displayName: 'Pectoraux' },
  { prefix: 'Video/groupes-musculaires/abdos/', region: 'abdos', displayName: 'Abdos' },
  { prefix: 'Video/groupes-musculaires/biceps/', region: 'biceps', displayName: 'Biceps' },
  { prefix: 'Video/groupes-musculaires/triceps/', region: 'triceps', displayName: 'Triceps' },
  { prefix: 'Video/groupes-musculaires/epaules/', region: 'epaules', displayName: 'Épaules' },
  { prefix: 'Video/groupes-musculaires/streching/', region: 'streching', displayName: 'Stretching' },
  { prefix: 'Video/groupes-musculaires/cardio/', region: 'cardio', displayName: 'Cardio' },
  { prefix: 'Video/groupes-musculaires/bande/', region: 'bande', displayName: 'Bande' }
]

function buildS3Url(key) {
  return `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`
}

function generateTitle(filename) {
  const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function extractOrderFromTitle(title) {
  const match = title.match(/^(\d+(\.\d+)?)\.?\s*/)
  return match ? match[1] : null
}

async function syncMuscleGroup(groupInfo) {
  const { prefix, region, displayName } = groupInfo
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📦 Synchronisation: ${displayName} (${region})`)
  console.log(`${'='.repeat(60)}\n`)
  
  try {
    // Lister les fichiers S3
    const command = new ListObjectsV2Command({
      Bucket: s3BucketName,
      Prefix: prefix,
    })
    
    const response = await s3Client.send(command)
    const videoFiles = (response.Contents || []).filter(obj => {
      const key = obj.Key || ''
      return key.match(/\.(mp4|mov|avi|mkv)$/i) && !key.includes('/.') && !key.endsWith('/')
    })
    
    console.log(`📹 ${videoFiles.length} vidéos trouvées dans S3\n`)
    
    let syncedCount = 0
    let skippedCount = 0
    let updatedOrderCount = 0
    
    for (const obj of videoFiles) {
      try {
        const key = obj.Key || ''
        const filename = key.split('/').pop() || ''
        const videoUrl = buildS3Url(key)
        const title = generateTitle(filename)
        const order = extractOrderFromTitle(title)
        
        // Vérifier si la vidéo existe déjà
        const existingVideos = await sql`
          SELECT id FROM videos_new
          WHERE "videoUrl" LIKE ${'%' + key + '%'}
        `
        
        if (existingVideos && existingVideos.length > 0) {
          // Mise à jour de l'ordre si disponible
          if (order !== null) {
            await sql`
              UPDATE videos_new
              SET exo_title = ${order}, "updatedAt" = NOW()
              WHERE id = ${existingVideos[0].id}
            `
            updatedOrderCount++
          }
          console.log(`⏭️  Existe déjà: ${title}`)
          skippedCount++
          continue
        }
        
        // Insérer la nouvelle vidéo
        const now = new Date().toISOString()
        const muscleGroupsArray = [region]
        const targeted_muscles = []
        
        await sql`
          INSERT INTO videos_new (
            title, description, "videoUrl", thumbnail, duration,
            difficulty, category, region, "muscleGroups", targeted_muscles,
            "videoType", "isPublished", exo_title, "createdAt", "updatedAt"
          ) VALUES (
            ${title},
            ${'Exercice: ' + title},
            ${videoUrl},
            NULL,
            0,
            ${'intermediaire'},
            ${'Muscle Groups'},
            ${region},
            ${muscleGroupsArray}::text[],
            ${targeted_muscles}::text[],
            ${'MUSCLE_GROUPS'},
            true,
            ${order},
            ${now},
            ${now}
          )
        `
        
        console.log(`✅ Synchronisé: ${title}${order ? ` (ordre: ${order})` : ''}`)
        syncedCount++
        
      } catch (error) {
        console.error(`❌ Erreur pour ${obj.Key}:`, error.message)
      }
    }
    
    console.log(`\n📊 ${displayName} - Résumé:`)
    console.log(`   ✅ Nouvelles vidéos: ${syncedCount}`)
    console.log(`   ⏭️  Déjà existantes: ${skippedCount}`)
    console.log(`   🔢 Ordres mis à jour: ${updatedOrderCount}`)
    
    return { syncedCount, skippedCount, region, displayName }
    
  } catch (error) {
    console.error(`❌ Erreur lors de la synchronisation de ${displayName}:`, error)
    return { syncedCount: 0, skippedCount: 0, region, displayName, error: error.message }
  }
}

async function main() {
  console.log('\n🚀 Début de la synchronisation des groupes musculaires...\n')
  
  const results = []
  
  for (const group of muscleGroups) {
    const result = await syncMuscleGroup(group)
    results.push(result)
  }
  
  // Résumé global
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ GLOBAL')
  console.log(`${'='.repeat(60)}\n`)
  
  let totalSynced = 0
  let totalSkipped = 0
  
  results.forEach(r => {
    console.log(`${r.displayName.padEnd(15)} - ✅ ${r.syncedCount} nouvelles | ⏭️  ${r.skippedCount} existantes`)
    totalSynced += r.syncedCount
    totalSkipped += r.skippedCount
  })
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TOTAL: ${totalSynced} nouvelles vidéos synchronisées`)
  console.log(`       ${totalSkipped} vidéos déjà existantes`)
  console.log(`${'='.repeat(60)}\n`)
  
  console.log('✅ Synchronisation terminée!\n')
}

main()
