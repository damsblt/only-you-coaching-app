/**
 * Script pour parser un fichier Word et extraire les métadonnées des exercices
 * 
 * Usage: node scripts/parse-word-metadata.js <chemin-word> [--region=<region>]
 * 
 * Exemple: node scripts/parse-word-metadata.js "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx" --region=abdos
 */

const fs = require('fs')
const path = require('path')

// Try to use mammoth if available, otherwise fallback to manual parsing
let mammoth = null
try {
  mammoth = require('mammoth')
} catch (error) {
  console.warn('⚠️  mammoth non installé, utilisation du parsing manuel')
}

/**
 * Parse Word document and extract exercise metadata
 */
async function parseWordDocument(wordPath, region) {
  console.log(`📄 Parsing du fichier Word: ${wordPath}\n`)
  
  if (!fs.existsSync(wordPath)) {
    console.error(`❌ Fichier non trouvé: ${wordPath}`)
    process.exit(1)
  }
  
  let text = ''
  
  if (mammoth) {
    // Use mammoth to extract text from Word
    try {
      const result = await mammoth.extractRawText({ path: wordPath })
      text = result.value
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du Word avec mammoth:', error.message)
      console.log('💡 Tentative de parsing manuel...\n')
      // Fallback to manual parsing
      text = await parseWordManually(wordPath)
    }
  } else {
    // Manual parsing (basic text extraction)
    text = await parseWordManually(wordPath)
  }
  
  console.log(`✅ Texte extrait (${text.length} caractères)\n`)
  
  // Parse the text to extract exercise metadata
  const exercises = parseExercisesFromText(text, region)
  
  console.log(`📊 ${exercises.length} exercice(s) extrait(s)\n`)
  
  return exercises
}

/**
 * Manual parsing of Word document (basic approach)
 * This is a fallback if mammoth is not available
 */
async function parseWordManually(wordPath) {
  // For .docx files, we can try to extract text from the XML
  // This is a simplified approach
  try {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(wordPath)
    const xmlContent = zip.readAsText('word/document.xml')
    
    // Extract text from XML (remove tags)
    const text = xmlContent
      .replace(/<[^>]+>/g, ' ') // Remove XML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    return text
  } catch (error) {
    console.error('❌ Erreur lors du parsing manuel:', error.message)
    throw error
  }
}

/**
 * Parse exercises from extracted text
 * Format: "45.1 Planche à genoux sol" followed by metadata sections
 */
function parseExercisesFromText(text, region) {
  const exercises = []
  
  // Split by double newlines to get exercise sections
  const sections = text.split(/\n\s*\n+/).filter(s => s.trim().length > 0)
  
  for (const section of sections) {
    const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length === 0) continue
    
    // Skip header sections
    const firstLine = lines[0].toLowerCase()
    if (firstLine.includes('descriptif') || firstLine.includes('faire') || firstLine.includes('circuit')) {
      continue
    }
    
    // Look for numbered pattern: "45.1 Planche..." or "24.1 Gainage..."
    const numberMatch = lines[0].match(/^(\d+)(?:\.\d+)?\s+(.+)/)
    
    if (numberMatch) {
      const number = parseInt(numberMatch[1], 10)
      const title = numberMatch[2].trim()
      
      // Extract metadata from the entire section
      const metadata = extractMetadataFromContent(section, number, region)
      if (metadata) {
        metadata.title = title
        exercises.push(metadata)
      }
    } else {
      // Try to find if this section has metadata (might be continuation or standalone)
      const hasMetadata = section.match(/Muscle\s+cible|Position\s+d[ée]part|Mouvement|Intensit[ée]|S[ée]rie|Contre/i)
      if (hasMetadata && lines[0]) {
        // Try to extract number from context or use title as identifier
        const metadata = extractMetadataFromContent(section, null, region)
        if (metadata) {
          metadata.title = lines[0]
          // Try to find number in title
          const titleNumberMatch = metadata.title.match(/(\d+)/)
          if (titleNumberMatch) {
            metadata.videoNumber = parseInt(titleNumberMatch[1], 10)
            exercises.push(metadata)
          }
        }
      }
    }
  }
  
  return exercises
}

/**
 * Extract metadata from exercise content
 */
function extractMetadataFromContent(content, videoNumber, region) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  if (lines.length === 0) return null
  
  const metadata = {
    videoNumber,
    region: region || 'abdos',
    muscleCible: null,
    positionDepart: null,
    mouvement: null,
    intensite: null,
    serie: null,
    contreIndication: null,
    title: null
  }
  
  // Join all lines for multiline matching
  const fullContent = content
  
  // Extract Muscle cible (single line, ends with period)
  const muscleMatch = fullContent.match(/Muscle\s+cible\s*:\s*([^\n]+?)(?:\.|$)/i)
  if (muscleMatch) {
    metadata.muscleCible = muscleMatch[1].trim()
  }
  
  // Extract Position départ (multiline, until "Mouvement")
  const positionMatch = fullContent.match(/Position\s+d[ée]part\s*:\s*((?:[^\n]+\n?)+?)(?=\n\s*Mouvement|$)/is)
  if (positionMatch) {
    metadata.positionDepart = positionMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.match(/^Position|^Mouvement/i))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  // Extract Mouvement (multiline, until "Intensité")
  const mouvementMatch = fullContent.match(/Mouvement\s*:\s*((?:[^\n]+\n?)+?)(?=\n\s*Intensit[ée]|$)/is)
  if (mouvementMatch) {
    metadata.mouvement = mouvementMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.match(/^Mouvement|^Intensit[ée]/i))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  // Extract Intensité (single line, format "Intensité. Débutant.")
  const intensiteMatch = fullContent.match(/Intensit[ée]\s*\.?\s*([^\n]+?)(?:\.|$)/i)
  if (intensiteMatch) {
    metadata.intensite = intensiteMatch[1].trim()
  }
  
  // Extract Série (single line, format "Série : 1x 30 à 60 secondes.")
  const serieMatch = fullContent.match(/S[ée]rie\s*:\s*([^\n]+?)(?:\.|$)/i)
  if (serieMatch) {
    metadata.serie = serieMatch[1].trim()
  }
  
  // Extract Contre-indication (single line)
  const contreMatch = fullContent.match(/Contre[-\s]?indication\s*:\s*([^\n]+?)(?:\.|$)/i)
  if (contreMatch) {
    const value = contreMatch[1].trim()
    if (value.toLowerCase() !== 'aucune') {
      metadata.contreIndication = value
    }
  }
  
  // Title is usually the first line without metadata keywords
  const titleLine = lines.find(l => {
    const lower = l.toLowerCase()
    return !lower.includes('muscle') && 
           !lower.includes('position') && 
           !lower.includes('mouvement') &&
           !lower.includes('intensité') &&
           !lower.includes('série') &&
           !lower.includes('contre') &&
           !lower.includes('descriptif') &&
           !lower.includes('programme') &&
           !lower.includes('circuit')
  })
  
  metadata.title = titleLine || lines[0] || (videoNumber ? `Exercice ${videoNumber}` : 'Exercice')
  
  // Remove number prefix from title if present
  if (metadata.title) {
    metadata.title = metadata.title.replace(/^\d+(?:\.\d+)?\s+/, '').trim()
  }
  
  return metadata
}

/**
 * Main function
 */
async function main() {
  const wordPath = process.argv[2]
  const regionArg = process.argv.find(arg => arg.startsWith('--region='))
  const region = regionArg ? regionArg.split('=')[1] : null
  
  if (!wordPath) {
    console.error('❌ Usage: node scripts/parse-word-metadata.js <chemin-word> [--region=<region>]')
    console.error('   Exemple: node scripts/parse-word-metadata.js "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx" --region=abdos')
    process.exit(1)
  }
  
  try {
    const exercises = await parseWordDocument(wordPath, region)
    
    // Output as JSON
    console.log('📋 Métadonnées extraites:\n')
    console.log(JSON.stringify(exercises, null, 2))
    
    // Save to file
    const outputPath = path.join(__dirname, '..', 'data', `metadata-${region || 'programme'}.json`)
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(exercises, null, 2))
    console.log(`\n✅ Métadonnées sauvegardées dans: ${outputPath}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()

