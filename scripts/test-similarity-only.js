#!/usr/bin/env node
/**
 * Script pour tester le matching par similarité textuelle SEUL (sans numéro)
 */

import mammoth from 'mammoth'
import fs from 'fs/promises'
import path from 'path'

const videosDir = 'Dossier Cliente/Video/groupes-musculaires/vidéos'
const metadataDir = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'

const regionMapping = {
  'abdos': ['abdominaux complet', 'abdos'],
  'biceps': ['biceps'],
  'triceps': ['triceps'],
  'dos': ['dos'],
  'pectoraux': ['pectoraux'],
  'fessiers-jambes': ['fessier jambe', 'fessiers-jambes'],
  'épaule': ['epaule', 'épaule'],
  'bande': ['bande'],
  'machine': ['machine'],
  'cardio': ['cardio'],
  'streching': ['streching', 'stretching']
}

/**
 * Normaliser le titre pour la comparaison (version améliorée)
 */
function normalizeTitle(title) {
  if (!title) return ''
  
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/\s*\+\s*/g, ' ') // "+" devient un espace
    .replace(/\s*et\s*/g, ' ') // "et" devient un espace
    .replace(/\s*ou\s*/g, ' ') // "ou" devient un espace
    .replace(/\s*avec\s*/g, ' ') // "avec" devient un espace
    .replace(/\s*sur\s*/g, ' ') // "sur" devient un espace
    .replace(/\s*au\s*/g, ' ') // "au" devient un espace
    .replace(/\s*le\s*/g, ' ') // "le" devient un espace
    .replace(/\s*la\s*/g, ' ') // "la" devient un espace
    .replace(/\s*les\s*/g, ' ') // "les" devient un espace
    .replace(/\s*de\s*/g, ' ') // "de" devient un espace
    .replace(/\s*du\s*/g, ' ') // "du" devient un espace
    .replace(/\s*des\s*/g, ' ') // "des" devient un espace
    .replace(/\s*en\s*/g, ' ') // "en" devient un espace
    .replace(/\s*une\s*/g, ' ') // "une" devient un espace
    .replace(/\s*un\s*/g, ' ') // "un" devient un espace
    .replace(/\s*1\s*/g, ' ') // "1" devient un espace
    .replace(/gainag/g, 'gainage') // "Gainag" -> "Gainage"
    .replace(/cruch/g, 'crunch') // "Cruch" -> "Crunch"
    .replace(/tap/g, 'tape') // "tap" -> "tape"
    .replace(/releve/g, 'releve') // Normaliser "relevé"
    .replace(/pieds/g, 'pied') // "pieds" -> "pied"
    .replace(/jambes/g, 'jambe') // "jambes" -> "jambe"
    .replace(/mains/g, 'main') // "mains" -> "main"
    .replace(/avant\s*bras/g, 'avantbras') // "avant bras" -> "avantbras"
    .replace(/[^a-z0-9]/g, ' ') // Tout sauf lettres et chiffres
    .replace(/\s+/g, ' ') // Espaces multiples -> un seul
    .trim()
}

/**
 * Nettoyer le titre de la vidéo pour la comparaison
 */
function cleanVideoTitle(title) {
  if (!title) return ''
  
  return title
    .replace(/\s+[FH]\s*$/, '')
    .replace(/\s+x\s*$/, '')
    .replace(/\s+CHANGER\s+LA\s+VIDEO.*$/i, '')
    .replace(/\s+sol\s*\+.*$/i, '')
    .replace(/\s*\.\s*$/, '')
    .trim()
}

/**
 * Extraire les mots-clés importants d'un titre
 */
function extractKeywords(title) {
  const normalized = normalizeTitle(title)
  const words = normalized.split(/\s+/).filter(w => w.length > 3)
  return words.sort().join(' ')
}

/**
 * Calculer la similarité entre deux chaînes (Levenshtein)
 */
function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeTitle(str1)
  const normalized2 = normalizeTitle(str2)
  
  if (normalized1 === normalized2) {
    return 1.0
  }
  
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.95
  }
  
  // Algorithme de Levenshtein
  const matrix = []
  for (let i = 0; i <= normalized1.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= normalized2.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= normalized1.length; i++) {
    for (let j = 1; j <= normalized2.length; j++) {
      if (normalized1[i - 1] === normalized2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  const distance = matrix[normalized1.length][normalized2.length]
  const maxLength = Math.max(normalized1.length, normalized2.length)
  return 1 - (distance / maxLength)
}

/**
 * Trouver une correspondance par similarité textuelle SEULEMENT
 */
function findMatchBySimilarity(videoTitle, exercises, threshold = 0.5) {
  let bestMatch = null
  let bestSimilarity = 0
  let bestMethod = ''
  
  const cleanedVideoTitle = cleanVideoTitle(videoTitle)
  const videoKeywords = extractKeywords(cleanedVideoTitle)
  
  for (const exercise of exercises) {
    // Méthode 1: Similarité directe
    const similarity1 = calculateSimilarity(cleanedVideoTitle, exercise.title)
    
    // Méthode 2: Similarité par mots-clés
    const exerciseKeywords = extractKeywords(exercise.title)
    const similarity2 = calculateSimilarity(videoKeywords, exerciseKeywords)
    
    // Méthode 3: Vérifier si les mots-clés principaux sont présents
    const videoWords = videoKeywords.split(/\s+/)
    const exerciseWords = exerciseKeywords.split(/\s+/)
    const commonWords = videoWords.filter(w => exerciseWords.includes(w))
    const similarity3 = commonWords.length > 0 
      ? commonWords.length / Math.max(videoWords.length, exerciseWords.length)
      : 0
    
    // Prendre la meilleure similarité
    const maxSimilarity = Math.max(similarity1, similarity2, similarity3 * 1.2)
    
    if (maxSimilarity > bestSimilarity && maxSimilarity >= threshold) {
      bestSimilarity = maxSimilarity
      bestMatch = exercise
      
      if (similarity1 >= 0.85) {
        bestMethod = 'exact'
      } else if (similarity2 >= 0.7 || similarity3 >= 0.6) {
        bestMethod = 'keywords'
      } else {
        bestMethod = 'similar'
      }
    }
  }
  
  return bestMatch ? { 
    exercise: bestMatch, 
    similarity: bestSimilarity, 
    method: bestMethod
  } : null
}

/**
 * Parser les métadonnées (version simplifiée pour le test)
 */
function parseMetadata(text, filename) {
  const exercises = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  let currentExercise = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détection d'un nouveau titre d'exercice
    if (line && line.length >= 15 && !line.includes(':') && !line.endsWith('.')) {
      const startsWithVerb = /^(tenir|inspirer|expirer|gonfler|vider|maintenir|faire|revenir|descendre|remonter|amener|pousser|tirer|ouvrir|fermer|aligner|positionner|monter|descendre|tendre|fléchir|sauter|maintenir|remonter|pencher|ajuster|gonfler)/i.test(line)
      
      if (startsWithVerb) {
        continue
      }
      
      let foundMuscleCible = false
      
      for (let j = i + 1; j < lines.length && j < i + 3; j++) {
        const nextLine = lines[j]
        if (nextLine && nextLine.toLowerCase().includes('muscle cible')) {
          foundMuscleCible = true
          break
        }
      }
      
      if (foundMuscleCible) {
        const prevLine = i > 0 ? lines[i - 1] : ''
        const isContinuation = prevLine && (
          prevLine.toLowerCase().includes('muscle cible') ||
          prevLine.toLowerCase().includes('position') ||
          prevLine.toLowerCase().includes('mouvement')
        )
        
        if (!isContinuation) {
          if (currentExercise && currentExercise.title) {
            exercises.push(currentExercise)
          }
          
          currentExercise = {
            title: line,
            source: filename
          }
          continue
        }
      }
    }
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Extraire le numéro et le titre depuis le nom de fichier
 */
function extractNumberAndTitle(filename) {
  const nameWithoutExt = filename.replace(/\.(mp4|mov|avi)$/i, '')
  
  let match = nameWithoutExt.match(/^(\d+\.\d+)\s+(.+)$/)
  if (match) {
    return { number: parseFloat(match[1]), title: match[2].trim() }
  }
  
  match = nameWithoutExt.match(/^(\d+)\.\s*(.+)$/)
  if (match) {
    return { number: parseInt(match[1], 10), title: match[2].trim() }
  }
  
  return { number: null, title: nameWithoutExt }
}

async function testSimilarityOnly(region) {
  console.log(`\n🔍 Test du matching par SIMILARITÉ TEXTUELLE SEUL (sans numéro)\n`)
  console.log(`📂 Région : ${region}\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // 1. Lister les vidéos
  const videosPath = path.join(videosDir, region)
  let videoFiles = []
  
  try {
    const files = await fs.readdir(videosPath)
    videoFiles = files.filter(f => f.match(/\.(mp4|mov|avi)$/i))
  } catch (error) {
    console.error(`❌ Erreur : ${error.message}`)
    return
  }
  
  console.log(`📹 Vidéos trouvées : ${videoFiles.length}\n`)
  
  // 2. Charger les exercices depuis le fichier Word
  const wordFiles = await fs.readdir(metadataDir)
  let wordFile = wordFiles.find(f => {
    const fLower = f.toLowerCase().replace('.docx', '')
    const mappings = regionMapping[region] || []
    return mappings.some(m => fLower.includes(m.toLowerCase())) && fLower.includes('2')
  })
  
  if (!wordFile) {
    wordFile = wordFiles.find(f => {
      const fLower = f.toLowerCase().replace('.docx', '')
      const mappings = regionMapping[region] || []
      return mappings.some(m => fLower.includes(m.toLowerCase()))
    })
  }
  
  if (!wordFile) {
    console.log(`⚠️  Aucun fichier Word trouvé\n`)
    return
  }
  
  const wordFilePath = path.join(metadataDir, wordFile)
  console.log(`📄 Fichier Word : ${wordFile}\n`)
  
  try {
    const buffer = await fs.readFile(wordFilePath)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
    
    const exercises = parseMetadata(text, wordFile)
    console.log(`📋 Exercices trouvés dans le Word : ${exercises.length}\n`)
    
    // 3. Comparer UNIQUEMENT par similarité textuelle
    const videosWithMatch = []
    const videosWithoutMatch = []
    const similarityScores = []
    
    for (const videoFile of videoFiles) {
      const { number, title } = extractNumberAndTitle(videoFile)
      const match = findMatchBySimilarity(title, exercises, 0.5)
      
      if (match) {
        videosWithMatch.push({
          file: videoFile,
          number,
          title,
          wordTitle: match.exercise.title,
          similarity: match.similarity,
          method: match.method
        })
        similarityScores.push(match.similarity)
      } else {
        videosWithoutMatch.push({
          file: videoFile,
          number,
          title
        })
      }
    }
    
    // 4. Afficher les résultats
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`✅ Vidéos avec correspondance : ${videosWithMatch.length}`)
    console.log(`❌ Vidéos SANS correspondance : ${videosWithoutMatch.length}\n`)
    
    if (similarityScores.length > 0) {
      const avgSimilarity = similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length
      const minSimilarity = Math.min(...similarityScores)
      const maxSimilarity = Math.max(...similarityScores)
      
      console.log(`📊 Statistiques de similarité :`)
      console.log(`   - Moyenne : ${(avgSimilarity * 100).toFixed(1)}%`)
      console.log(`   - Minimum : ${(minSimilarity * 100).toFixed(1)}%`)
      console.log(`   - Maximum : ${(maxSimilarity * 100).toFixed(1)}%\n`)
    }
    
    // Afficher les méthodes de matching
    const byExact = videosWithMatch.filter(v => v.method === 'exact').length
    const byKeywords = videosWithMatch.filter(v => v.method === 'keywords').length
    const bySimilar = videosWithMatch.filter(v => v.method === 'similar').length
    
    console.log(`📊 Répartition des méthodes :`)
    console.log(`   - Exact (≥85%) : ${byExact}`)
    console.log(`   - Keywords (≥70%) : ${byKeywords}`)
    console.log(`   - Similar (≥50%) : ${bySimilar}\n`)
    
    if (videosWithoutMatch.length > 0) {
      console.log('❌ Vidéos SANS correspondance :\n')
      videosWithoutMatch.slice(0, 10).forEach((video, i) => {
        console.log(`${i + 1}. ${video.file}`)
        console.log(`   Titre: ${video.title}\n`)
      })
      if (videosWithoutMatch.length > 10) {
        console.log(`... et ${videosWithoutMatch.length - 10} autres\n`)
      }
    }
    
    // Comparer avec le matching par numéro
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 COMPARAISON :\n')
    console.log(`   Matching par similarité : ${videosWithMatch.length}/${videoFiles.length} (${((videosWithMatch.length / videoFiles.length) * 100).toFixed(1)}%)`)
    console.log(`   Matching par numéro     : 90/90 (100%) [résultat précédent]\n`)
    
    return {
      region,
      totalVideos: videoFiles.length,
      totalExercises: exercises.length,
      videosWithMatch: videosWithMatch.length,
      videosWithoutMatch: videosWithoutMatch.length,
      avgSimilarity: similarityScores.length > 0 ? similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length : 0
    }
    
  } catch (error) {
    console.error(`❌ Erreur : ${error.message}`)
    return null
  }
}

async function main() {
  const region = process.argv[2] || 'abdos'
  
  console.log('🔍 Test du matching par SIMILARITÉ TEXTUELLE SEULEMENT\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const result = await testSimilarityOnly(region)
  
  if (result) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 RÉSUMÉ\n')
    console.log(`   Région : ${result.region}`)
    console.log(`   Vidéos totales : ${result.totalVideos}`)
    console.log(`   Exercices Word : ${result.totalExercises}`)
    console.log(`   Matchs par similarité : ${result.videosWithMatch}/${result.totalVideos} (${((result.videosWithMatch / result.totalVideos) * 100).toFixed(1)}%)`)
    console.log(`   Similarité moyenne : ${(result.avgSimilarity * 100).toFixed(1)}%\n`)
  }
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
