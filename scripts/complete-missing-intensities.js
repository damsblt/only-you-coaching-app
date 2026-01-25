/**
 * Script pour compléter intelligemment les intensités manquantes
 * Basé sur des règles logiques de difficulté
 */

const fs = require('fs')
const path = require('path')

const METADATA_FILE = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-structurees.md')

/**
 * Règles de déduction d'intensité basées sur :
 * - Équipement utilisé
 * - Type de mouvement
 * - Position/stabilité requise
 */
function deduceIntensity(exercise) {
  const title = exercise.title.toLowerCase()
  const muscle = (exercise.muscleCible || '').toLowerCase()
  
  // Règles pour DÉBUTANT
  if (
    // Exercices au sol basiques
    (title.includes('au sol') && !title.includes('ballon') && !title.includes('bosu')) ||
    // Exercices assis sur ballon (stable)
    (title.includes('assis') && title.includes('ballon')) ||
    // Mouvements simples
    title.includes('genou sur la poitrine') ||
    title.includes('flexion de hanche couché') ||
    // Étirements
    title.includes('position de l\'enfant') ||
    title.includes('étirement') ||
    title.includes('stretching')
  ) {
    return 'Niveau débutant'
  }
  
  // Règles pour AVANCÉ
  if (
    // Équilibre complexe
    title.includes('bosu') ||
    title.includes('disque') ||
    title.includes('trx') ||
    title.includes('roller') ||
    title.includes('roulette') ||
    // Combinaisons complexes
    title.includes('pyramide') ||
    title.includes('jacknif') ||
    title.includes('pike') ||
    // Multiple équipements
    (title.match(/\+/g) || []).length >= 2 ||
    // Instabilité
    title.includes('1 pied') ||
    title.includes('une jambe') ||
    title.includes('1 jambe') ||
    // Mouvements avancés
    title.includes('dips') ||
    title.includes('traction') ||
    title.includes('pullover') ||
    // Mention explicite
    title.includes('(niveau 1)') ||
    title.includes('niveau 2') ||
    title.includes('niveau 3')
  ) {
    return 'Niveau avancé'
  }
  
  // Règles pour INTERMÉDIAIRE ET AVANCÉ
  if (
    // Gainage avec instabilité
    title.includes('gainage') && (title.includes('ballon') || title.includes('relevé')) ||
    // Machine (généralement progressif)
    title.includes('poulie') ||
    title.includes('barre guidée') ||
    // Poids libres complexes
    (title.includes('haltère') && title.includes('ballon')) ||
    // Extensions/variations
    title.includes('alterné') ||
    title.includes('explosif')
  ) {
    return 'Intermédiaire et avancé'
  }
  
  // PAR DÉFAUT : Tout niveau ou Intermédiaire selon le contexte
  if (
    // Mouvements de base avec élastique
    title.includes('élastique') ||
    // Exercices debout simples
    title.includes('debout') ||
    // Exercices guidés
    title.includes('bande') ||
    // Exercices assis
    title.includes('assis')
  ) {
    return 'Tout niveau'
  }
  
  // Défaut sécuritaire
  return 'Niveau intermédiaire'
}

/**
 * Parser le fichier structuré
 */
function parseStructuredMetadata(content) {
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
        region: '',
        muscleCible: '',
        intensite: '',
        lineNumber: i + 1
      }
      continue
    }
    
    if (!currentExercise) continue
    
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
      currentExercise.intensiteLine = i + 1
      continue
    }
  }
  
  if (currentExercise) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Compléter le fichier avec les intensités manquantes
 */
function completeIntensities() {
  console.log('\n🔄 Complétion des intensités manquantes...\n')
  
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(`❌ Fichier non trouvé : ${METADATA_FILE}`)
    process.exit(1)
  }
  
  let content = fs.readFileSync(METADATA_FILE, 'utf8')
  const lines = content.split('\n')
  const exercises = parseStructuredMetadata(content)
  
  console.log(`📋 Total exercices : ${exercises.length}\n`)
  
  // Filtrer ceux sans intensité
  const missingIntensity = exercises.filter(ex => !ex.intensite || ex.intensite.trim() === '')
  
  console.log(`⚠️  Sans intensité : ${missingIntensity.length}\n`)
  console.log(`${'='.repeat(80)}\n`)
  
  // Grouper par région pour statistiques
  const byRegion = {}
  const deductions = []
  
  missingIntensity.forEach(ex => {
    const deducedIntensity = deduceIntensity(ex)
    
    if (!byRegion[ex.region]) {
      byRegion[ex.region] = { total: 0, byIntensity: {} }
    }
    byRegion[ex.region].total++
    
    if (!byRegion[ex.region].byIntensity[deducedIntensity]) {
      byRegion[ex.region].byIntensity[deducedIntensity] = 0
    }
    byRegion[ex.region].byIntensity[deducedIntensity]++
    
    deductions.push({
      exercise: ex,
      deducedIntensity: deducedIntensity
    })
  })
  
  // Afficher les déductions par région
  console.log('📊 INTENSITÉS DÉDUITES PAR RÉGION\n')
  
  Object.keys(byRegion).sort().forEach(region => {
    console.log(`## ${region.toUpperCase()} (${byRegion[region].total} exercices)`)
    Object.entries(byRegion[region].byIntensity).forEach(([intensity, count]) => {
      console.log(`   - ${intensity} : ${count} exercices`)
    })
    console.log()
  })
  
  console.log(`${'='.repeat(80)}\n`)
  
  // Créer un rapport de modifications
  const reportFile = path.join(__dirname, '../RAPPORT_INTENSITES_DEDUITES.md')
  
  let report = `# Rapport des Intensités Déduites\n\n`
  report += `**Date :** ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}\n`
  report += `**Exercices à compléter :** ${missingIntensity.length}\n\n`
  report += `---\n\n`
  
  report += `## 🎯 Méthodologie de Déduction\n\n`
  report += `Les intensités ont été déduites selon ces critères :\n\n`
  report += `### Niveau Débutant\n`
  report += `- Exercices au sol sans équipement instable\n`
  report += `- Positions assises stables (ex: assis sur ballon)\n`
  report += `- Mouvements simples\n`
  report += `- Étirements\n\n`
  
  report += `### Niveau Intermédiaire\n`
  report += `- Exercices avec élastique\n`
  report += `- Mouvements debout basiques\n`
  report += `- Exercices guidés\n`
  report += `- Valeur par défaut sécuritaire\n\n`
  
  report += `### Intermédiaire et Avancé\n`
  report += `- Gainage avec instabilité\n`
  report += `- Exercices à la poulie\n`
  report += `- Combinaisons poids + instabilité\n\n`
  
  report += `### Niveau Avancé\n`
  report += `- Équipements instables (bosu, TRX, disques)\n`
  report += `- Mouvements complexes (pyramide, jacknife)\n`
  report += `- Multiple équipements combinés\n`
  report += `- Exercices sur une jambe\n`
  report += `- Mouvements très techniques (dips, traction)\n\n`
  
  report += `---\n\n`
  
  // Détails par région
  Object.keys(byRegion).sort().forEach(region => {
    const regionExercises = deductions.filter(d => d.exercise.region === region)
    
    report += `## ${region.toUpperCase()}\n\n`
    report += `**Total :** ${regionExercises.length} exercices\n\n`
    
    // Grouper par intensité déduite
    const byIntensity = {}
    regionExercises.forEach(d => {
      if (!byIntensity[d.deducedIntensity]) {
        byIntensity[d.deducedIntensity] = []
      }
      byIntensity[d.deducedIntensity].push(d.exercise)
    })
    
    Object.entries(byIntensity).forEach(([intensity, exercises]) => {
      report += `### ${intensity} (${exercises.length} exercices)\n\n`
      exercises.forEach(ex => {
        report += `- **${ex.title}**\n`
        if (ex.muscleCible) {
          report += `  - Muscle : ${ex.muscleCible}\n`
        }
      })
      report += `\n`
    })
    
    report += `---\n\n`
  })
  
  // Résumé
  report += `## 📊 Résumé des Déductions\n\n`
  report += `| Région | Débutant | Tout niveau | Intermédiaire | Intermédiaire et avancé | Avancé | Total |\n`
  report += `|--------|----------|-------------|---------------|-------------------------|--------|-------|\n`
  
  Object.keys(byRegion).sort().forEach(region => {
    const r = byRegion[region]
    report += `| ${region} | `
    report += `${r.byIntensity['Niveau débutant'] || 0} | `
    report += `${r.byIntensity['Tout niveau'] || 0} | `
    report += `${r.byIntensity['Niveau intermédiaire'] || 0} | `
    report += `${r.byIntensity['Intermédiaire et avancé'] || 0} | `
    report += `${r.byIntensity['Niveau avancé'] || 0} | `
    report += `${r.total} |\n`
  })
  
  report += `\n**TOTAL : ${missingIntensity.length} exercices**\n\n`
  
  report += `---\n\n`
  report += `## ⚠️ IMPORTANT - Validation Requise\n\n`
  report += `Ces intensités ont été **déduites automatiquement** selon des règles logiques.\n\n`
  report += `**Avant d'appliquer ces modifications :**\n`
  report += `1. Vérifiez que les déductions sont cohérentes\n`
  report += `2. Ajustez si nécessaire les cas douteux\n`
  report += `3. Validez avec la cliente pour les exercices spécifiques\n\n`
  report += `**Pour appliquer les modifications :**\n`
  report += `\`\`\`bash\n`
  report += `node scripts/apply-deduced-intensities.js\n`
  report += `\`\`\`\n\n`
  
  fs.writeFileSync(reportFile, report, 'utf8')
  
  console.log(`✅ Rapport créé : ${reportFile}\n`)
  console.log('📝 Prochaines étapes :\n')
  console.log('1. Vérifiez le rapport pour valider les déductions')
  console.log('2. Si OK, exécutez : node scripts/apply-deduced-intensities.js')
  console.log('3. Puis : node scripts/sync-neon-from-structured-metadata.js\n')
  
  // Retourner les déductions pour un autre script
  return deductions
}

module.exports = { deduceIntensity, completeIntensities }

if (require.main === module) {
  completeIntensities()
}
