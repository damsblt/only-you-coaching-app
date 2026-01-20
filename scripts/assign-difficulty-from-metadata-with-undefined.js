#!/usr/bin/env node
/**
 * Script pour attribuer les niveaux de difficulté UNIQUEMENT à partir des métadonnées
 * du fichier metadonnees-completes.md
 * 
 * - Met à jour les vidéos qui ont un niveau défini dans les métadonnées
 * - Met "indéfini" pour les vidéos MUSCLE_GROUPS qui n'ont pas de niveau dans les métadonnées
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

const METADATA_FILE = path.join(
  process.cwd(),
  'Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-completes.md'
)

/**
 * Normalise les valeurs d'intensité vers les valeurs standardisées
 */
function extractDifficultyFromIntensity(intensity) {
  if (!intensity) return null
  
  const lower = intensity.toLowerCase().trim()
  
  // Cas spéciaux : "Tout niveau" ne donne pas de niveau spécifique
  if (lower.includes('tout niveau') || lower.includes('tous niveaux')) {
    return null // Pas de niveau spécifique
  }
  
  // Extraire les niveaux mentionnés
  const hasBeginner = lower.includes('débutant') || lower.includes('debutant') || lower.includes('beginner')
  const hasIntermediate = lower.includes('intermédiaire') || lower.includes('intermediaire') || lower.includes('intermediate')
  const hasAdvanced = lower.includes('avancé') || lower.includes('avance') || lower.includes('advanced')
  
  // Si plusieurs niveaux sont mentionnés, on prend le plus élevé
  if (hasAdvanced) return 'ADVANCED'
  if (hasIntermediate && hasBeginner) return 'INTERMEDIATE' // Si les deux, on prend intermédiaire
  if (hasIntermediate) return 'INTERMEDIATE'
  if (hasBeginner) return 'BEGINNER'
  
  return null
}

/**
 * Parse le fichier de métadonnées et extrait les exercices avec leur intensité
 */
function parseMetadataFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const exercises = []
  
  const lines = content.split('\n')
  const intensityPattern = /Intensit[ée]\s*[\.:]\s*([^\n]+?)(?:\.|$)/i
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Chercher une ligne avec "Intensité"
    const intensityMatch = line.match(intensityPattern)
    if (intensityMatch) {
      const intensity = intensityMatch[1].trim()
      
      // Remonter pour trouver le titre de l'exercice
      let title = null
      let j = i - 1
      
      // Chercher "Muscle cible" ou "Position départ" pour trouver le début de la section
      let sectionStart = -1
      while (j >= 0 && j >= i - 50) {
        const prevLine = lines[j].trim()
        if (prevLine.match(/^(Muscle cible|Position départ)/i)) {
          sectionStart = j
          break
        }
        j--
      }
      
      if (sectionStart >= 0) {
        // Le titre est généralement juste avant "Muscle cible" ou "Position départ"
        let k = sectionStart - 1
        while (k >= 0 && k >= sectionStart - 15) {
          const candidateLine = lines[k].trim()
          
          // Ignorer les lignes vides, les séparateurs, les titres de section
          if (!candidateLine || candidateLine === '---' || candidateLine.startsWith('#') || 
              candidateLine.startsWith('**') || candidateLine.startsWith('Source') ||
              candidateLine.match(/^(Muscle cible|Position départ|Mouvement|Intensité|Série|Contre|Source|Date)/i)) {
            k--
            continue
          }
          
          // Vérifier que c'est un titre valide
          const invalidPatterns = [
            /^(Tenir|Monter|Descendre|Tirer|Fléchir|Tendre|Revenir|Allonger|Ouvrir|Fermer|Pousser|Lever|Baisser)/i,
            /^[A-Z][a-z]+\s+(les|la|le|un|une|des|du|de|à|en|sur|avec|sans|pour|par)\s+/i,
            /!$/,
            /^[A-Z][a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+/i,
            /^Thème\s*:/i // Ignorer les lignes "Thème"
          ]
          
          const isValidTitle = candidateLine.length > 5 && 
                               candidateLine.length < 100 &&
                               !invalidPatterns.some(pattern => pattern.test(candidateLine))
          
          if (isValidTitle) {
            // Vérifier qu'il y a une ligne vide avant (signe d'un nouveau titre)
            if (k === 0 || lines[k - 1].trim() === '') {
              title = candidateLine
              break
            }
          }
          
          k--
        }
      }
      
      if (title) {
        exercises.push({
          title: title,
          intensity: intensity
        })
      }
    }
  }
  
  return exercises
}

/**
 * Normalise un titre pour la comparaison
 */
function normalizeTitle(title) {
  if (!title) return ''
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Compare deux titres pour trouver une correspondance
 */
function titlesMatch(title1, title2) {
  if (!title1 || !title2) return false
  
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)
  
  // Correspondance exacte
  if (norm1 === norm2) return true
  
  // Correspondance partielle (un titre contient l'autre)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const diff = Math.abs(norm1.length - norm2.length)
    const minLength = Math.min(norm1.length, norm2.length)
    if (minLength > 0 && diff / minLength < 0.5) {
      return true
    }
  }
  
  // Correspondance par mots-clés (au moins 60% des mots en commun)
  const words1 = norm1.split(/\s+/).filter(w => w.length > 2)
  const words2 = norm2.split(/\s+/).filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return false
  
  const commonWords = words1.filter(w => words2.includes(w))
  const minWords = Math.min(words1.length, words2.length)
  
  if (minWords > 0 && commonWords.length / minWords >= 0.6) {
    return true
  }
  
  return false
}

async function assignDifficultyFromMetadata() {
  try {
    console.log('🔄 Attribution des niveaux depuis les métadonnées...\n')
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(METADATA_FILE)) {
      console.error(`❌ Fichier de métadonnées introuvable: ${METADATA_FILE}`)
      process.exit(1)
    }
    
    console.log(`📄 Lecture du fichier: ${METADATA_FILE}`)
    
    // Parser le fichier de métadonnées
    const exercises = parseMetadataFile(METADATA_FILE)
    console.log(`✅ ${exercises.length} exercices trouvés dans les métadonnées\n`)
    
    // Filtrer les exercices qui ont une intensité avec un niveau
    const exercisesWithLevel = exercises
      .map(ex => ({
        ...ex,
        difficulty: extractDifficultyFromIntensity(ex.intensity)
      }))
      .filter(ex => ex.difficulty !== null)
    
    console.log(`📊 ${exercisesWithLevel.length} exercices avec un niveau défini\n`)
    
    // Récupérer toutes les vidéos de la base de données
    const videos = await sql`
      SELECT 
        id,
        title,
        difficulty,
        intensity
      FROM videos_new
      WHERE "isPublished" = true
      AND "videoType" = 'MUSCLE_GROUPS'
      ORDER BY title
    `
    
    console.log(`📹 ${videos.length} vidéos MUSCLE_GROUPS trouvées dans la base de données\n`)
    
    // Créer un map des exercices par titre normalisé pour accélérer la recherche
    const exercisesByTitle = new Map()
    for (const exercise of exercisesWithLevel) {
      exercisesByTitle.set(normalizeTitle(exercise.title), exercise)
    }
    
    let matchedCount = 0
    let updatedCount = 0
    let undefinedCount = 0
    let skippedCount = 0
    const stats = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
      'indéfini': 0
    }
    
    // Pour chaque vidéo, chercher si elle a un niveau dans les métadonnées
    for (const video of videos) {
      let matchedExercise = null
      
      // Chercher une correspondance
      for (const exercise of exercisesWithLevel) {
        if (titlesMatch(exercise.title, video.title)) {
          matchedExercise = exercise
          break
        }
      }
      
      let newDifficulty = null
      
      if (matchedExercise) {
        // Niveau trouvé dans les métadonnées
        matchedCount++
        newDifficulty = matchedExercise.difficulty
      } else {
        // Pas de niveau dans les métadonnées -> mettre "indéfini"
        newDifficulty = 'indéfini'
      }
      
      // Vérifier si le niveau a changé
      const currentDifficulty = video.difficulty
      
      if (currentDifficulty === newDifficulty) {
        skippedCount++
        stats[newDifficulty]++
        continue
      }
      
      // Mettre à jour la vidéo
      await sql`
        UPDATE videos_new
        SET 
          difficulty = ${newDifficulty},
          "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      
      if (newDifficulty === 'indéfini') {
        console.log(`⚠️  ${video.title.substring(0, 50)}... → indéfini (pas dans métadonnées)`)
        undefinedCount++
      } else {
        console.log(`✅ ${video.title.substring(0, 50)}... → ${newDifficulty}`)
        updatedCount++
      }
      
      stats[newDifficulty]++
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(80))
    console.log(`   Exercices dans métadonnées: ${exercises.length}`)
    console.log(`   Exercices avec niveau: ${exercisesWithLevel.length}`)
    console.log(`   Vidéos correspondantes trouvées: ${matchedCount}`)
    console.log(`   ✅ Mises à jour avec niveau: ${updatedCount}`)
    console.log(`   ⚠️  Mises à jour avec "indéfini": ${undefinedCount}`)
    console.log(`   ⏭️  Déjà correct: ${skippedCount}`)
    console.log('\n📈 Répartition par niveau:')
    console.log(`   BEGINNER: ${stats.BEGINNER}`)
    console.log(`   INTERMEDIATE: ${stats.INTERMEDIATE}`)
    console.log(`   ADVANCED: ${stats.ADVANCED}`)
    console.log(`   indéfini: ${stats['indéfini']}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

assignDifficultyFromMetadata()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
