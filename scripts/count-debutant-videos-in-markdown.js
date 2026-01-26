#!/usr/bin/env node
/**
 * Script pour compter les vidéos avec l'intensité "Débutant" dans les fichiers Markdown
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const metadataDir = path.join(process.cwd(), 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées')

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
    let titleMatch = line.match(/^\*\*(\d+\.\d+)\.?\s*(.+?)\*\*$/)
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+\.\d+)\.\s*(.+)$/)
    }
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+\.\d+)([^\d\s].+)$/)
    }
    if (!titleMatch) {
      titleMatch = line.match(/^\*\*(\d+)\.?\s*(.+?)\*\*$/)
    }
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+)\.\s*(.+)$/)
    }
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+)\.([^\s\d].+)$/)
    }
    
    if (titleMatch) {
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      const numberStr = titleMatch[1]
      const title = titleMatch[2].trim()
      const number = numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10)
      currentExercise = { 
        number, 
        title, 
        intensity: '',
        source: filename
      }
      currentSection = null
      continue
    }
    
    if (!currentExercise) continue
    
    // Parser l'intensité
    if (line.includes('**Intensité')) {
      let match = line.match(/\*\*Intensité\.\*\*\s*:?\s*(.+?)(?:\*\*|$)/i)
      if (!match) {
        match = line.match(/\*\*Intensité\*\*\s*\.\s*(.+?)(?:\*\*|$)/i)
      }
      if (!match) {
        match = line.match(/\*\*Intensité\*\*\.?\s*:?\s*(.+?)(?:\*\*|$)/i)
      }
      if (match && match[1]) {
        currentExercise.intensity = match[1].trim()
      }
      continue
    }
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Normaliser une valeur d'intensité pour la comparaison
 */
function normalizeIntensityForComparison(intensity) {
  if (!intensity) return ''
  return intensity.toLowerCase().trim()
}

async function countDebutantVideos() {
  console.log('🔍 Analyse des fichiers Markdown pour trouver les vidéos avec intensité "Débutant"...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Lire tous les fichiers .md
    const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.md'))
    
    console.log(`📄 ${files.length} fichiers Markdown trouvés\n`)
    
    let totalExercises = 0
    let debutantExercises = []
    const byFile = {}
    
    for (const file of files) {
      const filePath = path.join(metadataDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const exercises = parseMarkdownMetadata(content, file)
      
      totalExercises += exercises.length
      
      // Filtrer les exercices avec intensité "Débutant"
      const debutantInFile = exercises.filter(ex => {
        const normalized = normalizeIntensityForComparison(ex.intensity)
        // Chercher "débutant" dans l'intensité
        return normalized.includes('débutant') || normalized.includes('debutant')
      })
      
      if (debutantInFile.length > 0) {
        byFile[file] = debutantInFile
        debutantExercises.push(...debutantInFile)
      }
      
      console.log(`   📄 ${file}: ${exercises.length} exercices (${debutantInFile.length} avec "Débutant")`)
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`📊 Résumé:\n`)
    console.log(`   Total exercices: ${totalExercises}`)
    console.log(`   Exercices avec "Débutant": ${debutantExercises.length}\n`)
    
    // Afficher les détails par fichier
    if (Object.keys(byFile).length > 0) {
      console.log('📋 Détails par fichier:\n')
      for (const [file, exercises] of Object.entries(byFile)) {
        console.log(`   📄 ${file}: ${exercises.length} exercices`)
        exercises.forEach(ex => {
          console.log(`      - ${ex.number}: ${ex.title.substring(0, 50)}`)
          console.log(`        Intensité: "${ex.intensity}"`)
        })
        console.log('')
      }
    }
    
    // Afficher toutes les valeurs d'intensité uniques contenant "débutant"
    const uniqueIntensities = Array.from(new Set(
      debutantExercises.map(ex => ex.intensity)
    ))
    
    console.log('📋 Valeurs d\'intensité contenant "Débutant":\n')
    uniqueIntensities.forEach(intensity => {
      const count = debutantExercises.filter(ex => ex.intensity === intensity).length
      console.log(`   "${intensity}" (${count} exercices)`)
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

countDebutantVideos().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
