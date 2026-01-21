/**
 * Script pour appliquer les meilleurs matches trouvés
 * N'applique que les matches avec une similarité >= 95% pour éviter les erreurs
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

// [Copie des fonctions de find-better-matches.js]

function advancedNormalize(title) {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/\s+à\s+la\s+poulie/g, ' poulie')
    .replace(/\s+avec\s+/g, ' ')
    .replace(/\s+et\s+/g, ' ')
    .replace(/\s+\+\s+/g, ' ')
    .replace(/position\s+de\s+/g, '')
    .replace(/\s+le\s+/g, ' ')
    .replace(/\s+la\s+/g, ' ')
    .replace(/\s+les\s+/g, ' ')
    .replace(/\s+un\s+/g, ' ')
    .replace(/\s+une\s+/g, ' ')
    .replace(/\s+des\s+/g, ' ')
    .replace(/\s+du\s+/g, ' ')
    .replace(/\s+de\s+/g, ' ')
    .replace(/\s+d'/g, ' ')
    .replace(/s$/, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateAdvancedSimilarity(str1, str2) {
  const normalized1 = advancedNormalize(str1)
  const normalized2 = advancedNormalize(str2)
  
  const words1 = normalized1.split(' ').filter(w => w.length > 2)
  const words2 = normalized2.split(' ').filter(w => w.length > 2)
  
  let commonWords = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        commonWords++
        break
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length)
  const wordSimilarity = commonWords / maxWords
  
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return Math.max(wordSimilarity, 0.9)
  }
  
  return wordSimilarity
}

function parseMetadata(text, filename) {
  const exercises = []
  const lines = text.split('\n')
  
  let currentExercise = null
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('#')) {
      let nextNonEmptyLine = null
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const nextLine = lines[j].trim()
        if (nextLine) {
          nextNonEmptyLine = nextLine
          break
        }
      }
      
      if (nextNonEmptyLine && nextNonEmptyLine.toLowerCase().includes('muscle cible')) {
        if (currentExercise && currentExercise.title) {
          exercises.push(currentExercise)
        }
        
        currentExercise = {
          title: line,
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
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

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
  } else if (intensityLower.includes('tout niveau')) {
    return 'INTERMEDIATE'
  }
  
  return 'indéfini'
}

console.log('📖 Extraction des métadonnées des fichiers Word...\n')

const files = await fs.readdir(metadataDir)
const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$'))

let allExercises = []

for (const file of docxFiles) {
  const filePath = path.join(metadataDir, file)
  
  try {
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
    
    const exercises = parseMetadata(text, file)
    allExercises = allExercises.concat(exercises)
  } catch (error) {
    console.error(`   ❌ Erreur: ${file}:`, error.message)
  }
}

console.log(`✅ ${allExercises.length} exercices extraits\n`)

// Récupérer les vidéos sans métadonnées
const videos = await sql`
  SELECT id, title
  FROM videos_new
  WHERE "videoType" = 'MUSCLE_GROUPS'
  AND ("startingPosition" IS NULL OR "startingPosition" = '')
  AND (movement IS NULL OR movement = '')
`

console.log(`📊 ${videos.length} vidéos sans métadonnées\n`)
console.log('🔄 Application des matches (similarité >= 95%)...\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

let updatedCount = 0

for (const video of videos) {
  let bestMatch = null
  let bestSimilarity = 0
  
  for (const exercise of allExercises) {
    const similarity = calculateAdvancedSimilarity(video.title, exercise.title)
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = exercise
    }
  }
  
  // N'appliquer que les matches très sûrs (>= 95%)
  if (bestMatch && bestSimilarity >= 0.95) {
    try {
      await sql`
        UPDATE videos_new
        SET 
          targeted_muscles = ${bestMatch.targetedMuscles},
          "startingPosition" = ${bestMatch.startingPosition || ''},
          movement = ${bestMatch.movement || ''},
          intensity = ${bestMatch.intensity || ''},
          series = ${bestMatch.series || ''},
          constraints = ${bestMatch.constraints || 'Aucune'},
          theme = ${bestMatch.theme || 'Renforcement'},
          difficulty = ${mapIntensityToDifficulty(bestMatch.intensity)},
          "updatedAt" = ${new Date().toISOString()}
        WHERE id = ${video.id}
      `
      
      console.log(`✅ ${video.title}`)
      console.log(`   ↔️  ${bestMatch.title}`)
      console.log(`   📊 Similarité: ${(bestSimilarity * 100).toFixed(1)}%`)
      console.log(`   📄 Source: ${bestMatch.source}\n`)
      
      updatedCount++
    } catch (error) {
      console.error(`❌ Erreur: ${video.title}:`, error.message)
    }
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`\n📊 Résumé: ${updatedCount} vidéos mises à jour\n`)
console.log('✅ Terminé!')
process.exit(0)
