/**
 * Mise à jour directe de la vidéo Pullover avec l'ID trouvé
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL
const sql = neon(DATABASE_URL)

const videoId = 'f5a9ab50-6072-469d-86ac-fe44a49aa8bf'

const metadata = {
  targeted_muscles: ['pectoraux', 'épaules', 'triceps'],
  startingPosition: 'Couché sur le dos, les genoux fléchis avec les pieds au sol.\n\nLes bras tendus avec l\'haltère à hauteur de la poitrine.\n\nCourbe lombaire neutre.',
  movement: 'Descendre les bras tendus derrière la tête sans bloquer les coudes à hauteur des oreilles. Puis remonter les bras tendus vers l\'avant, à hauteur des côtes.\n\nTenir les abdominaux. Expirer sur la monté',
  intensity: null,
  series: null,
  constraints: null,
  theme: 'Pullover'
}

async function updatePullover() {
  console.log('🔄 Mise à jour de la vidéo Pullover...\n')
  
  const description = metadata.startingPosition || 'Exercice: Pullover'
  const muscleGroupsArray = ['pectoraux']
  const difficulty = 'intermediaire'

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
    WHERE id = ${videoId}
  `

  console.log('✅ Vidéo Pullover mise à jour avec succès!')
  console.log(`   ID: ${videoId}`)
  console.log(`   Muscles: ${metadata.targeted_muscles.join(', ')}`)
  console.log(`   Thème: ${metadata.theme}\n`)
}

updatePullover().then(() => process.exit(0))
