import { NextRequest, NextResponse } from 'next/server'
import { db, update } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

const metadataDir = path.join(process.cwd(), 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées')

/**
 * Parser les métadonnées depuis un fichier Markdown (même fonction que dans parse-markdown-metadata)
 */
function parseMarkdownMetadata(content: string, filename: string) {
  const exercises: any[] = []
  const lines = content.split('\n').map(l => l.trim())
  
  let currentExercise: any = null
  let currentSection: string | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détection d'un titre d'exercice
    // Formats supportés :
    // - "**7. Titre**" (avec espace après le point)
    // - "**7.Titre**" (sans espace après le point)
    // - "7. Titre" (sans **)
    // - "7.Titre" (sans espace et sans **)
    // - "9.1Titre" (décimal sans espace après le point décimal)
    // IMPORTANT: Tester d'abord les décimaux pour éviter que "9.1" soit capturé comme "9"
    let titleMatch = line.match(/^\*\*(\d+\.\d+)\.?\s*(.+?)\*\*$/) // Décimal avec **
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+\.\d+)\.\s*(.+)$/) // Décimal avec espace
    }
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+\.\d+)([^\d\s].+)$/) // Décimal sans espace (9.1Titre)
    }
    if (!titleMatch) {
      titleMatch = line.match(/^\*\*(\d+)\.?\s*(.+?)\*\*$/) // Entier avec **
    }
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+)\.\s*(.+)$/) // Entier avec espace
    }
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+)\.([^\s\d].+)$/) // Entier sans espace (7.Titre)
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
      // Gérer plusieurs formats :
      // - "**Intensité** : valeur"
      // - "**Intensité.** valeur" (point avant la fermeture des **)
      // - "**Intensité** . valeur" (point après les **)
      let match = line.match(/\*\*Intensité\.\*\*\s*:?\s*(.+?)(?:\*\*|$)/i) // "**Intensité.** valeur"
      if (!match) {
        match = line.match(/\*\*Intensité\*\*\s*\.\s*(.+?)(?:\*\*|$)/i) // "**Intensité** . valeur"
      }
      if (!match) {
        match = line.match(/\*\*Intensité\*\*\.?\s*:?\s*(.+?)(?:\*\*|$)/i) // "**Intensité** : valeur" ou "**Intensité** valeur"
      }
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
  'streching': ['streching', 'stretching'],
  'genou': ['genou']
}

/**
 * Déterminer la région depuis le nom de fichier
 */
function getRegionFromFilename(filename: string): string | null {
  const fLower = filename.toLowerCase().replace('.md', '').trim()
  
  // Vérifier d'abord les correspondances exactes (priorité)
  for (const [region, mappings] of Object.entries(regionMapping)) {
    for (const mapping of mappings) {
      const mLower = mapping.toLowerCase().trim()
      // Correspondance exacte
      if (fLower === mLower) {
        return region
      }
    }
  }
  
  // Ensuite vérifier les correspondances partielles
  for (const [region, mappings] of Object.entries(regionMapping)) {
    for (const mapping of mappings) {
      const mLower = mapping.toLowerCase().trim()
      // Correspondance partielle (mais pas si "dos" est dans "abdos")
      if (fLower.includes(mLower) && !(mLower === 'dos' && fLower.includes('abdo'))) {
        return region
      }
      if (mLower.includes(fLower) && !(fLower === 'dos' && mLower.includes('abdo'))) {
        return region
      }
    }
  }
  
  return null
}

/**
 * Nettoyer une valeur en enlevant les ":" au début
 */
function cleanValue(value: string): string {
  if (!value) return value
  return value.replace(/^:\s*/, '').trim()
}

/**
 * Normaliser une valeur d'intensité :
 * - Commence par une majuscule
 * - Pas de point à la fin
 */
function normalizeIntensity(intensity: string): string {
  if (!intensity) return intensity
  // Enlever les ":" au début
  let cleaned = cleanValue(intensity)
  // Enlever les points à la fin
  cleaned = cleaned.replace(/\.+$/, '').trim()
  // Mettre une majuscule au début
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return cleaned
}

/**
 * Convertir l'intensité en difficulty
 */
function intensityToDifficulty(intensity: string): string {
  if (!intensity) return 'INTERMEDIATE'
  const lower = intensity.toLowerCase()
  if (lower.includes('débutant') || lower.includes('debutant')) {
    return 'BEGINNER'
  }
  if (lower.includes('intermédiaire') || lower.includes('intermediaire')) {
    return 'INTERMEDIATE'
  }
  if (lower.includes('avancé') || lower.includes('avance')) {
    return 'ADVANCED'
  }
  return 'INTERMEDIATE' // Default
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Matching et mise à jour des métadonnées...\n')
    
    // 1. Charger toutes les vidéos de Neon (type MUSCLE_GROUPS)
    const { data: videos, error: videosError } = await db
      .from('videos_new')
      .select('id, title, videoNumber, region, videoType')
      .eq('videoType', 'MUSCLE_GROUPS')
      .execute()
    
    if (videosError) {
      throw new Error(`Erreur lors de la récupération des vidéos: ${videosError.message}`)
    }
    
    console.log(`📹 ${videos?.length || 0} vidéos trouvées dans Neon\n`)
    
    // 2. Charger tous les exercices depuis les fichiers Markdown
    const files = await fs.readdir(metadataDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    
    const exercisesByRegion: { [region: string]: any[] } = {}
    const exercisesByNumber: { [region: string]: Map<number, any> } = {}
    
    for (const file of mdFiles) {
      const filePath = path.join(metadataDir, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const exercises = parseMarkdownMetadata(content, file)
      const region = getRegionFromFilename(file) || file.replace('.md', '')
      
      console.log(`   📄 ${file} → région: ${region}, ${exercises.length} exercices`)
      
      if (!exercisesByRegion[region]) {
        exercisesByRegion[region] = []
        exercisesByNumber[region] = new Map()
      }
      
      exercisesByRegion[region].push(...exercises)
      
      // Indexer par numéro
      for (const exercise of exercises) {
        if (exercise.number !== null && exercise.number !== undefined) {
          exercisesByNumber[region].set(exercise.number, exercise)
        }
      }
    }
    
    // Afficher le contenu des maps pour debug
    console.log('\n📊 Exercices indexés par région et numéro:\n')
    for (const [region, map] of Object.entries(exercisesByNumber)) {
      console.log(`   ${region}: ${map.size} exercices (numéros: ${Array.from(map.keys()).slice(0, 10).join(', ')}...)`)
    }
    console.log('')
    
    console.log(`📋 Exercices chargés par région:`)
    for (const [region, exercises] of Object.entries(exercisesByRegion)) {
      console.log(`   ${region}: ${exercises.length} exercices`)
    }
    console.log('')
    
    // 3. Matcher les vidéos avec les exercices
    let updatedCount = 0
    const updatedDetails: any[] = []
    let needsValidation: any[] = []
    let notFound: any[] = []
    let missingMetadata: any[] = []
    
    for (const video of videos || []) {
      const videoRegion = video.region || 'machine'
      const videoNumber = video.videoNumber
      
      // Normaliser la région pour la correspondance (gérer les différences d'encodage)
      // Chercher la région correspondante dans exercisesByNumber
      let region = videoRegion
      if (!exercisesByNumber[region]) {
        // Essayer de trouver une correspondance (normalisation)
        for (const [exRegion] of Object.entries(exercisesByNumber)) {
          // Comparaison insensible à la casse et aux accents
          const videoRegionNorm = videoRegion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const exRegionNorm = exRegion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          if (videoRegionNorm === exRegionNorm || videoRegionNorm.includes(exRegionNorm) || exRegionNorm.includes(videoRegionNorm)) {
            region = exRegion
            break
          }
        }
      }
      
      let matchedExercise: any = null
      let matchMethod = ''
      
      // PRIORITÉ 1 : Matching par numéro
      if (videoNumber !== null && videoNumber !== undefined && exercisesByNumber[region]) {
        // Convertir videoNumber en nombre pour la comparaison (peut être une string ou un decimal)
        const num = typeof videoNumber === 'string' ? parseFloat(videoNumber) : Number(videoNumber)
        
        // Match exact
        if (exercisesByNumber[region].has(num)) {
          matchedExercise = exercisesByNumber[region].get(num)
          matchMethod = 'number'
        }
        // Match par numéro de base (pour les décimaux : 10.1, 10.2 → 10)
        else if (num % 1 !== 0) {
          const baseNumber = Math.floor(num)
          if (exercisesByNumber[region].has(baseNumber)) {
            matchedExercise = exercisesByNumber[region].get(baseNumber)
            matchMethod = 'number_base'
          }
        }
        // Match par numéro de base (pour les entiers : 10 → 10.1, 10.2)
        else {
          for (const [exNumber, exercise] of exercisesByNumber[region].entries()) {
            if (exNumber % 1 !== 0 && Math.floor(exNumber) === num) {
              matchedExercise = exercise
              matchMethod = 'number_variant'
              break
            }
          }
        }
      }
      
      if (matchedExercise) {
        // Mettre à jour les métadonnées
        // Nettoyer toutes les valeurs pour enlever les ":" au début
        // Normaliser l'intensité (majuscule au début, pas de point à la fin)
        const rawIntensity = cleanValue(matchedExercise.intensity || '')
        const normalizedIntensity = normalizeIntensity(rawIntensity)
        
        const updateData: any = {
          targeted_muscles: matchedExercise.targetedMuscles || [],
          startingPosition: cleanValue(matchedExercise.startingPosition || ''),
          movement: cleanValue(matchedExercise.movement || ''),
          intensity: normalizedIntensity,
          series: cleanValue(matchedExercise.series || ''),
          constraints: cleanValue(matchedExercise.constraints || ''),
          theme: cleanValue(matchedExercise.theme || ''),
          updatedAt: new Date().toISOString()
        }
        
        // Convertir l'intensité en difficulty (après normalisation)
        if (updateData.intensity) {
          updateData.difficulty = intensityToDifficulty(updateData.intensity)
        }
        
        const updateResult = await update('videos_new', updateData, { id: video.id })
        
        if (updateResult.error) {
          console.error(`❌ Erreur lors de la mise à jour de la vidéo ${video.id}:`, updateResult.error)
          continue
        }
        
        updatedCount++
        updatedDetails.push({
          videoTitle: video.title,
          videoNumber: videoNumber,
          region: region,
          exerciseTitle: matchedExercise.title,
          matchMethod: matchMethod
        })
        if (updatedCount <= 10 || updatedCount % 50 === 0) {
          console.log(`   ✅ ${video.title} (${videoNumber}) → ${matchedExercise.title} [${matchMethod}]`)
        }
      } else {
        // Pas de match trouvé
        notFound.push({
          videoId: video.id,
          videoTitle: video.title,
          videoNumber: videoNumber,
          region: region
        })
        console.log(`   ❌ ${video.title} (${videoNumber}) → Aucun match`)
      }
    }
    
    console.log(`\n📊 Résumé:`)
    console.log(`   ✅ Mis à jour: ${updatedCount}`)
    console.log(`   ❌ Sans correspondance: ${notFound.length}`)
    console.log(`   ⚠️  Nécessitent validation: ${needsValidation.length}`)
    console.log(`   📝 Métadonnées manquantes: ${missingMetadata.length}\n`)
    
    return NextResponse.json({
      success: true,
      updated: updatedCount,
      needsValidation: needsValidation,
      notFound: notFound,
      missingMetadata: missingMetadata
    })
    
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du matching' },
      { status: 500 }
    )
  }
}
