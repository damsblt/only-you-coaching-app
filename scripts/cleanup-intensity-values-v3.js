#!/usr/bin/env node
/**
 * Script pour normaliser les valeurs d'intensité selon les nouvelles règles :
 * - Enlever "Niveau" en début de phrase
 * - Corriger "Tour niveau" → "Tout niveau"
 * - Corriger "Tous les niveaux" → "Tout niveau"
 * - Normaliser "Niveau intermédiaire-avancé" → "Intermédiaire et avancé"
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
 * Normaliser une valeur d'intensité selon les règles spécifiées
 */
function normalizeIntensity(intensity) {
  if (!intensity) return intensity
  
  let normalized = intensity.trim()
  
  // 1. Enlever "Niveau" en début de phrase (insensible à la casse)
  normalized = normalized.replace(/^Niveau\s+/i, '')
  
  // 2. Corriger "Tour niveau" → "Tout niveau"
  normalized = normalized.replace(/^Tour niveau$/i, 'Tout niveau')
  
  // 3. Corriger "Tous les niveaux" → "Tout niveau"
  normalized = normalized.replace(/^Tous les niveaux$/i, 'Tout niveau')
  
  // 4. Normaliser "intermédiaire-avancé" → "Intermédiaire et avancé"
  normalized = normalized.replace(/^Intermédiaire-avancé$/i, 'Intermédiaire et avancé')
  normalized = normalized.replace(/^intermédiaire-avancé$/i, 'Intermédiaire et avancé')
  
  // 5. Normaliser "Avancé et intermédiaire" → "Intermédiaire et avancé" (ordre standard)
  if (normalized.match(/^Avancé\s+et\s+intermédiaire$/i)) {
    normalized = 'Intermédiaire et avancé'
  }
  
  // 6. Corriger "Intermédiaire et avancer" → "Intermédiaire et avancé" (faute d'orthographe)
  normalized = normalized.replace(/^Intermédiaire et avancer$/i, 'Intermédiaire et avancé')
  
  // 6. Mettre la première lettre en majuscule
  if (normalized.length > 0) {
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }
  
  return normalized.trim()
}

async function cleanupIntensities() {
  console.log('🔄 Nettoyage des valeurs d\'intensité...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Récupérer toutes les valeurs d'intensité uniques
    const intensities = await sql`
      SELECT DISTINCT intensity
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "isPublished" = true
      AND intensity IS NOT NULL
      AND intensity != ''
      ORDER BY intensity
    `
    
    console.log(`📋 ${intensities.length} valeurs d'intensité uniques trouvées\n`)
    
    // 2. Créer un mapping des anciennes valeurs vers les nouvelles valeurs
    const updates = []
    
    for (const row of intensities) {
      const oldValue = row.intensity
      const newValue = normalizeIntensity(oldValue)
      
      if (oldValue !== newValue) {
        updates.push({ old: oldValue, new: newValue })
        console.log(`   "${oldValue}" → "${newValue}"`)
      }
    }
    
    if (updates.length === 0) {
      console.log('✅ Toutes les valeurs sont déjà normalisées !\n')
      return
    }
    
    console.log(`\n📊 ${updates.length} valeurs à mettre à jour\n`)
    
    // 3. Mettre à jour chaque valeur
    let updatedCount = 0
    
    for (const update of updates) {
      // Compter avant la mise à jour
      const beforeCount = await sql`
        SELECT COUNT(*)::int as count
        FROM videos_new
        WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
        AND intensity = ${update.old}
      `
      
      const count = beforeCount && beforeCount.length > 0 ? beforeCount[0].count : 0
      
      if (count > 0) {
        // Mettre à jour
        await sql`
          UPDATE videos_new
          SET 
            intensity = ${update.new},
            "updatedAt" = NOW()
          WHERE "videoType" = 'MUSCLE_GROUPS'
          AND "isPublished" = true
          AND intensity = ${update.old}
        `
        
        updatedCount += count
        console.log(`   ✅ "${update.old}" → "${update.new}" (${count} vidéos)`)
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`✅ ${updatedCount} vidéos mises à jour\n`)
    
    // 4. Vérifier les valeurs finales
    const finalIntensities = await sql`
      SELECT DISTINCT intensity, COUNT(*) as count
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "isPublished" = true
      AND intensity IS NOT NULL
      AND intensity != ''
      GROUP BY intensity
      ORDER BY intensity
    `
    
    console.log('📋 Valeurs d\'intensité finales :\n')
    for (const row of finalIntensities) {
      console.log(`   "${row.intensity}" (${row.count} vidéos)`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

cleanupIntensities().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
