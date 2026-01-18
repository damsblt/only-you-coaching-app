/**
 * Script amélioré pour mettre à jour les métadonnées des vidéos Fessiers-Jambes depuis le fichier Word
 * Avec normalisation avancée pour matcher plus de variations
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
    .normalize('NFC')
    // Retirer les suffixes f, h, F, H à la fin (avec ou sans espaces)
    .replace(/\s*[fh]\s*$/i, '')
    // Retirer les points de début (numérotation)
    .replace(/^\d+(\.\d+)?\.?\s*/, '')
    // Normaliser les espaces multiples
    .replace(/\s+/g, ' ')
    // Retirer les points et virgules
    .replace(/[.,]/g, '')
    // Normaliser les variations communes
    .replace(/\bsur le\b/g, 'sur')
    .replace(/\bsur la\b/g, 'sur')
    .replace(/\bsur les\b/g, 'sur')
    .replace(/\bavec haltères?\b/g, 'avec haltere')
    .replace(/\bavec haltère\b/g, 'avec haltere')
    .replace(/\bhaltèe\b/g, 'haltere')
    .replace(/\bavec barre\b/g, 'avec barre')
    .replace(/\bbosu souple\b/g, 'bosu')
    .replace(/\bbosu dure?\b/g, 'bosu')
    .replace(/\bface souple\b/g, '')
    .replace(/\bface dure?\b/g, '')
    .replace(/\b2 pieds?\b/g, 'pieds')
    .replace(/\b1 pieds?\b/g, 'pied')
    .replace(/\bun pieds?\b/g, 'pied')
    .replace(/\bdeux pieds?\b/g, 'pieds')
    .replace(/\bune jambe\b/g, 'jambe')
    .replace(/\bdeux jambes?\b/g, 'jambes')
    .replace(/\bles deux jambes?\b/g, 'jambes')
    .replace(/\bketter bell\b/g, 'kettlebell')
    .replace(/\bkettrer bell\b/g, 'kettlebell')
    .replace(/\bélastique\b/g, 'elastique')
    .replace(/\bgenoux fléchit\b/g, 'genoux flechit')
    .replace(/\bfléchit\b/g, 'flechit')
    .replace(/\bpieds?\s+arrière\b/g, 'pied arriere')
    .replace(/\bpieds?\s+avant\b/g, 'pied avant')
    .replace(/\bdépart\b/g, 'depart')
    .replace(/\bdv\b/g, 'developpe')
    .replace(/\bcoucher\b/g, 'couche')
    .replace(/\bcouché\b/g, 'couche')
    .replace(/\bflow tonic\b/g, 'flowtonic')
    .replace(/\bstep up\b/g, 'stepup')
    .replace(/\bdead lift\b/g, 'deadlift')
    .replace(/\bleg curl\b/g, 'legcurl')
    .replace(/\bmedecin ball\b/g, 'medecinball')
    .replace(/\bmédecin ball\b/g, 'medecinball')
    .replace(/\bbiceps curl\b/g, 'bicepscurl')
    .replace(/\bentre jambe\b/g, 'entre jambes')
    .replace(/\bentre les jambe\b/g, 'entre jambes')
    .replace(/\bpoid du corps\b/g, 'poids du corps')
    .replace(/\btouché\b/g, 'toucher')
    .replace(/\btoucher bosu\b/g, 'toucher bosu')
    .replace(/\balternés\b/g, 'alternes')
    .replace(/\bexplovif\b/g, 'explosif')
    .replace(/\bavançé\b/g, 'avance')
    .replace(/\barménian\b/g, 'romanian')
    .replace(/\bgenoux\b/g, 'genou')
    .replace(/\bà quatre pattes\b/g, 'quatre pattes')
    .replace(/\bà genoux\b/g, 'genou')
    .replace(/\bcolonne\b/g, 'colonne')
    .replace(/\bskating\b/g, 'skating')
    .replace(/\bswing\b/g, 'swing')
    .replace(/\bv step\b/g, 'vstep')
    .replace(/\bsumo\b/g, 'sumo')
    .replace(/\bdisque\b/g, 'disque')
    .replace(/\bdisques\b/g, 'disque')
    .replace(/\bcontre le mur\b/g, 'mur')
    .replace(/\bau mur\b/g, 'mur')
    .replace(/\bballon\b/g, 'ballon')
    .replace(/\bbande\b/g, 'bande')
    .replace(/\btrx\b/g, 'trx')
    .replace(/\bbanc\b/g, 'banc')
    .replace(/\bstep\b/g, 'step')
    .replace(/\btapis airex\b/g, 'airex')
    .replace(/\bcheville\b/g, 'cheville')
    .replace(/\bstatique\b/g, 'statique')
    .replace(/\bdéport de poids\b/g, 'deport poids')
    .replace(/\brotation\b/g, 'rotation')
    .replace(/\bmaintient\b/g, 'maintien')
    .replace(/\bsans maintient\b/g, 'sans maintien')
    .replace(/\bavec maintient\b/g, 'avec maintien')
    .replace(/\babduction\b/g, 'abduction')
    .replace(/\badduction\b/g, 'adduction')
    .replace(/\bextension\b/g, 'extension')
    .replace(/\brelevé de bassin\b/g, 'releve bassin')
    .replace(/\bsoulevé de terre\b/g, 'souleve terre')
    .replace(/\bflament\b/g, 'flamant')
    .replace(/\bischio\b/g, 'ischio')
    .replace(/\bpistol\b/g, 'pistol')
    .replace(/\btrust\b/g, 'thrust')
    .replace(/\browning\b/g, 'rowing')
    .replace(/\bpoulie basse\b/g, 'poulie')
    .replace(/\blibre\b/g, 'libre')
    .replace(/\bnuque\b/g, 'nuque')
    .replace(/\bbou\b/g, 'bosu')
    .trim()
}

function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'intermediaire'
  const lowerIntensity = intensity.toLowerCase()
  if (lowerIntensity.includes('débutant')) return 'debutant'
  if (lowerIntensity.includes('intermédiaire') || lowerIntensity.includes('intermediaire')) return 'intermediaire'
  if (lowerIntensity.includes('avancé') || lowerIntensity.includes('avance')) return 'avance'
  return 'intermediaire' // par défaut
}

// Fonction pour calculer la similarité entre deux chaînes
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(s1, s2) {
  const costs = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
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
      const normalizedVideoTitle = normalizeTitle(video.title)
      let metadata = normalizedExercises[normalizedVideoTitle]
      let matchType = 'exact'
      
      // Si pas de match exact, chercher par similarité
      if (!metadata) {
        let bestMatch = null
        let bestScore = 0
        
        for (const [exerciseTitle, exerciseData] of Object.entries(normalizedExercises)) {
          // Essayer une correspondance partielle d'abord
          if (normalizedVideoTitle.includes(exerciseTitle) || exerciseTitle.includes(normalizedVideoTitle)) {
            const score = similarity(normalizedVideoTitle, exerciseTitle)
            if (score > bestScore) {
              bestScore = score
              bestMatch = exerciseData
            }
          }
        }
        
        // Si on a trouvé un match avec au moins 70% de similarité
        if (bestMatch && bestScore >= 0.7) {
          metadata = bestMatch
          matchType = `similarity ${(bestScore * 100).toFixed(0)}%`
        }
      }
      
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
        
        if (matchType === 'exact') {
          console.log(`✅ Mis à jour: ${video.title}`)
        } else {
          console.log(`✅ Mis à jour (${matchType}): ${video.title} → ${metadata.title}`)
        }
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
