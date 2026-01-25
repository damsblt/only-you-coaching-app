/**
 * Script pour extraire proprement les métadonnées depuis les fichiers Word .docx
 * et créer un fichier .md structuré
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

const METADATA_DIR = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées')
const OUTPUT_FILE = path.join(METADATA_DIR, 'metadonnees-structurees.md')

// Mapping des fichiers Word vers les régions
const WORD_FILES = [
  { file: 'abdominaux complet.docx', region: 'abdos' },
  { file: 'bande.docx', region: 'bande' },
  { file: 'biceps.docx', region: 'biceps' },
  { file: 'cardio.docx', region: 'cardio' },
  { file: 'dos.docx', region: 'dos' },
  { file: 'epaule.docx', region: 'epaule' },
  { file: 'fessier jambe.docx', region: 'fessiers-jambes' },
  { file: 'genou.docx', region: 'genou' },
  { file: 'machine.docx', region: 'machine' },
  { file: 'pectoraux.docx', region: 'pectoraux' },
  { file: 'triceps.docx', region: 'triceps' }
]

/**
 * Extraire le texte d'un fichier Word .docx
 */
async function extractTextFromDocx(docxPath) {
  try {
    // Utiliser textutil (disponible sur macOS) pour extraire le texte
    const { stdout } = await execPromise(`textutil -convert txt -stdout "${docxPath}"`)
    return stdout
  } catch (error) {
    console.error(`Erreur lors de l'extraction de ${docxPath}:`, error.message)
    return null
  }
}

/**
 * Parser les exercices depuis le texte extrait
 */
function parseExercises(text, region) {
  const exercises = []
  
  // Split par des marqueurs de sections (vidéo X, exercice X, etc.)
  const lines = text.split('\n')
  
  let currentExercise = null
  let currentField = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Ignorer les lignes vides
    if (!line) continue
    
    // Détection du titre de l'exercice
    // Un titre est généralement suivi de "Muscle cible :" dans les prochaines lignes
    const nextLines = lines.slice(i + 1, i + 5).map(l => l.trim()).join(' ')
    const isTitleLine = nextLines.toLowerCase().includes('muscle cible')
    
    if (isTitleLine && !line.toLowerCase().match(/^(muscle|position|mouvement|intensité|série|contre|thème)/i)) {
      // Sauvegarder l'exercice précédent
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      // Nouveau exercice
      currentExercise = {
        title: line.replace(/^\d+\.?\s*/, '').trim(),
        region: region,
        muscleCible: '',
        positionDepart: '',
        mouvement: '',
        intensite: '',
        serie: '',
        contreIndication: '',
        theme: ''
      }
      currentField = null
      continue
    }
    
    if (!currentExercise) continue
    
    // Détection des champs
    if (line.match(/^Muscle cible\s*[:\-]?\s*/i)) {
      currentField = 'muscleCible'
      const value = line.replace(/^Muscle cible\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.muscleCible = value
      continue
    }
    
    if (line.match(/^Position départ\s*[:\-]?\s*/i)) {
      currentField = 'positionDepart'
      const value = line.replace(/^Position départ\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.positionDepart = value
      continue
    }
    
    if (line.match(/^Position de départ\s*[:\-]?\s*/i)) {
      currentField = 'positionDepart'
      const value = line.replace(/^Position de départ\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.positionDepart = value
      continue
    }
    
    if (line.match(/^Mouvement\s*[:\-]?\s*/i)) {
      currentField = 'mouvement'
      const value = line.replace(/^Mouvement\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.mouvement = value
      continue
    }
    
    if (line.match(/^Intensité\s*[:\-]?\s*/i)) {
      currentField = null
      const value = line.replace(/^Intensité\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.intensite = value
      continue
    }
    
    if (line.match(/^Série\s*[:\-]?\s*/i)) {
      currentField = null
      const value = line.replace(/^Série\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.serie = value
      continue
    }
    
    if (line.match(/^Contre[\-\s]?indication/i)) {
      currentField = null
      const value = line.replace(/^Contre[\-\s]?indication\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.contreIndication = value
      continue
    }
    
    if (line.match(/^Thème\s*[:\-]?\s*/i)) {
      currentField = null
      const value = line.replace(/^Thème\s*[:\-]?\s*/i, '').trim()
      if (value) currentExercise.theme = value
      continue
    }
    
    // Si on est dans un champ multi-lignes, continuer à ajouter
    if (currentField && !line.match(/^(Muscle|Position|Mouvement|Intensité|Série|Contre|Thème)/i)) {
      if (currentExercise[currentField]) {
        currentExercise[currentField] += ' ' + line
      } else {
        currentExercise[currentField] = line
      }
    }
  }
  
  // Ajouter le dernier exercice
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Nettoyer les valeurs extraites
 */
function cleanValue(value) {
  if (!value) return ''
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '') // Retirer le point final
    .trim()
}

/**
 * Générer le fichier Markdown structuré
 */
function generateMarkdown(allExercises) {
  let markdown = `# Métadonnées Structurées - Groupes Musculaires\n\n`
  markdown += `**Date de génération :** ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}\n`
  markdown += `**Nombre total d'exercices :** ${allExercises.length}\n\n`
  markdown += `---\n\n`
  
  // Grouper par région
  const byRegion = {}
  allExercises.forEach(ex => {
    if (!byRegion[ex.region]) {
      byRegion[ex.region] = []
    }
    byRegion[ex.region].push(ex)
  })
  
  // Générer le markdown pour chaque région
  Object.keys(byRegion).sort().forEach(region => {
    markdown += `## ${region.toUpperCase()}\n\n`
    markdown += `**Nombre d'exercices :** ${byRegion[region].length}\n\n`
    
    byRegion[region].forEach((ex, i) => {
      markdown += `### ${i + 1}. ${ex.title}\n\n`
      markdown += `- **Région :** ${ex.region}\n`
      markdown += `- **Muscle cible :** ${cleanValue(ex.muscleCible)}\n`
      markdown += `- **Position départ :** ${cleanValue(ex.positionDepart)}\n`
      markdown += `- **Mouvement :** ${cleanValue(ex.mouvement)}\n`
      markdown += `- **Intensité :** ${cleanValue(ex.intensite)}\n`
      markdown += `- **Série :** ${cleanValue(ex.serie)}\n`
      markdown += `- **Contre-indication :** ${cleanValue(ex.contreIndication)}\n`
      if (ex.theme) {
        markdown += `- **Thème :** ${cleanValue(ex.theme)}\n`
      }
      markdown += `\n`
    })
    
    markdown += `---\n\n`
  })
  
  return markdown
}

/**
 * Main
 */
async function main() {
  console.log('\n🚀 Extraction des métadonnées depuis les fichiers Word...\n')
  
  const allExercises = []
  
  for (const { file, region } of WORD_FILES) {
    const filePath = path.join(METADATA_DIR, file)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fichier non trouvé : ${file}`)
      continue
    }
    
    console.log(`📄 Extraction de ${file} (région: ${region})...`)
    
    try {
      const text = await extractTextFromDocx(filePath)
      
      if (!text) {
        console.log(`   ⚠️  Impossible d'extraire le texte`)
        continue
      }
      
      const exercises = parseExercises(text, region)
      console.log(`   ✅ ${exercises.length} exercices extraits`)
      
      allExercises.push(...exercises)
    } catch (error) {
      console.error(`   ❌ Erreur :`, error.message)
    }
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 RÉSUMÉ`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Total exercices extraits : ${allExercises.length}`)
  console.log(`${'='.repeat(60)}\n`)
  
  // Générer le fichier Markdown
  console.log('📝 Génération du fichier Markdown structuré...\n')
  const markdown = generateMarkdown(allExercises)
  
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8')
  console.log(`✅ Fichier créé : ${OUTPUT_FILE}\n`)
  
  // Afficher un échantillon
  console.log('📋 Échantillon des 5 premiers exercices :\n')
  allExercises.slice(0, 5).forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.title}`)
    console.log(`   Région: ${ex.region}`)
    console.log(`   Intensité: ${cleanValue(ex.intensite) || '(non définie)'}`)
    console.log(`   Série: ${cleanValue(ex.serie) || '(non définie)'}`)
    console.log()
  })
  
  console.log('✅ Extraction terminée!\n')
}

main()
