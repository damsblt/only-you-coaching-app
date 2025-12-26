/**
 * Parser amélioré pour les fichiers Word de programmes préétablis
 * Format attendu: "45.1 Planche..." suivi de métadonnées
 */

const mammoth = require('mammoth')
const AdmZip = require('adm-zip')
const fs = require('fs')
const path = require('path')

async function parseWordDocument(wordPath, region) {
  console.log(`📄 Parsing du fichier Word: ${wordPath}\n`)
  
  if (!fs.existsSync(wordPath)) {
    console.error(`❌ Fichier non trouvé: ${wordPath}`)
    process.exit(1)
  }
  
  let text = ''
  
  try {
    const result = await mammoth.extractRawText({ path: wordPath })
    text = result.value
  } catch (error) {
    try {
      const zip = new AdmZip(wordPath)
      const xmlContent = zip.readAsText('word/document.xml')
      text = xmlContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    } catch (error2) {
      throw new Error(`Failed to extract text: ${error2.message}`)
    }
  }
  
  console.log(`✅ Texte extrait (${text.length} caractères)\n`)
  
  // Parse exercises
  const exercises = parseExercises(text, region)
  
  console.log(`📊 ${exercises.length} exercice(s) extrait(s)\n`)
  
  return exercises
}

function parseExercises(text, region) {
  const exercises = []
  
  // Split by patterns like "45.1", "24.1" etc. (number.number title)
  // This pattern matches: number, optional decimal, whitespace, then title
  const exercisePattern = /(\d+)(?:\.\d+)?\s+([^\n]+)/g
  let match
  
  const exerciseStarts = []
  while ((match = exercisePattern.exec(text)) !== null) {
    exerciseStarts.push({
      index: match.index,
      number: parseInt(match[1], 10),
      title: match[2].trim(),
      fullMatch: match[0]
    })
  }
  
  // For each exercise start, extract the section until next exercise or end
  for (let i = 0; i < exerciseStarts.length; i++) {
    const start = exerciseStarts[i]
    const endIndex = i < exerciseStarts.length - 1 
      ? exerciseStarts[i + 1].index 
      : text.length
    
    const section = text.substring(start.index, endIndex)
    
    const metadata = extractMetadata(section, start.number, start.title, region)
    if (metadata) {
      exercises.push(metadata)
    }
  }
  
  return exercises
}

function extractMetadata(section, videoNumber, title, region) {
  // Clean title (remove number prefix if present)
  const cleanTitle = title.replace(/^\d+(?:\.\d+)?\s+/, '').trim()
  
  const metadata = {
    videoNumber,
    region: region || 'abdos',
    title: cleanTitle,
    muscleCible: null,
    positionDepart: null,
    mouvement: null,
    intensite: null,
    serie: null,
    contreIndication: null
  }
  
  // Extract Muscle cible (format: "Muscle cible : Transverse, épaule.")
  const muscleMatch = section.match(/Muscle\s+cible\s*:\s*([^\n]+?)(?:\.|$)/i)
  if (muscleMatch) {
    metadata.muscleCible = muscleMatch[1].trim()
  }
  
  // Extract Position départ (multiline, until "Mouvement")
  const positionMatch = section.match(/Position\s+d[ée]part\s*:\s*((?:[^\n]+\n?)+?)(?=\n\s*Mouvement|$)/is)
  if (positionMatch) {
    const positionText = positionMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .filter(l => !l.match(/^(Position|Mouvement)/i))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (positionText) {
      metadata.positionDepart = positionText
    }
  }
  
  // Extract Mouvement (multiline, until "Intensité")
  const mouvementMatch = section.match(/Mouvement\s*:\s*((?:[^\n]+\n?)+?)(?=\n\s*Intensit[ée]|$)/is)
  if (mouvementMatch) {
    const mouvementText = mouvementMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .filter(l => !l.match(/^(Mouvement|Intensit[ée])/i))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (mouvementText) {
      metadata.mouvement = mouvementText
    }
  }
  
  // Extract Intensité (format: "Intensité. Débutant." or "Intensité : Débutant")
  const intensiteMatch = section.match(/Intensit[ée]\s*[\.:]\s*([^\n]+?)(?:\.|$)/i)
  if (intensiteMatch) {
    metadata.intensite = intensiteMatch[1].trim()
  }
  
  // Extract Série (format: "Série : 1x 30 à 60 secondes.")
  const serieMatch = section.match(/S[ée]rie\s*:\s*([^\n]+?)(?:\.|$)/i)
  if (serieMatch) {
    metadata.serie = serieMatch[1].trim()
  }
  
  // Extract Contre-indication (format: "Contre -indication : Aucune.")
  const contreMatch = section.match(/Contre[-\s]?indication\s*:\s*([^\n]+?)(?:\.|$)/i)
  if (contreMatch) {
    const value = contreMatch[1].trim()
    if (value.toLowerCase() !== 'aucune') {
      metadata.contreIndication = value
    }
  }
  
  return metadata
}

async function main() {
  const wordPath = process.argv[2]
  const regionArg = process.argv.find(arg => arg.startsWith('--region='))
  const region = regionArg ? regionArg.split('=')[1] : null
  
  if (!wordPath) {
    console.error('❌ Usage: node scripts/parse-word-metadata-v2.js <chemin-word> [--region=<region>]')
    process.exit(1)
  }
  
  try {
    const exercises = await parseWordDocument(wordPath, region)
    
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












