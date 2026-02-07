/**
 * Script pour mettre à jour les métadonnées des vidéos Stretching depuis genou.md
 * Le fichier genou.md contient les exercices de stretching avec le format **bold** Markdown
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

/**
 * Parse le fichier genou.md (format avec **bold** Markdown)
 */
function parseGenouMarkdown(content) {
  const exercises = []
  // Filtrer les lignes vides mais garder le contenu
  const lines = content.split('\n').map(l => l.trim()).filter(l => l)
  
  let currentExercise = null
  let readingSection = null
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    let nextLine = i + 1 < lines.length ? lines[i + 1] : ''
    
    // Nettoyer le bold markdown pour le matching
    const cleanLine = line.replace(/\*\*/g, '').trim()
    const cleanNextLine = nextLine.replace(/\*\*/g, '').trim()
    
    // Détecter un nouveau titre d'exercice : une ligne suivie de "Muscle cible"
    if (cleanLine && cleanNextLine.toLowerCase().includes('muscle cible')) {
      // Sauvegarder l'exercice précédent
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      // Nettoyer le titre : enlever le numéro au début et les #
      const title = cleanLine
        .replace(/^#+\s*/, '')
        .replace(/^\d+(\.\d+)?\.?\s*/, '')
        .trim()
      
      currentExercise = {
        title,
        targeted_muscles: [],
        startingPosition: '',
        movement: '',
        intensity: '',
        series: '',
        constraints: '',
        theme: 'Stretching'
      }
      readingSection = null
      continue
    }
    
    if (!currentExercise) continue
    
    // Muscle cible
    if (cleanLine.toLowerCase().includes('muscle cible')) {
      const match = cleanLine.match(/Muscles?\s*cibles?\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.targeted_muscles = match[1]
          .split(/[,;]/)
          .map(m => m.trim().replace(/\.$/, ''))
          .filter(m => m)
      }
      readingSection = null
      continue
    }
    
    // Position départ
    if (cleanLine.toLowerCase().match(/^position\s*d[ée]part/i)) {
      readingSection = 'position'
      // Extraire la valeur si elle est sur la même ligne
      const match = cleanLine.match(/position\s*d[ée]part\s*[:\-]?\s*(.+)/i)
      if (match && match[1].trim()) {
        currentExercise.startingPosition = match[1].trim()
      }
      continue
    }
    
    // Mouvement
    if (cleanLine.toLowerCase().match(/^mouvement/i)) {
      readingSection = 'movement'
      const match = cleanLine.match(/mouvement\s*[:\-]?\s*(.+)/i)
      if (match && match[1].trim()) {
        currentExercise.movement = match[1].trim()
      }
      continue
    }
    
    // Série
    if (cleanLine.toLowerCase().match(/^s[ée]rie/i)) {
      readingSection = null
      const match = cleanLine.match(/s[ée]rie\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.series = match[1].trim().replace(/\.$/, '')
      }
      continue
    }
    
    // Intensité
    if (cleanLine.toLowerCase().match(/^intensit[ée]/i)) {
      readingSection = null
      const match = cleanLine.match(/intensit[ée]\s*[.:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.intensity = match[1].trim().replace(/\.$/, '')
      }
      continue
    }
    
    // Contre-indication
    if (cleanLine.toLowerCase().match(/^contre/i)) {
      readingSection = null
      const match = cleanLine.match(/contre[\s\-]*indication\s*[:\-]?\s*(.+)/i)
      if (match) {
        const val = match[1].trim().replace(/\.$/, '')
        currentExercise.constraints = val.toLowerCase() === 'aucune' ? '' : val
      }
      continue
    }
    
    // Thème
    if (cleanLine.toLowerCase().match(/^th[èe]me/i)) {
      readingSection = null
      const match = cleanLine.match(/th[èe]me\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.theme = match[1].trim().replace(/\.$/, '')
      }
      continue
    }
    
    // Contenu des sections multiligne (position et mouvement)
    if (currentExercise && readingSection && cleanLine) {
      // Ignorer les lignes qui sont des en-têtes de section
      if (!cleanLine.match(/^(position|mouvement|intensit|s[ée]rie|contre|th[èe]me|muscle)/i)) {
        if (readingSection === 'position') {
          currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + cleanLine
        } else if (readingSection === 'movement') {
          // Détecter si la ligne contient "Série" inline (format genou.md)
          const serieInline = cleanLine.match(/(.+?)\s*S[ée]rie\s*[:\-]?\s*(.+)/i)
          if (serieInline) {
            currentExercise.movement += (currentExercise.movement ? ' ' : '') + serieInline[1].trim()
            currentExercise.series = serieInline[2].trim().replace(/\.$/, '')
            readingSection = null
          } else {
            currentExercise.movement += (currentExercise.movement ? ' ' : '') + cleanLine
          }
        }
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
 * Normaliser un titre pour la comparaison
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s]/g, ' ')    // Remplacer ponctuation par espace
    .replace(/\s+/g, ' ')             // Réduire espaces multiples
    .trim()
}

/**
 * Calculer la similarité entre deux chaînes (mots en commun)
 */
function wordSimilarity(str1, str2) {
  const words1 = normalizeTitle(str1).split(' ').filter(w => w.length > 2)
  const words2 = normalizeTitle(str2).split(' ').filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  const common = words1.filter(w => words2.includes(w))
  return common.length / Math.max(words1.length, words2.length)
}

/**
 * Trouver le meilleur exercice correspondant pour un titre vidéo
 */
function findBestMatch(videoTitle, exercises) {
  let bestMatch = null
  let bestScore = 0
  
  // Nettoyer le titre de la vidéo (enlever le préfixe type "Fessier - ")
  const cleanedVideoTitle = videoTitle
    .replace(/^(Fessier\s*-\s*|Ischio[s]?\s*-?\s*)/i, '')
    .trim()
  
  for (const exercise of exercises) {
    // Score 1: similarité directe
    const score1 = wordSimilarity(videoTitle, exercise.title)
    
    // Score 2: similarité sans le préfixe
    const score2 = wordSimilarity(cleanedVideoTitle, exercise.title)
    
    // Score 3: inclusion (l'un contient l'autre)
    const n1 = normalizeTitle(videoTitle)
    const n2 = normalizeTitle(exercise.title)
    const score3 = (n1.includes(n2) || n2.includes(n1)) ? 0.9 : 0
    
    const bestScoreForExercise = Math.max(score1, score2, score3)
    
    if (bestScoreForExercise > bestScore) {
      bestScore = bestScoreForExercise
      bestMatch = exercise
    }
  }
  
  return bestScore >= 0.4 ? { exercise: bestMatch, score: bestScore } : null
}

/**
 * Mapper l'intensité vers la difficulté
 */
function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'debutant' // Stretching = accessible par défaut
  const lower = intensity.toLowerCase()
  if (lower.includes('débutant') || lower.includes('debutant')) return 'debutant'
  if (lower.includes('intermédiaire') || lower.includes('intermediaire') || lower.includes('tout niveau')) return 'intermediaire'
  if (lower.includes('avancé') || lower.includes('avance')) return 'avance'
  return 'debutant'
}

async function main() {
  console.log('\n🚀 Mise à jour des métadonnées Stretching depuis genou.md\n')
  console.log('='.repeat(60))
  
  // 1. Lire et parser le fichier Markdown
  const mdPath = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/genou.md')
  
  if (!fs.existsSync(mdPath)) {
    console.error('❌ Fichier genou.md non trouvé:', mdPath)
    process.exit(1)
  }
  
  const content = fs.readFileSync(mdPath, 'utf-8')
  const exercises = parseGenouMarkdown(content)
  
  console.log(`\n📄 ${exercises.length} exercices extraits de genou.md:\n`)
  exercises.forEach((ex, i) => {
    console.log(`   ${i + 1}. ${ex.title}`)
    console.log(`      Muscles: ${ex.targeted_muscles.join(', ') || '(vide)'}`)
    console.log(`      Position: ${ex.startingPosition ? ex.startingPosition.substring(0, 60) + '...' : '(vide)'}`)
    console.log(`      Mouvement: ${ex.movement ? ex.movement.substring(0, 60) + '...' : '(vide)'}`)
    console.log(`      Série: ${ex.series || '(vide)'}`)
    console.log(`      Contraintes: ${ex.constraints || '(aucune)'}`)
  })
  
  // 2. Récupérer les vidéos stretching de Neon
  const videos = await sql`
    SELECT id, title, "videoNumber"
    FROM videos_new
    WHERE region = 'streching'
    ORDER BY "videoNumber" NULLS LAST, title
  `
  
  console.log(`\n📹 ${videos.length} vidéos stretching dans Neon\n`)
  console.log('='.repeat(60))
  console.log('\n🔄 Matching et mise à jour...\n')
  
  let updatedCount = 0
  let notFoundCount = 0
  const notFound = []
  
  for (const video of videos) {
    const match = findBestMatch(video.title, exercises)
    
    if (match) {
      const { exercise, score } = match
      const difficulty = mapIntensityToDifficulty(exercise.intensity)
      const description = exercise.startingPosition || `Exercice de stretching: ${video.title}`
      
      await sql`
        UPDATE videos_new
        SET 
          description = ${description},
          "startingPosition" = ${exercise.startingPosition},
          movement = ${exercise.movement},
          intensity = ${exercise.intensity || 'Tout niveau'},
          series = ${exercise.series},
          constraints = ${exercise.constraints},
          theme = ${exercise.theme || 'Stretching'},
          targeted_muscles = ${exercise.targeted_muscles}::text[],
          "muscleGroups" = ${['streching']}::text[],
          difficulty = ${difficulty},
          "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      
      console.log(`✅ (${(score * 100).toFixed(0)}%) #${video.videoNumber} ${video.title}`)
      console.log(`   → ${exercise.title}`)
      updatedCount++
    } else {
      console.log(`⚠️  #${video.videoNumber} ${video.title} → PAS DE CORRESPONDANCE`)
      notFound.push(video.title)
      notFoundCount++
    }
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Vidéos mises à jour: ${updatedCount}`)
  console.log(`⚠️  Sans correspondance: ${notFoundCount}`)
  if (notFound.length > 0) {
    console.log(`\n📋 Vidéos sans correspondance:`)
    notFound.forEach(t => console.log(`   - ${t}`))
  }
  console.log(`${'='.repeat(60)}\n`)
}

main().catch(err => {
  console.error('❌ Erreur:', err)
  process.exit(1)
})
