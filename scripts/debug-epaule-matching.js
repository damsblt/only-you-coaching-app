#!/usr/bin/env node
/**
 * Script de debug pour comprendre pourquoi les vidéos épaule ne sont pas matchées
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)
const metadataDir = path.join(process.cwd(), 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées')

// Fonction parseMarkdownMetadata (copiée de l'API)
function parseMarkdownMetadata(content, filename) {
  const exercises = []
  const lines = content.split('\n').map(l => l.trim())
  
  let currentExercise = null
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détection avec le nouvel ordre
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
      currentExercise = { number, title, targetedMuscles: [], startingPosition: '', movement: '', intensity: '', series: '', constraints: '', theme: '' }
      currentSection = null
      continue
    }
    
    if (!currentExercise) continue
    
    // Parser les sections (simplifié)
    if (line.includes('**Muscle cible')) {
      const match = line.match(/\*\*Muscle cible\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.targetedMuscles = match[1].split(',').map(m => m.trim()).filter(m => m)
      }
      continue
    }
    
    if (line.includes('**Position départ')) {
      currentSection = 'startingPosition'
      continue
    }
    
    if (currentSection === 'startingPosition' && line && !line.includes('**') && !line.includes('Mouvement') && !line.includes('Intensité') && !line.includes('Série') && !line.includes('Contre') && !line.includes('Thème')) {
      currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + line
    }
    
    if (line.includes('**Mouvement')) {
      currentSection = 'movement'
      continue
    }
    
    if (currentSection === 'movement' && line && !line.includes('**') && !line.includes('Intensité') && !line.includes('Série') && !line.includes('Contre') && !line.includes('Thème')) {
      currentExercise.movement += (currentExercise.movement ? ' ' : '') + line
    }
    
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
    
    if (line.includes('**Série')) {
      const match = line.match(/\*\*Série\s*:?\*\*\s*:?\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.series = match[1].trim()
      }
      continue
    }
    
    if (line.includes('**Contre') || line.includes('**Contre -indication')) {
      const match = line.match(/\*\*Contre\s*-?\s*indication\*\*\s*:?\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.constraints = match[1].trim()
      }
      continue
    }
    
    if (line.includes('**Thème')) {
      const match = line.match(/\*\*Thème\*\*\s*:?\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.theme = match[1].trim()
      }
      continue
    }
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

// Fonction getRegionFromFilename
const regionMapping = {
  'épaule': ['epaule', 'épaule']
}

function getRegionFromFilename(filename) {
  const fLower = filename.toLowerCase().replace('.md', '').trim()
  for (const [region, mappings] of Object.entries(regionMapping)) {
    for (const mapping of mappings) {
      const mLower = mapping.toLowerCase().trim()
      if (fLower === mLower) {
        return region
      }
    }
  }
  return null
}

async function debugMatching() {
  console.log('🔍 Debug du matching pour les vidéos épaule\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Charger les exercices depuis epaule.md
    const filePath = path.join(metadataDir, 'epaule.md')
    const content = fs.readFileSync(filePath, 'utf-8')
    const exercises = parseMarkdownMetadata(content, 'epaule.md')
    const region = getRegionFromFilename('epaule.md')
    
    console.log(`📄 Fichier: epaule.md`)
    console.log(`   Région détectée: '${region}'\n`)
    console.log(`   Exercices parsés: ${exercises.length}\n`)
    
    // Créer la map
    const exercisesByNumber = new Map()
    exercises.forEach(ex => {
      if (ex.number !== null && ex.number !== undefined) {
        exercisesByNumber.set(ex.number, ex)
      }
    })
    
    console.log(`📋 Exercices indexés: ${exercisesByNumber.size}\n`)
    const sortedNumbers = Array.from(exercisesByNumber.keys()).sort((a, b) => a - b)
    sortedNumbers.forEach(num => {
      const ex = exercisesByNumber.get(num)
      console.log(`   ${num}: ${ex.title.substring(0, 50)}`)
    })
    console.log('')
    
    // 2. Charger les vidéos épaule depuis Neon
    const videos = await sql`
      SELECT id, title, "videoNumber", region
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND region ILIKE '%paule%'
      ORDER BY "videoNumber"
    `
    
    console.log(`📹 Vidéos dans Neon: ${videos.length}\n`)
    
    // 3. Tester le matching pour chaque vidéo
    let matchedCount = 0
    let notMatchedCount = 0
    
    for (const video of videos) {
      const videoRegion = video.region || 'machine'
      const videoNumber = video.videoNumber
      
      console.log(`\n📹 Vidéo: ${video.title.substring(0, 50)}`)
      console.log(`   videoNumber: ${videoNumber} (type: ${typeof videoNumber})`)
      console.log(`   region: '${videoRegion}'`)
      console.log(`   region === '${region}': ${videoRegion === region}`)
      console.log(`   exercisesByNumber[region] existe: ${!!exercisesByNumber}`)
      
      if (videoNumber !== null && videoNumber !== undefined) {
        const num = typeof videoNumber === 'string' ? parseFloat(videoNumber) : Number(videoNumber)
        console.log(`   num converti: ${num} (type: ${typeof num})`)
        console.log(`   exercisesByNumber.has(${num}): ${exercisesByNumber.has(num)}`)
        
        if (exercisesByNumber.has(num)) {
          const exercise = exercisesByNumber.get(num)
          console.log(`   ✅ MATCH TROUVÉ: ${exercise.title.substring(0, 50)}`)
          matchedCount++
        } else {
          console.log(`   ❌ PAS DE MATCH`)
          console.log(`   Clés disponibles: ${Array.from(exercisesByNumber.keys()).join(', ')}`)
          notMatchedCount++
        }
      } else {
        console.log(`   ❌ videoNumber est null/undefined`)
        notMatchedCount++
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`📊 Résumé:`)
    console.log(`   ✅ Matchés: ${matchedCount}`)
    console.log(`   ❌ Non matchés: ${notMatchedCount}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

debugMatching().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
