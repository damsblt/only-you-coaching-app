/**
 * Script pour mettre à jour des vidéos spécifiques par ID
 * Les titres ont été adaptés sur Neon, donc le matching devrait être plus facile
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

// IDs des vidéos à mettre à jour
const videoIds = [
  '49042279-5046-49e1-a15c-ca6bb9a8c7b0', // Fente avancé
  'a1debdae-93a5-431f-a217-1a4fb0e60a2c', // Fente avant alternés 1 temps
  'f7f6f85f-a113-4dc1-abcd-5e4f7786ea2a', // Squat biceps
  '9c2d7b2a-a1aa-48de-8d8b-585a70b734ab'  // Trust poids du corps avec élastique bande et haltère
]

// Chemin vers le fichier Word
const wordFile = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées/fessier jambe.docx')

async function extractMetadataFromWord() {
  console.log('📖 Lecture du fichier Word...\n')
  
  try {
    const result = await mammoth.extractRawText({ path: wordFile })
    const text = result.value
    
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
        if (currentExercise && currentExercise.title) {
          exercises.push(currentExercise)
        }
        
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
    'avancé': 'avance',
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
    'déconseillé pour les personnes ayant des problèmes de genoux': '',
    'trust': 'thrust',
    'squat biceps': 'squat biceps curl',
    'biceps': 'biceps curl'
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
  if (lowerIntensity.includes('débutant')) return 'debutant'
  if (lowerIntensity.includes('intermédiaire') || lowerIntensity.includes('intermediaire')) return 'intermediaire'
  if (lowerIntensity.includes('avancé') || lowerIntensity.includes('avance')) return 'avance'
  return 'intermediaire'
}

// Mapping manuel pour les cas spécifiques
const manualMappings = {
  'fente avancé': 'Fente avancé',
  'fente avant alternés 1 temps': 'Fente avant alterné sur 1 temps',
  'fente avant alterné 1 temps': 'Fente avant alterné sur 1 temps',
  'squat biceps': 'Squat + biceps curl',
  'trust poids du corps avec élastique bande et haltère': 'Trust poids du corps avec élastique bande et haltère'
}

async function updateVideosById(exercises) {
  console.log('\n🔄 Mise à jour des vidéos par ID...\n')
  
  try {
    // Créer un map normalisé des exercices
    const normalizedExercises = new Map()
    exercises.forEach(ex => {
      const normalizedTitle = normalizeTitle(ex.title)
      normalizedExercises.set(normalizedTitle, ex)
      // Ajouter aussi le titre original
      normalizedExercises.set(normalizeTitle(ex.title), ex)
    })
    
    let updatedCount = 0
    let notFoundCount = 0

    for (const videoId of videoIds) {
      // Récupérer la vidéo
      const videos = await sql`
        SELECT id, title
        FROM videos_new
        WHERE id = ${videoId}
      `
      
      if (videos.length === 0) {
        console.log(`⚠️  Vidéo non trouvée: ${videoId}`)
        notFoundCount++
        continue
      }
      
      const video = videos[0]
      console.log(`\n📹 Vidéo: ${video.title}`)
      
      const normalizedVideoTitle = normalizeTitle(video.title)
      let metadata = normalizedExercises.get(normalizedVideoTitle)
      let matchType = 'exact'
      
      // Si pas de match exact, essayer le mapping manuel
      if (!metadata) {
        const manualMatch = manualMappings[normalizedVideoTitle]
        if (manualMatch) {
          const manualNormalized = normalizeTitle(manualMatch)
          metadata = normalizedExercises.get(manualNormalized)
          if (metadata) {
            matchType = 'manual mapping'
          }
        }
      }
      
      // Si toujours pas de match, chercher une correspondance partielle
      if (!metadata) {
        for (const [exerciseTitle, exerciseData] of normalizedExercises.entries()) {
          const videoWords = normalizedVideoTitle.split(' ').filter(w => w.length > 2)
          const exerciseWords = exerciseTitle.split(' ').filter(w => w.length > 2)
          
          const commonWords = videoWords.filter(w => exerciseWords.includes(w))
          const matchRatio = commonWords.length / Math.max(videoWords.length, exerciseWords.length)
          
          if (matchRatio >= 0.5) {
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
        
        console.log(`   ✅ Mis à jour (${matchType}): ${metadata.title}`)
        updatedCount++
      } else {
        console.log(`   ⚠️  Pas de métadonnées trouvées`)
        notFoundCount++
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⚠️  Sans métadonnées: ${notFoundCount}`)
    console.log(`\n✅ Mise à jour terminée!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

async function main() {
  try {
    const exercises = await extractMetadataFromWord()
    await updateVideosById(exercises)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()
