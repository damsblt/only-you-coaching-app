#!/usr/bin/env node
/**
 * Script pour vérifier si les vidéos marquées "indéfini" existent dans metadonnees-completes.md
 * et si elles ont "Tout niveau" ou pas de niveau du tout
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL
const METADATA_FILE = path.join(
  process.cwd(),
  'Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-completes.md'
)

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

function normalizeTitle(title) {
  if (!title) return ''
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

function titlesMatch(title1, title2) {
  if (!title1 || !title2) return false
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)
  if (norm1 === norm2) return true
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const diff = Math.abs(norm1.length - norm2.length)
    const minLength = Math.min(norm1.length, norm2.length)
    if (minLength > 0 && diff / minLength < 0.5) return true
  }
  const words1 = norm1.split(/\s+/).filter(w => w.length > 2)
  const words2 = norm2.split(/\s+/).filter(w => w.length > 2)
  if (words1.length === 0 || words2.length === 0) return false
  const commonWords = words1.filter(w => words2.includes(w))
  const minWords = Math.min(words1.length, words2.length)
  if (minWords > 0 && commonWords.length / minWords >= 0.6) return true
  return false
}

async function verifyUndefinedVideos() {
  console.log('🔍 Vérification des vidéos "indéfini"...\n')
  
  // Récupérer toutes les vidéos indéfini
  const undefinedVideos = await sql`
    SELECT title
    FROM videos_new
    WHERE "isPublished" = true
    AND "videoType" = 'MUSCLE_GROUPS'
    AND difficulty = 'indéfini'
    ORDER BY title
  `
  
  console.log(`📹 ${undefinedVideos.length} vidéos avec "indéfini"\n`)
  
  // Lire le fichier de métadonnées
  const content = fs.readFileSync(METADATA_FILE, 'utf8')
  const lines = content.split('\n')
  
  // Extraire tous les exercices avec leur intensité
  const exercisesInFile = []
  const intensityPattern = /Intensit[ée]\s*[\.:]\s*([^\n]+?)(?:\.|$)/i
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const intensityMatch = line.match(intensityPattern)
    
    if (intensityMatch) {
      const intensity = intensityMatch[1].trim()
      
      // Remonter pour trouver le titre
      let title = null
      let j = i - 1
      let sectionStart = -1
      
      while (j >= 0 && j >= i - 50) {
        const prevLine = lines[j].trim()
        if (prevLine.match(/^(Muscle cible|Position départ)/i)) {
          sectionStart = j
          break
        }
        j--
      }
      
      if (sectionStart >= 0) {
        let k = sectionStart - 1
        while (k >= 0 && k >= sectionStart - 15) {
          const candidateLine = lines[k].trim()
          if (!candidateLine || candidateLine === '---' || candidateLine.startsWith('#') || 
              candidateLine.startsWith('**') || candidateLine.startsWith('Source') ||
              candidateLine.match(/^(Muscle cible|Position départ|Mouvement|Intensité|Série|Contre|Source|Date)/i)) {
            k--
            continue
          }
          const invalidPatterns = [
            /^(Tenir|Monter|Descendre|Tirer|Fléchir|Tendre|Revenir|Allonger)/i,
            /^[A-Z][a-z]+\s+(les|la|le|un|une|des|du|de|à|en|sur|avec|sans|pour|par)\s+/i,
            /!$/,
            /^[A-Z][a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+/i,
            /^Thème\s*:/i
          ]
          const isValidTitle = candidateLine.length > 5 && 
                               candidateLine.length < 100 &&
                               !invalidPatterns.some(pattern => pattern.test(candidateLine))
          if (isValidTitle && (k === 0 || lines[k - 1].trim() === '')) {
            title = candidateLine
            break
          }
          k--
        }
      }
      
      if (title) {
        exercisesInFile.push({ title, intensity })
      }
    }
  }
  
  console.log(`📄 ${exercisesInFile.length} exercices trouvés dans metadonnees-completes.md\n`)
  
  // Vérifier chaque vidéo indéfini
  const stats = {
    foundWithToutNiveau: [],
    foundWithoutIntensity: [],
    notFound: []
  }
  
  for (const video of undefinedVideos) {
    let found = false
    let hasToutNiveau = false
    
    for (const exercise of exercisesInFile) {
      if (titlesMatch(exercise.title, video.title)) {
        found = true
        const lower = exercise.intensity.toLowerCase()
        if (lower.includes('tout niveau') || lower.includes('tous niveaux')) {
          hasToutNiveau = true
          stats.foundWithToutNiveau.push({
            video: video.title,
            exercise: exercise.title,
            intensity: exercise.intensity
          })
        } else {
          stats.foundWithoutIntensity.push({
            video: video.title,
            exercise: exercise.title,
            intensity: exercise.intensity
          })
        }
        break
      }
    }
    
    if (!found) {
      stats.notFound.push(video.title)
    }
  }
  
  console.log('='.repeat(80))
  console.log('📊 RÉSULTATS')
  console.log('='.repeat(80))
  console.log(`✅ Trouvées avec "Tout niveau": ${stats.foundWithToutNiveau.length}`)
  console.log(`⚠️  Trouvées mais sans niveau spécifique: ${stats.foundWithoutIntensity.length}`)
  console.log(`❌ Non trouvées dans le fichier: ${stats.notFound.length}`)
  console.log('='.repeat(80))
  
  if (stats.foundWithToutNiveau.length > 0) {
    console.log('\n📋 Vidéos avec "Tout niveau" (premiers 10):')
    stats.foundWithToutNiveau.slice(0, 10).forEach(item => {
      console.log(`   - ${item.video}`)
      console.log(`     → ${item.exercise} (${item.intensity})`)
    })
  }
  
  if (stats.foundWithoutIntensity.length > 0) {
    console.log('\n⚠️  Vidéos trouvées mais sans niveau (premiers 10):')
    stats.foundWithoutIntensity.slice(0, 10).forEach(item => {
      console.log(`   - ${item.video}`)
      console.log(`     → ${item.exercise} (${item.intensity})`)
    })
  }
  
  if (stats.notFound.length > 0) {
    console.log('\n❌ Vidéos non trouvées (premiers 20):')
    stats.notFound.slice(0, 20).forEach(title => {
      console.log(`   - ${title}`)
    })
    if (stats.notFound.length > 20) {
      console.log(`   ... et ${stats.notFound.length - 20} autres`)
    }
  }
}

verifyUndefinedVideos()
  .then(() => {
    console.log('\n✅ Vérification terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
