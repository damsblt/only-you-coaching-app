/**
 * Script pour mettre à jour les titres des vidéos dans Neon
 * pour qu'ils correspondent exactement au fichier de métadonnées
 * (en enlevant les codes f/h/x et en ajoutant les "+" ou "avec" manquants)
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

// Chemin vers le fichier de métadonnées
const METADATA_FILE = path.join(
  __dirname,
  '..',
  'Dossier Cliente',
  'Video',
  'groupes-musculaires',
  '01-métadonnées',
  'metadonnees-completes.md'
)

/**
 * Normalise un titre pour la comparaison (enlève codes f/h/x, normalise)
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+[fhx]\s*$/i, '') // Enlève les codes f, h, x à la fin
    .replace(/\s+[fhx]\s+/g, ' ') // Enlève les codes f, h, x isolés
    .replace(/[^a-z0-9\s+]/g, ' ') // Remplace caractères spéciaux sauf +
    .replace(/\s*\+\s*/g, ' + ') // Normalise les +
    .replace(/\s+/g, ' ') // Normalise les espaces
    .trim()
}

/**
 * Compare deux titres et retourne un score de similarité
 */
function compareTitles(title1, title2) {
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)
  
  if (norm1 === norm2) return { score: 100, type: 'exact' }
  
  // Correspondance partielle
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = norm1.length > norm2.length ? norm1 : norm2
    const shorter = norm1.length > norm2.length ? norm2 : norm1
    const ratio = shorter.length / longer.length
    return { score: Math.round(ratio * 90), type: 'partial' }
  }
  
  // Correspondance par mots-clés
  const words1 = norm1.split(/\s+/).filter(w => w.length > 2)
  const words2 = norm2.split(/\s+/).filter(w => w.length > 2)
  const commonWords = words1.filter(w => words2.includes(w))
  
  if (commonWords.length >= 2) {
    const totalWords = Math.max(words1.length, words2.length)
    const matchRatio = commonWords.length / totalWords
    const baseScore = 60 + (matchRatio * 30)
    return { score: Math.min(Math.round(baseScore), 95), type: 'keywords' }
  }
  
  return { score: 0, type: 'none' }
}

/**
 * Nettoie un titre en enlevant les numéros au début et les espaces multiples
 */
function cleanTitle(title) {
  // Enlever les numéros au début (ex: "18.        Crunch..." -> "Crunch...")
  let cleaned = title.replace(/^\d+\.\s*/, '').trim()
  
  // Enlever les espaces multiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

/**
 * Extrait les exercices du fichier de métadonnées
 */
function parseMetadataFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const exercises = []
  const lines = content.split('\n')
  let currentExercise = null
  let exerciseText = []
  let inExercise = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
    const nextNextLine = i + 2 < lines.length ? lines[i + 2].trim() : ''
    
    // Détecter le début d'un exercice
    if (trimmed && 
        !trimmed.startsWith('**') && 
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('Source') &&
        !trimmed.startsWith('---') &&
        trimmed.length > 5 &&
        nextLine === '' &&
        (nextNextLine.match(/^Muscle\s+cible|^Position/i))) {
      
      // Sauvegarder l'exercice précédent
      if (currentExercise && exerciseText.length > 0) {
        const cleanedTitle = cleanTitle(currentExercise)
        exercises.push({
          title: cleanedTitle,
          normalizedTitle: normalizeTitle(cleanedTitle)
        })
      }
      
      // Nouvel exercice
      currentExercise = trimmed
      exerciseText = [line]
      inExercise = true
    } else if (inExercise) {
      // Si on rencontre un nouveau titre potentiel
      if (trimmed && 
          trimmed.length > 5 &&
          !trimmed.match(/^Muscle|^Position|^Mouvement|^Intensité|^Série|^Contre|^Thème|^$/) &&
          nextLine === '' &&
          nextNextLine.match(/^Muscle\s+cible|^Position/i)) {
        // Sauvegarder l'exercice précédent
        if (currentExercise && exerciseText.length > 0) {
          const cleanedTitle = cleanTitle(currentExercise)
          exercises.push({
            title: cleanedTitle,
            normalizedTitle: normalizeTitle(cleanedTitle)
          })
        }
        // Nouvel exercice
        currentExercise = trimmed
        exerciseText = [line]
      } else {
        exerciseText.push(line)
      }
    }
  }
  
  // Dernier exercice
  if (currentExercise && exerciseText.length > 0) {
    const cleanedTitle = cleanTitle(currentExercise)
    exercises.push({
      title: cleanedTitle,
      normalizedTitle: normalizeTitle(cleanedTitle)
    })
  }
  
  return exercises
}

/**
 * Trouve la meilleure correspondance pour un titre
 */
function findBestMatch(videoTitle, exercises) {
  const matches = []
  
  for (const exercise of exercises) {
    const comparison = compareTitles(videoTitle, exercise.title)
    
    // Ajuster le seuil selon le type de correspondance
    // Pour les correspondances exactes ou partielles, accepter dès 80
    // Pour les keywords, être plus strict (85+)
    const minScore = comparison.type === 'exact' || comparison.type === 'partial' ? 80 : 85
    
    if (comparison.score >= minScore) {
      matches.push({
        exercise: exercise,
        score: comparison.score,
        matchType: comparison.type
      })
    }
  }
  
  matches.sort((a, b) => b.score - a.score)
  return matches.length > 0 ? matches[0] : null
}

async function updateTitlesFromMetadata() {
  try {
    console.log('📖 Lecture du fichier de métadonnées...\n')
    
    if (!fs.existsSync(METADATA_FILE)) {
      console.error(`❌ Fichier de métadonnées non trouvé: ${METADATA_FILE}`)
      process.exit(1)
    }
    
    const exercises = parseMetadataFile(METADATA_FILE)
    console.log(`✅ ${exercises.length} exercices trouvés dans le fichier de métadonnées\n`)
    
    console.log('🔍 Récupération des vidéos MUSCLE_GROUPS depuis Neon...\n')
    
    // Récupérer toutes les vidéos MUSCLE_GROUPS
    const videos = await sql`
      SELECT 
        id, 
        title
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
      ORDER BY title
    `
    
    console.log(`📊 ${videos.length} vidéos MUSCLE_GROUPS trouvées\n`)
    
    // Trouver les correspondances
    const matches = []
    const noMatches = []
    
    console.log('🔍 Recherche des correspondances...\n')
    
    for (const video of videos) {
      const match = findBestMatch(video.title, exercises)
      
      if (match && match.score >= 80) {
        // Vérifier si le titre est différent
        const normalizedVideo = normalizeTitle(video.title)
        const normalizedMetadata = normalizeTitle(match.exercise.title)
        
        if (normalizedVideo !== normalizedMetadata || video.title !== match.exercise.title) {
          matches.push({
            video: video,
            match: match,
            needsUpdate: true
          })
        }
      } else {
        noMatches.push(video)
      }
    }
    
    console.log(`📊 ${matches.length} correspondances trouvées nécessitant une mise à jour\n`)
    
    if (matches.length === 0) {
      console.log('✅ Tous les titres sont déjà à jour!')
      return
    }
    
    // Afficher les correspondances
    console.log('📋 Titres à mettre à jour:\n')
    matches.forEach((m, index) => {
      console.log(`${index + 1}. "${m.video.title}"`)
      console.log(`   → "${m.match.exercise.title}"`)
      console.log(`   Score: ${m.match.score}/100 (${m.match.matchType})\n`)
    })
    
    // Générer un rapport
    const outputDir = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    let report = `RAPPORT DE MISE À JOUR DES TITRES\n`
    report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n\n`
    report += `${'='.repeat(100)}\n`
    report += `RÉSUMÉ\n`
    report += `${'='.repeat(100)}\n`
    report += `Total vidéos MUSCLE_GROUPS: ${videos.length}\n`
    report += `Titres à mettre à jour: ${matches.length}\n`
    report += `Aucune correspondance: ${noMatches.length}\n\n`
    
    report += `${'='.repeat(100)}\n`
    report += `TITRES À METTRE À JOUR\n`
    report += `${'='.repeat(100)}\n\n`
    
    matches.forEach((m, index) => {
      report += `${index + 1}. ID: ${m.video.id}\n`
      report += `   Ancien titre: "${m.video.title}"\n`
      report += `   Nouveau titre: "${m.match.exercise.title}"\n`
      report += `   Score: ${m.match.score}/100 (${m.match.matchType})\n`
      report += `   ✅ VALIDATION: [ ] OUI  [ ] NON\n\n`
    })
    
    if (noMatches.length > 0) {
      report += `${'='.repeat(100)}\n`
      report += `AUCUNE CORRESPONDANCE TROUVÉE (${noMatches.length})\n`
      report += `${'='.repeat(100)}\n\n`
      noMatches.slice(0, 20).forEach((v, index) => {
        report += `${index + 1}. ${v.title} (ID: ${v.id})\n`
      })
      if (noMatches.length > 20) {
        report += `\n... et ${noMatches.length - 20} autres\n`
      }
    }
    
    const reportFile = path.join(outputDir, 'title-updates-validation.txt')
    fs.writeFileSync(reportFile, report, 'utf8')
    
    // Sauvegarder aussi en JSON
    const jsonReport = {
      generatedAt: new Date().toISOString(),
      totalVideos: videos.length,
      matchesFound: matches.length,
      noMatches: noMatches.length,
      matches: matches.map(m => ({
        videoId: m.video.id,
        oldTitle: m.video.title,
        newTitle: m.match.exercise.title,
        score: m.match.score,
        matchType: m.match.matchType
      })),
      noMatches: noMatches.map(v => ({
        id: v.id,
        title: v.title
      }))
    }
    
    const jsonFile = path.join(outputDir, 'title-updates.json')
    fs.writeFileSync(jsonFile, JSON.stringify(jsonReport, null, 2), 'utf8')
    
    console.log('='.repeat(100))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(100))
    console.log(`Total vidéos MUSCLE_GROUPS: ${videos.length}`)
    console.log(`Titres à mettre à jour: ${matches.length}`)
    console.log(`Aucune correspondance: ${noMatches.length}`)
    console.log('='.repeat(100))
    
    console.log(`\n💾 Rapport de validation sauvegardé dans: ${reportFile}`)
    console.log(`💾 Rapport JSON sauvegardé dans: ${jsonFile}`)
    console.log(`\n📝 Veuillez valider les mises à jour dans le fichier de validation avant de procéder.`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    process.exit(1)
  }
}

// Exécuter le script
updateTitlesFromMetadata()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
