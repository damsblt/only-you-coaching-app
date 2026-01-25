#!/usr/bin/env node
/**
 * Script pour nettoyer les doublons de vidéos MUSCLE_GROUPS dans Neon
 * Garde la vidéo la plus récente pour chaque combinaison videoNumber + region
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

async function cleanupDuplicates() {
  console.log('🧹 Nettoyage des doublons de vidéos MUSCLE_GROUPS\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Identifier les doublons par videoNumber + region
    console.log('📊 Identification des doublons par videoNumber + region...\n')
    
    const duplicates = await sql`
      SELECT "videoNumber", region, COUNT(*) as count, 
             ARRAY_AGG(id ORDER BY "createdAt" DESC) as ids,
             ARRAY_AGG("createdAt" ORDER BY "createdAt" DESC) as created_dates
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "videoNumber" IS NOT NULL
      GROUP BY "videoNumber", region
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `
    
    console.log(`   ⚠️  ${duplicates.length} combinaisons videoNumber+region avec doublons\n`)
    
    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon trouvé !\n')
      return
    }
    
    // 2. Afficher les statistiques
    let totalDuplicates = 0
    let totalToKeep = 0
    let totalToDelete = 0
    
    duplicates.forEach(d => {
      const count = Number(d.count)
      totalDuplicates += count
      totalToKeep += 1
      totalToDelete += (count - 1)
    })
    
    console.log('📊 Statistiques :\n')
    console.log(`   Total vidéos en doublon : ${totalDuplicates}`)
    console.log(`   Vidéos à conserver : ${totalToKeep}`)
    console.log(`   Vidéos à supprimer : ${totalToDelete}\n`)
    
    // 3. Afficher les 10 premiers doublons
    console.log('📋 Exemples de doublons (10 premiers) :\n')
    duplicates.slice(0, 10).forEach((d, i) => {
      console.log(`   ${i + 1}. videoNumber: ${d.videoNumber}, region: ${d.region} → ${d.count} occurrences`)
    })
    console.log('')
    
    // 4. Demander confirmation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('⚠️  Vous allez supprimer les doublons')
    console.log(`   ${totalToDelete} vidéos seront supprimées`)
    console.log(`   ${totalToKeep} vidéos seront conservées (la plus récente de chaque groupe)\n`)
    console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n')
    
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 5. Supprimer les doublons (garder la plus récente)
    console.log('🗑️  Suppression des doublons...\n')
    
    let deletedCount = 0
    let errorCount = 0
    
    for (const duplicate of duplicates) {
      const ids = duplicate.ids
      const keepId = ids[0] // Garder la première (la plus récente car triée par createdAt DESC)
      const deleteIds = ids.slice(1) // Supprimer les autres
      
      for (const idToDelete of deleteIds) {
        try {
          await sql`
            DELETE FROM videos_new
            WHERE id = ${idToDelete}
            AND "videoType" = 'MUSCLE_GROUPS'
          `
          deletedCount++
        } catch (error) {
          console.error(`   ❌ Erreur lors de la suppression de ${idToDelete}:`, error.message)
          errorCount++
        }
      }
    }
    
    // 6. Vérifier les doublons par videoUrl aussi
    console.log('\n📊 Vérification des doublons par videoUrl...\n')
    
    const urlDuplicates = await sql`
      SELECT "videoUrl", COUNT(*) as count,
             ARRAY_AGG(id ORDER BY "createdAt" DESC) as ids
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "videoUrl" IS NOT NULL
      GROUP BY "videoUrl"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `
    
    if (urlDuplicates.length > 0) {
      console.log(`   ⚠️  ${urlDuplicates.length} URLs avec doublons\n`)
      
      let urlDeletedCount = 0
      for (const duplicate of urlDuplicates) {
        const ids = duplicate.ids
        const keepId = ids[0]
        const deleteIds = ids.slice(1)
        
        for (const idToDelete of deleteIds) {
          try {
            await sql`
              DELETE FROM videos_new
              WHERE id = ${idToDelete}
              AND "videoType" = 'MUSCLE_GROUPS'
            `
            urlDeletedCount++
          } catch (error) {
            console.error(`   ❌ Erreur lors de la suppression de ${idToDelete}:`, error.message)
            errorCount++
          }
        }
      }
      
      deletedCount += urlDeletedCount
      console.log(`   ✅ ${urlDeletedCount} doublons par URL supprimés\n`)
    } else {
      console.log('   ✅ Aucun doublon par URL\n')
    }
    
    // 7. Résumé final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✅ Nettoyage terminé !\n')
    console.log(`   ✅ ${deletedCount} doublons supprimés`)
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} erreurs`)
    }
    
    // 8. Vérification finale
    const finalCount = await sql`
      SELECT COUNT(*) as count
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
    `
    
    console.log(`\n📊 Total final de vidéos MUSCLE_GROUPS : ${finalCount[0].count}\n`)
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

cleanupDuplicates().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
