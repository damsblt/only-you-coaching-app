#!/usr/bin/env node
/**
 * Script pour mettre à jour les métadonnées des vidéos MUSCLE_GROUPS depuis les fichiers Word
 * Usage: node scripts/update-muscle-groups-metadata.js
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')
const AdmZip = require('adm-zip')

const sql = neon(process.env.DATABASE_URL)
const METADATA_DIR = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'

// Helper functions
const cleanMarkdown = (str) => str ? str.replace(/\*\*/g, '').replace(/^\*\s*/, '').replace(/^:\s*/, '').trim() : null
const removeTrailingDot = (str) => str ? str.replace(/\.$/, '').trim() : null

// Normalize title for matching (remove accents, lowercase, remove special chars)
function normalizeTitle(title) {
  if (!title) return ''
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

// Calculate similarity between two titles (simple word overlap)
function titleSimilarity(title1, title2) {
  const words1 = new Set(normalizeTitle(title1).split(/\s+/))
  const words2 = new Set(normalizeTitle(title2).split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

/**
 * Extract text from Word document
 */
async function extractTextFromWord(wordPath) {
  try {
    const result = await mammoth.extractRawText({ path: wordPath })
    return result.value
  } catch (error) {
    // Fallback to manual extraction
    try {
      const zip = new AdmZip(wordPath)
      const xmlContent = zip.readAsText('word/document.xml')
      const text = xmlContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text
    } catch (error2) {
      throw new Error(`Failed to extract text: ${error2.message}`)
    }
  }
}

/**
 * Parse exercises from text (format: title on first line, then metadata)
 */
function parseExercisesFromText(text, region) {
  const exercises = []
  
  // Split by patterns that indicate new exercise:
  // - Look for title patterns followed by "Muscle cible"
  // - Each exercise starts with a title, then "Muscle cible :"
  const exercisePattern = /([^\n]+)\n\s*Muscle\s+cible\s*:?\s*([\s\S]*?)(?=\n\s*[^\n]+\n\s*Muscle\s+cible\s*:|$)/gi
  const sections = []
  let match
  while ((match = exercisePattern.exec(text)) !== null) {
    sections.push({
      title: match[1].trim(),
      content: `Muscle cible : ${match[2]}`
    })
  }
  
  // Fallback: split by double newlines if pattern matching didn't work
  if (sections.length === 0) {
    const fallbackSections = text.split(/\n\s*\n+/).filter(s => s.trim().length > 0)
    for (const section of fallbackSections) {
      const muscleIndex = section.indexOf('Muscle cible')
      if (muscleIndex > 0) {
        sections.push({
          title: section.substring(0, muscleIndex).trim(),
          content: section.substring(muscleIndex)
        })
      }
    }
  }
  
  for (const section of sections) {
    const title = section.title
    const content = section.content
    
    if (!title || title.length === 0) continue
    
    // Skip if title looks like a metadata label or action verb
    if (/^(Muscle cible|Position départ|Mouvement|Intensité|Série|Contre-indication|Thème)\s*:?/i.test(title)) {
      continue
    }
    if (/^(Expirer|Revenir|Maintenir|Tenir|Inspirer|Soulever|Descendre|Remonter|Tirer|Pousser|Tendre|Fléchir|Les|Se|Répéter)/i.test(title)) {
      continue
    }
    
    // Handle "Muscle cible :", "Muscle cible.", or "Muscle cible" (with optional punctuation)
    const muscleMatch = content.match(/Muscle\s+cible\s*[.:]?\s*(.+?)(?:\n|Position|Mouvement|Intensité|Série|Contre|Thème|$)/i)
    // Handle "Position départ :", "Position départ.", or "Position départ" (with optional punctuation)
    const positionMatch = content.match(/Position\s+d[ée]part\s*[.:]?\s*([\s\S]*?)(?=Mouvement|Intensit[ée]|S[ée]rie|Contre|Thème|$)/i)
    // Handle "Mouvement :", "Mouvement.", or "Mouvement" (with optional punctuation)
    const mouvementMatch = content.match(/Mouvement\s*[.:]?\s*([\s\S]*?)(?=Intensit[ée]|S[ée]rie|Contre|Thème|$)/i)
    // Handle "Intensité.", "Intensité :", or "Intensité" (with optional punctuation)
    const intensiteMatch = content.match(/Intensit[ée]\s*[.:]?\s*(.+?)(?:\n|S[ée]rie|Contre|Thème|$)/i)
    // Handle "Série :", "Série.", or "Série" (with optional punctuation)
    const serieMatch = content.match(/S[ée]ries?\s*[.:]?\s*(.+?)(?:\n|Contre[-\s]+indication|Thème|$)/i)
    // Handle "Contre -indication" (with space) and "Contre-indication" (with dash)
    const contreMatch = content.match(/Contre[-\s]+indication\s*:?\s*(.+?)(?:\n|Thème|$)/i)
    const themeMatch = content.match(/Thème\s*:?\s*(.+?)(?:\n|$)/i)
    
    // Only add if we have at least title and one metadata field
    if (title && (muscleMatch || positionMatch || mouvementMatch)) {
      exercises.push({
        title: cleanMarkdown(title),
        muscleCible: muscleMatch ? removeTrailingDot(cleanMarkdown(muscleMatch[1])) : null,
        positionDepart: positionMatch ? cleanMarkdown(positionMatch[1]) : null,
        mouvement: mouvementMatch ? cleanMarkdown(mouvementMatch[1]) : null,
        intensite: intensiteMatch ? removeTrailingDot(cleanMarkdown(intensiteMatch[1])) : null,
        serie: serieMatch ? removeTrailingDot(cleanMarkdown(serieMatch[1])) : null,
        contreIndication: contreMatch ? removeTrailingDot(cleanMarkdown(contreMatch[1])) : null,
        theme: themeMatch ? cleanMarkdown(themeMatch[1]) : null,
        region: region
      })
    }
  }
  
  return exercises
}

/**
 * Find matching video in database by title similarity
 */
async function findMatchingVideo(exercise, region) {
  // Get all videos for this region
  const videos = await sql`
    SELECT id, title, "videoUrl" 
    FROM videos_new 
    WHERE region = ${region} 
      AND "videoType" = 'MUSCLE_GROUPS'
      AND "isPublished" = true
      AND "videoUrl" LIKE '%.mp4'
  `
  
  if (!videos || videos.length === 0) {
    return null
  }
  
  // Find best match by title similarity
  let bestMatch = null
  let bestScore = 0
  
  for (const video of videos) {
    const score = titleSimilarity(exercise.title, video.title)
    if (score > bestScore && score > 0.3) { // Minimum 30% similarity
      bestScore = score
      bestMatch = video
    }
  }
  
  return bestMatch
}

/**
 * Update video metadata in Neon
 */
async function updateVideoMetadata(videoId, exercise) {
  const updates = {}
  
  if (exercise.muscleCible) {
    // Split by comma and clean
    const muscles = exercise.muscleCible
      .split(',')
      .map(m => removeTrailingDot(m.trim()))
      .filter(m => m.length > 0)
    updates.targeted_muscles = muscles
  }
  
  if (exercise.positionDepart) updates.startingPosition = exercise.positionDepart
  if (exercise.mouvement) updates.movement = exercise.mouvement
  if (exercise.intensite) updates.intensity = exercise.intensite
  if (exercise.serie) updates.series = exercise.serie
  if (exercise.contreIndication) updates.constraints = exercise.contreIndication
  if (exercise.theme) updates.theme = exercise.theme
  
  if (Object.keys(updates).length === 0) {
    return false
  }
  
  // Build update query using tagged template
  const setParts = []
  const values = []
  let paramIndex = 1
  
  for (const [key, value] of Object.entries(updates)) {
    setParts.push(`"${key}" = $${paramIndex}`)
    values.push(value)
    paramIndex++
  }
  
  values.push(videoId)
  
  const query = `UPDATE videos_new SET ${setParts.join(', ')} WHERE id = $${paramIndex}`
  
  await sql.query(query, values)
  
  return true
}

/**
 * Process a single Word file
 */
async function processWordFile(wordPath, region) {
  console.log(`\n📄 Traitement de: ${path.basename(wordPath)}`)
  
  try {
    const text = await extractTextFromWord(wordPath)
    const exercises = parseExercisesFromText(text, region)
    
    console.log(`   ✅ ${exercises.length} exercice(s) extrait(s)`)
    
    let updatedCount = 0
    let notFoundCount = 0
    
    for (const exercise of exercises) {
      const video = await findMatchingVideo(exercise, region)
      
      if (video) {
        const wasUpdated = await updateVideoMetadata(video.id, exercise)
        if (wasUpdated) {
          console.log(`   ✅ Mis à jour: "${exercise.title}" → "${video.title}"`)
          updatedCount++
        }
      } else {
        console.log(`   ⚠️  Non trouvé: "${exercise.title}"`)
        notFoundCount++
      }
    }
    
    return { updated: updatedCount, notFound: notFoundCount, total: exercises.length }
    
    return { updated, notFound, total: exercises.length }
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`)
    return { updated: 0, notFound: 0, total: 0 }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Mise à jour des métadonnées des vidéos MUSCLE_GROUPS\n')
  
  // Map file names to regions
  const fileRegionMap = {
    'abdominaux complet.docx': 'abdos',
    'fessier jambe.docx': 'fessiers-jambes',
    'Biceps assis sur le ballon.docx': 'biceps',
    'Triceps assis sur le ballon.docx': 'triceps',
    'DV assis sur le ballon.docx': 'pectoraux',
    'Tirage poitrine 1 bras à genoux au sol.docx': 'dos',
    'Coiffe des rotateur assis sur le ballon.docx': 'dos',
    'Squat avec band.docx': 'fessiers-jambes',
    'exercice cardi fente sauté niveau 1.docx': 'cardio',
    'Genou sur le thorax couché au sol.docx': 'streching',
    'exercices sur MACHINE OK.docx': null // Skip machine exercises (already handled)
  }
  
  // Normalize file names for matching (handle encoding issues)
  function normalizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const files = fs.readdirSync(METADATA_DIR)
    .filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
  
  let totalUpdated = 0
  let totalNotFound = 0
  let totalProcessed = 0
  
  for (const file of files) {
    // Try exact match first
    let region = fileRegionMap[file]
    
    // If no exact match, try normalized matching
    if (!region) {
      const normalizedFile = normalizeFileName(file)
      for (const [key, value] of Object.entries(fileRegionMap)) {
        if (normalizeFileName(key) === normalizedFile) {
          region = value
          break
        }
      }
    }
    
    if (!region) {
      console.log(`\n⏭️  Ignoré: ${file} (région non mappée)`)
      continue
    }
    
    const wordPath = path.join(METADATA_DIR, file)
    const stats = await processWordFile(wordPath, region)
    
    totalUpdated += stats.updated
    totalNotFound += stats.notFound
    totalProcessed += stats.total
  }
  
  console.log(`\n📊 RÉSUMÉ:`)
  console.log(`   ✅ Mises à jour: ${totalUpdated}`)
  console.log(`   ⚠️  Non trouvées: ${totalNotFound}`)
  console.log(`   📝 Total traité: ${totalProcessed}`)
  console.log(`\n✅ Mise à jour terminée!`)
}

main().catch(console.error)

