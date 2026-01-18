/**
 * Script pour mettre à jour les métadonnées depuis le fichier metadonnees-completes.md
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

// Lire le fichier complet de métadonnées
const mdPath = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-completes.md')

function parseCompleteMetadata(content) {
  const exercises = []
  const lines = content.split('\n')
  
  let currentExercise = null
  let readingSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Chercher "Muscle cible" dans les 3 prochaines lignes pour détecter un titre
    let isMuscleTargetComing = false
    for (let j = i + 1; j < i + 4 && j < lines.length; j++) {
      if (lines[j].trim().startsWith('Muscle cible')) {
        isMuscleTargetComing = true
        break
      }
    }
    
    // Nouveau titre : ligne non vide suivie de "Muscle cible" dans les 3 prochaines lignes
    if (line && isMuscleTargetComing && !line.startsWith('Muscle') && !line.startsWith('Position') && !line.startsWith('Mouvement') && !line.startsWith('Intensité') && !line.startsWith('Série') && !line.startsWith('Contre') && !line.startsWith('Thème')) {
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      currentExercise = {
        title: line.replace(/^\d+(\.\d+)?\.?\s*/, '').trim(),
        targeted_muscles: [],
        startingPosition: '',
        movement: '',
        intensity: '',
        series: '',
        constraints: '',
        theme: ''
      }
      readingSection = null
    }
    // Muscle cible
    else if (line.startsWith('Muscle cible') && currentExercise) {
      const match = line.match(/Muscle cible\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.targeted_muscles = match[1]
          .split(/[,;]/)
          .map(m => m.trim())
          .filter(m => m)
      }
      readingSection = null
    }
    // Position départ
    else if (line.match(/^Position départ\s*:?\s*$/i) && currentExercise) {
      readingSection = 'position'
      currentExercise.startingPosition = ''
    }
    // Mouvement
    else if (line.match(/^Mouvement\s*:?\s*$/i) && currentExercise) {
      readingSection = 'movement'
      currentExercise.movement = ''
    }
    // Intensité
    else if (line.match(/^Intensité/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Intensité[.\s:]*(.+)/i)
      if (match) {
        currentExercise.intensity = match[1].trim()
      }
    }
    // Série
    else if (line.match(/^Série/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Série\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.series = match[1].trim()
      }
    }
    // Contre-indication
    else if (line.match(/^Contre/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Contre[^:]*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.constraints = match[1].trim()
      }
    }
    // Thème
    else if (line.match(/^Thème/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Thème\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.theme = match[1].trim()
      }
    }
    // Contenu
    else if (line && currentExercise && readingSection) {
      if (!line.match(/^(Position|Mouvement|Intensité|Série|Contre|Thème)/i)) {
        if (readingSection === 'position') {
          currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + line
        } else if (readingSection === 'movement') {
          currentExercise.movement += (currentExercise.movement ? ' ' : '') + line
        }
      }
    }
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}

function normalizeTitle(title) {
  let normalized = title
    .toLowerCase()
    .trim()
    .normalize('NFC')
    .replace(/\s*[fh]\s*$/i, '')
    .replace(/^\d+(\.\d+)?\.?\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/[.,;]\s*$/g, '')
    .trim()
  
  const replacements = {
    'poid du corps': 'poids du corps',
    'ketter bell': 'kettlebell',
    'médecin ball': 'medecinball',
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
    'a refaire': '',
    'a corriger le nom': '',
    'changer la video': '',
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

function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'intermediaire'
  const lowerIntensity = intensity.toLowerCase()
  if (lowerIntensity.includes('débutant') || lowerIntensity.includes('niveau 1')) return 'debutant'
  if (lowerIntensity.includes('tout niveau')) return 'intermediaire'
  if (lowerIntensity.includes('avancé') || lowerIntensity.includes('avance') || lowerIntensity.includes('niveau 2') || lowerIntensity.includes('niveau 3')) return 'avance'
  return 'intermediaire'
}

async function main() {
  console.log('\n🚀 Lecture du fichier de métadonnées complet...\n')
  
  const content = fs.readFileSync(mdPath, 'utf-8')
  const exercises = parseCompleteMetadata(content)
  
  console.log(`📋 ${exercises.length} exercices extraits\n`)
  
  // Créer un map normalisé
  const normalizedExercises = new Map()
  exercises.forEach(ex => {
    const normalizedTitle = normalizeTitle(ex.title)
    normalizedExercises.set(normalizedTitle, ex)
  })
  
  // Récupérer toutes les vidéos
  const allVideos = await sql`
    SELECT id, title, region
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    ORDER BY region, exo_title, title
  `
  
  console.log(`📹 ${allVideos.length} vidéos à mettre à jour\n`)
  console.log('🔄 Début de la mise à jour...\n')
  
  let updatedCount = 0
  let notFoundCount = 0
  
  for (const video of allVideos) {
    const normalizedVideoTitle = normalizeTitle(video.title)
    let metadata = normalizedExercises.get(normalizedVideoTitle)
    let matchType = 'exact'
    
    // Si pas de match exact, chercher partiel
    if (!metadata) {
      for (const [exerciseTitle, exerciseData] of normalizedExercises.entries()) {
        const videoWords = normalizedVideoTitle.split(' ').filter(w => w.length > 2)
        const exerciseWords = exerciseTitle.split(' ').filter(w => w.length > 2)
        
        const commonWords = videoWords.filter(w => exerciseWords.includes(w))
        const matchRatio = commonWords.length / Math.max(videoWords.length, exerciseWords.length)
        
        if (matchRatio >= 0.6) {
          metadata = exerciseData
          matchType = `partial ${(matchRatio * 100).toFixed(0)}%`
          break
        }
      }
    }
    
    if (metadata) {
      const difficulty = mapIntensityToDifficulty(metadata.intensity)
      const description = metadata.startingPosition || `Exercice: ${video.title}`
      const muscleGroupsArray = [video.region]
      
      // Tronquer les champs à 50 caractères si nécessaire
      const intensity = metadata.intensity ? metadata.intensity.substring(0, 50) : ''
      const series = metadata.series ? metadata.series.substring(0, 50) : ''
      const constraints = metadata.constraints ? metadata.constraints.substring(0, 50) : ''
      const theme = metadata.theme ? metadata.theme.substring(0, 50) : ''
      
      await sql`
        UPDATE videos_new
        SET 
          description = ${description},
          "startingPosition" = ${metadata.startingPosition},
          movement = ${metadata.movement},
          intensity = ${intensity},
          series = ${series},
          constraints = ${constraints},
          theme = ${theme},
          targeted_muscles = ${metadata.targeted_muscles}::text[],
          "muscleGroups" = ${muscleGroupsArray}::text[],
          difficulty = ${difficulty},
          "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      
      if (updatedCount % 20 === 0) {
        console.log(`✅ ${updatedCount} vidéos mises à jour...`)
      }
      updatedCount++
    } else {
      notFoundCount++
    }
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Vidéos mises à jour: ${updatedCount}`)
  console.log(`⚠️  Sans métadonnées: ${notFoundCount}`)
  console.log(`${'='.repeat(60)}\n`)
  
  console.log('✅ Mise à jour terminée!\n')
}

main()
