/**
 * Script pour mettre à jour toutes les vidéos avec les métadonnées du fichier metadonnees-completes.md
 */

import { neon } from '@neondatabase/serverless'
import ws from 'ws'
import dotenv from 'dotenv'
import fs from 'fs/promises'

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

const metadataFile = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-completes.md'

console.log('📖 Lecture du fichier de métadonnées...')
const content = await fs.readFile(metadataFile, 'utf-8')

// Parser les métadonnées
function parseMetadata(content) {
  const exercises = []
  const lines = content.split('\n')
  
  let currentExercise = null
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Détection d'un nouveau titre d'exercice (ligne non vide, pas de préfixe spécial, suivie d'une ligne avec "Muscle cible")
    if (line && !line.startsWith('-') && !line.includes(':') && !line.match(/^\d+\./)) {
      // Vérifier si la prochaine ligne contient "Muscle cible"
      let nextNonEmptyLine = null
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const nextLine = lines[j].trim()
        if (nextLine) {
          nextNonEmptyLine = nextLine
          break
        }
      }
      
      if (nextNonEmptyLine && nextNonEmptyLine.toLowerCase().includes('muscle cible')) {
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
          theme: ''
        }
        currentSection = null
        continue
      }
    }
    
    if (!currentExercise) continue
    
    // Parser les différentes sections
    if (line.toLowerCase().includes('muscle cible')) {
      currentSection = 'muscles'
      // Extraire les muscles de la même ligne
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
      // Extraire l'intensité de la même ligne
      const intensity = line.split(/[:.]/)[1]
      if (intensity) {
        currentExercise.intensity = intensity.trim()
      }
    } else if (line.toLowerCase().includes('série')) {
      currentSection = 'series'
      // Extraire la série de la même ligne
      const series = line.split(':')[1]
      if (series) {
        currentExercise.series = series.trim()
      }
    } else if (line.toLowerCase().includes('contre') && line.toLowerCase().includes('indication')) {
      currentSection = 'constraints'
      // Extraire les contraintes de la même ligne
      const constraints = line.split(':')[1]
      if (constraints) {
        currentExercise.constraints = constraints.trim()
      }
    } else if (line.toLowerCase().includes('thème')) {
      currentSection = 'theme'
      // Extraire le thème de la même ligne
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
    .replace(/s$/, '') // Retirer le 's' à la fin pour gérer les pluriels
    .replace(/[^a-z0-9]/g, '')
}

// Calculer la similarité entre deux titres
function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeTitle(str1)
  const normalized2 = normalizeTitle(str2)
  
  // Vérifier si l'un contient l'autre
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 1.0
  }
  
  // Calculer la distance de Levenshtein
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
    return 'INTERMEDIATE' // ou ADVANCED selon le contexte
  } else if (intensityLower.includes('intermédiaire')) {
    return 'INTERMEDIATE'
  } else if (intensityLower.includes('avancé')) {
    return 'ADVANCED'
  }
  
  return 'indéfini'
}

console.log('🔍 Parsing des métadonnées...')
const exercises = parseMetadata(content)
console.log(`✅ ${exercises.length} exercices trouvés dans le fichier de métadonnées`)

// Récupérer toutes les vidéos de la base de données
console.log('\n📥 Récupération des vidéos depuis la base de données...')
const videos = await sql`
  SELECT id, title, difficulty, targeted_muscles, "startingPosition", movement, intensity, series, constraints, theme
  FROM videos_new
  WHERE "videoType" = 'MUSCLE_GROUPS'
`

console.log(`✅ ${videos.length} vidéos trouvées dans la base de données`)

let updatedCount = 0
let notFoundCount = 0
const notFoundTitles = []

console.log('\n🔄 Mise à jour des vidéos...')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

for (const video of videos) {
  // Trouver l'exercice correspondant avec un matching flexible
  let exercise = null
  let bestSimilarity = 0
  
  for (const ex of exercises) {
    const similarity = calculateSimilarity(video.title, ex.title)
    if (similarity > bestSimilarity && similarity > 0.75) { // Seuil de similarité de 75%
      bestSimilarity = similarity
      exercise = ex
    }
  }
  
  if (!exercise) {
    notFoundCount++
    notFoundTitles.push(video.title)
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
  
  // Préparer les données de mise à jour
  const updateData = {
    targeted_muscles: exercise.targetedMuscles.length > 0 ? exercise.targetedMuscles : video.targeted_muscles || [],
    startingPosition: exercise.startingPosition || video.startingPosition || '',
    movement: exercise.movement || video.movement || '',
    intensity: exercise.intensity || video.intensity || '',
    series: exercise.series || video.series || '',
    constraints: exercise.constraints || video.constraints || 'Aucune',
    theme: exercise.theme || video.theme || '',
    difficulty: video.difficulty === 'indéfini' ? mapIntensityToDifficulty(exercise.intensity) : video.difficulty,
    updatedAt: new Date().toISOString()
  }
  
  // Mettre à jour la vidéo
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
    
    console.log(`✅ Mise à jour: ${video.title}`)
    console.log(`   - Difficulté: ${video.difficulty} → ${updateData.difficulty}`)
    console.log(`   - Muscles ciblés: ${updateData.targeted_muscles.join(', ')}`)
    console.log(`   - Intensité: ${updateData.intensity}`)
    updatedCount++
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${video.title}:`, error.message)
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`\n📊 Résumé:`)
console.log(`   - ${updatedCount} vidéos mises à jour`)
console.log(`   - ${notFoundCount} vidéos sans métadonnées correspondantes`)

if (notFoundTitles.length > 0 && notFoundTitles.length <= 20) {
  console.log(`\n⚠️  Vidéos sans métadonnées:`)
  notFoundTitles.forEach(title => console.log(`   - ${title}`))
}

console.log('\n✅ Terminé!')
process.exit(0)
