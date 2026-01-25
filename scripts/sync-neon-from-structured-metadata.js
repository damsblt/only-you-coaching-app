/**
 * Script pour synchroniser Neon avec le fichier de métadonnées structurées
 * SOURCE DE VÉRITÉ : metadonnees-structurees.md
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

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
    
    const positionMatch = line.match(/^- \*\*Position départ :\*\* (.+)$/)
    if (positionMatch) {
      currentExercise.positionDepart = positionMatch[1].trim()
      continue
    }
    
    const mouvementMatch = line.match(/^- \*\*Mouvement :\*\* (.+)$/)
    if (mouvementMatch) {
      currentExercise.mouvement = mouvementMatch[1].trim()
      continue
    }
    
    const intensiteMatch = line.match(/^- \*\*Intensité :\*\* (.+)$/)
    if (intensiteMatch) {
      currentExercise.intensite = intensiteMatch[1].trim()
      continue
    }
    
    const serieMatch = line.match(/^- \*\*Série :\*\* (.+)$/)
    if (serieMatch) {
      currentExercise.serie = serieMatch[1].trim()
      continue
    }
    
    const contreMatch = line.match(/^- \*\*Contre-indication :\*\* (.+)$/)
    if (contreMatch) {
      currentExercise.contreIndication = contreMatch[1].trim()
      continue
    }
    
    const themeMatch = line.match(/^- \*\*Thème :\*\* (.+)$/)
    if (themeMatch) {
      currentExercise.theme = themeMatch[1].trim()
      continue
    }
  }
  
  if (currentExercise) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

/**
 * Normaliser un titre pour le matching
 */
function normalizeTitle(title) {
  let normalized = title
    .toLowerCase()
    .trim()
    .normalize('NFC')
    // Retirer F/H à la fin
    .replace(/\s*[fh]\s*$/i, '')
    // Retirer numéros au début
    .replace(/^\d+(\.\d+)?\.?\s*/, '')
    // Normaliser les espaces
    .replace(/\s+/g, ' ')
    // Retirer ponctuation finale
    .replace(/[.,;]\s*$/g, '')
    .trim()
  
  // Corrections orthographiques communes
  const replacements = {
    'poid du corps': 'poids du corps',
    'ketter bell': 'kettlebell',
    'kettler bell': 'kettlebell',
    'médecin ball': 'medecinball',
    'medicine ball': 'medecinball',
    'haltèe': 'haltere',
    'avec haltères': 'avec haltere',
    'avec haltère': 'avec haltere',
    '\\+ haltères': '+ haltere',
    '\\+ haltère': '+ haltere',
    'fléchit': 'flechit',
    'fléchis': 'flechis',
    'fléxion': 'flexion',
    'féxion': 'flexion',
    'coucher': 'couche',
    'couché': 'couche',
    'touché': 'toucher',
    'alternés': 'alternes',
    'alterné': 'alterne',
    'altené': 'alterne',
    'explovif': 'explosif',
    'avançé': 'avance',
    'avancé': 'avance',
    'dv': 'developpe',
    'dévellopé': 'developpe',
    'développé': 'developpe',
    'dead lift': 'deadlift',
    'leg curl': 'legcurl',
    'step up': 'stepup',
    'biceps curl': 'bicepscurl',
    'v step': 'vstep',
    'entre les jambes': 'entre jambes',
    'sur le bosu': 'bosu',
    'sur bosu': 'bosu',
    'sur le step': 'step',
    'sur le banc': 'banc',
    'sur banc': 'banc',
    'sur le ballon': 'ballon',
    'sur ballon': 'ballon',
    'sur disque': 'disque',
    'sur disques': 'disque',
    'sur les disque': 'disque',
    'au mur': 'mur',
    'contre le mur': 'mur',
    'avec ballon': 'ballon',
    'ballon au mur': 'ballon mur',
    'avec élastique': 'elastique',
    '\\+ élastique': '+ elastique',
    '\\+ élasique': '+ elastique',
    '\\+ élatique': '+ elastique',
    'avec main trx': 'main trx',
    'pieds trx': 'pied trx',
    'genoux fléchit': 'genou flechit',
    'genoux fléchis': 'genou flechis',
    'à quatre pattes': 'quatre pattes',
    'à quattre pattes': 'quatre pattes',
    'à genoux': 'genou',
    'au sol': 'sol',
    'en appui': 'appui',
    'une jambe': '1 jambe',
    'sur une jambe': '1 jambe',
    'sur 1 jambe': '1 jambe',
    '2 pieds': 'pieds',
    'deux pieds': 'pieds',
    '1 pied': 'pied',
    'un pied': 'pied',
    'pied avant': 'avant',
    'pied arrière': 'arriere',
    'sumo squat': 'squat sumo',
    'rowing poulie basse': 'rowing poulie',
    'barre libre': 'barre',
    'barre guidée': 'barre',
    'trust': 'thrust',
    'dipds': 'dips',
    'cruch': 'crunch',
    'reeverse': 'reverse',
    'gainag': 'gainage',
    'gainge': 'gainage',
    'spoas': 'psoas',
    'flament': 'flamant',
    'extention': 'extension',
    'pont épaulé': 'pont epaule',
    'jack nife': 'jacknife',
    'poulies hautes': 'poulie haute',
    'poulie basse et corde': 'poulie basse corde',
    'poulie haute et barre': 'poulie haute barre',
    'poulie haute et corde': 'poulie haute corde'
  }
  
  for (const [from, to] of Object.entries(replacements)) {
    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    normalized = normalized.replace(new RegExp(escapedFrom, 'g'), to)
  }
  
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Convertir l'intensité en difficulté
 */
function mapIntensityToDifficulty(intensity) {
  if (!intensity) return null // NULL pour "tout niveau" non spécifié
  
  const lower = intensity.toLowerCase()
  
  // "Tout niveau" → NULL (apparaît uniquement dans "Tous les niveaux")
  if (lower.includes('tout niveau') || lower.includes('tour niveau')) {
    return null
  }
  
  // Débutant
  if (lower.includes('débutant') || lower.includes('niveau 1')) {
    return 'debutant'
  }
  
  // Avancé
  if (lower.includes('avancé') || lower.includes('avance') || 
      lower.includes('niveau 2') || lower.includes('niveau 3') || 
      lower.includes('très avancé')) {
    return 'avance'
  }
  
  // Intermédiaire (par défaut pour les autres cas)
  return 'intermediaire'
}

/**
 * Calculer le score de similarité entre deux titres
 */
function calculateSimilarity(title1, title2) {
  const words1 = title1.split(' ').filter(w => w.length > 2)
  const words2 = title2.split(' ').filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  const commonWords = words1.filter(w => words2.includes(w))
  const maxLength = Math.max(words1.length, words2.length)
  
  return commonWords.length / maxLength
}

/**
 * Synchroniser Neon avec les métadonnées
 */
async function syncNeonWithMetadata() {
  console.log('\n🚀 Synchronisation de Neon avec metadonnees-structurees.md\n')
  console.log(`📄 Fichier source : ${METADATA_FILE}\n`)
  
  // Lire le fichier
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(`❌ Fichier non trouvé : ${METADATA_FILE}`)
    process.exit(1)
  }
  
  const content = fs.readFileSync(METADATA_FILE, 'utf8')
  const exercises = parseStructuredMetadata(content)
  
  console.log(`📋 ${exercises.length} exercices extraits du fichier\n`)
  
  // Créer un map normalisé pour le matching
  const normalizedExercises = new Map()
  exercises.forEach(ex => {
    const normalizedTitle = normalizeTitle(ex.title)
    normalizedExercises.set(normalizedTitle, ex)
  })
  
  console.log(`🔍 ${normalizedExercises.size} titres uniques normalisés\n`)
  
  // Récupérer toutes les vidéos MUSCLE_GROUPS
  const videos = await sql`
    SELECT id, title, region
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    ORDER BY region, title
  `
  
  console.log(`📹 ${videos.length} vidéos MUSCLE_GROUPS trouvées dans Neon\n`)
  console.log('🔄 Début de la synchronisation...\n')
  console.log(`${'='.repeat(80)}\n`)
  
  let updatedCount = 0
  let notFoundCount = 0
  let skippedCount = 0
  const notFoundVideos = []
  
  for (const video of videos) {
    const normalizedVideoTitle = normalizeTitle(video.title)
    let metadata = normalizedExercises.get(normalizedVideoTitle)
    let matchType = 'exact'
    let matchScore = 1.0
    
    // Si pas de match exact, chercher par similarité
    if (!metadata) {
      let bestMatch = null
      let bestScore = 0
      
      for (const [exerciseTitle, exerciseData] of normalizedExercises.entries()) {
        // Filtrer par région si possible
        if (exerciseData.region && exerciseData.region !== video.region) {
          continue
        }
        
        const score = calculateSimilarity(normalizedVideoTitle, exerciseTitle)
        
        if (score > bestScore && score >= 0.5) { // Seuil de 50%
          bestScore = score
          bestMatch = exerciseData
        }
      }
      
      if (bestMatch) {
        metadata = bestMatch
        matchType = 'partial'
        matchScore = bestScore
      }
    }
    
    if (!metadata) {
      notFoundCount++
      notFoundVideos.push({ title: video.title, region: video.region })
      continue
    }
    
    // Vérifier si l'intensité est définie dans les métadonnées
    if (!metadata.intensite) {
      skippedCount++
      console.log(`⚠️  [${video.region}] ${video.title}`)
      console.log(`   → Métadonnées trouvées mais intensité manquante\n`)
      continue
    }
    
    // Préparer les données de mise à jour
    const difficulty = mapIntensityToDifficulty(metadata.intensite)
    const description = metadata.positionDepart || `Exercice: ${video.title}`
    const muscleGroupsArray = video.region ? [video.region] : []
    
    // Convertir muscleCible en array
    const targetedMuscles = metadata.muscleCible
      ? metadata.muscleCible.split(/[,;]/).map(m => m.trim()).filter(m => m)
      : []
    
    // Limiter les champs à 50 caractères
    const intensity = metadata.intensite.substring(0, 50)
    const series = metadata.serie ? metadata.serie.substring(0, 50) : ''
    const constraints = metadata.contreIndication ? metadata.contreIndication.substring(0, 50) : ''
    const theme = metadata.theme ? metadata.theme.substring(0, 50) : ''
    
    // Mettre à jour dans Neon
    await sql`
      UPDATE videos_new
      SET 
        description = ${description},
        "startingPosition" = ${metadata.positionDepart},
        movement = ${metadata.mouvement},
        intensity = ${intensity},
        series = ${series},
        constraints = ${constraints},
        theme = ${theme},
        targeted_muscles = ${targetedMuscles}::text[],
        "muscleGroups" = ${muscleGroupsArray}::text[],
        difficulty = ${difficulty},
        "updatedAt" = NOW()
      WHERE id = ${video.id}
    `
    
    updatedCount++
    
    if (matchType === 'partial') {
      console.log(`✅ [${video.region}] ${video.title}`)
      console.log(`   → Match partiel (${(matchScore * 100).toFixed(0)}%) : ${metadata.title}`)
      console.log(`   → Intensité: ${intensity} → Difficulté: ${difficulty}\n`)
    }
    
    // Log tous les 50
    if (updatedCount % 50 === 0) {
      console.log(`... ${updatedCount} vidéos mises à jour\n`)
    }
  }
  
  console.log(`${'='.repeat(80)}`)
  console.log('📊 RÉSUMÉ DE LA SYNCHRONISATION')
  console.log(`${'='.repeat(80)}`)
  console.log(`✅ Vidéos mises à jour : ${updatedCount}`)
  console.log(`⚠️  Sans métadonnées : ${notFoundCount}`)
  console.log(`⚠️  Intensité manquante : ${skippedCount}`)
  console.log(`${'='.repeat(80)}\n`)
  
  if (notFoundVideos.length > 0 && notFoundVideos.length <= 20) {
    console.log('📋 Vidéos sans métadonnées :\n')
    notFoundVideos.forEach(v => {
      console.log(`- [${v.region}] ${v.title}`)
    })
    console.log()
  } else if (notFoundVideos.length > 20) {
    console.log(`📋 ${notFoundVideos.length} vidéos sans métadonnées (trop pour afficher)\n`)
  }
  
  console.log('✅ Synchronisation terminée!\n')
}

syncNeonWithMetadata()
