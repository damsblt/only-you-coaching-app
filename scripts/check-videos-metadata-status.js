#!/usr/bin/env node
/**
 * Script pour vérifier l'état des métadonnées des vidéos
 * 
 * Génère deux listes :
 * 1. Vidéos sans correspondance avec les fichiers Word
 * 2. Vidéos avec métadonnées manquantes (même partiellement)
 * 
 * Usage: node scripts/check-videos-metadata-status.js
 */

import { neon } from '@neondatabase/serverless'
import ws from 'ws'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import mammoth from 'mammoth'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Configure Neon for Node.js
if (typeof window === 'undefined') {
  const { neonConfig } = await import('@neondatabase/serverless')
  neonConfig.webSocketConstructor = ws
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(databaseUrl)

const metadataDir = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'

// Mapping des régions
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
    // Remplacer les variations communes
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
    // Corriger les fautes communes
    .replace(/gainag/g, 'gainage') // "Gainag" -> "Gainage"
    .replace(/cruch/g, 'crunch') // "Cruch" -> "Crunch"
    .replace(/tap/g, 'tape') // "tap" -> "tape"
    .replace(/releve/g, 'releve') // Normaliser "relevé"
    .replace(/pieds/g, 'pied') // "pieds" -> "pied" (singulier)
    .replace(/jambes/g, 'jambe') // "jambes" -> "jambe"
    .replace(/mains/g, 'main') // "mains" -> "main"
    .replace(/avant\s*bras/g, 'avantbras') // "avant bras" -> "avantbras"
    .replace(/avant\s*bas/g, 'avantbas') // Variante
    // Supprimer les caractères spéciaux et espaces multiples
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
    // Enlever les annotations à la fin (F, H, x, etc.)
    .replace(/\s+[FH]\s*$/, '')
    .replace(/\s+x\s*$/, '')
    .replace(/\s+CHANGER\s+LA\s+VIDEO.*$/i, '')
    .replace(/\s+sol\s*\+.*$/i, '') // Enlever "sol +" à la fin
    .replace(/\s*\.\s*$/, '') // Enlever le point final
    .trim()
}

/**
 * Extraire les mots-clés importants d'un titre
 */
function extractKeywords(title) {
  const normalized = normalizeTitle(title)
  // Garder seulement les mots significatifs (plus de 3 caractères)
  const words = normalized.split(/\s+/).filter(w => w.length > 3)
  return words.sort().join(' ')
}

/**
 * Calculer la similarité entre deux titres
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
  
  // Algorithme de Levenshtein simplifié
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
 * Parser les métadonnées d'un fichier Word
 */
function parseMetadata(text, filename) {
  const exercises = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  let currentExercise = null
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Ignorer les lignes qui sont clairement des instructions ou des notes
    const isInstruction = line.toLowerCase().match(/^(tenir|inspirer|expirer|gonfler|vider|maintenir|faire|revenir|descendre|remonter|amener|pousser|tirer|ouvrir|fermer|aligner|positionner)/i)
    const isTooShort = line.length < 10
    const isNote = line.toLowerCase().includes('cet exercice') || line.toLowerCase().includes('déconseillé')
    const isSectionHeader = line.toLowerCase().match(/^(muscle|position|mouvement|intensité|série|contre|thème|texte pour)/i)
    
    if (isInstruction || isTooShort || isNote || isSectionHeader) {
      // Si on est dans un exercice, continuer à parser les sections
      if (currentExercise) {
        // Continuer le parsing des sections
      } else {
        continue
      }
    }
    
    // Détection d'un nouveau titre d'exercice
    // Un titre doit être suivi DIRECTEMENT de "Muscle cible" (dans la ligne suivante ou celle d'après)
    // Ignorer les lignes qui sont des instructions ou des notes
    if (line && line.length >= 15 && !line.includes(':') && !line.endsWith('.')) {
      // Ignorer les lignes qui commencent par des verbes d'action (instructions)
      const startsWithVerb = /^(tenir|inspirer|expirer|gonfler|vider|maintenir|faire|revenir|descendre|remonter|amener|pousser|tirer|ouvrir|fermer|aligner|positionner|monter|descendre|tendre|fléchir|sauter|maintenir|remonter|pencher|ajuster|gonfler)/i.test(line)
      
      if (startsWithVerb) {
        continue
      }
      
      let foundMuscleCible = false
      let linesToCheck = 0
      
      // Chercher "Muscle cible" dans les 2 prochaines lignes non vides UNIQUEMENT
      for (let j = i + 1; j < lines.length && j < i + 3; j++) {
        const nextLine = lines[j]
        if (nextLine && nextLine.toLowerCase().includes('muscle cible')) {
          foundMuscleCible = true
          linesToCheck = j - i
          break
        }
      }
      
      // Un titre d'exercice doit être suivi de "Muscle cible" dans la ligne suivante ou celle d'après (max 2 lignes)
      if (foundMuscleCible && linesToCheck <= 2) {
        // Vérifier que la ligne précédente n'était pas déjà un exercice (éviter les doublons)
        const prevLine = i > 0 ? lines[i - 1] : ''
        const isContinuation = prevLine && (
          prevLine.toLowerCase().includes('muscle cible') ||
          prevLine.toLowerCase().includes('position') ||
          prevLine.toLowerCase().includes('mouvement')
        )
        
        if (!isContinuation) {
          // Sauvegarder l'exercice précédent
          if (currentExercise && currentExercise.title) {
            exercises.push(currentExercise)
          }
          
          // Nouveau exercice
          currentExercise = {
            title: line,
            muscleGroups: [],
            targetedMuscles: [],
            startingPosition: '',
            movement: '',
            intensity: '',
            series: '',
            constraints: '',
            theme: '',
            source: filename
          }
          currentSection = null
          continue
        }
      }
    }
    
    if (!currentExercise) continue
    
    // Parser les différentes sections
    if (line.toLowerCase().includes('muscle cible')) {
      currentSection = 'muscles'
      const muscles = line.split(':')[1]
      if (muscles) {
        currentExercise.targetedMuscles = muscles.split(',').map(m => m.trim()).filter(m => m)
      }
    } else if (line.toLowerCase().includes('position départ') || line.toLowerCase().includes('position de départ')) {
      currentSection = 'startingPosition'
    } else if (line.toLowerCase().includes('mouvement')) {
      currentSection = 'movement'
    } else if (line.toLowerCase().includes('intensité')) {
      currentSection = 'intensity'
      const intensity = line.split(/[:.]/)[1]
      if (intensity) {
        currentExercise.intensity = intensity.trim()
      }
    } else if (line.toLowerCase().includes('série')) {
      currentSection = 'series'
      const series = line.split(':')[1]
      if (series) {
        currentExercise.series = series.trim()
      }
    } else if (line.toLowerCase().includes('contre') && line.toLowerCase().includes('indication')) {
      currentSection = 'constraints'
      const constraints = line.split(':')[1]
      if (constraints) {
        currentExercise.constraints = constraints.trim()
      }
    } else if (line.toLowerCase().includes('thème')) {
      currentSection = 'theme'
      const theme = line.split(':')[1]
      if (theme) {
        currentExercise.theme = theme.trim()
      }
    } else if (line && currentSection) {
      // Ajouter le contenu à la section courante
      switch (currentSection) {
        case 'muscles':
          if (!line.toLowerCase().includes('muscle cible')) {
            const muscles = line.split(',').map(m => m.trim()).filter(m => m && !m.toLowerCase().includes('muscle'))
            currentExercise.targetedMuscles.push(...muscles)
          }
          break
        case 'startingPosition':
          if (!line.toLowerCase().includes('position')) {
            currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + line
          }
          break
        case 'movement':
          if (!line.toLowerCase().includes('mouvement')) {
            currentExercise.movement += (currentExercise.movement ? ' ' : '') + line
          }
          break
        case 'intensity':
          if (!line.toLowerCase().includes('intensité')) {
            currentExercise.intensity += (currentExercise.intensity ? ' ' : '') + line
          }
          break
        case 'series':
          if (!line.toLowerCase().includes('série')) {
            currentExercise.series += (currentExercise.series ? ' ' : '') + line
          }
          break
        case 'constraints':
          if (!line.toLowerCase().includes('indication')) {
            currentExercise.constraints += (currentExercise.constraints ? ' ' : '') + line
          }
          break
        case 'theme':
          if (!line.toLowerCase().includes('thème')) {
            currentExercise.theme += (currentExercise.theme ? ' ' : '') + line
          }
          break
      }
    }
  }
  
  // Ajouter le dernier exercice
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Charger tous les exercices depuis les fichiers Word
 */
async function loadExercisesFromWord() {
  console.log('📖 Chargement des exercices depuis les fichiers Word...\n')
  
  const files = await fs.readdir(metadataDir)
  // Filtrer les fichiers Word, en préférant les fichiers "2" s'ils existent
  const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
  
  // Grouper par région et préférer les fichiers "2"
  const filesByRegion = new Map()
  for (const file of docxFiles) {
    const fileLower = file.toLowerCase().replace('.docx', '')
    for (const [region, mappings] of Object.entries(regionMapping)) {
      if (mappings.some(m => fileLower.includes(m.toLowerCase()))) {
        const existing = filesByRegion.get(region)
        // Préférer le fichier "2" s'il existe
        if (!existing || (fileLower.includes('2') && !existing.toLowerCase().includes('2'))) {
          filesByRegion.set(region, file)
        }
        break
      }
    }
  }
  
  const filesToProcess = Array.from(filesByRegion.values())
  console.log(`📂 ${filesToProcess.length} fichiers Word à traiter (fichiers "2" préférés)\n`)
  
  const allExercises = []
  
  for (const file of filesToProcess) {
    const filePath = path.join(metadataDir, file)
    
    try {
      const buffer = await fs.readFile(filePath)
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value
      
      const exercises = parseMetadata(text, file)
      
      // Déterminer la région depuis le nom du fichier
      const fileNameLower = file.toLowerCase().replace('.docx', '')
      let region = null
      
      for (const [key, values] of Object.entries(regionMapping)) {
        if (values.some(v => fileNameLower.includes(v))) {
          region = key
          break
        }
      }
      
      exercises.forEach(ex => {
        ex.region = region
        allExercises.push(ex)
      })
      
      console.log(`   ✅ ${file}: ${exercises.length} exercices (région: ${region || 'non déterminée'})`)
    } catch (error) {
      console.error(`   ❌ Erreur lors de la lecture de ${file}:`, error.message)
    }
  }
  
  console.log(`\n✅ Total: ${allExercises.length} exercices chargés depuis les fichiers Word\n`)
  
  return allExercises
}

/**
 * Vérifier quelles métadonnées manquent pour une vidéo
 */
function checkMissingMetadata(video) {
  const missing = []
  
  if (!video.targeted_muscles || video.targeted_muscles.length === 0) {
    missing.push('targeted_muscles')
  }
  if (!video.startingPosition || video.startingPosition.trim() === '') {
    missing.push('startingPosition')
  }
  if (!video.movement || video.movement.trim() === '') {
    missing.push('movement')
  }
  if (!video.intensity || video.intensity.trim() === '') {
    missing.push('intensity')
  }
  if (!video.series || video.series.trim() === '') {
    missing.push('series')
  }
  if (!video.constraints || video.constraints.trim() === '') {
    missing.push('constraints')
  }
  if (!video.theme || video.theme.trim() === '') {
    missing.push('theme')
  }
  if (!video.difficulty || video.difficulty === 'indéfini' || video.difficulty === '') {
    missing.push('difficulty')
  }
  
  return missing
}

/**
 * Trouver l'exercice correspondant pour une vidéo (version améliorée)
 */
function findMatchingExercise(video, exercises, threshold = 0.5) {
  // Filtrer les exercices de la même région
  const regionExercises = exercises.filter(ex => ex.region === video.region)
  
  if (regionExercises.length === 0) {
    return null
  }
  
  let bestMatch = null
  let bestSimilarity = 0
  let bestMethod = ''
  
  // Nettoyer le titre de la vidéo
  const cleanedVideoTitle = cleanVideoTitle(video.title)
  const videoKeywords = extractKeywords(cleanedVideoTitle)
  
  for (const exercise of regionExercises) {
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
    const maxSimilarity = Math.max(similarity1, similarity2, similarity3 * 1.2) // Bonus pour les mots-clés communs
    
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
  
  return bestMatch ? { exercise: bestMatch, similarity: bestSimilarity, method: bestMethod } : null
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Vérification de l\'état des métadonnées des vidéos\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // Charger les exercices depuis les fichiers Word
  const exercises = await loadExercisesFromWord()
  
  // Récupérer toutes les vidéos de type MUSCLE_GROUPS
  console.log('📥 Récupération des vidéos depuis la base de données...\n')
  const videos = await sql`
    SELECT 
      id, 
      title, 
      "videoNumber",
      region,
      difficulty, 
      targeted_muscles, 
      "startingPosition", 
      movement, 
      intensity, 
      series, 
      constraints, 
      theme,
      "videoUrl"
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    ORDER BY region, "videoNumber" NULLS LAST, title
  `
  
  console.log(`✅ ${videos.length} vidéos trouvées\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // Analyser les vidéos
  const videosWithoutMatch = []
  const videosWithMissingMetadata = []
  
  for (const video of videos) {
    // Chercher une correspondance
    const match = findMatchingExercise(video, exercises, 0.95)
    
    if (!match) {
      videosWithoutMatch.push({
        id: video.id,
        title: video.title,
        videoNumber: video.videoNumber,
        region: video.region,
        videoUrl: video.videoUrl
      })
    }
    
    // Vérifier les métadonnées manquantes
    const missing = checkMissingMetadata(video)
    if (missing.length > 0) {
      videosWithMissingMetadata.push({
        id: video.id,
        title: video.title,
        videoNumber: video.videoNumber,
        region: video.region,
        missingFields: missing,
        hasMatch: match !== null
      })
    }
  }
  
  // Afficher les résultats
  console.log('📊 RÉSULTATS\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // 1. Vidéos sans correspondance
  console.log(`1️⃣  VIDÉOS SANS CORRESPONDANCE (${videosWithoutMatch.length})\n`)
  if (videosWithoutMatch.length > 0) {
    videosWithoutMatch.forEach((video, index) => {
      console.log(`${index + 1}. [${video.region || 'N/A'}] #${video.videoNumber || 'N/A'} - ${video.title}`)
    })
  } else {
    console.log('   ✅ Toutes les vidéos ont une correspondance dans les fichiers Word\n')
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // 2. Vidéos avec métadonnées manquantes
  console.log(`2️⃣  VIDÉOS AVEC MÉTADONNÉES MANQUANTES (${videosWithMissingMetadata.length})\n`)
  if (videosWithMissingMetadata.length > 0) {
    videosWithMissingMetadata.forEach((video, index) => {
      console.log(`${index + 1}. [${video.region || 'N/A'}] #${video.videoNumber || 'N/A'} - ${video.title}`)
      console.log(`   ❌ Manque : ${video.missingFields.join(', ')}`)
      console.log(`   ${video.hasMatch ? '✅' : '⚠️'} Correspondance Word : ${video.hasMatch ? 'Oui' : 'Non'}\n`)
    })
  } else {
    console.log('   ✅ Toutes les vidéos ont leurs métadonnées complètes\n')
  }
  
  // Sauvegarder les résultats dans des fichiers JSON
  const outputDir = 'data/video-metadata-reports'
  await fs.mkdir(outputDir, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  await fs.writeFile(
    path.join(outputDir, `videos-without-match-${timestamp}.json`),
    JSON.stringify(videosWithoutMatch, null, 2),
    'utf-8'
  )
  
  await fs.writeFile(
    path.join(outputDir, `videos-missing-metadata-${timestamp}.json`),
    JSON.stringify(videosWithMissingMetadata, null, 2),
    'utf-8'
  )
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('💾 Rapports sauvegardés dans :')
  console.log(`   - ${path.join(outputDir, `videos-without-match-${timestamp}.json`)}`)
  console.log(`   - ${path.join(outputDir, `videos-missing-metadata-${timestamp}.json`)}\n`)
  
  console.log('✅ Terminé!\n')
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
