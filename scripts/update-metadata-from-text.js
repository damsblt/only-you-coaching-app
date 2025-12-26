/**
 * Script pour mettre à jour les métadonnées des vidéos depuis un texte Word
 * Usage: node scripts/update-metadata-from-text.js "texte-word.txt" --region=abdos
 * Ou: node scripts/update-metadata-from-text.js --text="..." --region=abdos
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

/**
 * Extract video number from S3 key or title (supports decimals like 45.1 and double dots like 42..)
 */
function extractVideoNumber(videoUrl, title) {
  try {
    // Decode URL first to handle encoded characters
    const urlObj = new URL(videoUrl)
    const decodedPath = decodeURIComponent(urlObj.pathname)
    
    // Try to extract from decoded path
    // Format: "Video/.../45.1 exercice.mp4" or "Video/.../45. exercice.mp4" or "Video/.../42.. exercice.mp4" or "Video/.../6. exercice.mp4"
    // We need to match the full number including decimals, handle double dots, but stop before the next word
    const urlMatch = decodedPath.match(/(?:^|\/)(\d+(?:\.\d+)?)\.+?\s/i)
    if (urlMatch) {
      return urlMatch[1] // Return as string to preserve decimals
    }
  } catch (e) {
    // If URL parsing fails, try direct match
    const urlMatch = videoUrl.match(/(?:^|\/)(\d+(?:\.\d+)?)\.+?\s/i)
    if (urlMatch) {
      return urlMatch[1]
    }
  }
  
  // Try from title (usually doesn't have number, but check anyway)
  const titleMatch = title.match(/^(\d+(?:\.\d+)?)\.+\s/)
  if (titleMatch) {
    return titleMatch[1]
  }
  
  return null
}

/**
 * Parse exercises from text
 */
function parseExercisesFromText(text) {
  const exercises = []
  
  // Helper function to clean markdown formatting and artifacts
  const cleanMarkdown = (text) => {
    if (!text) return text
    return text
      .replace(/\*\*/g, '') // Remove ** markdown
      .replace(/^\*\s*/gm, '') // Remove leading * in lines
      .replace(/^:\s*/gm, '') // Remove leading : and space (multiline)
      .replace(/^s\*\*\s*:\s*/gim, '') // Remove "s** :" artifacts
      .replace(/^\*\s*:\s*/gm, '') // Remove "* :" artifacts
      .replace(/^\s*:\s*/gm, '') // Remove any remaining leading ": "
      .trim()
  }
  
  // Pattern to match "Numéro : X" or "Numéro : X.X" or "Numéro : video X" (with or without **, with or without -)
  // Also handles "**Numéro : X**" format and "Numéro : **X**" and "Numéro : **37**"
  // Also handles "Numéro : video X" and "Numréo : video X" (typo)
  // Also handles "3. Extension... video 9" format
  // Also handles "1. Titre exercice : ... video 14" format (with video on separate line)
  // Pattern1: **Numéro : X** format (markdown bold)
  // Split by **Numéro : X** to get sections, then extract metadata from each
  const sectionsBold = text.split(/\*\*Num[ée]ro\s*:\s*(\d+(?:\.\d+)?)\*\*/gi)
  // Pattern1b: Numéro : X format (without **)
  const pattern1b = /(?:\*{0,2})?Num[ée]ro\s*:\s*(?:video\s+)?(?:\*{0,2})?(\d+(?:\.\d+)?)(?:\*{0,2})?\s*\n([\s\S]*?)(?=(?:\*{0,2})?Num[ée]ro\s*:\s*(?:video\s+)?(?:\*{0,2})?\d|Titre\s+exercice\s*:|^\d+\.|##|$)/gi
  const pattern2 = /^\d+\.\s*([^\n]+?)\s+video\s+(\d+)\s*\n([\s\S]*?)(?=^\d+\.|Titre\s+exercice|Num[ée]ro|$)/gim
  
  // Pattern for "1.\n[Titre]\nvideo X\n..." format (with or without "Titre exercice :")
  // Split by numbered sections first, then parse each section
  // Handle both "1.\n" and "1. [Title]" formats
  const sections = text.split(/^\d+\.\s*(?:\n|(?=[^\n]))/m).filter(s => s.trim())
  sections.forEach((section, index) => {
    const videoMatch = section.match(/video\s+(\d+)\s*\n/i)
    if (videoMatch) {
      const videoNumber = videoMatch[1]
      // Find title - can be "Titre exercice : ..." or just the title on the first line
      let titleMatch = section.match(/Titre\s+exercice\s*:\s*([^\n]+?)\s*\n/i)
      let title = null
      if (titleMatch) {
        title = titleMatch[1].replace(/^Titre\s+exercice\s*:\s*/i, '').trim()
      } else {
        // Title is on the first line before "video X"
        const lines = section.split('\n')
        const videoLineIndex = lines.findIndex(l => /video\s+\d+/i.test(l))
        if (videoLineIndex > 0) {
          title = lines.slice(0, videoLineIndex).join(' ').trim()
        }
      }
      const content = section.substring(section.indexOf('\n', section.indexOf('video')) + 1)
      
      const exercise = {
        videoNumber,
        title: title || null,
        muscleCible: null,
        positionDepart: null,
        mouvement: null,
        intensite: null,
        serie: null,
        contreIndication: null
      }
      
      // Extract metadata from content
      const muscleMatch = content.match(/Muscle\s+cible\s*:?\s*(.+?)(?:\n|$)/i)
      if (muscleMatch) {
        exercise.muscleCible = cleanMarkdown(muscleMatch[1])
      }
      
      const positionMatch = content.match(/Position\s+d[ée]part\s*:?\s*([\s\S]*?)(?=Mouvement|Intensit[ée]|S[ée]rie|Contre|$)/i)
      if (positionMatch) {
        exercise.positionDepart = cleanMarkdown(positionMatch[1])
      }
      
      const mouvementMatch = content.match(/Mouvement\s*:?\s*([\s\S]*?)(?=Intensit[ée]|S[ée]rie|Contre|$)/i)
      if (mouvementMatch) {
        exercise.mouvement = cleanMarkdown(mouvementMatch[1])
      }
      
      // Intensité peut être sur la même ligne que le mouvement, séparée par des espaces
      const intensiteMatch = content.match(/Intensit[ée]\s*[.:]?\s*(.+?)(?:\n|S[ée]rie|Contre|$)/i)
      if (intensiteMatch) {
        exercise.intensite = cleanMarkdown(intensiteMatch[1])
      }
      
      const serieMatch = content.match(/S[ée]ries?\s*\*?\*?\s*:?\s*(.+?)(?:\n|Contre[-\s]?indication|$)/i)
      if (serieMatch) {
        exercise.serie = cleanMarkdown(serieMatch[1])
      }
      
      const contreMatch = content.match(/Contre[-\s]?indication\s*\*?\*?\s*:?\s*(.+?)(?:\n|$)/i)
      if (contreMatch) {
        exercise.contreIndication = cleanMarkdown(contreMatch[1])
      }
      
      exercises.push(exercise)
    }
  })
  
  // Then, try pattern for "**Numéro : X**" format (markdown bold)
  // Process sections: odd indices are numbers, even indices are content
  for (let i = 1; i < sectionsBold.length; i += 2) {
    const videoNumber = sectionsBold[i] // The number
    let content = sectionsBold[i + 1] || '' // Content after Numéro
    content = content.trim()
    
    // Skip if already extracted by another pattern
    if (exercises.find(e => e.videoNumber === videoNumber)) {
      continue
    }
    
    const exercise = {
      videoNumber,
      title: null,
      muscleCible: null,
      positionDepart: null,
      mouvement: null,
      intensite: null,
      serie: null,
      contreIndication: null
    }
    
    // Extract Titre exercice from content
    const titleMatch = content.match(/Titre\s+exercice\s*:?\s*(.+?)(?:\n|Muscle|Position|Mouvement|Intensité|Série|Contre|$)/i)
    if (titleMatch) {
      exercise.title = cleanMarkdown(titleMatch[1])
    }
    
    // Extract other metadata from content
    const muscleMatch = content.match(/Muscle\s+cible\s*:?\s*(.+?)(?:\n|$)/i)
    if (muscleMatch) {
      exercise.muscleCible = cleanMarkdown(muscleMatch[1])
    }
    
    const positionMatch = content.match(/Position\s+d[ée]part\s*:?\s*([\s\S]*?)(?=Mouvement|Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (positionMatch) {
      exercise.positionDepart = cleanMarkdown(positionMatch[1])
    }
    
    const mouvementMatch = content.match(/Mouvement\s*:?\s*([\s\S]*?)(?=Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (mouvementMatch) {
      exercise.mouvement = cleanMarkdown(mouvementMatch[1])
    }
    
    // Intensité peut être sur la même ligne que le mouvement, séparée par des espaces
    const intensiteMatch = content.match(/Intensit[ée]\s*[.:]?\s*(.+?)(?:\n|S[ée]rie|Contre|$)/i)
    if (intensiteMatch) {
      exercise.intensite = cleanMarkdown(intensiteMatch[1])
    }
    
    const serieMatch = content.match(/S[ée]ries?\s*\*?\*?\s*:?\s*(.+?)(?:\n|Contre[-\s]?indication|$)/i)
    if (serieMatch) {
      exercise.serie = cleanMarkdown(serieMatch[1])
    }
    
    const contreMatch = content.match(/Contre[-\s]?indication\s*\*?\*?\s*:?\s*(.+?)(?:\n|$)/i)
    if (contreMatch) {
      exercise.contreIndication = cleanMarkdown(contreMatch[1])
    }
    
    exercises.push(exercise)
  }
  
  // Then, try pattern for "Numéro : X" format (without **)
  while ((match = pattern1b.exec(text)) !== null) {
    const videoNumber = match[1] // The number
    let content = match[2].trim() // Content after Numéro
    
    // Skip if already extracted by pattern1a
    if (exercises.find(e => e.videoNumber === videoNumber)) {
      continue
    }
    
    const exercise = {
      videoNumber,
      title: null,
      muscleCible: null,
      positionDepart: null,
      mouvement: null,
      intensite: null,
      serie: null,
      contreIndication: null
    }
    
    // Extract Titre exercice from content
    const titleMatch = content.match(/Titre\s+exercice\s*:?\s*(.+?)(?:\n|Muscle|Position|Mouvement|Intensité|Série|Contre|$)/i)
    if (titleMatch) {
      exercise.title = cleanMarkdown(titleMatch[1])
    }
    
    // Extract other metadata from content
    const muscleMatch = content.match(/Muscle\s+cible\s*:?\s*(.+?)(?:\n|$)/i)
    if (muscleMatch) {
      exercise.muscleCible = cleanMarkdown(muscleMatch[1])
    }
    
    const positionMatch = content.match(/Position\s+d[ée]part\s*:?\s*([\s\S]*?)(?=Mouvement|Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (positionMatch) {
      exercise.positionDepart = cleanMarkdown(positionMatch[1])
    }
    
    const mouvementMatch = content.match(/Mouvement\s*:?\s*([\s\S]*?)(?=Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (mouvementMatch) {
      exercise.mouvement = cleanMarkdown(mouvementMatch[1])
    }
    
    // Intensité peut être sur la même ligne que le mouvement, séparée par des espaces
    const intensiteMatch = content.match(/Intensit[ée]\s*[.:]?\s*(.+?)(?:\n|S[ée]rie|Contre|$)/i)
    if (intensiteMatch) {
      exercise.intensite = cleanMarkdown(intensiteMatch[1])
    }
    
    const serieMatch = content.match(/S[ée]ries?\s*\*?\*?\s*:?\s*(.+?)(?:\n|Contre[-\s]?indication|$)/i)
    if (serieMatch) {
      exercise.serie = cleanMarkdown(serieMatch[1])
    }
    
    const contreMatch = content.match(/Contre[-\s]?indication\s*\*?\*?\s*:?\s*(.+?)(?:\n|$)/i)
    if (contreMatch) {
      exercise.contreIndication = cleanMarkdown(contreMatch[1])
    }
    
    exercises.push(exercise)
  }
  
  // Then, try pattern for "video X" format (e.g., "3. Extension... video 9")
  while ((match = pattern2.exec(text)) !== null) {
    const videoNumber = match[2] // The number after "video"
    const titleFromList = match[1].trim() // The title from the numbered list
    let content = match[3].trim()
    
    const matchStart = match.index
    const beforeStart = Math.max(0, matchStart - 200)
    const beforeText = text.substring(beforeStart, matchStart)
    
    const exercise = {
      videoNumber,
      title: titleFromList, // Use the title from the numbered list
      muscleCible: null,
      positionDepart: null,
      mouvement: null,
      intensite: null,
      serie: null,
      contreIndication: null
    }
    
    // Extract other metadata from content
    // (muscle, position, mouvement, etc.)
    const muscleMatch = content.match(/Muscle\s+cible\s*:?\s*(.+?)(?:\n|$)/i)
    if (muscleMatch) {
      exercise.muscleCible = cleanMarkdown(muscleMatch[1])
    }
    
    const positionMatch = content.match(/Position\s+d[ée]part\s*:?\s*([\s\S]*?)(?=Mouvement|Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (positionMatch) {
      exercise.positionDepart = cleanMarkdown(positionMatch[1])
    }
    
    const mouvementMatch = content.match(/Mouvement\s*:?\s*([\s\S]*?)(?=Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (mouvementMatch) {
      exercise.mouvement = cleanMarkdown(mouvementMatch[1])
    }
    
    const intensiteMatch = content.match(/Intensit[ée]\s*[.:]?\s*(.+?)(?:\n|$)/i)
    if (intensiteMatch) {
      exercise.intensite = cleanMarkdown(intensiteMatch[1])
    }
    
    const serieMatch = content.match(/S[ée]ries?\s*\*?\*?\s*:?\s*(.+?)(?:\n|$)/i)
    if (serieMatch) {
      exercise.serie = cleanMarkdown(serieMatch[1])
    }
    
    const contreMatch = content.match(/Contre[-\s]?indication\s*\*?\*?\s*:?\s*(.+?)(?:\n|$)/i)
    if (contreMatch) {
      exercise.contreIndication = cleanMarkdown(contreMatch[1])
    }
    
    exercises.push(exercise)
  }
  
  // Then, try pattern for "Numéro : video X" format (old pattern, kept for backward compatibility)
  // Note: pattern1a and pattern1b are used above, this is for other formats
  const pattern1 = /(?:\*{0,2})?Num[ée]ro\s*:\s*(?:video\s+)?(?:\*{0,2})?(\d+(?:\.\d+)?)(?:\*{0,2})?\s*\n([\s\S]*?)(?=(?:\*{0,2})?Num[ée]ro\s*:\s*(?:video\s+)?(?:\*{0,2})?\d|Titre\s+exercice\s*:|^\d+\.|##|$)/gi
  while ((match = pattern1.exec(text)) !== null) {
    const videoNumber = match[1] // Keep as string to preserve decimals
    let content = match[2].trim()
    
    // Remove leading dashes or bullets if present
    content = content.replace(/^[-•]\s*/gm, '')
    
    // Find the start position of this match in the text
    const matchStart = match.index
    const matchEnd = matchStart + match[0].length
    
    // Look for "Titre exercice" before the Numéro line (within 200 chars before)
    const beforeStart = Math.max(0, matchStart - 200)
    const beforeText = text.substring(beforeStart, matchStart)
    
    const exercise = {
      videoNumber,
      title: null,
      muscleCible: null,
      positionDepart: null,
      mouvement: null,
      intensite: null,
      serie: null,
      contreIndication: null
    }
    
    // Extract Titre exercice (can be before or after Numéro)
    // First try to find it before the Numéro line
    let titleMatch = beforeText.match(/Titre\s+exercice\s*:?\s*(.+?)(?:\n|Num[ée]ro|$)/i)
    if (!titleMatch) {
      // If not found, try in the content block after Numéro
      titleMatch = content.match(/Titre\s+exercice\s*:?\s*(.+?)(?:\n|Num[ée]ro|Muscle|Position|Mouvement|Intensité|Série|Contre|$)/i)
    }
    // Also check for numbered list format: "3. Extension... video 9"
    if (!titleMatch) {
      const numberedMatch = beforeText.match(/^\d+\.\s*(.+?)(?:\s+video\s+\d+|$)/m)
      if (numberedMatch) {
        titleMatch = { 1: numberedMatch[1].trim() }
      }
    }
    if (titleMatch) {
      exercise.title = cleanMarkdown(titleMatch[1])
    }
    
    // Extract Muscle cible (handle "Muscle cible:" or "Muscle cible :")
    const muscleMatch = content.match(/Muscle\s+cible\s*:?\s*(.+?)(?:\n|$)/i)
    if (muscleMatch) {
      exercise.muscleCible = cleanMarkdown(muscleMatch[1])
    }
    
    // Extract Position départ (multiline, handle "Position départ:" or "Position départ :")
    const positionMatch = content.match(/Position\s+d[ée]part\s*:?\s*([\s\S]*?)(?=Mouvement|Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (positionMatch) {
      exercise.positionDepart = cleanMarkdown(positionMatch[1])
    }
    
    // Extract Mouvement (multiline, handle "Mouvement:" or "Mouvement :")
    const mouvementMatch = content.match(/Mouvement\s*:?\s*([\s\S]*?)(?=Intensit[ée]|S[ée]rie|Contre|$)/i)
    if (mouvementMatch) {
      exercise.mouvement = cleanMarkdown(mouvementMatch[1])
    }
    
    // Extract Intensité (handle "Intensité:" or "Intensité." or "Intensité :")
    const intensiteMatch = content.match(/Intensit[ée]\s*[.:]?\s*(.+?)(?:\n|$)/i)
    if (intensiteMatch) {
      exercise.intensite = cleanMarkdown(intensiteMatch[1])
    }
    
    // Extract Série (handle "Série:" or "Série :" or "Séries:")
    const serieMatch = content.match(/S[ée]ries?\s*:?\s*(.+?)(?:\n|$)/i)
    if (serieMatch) {
      exercise.serie = cleanMarkdown(serieMatch[1])
    }
    
    // Extract Contre-indication (handle "Contre-indication:" or "Contre -indication :")
    const contreMatch = content.match(/Contre[-\s]?indication\s*:?\s*(.+?)(?:\n|$)/i)
    if (contreMatch) {
      exercise.contreIndication = cleanMarkdown(contreMatch[1])
    }
    
    exercises.push(exercise)
  }
  
  return exercises
}

/**
 * Update videos with metadata
 */
async function updateVideosWithMetadata(exercises, region) {
  console.log(`\n📝 Mise à jour des métadonnées dans Neon...\n`)
  
  let updatedCount = 0
  let notFoundCount = 0
  
  for (const exercise of exercises) {
    const { videoNumber, title, muscleCible, positionDepart, mouvement, intensite, serie, contreIndication } = exercise
    
    console.log(`\n🔍 Recherche vidéo numéro ${videoNumber}...`)
    
    // Find all videos for this region
    const videos = await sql`
      SELECT id, title, "videoUrl"
      FROM videos_new
      WHERE region = ${region}
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
    `
    
    const rows = videos.rows || videos
    
    // Find video by number (supports decimals)
    let video = null
    for (const v of rows) {
      const num = extractVideoNumber(v.videoUrl, v.title)
      // Compare as strings to handle decimals
      if (num && num.toString() === videoNumber.toString()) {
        video = v
        break
      }
    }
    
    if (!video) {
      console.log(`   ⚠️  Vidéo ${videoNumber} non trouvée pour la région ${region}`)
      notFoundCount++
      continue
    }
    
    console.log(`   ✅ Trouvée: ${video.title}`)
    
    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString()
    }
    
    // Helper function to remove trailing dots
    const removeTrailingDot = (text) => {
      if (!text) return text
      return text.trim().replace(/\.$/, '')
    }
    
    // Map Titre exercice → exo_title
    if (title) {
      updateData.exo_title = title
      console.log(`      📝 Titre: ${title}`)
    }
    
    // Map Muscle cible → targeted_muscles (convert string to array)
    if (muscleCible) {
      // Split by comma and clean up, remove trailing dots
      const muscles = muscleCible
        .split(',')
        .map(m => removeTrailingDot(m.trim()))
        .filter(m => m.length > 0)
      updateData.targeted_muscles = muscles
      console.log(`      💪 Muscles: ${muscles.join(', ')}`)
    }
    
    if (positionDepart) {
      updateData.startingPosition = positionDepart
      console.log(`      🎯 Position départ: ${positionDepart.substring(0, 50)}...`)
    }
    if (mouvement) {
      updateData.movement = mouvement
      console.log(`      🏃 Mouvement: ${mouvement.substring(0, 50)}...`)
    }
    if (intensite) {
      // Remove trailing dot
      updateData.intensity = removeTrailingDot(intensite)
      console.log(`      ⚡ Intensité: ${updateData.intensity}`)
    }
    if (serie) {
      // Remove trailing dot
      updateData.series = removeTrailingDot(serie)
      console.log(`      🔢 Série: ${updateData.series}`)
    }
    if (contreIndication) {
      // Remove trailing dot
      updateData.constraints = removeTrailingDot(contreIndication)
      console.log(`      ⚠️  Contre-indication: ${updateData.constraints}`)
    }
    
    // Update video
    const setClause = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const values = Object.values(updateData)
    values.push(video.id)
    
    await sql.query(
      `UPDATE videos_new SET ${setClause} WHERE id = $${values.length}`,
      values
    )
    
    console.log(`   ✅ Mis à jour`)
    updatedCount++
  }
  
  console.log(`\n📊 RÉSUMÉ:`)
  console.log(`   ✅ Mises à jour: ${updatedCount}`)
  console.log(`   ⚠️  Non trouvées: ${notFoundCount}`)
  console.log(`\n✅ Mise à jour terminée!\n`)
}

async function main() {
  const args = process.argv.slice(2)
  let text = ''
  let region = 'abdos'
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--text' && args[i + 1]) {
      text = args[i + 1]
      i++
    } else if (args[i].startsWith('--region=')) {
      region = args[i].split('=')[1]
    } else if (args[i].startsWith('--text=')) {
      text = args[i].split('=')[1]
    } else if (!args[i].startsWith('--') && !text) {
      // Assume it's a file path
      const filePath = path.isAbsolute(args[i]) ? args[i] : path.join(process.cwd(), args[i])
      if (fs.existsSync(filePath)) {
        text = fs.readFileSync(filePath, 'utf-8')
      }
    }
  }
  
  if (!text) {
    console.error('❌ Aucun texte fourni')
    console.error('Usage: node scripts/update-metadata-from-text.js --text="..." --region=abdos')
    console.error('   Ou: node scripts/update-metadata-from-text.js fichier.txt --region=abdos')
    process.exit(1)
  }
  
  console.log('📄 Parsing du texte...\n')
  console.log(`📍 Région: ${region}\n`)
  
  // Parse exercises from text
  const exercises = parseExercisesFromText(text)
  
  console.log(`✅ ${exercises.length} exercice(s) extrait(s)\n`)
  
  if (exercises.length === 0) {
    console.error('❌ Aucun exercice trouvé dans le texte')
    process.exit(1)
  }
  
  // Update videos with metadata
  await updateVideosWithMetadata(exercises, region)
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})

