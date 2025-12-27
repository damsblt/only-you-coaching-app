#!/usr/bin/env node
/**
 * Script pour épurer les vidéos en double dans la base de données
 * 
 * Ce script :
 * 1. Identifie les vidéos en double (même numéro de vidéo)
 * 2. Vérifie quelles vidéos sont utilisées dans les programmes (lib/program-orders.ts)
 * 3. Vérifie les références dans user_video_progress
 * 4. Supprime les doublons non utilisés (en mode DRY_RUN par défaut)
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DRY_RUN = process.argv.includes('--execute') ? false : true
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL non défini dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

// IDs utilisés dans les programmes (extraits de lib/program-orders.ts)
const USED_VIDEO_IDS = new Set([
  // Cuisses-Abdos
  '0a48b945-82bc-4661-8ce9-40eae4eaa4bf', // Vidéo 14
  'd1ac9a8b-bc01-4b51-97d9-90744e7af110', // Vidéo 7
  '4bf0e733-906f-4a79-ad1c-00e05c769a8c', // Vidéo 9
  'dacd849a-8eb5-4e35-8e25-0ab47ab370ec', // Vidéo 42
  '925d1dae-79ad-463a-91cd-f594a871427f', // Vidéo 67
  '1b5efb73-09a7-4b7d-be1e-0f5a3cc7db03', // Vidéo 46
  '43550373-247d-45e3-8e28-1ad3f3117bc0', // Vidéo 62
  '54d93405-205b-4572-b539-6c510dd74e69', // Vidéo 74
  
  // Cuisses-Abdos-Fessiers
  'b2cc15f1-8c5a-47a3-a0e8-2f7703504840', // Vidéo 14
  '4145a2a3-f9d6-40fd-b3f7-57653d30ff46', // Vidéo 7
  'b4e23c94-1842-4cb0-8535-e1ef593f193f', // Vidéo 9
  '602c9a37-4e58-4c25-b252-3507491e5a53', // Vidéo 42
  '867e0a01-56b9-49d5-92ef-8f3e2912461a', // Vidéo 46
  '5e21ea25-6534-4284-9adf-8283ed502020', // Vidéo 62
  '904550df-6447-4165-94fb-fb6425774e40', // Vidéo 74
  
  // Machine (ajouter d'autres si nécessaire)
  '3427a1c1-1d44-41af-9a6c-c8a4f19d8ecf',
  '0933d4c9-fbd4-47ee-9216-b8759700e045',
  '20426fe1-82a4-4e20-9408-58a7a325f95f',
  '893e464d-12e8-49e7-831b-1ba43d15907e',
  '22f4d0e9-3d9e-4539-aca3-04784afa66a2',
  'e93d32cb-d7b4-408d-a2af-712537cbee35',
  '7eced650-9c28-4f3b-8e6c-e1c39c544b2c',
  '6e36390f-1283-45b4-98d0-6ec3ab3a5034',
])

function extractVideoNumber(videoUrl) {
  try {
    const urlObj = new URL(videoUrl)
    const decoded = decodeURIComponent(urlObj.pathname)
    const match = decoded.match(/(?:^|\/)(\d+(?:\.\d+)?)\.+?\s/i)
    return match ? match[1] : null
  } catch (e) {
    return null
  }
}

async function checkVideoProgress(videoId) {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM user_video_progress
      WHERE video_id = ${videoId}
    `
    return parseInt(result[0]?.count || 0, 10)
  } catch (e) {
    // Table might not exist or have different structure
    return 0
  }
}

async function findDuplicates() {
  console.log('🔍 Recherche des vidéos en double...\n')
  
  const videos = await sql`
    SELECT id, title, region, "videoUrl", "createdAt"
    FROM videos_new
    WHERE "videoUrl" LIKE '%programmes-predefinis%'
      AND "videoUrl" LIKE '%.mp4'
    ORDER BY "createdAt" DESC
  `
  
  const byNumber = {}
  videos.forEach(video => {
    const num = extractVideoNumber(video.videoUrl)
    if (num) {
      if (!byNumber[num]) {
        byNumber[num] = []
      }
      byNumber[num].push(video)
    }
  })
  
  const duplicates = Object.entries(byNumber)
    .filter(([_, videos]) => videos.length > 1)
    .map(([num, videos]) => ({ num, videos }))
  
  return duplicates
}

async function analyzeDuplicates(duplicates) {
  console.log(`📊 ${duplicates.length} groupe(s) de vidéos en double trouvé(s)\n`)
  
  const toDelete = []
  const toKeep = []
  
  for (const { num, videos } of duplicates) {
    const used = videos.filter(v => USED_VIDEO_IDS.has(v.id))
    const unused = videos.filter(v => !USED_VIDEO_IDS.has(v.id))
    
    if (unused.length > 0) {
      console.log(`\n📹 Vidéo ${num} (${videos.length} occurrence(s)):`)
      
      // Vérifier les références dans user_video_progress
      for (const video of unused) {
        const progressCount = await checkVideoProgress(video.id)
        
        if (progressCount > 0) {
          console.log(`   ⚠️  ID ${video.id} (région: ${video.region})`)
          console.log(`      ⚠️  Utilisée dans user_video_progress (${progressCount} référence(s)) - NE PAS SUPPRIMER`)
          toKeep.push(video)
        } else {
          console.log(`   ❌ ID ${video.id} (région: ${video.region})`)
          console.log(`      ✅ Non utilisée dans les programmes et sans référence - À SUPPRIMER`)
          toDelete.push(video)
        }
      }
      
      used.forEach(video => {
        console.log(`   ✅ ID ${video.id} (région: ${video.region})`)
        console.log(`      ✅ Utilisée dans les programmes - À GARDER`)
        toKeep.push(video)
      })
    }
  }
  
  return { toDelete, toKeep }
}

async function deleteDuplicates(videosToDelete) {
  if (videosToDelete.length === 0) {
    console.log('\n✅ Aucune vidéo à supprimer')
    return
  }
  
  console.log(`\n🗑️  Suppression de ${videosToDelete.length} vidéo(s) en double...\n`)
  
  for (const video of videosToDelete) {
    try {
      if (DRY_RUN) {
        console.log(`   [DRY-RUN] Suppression: ${video.title} (ID: ${video.id})`)
      } else {
        await sql`DELETE FROM videos_new WHERE id = ${video.id}`
        console.log(`   ✅ Supprimée: ${video.title} (ID: ${video.id})`)
      }
    } catch (error) {
      console.error(`   ❌ Erreur lors de la suppression de ${video.id}:`, error.message)
    }
  }
}

async function main() {
  console.log('🧹 Épuration des vidéos en double\n')
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY-RUN (simulation)' : '⚡ EXECUTION'}\n`)
  
  try {
    const duplicates = await findDuplicates()
    
    if (duplicates.length === 0) {
      console.log('✅ Aucune vidéo en double trouvée')
      return
    }
    
    const { toDelete, toKeep } = await analyzeDuplicates(duplicates)
    
    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ À garder: ${toKeep.length}`)
    console.log(`   ❌ À supprimer: ${toDelete.length}`)
    
    if (toDelete.length > 0) {
      await deleteDuplicates(toDelete)
      
      if (DRY_RUN) {
        console.log(`\n💡 Pour exécuter réellement la suppression, utilisez: node scripts/cleanup-duplicate-videos.js --execute`)
      } else {
        console.log(`\n✅ Épuration terminée!`)
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()








