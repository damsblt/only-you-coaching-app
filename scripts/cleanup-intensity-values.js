#!/usr/bin/env node
/**
 * Script pour nettoyer les valeurs d'intensité dans Neon :
 * - Commence par une majuscule
 * - Pas de point à la fin
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

/**
 * Normaliser une valeur d'intensité
 */
function normalizeIntensity(intensity) {
  if (!intensity) return intensity
  // Enlever les ":" au début
  let cleaned = intensity.replace(/^:\s*/, '').trim()
  // Enlever les points à la fin
  cleaned = cleaned.replace(/\.+$/, '').trim()
  // Mettre une majuscule au début
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return cleaned
}

async function cleanupIntensityValues() {
  console.log('🧹 Nettoyage des valeurs d\'intensité dans Neon\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Récupérer toutes les vidéos avec une intensité
    console.log('📊 Récupération des vidéos avec intensité...\n')
    
    const videos = await sql`
      SELECT id, intensity
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND intensity IS NOT NULL
      AND intensity != ''
    `
    
    console.log(`   📋 ${videos.length} vidéos trouvées\n`)
    
    if (videos.length === 0) {
      console.log('✅ Aucune vidéo à nettoyer\n')
      return
    }
    
    // 2. Identifier les vidéos qui nécessitent un nettoyage
    let needsCleanup = 0
    const updates = []
    
    for (const video of videos) {
      const original = video.intensity
      const normalized = normalizeIntensity(original)
      
      if (original !== normalized) {
        needsCleanup++
        updates.push({
          id: video.id,
          original,
          normalized
        })
      }
    }
    
    console.log(`📊 Analyse:\n`)
    console.log(`   Total vidéos: ${videos.length}`)
    console.log(`   Nécessitent nettoyage: ${needsCleanup}\n`)
    
    if (needsCleanup === 0) {
      console.log('✅ Toutes les valeurs sont déjà normalisées !\n')
      return
    }
    
    // 3. Afficher quelques exemples
    console.log('📋 Exemples de corrections (10 premiers):\n')
    updates.slice(0, 10).forEach((update, i) => {
      console.log(`   ${i + 1}. "${update.original}" → "${update.normalized}"`)
    })
    if (updates.length > 10) {
      console.log(`   ... et ${updates.length - 10} autres\n`)
    } else {
      console.log('')
    }
    
    // 4. Demander confirmation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('⚠️  Vous allez mettre à jour les valeurs d\'intensité')
    console.log(`   ${needsCleanup} vidéos seront mises à jour\n`)
    console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 3 secondes...\n')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 5. Mettre à jour les valeurs
    console.log('🔄 Mise à jour des valeurs...\n')
    
    let updatedCount = 0
    let errorCount = 0
    
    for (const update of updates) {
      try {
        await sql`
          UPDATE videos_new
          SET intensity = ${update.normalized},
              "updatedAt" = NOW()
          WHERE id = ${update.id}
        `
        updatedCount++
      } catch (error) {
        console.error(`   ❌ Erreur lors de la mise à jour de ${update.id}:`, error.message)
        errorCount++
      }
    }
    
    // 6. Résumé final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✅ Nettoyage terminé !\n')
    console.log(`   ✅ ${updatedCount} valeurs mises à jour`)
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} erreurs`)
    }
    
    // 7. Vérification finale
    const finalCheck = await sql`
      SELECT COUNT(*) as count
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND intensity IS NOT NULL
      AND intensity != ''
      AND (
        intensity NOT SIMILAR TO '[A-Z]%' OR
        intensity LIKE '%.'
      )
    `
    
    const remainingIssues = Number(finalCheck[0].count)
    if (remainingIssues > 0) {
      console.log(`\n⚠️  ${remainingIssues} valeurs nécessitent encore un nettoyage\n`)
    } else {
      console.log('\n✅ Toutes les valeurs sont maintenant normalisées !\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

cleanupIntensityValues().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
