/**
 * Script pour trouver les correspondances de métadonnées pour les vidéos
 * qui ont des métadonnées minimales (comme celles affichées dans l'interface)
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
 * Normalise un titre pour la comparaison
 * Enlève les codes de fin comme "f", "h", "x", etc.
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+[fhx]\s*$/i, '') // Enlève les codes f, h, x à la fin
    .replace(/\s+[fhx]\s+/g, ' ') // Enlève les codes f, h, x isolés
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Compare deux titres avec une tolérance aux variations
 */
function compareTitles(title1, title2) {
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)
  
  if (norm1 === norm2) return { score: 100, type: 'exact' }
  
  // Correspondance partielle (un contient l'autre)
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
  
  // Si au moins 2 mots-clés communs significatifs, c'est probablement une correspondance
  if (commonWords.length >= 2) {
    // Calculer un score basé sur le nombre de mots communs et leur importance
    const totalWords = Math.max(words1.length, words2.length)
    const matchRatio = commonWords.length / totalWords
    const baseScore = 60 + (matchRatio * 30)
    return { score: Math.min(Math.round(baseScore), 95), type: 'keywords' }
  } else if (commonWords.length === 1 && commonWords[0].length > 4) {
    return { score: 40, type: 'single_keyword' }
  }
  
  return { score: 0, type: 'none' }
}

/**
 * Extrait les métadonnées d'un exercice
 */
function extractExerciseMetadata(text, exerciseTitle) {
  const metadata = {
    title: exerciseTitle,
    muscleGroups: null,
    startingPosition: null,
    movement: null,
    intensity: null,
    series: null,
    constraints: null,
    theme: null
  }

  const muscleMatch = text.match(/Muscle cible\s*[:：]\s*([^\n]+)/i)
  if (muscleMatch) {
    const muscles = muscleMatch[1]
      .split(/[,，]/)
      .map(m => m.trim())
      .filter(m => m)
    metadata.muscleGroups = muscles
  }

  const positionMatch = text.match(/Position\s+(?:de\s+)?départ\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:Mouvement|Intensité|Série|Contre|Thème|$))/i)
  if (positionMatch) {
    metadata.startingPosition = positionMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l)
      .join('. ')
  }

  const movementMatch = text.match(/Mouvement\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:Intensité|Série|Contre|Thème|$))/i)
  if (movementMatch) {
    metadata.movement = movementMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l)
      .join('. ')
  }

  const intensityMatch = text.match(/Intensité\s*[:：.]\s*([^\n]+)/i)
  if (intensityMatch) {
    metadata.intensity = intensityMatch[1].trim()
  }

  const seriesMatch = text.match(/Série\s*[:：]\s*([^\n]+)/i)
  if (seriesMatch) {
    metadata.series = seriesMatch[1].trim()
  }

  const constraintsMatch = text.match(/Contre\s*[-]?\s*indication\s*[:：]\s*([^\n]+)/i)
  if (constraintsMatch) {
    metadata.constraints = constraintsMatch[1].trim()
  }

  const themeMatch = text.match(/Thème\s*[:：]\s*([^\n]+)/i)
  if (themeMatch) {
    metadata.theme = themeMatch[1].trim()
  }

  return metadata
}

/**
 * Parse le fichier de métadonnées
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
    
    // Détecter le début d'un exercice:
    // - Ligne avec texte (pas vide, pas de préfixes spéciaux)
    // - Suivie d'une ligne vide
    // - Puis "Muscle cible" ou "Position départ"
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
        const exerciseContent = exerciseText.join('\n')
        const metadata = extractExerciseMetadata(exerciseContent, currentExercise)
        if (metadata.muscleGroups || metadata.startingPosition || metadata.movement) {
          exercises.push({
            title: currentExercise,
            normalizedTitle: normalizeTitle(currentExercise),
            metadata: metadata,
            rawText: exerciseContent
          })
        }
      }
      
      // Nouvel exercice
      currentExercise = trimmed
      exerciseText = [line]
      inExercise = true
    } else if (inExercise) {
      // Si on rencontre un nouveau titre potentiel (ligne seule suivie d'une ligne vide puis métadonnées)
      if (trimmed && 
          trimmed.length > 5 &&
          !trimmed.match(/^Muscle|^Position|^Mouvement|^Intensité|^Série|^Contre|^Thème|^$/) &&
          nextLine === '' &&
          nextNextLine.match(/^Muscle\s+cible|^Position/i)) {
        // Sauvegarder l'exercice précédent
        if (currentExercise && exerciseText.length > 0) {
          const exerciseContent = exerciseText.join('\n')
          const metadata = extractExerciseMetadata(exerciseContent, currentExercise)
          if (metadata.muscleGroups || metadata.startingPosition || metadata.movement) {
            exercises.push({
              title: currentExercise,
              normalizedTitle: normalizeTitle(currentExercise),
              metadata: metadata,
              rawText: exerciseContent
            })
          }
        }
        // Nouvel exercice
        currentExercise = trimmed
        exerciseText = [line]
      } else {
        // Continuer à accumuler le texte de l'exercice
        exerciseText.push(line)
      }
    }
  }
  
  if (currentExercise && exerciseText.length > 0) {
    const exerciseContent = exerciseText.join('\n')
    const metadata = extractExerciseMetadata(exerciseContent, currentExercise)
    if (metadata.muscleGroups || metadata.startingPosition || metadata.movement) {
      exercises.push({
        title: currentExercise,
        normalizedTitle: normalizeTitle(currentExercise),
        metadata: metadata,
        rawText: exerciseContent
      })
    }
  }
  
  return exercises
}

/**
 * Trouve la meilleure correspondance
 */
function findBestMatch(videoTitle, exercises) {
  const matches = []
  
  for (const exercise of exercises) {
    const comparison = compareTitles(videoTitle, exercise.title)
    
    if (comparison.score > 0) {
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

async function findMatchesForMinimalMetadataVideos() {
  try {
    console.log('📖 Lecture du fichier de métadonnées...\n')
    
    if (!fs.existsSync(METADATA_FILE)) {
      console.error(`❌ Fichier de métadonnées non trouvé: ${METADATA_FILE}`)
      process.exit(1)
    }
    
    const exercises = parseMetadataFile(METADATA_FILE)
    console.log(`✅ ${exercises.length} exercices trouvés dans le fichier de métadonnées\n`)
    
    console.log('🔍 Recherche des vidéos avec métadonnées minimales...\n')
    
    // Récupérer les vidéos avec métadonnées minimales
    const videos = await sql`
      SELECT 
        id, 
        title, 
        "muscleGroups", 
        "startingPosition", 
        movement, 
        intensity, 
        series, 
        constraints, 
        theme,
        region,
        category
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
        AND (
          "muscleGroups" IS NULL 
          OR array_length("muscleGroups", 1) IS NULL
        )
        AND (
          "startingPosition" IS NULL 
          OR "startingPosition" = ''
        )
        AND (
          "movement" IS NULL 
          OR "movement" = ''
        )
      ORDER BY title
    `
    
    console.log(`📊 ${videos.length} vidéos avec métadonnées minimales trouvées\n`)
    
    // Trouver les correspondances
    const matches = []
    const noMatches = []
    
    console.log('🔍 Recherche des correspondances...\n')
    
    for (const video of videos) {
      const match = findBestMatch(video.title, exercises)
      
      if (match && match.score >= 60) {
        matches.push({
          video: video,
          match: match,
          confidence: match.score >= 90 ? 'high' : match.score >= 70 ? 'medium' : 'low'
        })
      } else {
        noMatches.push(video)
      }
    }
    
    // Générer le rapport
    const outputDir = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Rapport texte pour validation
    let textReport = `RAPPORT DE CORRESPONDANCES POUR VIDÉOS AVEC MÉTADONNÉES MINIMALES\n`
    textReport += `(Comme celles affichées dans l'interface avec seulement titre et contre-indication)\n\n`
    textReport += `Généré le: ${new Date().toLocaleString('fr-FR')}\n\n`
    textReport += `${'='.repeat(100)}\n`
    textReport += `RÉSUMÉ\n`
    textReport += `${'='.repeat(100)}\n`
    textReport += `Total vidéos avec métadonnées minimales: ${videos.length}\n`
    textReport += `Correspondances trouvées: ${matches.length}\n`
    textReport += `Aucune correspondance: ${noMatches.length}\n\n`
    
    // Grouper par niveau de confiance
    const highConfidence = matches.filter(m => m.confidence === 'high')
    const mediumConfidence = matches.filter(m => m.confidence === 'medium')
    const lowConfidence = matches.filter(m => m.confidence === 'low')
    
    textReport += `${'='.repeat(100)}\n`
    textReport += `CORRESPONDANCES HAUTE CONFIANCE (${highConfidence.length})\n`
    textReport += `${'='.repeat(100)}\n\n`
    
    highConfidence.forEach((m, index) => {
      textReport += `${index + 1}. VIDÉO: ${m.video.title}\n`
      textReport += `   ID: ${m.video.id}\n`
      textReport += `   Région: ${m.video.region || 'N/A'}\n`
      textReport += `   → CORRESPONDANCE: ${m.match.exercise.title}\n`
      textReport += `   Score: ${m.match.score}/100 (${m.match.matchType})\n`
      textReport += `   Métadonnées trouvées:\n`
      if (m.match.exercise.metadata.muscleGroups) {
        textReport += `     - Muscle cible: ${m.match.exercise.metadata.muscleGroups.join(', ')}\n`
      }
      if (m.match.exercise.metadata.startingPosition) {
        textReport += `     - Position départ: ${m.match.exercise.metadata.startingPosition.substring(0, 150)}...\n`
      }
      if (m.match.exercise.metadata.movement) {
        textReport += `     - Mouvement: ${m.match.exercise.metadata.movement.substring(0, 150)}...\n`
      }
      if (m.match.exercise.metadata.intensity) {
        textReport += `     - Intensité: ${m.match.exercise.metadata.intensity}\n`
      }
      if (m.match.exercise.metadata.series) {
        textReport += `     - Série: ${m.match.exercise.metadata.series}\n`
      }
      if (m.match.exercise.metadata.constraints) {
        textReport += `     - Contre-indication: ${m.match.exercise.metadata.constraints}\n`
      }
      if (m.match.exercise.metadata.theme) {
        textReport += `     - Thème: ${m.match.exercise.metadata.theme}\n`
      }
      textReport += `   ✅ VALIDATION: [ ] OUI  [ ] NON\n\n`
    })
    
    if (mediumConfidence.length > 0) {
      textReport += `${'='.repeat(100)}\n`
      textReport += `CORRESPONDANCES MOYENNE CONFIANCE (${mediumConfidence.length})\n`
      textReport += `${'='.repeat(100)}\n\n`
      
      mediumConfidence.forEach((m, index) => {
        textReport += `${index + 1}. VIDÉO: ${m.video.title}\n`
        textReport += `   ID: ${m.video.id}\n`
        textReport += `   → CORRESPONDANCE: ${m.match.exercise.title}\n`
        textReport += `   Score: ${m.match.score}/100 (${m.match.matchType})\n`
        textReport += `   ⚠️  VALIDATION: [ ] OUI  [ ] NON\n\n`
      })
    }
    
    if (lowConfidence.length > 0) {
      textReport += `${'='.repeat(100)}\n`
      textReport += `CORRESPONDANCES FAIBLE CONFIANCE (${lowConfidence.length})\n`
      textReport += `${'='.repeat(100)}\n\n`
      
      lowConfidence.forEach((m, index) => {
        textReport += `${index + 1}. VIDÉO: ${m.video.title}\n`
        textReport += `   ID: ${m.video.id}\n`
        textReport += `   → CORRESPONDANCE: ${m.match.exercise.title}\n`
        textReport += `   Score: ${m.match.score}/100 (${m.match.matchType})\n`
        textReport += `   ⚠️  VALIDATION: [ ] OUI  [ ] NON\n\n`
      })
    }
    
    if (noMatches.length > 0) {
      textReport += `${'='.repeat(100)}\n`
      textReport += `AUCUNE CORRESPONDANCE TROUVÉE (${noMatches.length})\n`
      textReport += `${'='.repeat(100)}\n\n`
      
      noMatches.forEach((v, index) => {
        textReport += `${index + 1}. ${v.title} (ID: ${v.id}, Région: ${v.region || 'N/A'})\n`
      })
    }
    
    const textFile = path.join(outputDir, 'matches-for-minimal-metadata-videos.txt')
    fs.writeFileSync(textFile, textReport, 'utf8')
    
    // Rapport JSON
    const jsonReport = {
      generatedAt: new Date().toISOString(),
      totalVideos: videos.length,
      matchesFound: matches.length,
      noMatches: noMatches.length,
      matches: matches.map(m => ({
        videoId: m.video.id,
        videoTitle: m.video.title,
        videoRegion: m.video.region,
        matchTitle: m.match.exercise.title,
        confidence: m.confidence,
        score: m.match.score,
        matchType: m.match.matchType,
        metadata: m.match.exercise.metadata
      })),
      noMatches: noMatches.map(v => ({
        id: v.id,
        title: v.title,
        region: v.region
      }))
    }
    
    const jsonFile = path.join(outputDir, 'matches-for-minimal-metadata-videos.json')
    fs.writeFileSync(jsonFile, JSON.stringify(jsonReport, null, 2), 'utf8')
    
    // Afficher un résumé
    console.log('='.repeat(100))
    console.log('📊 RÉSUMÉ DES CORRESPONDANCES')
    console.log('='.repeat(100))
    console.log(`Total vidéos avec métadonnées minimales: ${videos.length}`)
    console.log(`\n✅ Correspondances haute confiance: ${highConfidence.length}`)
    console.log(`⚠️  Correspondances moyenne confiance: ${mediumConfidence.length}`)
    console.log(`⚠️  Correspondances faible confiance: ${lowConfidence.length}`)
    console.log(`❌ Aucune correspondance: ${noMatches.length}`)
    console.log('='.repeat(100))
    
    console.log(`\n💾 Rapport de validation sauvegardé dans: ${textFile}`)
    console.log(`💾 Rapport JSON sauvegardé dans: ${jsonFile}`)
    console.log(`\n📝 Veuillez valider les correspondances dans le fichier de validation avant de procéder à la mise à jour.`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    process.exit(1)
  }
}

// Exécuter le script
findMatchesForMinimalMetadataVideos()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
