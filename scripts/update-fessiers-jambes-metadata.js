/**
 * Script pour mettre à jour les métadonnées des vidéos Fessiers-Jambes dans Neon
 * Lit les métadonnées depuis le fichier metadonnees-completes.md
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

// Lire le fichier de métadonnées
const metadataFile = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-completes.md')
const content = fs.readFileSync(metadataFile, 'utf8')
const lines = content.split('\n')

// Trouver la section fessiers-jambes (commence après "## fessier jambe")
let startIndex = -1
let endIndex = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('## fessier jambe')) {
    startIndex = i
  } else if (startIndex > 0 && lines[i].startsWith('##') && !lines[i].includes('fessier jambe')) {
    endIndex = i
    break
  }
}

if (startIndex === -1) {
  console.error('❌ Section fessiers-jambes non trouvée dans le fichier')
  process.exit(1)
}

if (endIndex === -1) {
  endIndex = lines.length
}

console.log(`📖 Lecture des métadonnées lignes ${startIndex} à ${endIndex}`)

// Parser les métadonnées
const exercises = []
let currentExercise = null
let previousLineEmpty = false

for (let i = startIndex; i < endIndex; i++) {
  const line = lines[i].trim()
  const nextLine = i + 1 < endIndex ? lines[i + 1].trim() : ''
  
  // Nouvelle section d'exercice : ligne non vide après ligne vide, suivie de "Muscle cible" ou ligne vide
  if (line && previousLineEmpty && !line.startsWith('**') && !line.startsWith('---') && !line.startsWith('##') && !line.includes(':')) {
    // Vérifier que la ligne suivante est vide ou contient "Muscle cible"
    if (!nextLine || nextLine.includes('Muscle cible') || nextLine === '') {
      // Si on a déjà un exercice en cours, le sauvegarder
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      // Commencer un nouvel exercice
      currentExercise = {
        title: line,
        targeted_muscles: [],
        startingPosition: '',
        movement: '',
        intensity: '',
        series: '',
        constraints: '',
        theme: ''
      }
    }
  }
  // Muscle cible
  else if (line.includes('Muscle cible') && currentExercise) {
    const match = line.match(/Muscle cible\s*:\s*(.+)/)
    if (match) {
      currentExercise.targeted_muscles = match[1].split(',').map(m => m.trim())
    }
  }
  // Position départ
  else if (line === 'Position départ' || line === 'Position départ :') {
    if (currentExercise) {
      currentExercise._readingPosition = true
      currentExercise._readingMovement = false
    }
  }
  // Mouvement
  else if (line === 'Mouvement' || line === 'Mouvement :' || line === 'Mouvement:') {
    if (currentExercise) {
      currentExercise._readingPosition = false
      currentExercise._readingMovement = true
    }
  }
  // Intensité
  else if (line.includes('Intensité')) {
    if (currentExercise) {
      const match = line.match(/Intensité[.\s:]+(.+)/)
      if (match) {
        currentExercise.intensity = match[1].trim()
      }
      currentExercise._readingPosition = false
      currentExercise._readingMovement = false
    }
  }
  // Série
  else if (line.includes('Série')) {
    if (currentExercise) {
      const match = line.match(/Série\s*:\s*(.+)/)
      if (match) {
        currentExercise.series = match[1].trim()
      }
    }
  }
  // Contre-indication
  else if (line.includes('Contre')) {
    if (currentExercise) {
      const match = line.match(/Contre[^:]*:\s*(.+)/)
      if (match) {
        currentExercise.constraints = match[1].trim()
      }
    }
  }
  // Thème
  else if (line.includes('Thème')) {
    if (currentExercise) {
      const match = line.match(/Thème\s*:\s*(.+)/)
      if (match) {
        currentExercise.theme = match[1].trim()
      }
    }
  }
  // Contenu de position ou mouvement
  else if (line && currentExercise) {
    if (currentExercise._readingPosition) {
      currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + line
    } else if (currentExercise._readingMovement) {
      currentExercise.movement += (currentExercise.movement ? ' ' : '') + line
    }
  }
  
  previousLineEmpty = !line
}

// Ajouter le dernier exercice
if (currentExercise && currentExercise.title) {
  exercises.push(currentExercise)
}

console.log(`\n📋 ${exercises.length} exercices trouvés dans les métadonnées\n`)

// Mapper les intensités vers les difficultés
function mapIntensityToDifficulty(intensity) {
  const lowerIntensity = intensity.toLowerCase()
  if (lowerIntensity.includes('débutant')) return 'debutant'
  if (lowerIntensity.includes('intermédiaire') || lowerIntensity.includes('intermediaire')) return 'intermediaire'
  if (lowerIntensity.includes('avancé')) return 'avance'
  return 'intermediaire' // par défaut
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFC')
    // Retirer les suffixes f, h, F, H à la fin
    .replace(/\s+[fh]$/i, '')
    // Retirer les points et virgules
    .replace(/[.,]/g, '')
}

async function updateFessiersJambesMetadata() {
  console.log('🔄 Mise à jour des métadonnées des vidéos Fessiers-Jambes...\n')
  
  try {
    // Récupérer toutes les vidéos fessiers-jambes
    const allVideos = await sql`
      SELECT id, title
      FROM videos_new
      WHERE region = 'fessiers-jambes'
    `
    
    console.log(`📦 ${allVideos.length} vidéos Fessiers-Jambes trouvées dans la base\n`)
    
    // Créer un map normalisé des exercices
    const normalizedExercises = {}
    exercises.forEach(ex => {
      const normalizedTitle = normalizeTitle(ex.title)
      normalizedExercises[normalizedTitle] = ex
    })
    
    // Créer aussi un map normalisé des vidéos
    const videoMap = new Map()
    allVideos.forEach(video => {
      const normalizedTitle = normalizeTitle(video.title)
      videoMap.set(normalizedTitle, video)
    })
    
    let updatedCount = 0
    let notFoundCount = 0
    const notFound = []

    for (const video of allVideos) {
      const normalizedTitle = normalizeTitle(video.title)
      const metadata = normalizedExercises[normalizedTitle]
      
      if (metadata) {
        const difficulty = mapIntensityToDifficulty(metadata.intensity)
        const description = metadata.startingPosition || `Exercice: ${video.title}`
        
        // Déterminer les groupes musculaires
        const muscleGroups = ['fessiers-jambes']
        
        // Mettre à jour la vidéo avec les métadonnées complètes
        await sql`
          UPDATE videos_new
          SET 
            description = ${description},
            "startingPosition" = ${metadata.startingPosition},
            movement = ${metadata.movement},
            intensity = ${metadata.intensity},
            series = ${metadata.series},
            constraints = ${metadata.constraints},
            theme = ${metadata.theme},
            targeted_muscles = ${metadata.targeted_muscles}::text[],
            "muscleGroups" = ${muscleGroups}::text[],
            difficulty = ${difficulty},
            "updatedAt" = NOW()
          WHERE id = ${video.id}
        `
        
        console.log(`✅ Mis à jour: ${video.title}`)
        updatedCount++
      } else {
        console.log(`⚠️  Pas de métadonnées pour: ${video.title}`)
        notFound.push(video.title)
        notFoundCount++
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⚠️  Sans métadonnées: ${notFoundCount}`)
    
    if (notFound.length > 0 && notFound.length <= 20) {
      console.log(`\n⚠️  Vidéos sans métadonnées:`)
      notFound.forEach(title => console.log(`   - ${title}`))
    }
    
    console.log(`\n✅ Mise à jour terminée!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

updateFessiersJambesMetadata()
