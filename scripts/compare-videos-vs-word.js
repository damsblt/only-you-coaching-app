#!/usr/bin/env node
/**
 * Script pour comparer les vidéos réelles avec les exercices dans les fichiers Word
 * Identifie les vidéos qui n'ont pas de correspondance dans les fichiers Word
 */

import mammoth from 'mammoth'
import fs from 'fs/promises'
import path from 'path'

const videosDir = 'Dossier Cliente/Video/groupes-musculaires/vidéos'
const metadataDir = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'

/**
 * Parser les métadonnées depuis un fichier Markdown
 */
function parseMarkdownMetadata(content, filename) {
  const exercises = []
  const lines = content.split('\n').map(l => l.trim())
  
  let currentExercise = null
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détection d'un titre d'exercice
    // Format 1: **numéro.titre** (avec balises bold)
    let titleMatch = line.match(/^\*\*(\d+(?:\.\d+)?)\.?\s*(.+?)\*\*$/)
    // Format 2: numéro.titre (sans balises bold)
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+(?:\.\d+)?)\.\s*(.+)$/)
    }
    
    if (titleMatch) {
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      const numberStr = titleMatch[1]
      const title = titleMatch[2].trim()
      const number = numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10)
      
      currentExercise = {
        title,
        number,
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
    
    if (!currentExercise) continue
    
    // Parser les sections
    if (line.includes('**Muscle cible')) {
      currentSection = 'muscles'
      const match = line.match(/\*\*Muscle cible\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.targetedMuscles = match[1].split(',').map(m => m.trim()).filter(m => m)
      }
      if (line.includes('**Position départ')) {
        currentSection = 'startingPosition'
        const posMatch = line.match(/\*\*Position départ\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
        if (posMatch && posMatch[1]) {
          currentExercise.startingPosition = posMatch[1].trim()
        }
      }
      continue
    }
    
    if (line.includes('**Position départ')) {
      currentSection = 'startingPosition'
      const match = line.match(/\*\*Position départ\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.startingPosition = match[1].trim()
      }
      continue
    }
    
    if (line.includes('**Mouvement')) {
      currentSection = 'movement'
      const match = line.match(/\*\*Mouvement\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.movement = match[1].trim()
      }
      continue
    }
    
    // Lignes de contenu pour les sections multilignes
    if (line && currentSection && !line.startsWith('**') && line.length > 0) {
      switch (currentSection) {
        case 'startingPosition':
          currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + line
          break
        case 'movement':
          currentExercise.movement += (currentExercise.movement ? ' ' : '') + line
          break
      }
    }
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

// Mapping des régions
const regionMapping = {
  'abdos': ['abdominaux complet', 'abdominaux', 'abdos'],
  'biceps': ['biceps'],
  'triceps': ['triceps'],
  'dos': ['dos'],
  'pectoraux': ['pectoraux'],
  'fessiers-jambes': ['fessier jambe', 'fessiers jambes', 'fessiers-jambes'],
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
 * Extraire le numéro et le titre depuis le nom de fichier
 */
function extractNumberAndTitle(filename) {
  // Format: "1. Titre de l'exercice.mp4" ou "10.1 Titre de l'exercice.mp4" ou "10.2 Extension..."
  const nameWithoutExt = filename.replace(/\.(mp4|mov|avi)$/i, '')
  
  // Essayer d'abord avec un numéro décimal (format "10.2 Titre")
  // La regex doit capturer "10.2" avant le point qui sépare le numéro du titre
  let match = nameWithoutExt.match(/^(\d+\.\d+)\s+(.+)$/)
  
  if (match) {
    const numberStr = match[1]
    const title = match[2].trim()
    const number = parseFloat(numberStr)
    return { number, title }
  }
  
  // Sinon, essayer avec un numéro entier (format "10. Titre")
  match = nameWithoutExt.match(/^(\d+)\.\s*(.+)$/)
  
  if (match) {
    const numberStr = match[1]
    const title = match[2].trim()
    const number = parseInt(numberStr, 10)
    return { number, title }
  }
  
  // Pas de numéro, tout le nom est le titre
  return { number: null, title: nameWithoutExt }
}

/**
 * Extraire le numéro depuis le titre d'un exercice Word
 */
function extractNumberFromExerciseTitle(title) {
  if (!title) return null
  
  // Format: "14. Crunch sur ballon..." ou "47.1 Gainage planche..."
  const match = title.match(/^(\d+(?:\.\d+)?)\.\s*(.+)$/)
  
  if (match) {
    const numberStr = match[1]
    return numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10)
  }
  
  return null
}

/**
 * Parser les métadonnées d'un fichier Word (même logique que check-videos-metadata-status.js)
 * AMÉLIORÉ : Extraction du numéro depuis le contexte
 */
function parseMetadata(text, filename) {
  const exercises = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  let currentExercise = null
  let currentSection = null
  let currentExerciseNumber = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Chercher un numéro au début de la ligne (format "14." ou "47.1" ou "10.1" ou "10.2")
    // Format 1: "10.1 Extension de jambes..." (numéro décimal avec titre sur la même ligne)
    // Gérer aussi "13 ." (espace avant le point)
    let numberMatch = line.match(/^(\d+\.\d+)\s+(.+)$/)
    if (numberMatch) {
      const numberStr = numberMatch[1]
      const restOfLine = numberMatch[2]
      currentExerciseNumber = parseFloat(numberStr)
      
      // Si la ligne suivante contient "Muscle cible", c'est le titre de l'exercice
      if (i + 1 < lines.length && lines[i + 1].toLowerCase().includes('muscle cible')) {
        if (currentExercise && currentExercise.title) {
          exercises.push(currentExercise)
        }
        
        currentExercise = {
          title: restOfLine,
          number: currentExerciseNumber,
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
    
    // Format 2: "14. Titre..." ou "13 . Titre..." (numéro entier avec titre sur la même ligne)
    // Gérer les espaces avant le point
    if (!numberMatch) {
      numberMatch = line.match(/^(\d+)\s*\.\s*(.+)$/)
      if (numberMatch) {
        const numberStr = numberMatch[1]
        const restOfLine = numberMatch[2]
        currentExerciseNumber = parseInt(numberStr, 10)
        
        // Si la ligne suivante contient "Muscle cible", c'est le titre de l'exercice
        if (i + 1 < lines.length && lines[i + 1].toLowerCase().includes('muscle cible')) {
          if (currentExercise && currentExercise.title) {
            exercises.push(currentExercise)
          }
          
          currentExercise = {
            title: restOfLine,
            number: currentExerciseNumber,
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
    
    // Ignorer les lignes qui sont clairement des instructions ou des notes
    const isInstruction = line.toLowerCase().match(/^(tenir|inspirer|expirer|gonfler|vider|maintenir|faire|revenir|descendre|remonter|amener|pousser|tirer|ouvrir|fermer|aligner|positionner)/i)
    const isTooShort = line.length < 10
    const isNote = line.toLowerCase().includes('cet exercice') || line.toLowerCase().includes('déconseillé')
    const isSectionHeader = line.toLowerCase().match(/^(muscle|position|mouvement|intensité|série|contre|thème|texte pour)/i)
    
    if (isInstruction || isTooShort || isNote || isSectionHeader) {
      if (currentExercise) {
        // Continuer le parsing des sections
      } else {
        continue
      }
    }
    
    // Chercher un numéro dans les lignes précédentes (jusqu'à 5 lignes avant)
    // Le numéro peut être sur une ligne séparée ou au début d'une ligne avec du texte
    if (!currentExerciseNumber && i > 0) {
      for (let k = Math.max(0, i - 5); k < i; k++) {
        const prevLine = lines[k]
        // Format 1: "10.1" ou "10.2" seul ou avec texte
        let prevNumberMatch = prevLine.match(/^(\d+\.\d+)(?:\s|$)/)
        if (prevNumberMatch) {
          const numberStr = prevNumberMatch[1]
          currentExerciseNumber = parseFloat(numberStr)
          break
        }
        // Format 2: "14." ou "13 ." seul sur une ligne (gérer les espaces)
        prevNumberMatch = prevLine.match(/^(\d+)\s*\.\s*$/)
        if (prevNumberMatch) {
          const numberStr = prevNumberMatch[1]
          currentExerciseNumber = parseInt(numberStr, 10)
          break
        }
        // Format 3: "14. Titre..." ou "13 . Titre..." (numéro entier au début de la ligne, gérer les espaces)
        prevNumberMatch = prevLine.match(/^(\d+)\s*\.\s+(.+)$/)
        if (prevNumberMatch) {
          const numberStr = prevNumberMatch[1]
          currentExerciseNumber = parseInt(numberStr, 10)
          break
        }
      }
    }
    
    // Détection d'un nouveau titre d'exercice (sans numéro dans le titre)
    if (line && line.length >= 15 && !line.includes(':') && !line.endsWith('.')) {
      const startsWithVerb = /^(tenir|inspirer|expirer|gonfler|vider|maintenir|faire|revenir|descendre|remonter|amener|pousser|tirer|ouvrir|fermer|aligner|positionner|monter|descendre|tendre|fléchir|sauter|maintenir|remonter|pencher|ajuster|gonfler)/i.test(line)
      
      if (startsWithVerb) {
        continue
      }
      
      let foundMuscleCible = false
      let linesToCheck = 0
      
      for (let j = i + 1; j < lines.length && j < i + 3; j++) {
        const nextLine = lines[j]
        if (nextLine && nextLine.toLowerCase().includes('muscle cible')) {
          foundMuscleCible = true
          linesToCheck = j - i
          break
        }
      }
      
      if (foundMuscleCible && linesToCheck <= 2) {
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
            number: currentExerciseNumber, // Utiliser le numéro trouvé précédemment ou dans les lignes précédentes
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
          // Garder le numéro pour les exercices suivants (jusqu'à ce qu'un nouveau numéro soit trouvé)
          // Ne pas réinitialiser ici, car plusieurs exercices peuvent partager le même numéro (variantes)
          continue
        }
      }
    }
    
    if (!currentExercise) continue
    
    // Parser les sections (simplifié pour cette comparaison)
    if (line.toLowerCase().includes('muscle cible')) {
      currentSection = 'muscles'
      const match = line.match(/muscle\s+cible\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.targetedMuscles = match[1].split(',').map(m => m.trim()).filter(m => m)
      }
    }
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
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
 * Trouver une correspondance entre une vidéo et les exercices Word (version améliorée)
 */
function findMatch(videoTitle, exercises, threshold = 0.5) {
  let bestMatch = null
  let bestSimilarity = 0
  let bestMethod = ''
  
  // Nettoyer le titre de la vidéo
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
  
  if (bestMatch) {
    return { 
      exercise: bestMatch, 
      similarity: bestSimilarity, 
      method: bestMethod
    }
  }
  
  return null
}

async function compareRegion(region) {
  console.log(`\n📂 Analyse de la région : ${region}\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // 1. Lister les vidéos
  const videosPath = path.join(videosDir, region)
  let videoFiles = []
  
  try {
    const files = await fs.readdir(videosPath)
    videoFiles = files.filter(f => f.match(/\.(mp4|mov|avi)$/i))
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture du dossier vidéos : ${error.message}`)
    return
  }
  
  console.log(`📹 Vidéos trouvées : ${videoFiles.length}\n`)
  
  // 2. Charger les exercices depuis le fichier Word ou Markdown
  const metadataFiles = await fs.readdir(metadataDir)
  
  // PRIORITÉ 1 : Chercher un fichier Markdown (.md)
  let metadataFile = metadataFiles.find(f => {
    if (!f.endsWith('.md')) return false
    const fLower = f.toLowerCase().replace('.md', '')
    const mappings = regionMapping[region] || []
    return mappings.some(m => {
      const mLower = m.toLowerCase().replace(' complet', '').replace(/\s+/g, ' ')
      // Comparaison flexible : "fessiers jambes" match avec "fessier jambe"
      return fLower === mLower || 
             fLower.includes(mLower) || 
             mLower.includes(fLower) ||
             fLower.replace(/\s+/g, ' ').includes(mLower.replace(/\s+/g, ' '))
    })
  })
  
  // PRIORITÉ 2 : Chercher le fichier Word "2" s'il existe
  if (!metadataFile) {
    metadataFile = metadataFiles.find(f => {
      const fLower = f.toLowerCase().replace('.docx', '')
      const mappings = regionMapping[region] || []
      return f.endsWith('.docx') && mappings.some(m => fLower.includes(m.toLowerCase())) && fLower.includes('2')
    })
  }
  
  // PRIORITÉ 3 : Fichier Word standard
  if (!metadataFile) {
    metadataFile = metadataFiles.find(f => {
      const fLower = f.toLowerCase().replace('.docx', '')
      const mappings = regionMapping[region] || []
      return f.endsWith('.docx') && mappings.some(m => fLower.includes(m.toLowerCase()))
    })
  }
  
  if (!metadataFile) {
    console.log(`⚠️  Aucun fichier de métadonnées trouvé pour la région ${region}\n`)
    console.log('📹 Liste des vidéos :\n')
    videoFiles.forEach((file, i) => {
      const { number, title } = extractNumberAndTitle(file)
      console.log(`${i + 1}. ${file}`)
      console.log(`   Numéro: ${number || 'N/A'}, Titre: ${title}\n`)
    })
    return
  }
  
  const metadataFilePath = path.join(metadataDir, metadataFile)
  const fileType = metadataFile.endsWith('.md') ? 'Markdown' : 'Word'
  console.log(`📄 Fichier : ${metadataFile} (${fileType})\n`)
  
  try {
    let exercises = []
    
    if (metadataFile.endsWith('.md')) {
      // Parser le fichier Markdown
      const content = await fs.readFile(metadataFilePath, 'utf-8')
      exercises = parseMarkdownMetadata(content, metadataFile)
    } else {
      // Parser le fichier Word
      const buffer = await fs.readFile(metadataFilePath)
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value
      exercises = parseMetadata(text, metadataFile)
    }
    console.log(`📋 Exercices trouvés dans le Word : ${exercises.length}\n`)
    
    // 3. Comparer - PRIORITÉ AU MATCHING PAR NUMÉRO
    const videosWithoutMatch = []
    const videosWithMatch = []
    
    // Créer un index des exercices par numéro
    const exercisesByNumber = new Map()
    const exercisesWithoutNumber = []
    
    for (const exercise of exercises) {
      // Priorité 1 : Numéro stocké dans l'exercice (depuis le parsing amélioré)
      let exerciseNumber = exercise.number
      
      // Priorité 2 : Extraire depuis le titre
      if (exerciseNumber === null || exerciseNumber === undefined) {
        exerciseNumber = extractNumberFromExerciseTitle(exercise.title)
      }
      
      if (exerciseNumber !== null && exerciseNumber !== undefined) {
        // Si plusieurs exercices ont le même numéro, garder le premier (ou le meilleur match)
        if (!exercisesByNumber.has(exerciseNumber)) {
          exercisesByNumber.set(exerciseNumber, exercise)
        }
      } else {
        exercisesWithoutNumber.push(exercise)
      }
    }
    
    // CORRECTION MANUELLE : Attribuer les numéros manquants basés sur le contexte et les titres
    // Les exercices "Extension de jambes tendues avec ballon..." sont 10.1 et 10.2
    // Chercher aussi dans tous les exercices (pas seulement ceux sans numéro)
    for (const exercise of exercises) {
      const titleLower = exercise.title.toLowerCase()
      let shouldUpdate = false
      
      // Exercice 10 : "Extension de jambes tendues tête décollée + antépulsion avec disque"
      if (titleLower.includes('extension de jambes tendues') && 
          (titleLower.includes('antépulsion') || titleLower.includes('antepulsion') || titleLower.includes('disque'))) {
        exercise.number = 10
        shouldUpdate = true
      }
      // Exercice 10.1 : "Extension de jambes tendues avec ballon au cheville et tête au sol"
      else if (titleLower.includes('extension de jambes tendues avec ballon') && 
          (titleLower.includes('tête au sol') || titleLower.includes('tete au sol') || 
           (titleLower.includes('cheville') && !titleLower.includes('chevilles')))) {
        exercise.number = 10.1
        shouldUpdate = true
      }
      // Exercice 10.2 : "Extension de jambes tendues avec ballon aux chevilles et relevé de buste"
      else if (titleLower.includes('extension de jambes tendues avec ballon') && 
          (titleLower.includes('relevé de buste') || titleLower.includes('releve de buste') || 
           titleLower.includes('chevilles'))) {
        exercise.number = 10.2
        shouldUpdate = true
      }
      
      if (shouldUpdate && exercise.number !== null && exercise.number !== undefined) {
        if (!exercisesByNumber.has(exercise.number)) {
          exercisesByNumber.set(exercise.number, exercise)
        }
      }
    }
    
    console.log(`📊 Après correction manuelle : ${exercisesByNumber.size} exercices indexés par numéro\n`)
    
    console.log(`📊 Exercices indexés par numéro : ${exercisesByNumber.size}\n`)
    
    for (const videoFile of videoFiles) {
      const { number, title } = extractNumberAndTitle(videoFile)
      
      let match = null
      let matchMethod = ''
      
      // PRIORITÉ 1 : Matching par numéro exact
      if (number !== null && exercisesByNumber.has(number)) {
        const exercise = exercisesByNumber.get(number)
        match = {
          exercise,
          similarity: 1.0,
          method: 'number'
        }
        matchMethod = 'par numéro'
      } 
      // PRIORITÉ 1.5 : Matching par numéro de base
      // Si la vidéo a un numéro entier (ex: 10) mais qu'il n'existe pas dans le Word,
      // chercher les variantes décimales (10.1, 10.2, etc.)
      else if (number !== null && number % 1 === 0 && !exercisesByNumber.has(number)) {
        // C'est un nombre entier qui n'existe pas exactement, chercher les variantes décimales
        const possibleMatches = []
        for (const [exNumber, exercise] of exercisesByNumber.entries()) {
          if (Math.floor(exNumber) === number) {
            // Numéro décimal dans le Word avec la même base (ex: 10.1, 10.2 pour vidéo 10)
            // Prendre la première variante trouvée (ou la meilleure)
            possibleMatches.push({ exercise, similarity: 0.95, exNumber })
          }
        }
        if (possibleMatches.length > 0) {
          // Prendre la première variante (ou on pourrait prendre la plus proche)
          const best = possibleMatches[0]
          match = {
            exercise: best.exercise,
            similarity: best.similarity,
            method: 'number_variant'
          }
          matchMethod = `par numéro (variante ${best.exNumber})`
        }
      }
      // PRIORITÉ 1.6 : Matching par numéro de base (pour les décimaux : 10.1, 10.2 → 10)
      else if (number !== null && number % 1 !== 0) {
        // C'est un nombre décimal, essayer avec la partie entière
        const baseNumber = Math.floor(number)
        if (exercisesByNumber.has(baseNumber)) {
          const exercise = exercisesByNumber.get(baseNumber)
          match = {
            exercise,
            similarity: 0.95, // Légèrement moins que 1.0 car c'est une variante
            method: 'number_base'
          }
          matchMethod = 'par numéro (base)'
        }
      }
      
      // PRIORITÉ 2 : Matching par similarité de titre (fallback)
      if (!match) {
        // PRIORITÉ 2 : Matching par similarité de titre (fallback)
        const similarityMatch = findMatch(title, exercises)
        if (similarityMatch) {
          match = similarityMatch
          matchMethod = 'par similarité'
        }
      }
      
      if (!match) {
        videosWithoutMatch.push({
          file: videoFile,
          number,
          title
        })
      } else {
        videosWithMatch.push({
          file: videoFile,
          number,
          title,
          wordTitle: match.exercise.title,
          wordNumber: extractNumberFromExerciseTitle(match.exercise.title),
          similarity: match.similarity,
          method: matchMethod
        })
      }
    }
    
    // 4. Afficher les résultats
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // Compter les méthodes de matching
    const byNumber = videosWithMatch.filter(v => v.method === 'par numéro').length
    const bySimilarity = videosWithMatch.filter(v => v.method === 'par similarité').length
    
    console.log(`✅ Vidéos avec correspondance : ${videosWithMatch.length}`)
    console.log(`   - Par numéro : ${byNumber}`)
    console.log(`   - Par similarité : ${bySimilarity}\n`)
    console.log(`❌ Vidéos SANS correspondance : ${videosWithoutMatch.length}\n`)
    
    // Afficher les vidéos matchées par similarité (pour voir lesquelles n'ont pas de numéro dans le Word)
    const matchedBySimilarity = videosWithMatch.filter(v => v.method === 'par similarité')
    if (matchedBySimilarity.length > 0) {
      console.log('📋 Vidéos matchées par similarité (pas de numéro dans le Word) :\n')
      matchedBySimilarity.slice(0, 10).forEach((video, i) => {
        console.log(`${i + 1}. ${video.file}`)
        console.log(`   Numéro vidéo: ${video.number || 'N/A'}`)
        console.log(`   Titre vidéo: ${video.title}`)
        console.log(`   Numéro Word: ${video.wordNumber || 'N/A'}`)
        console.log(`   Titre Word: ${video.wordTitle}\n`)
      })
      if (matchedBySimilarity.length > 10) {
        console.log(`... et ${matchedBySimilarity.length - 10} autres\n`)
      }
    }
    
    if (videosWithoutMatch.length > 0) {
      console.log('📹 Liste des vidéos SANS correspondance :\n')
      videosWithoutMatch.forEach((video, i) => {
        console.log(`${i + 1}. ${video.file}`)
        console.log(`   Numéro: ${video.number || 'N/A'}`)
        console.log(`   Titre extrait: ${video.title}\n`)
      })
    }
    
    // Afficher les numéros d'exercices Word qui n'ont pas de vidéo correspondante
    const videoNumbers = new Set(videoFiles.map(f => {
      const { number } = extractNumberAndTitle(f)
      return number
    }).filter(n => n !== null))
    
    const exerciseNumbers = Array.from(exercisesByNumber.keys())
    const missingVideos = exerciseNumbers.filter(n => !videoNumbers.has(n))
    
    if (missingVideos.length > 0) {
      console.log('📋 Exercices Word sans vidéo correspondante :\n')
      missingVideos.forEach((num, i) => {
        const exercise = exercisesByNumber.get(num)
        console.log(`${i + 1}. Numéro ${num}: ${exercise.title}\n`)
      })
    }
    
    return {
      region,
      totalVideos: videoFiles.length,
      totalExercises: exercises.length,
      videosWithMatch: videosWithMatch.length,
      videosWithoutMatch: videosWithoutMatch.length,
      unmatchedVideos: videosWithoutMatch
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture du fichier Word : ${error.message}`)
    return null
  }
}

async function main() {
  const region = process.argv[2] || 'abdos'
  
  console.log('🔍 Comparaison des vidéos avec les exercices Word\n')
  
  const result = await compareRegion(region)
  
  if (result) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 RÉSUMÉ\n')
    console.log(`   Région : ${result.region}`)
    console.log(`   Vidéos totales : ${result.totalVideos}`)
    console.log(`   Exercices Word : ${result.totalExercises}`)
    console.log(`   Vidéos avec correspondance : ${result.videosWithMatch}`)
    console.log(`   Vidéos SANS correspondance : ${result.videosWithoutMatch}\n`)
  }
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
