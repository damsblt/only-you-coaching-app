#!/usr/bin/env node
/**
 * Script pour extraire toutes les métadonnées de TOUS les fichiers Word
 * du dossier 01-métadonnées et les compiler
 */

const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')

const METADATA_DIR = path.join(
  process.cwd(),
  'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'
)

const OUTPUT_FILE = path.join(process.cwd(), 'temp/extracted-metadata.json')

/**
 * Extrait le texte d'un fichier Word
 */
async function extractTextFromWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  } catch (error) {
    console.error(`❌ Erreur lors de l'extraction de ${path.basename(filePath)}:`, error.message)
    return null
  }
}

/**
 * Parse le texte pour extraire les exercices avec intensité
 */
function parseExercises(text, sourceFile) {
  const exercises = []
  const intensityPattern = /Intensit[ée]\s*[\.:]\s*([^\n]+?)(?:\.|$)/gi
  
  let match
  while ((match = intensityPattern.exec(text)) !== null) {
    const intensity = match[1].trim()
    const matchIndex = match.index
    
    // Remonter pour trouver le titre (environ 500 caractères avant)
    const contextBefore = text.substring(Math.max(0, matchIndex - 800), matchIndex)
    const lines = contextBefore.split('\n').map(l => l.trim()).filter(l => l)
    
    // Chercher le titre (dernière ligne non vide avant "Muscle cible")
    let title = null
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]
      
      // Ignorer les lignes de métadonnées
      if (line.match(/^(Muscle cible|Position départ|Mouvement|Série|Contre)/i)) {
        continue
      }
      
      // Ignorer les phrases qui ne sont pas des titres
      if (line.match(/^(Tenir|Monter|Descendre|Tirer|Fléchir|Tendre|Revenir|Allonger)/i)) {
        continue
      }
      
      if (line.length > 5 && line.length < 100) {
        title = line
        break
      }
    }
    
    if (title) {
      exercises.push({
        title,
        intensity,
        sourceFile: path.basename(sourceFile)
      })
    }
  }
  
  return exercises
}

async function extractAllMetadata() {
  console.log('🔄 Extraction des métadonnées de tous les fichiers Word...\n')
  
  // Créer le dossier temp s'il n'existe pas
  const tempDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  
  // Lister tous les fichiers .docx
  const files = fs.readdirSync(METADATA_DIR)
    .filter(f => f.endsWith('.docx') && !f.startsWith('~$')) // Ignorer les fichiers temporaires
  
  console.log(`📁 ${files.length} fichiers Word trouvés:\n`)
  files.forEach(f => console.log(`   - ${f}`))
  console.log()
  
  const allExercises = []
  
  // Extraire les métadonnées de chaque fichier
  for (const file of files) {
    const filePath = path.join(METADATA_DIR, file)
    console.log(`📄 Traitement de ${file}...`)
    
    const text = await extractTextFromWord(filePath)
    if (!text) continue
    
    const exercises = parseExercises(text, file)
    console.log(`   ✅ ${exercises.length} exercices trouvés`)
    
    allExercises.push(...exercises)
  }
  
  console.log(`\n📊 Total: ${allExercises.length} exercices avec intensité trouvés\n`)
  
  // Grouper par niveau
  const byLevel = {
    debutant: [],
    intermediaire: [],
    avance: [],
    toutNiveau: [],
    autre: []
  }
  
  allExercises.forEach(ex => {
    const lower = ex.intensity.toLowerCase()
    if (lower.includes('débutant') || lower.includes('debutant') || lower.includes('beginner')) {
      byLevel.debutant.push(ex)
    } else if (lower.includes('intermédiaire') || lower.includes('intermediaire') || lower.includes('intermediate')) {
      byLevel.intermediaire.push(ex)
    } else if (lower.includes('avancé') || lower.includes('avance') || lower.includes('advanced')) {
      byLevel.avance.push(ex)
    } else if (lower.includes('tout niveau') || lower.includes('tous niveaux')) {
      byLevel.toutNiveau.push(ex)
    } else {
      byLevel.autre.push(ex)
    }
  })
  
  console.log('📈 Répartition par niveau:')
  console.log(`   Débutant: ${byLevel.debutant.length}`)
  console.log(`   Intermédiaire: ${byLevel.intermediaire.length}`)
  console.log(`   Avancé: ${byLevel.avance.length}`)
  console.log(`   Tout niveau: ${byLevel.toutNiveau.length}`)
  console.log(`   Autre: ${byLevel.autre.length}`)
  
  // Sauvegarder
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    totalExercises: allExercises.length,
    exercises: allExercises,
    byLevel
  }, null, 2))
  
  console.log(`\n✅ Métadonnées sauvegardées dans: ${OUTPUT_FILE}`)
}

extractAllMetadata()
  .then(() => {
    console.log('\n✅ Extraction terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
