/**
 * Script pour trouver les correspondances de métadonnées pour les 24 vidéos
 * avec métadonnées minimales en cherchant dans les vidéos de type PROGRAMMES
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
 * Normalise un titre pour la comparaison
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+[fhx]\s*$/i, '') // Enlève les codes f, h, x à la fin
    .replace(/\s+[fhx]\s+/g, ' ') // Enlève les codes f, h, x isolés
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Compare deux titres
 */
function compareTitles(title1, title2) {
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)
  
  if (norm1 === norm2) return { score: 100, type: 'exact' }
  
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = norm1.length > norm2.length ? norm1 : norm2
    const shorter = norm1.length > norm2.length ? norm2 : norm1
    const ratio = shorter.length / longer.length
    return { score: Math.round(ratio * 90), type: 'partial' }
  }
  
  const words1 = norm1.split(/\s+/).filter(w => w.length > 2)
  const words2 = norm2.split(/\s+/).filter(w => w.length > 2)
  const commonWords = words1.filter(w => words2.includes(w))
  
  if (commonWords.length >= 2) {
    const totalWords = Math.max(words1.length, words2.length)
    const matchRatio = commonWords.length / totalWords
    const baseScore = 60 + (matchRatio * 30)
    return { score: Math.min(Math.round(baseScore), 95), type: 'keywords' }
  } else if (commonWords.length === 1 && commonWords[0].length > 4) {
    return { score: 40, type: 'single_keyword' }
  }
  
  return { score: 0, type: 'none' }
}

async function findMatchesInProgrammes() {
  try {
    console.log('🔍 Recherche des 24 vidéos avec métadonnées minimales...\n')
    
    // Récupérer les 24 vidéos avec métadonnées minimales (MUSCLE_GROUPS)
    const videosWithMinimal = await sql`
      SELECT 
        id, 
        title, 
        "muscleGroups", 
        "startingPosition", 
        movement, 
        intensity, 
        series, 
        constraints, 
        theme,
        region,
        category
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
        AND (
          "muscleGroups" IS NULL 
          OR array_length("muscleGroups", 1) IS NULL
        )
        AND (
          "startingPosition" IS NULL 
          OR "startingPosition" = ''
        )
        AND (
          "movement" IS NULL 
          OR "movement" = ''
        )
      ORDER BY title
    `
    
    console.log(`📊 ${videosWithMinimal.length} vidéos avec métadonnées minimales trouvées\n`)
    
    console.log('🔍 Recherche des vidéos de type PROGRAMMES avec métadonnées complètes...\n')
    
    // Récupérer les vidéos PROGRAMMES avec métadonnées complètes
    const programmeVideos = await sql`
      SELECT 
        id, 
        title, 
        "muscleGroups", 
        "startingPosition", 
        movement, 
        intensity, 
        series, 
        constraints, 
        theme,
        region,
        category,
        description
      FROM videos_new
      WHERE "videoType" = 'PROGRAMMES'
        AND "isPublished" = true
        AND (
          ("muscleGroups" IS NOT NULL AND array_length("muscleGroups", 1) > 0)
          OR ("startingPosition" IS NOT NULL AND "startingPosition" != '')
          OR ("movement" IS NOT NULL AND "movement" != '')
        )
      ORDER BY title
    `
    
    console.log(`📊 ${programmeVideos.length} vidéos PROGRAMMES avec métadonnées trouvées\n`)
    
    // Chercher les correspondances
    const matches = []
    const noMatches = []
    
    console.log('🔍 Recherche des correspondances...\n')
    
    for (const video of videosWithMinimal) {
      let bestMatch = null
      let bestScore = 0
      
      for (const programmeVideo of programmeVideos) {
        const comparison = compareTitles(video.title, programmeVideo.title)
        
        if (comparison.score > bestScore && comparison.score >= 60) {
          bestScore = comparison.score
          bestMatch = {
            programmeVideo: programmeVideo,
            score: comparison.score,
            matchType: comparison.type
          }
        }
      }
      
      if (bestMatch) {
        matches.push({
          video: video,
          match: bestMatch,
          confidence: bestMatch.score >= 90 ? 'high' : bestMatch.score >= 70 ? 'medium' : 'low'
        })
      } else {
        noMatches.push(video)
      }
    }
    
    // Générer le rapport
    const outputDir = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Grouper par niveau de confiance
    const highConfidence = matches.filter(m => m.confidence === 'high')
    const mediumConfidence = matches.filter(m => m.confidence === 'medium')
    const lowConfidence = matches.filter(m => m.confidence === 'low')
    
    // Rapport texte
    let textReport = `RAPPORT DE CORRESPONDANCES DANS LES VIDÉOS PROGRAMMES\n`
    textReport += `Pour les 24 vidéos avec métadonnées minimales (MUSCLE_GROUPS)\n\n`
    textReport += `Généré le: ${new Date().toLocaleString('fr-FR')}\n\n`
    textReport += `${'='.repeat(100)}\n`
    textReport += `RÉSUMÉ\n`
    textReport += `${'='.repeat(100)}\n`
    textReport += `Total vidéos avec métadonnées minimales: ${videosWithMinimal.length}\n`
    textReport += `Vidéos PROGRAMMES avec métadonnées: ${programmeVideos.length}\n`
    textReport += `Correspondances trouvées: ${matches.length}\n`
    textReport += `Aucune correspondance: ${noMatches.length}\n\n`
    
    textReport += `${'='.repeat(100)}\n`
    textReport += `CORRESPONDANCES HAUTE CONFIANCE (${highConfidence.length})\n`
    textReport += `${'='.repeat(100)}\n\n`
    
    highConfidence.forEach((m, index) => {
      textReport += `${index + 1}. VIDÉO MUSCLE_GROUPS: ${m.video.title}\n`
      textReport += `   ID: ${m.video.id}\n`
      textReport += `   Région: ${m.video.region || 'N/A'}\n`
      textReport += `   → CORRESPONDANCE PROGRAMME: ${m.match.programmeVideo.title}\n`
      textReport += `   ID Programme: ${m.match.programmeVideo.id}\n`
      textReport += `   Score: ${m.match.score}/100 (${m.match.matchType})\n`
      textReport += `   Métadonnées disponibles dans le programme:\n`
      if (m.match.programmeVideo.muscleGroups && m.match.programmeVideo.muscleGroups.length > 0) {
        textReport += `     - Muscle cible: ${m.match.programmeVideo.muscleGroups.join(', ')}\n`
      }
      if (m.match.programmeVideo.startingPosition) {
        textReport += `     - Position départ: ${m.match.programmeVideo.startingPosition.substring(0, 150)}...\n`
      }
      if (m.match.programmeVideo.movement) {
        textReport += `     - Mouvement: ${m.match.programmeVideo.movement.substring(0, 150)}...\n`
      }
      if (m.match.programmeVideo.intensity) {
        textReport += `     - Intensité: ${m.match.programmeVideo.intensity}\n`
      }
      if (m.match.programmeVideo.series) {
        textReport += `     - Série: ${m.match.programmeVideo.series}\n`
      }
      if (m.match.programmeVideo.constraints) {
        textReport += `     - Contre-indication: ${m.match.programmeVideo.constraints}\n`
      }
      if (m.match.programmeVideo.theme) {
        textReport += `     - Thème: ${m.match.programmeVideo.theme}\n`
      }
      textReport += `   ✅ VALIDATION: [ ] OUI  [ ] NON\n\n`
    })
    
    if (mediumConfidence.length > 0) {
      textReport += `${'='.repeat(100)}\n`
      textReport += `CORRESPONDANCES MOYENNE CONFIANCE (${mediumConfidence.length})\n`
      textReport += `${'='.repeat(100)}\n\n`
      
      mediumConfidence.forEach((m, index) => {
        textReport += `${index + 1}. VIDÉO MUSCLE_GROUPS: ${m.video.title}\n`
        textReport += `   ID: ${m.video.id}\n`
        textReport += `   → CORRESPONDANCE PROGRAMME: ${m.match.programmeVideo.title}\n`
        textReport += `   ID Programme: ${m.match.programmeVideo.id}\n`
        textReport += `   Score: ${m.match.score}/100 (${m.match.matchType})\n`
        textReport += `   ⚠️  VALIDATION: [ ] OUI  [ ] NON\n\n`
      })
    }
    
    if (lowConfidence.length > 0) {
      textReport += `${'='.repeat(100)}\n`
      textReport += `CORRESPONDANCES FAIBLE CONFIANCE (${lowConfidence.length})\n`
      textReport += `${'='.repeat(100)}\n\n`
      
      lowConfidence.forEach((m, index) => {
        textReport += `${index + 1}. VIDÉO MUSCLE_GROUPS: ${m.video.title}\n`
        textReport += `   ID: ${m.video.id}\n`
        textReport += `   → CORRESPONDANCE PROGRAMME: ${m.match.programmeVideo.title}\n`
        textReport += `   ID Programme: ${m.match.programmeVideo.id}\n`
        textReport += `   Score: ${m.match.score}/100 (${m.match.matchType})\n`
        textReport += `   ⚠️  VALIDATION: [ ] OUI  [ ] NON\n\n`
      })
    }
    
    if (noMatches.length > 0) {
      textReport += `${'='.repeat(100)}\n`
      textReport += `AUCUNE CORRESPONDANCE TROUVÉE DANS PROGRAMMES (${noMatches.length})\n`
      textReport += `${'='.repeat(100)}\n\n`
      
      noMatches.forEach((v, index) => {
        textReport += `${index + 1}. ${v.title} (ID: ${v.id}, Région: ${v.region || 'N/A'})\n`
      })
    }
    
    const textFile = path.join(outputDir, 'matches-in-programmes.txt')
    fs.writeFileSync(textFile, textReport, 'utf8')
    
    // Rapport JSON
    const jsonReport = {
      generatedAt: new Date().toISOString(),
      totalVideosWithMinimal: videosWithMinimal.length,
      totalProgrammeVideos: programmeVideos.length,
      matchesFound: matches.length,
      noMatches: noMatches.length,
      matches: matches.map(m => ({
        videoId: m.video.id,
        videoTitle: m.video.title,
        videoRegion: m.video.region,
        programmeVideoId: m.match.programmeVideo.id,
        programmeVideoTitle: m.match.programmeVideo.title,
        confidence: m.confidence,
        score: m.match.score,
        matchType: m.match.matchType,
        metadata: {
          muscleGroups: m.match.programmeVideo.muscleGroups,
          startingPosition: m.match.programmeVideo.startingPosition,
          movement: m.match.programmeVideo.movement,
          intensity: m.match.programmeVideo.intensity,
          series: m.match.programmeVideo.series,
          constraints: m.match.programmeVideo.constraints,
          theme: m.match.programmeVideo.theme
        }
      })),
      noMatches: noMatches.map(v => ({
        id: v.id,
        title: v.title,
        region: v.region
      }))
    }
    
    const jsonFile = path.join(outputDir, 'matches-in-programmes.json')
    fs.writeFileSync(jsonFile, JSON.stringify(jsonReport, null, 2), 'utf8')
    
    // Afficher un résumé
    console.log('='.repeat(100))
    console.log('📊 RÉSUMÉ DES CORRESPONDANCES')
    console.log('='.repeat(100))
    console.log(`Total vidéos avec métadonnées minimales: ${videosWithMinimal.length}`)
    console.log(`Vidéos PROGRAMMES avec métadonnées: ${programmeVideos.length}`)
    console.log(`\n✅ Correspondances haute confiance: ${highConfidence.length}`)
    console.log(`⚠️  Correspondances moyenne confiance: ${mediumConfidence.length}`)
    console.log(`⚠️  Correspondances faible confiance: ${lowConfidence.length}`)
    console.log(`❌ Aucune correspondance: ${noMatches.length}`)
    console.log('='.repeat(100))
    
    console.log(`\n💾 Rapport de validation sauvegardé dans: ${textFile}`)
    console.log(`💾 Rapport JSON sauvegardé dans: ${jsonFile}`)
    console.log(`\n📝 Veuillez valider les correspondances dans le fichier de validation avant de procéder à la mise à jour.`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    process.exit(1)
  }
}

// Exécuter le script
findMatchesInProgrammes()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
