/**
 * Script pour mettre à jour les métadonnées des vidéos Fessiers-Jambes depuis le fichier Word
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const mammoth = require('mammoth')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

// Chemin vers le fichier Word
const wordFile = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/fessier jambe.docx')

async function extractMetadataFromWord() {
  console.log('📖 Lecture du fichier Word...\n')
  
  try {
    const result = await mammoth.extractRawText({ path: wordFile })
    const text = result.value
    
    console.log(`📄 Fichier lu: ${text.length} caractères\n`)
    
    // Parser les exercices
    const exercises = []
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)
    
    let currentExercise = null
    let readingSection = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
      
      // Nouveau titre d'exercice : ligne suivie de "Muscle cible"
      if (line && nextLine.includes('Muscle cible')) {
        // Sauvegarder l'exercice précédent
        if (currentExercise && currentExercise.title) {
          exercises.push(currentExercise)
        }
        
        // Nouvel exercice
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
        readingSection = null
      }
      // Muscle cible
      else if (line.includes('Muscle cible') && currentExercise) {
        const match = line.match(/Muscle cible\s*[:\-]?\s*(.+)/i)
        if (match) {
          currentExercise.targeted_muscles = match[1].split(/[,;]/).map(m => m.trim()).filter(m => m)
        }
        readingSection = null
      }
      // Position départ (avec ou sans ":")
      else if (line.match(/^Position départ\s*:?\s*$/i) && currentExercise) {
        readingSection = 'position'
        currentExercise.startingPosition = ''
      }
      // Mouvement (avec ou sans ":")
      else if (line.match(/^Mouvement\s*:?\s*$/i) && currentExercise) {
        readingSection = 'movement'
        currentExercise.movement = ''
      }
      // Intensité (arrête la lecture de section)
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
      // Contenu de position ou mouvement
      else if (line && currentExercise && readingSection) {
        // Ne pas ajouter les lignes qui sont des marqueurs de section
        if (!line.match(/^(Position|Mouvement|Intensité|Série|Contre|Thème)/i)) {
          if (readingSection === 'position') {
            currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + line
          } else if (readingSection === 'movement') {
            currentExercise.movement += (currentExercise.movement ? ' ' : '') + line
          }
        }
      }
    }
    
    // Ajouter le dernier exercice
    if (currentExercise && currentExercise.title) {
      exercises.push(currentExercise)
    }
    
    console.log(`📋 ${exercises.length} exercices extraits du fichier Word\n`)
    
    // Afficher quelques exemples
    console.log('Exemples d\'exercices extraits:')
    exercises.slice(0, 5).forEach((ex, i) => {
      console.log(`\n${i + 1}. ${ex.title}`)
      console.log(`   Muscles: ${ex.targeted_muscles.join(', ')}`)
      console.log(`   Position: ${ex.startingPosition.substring(0, 60)}...`)
    })
    
    return exercises
    
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier Word:', error)
    throw error
  }
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
    // Normaliser les variations
    .replace(/sur le/g, 'sur')
    .replace(/sur la/g, 'sur')
    .replace(/avec haltère/g, 'avec haltère')
    .replace(/avec barre/g, 'avec barre')
}

function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'intermediaire'
  const lowerIntensity = intensity.toLowerCase()
  if (lowerIntensity.includes('débutant')) return 'debutant'
  if (lowerIntensity.includes('intermédiaire') || lowerIntensity.includes('intermediaire')) return 'intermediaire'
  if (lowerIntensity.includes('avancé') || lowerIntensity.includes('avance')) return 'avance'
  return 'intermediaire' // par défaut
}

async function updateVideosWithMetadata(exercises) {
  console.log('\n🔄 Mise à jour des métadonnées des vidéos...\n')
  
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
    
    let updatedCount = 0
    let notFoundCount = 0
    const notFound = []

    for (const video of allVideos) {
      const normalizedTitle = normalizeTitle(video.title)
      const metadata = normalizedExercises[normalizedTitle]
      
      if (metadata) {
        const difficulty = mapIntensityToDifficulty(metadata.intensity)
        const description = metadata.startingPosition || `Exercice: ${video.title}`
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
        // Essayer une recherche partielle
        const partialMatch = Object.keys(normalizedExercises).find(key => 
          normalizedTitle.includes(key.substring(0, 20)) || key.includes(normalizedTitle.substring(0, 20))
        )
        
        if (partialMatch) {
          const metadata = normalizedExercises[partialMatch]
          const difficulty = mapIntensityToDifficulty(metadata.intensity)
          const description = metadata.startingPosition || `Exercice: ${video.title}`
          const muscleGroups = ['fessiers-jambes']
          
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
          
          console.log(`✅ Mis à jour (match partiel): ${video.title} → ${metadata.title}`)
          updatedCount++
        } else {
          console.log(`⚠️  Pas de métadonnées pour: ${video.title}`)
          notFound.push(video.title)
          notFoundCount++
        }
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⚠️  Sans métadonnées: ${notFoundCount}`)
    
    if (notFound.length > 0 && notFound.length <= 30) {
      console.log(`\n⚠️  Vidéos sans métadonnées:`)
      notFound.forEach(title => console.log(`   - ${title}`))
    }
    
    console.log(`\n✅ Mise à jour terminée!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

async function main() {
  try {
    const exercises = await extractMetadataFromWord()
    await updateVideosWithMetadata(exercises)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()
