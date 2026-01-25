/**
 * Script pour mettre à jour les métadonnées d'une vidéo spécifique
 * Usage: node scripts/update-single-video-metadata.js
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas défini dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// Métadonnées extraites du fichier markdown
const metadata = {
  title: 'Bascule du bassin en cercle',
  region: 'dos', // région dans la base de données
  targeted_muscles: ['lombaires', 'abdominaux'],
  startingPosition: 'Assis sur le ballon avec la courbe lombaire neutre.\n\nAllonger la colonne vertébrale.',
  movement: 'Basculer le bassin vers l\'avant, le côté, l\'arrière et de l\'autre côté en faisant un cercle.\n\nRevenir en position de départ lentement en allongeant la colonne vertébrale. Tenir les abdominaux.',
  intensity: 'Tout niveau',
  series: '2x 10 à 12 répétitions',
  constraints: 'Aucune',
  theme: 'bascule du bassin'
}

function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'intermediaire'
  
  const lower = intensity.toLowerCase()
  if (lower.includes('débutant')) return 'debutant'
  if (lower.includes('intermédiaire') && lower.includes('avancé')) return 'avance'
  if (lower.includes('intermédiaire')) return 'intermediaire'
  if (lower.includes('avancé')) return 'avance'
  
  return 'intermediaire'
}

async function updateVideoMetadata() {
  console.log('🔍 Recherche de la vidéo:', metadata.title)
  console.log('📋 Région:', metadata.region, '\n')

  try {
    // Chercher la vidéo par titre (recherche flexible)
    const searchPattern = metadata.title.toLowerCase().trim()
    
    // Essayer plusieurs variantes de recherche
    const searchQueries = [
      // Recherche exacte
      sql`SELECT id, title, region FROM videos_new WHERE LOWER(TRIM(title)) = ${searchPattern} AND region = ${metadata.region} LIMIT 1`,
      // Recherche avec LIKE
      sql`SELECT id, title, region FROM videos_new WHERE LOWER(title) LIKE ${'%' + searchPattern.replace(/\+/g, '%') + '%'} AND region = ${metadata.region} LIMIT 1`,
      // Recherche sans le numéro au début
      sql`SELECT id, title, region FROM videos_new WHERE LOWER(title) LIKE ${'%pompe%pieds%banc%main%sol%'} AND region = ${metadata.region} LIMIT 1`,
      // Recherche plus large
      sql`SELECT id, title, region FROM videos_new WHERE LOWER(title) LIKE ${'%pompe%pieds%banc%'} AND region = ${metadata.region} LIMIT 1`
    ]

    let video = null
    
    for (const query of searchQueries) {
      const results = await query
      if (results && results.length > 0) {
        video = results[0]
        console.log(`✅ Vidéo trouvée: "${video.title}" (ID: ${video.id})`)
        break
      }
    }

    if (!video) {
      console.error('❌ Vidéo non trouvée dans la base de données')
      console.log('\n💡 Essayez de rechercher manuellement avec:')
      console.log(`   SELECT id, title, region FROM videos_new WHERE region = '${metadata.region}' AND LOWER(title) LIKE '%pompe%'`)
      process.exit(1)
    }

    // Préparer les données de mise à jour
    const difficulty = mapIntensityToDifficulty(metadata.intensity)
    const description = metadata.startingPosition || `Exercice: ${video.title}`
    const muscleGroupsArray = [metadata.region]

    console.log('\n📝 Mise à jour des métadonnées...')
    console.log('   - Intensité:', metadata.intensity)
    console.log('   - Difficulté:', difficulty)
    console.log('   - Série:', metadata.series)
    console.log('   - Thème:', metadata.theme)
    console.log('   - Contre-indication:', metadata.constraints)
    console.log('   - Muscles ciblés:', metadata.targeted_muscles.join(', '))

    // Mettre à jour la vidéo
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

    console.log('\n✅ Métadonnées mises à jour avec succès!')
    console.log(`   Vidéo ID: ${video.id}`)
    console.log(`   Titre: ${video.title}\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    console.error('   Détails:', error.message)
    process.exit(1)
  }
}

// Exécuter le script
updateVideoMetadata()
  .then(() => {
    console.log('✨ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
