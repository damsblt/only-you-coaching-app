#!/usr/bin/env node
/**
 * Parser pour les fichiers Markdown (.md) de métadonnées
 * Format plus simple que Word : structure claire avec balises **
 */

import fs from 'fs/promises'
import path from 'path'

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
    
    // Détection d'un titre d'exercice : ligne commençant par **numéro.titre**
    // Format: **10.Extension...** ou **10.1Extension...** ou **10.2Extension...**
    const titleMatch = line.match(/^\*\*(\d+(?:\.\d+)?)\.?\s*(.+?)\*\*$/)
    if (titleMatch) {
      // Sauvegarder l'exercice précédent
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      const numberStr = titleMatch[1]
      const title = titleMatch[2].trim()
      const number = numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10)
      
      // Nouveau exercice
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
    
    // Parser les sections marquées par **
    // Gérer le cas où plusieurs sections sont sur la même ligne
    if (line.includes('**Muscle cible')) {
      currentSection = 'muscles'
      // Extraire le contenu après "Muscle cible" jusqu'à la prochaine section ou fin de ligne
      const match = line.match(/\*\*Muscle cible\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        const musclesText = match[1].trim()
        currentExercise.targetedMuscles = musclesText.split(',').map(m => m.trim()).filter(m => m)
      }
      // Si "Position départ" est aussi sur cette ligne, continuer à parser
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
    
    if (line.startsWith('**Mouvement')) {
      currentSection = 'movement'
      const match = line.match(/\*\*Mouvement\*\*\s*:\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.movement = match[1].trim()
      }
      continue
    }
    
    if (line.startsWith('**Intensité')) {
      currentSection = 'intensity'
      const match = line.match(/\*\*Intensité\*\*\.?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.intensity = match[1].trim()
      }
      continue
    }
    
    if (line.startsWith('**Série')) {
      currentSection = 'series'
      const match = line.match(/\*\*Série\s*:\*\*\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.series = match[1].trim()
      }
      continue
    }
    
    if (line.startsWith('**Contre')) {
      currentSection = 'constraints'
      const match = line.match(/\*\*Contre\s*-?\s*indication\s*:\*\*\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.constraints = match[1].trim()
      }
      continue
    }
    
    if (line.startsWith('**Thème')) {
      currentSection = 'theme'
      const match = line.match(/\*\*Thème\s*:\*\*\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.theme = match[1].trim()
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
        case 'intensity':
          if (!currentExercise.intensity) {
            currentExercise.intensity = line
          }
          break
        case 'series':
          if (!currentExercise.series) {
            currentExercise.series = line
          }
          break
        case 'constraints':
          if (!currentExercise.constraints) {
            currentExercise.constraints = line
          }
          break
        case 'theme':
          if (!currentExercise.theme) {
            currentExercise.theme = line
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
 * Tester le parsing Markdown
 */
async function testMarkdownParsing() {
  const mdFile = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées/abdominaux.md'
  
  console.log('🔍 Test du parsing Markdown\n')
  console.log(`📄 Fichier : ${mdFile}\n`)
  
  try {
    const content = await fs.readFile(mdFile, 'utf-8')
    const exercises = parseMarkdownMetadata(content, 'abdominaux.md')
    
    console.log(`✅ Exercices détectés : ${exercises.length}\n`)
    
    // Afficher les exercices avec numéros 10, 10.1, 10.2
    console.log('🔍 Exercices 10, 10.1, 10.2 :\n')
    exercises.filter(ex => ex.number >= 10 && ex.number <= 10.3).forEach(ex => {
      console.log(`  ${ex.number}: ${ex.title}`)
      console.log(`     Muscles: ${ex.targetedMuscles.length > 0 ? ex.targetedMuscles.join(', ') : 'Aucun'}`)
      console.log(`     Position: ${ex.startingPosition ? ex.startingPosition.substring(0, 60) + '...' : 'Vide'}`)
      console.log('')
    })
    
    // Compter les exercices avec numéro
    const withNumber = exercises.filter(ex => ex.number !== null && ex.number !== undefined).length
    console.log(`📊 Statistiques :`)
    console.log(`   - Exercices avec numéro : ${withNumber}/${exercises.length}`)
    console.log(`   - Exercices sans numéro : ${exercises.length - withNumber}\n`)
    
    return exercises
    
  } catch (error) {
    console.error(`❌ Erreur : ${error.message}`)
    return []
  }
}

testMarkdownParsing().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
