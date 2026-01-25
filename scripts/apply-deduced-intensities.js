/**
 * Script pour appliquer les intensités déduites au fichier metadonnees-structurees.md
 * ATTENTION : Garantit un format parfait pour le parsing
 */

const fs = require('fs')
const path = require('path')
const { deduceIntensity } = require('./complete-missing-intensities.js')

const METADATA_FILE = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-structurees.md')
const BACKUP_FILE = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-structurees.backup.md')

/**
 * Parser le fichier structuré avec détails de lignes
 */
function parseWithLineNumbers(content) {
  const exercises = []
  const lines = content.split('\n')
  
  let currentExercise = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    const titleMatch = line.match(/^### \d+\. (.+)$/)
    if (titleMatch) {
      if (currentExercise) {
        exercises.push(currentExercise)
      }
      currentExercise = {
        title: titleMatch[1].trim(),
        titleLine: i,
        region: '',
        regionLine: -1,
        muscleCible: '',
        muscleLine: -1,
        positionDepart: '',
        positionLine: -1,
        mouvement: '',
        mouvementLine: -1,
        intensite: '',
        intensiteLine: -1,
        serie: '',
        serieLine: -1,
        contreIndication: '',
        contreLine: -1,
        theme: '',
        themeLine: -1,
        endLine: -1
      }
      continue
    }
    
    if (!currentExercise) continue
    
    // Extraire les champs et leurs numéros de ligne
    const regionMatch = line.match(/^- \*\*Région :\*\* (.+)$/)
    if (regionMatch) {
      currentExercise.region = regionMatch[1].trim()
      currentExercise.regionLine = i
      continue
    }
    
    const muscleMatch = line.match(/^- \*\*Muscle cible :\*\* (.+)$/)
    if (muscleMatch) {
      currentExercise.muscleCible = muscleMatch[1].trim()
      currentExercise.muscleLine = i
      continue
    }
    
    const positionMatch = line.match(/^- \*\*Position départ :\*\* (.+)$/)
    if (positionMatch) {
      currentExercise.positionDepart = positionMatch[1].trim()
      currentExercise.positionLine = i
      continue
    }
    
    const mouvementMatch = line.match(/^- \*\*Mouvement :\*\* (.+)$/)
    if (mouvementMatch) {
      currentExercise.mouvement = mouvementMatch[1].trim()
      currentExercise.mouvementLine = i
      continue
    }
    
    const intensiteMatch = line.match(/^- \*\*Intensité :\*\* (.+)$/)
    if (intensiteMatch) {
      currentExercise.intensite = intensiteMatch[1].trim()
      currentExercise.intensiteLine = i
      continue
    }
    
    const serieMatch = line.match(/^- \*\*Série :\*\* (.+)$/)
    if (serieMatch) {
      currentExercise.serie = serieMatch[1].trim()
      currentExercise.serieLine = i
      continue
    }
    
    const contreMatch = line.match(/^- \*\*Contre-indication :\*\* (.+)?$/)
    if (contreMatch) {
      currentExercise.contreIndication = (contreMatch[1] || '').trim()
      currentExercise.contreLine = i
      continue
    }
    
    const themeMatch = line.match(/^- \*\*Thème :\*\* (.+)$/)
    if (themeMatch) {
      currentExercise.theme = themeMatch[1].trim()
      currentExercise.themeLine = i
      continue
    }
  }
  
  if (currentExercise) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Appliquer les intensités déduites
 */
function applyDeducedIntensities() {
  console.log('\n🔄 Application des intensités déduites...\n')
  
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(`❌ Fichier non trouvé : ${METADATA_FILE}`)
    process.exit(1)
  }
  
  // Backup du fichier original
  const content = fs.readFileSync(METADATA_FILE, 'utf8')
  fs.writeFileSync(BACKUP_FILE, content, 'utf8')
  console.log(`💾 Backup créé : ${BACKUP_FILE}\n`)
  
  const lines = content.split('\n')
  const exercises = parseWithLineNumbers(content)
  
  console.log(`📋 Total exercices : ${exercises.length}\n`)
  
  // Filtrer ceux sans intensité
  const missingIntensity = exercises.filter(ex => !ex.intensite || ex.intensite.trim() === '')
  
  console.log(`⚠️  Sans intensité : ${missingIntensity.length}\n`)
  console.log(`${'='.repeat(80)}\n`)
  
  let modifiedCount = 0
  const modifications = []
  
  // Pour chaque exercice sans intensité
  missingIntensity.forEach(ex => {
    const deducedIntensity = deduceIntensity(ex)
    
    // Trouver où insérer la ligne d'intensité
    // Elle doit venir APRÈS "Mouvement" et AVANT "Série"
    // Ou après "Muscle cible" si pas de position/mouvement
    
    let insertAfterLine = -1
    
    if (ex.mouvementLine > -1) {
      insertAfterLine = ex.mouvementLine
    } else if (ex.positionLine > -1) {
      insertAfterLine = ex.positionLine
    } else if (ex.muscleLine > -1) {
      insertAfterLine = ex.muscleLine
    } else if (ex.regionLine > -1) {
      insertAfterLine = ex.regionLine
    } else {
      console.warn(`⚠️  Impossible de trouver où insérer l'intensité pour : ${ex.title}`)
      return
    }
    
    modifications.push({
      exerciseTitle: ex.title,
      region: ex.region,
      insertAfterLine: insertAfterLine,
      intensity: deducedIntensity
    })
    
    modifiedCount++
  })
  
  // Appliquer les modifications en partant de la fin pour ne pas décaler les numéros de lignes
  modifications.sort((a, b) => b.insertAfterLine - a.insertAfterLine)
  
  console.log('📝 Application des modifications...\n')
  
  modifications.forEach((mod, index) => {
    // Insérer la ligne d'intensité
    const intensityLine = `- **Intensité :** ${mod.intensity}`
    lines.splice(mod.insertAfterLine + 1, 0, intensityLine)
    
    if ((index + 1) % 50 === 0) {
      console.log(`... ${index + 1} / ${modifications.length} modifications appliquées`)
    }
  })
  
  console.log()
  console.log(`${'='.repeat(80)}`)
  console.log('📊 RÉSUMÉ DES MODIFICATIONS')
  console.log(`${'='.repeat(80)}`)
  console.log(`✅ Intensités ajoutées : ${modifiedCount}`)
  console.log(`${'='.repeat(80)}\n`)
  
  // Sauvegarder le fichier modifié
  const newContent = lines.join('\n')
  fs.writeFileSync(METADATA_FILE, newContent, 'utf8')
  
  console.log(`✅ Fichier mis à jour : ${METADATA_FILE}\n`)
  
  // Afficher quelques exemples
  console.log('📋 Exemples de modifications :\n')
  
  modifications.slice(0, 10).forEach((mod, i) => {
    console.log(`${i + 1}. [${mod.region}] ${mod.exerciseTitle}`)
    console.log(`   → Intensité ajoutée : "${mod.intensity}"`)
    console.log()
  })
  
  if (modifications.length > 10) {
    console.log(`... et ${modifications.length - 10} autres modifications\n`)
  }
  
  console.log(`${'='.repeat(80)}\n`)
  console.log('🎯 PROCHAINES ÉTAPES :\n')
  console.log('1. Vérifiez le fichier modifié')
  console.log('2. Si OK, synchronisez avec Neon :')
  console.log('   node scripts/sync-neon-from-structured-metadata.js\n')
  console.log('3. En cas de problème, restaurez le backup :')
  console.log(`   cp "${BACKUP_FILE}" "${METADATA_FILE}"\n`)
  
  return modifications
}

if (require.main === module) {
  applyDeducedIntensities()
}

module.exports = { applyDeducedIntensities }
