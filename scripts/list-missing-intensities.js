/**
 * Script pour lister les exercices avec intensité manquante
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const METADATA_FILE = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-structurees.md')

/**
 * Parser le fichier de métadonnées structurées
 */
function parseStructuredMetadata(content) {
  const exercises = []
  const lines = content.split('\n')
  
  let currentExercise = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Nouveau titre d'exercice (### 1. Titre)
    const titleMatch = line.match(/^### \d+\. (.+)$/)
    if (titleMatch) {
      if (currentExercise) {
        exercises.push(currentExercise)
      }
      currentExercise = {
        title: titleMatch[1].trim(),
        region: '',
        muscleCible: '',
        positionDepart: '',
        mouvement: '',
        intensite: '',
        serie: '',
        contreIndication: '',
        theme: ''
      }
      continue
    }
    
    if (!currentExercise) continue
    
    // Extraire les champs
    const regionMatch = line.match(/^- \*\*Région :\*\* (.+)$/)
    if (regionMatch) {
      currentExercise.region = regionMatch[1].trim()
      continue
    }
    
    const muscleMatch = line.match(/^- \*\*Muscle cible :\*\* (.+)$/)
    if (muscleMatch) {
      currentExercise.muscleCible = muscleMatch[1].trim()
      continue
    }
    
    const intensiteMatch = line.match(/^- \*\*Intensité :\*\* (.+)$/)
    if (intensiteMatch) {
      currentExercise.intensite = intensiteMatch[1].trim()
      continue
    }
  }
  
  if (currentExercise) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

function main() {
  console.log('\n🔍 Liste des exercices avec intensité manquante\n')
  
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(`❌ Fichier non trouvé : ${METADATA_FILE}`)
    process.exit(1)
  }
  
  const content = fs.readFileSync(METADATA_FILE, 'utf8')
  const exercises = parseStructuredMetadata(content)
  
  console.log(`📋 Total d'exercices dans le fichier : ${exercises.length}\n`)
  
  // Filtrer ceux sans intensité
  const missingIntensity = exercises.filter(ex => !ex.intensite || ex.intensite.trim() === '')
  
  console.log(`⚠️  Exercices avec intensité manquante : ${missingIntensity.length}\n`)
  console.log(`${'='.repeat(80)}\n`)
  
  // Grouper par région
  const byRegion = {}
  missingIntensity.forEach(ex => {
    if (!byRegion[ex.region]) {
      byRegion[ex.region] = []
    }
    byRegion[ex.region].push(ex)
  })
  
  // Afficher par région
  Object.keys(byRegion).sort().forEach(region => {
    const exercises = byRegion[region]
    console.log(`## ${region.toUpperCase()} (${exercises.length} exercices)\n`)
    
    exercises.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.title}`)
      if (ex.muscleCible) {
        console.log(`   Muscle cible : ${ex.muscleCible}`)
      }
      console.log()
    })
    
    console.log(`${'-'.repeat(80)}\n`)
  })
  
  // Résumé par région
  console.log(`${'='.repeat(80)}`)
  console.log('📊 RÉSUMÉ PAR RÉGION')
  console.log(`${'='.repeat(80)}`)
  
  Object.keys(byRegion).sort().forEach(region => {
    console.log(`${region.padEnd(20)} : ${byRegion[region].length} exercices`)
  })
  
  console.log(`${'='.repeat(80)}\n`)
  
  // Créer un fichier de sortie
  const outputFile = path.join(__dirname, '../EXERCICES_INTENSITE_MANQUANTE.md')
  
  let output = `# Exercices avec Intensité Manquante\n\n`
  output += `**Date :** ${new Date().toLocaleDateString('fr-FR')}\n`
  output += `**Total :** ${missingIntensity.length} exercices\n\n`
  output += `---\n\n`
  
  Object.keys(byRegion).sort().forEach(region => {
    const exercises = byRegion[region]
    output += `## ${region.toUpperCase()} (${exercises.length} exercices)\n\n`
    
    exercises.forEach((ex, i) => {
      output += `### ${i + 1}. ${ex.title}\n\n`
      output += `- **Région :** ${ex.region}\n`
      if (ex.muscleCible) {
        output += `- **Muscle cible :** ${ex.muscleCible}\n`
      }
      output += `- **Intensité :** ⚠️ À COMPLÉTER\n`
      output += `\n`
    })
    
    output += `---\n\n`
  })
  
  output += `## 📋 Résumé par Région\n\n`
  output += `| Région | Nombre d'exercices |\n`
  output += `|--------|--------------------|\n`
  
  Object.keys(byRegion).sort().forEach(region => {
    output += `| ${region} | ${byRegion[region].length} |\n`
  })
  
  output += `\n**Total :** ${missingIntensity.length} exercices à compléter\n`
  
  fs.writeFileSync(outputFile, output, 'utf8')
  
  console.log(`✅ Liste sauvegardée dans : ${outputFile}\n`)
}

main()
