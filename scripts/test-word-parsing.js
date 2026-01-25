#!/usr/bin/env node
/**
 * Script de test pour analyser le parsing des fichiers Word
 * Affiche les exercices détectés pour comprendre le problème
 */

import mammoth from 'mammoth'
import fs from 'fs/promises'
import path from 'path'

const metadataDir = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'

/**
 * Parser les métadonnées d'un fichier Word (version améliorée)
 */
function parseMetadata(text, filename) {
  const exercises = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  
  let currentExercise = null
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détection d'un nouveau titre d'exercice
    // Un titre d'exercice doit être suivi de "Muscle cible" dans les 3 prochaines lignes non vides
    if (line && line.length > 3) {
      // Chercher "Muscle cible" dans les prochaines lignes
      let foundMuscleCible = false
      let nextLinesCount = 0
      
      for (let j = i + 1; j < lines.length && j < i + 5; j++) {
        const nextLine = lines[j]
        if (nextLine && nextLine.toLowerCase().includes('muscle cible')) {
          foundMuscleCible = true
          break
        }
        if (nextLine && nextLine.length > 0) {
          nextLinesCount++
        }
      }
      
      // Un titre d'exercice doit être suivi directement de "Muscle cible"
      // Ignorer les lignes qui sont déjà des sections (commencent par "Muscle", "Position", etc.)
      const isSectionHeader = line.toLowerCase().match(/^(muscle|position|mouvement|intensité|série|contre|thème)/i)
      
      if (foundMuscleCible && !isSectionHeader && nextLinesCount <= 2) {
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
    
    if (!currentExercise) continue
    
    // Parser les différentes sections
    if (line.toLowerCase().includes('muscle cible')) {
      currentSection = 'muscles'
      const match = line.match(/muscle\s+cible\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.targetedMuscles = match[1].split(',').map(m => m.trim()).filter(m => m)
      }
    } else if (line.toLowerCase().includes('position départ') || line.toLowerCase().includes('position de départ')) {
      currentSection = 'startingPosition'
      const match = line.match(/position\s+(?:de\s+)?départ\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.startingPosition = match[1].trim()
      }
    } else if (line.toLowerCase().includes('mouvement')) {
      currentSection = 'movement'
      const match = line.match(/mouvement\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.movement = match[1].trim()
      }
    } else if (line.toLowerCase().includes('intensité')) {
      currentSection = 'intensity'
      const match = line.match(/intensité\s*[:\-\.]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.intensity = match[1].trim()
      }
    } else if (line.toLowerCase().includes('série')) {
      currentSection = 'series'
      const match = line.match(/série\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.series = match[1].trim()
      }
    } else if (line.toLowerCase().includes('contre') && line.toLowerCase().includes('indication')) {
      currentSection = 'constraints'
      const match = line.match(/contre[-\s]?indication\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.constraints = match[1].trim()
      }
    } else if (line.toLowerCase().includes('thème')) {
      currentSection = 'theme'
      const match = line.match(/thème\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        currentExercise.theme = match[1].trim()
      }
    } else if (line && currentSection && line.length > 0) {
      // Ajouter le contenu à la section courante (lignes suivantes)
      // Mais seulement si ce n'est pas le début d'un nouvel exercice
      const couldBeNewExercise = line.length > 10 && 
        !line.toLowerCase().match(/^(muscle|position|mouvement|intensité|série|contre|thème)/i)
      
      if (!couldBeNewExercise) {
        switch (currentSection) {
          case 'startingPosition':
            if (!line.toLowerCase().includes('position') && !line.toLowerCase().includes('mouvement')) {
              currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + line
            }
            break
          case 'movement':
            if (!line.toLowerCase().includes('mouvement') && !line.toLowerCase().includes('intensité')) {
              currentExercise.movement += (currentExercise.movement ? ' ' : '') + line
            }
            break
          case 'intensity':
            if (!line.toLowerCase().includes('intensité') && !line.toLowerCase().includes('série')) {
              currentExercise.intensity += (currentExercise.intensity ? ' ' : '') + line
            }
            break
          case 'series':
            if (!line.toLowerCase().includes('série') && !line.toLowerCase().includes('contre')) {
              currentExercise.series += (currentExercise.series ? ' ' : '') + line
            }
            break
          case 'constraints':
            if (!line.toLowerCase().includes('indication') && !line.toLowerCase().includes('thème')) {
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
  }
  
  // Ajouter le dernier exercice
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

async function testFile(filePath) {
  console.log(`\n📄 Analyse de : ${path.basename(filePath)}\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
    
    console.log(`📊 Texte extrait : ${text.length} caractères\n`)
    
    // Afficher les 50 premières lignes pour comprendre la structure
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)
    console.log('📋 Premières lignes du document :\n')
    lines.slice(0, 30).forEach((line, i) => {
      console.log(`${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`)
    })
    console.log('\n')
    
    // Parser les exercices
    const exercises = parseMetadata(text, path.basename(filePath))
    
    console.log(`\n✅ Exercices détectés : ${exercises.length}\n`)
    
    // Afficher les 5 premiers exercices
    exercises.slice(0, 5).forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.title}`)
      console.log(`   - Muscles: ${ex.targetedMuscles.length > 0 ? ex.targetedMuscles.join(', ') : 'Aucun'}`)
      console.log(`   - Position: ${ex.startingPosition || 'Vide'}`)
      console.log(`   - Mouvement: ${ex.movement || 'Vide'}`)
      console.log('')
    })
    
    if (exercises.length > 5) {
      console.log(`... et ${exercises.length - 5} autres exercices\n`)
    }
    
    return exercises.length
  } catch (error) {
    console.error(`❌ Erreur : ${error.message}`)
    return 0
  }
}

async function main() {
  const files = await fs.readdir(metadataDir)
  const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
  
  console.log('🔍 Test du parsing des fichiers Word\n')
  console.log(`📂 ${docxFiles.length} fichiers trouvés\n`)
  
  let totalExercises = 0
  
  for (const file of docxFiles) {
    const filePath = path.join(metadataDir, file)
    const count = await testFile(filePath)
    totalExercises += count
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(`📊 TOTAL : ${totalExercises} exercices détectés\n`)
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
