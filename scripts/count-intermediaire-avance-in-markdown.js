#!/usr/bin/env node
/**
 * Script pour compter les occurrences de "Intermédiaire et avancé" dans les fichiers Markdown
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
 * Vérifier si une intensité correspond à "Intermédiaire et avancé" (avec variantes)
 */
function isIntermediaireEtAvance(intensity) {
  if (!intensity) return false
  
  const normalized = intensity.toLowerCase().trim()
  
  // Chercher les variantes de "Intermédiaire et avancé"
  return normalized.includes('intermédiaire') && 
         normalized.includes('avancé') &&
         (normalized.includes('et') || normalized.includes('-'))
}

async function countIntermediaireAvance() {
  console.log('🔍 Analyse des fichiers Markdown pour trouver "Intermédiaire et avancé"...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Lire tous les fichiers .md
    const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.md'))
    
    console.log(`📄 ${files.length} fichiers Markdown trouvés\n`)
    
    let totalExercises = 0
    let intermediaireAvanceExercises = []
    const byFile = {}
    
    for (const file of files) {
      const filePath = path.join(metadataDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const exercises = parseMarkdownMetadata(content, file)
      
      totalExercises += exercises.length
      
      // Filtrer les exercices avec intensité "Intermédiaire et avancé"
      const intermediaireAvanceInFile = exercises.filter(ex => {
        return isIntermediaireEtAvance(ex.intensity)
      })
      
      if (intermediaireAvanceInFile.length > 0) {
        byFile[file] = intermediaireAvanceInFile
        intermediaireAvanceExercises.push(...intermediaireAvanceInFile)
      }
      
      console.log(`   📄 ${file}: ${exercises.length} exercices (${intermediaireAvanceInFile.length} avec "Intermédiaire et avancé")`)
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`📊 Résumé:\n`)
    console.log(`   Total exercices: ${totalExercises}`)
    console.log(`   Exercices avec "Intermédiaire et avancé": ${intermediaireAvanceExercises.length}\n`)
    
    // Afficher les détails par fichier
    if (Object.keys(byFile).length > 0) {
      console.log('📋 Liste détaillée par fichier:\n')
      for (const [file, exercises] of Object.entries(byFile)) {
        console.log(`\n   📄 ${file} (${exercises.length} exercices):`)
        exercises.forEach((ex, index) => {
          console.log(`\n      ${index + 1}. Exercice ${ex.number}: ${ex.title}`)
          console.log(`         Intensité: "${ex.intensity}"`)
        })
      }
    } else {
      console.log('   Aucun exercice trouvé avec "Intermédiaire et avancé"\n')
    }
    
    // Afficher toutes les valeurs d'intensité uniques contenant "intermédiaire" et "avancé"
    const uniqueIntensities = Array.from(new Set(
      intermediaireAvanceExercises.map(ex => ex.intensity)
    ))
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 Valeurs d\'intensité trouvées (variantes de "Intermédiaire et avancé"):\n')
    uniqueIntensities.forEach(intensity => {
      const count = intermediaireAvanceExercises.filter(ex => ex.intensity === intensity).length
      console.log(`   "${intensity}" (${count} exercices)`)
    })
    
    // Liste complète numérotée
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 Liste complète des exercices avec "Intermédiaire et avancé":\n')
    intermediaireAvanceExercises.forEach((ex, index) => {
      console.log(`${index + 1}. [${ex.source}] Exercice ${ex.number}: ${ex.title}`)
      console.log(`   Intensité: "${ex.intensity}"`)
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

countIntermediaireAvance().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
