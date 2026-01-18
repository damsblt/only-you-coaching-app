/**
 * Script pour trouver la vidéo "Butterfly position de fente + poulies hautes" dans Neon
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function findButterflyFente() {
  try {
    console.log('🔍 Recherche de la vidéo "Butterfly position de fente + poulies hautes"...\n')
    
    // Chercher la vidéo par titre (insensible à la casse)
    const videos = await sql`
      SELECT id, title, "muscleGroups", "startingPosition", movement, intensity, 
             series, constraints, theme, difficulty, category, region, description
      FROM videos_new
      WHERE LOWER(title) LIKE LOWER('%butterfly%') 
        AND (LOWER(title) LIKE LOWER('%fente%') OR LOWER(title) LIKE LOWER('%poulie%'))
      ORDER BY title
    `
    
    if (videos.length === 0) {
      console.log('❌ Aucune vidéo trouvée avec "Butterfly" et "fente" ou "poulie"')
      console.log('\n🔍 Recherche plus large pour "Butterfly"...\n')
      
      const allButterfly = await sql`
        SELECT id, title, "muscleGroups", "startingPosition", movement, intensity, 
               series, constraints, theme, difficulty, category, region, description
        FROM videos_new
        WHERE LOWER(title) LIKE LOWER('%butterfly%')
        ORDER BY title
      `
      
      if (allButterfly.length > 0) {
        console.log(`📊 ${allButterfly.length} vidéo(s) avec "Butterfly":\n`)
        allButterfly.forEach((video, index) => {
          console.log(`${index + 1}. ${video.title} (ID: ${video.id})`)
          console.log(`   Muscle Groups: ${video.muscleGroups || 'N/A'}`)
          console.log(`   Description: ${video.description ? video.description.substring(0, 100) + '...' : 'N/A'}`)
          console.log('')
        })
      } else {
        console.log('❌ Aucune vidéo avec "Butterfly" trouvée')
      }
      return
    }
    
    console.log(`📊 ${videos.length} vidéo(s) trouvée(s):\n`)
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} (ID: ${video.id})`)
      console.log(`   Muscle Groups: ${video.muscleGroups || 'N/A'}`)
      console.log(`   Starting Position: ${video.startingPosition || 'N/A'}`)
      console.log(`   Movement: ${video.movement ? video.movement.substring(0, 100) + '...' : 'N/A'}`)
      console.log(`   Description: ${video.description ? video.description.substring(0, 100) + '...' : 'N/A'}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    process.exit(1)
  }
}

// Exécuter le script
findButterflyFente()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
