/**
 * Script pour mettre à jour les métadonnées de plusieurs vidéos
 * Usage: node scripts/update-multiple-videos-metadata.js
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas défini dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// Liste des vidéos à mettre à jour avec leurs métadonnées
const videosToUpdate = [
  {
    title: 'Biceps debout + élastique',
    possibleRegions: ['biceps'],
    metadata: {
      targeted_muscles: ['biceps', 'épaules', 'abdominaux'],
      startingPosition: 'Debout en appui sur une jambe avec le genou légèrement fléchit. L\'autre jambe en arrière. Les bras légèrement tendus devant le corps et les coudes souples.\n\nLa courbe lombaire neutre.',
      movement: 'Tirer l\'élastique en fléchissant les coudes.\n\nPuis tendre les bras, en maintenant les coudes près de la taille, pour revenir en position de départ.\n\nTenir les abdominaux.',
      intensity: null, // Pas d'intensité spécifiée
      series: null,
      constraints: null,
      theme: null
    }
  },
  {
    title: 'Pullover couché sol avec haltère a corriger le nom',
    possibleRegions: ['pectoraux', 'bande'],
    metadata: {
      targeted_muscles: ['pectoraux', 'épaules', 'triceps'],
      startingPosition: 'Couché sur le dos, les genoux fléchis avec les pieds au sol.\n\nLes bras tendus avec l\'haltère à hauteur de la poitrine.\n\nCourbe lombaire neutre.',
      movement: 'Descendre les bras tendus derrière la tête sans bloquer les coudes à hauteur des oreilles. Puis remonter les bras tendus vers l\'avant, à hauteur des côtes.\n\nTenir les abdominaux. Expirer sur la monté',
      intensity: null,
      series: null,
      constraints: null,
      theme: 'Pullover'
    }
  },
  {
    title: 'Abduction de hanche sur le côté jambes tendues',
    possibleRegions: ['bande', 'fessiers-jambes'],
    metadata: {
      targeted_muscles: ['fessier', 'TFL'],
      startingPosition: 'Couché sur le côté, les deux jambes tendues l\'une contre l\'autre. Ouvrir le thorax. La tête repose sur le bras.\n\nL\'élastique band autour et au-dessus des genoux.',
      movement: 'En maintenant la posture, tirer l\'élastique band vers le plafond. Puis ramener la jambe près de l\'autre.\n\nExpirer lors du mouvement et tenir les abdominaux.',
      intensity: null,
      series: null,
      constraints: null,
      theme: null
    }
  },
  {
    title: 'Gainage Jack nife genoux sur le ballon niveau 1 H',
    possibleRegions: ['abdominaux'],
    metadata: {
      targeted_muscles: ['Transverse', 'épaule', 'cuisse'],
      startingPosition: 'Main et épaule alignés en appui au sol.\n\nLes genoux et le milieu de la cuisse en appui sur le ballon. Tête dans le prolongement de la colonne.',
      movement: 'Lever un peu le fessier.\n\nAmener les genoux vers la poitrine.\n\nRevenir en position de départ sans creuser le dos.\n\nExpirer avec la bouche lors du mouvement.',
      intensity: 'Intermédiaire',
      series: '2x 12 répétitions',
      constraints: 'poignet',
      theme: 'Gainage'
    }
  },
  {
    title: 'Avant bras avec le bras tendu vers l\'avant',
    possibleRegions: ['genou', 'triceps'],
    metadata: {
      targeted_muscles: ['triceps'],
      startingPosition: 'Debout les pieds largeur des épaules ou un peu plus.',
      movement: 'Tendre le bras vers le plafond et fléchir le coude.\n\nLe bras près de la tête\n\nLe coude avec l\'autre main.\n\nGonfler le ventre à chaque inspiration et vider l\'air des poumons à chaque expiration. Maintenir 1 minute et plus.',
      intensity: null,
      series: 'Maintenir 1 minute et plus.',
      constraints: 'aucune',
      theme: null
    }
  }
]

function mapIntensityToDifficulty(intensity) {
  if (!intensity) return 'intermediaire'
  
  const lower = intensity.toLowerCase()
  if (lower.includes('débutant')) return 'debutant'
  if (lower.includes('intermédiaire') && lower.includes('avancé')) return 'avance'
  if (lower.includes('intermédiaire')) return 'intermediaire'
  if (lower.includes('avancé')) return 'avance'
  if (lower.includes('tout niveau')) return 'intermediaire'
  
  return 'intermediaire'
}

async function updateVideosMetadata() {
  console.log('🚀 Mise à jour des métadonnées pour', videosToUpdate.length, 'vidéos...\n')

  let updatedCount = 0
  let notFoundCount = 0
  const notFound = []

  for (const videoData of videosToUpdate) {
    try {
      console.log(`\n🔍 Recherche: "${videoData.title}"`)
      console.log(`   Régions possibles: ${videoData.possibleRegions.join(', ')}`)

      let video = null

      // Essayer de trouver la vidéo dans chaque région possible
      for (const region of videoData.possibleRegions) {
        const searchPattern = videoData.title.toLowerCase().trim()
        
        // Recherches multiples
        const searchQueries = [
          sql`SELECT id, title, region FROM videos_new WHERE LOWER(TRIM(title)) = ${searchPattern} AND region = ${region} LIMIT 1`,
          sql`SELECT id, title, region FROM videos_new WHERE LOWER(title) LIKE ${'%' + searchPattern.replace(/\+/g, '%').replace(/\s+/g, '%') + '%'} AND region = ${region} LIMIT 1`,
          sql`SELECT id, title, region FROM videos_new WHERE LOWER(title) LIKE ${'%' + searchPattern.split(' ').slice(0, 3).join('%') + '%'} AND region = ${region} LIMIT 1`
        ]

        for (const query of searchQueries) {
          const results = await query
          if (results && results.length > 0) {
            video = results[0]
            break
          }
        }

        if (video) break
      }

      if (!video) {
        console.log(`   ❌ Vidéo non trouvée`)
        notFound.push(videoData.title)
        notFoundCount++
        continue
      }

      console.log(`   ✅ Trouvée: "${video.title}" (ID: ${video.id}, Région: ${video.region})`)

      // Préparer les données de mise à jour
      const difficulty = mapIntensityToDifficulty(videoData.metadata.intensity)
      const description = videoData.metadata.startingPosition || `Exercice: ${video.title}`
      const muscleGroupsArray = [video.region]

      // Construire la requête de mise à jour avec template literals
      // Utiliser des valeurs par défaut pour les champs optionnels
      const intensity = videoData.metadata.intensity || null
      const series = videoData.metadata.series || null
      const constraints = videoData.metadata.constraints || null
      const theme = videoData.metadata.theme || null

      // Mettre à jour la vidéo avec template literal
      await sql`
        UPDATE videos_new
        SET 
          description = ${description},
          "startingPosition" = ${videoData.metadata.startingPosition},
          movement = ${videoData.metadata.movement},
          intensity = ${intensity},
          series = ${series},
          constraints = ${constraints},
          theme = ${theme},
          targeted_muscles = ${videoData.metadata.targeted_muscles}::text[],
          "muscleGroups" = ${muscleGroupsArray}::text[],
          difficulty = ${difficulty},
          "updatedAt" = NOW()
        WHERE id = ${video.id}
      `

      console.log(`   ✅ Métadonnées mises à jour`)
      console.log(`      - Muscles: ${videoData.metadata.targeted_muscles.join(', ')}`)
      if (videoData.metadata.intensity) console.log(`      - Intensité: ${videoData.metadata.intensity}`)
      if (videoData.metadata.series) console.log(`      - Série: ${videoData.metadata.series}`)
      if (videoData.metadata.constraints) console.log(`      - Contre-indication: ${videoData.metadata.constraints}`)
      
      updatedCount++

    } catch (error) {
      console.error(`   ❌ Erreur pour "${videoData.title}":`, error.message)
      notFound.push(videoData.title)
      notFoundCount++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Vidéos mises à jour: ${updatedCount}`)
  console.log(`⚠️  Vidéos non trouvées: ${notFoundCount}`)
  
  if (notFound.length > 0) {
    console.log(`\n⚠️  Vidéos non trouvées:`)
    notFound.forEach(title => console.log(`   - ${title}`))
  }
  
  console.log(`${'='.repeat(60)}\n`)
}

// Exécuter le script
updateVideosMetadata()
  .then(() => {
    console.log('✨ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
