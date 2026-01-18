/**
 * Script pour trouver les vidéos qui ont très peu de métadonnées
 * (comme celles affichées dans l'interface avec seulement titre et contre-indication)
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
 * Vérifie si une vidéo a très peu de métadonnées (comme dans l'image)
 */
function hasMinimalMetadata(video) {
  // Une vidéo a des métadonnées minimales si elle a :
  // - Un titre (toujours présent)
  // - Peut-être une contre-indication
  // MAIS PAS de :
  // - muscleGroups (ou tableau vide)
  // - startingPosition
  // - movement
  // - intensity
  // - series
  // - theme
  
  const hasMuscleGroups = video.muscleGroups && 
                          Array.isArray(video.muscleGroups) && 
                          video.muscleGroups.length > 0
  
  const hasStartingPosition = video.startingPosition && 
                             video.startingPosition.trim() !== '' &&
                             video.startingPosition.toLowerCase() !== 'n/a'
  
  const hasMovement = video.movement && 
                     video.movement.trim() !== '' &&
                     video.movement.toLowerCase() !== 'n/a'
  
  const hasIntensity = video.intensity && 
                       video.intensity.trim() !== '' &&
                       video.intensity.toLowerCase() !== 'n/a'
  
  const hasSeries = video.series && 
                   video.series.trim() !== '' &&
                   video.series.toLowerCase() !== 'n/a'
  
  const hasTheme = video.theme && 
                  video.theme.trim() !== '' &&
                  video.theme.toLowerCase() !== 'n/a'
  
  // La vidéo a des métadonnées minimales si elle n'a PAS les champs principaux
  const hasMinimal = !hasMuscleGroups && !hasStartingPosition && !hasMovement
  
  return {
    hasMinimal: hasMinimal,
    missingFields: {
      muscleGroups: !hasMuscleGroups,
      startingPosition: !hasStartingPosition,
      movement: !hasMovement,
      intensity: !hasIntensity,
      series: !hasSeries,
      theme: !hasTheme
    },
    hasOnlyConstraints: hasMinimal && (video.constraints && 
                                       video.constraints.trim() !== '' &&
                                       video.constraints.toLowerCase() !== 'n/a' &&
                                       video.constraints.toLowerCase() !== 'aucune')
  }
}

async function findVideosWithMinimalMetadata() {
  try {
    console.log('🔍 Recherche des vidéos avec métadonnées minimales (comme dans l\'interface)...\n')
    
    // Récupérer toutes les vidéos MUSCLE_GROUPS publiées
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
        category
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
      ORDER BY title
    `
    
    console.log(`📊 Total de vidéos MUSCLE_GROUPS publiées: ${videos.length}\n`)
    
    // Identifier les vidéos avec métadonnées minimales
    const videosWithMinimal = []
    
    for (const video of videos) {
      const check = hasMinimalMetadata(video)
      if (check.hasMinimal) {
        videosWithMinimal.push({
          video: video,
          check: check
        })
      }
    }
    
    console.log('='.repeat(100))
    console.log('📋 VIDÉOS AVEC MÉTADONNÉES MINIMALES')
    console.log('='.repeat(100))
    console.log(`\nTotal: ${videosWithMinimal.length} vidéo(s)\n`)
    
    // Afficher les vidéos
    videosWithMinimal.forEach((item, index) => {
      const v = item.video
      const c = item.check
      console.log(`${index + 1}. ${v.title}`)
      console.log(`   ID: ${v.id}`)
      console.log(`   Région: ${v.region || 'N/A'}`)
      console.log(`   Catégorie: ${v.category || 'N/A'}`)
      console.log(`   Champs manquants:`)
      if (c.missingFields.muscleGroups) console.log(`     - muscleGroups`)
      if (c.missingFields.startingPosition) console.log(`     - startingPosition`)
      if (c.missingFields.movement) console.log(`     - movement`)
      if (c.missingFields.intensity) console.log(`     - intensity`)
      if (c.missingFields.series) console.log(`     - series`)
      if (c.missingFields.theme) console.log(`     - theme`)
      if (v.constraints) {
        console.log(`   Contre-indication: ${v.constraints}`)
      }
      console.log('')
    })
    
    // Générer un fichier JSON
    const outputDir = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const jsonFile = path.join(outputDir, 'videos-with-minimal-metadata.json')
    const jsonData = {
      generatedAt: new Date().toISOString(),
      totalVideos: videos.length,
      videosWithMinimalMetadata: videosWithMinimal.length,
      videos: videosWithMinimal.map(item => ({
        id: item.video.id,
        title: item.video.title,
        region: item.video.region,
        category: item.video.category,
        constraints: item.video.constraints,
        missingFields: item.check.missingFields,
        hasOnlyConstraints: item.check.hasOnlyConstraints
      }))
    }
    
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2), 'utf8')
    
    // Générer un fichier texte
    const textFile = path.join(outputDir, 'videos-with-minimal-metadata.txt')
    let textContent = `LISTE DES VIDÉOS AVEC MÉTADONNÉES MINIMALES\n`
    textContent += `(Comme celles affichées dans l'interface avec seulement titre et contre-indication)\n\n`
    textContent += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`
    textContent += `\n${'='.repeat(100)}\n`
    textContent += `RÉSUMÉ\n`
    textContent += `${'='.repeat(100)}\n`
    textContent += `Total vidéos MUSCLE_GROUPS publiées: ${videos.length}\n`
    textContent += `Vidéos avec métadonnées minimales: ${videosWithMinimal.length}\n\n`
    
    textContent += `${'='.repeat(100)}\n`
    textContent += `LISTE DES VIDÉOS\n`
    textContent += `${'='.repeat(100)}\n\n`
    
    videosWithMinimal.forEach((item, index) => {
      const v = item.video
      const c = item.check
      textContent += `${index + 1}. ${v.title}\n`
      textContent += `   ID: ${v.id}\n`
      textContent += `   Région: ${v.region || 'N/A'}\n`
      textContent += `   Catégorie: ${v.category || 'N/A'}\n`
      if (v.constraints) {
        textContent += `   Contre-indication: ${v.constraints}\n`
      }
      textContent += `   Champs manquants: `
      const missing = []
      if (c.missingFields.muscleGroups) missing.push('muscleGroups')
      if (c.missingFields.startingPosition) missing.push('startingPosition')
      if (c.missingFields.movement) missing.push('movement')
      if (c.missingFields.intensity) missing.push('intensity')
      if (c.missingFields.series) missing.push('series')
      if (c.missingFields.theme) missing.push('theme')
      textContent += missing.join(', ') || 'Aucun'
      textContent += `\n\n`
    })
    
    fs.writeFileSync(textFile, textContent, 'utf8')
    
    console.log(`\n💾 Résultats sauvegardés dans:`)
    console.log(`   - ${jsonFile}`)
    console.log(`   - ${textFile}`)
    
    console.log('\n' + '='.repeat(100))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(100))
    console.log(`Total vidéos MUSCLE_GROUPS publiées: ${videos.length}`)
    console.log(`Vidéos avec métadonnées minimales: ${videosWithMinimal.length}`)
    console.log(`Vidéos avec métadonnées complètes: ${videos.length - videosWithMinimal.length}`)
    console.log('='.repeat(100))
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    process.exit(1)
  }
}

// Exécuter le script
findVideosWithMinimalMetadata()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
