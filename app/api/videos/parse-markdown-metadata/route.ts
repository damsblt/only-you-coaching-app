import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const metadataDir = path.join(process.cwd(), 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées')

/**
 * Parser les métadonnées depuis un fichier Markdown
 */
function parseMarkdownMetadata(content: string, filename: string) {
  const exercises: any[] = []
  const lines = content.split('\n').map(l => l.trim())
  
  let currentExercise: any = null
  let currentSection: string | null = null
  
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
    
    if (line.includes('**Intensité')) {
      currentSection = 'intensity'
      const match = line.match(/\*\*Intensité\*\*\.?\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.intensity = match[1].trim()
      }
      continue
    }
    
    if (line.includes('**Série')) {
      currentSection = 'series'
      const match = line.match(/\*\*Série\s*:\*\*\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.series = match[1].trim()
      }
      continue
    }
    
    if (line.includes('**Contre')) {
      currentSection = 'constraints'
      const match = line.match(/\*\*Contre\s*-?\s*indication\s*:\*\*\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1]) {
        currentExercise.constraints = match[1].trim()
      }
      continue
    }
    
    if (line.includes('**Thème')) {
      currentSection = 'theme'
      const match = line.match(/\*\*Thème\s*:\*\*\s*([^*]+?)(?:\*\*|$)/i)
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
      }
    }
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Mapping des régions
 */
const regionMapping: { [key: string]: string[] } = {
  'abdos': ['abdominaux', 'abdos'],
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
 * Déterminer la région depuis le nom de fichier
 */
function getRegionFromFilename(filename: string): string | null {
  const fLower = filename.toLowerCase().replace('.md', '')
  
  for (const [region, mappings] of Object.entries(regionMapping)) {
    if (mappings.some(m => {
      const mLower = m.toLowerCase().replace(/\s+/g, ' ')
      return fLower === mLower || 
             fLower.includes(mLower) || 
             mLower.includes(fLower) ||
             fLower.replace(/\s+/g, ' ').includes(mLower.replace(/\s+/g, ' '))
    })) {
      return region
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Lister tous les fichiers Markdown
    const files = await fs.readdir(metadataDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    
    console.log(`📂 ${mdFiles.length} fichiers Markdown trouvés\n`)
    
    const allExercises: { [region: string]: any[] } = {}
    
    for (const file of mdFiles) {
      const filePath = path.join(metadataDir, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const exercises = parseMarkdownMetadata(content, file)
      const region = getRegionFromFilename(file) || file.replace('.md', '')
      
      if (!allExercises[region]) {
        allExercises[region] = []
      }
      
      allExercises[region].push(...exercises)
      
      console.log(`   ✅ ${file}: ${exercises.length} exercices (région: ${region})`)
    }
    
    const totalExercises = Object.values(allExercises).reduce((sum, ex) => sum + ex.length, 0)
    console.log(`\n✅ Total: ${totalExercises} exercices chargés depuis les fichiers Markdown\n`)
    
    return NextResponse.json({
      success: true,
      exercises: allExercises,
      total: totalExercises,
      regions: Object.keys(allExercises)
    })
    
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du parsing des métadonnées' },
      { status: 500 }
    )
  }
}
