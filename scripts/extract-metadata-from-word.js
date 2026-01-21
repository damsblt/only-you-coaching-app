/**
 * Script pour extraire les métadonnées des fichiers Word (.docx)
 * 
 * Installation requise:
 * npm install mammoth
 */

import { neon } from '@neondatabase/serverless'
import ws from 'ws'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Vérifier si mammoth est installé
let mammoth
try {
  mammoth = await import('mammoth')
} catch (error) {
  console.error('❌ La bibliothèque "mammoth" n\'est pas installée')
  console.error('   Installez-la avec: npm install mammoth')
  process.exit(1)
}

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

// Lire tous les fichiers Word du dossier
const files = await fs.readdir(metadataDir)
const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$'))

console.log(`📂 Fichiers Word trouvés: ${docxFiles.length}`)
docxFiles.forEach(f => console.log(`   - ${f}`))

// Parser les métadonnées d'un fichier Word converti en texte
function parseMetadata(text, filename) {
  const exercises = []
  const lines = text.split('\n')
  
  let currentExercise = null
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Détection d'un nouveau titre d'exercice
    if (line && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('#') && !line.includes(':') && !line.match(/^\d+\./)) {
      // Vérifier si la prochaine ligne contient "Muscle cible"
      let nextNonEmptyLine = null
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const nextLine = lines[j].trim()
        if (nextLine) {
          nextNonEmptyLine = nextLine
          break
        }
      }
      
      if (nextNonEmptyLine && (
        nextNonEmptyLine.toLowerCase().includes('muscle cible') ||
        nextNonEmptyLine.toLowerCase().includes('position') ||
        nextNonEmptyLine.toLowerCase().includes('mouvement')
      )) {
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

// Normaliser le titre pour la comparaison
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/s$/, '')
    .replace(/[^a-z0-9]/g, '')
}

// Calculer la similarité entre deux titres
function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeTitle(str1)
  const normalized2 = normalizeTitle(str2)
  
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 1.0
  }
  
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

// Mapper l'intensité vers la difficulté
function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'indéfini'
  
  const intensityLower = intensity.toLowerCase()
  
  if (intensityLower.includes('débutant')) {
    return 'BEGINNER'
  } else if (intensityLower.includes('intermédiaire') && intensityLower.includes('avancé')) {
    return 'INTERMEDIATE'
  } else if (intensityLower.includes('intermédiaire')) {
    return 'INTERMEDIATE'
  } else if (intensityLower.includes('avancé')) {
    return 'ADVANCED'
  }
  
  return 'indéfini'
}

console.log('\n📖 Extraction des métadonnées des fichiers Word...')
let allExercises = []

for (const file of docxFiles) {
  const filePath = path.join(metadataDir, file)
  
  try {
    // Lire le fichier Word et le convertir en texte
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
    
    // Parser le texte pour extraire les métadonnées
    const exercises = parseMetadata(text, file)
    allExercises = allExercises.concat(exercises)
    console.log(`   ✅ ${file}: ${exercises.length} exercices`)
  } catch (error) {
    console.error(`   ❌ Erreur lors de la lecture de ${file}:`, error.message)
  }
}

console.log(`\n✅ Total: ${allExercises.length} exercices trouvés dans les fichiers Word`)

if (allExercises.length === 0) {
  console.log('\n⚠️  Aucun exercice trouvé. Vérifiez le format des fichiers Word.')
  process.exit(0)
}

// Récupérer les vidéos de la base de données
console.log('\n📥 Récupération des vidéos depuis la base de données...')
const videos = await sql`
  SELECT id, title, difficulty, targeted_muscles, "startingPosition", movement, intensity, series, constraints, theme
  FROM videos_new
  WHERE "videoType" = 'MUSCLE_GROUPS'
`

console.log(`✅ ${videos.length} vidéos trouvées`)

let updatedCount = 0
let notFoundCount = 0

console.log('\n🔄 Mise à jour des vidéos avec les métadonnées extraites...')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

for (const video of videos) {
  // Trouver l'exercice correspondant
  let exercise = null
  let bestSimilarity = 0
  
  for (const ex of allExercises) {
    const similarity = calculateSimilarity(video.title, ex.title)
    if (similarity > bestSimilarity && similarity > 0.75) {
      bestSimilarity = similarity
      exercise = ex
    }
  }
  
  if (!exercise) {
    notFoundCount++
    continue
  }
  
  // Vérifier si la vidéo a besoin d'être mise à jour
  const needsUpdate = 
    video.difficulty === 'indéfini' ||
    !video.targeted_muscles || video.targeted_muscles.length === 0 ||
    !video.startingPosition ||
    !video.movement ||
    !video.intensity ||
    !video.series ||
    !video.constraints ||
    !video.theme
  
  if (!needsUpdate) {
    continue
  }
  
  // Préparer les données (uniquement si elles existent vraiment)
  const updateData = {
    targeted_muscles: exercise.targetedMuscles.length > 0 ? exercise.targetedMuscles : video.targeted_muscles || [],
    startingPosition: exercise.startingPosition || video.startingPosition || '',
    movement: exercise.movement || video.movement || '',
    intensity: exercise.intensity || video.intensity || '',
    series: exercise.series || video.series || '',
    constraints: exercise.constraints || video.constraints || '',
    theme: exercise.theme || video.theme || '',
    difficulty: video.difficulty === 'indéfini' && exercise.intensity ? mapIntensityToDifficulty(exercise.intensity) : video.difficulty,
    updatedAt: new Date().toISOString()
  }
  
  try {
    await sql`
      UPDATE videos_new
      SET 
        targeted_muscles = ${updateData.targeted_muscles},
        "startingPosition" = ${updateData.startingPosition},
        movement = ${updateData.movement},
        intensity = ${updateData.intensity},
        series = ${updateData.series},
        constraints = ${updateData.constraints},
        theme = ${updateData.theme},
        difficulty = ${updateData.difficulty},
        "updatedAt" = ${updateData.updatedAt}
      WHERE id = ${video.id}
    `
    
    console.log(`✅ ${video.title}`)
    console.log(`   Source: ${exercise.source}`)
    console.log(`   Difficulté: ${video.difficulty} → ${updateData.difficulty}`)
    updatedCount++
  } catch (error) {
    console.error(`❌ Erreur: ${video.title}:`, error.message)
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`\n📊 Résumé:`)
console.log(`   - ${updatedCount} vidéos mises à jour avec les métadonnées Word`)
console.log(`   - ${notFoundCount} vidéos sans correspondance`)

console.log('\n✅ Terminé!')
process.exit(0)
