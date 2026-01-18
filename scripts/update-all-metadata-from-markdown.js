/**
 * Script universel pour mettre à jour les métadonnées de toutes les vidéos depuis les fichiers Markdown
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

// Configuration des régions et fichiers Markdown
const muscleGroups = [
  { region: 'dos', mdFile: 'dos.md', displayName: 'Dos' },
  { region: 'pectoraux', mdFile: 'pectoraux.md', displayName: 'Pectoraux' },
  { region: 'abdos', mdFile: 'abdominaux-complet.md', displayName: 'Abdos' },
  { region: 'biceps', mdFile: 'biceps.md', displayName: 'Biceps' },
  { region: 'triceps', mdFile: 'triceps.md', displayName: 'Triceps' },
  { region: 'epaules', mdFile: 'epaule.md', displayName: 'Épaules' },
  { region: 'streching', mdFile: 'genou.md', displayName: 'Stretching' },
  { region: 'cardio', mdFile: 'cardio.md', displayName: 'Cardio' },
  { region: 'bande', mdFile: 'bande.md', displayName: 'Bande' }
]

function parseMarkdownMetadata(content) {
  const exercises = []
  const lines = content.split('\n').map(l => l.trim()).filter(l => l)
  
  let currentExercise = null
  let readingSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
    
    // Nouveau titre : ligne suivie de "Muscle cible" ou "Muscles ciblés"
    if (line && (nextLine.includes('Muscle cible') || nextLine.includes('Muscles ciblés'))) {
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      currentExercise = {
        title: line.replace(/^#+\s*/, '').replace(/^\d+(\.\d+)?\.?\s*/, '').trim(),
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
    else if ((line.includes('Muscle cible') || line.includes('Muscles ciblés')) && currentExercise) {
      const match = line.match(/Muscles? ciblés?\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.targeted_muscles = match[1]
          .split(/[,;]/)
          .map(m => m.trim().replace(/^\*\*|\*\*$/g, ''))
          .filter(m => m)
      }
      readingSection = null
    }
    // Position départ
    else if (line.match(/^#+?\s*Position départ\s*:?\s*$/i) && currentExercise) {
      readingSection = 'position'
      currentExercise.startingPosition = ''
    }
    else if (line.match(/^Position départ\s*:?\s*$/i) && currentExercise) {
      readingSection = 'position'
      currentExercise.startingPosition = ''
    }
    // Mouvement
    else if (line.match(/^#+?\s*Mouvement\s*:?\s*$/i) && currentExercise) {
      readingSection = 'movement'
      currentExercise.movement = ''
    }
    else if (line.match(/^Mouvement\s*:?\s*$/i) && currentExercise) {
      readingSection = 'movement'
      currentExercise.movement = ''
    }
    // Intensité
    else if (line.match(/^#+?\s*Intensité/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Intensité[.\s:]*(.+)/i)
      if (match) {
        currentExercise.intensity = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    else if (line.match(/^Intensité/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Intensité[.\s:]*(.+)/i)
      if (match) {
        currentExercise.intensity = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    // Série
    else if (line.match(/^#+?\s*Série/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Série\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.series = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    else if (line.match(/^Série/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Série\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.series = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    // Contre-indication
    else if (line.match(/^#+?\s*Contre/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Contre[^:]*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.constraints = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    else if (line.match(/^Contre/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Contre[^:]*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.constraints = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    // Thème
    else if (line.match(/^#+?\s*Thème/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Thème\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.theme = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    else if (line.match(/^Thème/i) && currentExercise) {
      readingSection = null
      const match = line.match(/Thème\s*[:\-]?\s*(.+)/i)
      if (match) {
        currentExercise.theme = match[1].trim().replace(/^\*\*|\*\*$/g, '')
      }
    }
    // Contenu
    else if (line && currentExercise && readingSection) {
      if (!line.match(/^#+?\s*(Position|Mouvement|Intensité|Série|Contre|Thème)/i)) {
        const cleanedLine = line.replace(/^\*\*|\*\*$/g, '').trim()
        if (cleanedLine) {
          if (readingSection === 'position') {
            currentExercise.startingPosition += (currentExercise.startingPosition ? ' ' : '') + cleanedLine
          } else if (readingSection === 'movement') {
            currentExercise.movement += (currentExercise.movement ? ' ' : '') + cleanedLine
          }
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
    'kettrer bell': 'kettlebell',
    'médecin ball': 'medecinball',
    'medecin ball': 'medecinball',
    'haltèe': 'haltere',
    'avec haltères': 'avec haltere',
    'avec haltère': 'avec haltere',
    '\\+ haltères': '+ haltere',
    '\\+ haltère': '+ haltere',
    'fléchit': 'flechit',
    'fléchis': 'flechis',
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
    'sur les disque': 'disque',
    'au mur': 'mur',
    'contre le mur': 'mur',
    'contre mur': 'mur',
    'avec ballon': 'ballon',
    'avec ballon au mur': 'ballon mur',
    'ballon au mur': 'ballon mur',
    'ballon de face au mur': 'ballon face mur',
    'de face avec ballon au mur': 'face ballon mur',
    'avec élastique bande': 'elastique bande',
    'et élastique bande': 'elastique bande',
    'avec élastique': 'elastique',
    'avec élasique': 'elastique',
    '\\+ élastique': '+ elastique',
    '\\+ élasique': '+ elastique',
    '\\+ élatique': '+ elastique',
    'avec main trx': 'main trx',
    'main trx': 'mains trx',
    'mains trx': 'main trx',
    'pieds trx': 'pied trx',
    'avec genoux fléchit': 'genou flechit',
    'genoux fléchit': 'genou flechit',
    'genoux fléchis': 'genou flechis',
    'à quatre pattes': 'quatre pattes',
    'à quattre pattes': 'quatre pattes',
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
    'barre guidée': 'barre',
    'a refaire': '',
    'a corriger le nom': '',
    'changer la video': '',
    'déconseillé pour les personnes ayant des problèmes de genoux': '',
    'trust': 'thrust',
    'dipds': 'dips',
    'cruch': 'crunch',
    'reeverse': 'reverse',
    'gainag': 'gainage',
    'gainge': 'gainage',
    'spoas': 'psoas',
    'elevation': 'elévation',
    'elévation': 'elevation',
    'flament': 'flamant',
    'à croupie': 'croupi',
    'extention': 'extension',
    'pont épaulé': 'pont epaule',
    'assis (de face)': 'assis',
    'assis (de profil)': 'assis',
    'jack nife': 'jacknife',
    'poulies hautes': 'poulie haute',
    'poulies milieu': 'poulie milieu',
    'poulie basse et corde': 'poulie basse corde',
    'poulie haute et barre': 'poulie haute barre',
    'poulie haute et corde': 'poulie haute corde',
    'avec haltère dos': 'haltere'
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
  if (lowerIntensity.includes('intermédiaire') || lowerIntensity.includes('intermediaire') || lowerIntensity.includes('tout niveau')) return 'intermediaire'
  if (lowerIntensity.includes('avancé') || lowerIntensity.includes('avance') || lowerIntensity.includes('niveau 2') || lowerIntensity.includes('niveau 3')) return 'avance'
  return 'intermediaire'
}

async function updateMetadataForRegion(groupInfo) {
  const { region, mdFile, displayName } = groupInfo
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📝 Mise à jour métadonnées: ${displayName} (${region})`)
  console.log(`${'='.repeat(60)}\n`)
  
  try {
    // Lire le fichier Markdown
    const mdPath = path.join(__dirname, '../Dossier Cliente/Video/groupes-musculaires/01-métadonnées', mdFile)
    
    if (!fs.existsSync(mdPath)) {
      console.log(`⚠️  Fichier Markdown non trouvé: ${mdFile}`)
      return { updatedCount: 0, notFoundCount: 0, region, displayName }
    }
    
    const content = fs.readFileSync(mdPath, 'utf-8')
    const exercises = parseMarkdownMetadata(content)
    
    console.log(`📄 ${exercises.length} exercices extraits du fichier Markdown\n`)
    
    // Récupérer les vidéos de cette région
    const videos = await sql`
      SELECT id, title
      FROM videos_new
      WHERE region = ${region}
    `
    
    console.log(`📹 ${videos.length} vidéos trouvées dans la base\n`)
    
    // Créer un map normalisé des exercices
    const normalizedExercises = new Map()
    exercises.forEach(ex => {
      const normalizedTitle = normalizeTitle(ex.title)
      normalizedExercises.set(normalizedTitle, ex)
    })
    
    let updatedCount = 0
    let notFoundCount = 0
    const notFound = []
    
    for (const video of videos) {
      const normalizedVideoTitle = normalizeTitle(video.title)
      let metadata = normalizedExercises.get(normalizedVideoTitle)
      let matchType = 'exact'
      
      // Si pas de match exact, chercher une correspondance partielle
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
        const muscleGroupsArray = [region]
        
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
            "muscleGroups" = ${muscleGroupsArray}::text[],
            difficulty = ${difficulty},
            "updatedAt" = NOW()
          WHERE id = ${video.id}
        `
        
        if (matchType === 'exact') {
          console.log(`✅ ${video.title}`)
        } else {
          console.log(`✅ (${matchType}) ${video.title}`)
        }
        updatedCount++
      } else {
        console.log(`⚠️  ${video.title}`)
        notFound.push(video.title)
        notFoundCount++
      }
    }
    
    console.log(`\n📊 ${displayName} - Résumé:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⚠️  Sans métadonnées: ${notFoundCount}`)
    
    return { updatedCount, notFoundCount, region, displayName }
    
  } catch (error) {
    console.error(`❌ Erreur pour ${displayName}:`, error.message)
    return { updatedCount: 0, notFoundCount: 0, region, displayName, error: error.message }
  }
}

async function main() {
  console.log('\n🚀 Début de la mise à jour des métadonnées...\n')
  
  const results = []
  
  for (const group of muscleGroups) {
    const result = await updateMetadataForRegion(group)
    results.push(result)
  }
  
  // Résumé global
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ GLOBAL')
  console.log(`${'='.repeat(60)}\n`)
  
  let totalUpdated = 0
  let totalNotFound = 0
  
  results.forEach(r => {
    console.log(`${r.displayName.padEnd(15)} - ✅ ${r.updatedCount} mises à jour | ⚠️  ${r.notFoundCount} sans métadonnées`)
    totalUpdated += r.updatedCount
    totalNotFound += r.notFoundCount
  })
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TOTAL: ${totalUpdated} vidéos avec métadonnées complètes`)
  console.log(`       ${totalNotFound} vidéos sans métadonnées`)
  console.log(`${'='.repeat(60)}\n`)
  
  console.log('✅ Mise à jour terminée!\n')
}

main()
