/**
 * Script pour debugger le contenu d'un fichier Word
 * Affiche le texte brut pour comprendre le format
 */

const mammoth = require('mammoth')
const AdmZip = require('adm-zip')
const fs = require('fs')
const path = require('path')

async function debugWordContent(wordPath) {
  console.log(`📄 Analyse du fichier Word: ${wordPath}\n`)
  
  if (!fs.existsSync(wordPath)) {
    console.error(`❌ Fichier non trouvé: ${wordPath}`)
    process.exit(1)
  }
  
  try {
    // Extract text with mammoth
    const result = await mammoth.extractRawText({ path: wordPath })
    const text = result.value
    
    console.log('📋 Texte brut extrait:\n')
    console.log('='.repeat(80))
    console.log(text)
    console.log('='.repeat(80))
    console.log(`\n📊 Longueur: ${text.length} caractères\n`)
    
    // Try to extract structured content
    console.log('📋 Analyse de la structure:\n')
    
    // Look for patterns
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    console.log(`   Lignes totales: ${lines.length}\n`)
    
    console.log('   Premières 20 lignes:')
    lines.slice(0, 20).forEach((line, i) => {
      console.log(`   ${i + 1}. ${line}`)
    })
    
    // Look for metadata patterns
    console.log('\n   Recherche de patterns de métadonnées:')
    const metadataKeywords = [
      'Muscle', 'muscle', 'Position', 'position', 'Mouvement', 'mouvement',
      'Intensité', 'intensité', 'Série', 'série', 'Contre', 'contre'
    ]
    
    metadataKeywords.forEach(keyword => {
      const matches = lines.filter(l => l.includes(keyword))
      if (matches.length > 0) {
        console.log(`   - "${keyword}": ${matches.length} occurrence(s)`)
        matches.slice(0, 3).forEach(m => console.log(`     "${m}"`))
      }
    })
    
    // Look for video numbers
    console.log('\n   Recherche de numéros de vidéos:')
    const numberPattern = /\b(\d+)\b/g
    const numbers = new Set()
    lines.forEach(line => {
      const matches = line.match(numberPattern)
      if (matches) {
        matches.forEach(m => {
          const num = parseInt(m, 10)
          if (num > 0 && num < 100) {
            numbers.add(num)
          }
        })
      }
    })
    
    console.log(`   Numéros trouvés: ${Array.from(numbers).sort((a, b) => a - b).join(', ')}`)
    
    // Save to file for inspection
    const outputPath = path.join(__dirname, '..', 'data', 'word-debug-output.txt')
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    fs.writeFileSync(outputPath, text)
    console.log(`\n✅ Texte sauvegardé dans: ${outputPath}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

const wordPath = process.argv[2]

if (!wordPath) {
  console.error('❌ Usage: node scripts/debug-word-content.js <chemin-word>')
  process.exit(1)
}

debugWordContent(wordPath)











