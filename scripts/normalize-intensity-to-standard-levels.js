#!/usr/bin/env node
/**
 * Script pour normaliser toutes les valeurs d'intensité vers les 7 niveaux standardisés :
 * - Tout niveau
 * - Débutant
 * - Débutant et intermédiaire
 * - Intermédiaire
 * - Intermédiaire et avancé
 * - Avancé
 * - Très Avancé
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
 * Valeurs standardisées acceptées
 */
const STANDARD_LEVELS = [
  'Tout niveau',
  'Débutant',
  'Débutant et intermédiaire',
  'Intermédiaire',
  'Intermédiaire et avancé',
  'Avancé',
  'Très Avancé'
]

/**
 * Normaliser une valeur d'intensité vers une des valeurs standardisées
 */
function normalizeToStandardLevel(intensity) {
  if (!intensity) return 'Tout niveau' // Par défaut
  
  let normalized = intensity.trim()
  
  // Normaliser en minuscules pour la comparaison (sauf pour "Très Avancé")
  const lower = normalized.toLowerCase()
  
  // 1. "Tout niveau" et variantes
  if (lower.includes('tout niveau') || lower.includes('tous les niveaux') || 
      lower.includes('tour niveau') || lower === 'tout niveau' || 
      lower === 'tous les niveaux' || lower === 'tour niveau') {
    return 'Tout niveau'
  }
  
  // 2. "Très Avancé" (avec majuscule au A)
  if (lower.includes('très avancé') || lower.includes('tres avance') || 
      lower === 'très avancé' || lower === 'tres avance') {
    return 'Très Avancé'
  }
  
  // 3. "Avancé" seul (pas "Très Avancé", pas "Intermédiaire et avancé")
  if ((lower === 'avancé' || lower === 'avance') && 
      !lower.includes('intermédiaire') && !lower.includes('intermediaire') &&
      !lower.includes('très') && !lower.includes('tres')) {
    return 'Avancé'
  }
  
  // 4. "Débutant et intermédiaire"
  if ((lower.includes('débutant') || lower.includes('debutant')) && 
      (lower.includes('intermédiaire') || lower.includes('intermediaire'))) {
    return 'Débutant et intermédiaire'
  }
  
  // 5. "Intermédiaire et avancé" (dans cet ordre ou l'inverse)
  if ((lower.includes('intermédiaire') || lower.includes('intermediaire')) && 
      (lower.includes('avancé') || lower.includes('avance'))) {
    // Vérifier l'ordre : si "avancé" vient avant "intermédiaire", c'est "Avancé et intermédiaire" → normaliser
    if (lower.includes('avancé et intermédiaire') || lower.includes('avance et intermediaire')) {
      return 'Intermédiaire et avancé'
    }
    // Sinon, c'est déjà dans le bon ordre ou avec un tiret
    if (lower.includes('intermédiaire-avancé') || lower.includes('intermediaire-avance') ||
        lower.includes('intermédiaire et avancé') || lower.includes('intermediaire et avance') ||
        lower.includes('intermédiaire et avancer') || lower.includes('intermediaire et avancer')) {
      return 'Intermédiaire et avancé'
    }
    return 'Intermédiaire et avancé'
  }
  
  // 6. "Débutant" seul
  if ((lower === 'débutant' || lower === 'debutant') && 
      !lower.includes('intermédiaire') && !lower.includes('intermediaire')) {
    return 'Débutant'
  }
  
  // 7. "Intermédiaire" seul
  if ((lower === 'intermédiaire' || lower === 'intermediaire') && 
      !lower.includes('avancé') && !lower.includes('avance') &&
      !lower.includes('débutant') && !lower.includes('debutant')) {
    return 'Intermédiaire'
  }
  
  // 8. Enlever "Niveau" au début si présent
  normalized = normalized.replace(/^Niveau\s+/i, '')
  normalized = normalized.trim()
  
  // Réessayer avec la valeur nettoyée
  if (normalized !== intensity.trim()) {
    return normalizeToStandardLevel(normalized)
  }
  
  // Par défaut, si on ne peut pas mapper, retourner "Tout niveau"
  console.warn(`⚠️  Valeur non mappée: "${intensity}" → "Tout niveau" (par défaut)`)
  return 'Tout niveau'
}

async function normalizeAllIntensities() {
  console.log('🔄 Normalisation de toutes les valeurs d\'intensité vers les niveaux standardisés...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Récupérer toutes les valeurs d'intensité uniques
    const intensities = await sql`
      SELECT DISTINCT intensity, COUNT(*)::int as count
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "isPublished" = true
      AND intensity IS NOT NULL
      AND intensity != ''
      GROUP BY intensity
      ORDER BY intensity
    `
    
    console.log(`📋 ${intensities.length} valeurs d'intensité uniques trouvées\n`)
    
    // 2. Créer un mapping des anciennes valeurs vers les nouvelles valeurs standardisées
    const mappings = []
    
    for (const row of intensities) {
      const oldValue = row.intensity
      const newValue = normalizeToStandardLevel(oldValue)
      
      if (oldValue !== newValue) {
        mappings.push({ 
          old: oldValue, 
          new: newValue,
          count: row.count
        })
      }
    }
    
    if (mappings.length === 0) {
      console.log('✅ Toutes les valeurs sont déjà normalisées !\n')
      
      // Vérifier que toutes les valeurs sont dans les standards
      const allStandard = intensities.every(row => 
        STANDARD_LEVELS.includes(row.intensity)
      )
      
      if (allStandard) {
        console.log('✅ Toutes les valeurs correspondent aux niveaux standardisés !\n')
        return
      } else {
        console.log('⚠️  Certaines valeurs ne correspondent pas aux standards :\n')
        intensities.forEach(row => {
          if (!STANDARD_LEVELS.includes(row.intensity)) {
            console.log(`   "${row.intensity}" (${row.count} vidéos)`)
          }
        })
      }
    }
    
    console.log(`📊 ${mappings.length} valeurs à normaliser :\n`)
    mappings.forEach(m => {
      console.log(`   "${m.old}" → "${m.new}" (${m.count} vidéos)`)
    })
    console.log('')
    
    // 3. Mettre à jour chaque valeur
    let totalUpdated = 0
    
    for (const mapping of mappings) {
      const result = await sql`
        UPDATE videos_new
        SET 
          intensity = ${mapping.new},
          "updatedAt" = NOW()
        WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
        AND intensity = ${mapping.old}
      `
      
      totalUpdated += mapping.count
      console.log(`   ✅ "${mapping.old}" → "${mapping.new}" (${mapping.count} vidéos)`)
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`✅ ${totalUpdated} vidéos mises à jour\n`)
    
    // 4. Vérifier les valeurs finales
    const finalIntensities = await sql`
      SELECT DISTINCT intensity, COUNT(*)::int as count
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
      const isStandard = STANDARD_LEVELS.includes(row.intensity)
      const marker = isStandard ? '✅' : '⚠️'
      console.log(`   ${marker} "${row.intensity}" (${row.count} vidéos)`)
    }
    
    // 5. Vérifier que toutes les valeurs sont standardisées
    const nonStandard = finalIntensities.filter(row => !STANDARD_LEVELS.includes(row.intensity))
    if (nonStandard.length > 0) {
      console.log('\n⚠️  Valeurs non standardisées restantes :\n')
      nonStandard.forEach(row => {
        console.log(`   "${row.intensity}" (${row.count} vidéos)`)
      })
    } else {
      console.log('\n✅ Toutes les valeurs sont standardisées !\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

normalizeAllIntensities().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
