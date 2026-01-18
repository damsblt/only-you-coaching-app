/**
 * Script final pour mettre à jour les métadonnées des vidéos Fessiers-Jambes
 * Avec normalisation optimale et mapping manuel des cas difficiles
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const mammoth = require('mammoth')
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
    
    return exercises
    
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier Word:', error)
    throw error
  }
}

function normalizeTitle(title) {
  let normalized = title
    .toLowerCase()
    .trim()
    .normalize('NFC')
    // Retirer les suffixes f, h, F, H à la fin
    .replace(/\s*[fh]\s*$/i, '')
    // Retirer les points de début (numérotation)
    .replace(/^\d+(\.\d+)?\.?\s*/, '')
    // Normaliser les espaces multiples
    .replace(/\s+/g, ' ')
    // Retirer les points et virgules finaux
    .replace(/[.,;]\s*$/g, '')
    .trim()
  
  // Normaliser les variations spécifiques
  const replacements = {
    'poid du corps': 'poids du corps',
    'avec poids du corps': 'poids du corps',
    'ketter bell': 'kettlebell',
    'kettrer bell': 'kettlebell',
    'médecin ball': 'medecinball',
    'medecin ball': 'medecinball',
    'haltèe': 'haltere',
    'avec haltères': 'avec haltere',
    'avec haltère': 'avec haltere',
    '+ haltères': '+ haltere',
    '+ haltère': '+ haltere',
    'fléchit': 'flechit',
    'fléchis': 'flechis',
    'coucher': 'couche',
    'couché': 'couche',
    'touché': 'toucher',
    'alternés': 'alternes',
    'alterné': 'alterne',
    'explovif': 'explosif',
    'avançé': 'avance',
    'arménian': 'armenian',
    'romanian': 'armenian',
    'dv': 'developpe',
    'dead lift': 'deadlift',
    'leg curl': 'legcurl',
    'step up': 'stepup',
    'flow tonic': 'flowtonic',
    'biceps curl': 'bicepscurl',
    'v step': 'vstep',
    'entre les jambes': 'entre jambes',
    'entre jambe': 'entre jambes',
    'sur 2 bosu': '2 bosu',
    'sur le bosu': 'bosu',
    'sur bosu': 'bosu',
    'sur le step': 'step',
    'sur step': 'step',
    'sur le banc': 'banc',
    'sur banc': 'banc',
    'sur le ballon': 'ballon',
    'sur ballon': 'ballon',
    'sur disque': 'disque',
    'sur disques': 'disque',
    'au mur': 'mur',
    'contre le mur': 'mur',
    'avec ballon': 'ballon',
    'avec ballon au mur': 'ballon mur',
    'ballon au mur': 'ballon mur',
    'ballon de face au mur': 'ballon face mur',
    'de face avec ballon au mur': 'face ballon mur',
    'avec élastique bande': 'elastique bande',
    'et élastique bande': 'elastique bande',
    'avec élastique': 'elastique',
    'avec main trx': 'main trx',
    'main trx': 'mains trx',
    'mains trx': 'main trx',
    'pieds trx': 'pied trx',
    'avec genoux fléchit': 'genou flechit',
    'genoux fléchit': 'genou flechit',
    'genoux fléchis': 'genou flechis',
    'à quatre pattes': 'quatre pattes',
    'à genoux': 'genou',
    'au sol': 'sol',
    'en appui': 'appui',
    'avec maintien': 'maintien',
    'sans maintien': 'sans maintien',
    'avec maintient': 'maintien',
    'sans maintient': 'sans maintien',
    'avec les deux jambes': 'deux jambes',
    'les deux jambes': 'deux jambes',
    'avec deux jambes': 'deux jambes',
    'une jambe': '1 jambe',
    'sur une jambe': '1 jambe',
    'sur 1 jambe': '1 jambe',
    '2 pieds': 'pieds',
    'deux pieds': 'pieds',
    '1 pied': 'pied',
    'un pied': 'pied',
    'un pieds': 'pied',
    '1 pieds': 'pied',
    'cheville flament': 'flament',
    'flament pied': 'flament',
    'flament i pied': 'flament',
    'tapis airex': 'airex',
    'face souple': 'souple',
    'face dure': 'dure',
    'bosu souple': 'bosu',
    'bosu dure': 'bosu',
    'bosu face souple': 'bosu souple',
    'bosu face dure': 'bosu dure',
    'pied avant': 'avant',
    'pied arrière': 'arriere',
    'pieds avant': 'avant',
    'pieds arrière': 'arriere',
    'sumo squat': 'squat sumo',
    'rowing poulie basse': 'rowing poulie',
    'barre libre': 'barre',
    'a refaire': '',
    'déconseillé pour les personnes ayant des problèmes de genoux': ''
  }
  
  // Appliquer les remplacements
  for (const [from, to] of Object.entries(replacements)) {
    // Échapper les caractères spéciaux de regex
    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    normalized = normalized.replace(new RegExp(escapedFrom, 'g'), to)
  }
  
  // Nettoyer les espaces multiples et trim
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'intermediaire'
  const lowerIntensity = intensity.toLowerCase()
  if (lowerIntensity.includes('débutant')) return 'debutant'
  if (lowerIntensity.includes('intermédiaire') || lowerIntensity.includes('intermediaire')) return 'intermediaire'
  if (lowerIntensity.includes('avancé') || lowerIntensity.includes('avance')) return 'avance'
  return 'intermediaire'
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
    const normalizedExercises = new Map()
    exercises.forEach(ex => {
      const normalizedTitle = normalizeTitle(ex.title)
      normalizedExercises.set(normalizedTitle, ex)
    })
    
    let updatedCount = 0
    let notFoundCount = 0
    const notFound = []

    for (const video of allVideos) {
      const normalizedVideoTitle = normalizeTitle(video.title)
      let metadata = normalizedExercises.get(normalizedVideoTitle)
      let matchType = 'exact'
      
      // Si pas de match exact, chercher une correspondance partielle
      if (!metadata) {
        for (const [exerciseTitle, exerciseData] of normalizedExercises.entries()) {
          // Vérifier si les mots clés principaux correspondent
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
