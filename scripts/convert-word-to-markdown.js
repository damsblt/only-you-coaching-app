#!/usr/bin/env node
/**
 * Script pour convertir les fichiers Word (.docx) en Markdown (.md)
 * Extrait le contenu avec mammoth et le formate en Markdown structuré
 */

import mammoth from 'mammoth'
import fs from 'fs/promises'
import path from 'path'

const metadataDir = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'

/**
 * Normaliser le nom de fichier pour le Markdown
 */
function normalizeFilename(wordFile) {
  return wordFile
    .replace(/\.docx$/i, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    + '.md'
}

/**
 * Parser le texte Word et le convertir en Markdown structuré
 */
function convertToMarkdown(text, region) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const markdownLines = []
  
  // Ajouter le header
  markdownLines.push(`# ${region}\n`)
  
  let currentExercise = null
  let currentSection = null
  let exerciseNumber = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Chercher un numéro au début de la ligne (format "14." ou "47.1" ou "10.1")
    // Format 1: "10.1 Extension..." (numéro décimal)
    let numberMatch = line.match(/^(\d+\.\d+)\s+(.+)$/)
    if (numberMatch) {
      const numberStr = numberMatch[1]
      const title = numberMatch[2].trim()
      exerciseNumber = parseFloat(numberStr)
      
      // Sauvegarder l'exercice précédent
      if (currentExercise) {
        markdownLines.push(...formatExercise(currentExercise))
        markdownLines.push('')
      }
      
      currentExercise = {
        number: exerciseNumber,
        title,
        targetedMuscles: [],
        startingPosition: [],
        movement: [],
        intensity: '',
        series: '',
        constraints: '',
        theme: ''
      }
      currentSection = null
      continue
    }
    
    // Format 2: "14. Titre..." (numéro entier)
    numberMatch = line.match(/^(\d+)\.\s*(.+)$/)
    if (numberMatch) {
      const numberStr = numberMatch[1]
      const title = numberMatch[2].trim()
      exerciseNumber = parseInt(numberStr, 10)
      
      // Sauvegarder l'exercice précédent
      if (currentExercise) {
        markdownLines.push(...formatExercise(currentExercise))
        markdownLines.push('')
      }
      
      currentExercise = {
        number: exerciseNumber,
        title,
        targetedMuscles: [],
        startingPosition: [],
        movement: [],
        intensity: '',
        series: '',
        constraints: '',
        theme: ''
      }
      currentSection = null
      continue
    }
    
    if (!currentExercise) continue
    
    // Parser les sections
    if (line.toLowerCase().includes('muscle cible')) {
      currentSection = 'muscles'
      const match = line.match(/muscle\s+cible\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.targetedMuscles = match[1].split(',').map(m => m.trim()).filter(m => m)
      }
      continue
    }
    
    if (line.toLowerCase().includes('position départ') || line.toLowerCase().includes('position de départ')) {
      currentSection = 'startingPosition'
      const match = line.match(/position\s+(de\s+)?départ\s*[:\-]?\s*(.+)/i)
      if (match && match[2]) {
        currentExercise.startingPosition.push(match[2].trim())
      }
      continue
    }
    
    if (line.toLowerCase().includes('mouvement')) {
      currentSection = 'movement'
      const match = line.match(/mouvement\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.movement.push(match[1].trim())
      }
      continue
    }
    
    if (line.toLowerCase().includes('intensité')) {
      currentSection = 'intensity'
      const match = line.match(/intensité\.?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.intensity = match[1].trim()
      }
      continue
    }
    
    if (line.toLowerCase().includes('série')) {
      currentSection = 'series'
      const match = line.match(/série\s*:\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.series = match[1].trim()
      }
      continue
    }
    
    if (line.toLowerCase().includes('contre') && line.toLowerCase().includes('indication')) {
      currentSection = 'constraints'
      const match = line.match(/contre\s*-?\s*indication\s*:\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.constraints = match[1].trim()
      }
      continue
    }
    
    if (line.toLowerCase().includes('thème')) {
      currentSection = 'theme'
      const match = line.match(/thème\s*:\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.theme = match[1].trim()
      }
      continue
    }
    
    // Lignes de contenu pour les sections multilignes
    if (line && currentSection && !line.match(/^(muscle|position|mouvement|intensité|série|contre|thème)/i)) {
      // Ignorer les lignes qui sont clairement des instructions courtes
      const isInstruction = /^(tenir|inspirer|expirer|gonfler|vider|maintenir|faire|revenir|descendre|remonter|amener|pousser|tirer|ouvrir|fermer|aligner|positionner|monter|descendre|tendre|fléchir|sauter|maintenir|remonter|pencher|ajuster|gonfler)/i.test(line)
      
      if (!isInstruction && line.length > 3) {
        switch (currentSection) {
          case 'startingPosition':
            currentExercise.startingPosition.push(line)
            break
          case 'movement':
            currentExercise.movement.push(line)
            break
        }
      }
    }
  }
  
  // Ajouter le dernier exercice
  if (currentExercise) {
    markdownLines.push(...formatExercise(currentExercise))
  }
  
  return markdownLines.join('\n')
}

/**
 * Formater un exercice en Markdown
 */
function formatExercise(exercise) {
  const lines = []
  
  // Titre avec numéro
  const numberStr = exercise.number % 1 === 0 
    ? exercise.number.toString() 
    : exercise.number.toString()
  lines.push(`**${numberStr}. ${exercise.title}**`)
  lines.push('')
  
  // Muscle cible
  if (exercise.targetedMuscles.length > 0) {
    lines.push(`**Muscle cible** : ${exercise.targetedMuscles.join(', ')}`)
  }
  
  // Position départ
  if (exercise.startingPosition.length > 0) {
    lines.push(`**Position départ** :`)
    exercise.startingPosition.forEach(pos => {
      lines.push(pos)
    })
  }
  
  // Mouvement
  if (exercise.movement.length > 0) {
    lines.push('')
    lines.push(`**Mouvement** :`)
    exercise.movement.forEach(mov => {
      lines.push(mov)
    })
  }
  
  // Intensité
  if (exercise.intensity) {
    lines.push('')
    lines.push(`**Intensité.** ${exercise.intensity}`)
  }
  
  // Série
  if (exercise.series) {
    lines.push(`**Série :** ${exercise.series}`)
  }
  
  // Contre-indication
  if (exercise.constraints) {
    lines.push(`**Contre -indication :** ${exercise.constraints}`)
  }
  
  // Thème
  if (exercise.theme) {
    lines.push(`**Thème :** ${exercise.theme}`)
  }
  
  return lines
}

/**
 * Déterminer la région depuis le nom de fichier
 */
function getRegionFromFilename(filename) {
  const fLower = filename.toLowerCase()
  
  if (fLower.includes('abdominaux') || fLower.includes('abdos')) return 'abdominaux'
  if (fLower.includes('biceps')) return 'biceps'
  if (fLower.includes('triceps')) return 'triceps'
  if (fLower.includes('dos')) return 'dos'
  if (fLower.includes('pectoraux')) return 'pectoraux'
  if (fLower.includes('fessier') || fLower.includes('jambe')) return 'fessiers-jambes'
  if (fLower.includes('epaule') || fLower.includes('épaule')) return 'épaule'
  if (fLower.includes('bande')) return 'bande'
  if (fLower.includes('machine')) return 'machine'
  if (fLower.includes('cardio')) return 'cardio'
  if (fLower.includes('streching') || fLower.includes('stretching')) return 'streching'
  
  return filename.replace(/\.docx$/i, '').trim()
}

/**
 * Convertir un fichier Word en Markdown
 */
async function convertWordToMarkdown(wordFile) {
  const wordFilePath = path.join(metadataDir, wordFile)
  const region = getRegionFromFilename(wordFile)
  const mdFilename = normalizeFilename(wordFile)
  const mdFilePath = path.join(metadataDir, mdFilename)
  
  console.log(`📄 Conversion : ${wordFile} → ${mdFilename}`)
  
  try {
    // Lire le fichier Word
    const buffer = await fs.readFile(wordFilePath)
    
    // Extraire le texte brut
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
    
    // Convertir en Markdown
    const markdown = convertToMarkdown(text, region)
    
    // Sauvegarder
    await fs.writeFile(mdFilePath, markdown, 'utf-8')
    
    console.log(`   ✅ Converti : ${mdFilename} (${markdown.split('\n').length} lignes)`)
    
    return { wordFile, mdFile: mdFilename, success: true }
  } catch (error) {
    console.error(`   ❌ Erreur : ${error.message}`)
    return { wordFile, mdFile: mdFilename, success: false, error: error.message }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔄 Conversion des fichiers Word en Markdown\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // Lister tous les fichiers Word
    const files = await fs.readdir(metadataDir)
    const wordFiles = files.filter(f => 
      f.endsWith('.docx') && 
      !f.startsWith('~$') && 
      !f.toLowerCase().includes('complet 2') // Ignorer les fichiers "2" car on préfère les convertir séparément
    )
    
    console.log(`📂 ${wordFiles.length} fichiers Word trouvés\n`)
    
    const results = []
    
    // Convertir chaque fichier
    for (const wordFile of wordFiles) {
      const result = await convertWordToMarkdown(wordFile)
      results.push(result)
    }
    
    // Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 Résumé :\n')
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`   ✅ Convertis avec succès : ${successful}`)
    console.log(`   ❌ Échecs : ${failed}\n`)
    
    if (successful > 0) {
      console.log('📄 Fichiers Markdown créés :\n')
      results.filter(r => r.success).forEach(r => {
        console.log(`   - ${r.mdFile}`)
      })
      console.log('')
    }
    
    if (failed > 0) {
      console.log('❌ Erreurs :\n')
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.wordFile}: ${r.error}`)
      })
      console.log('')
    }
    
    console.log('✅ Conversion terminée !\n')
    
  } catch (error) {
    console.error(`❌ Erreur : ${error.message}`)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
