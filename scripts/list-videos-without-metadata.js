/**
 * Script pour lister toutes les vidéos de type MUSCLE_GROUPS (bibliotheque-videos)
 * qui n'ont pas de métadonnées complètes dans Neon
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
 * Vérifie si une vidéo a des métadonnées manquantes
 */
function hasMissingMetadata(video) {
  const missing = []
  
  // Vérifier muscleGroups (doit être un tableau non vide)
  if (!video.muscleGroups || 
      !Array.isArray(video.muscleGroups) || 
      video.muscleGroups.length === 0) {
    missing.push('muscleGroups')
  }
  
  // Vérifier startingPosition (doit être non vide)
  if (!video.startingPosition || 
      video.startingPosition.trim() === '' ||
      video.startingPosition.toLowerCase() === 'n/a') {
    missing.push('startingPosition')
  }
  
  // Vérifier movement (doit être non vide)
  if (!video.movement || 
      video.movement.trim() === '' ||
      video.movement.toLowerCase() === 'n/a') {
    missing.push('movement')
  }
  
  // Vérifier intensity (optionnel mais préféré)
  if (!video.intensity || 
      video.intensity.trim() === '' ||
      video.intensity.toLowerCase() === 'n/a') {
    missing.push('intensity')
  }
  
  // Vérifier series (optionnel mais préféré)
  if (!video.series || 
      video.series.trim() === '' ||
      video.series.toLowerCase() === 'n/a') {
    missing.push('series')
  }
  
  // Vérifier constraints (optionnel mais préféré)
  if (!video.constraints || 
      video.constraints.trim() === '' ||
      video.constraints.toLowerCase() === 'n/a') {
    missing.push('constraints')
  }
  
  // Vérifier theme (optionnel mais préféré)
  if (!video.theme || 
      video.theme.trim() === '' ||
      video.theme.toLowerCase() === 'n/a') {
    missing.push('theme')
  }
  
  return {
    hasMissing: missing.length > 0,
    missingFields: missing,
    isCritical: missing.includes('muscleGroups') || 
                missing.includes('startingPosition') || 
                missing.includes('movement')
  }
}

async function listVideosWithoutMetadata() {
  try {
    console.log('🔍 Recherche des vidéos MUSCLE_GROUPS publiées...\n')
    
    // Récupérer toutes les vidéos de type MUSCLE_GROUPS qui sont publiées
    const videos = await sql`
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
        description,
        region,
        category,
        difficulty,
        "videoUrl"
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
      ORDER BY title
    `
    
    console.log(`📊 Total de vidéos MUSCLE_GROUPS publiées: ${videos.length}\n`)
    
    // Analyser chaque vidéo
    const videosWithoutMetadata = []
    const videosWithPartialMetadata = []
    
    for (const video of videos) {
      const metadataCheck = hasMissingMetadata(video)
      
      if (metadataCheck.hasMissing) {
        const videoInfo = {
          id: video.id,
          title: video.title,
          missingFields: metadataCheck.missingFields,
          isCritical: metadataCheck.isCritical,
          region: video.region || 'N/A',
          category: video.category || 'N/A',
          videoUrl: video.videoUrl || 'N/A'
        }
        
        if (metadataCheck.isCritical) {
          videosWithoutMetadata.push(videoInfo)
        } else {
          videosWithPartialMetadata.push(videoInfo)
        }
      }
    }
    
    // Afficher les résultats
    console.log('='.repeat(80))
    console.log('📋 VIDÉOS SANS MÉTADONNÉES CRITIQUES')
    console.log('='.repeat(80))
    console.log(`\nTotal: ${videosWithoutMetadata.length} vidéo(s)\n`)
    
    if (videosWithoutMetadata.length > 0) {
      videosWithoutMetadata.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`)
        console.log(`   ID: ${video.id}`)
        console.log(`   Région: ${video.region}`)
        console.log(`   Catégorie: ${video.category}`)
        console.log(`   Champs manquants: ${video.missingFields.join(', ')}`)
        console.log('')
      })
    } else {
      console.log('✅ Toutes les vidéos ont les métadonnées critiques!\n')
    }
    
    console.log('='.repeat(80))
    console.log('📋 VIDÉOS AVEC MÉTADONNÉES PARTIELLES (champs optionnels manquants)')
    console.log('='.repeat(80))
    console.log(`\nTotal: ${videosWithPartialMetadata.length} vidéo(s)\n`)
    
    if (videosWithPartialMetadata.length > 0) {
      videosWithPartialMetadata.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`)
        console.log(`   ID: ${video.id}`)
        console.log(`   Région: ${video.region}`)
        console.log(`   Champs manquants: ${video.missingFields.join(', ')}`)
        console.log('')
      })
    } else {
      console.log('✅ Toutes les vidéos ont les métadonnées optionnelles!\n')
    }
    
    // Générer un fichier JSON avec les résultats
    const outputDir = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const outputFile = path.join(outputDir, 'videos-without-metadata.json')
    const output = {
      generatedAt: new Date().toISOString(),
      totalVideos: videos.length,
      videosWithoutCriticalMetadata: videosWithoutMetadata,
      videosWithPartialMetadata: videosWithPartialMetadata,
      summary: {
        totalWithoutCritical: videosWithoutMetadata.length,
        totalWithPartial: videosWithPartialMetadata.length,
        totalComplete: videos.length - videosWithoutMetadata.length - videosWithPartialMetadata.length
      }
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8')
    console.log(`\n💾 Résultats sauvegardés dans: ${outputFile}`)
    
    // Générer aussi un fichier texte simple pour lecture facile
    const textFile = path.join(outputDir, 'videos-without-metadata.txt')
    let textContent = `LISTE DES VIDÉOS SANS MÉTADONNÉES\n`
    textContent += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`
    textContent += `\n${'='.repeat(80)}\n`
    textContent += `VIDÉOS SANS MÉTADONNÉES CRITIQUES (${videosWithoutMetadata.length})\n`
    textContent += `${'='.repeat(80)}\n\n`
    
    if (videosWithoutMetadata.length > 0) {
      videosWithoutMetadata.forEach((video, index) => {
        textContent += `${index + 1}. ${video.title}\n`
        textContent += `   ID: ${video.id}\n`
        textContent += `   Région: ${video.region}\n`
        textContent += `   Catégorie: ${video.category}\n`
        textContent += `   Champs manquants: ${video.missingFields.join(', ')}\n`
        textContent += `   URL: ${video.videoUrl}\n\n`
      })
    }
    
    textContent += `\n${'='.repeat(80)}\n`
    textContent += `VIDÉOS AVEC MÉTADONNÉES PARTIELLES (${videosWithPartialMetadata.length})\n`
    textContent += `${'='.repeat(80)}\n\n`
    
    if (videosWithPartialMetadata.length > 0) {
      videosWithPartialMetadata.forEach((video, index) => {
        textContent += `${index + 1}. ${video.title}\n`
        textContent += `   ID: ${video.id}\n`
        textContent += `   Région: ${video.region}\n`
        textContent += `   Champs manquants: ${video.missingFields.join(', ')}\n\n`
      })
    }
    
    fs.writeFileSync(textFile, textContent, 'utf8')
    console.log(`💾 Liste texte sauvegardée dans: ${textFile}`)
    
    // Résumé final
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(80))
    console.log(`Total vidéos MUSCLE_GROUPS publiées: ${videos.length}`)
    console.log(`Vidéos avec métadonnées complètes: ${videos.length - videosWithoutMetadata.length - videosWithPartialMetadata.length}`)
    console.log(`Vidéos sans métadonnées critiques: ${videosWithoutMetadata.length}`)
    console.log(`Vidéos avec métadonnées partielles: ${videosWithPartialMetadata.length}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    process.exit(1)
  }
}

// Exécuter le script
listVideosWithoutMetadata()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
