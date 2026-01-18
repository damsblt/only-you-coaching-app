/**
 * Script pour vérifier la difficulté d'une vidéo spécifique
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function checkVideoDifficulty() {
  try {
    const videoTitle = 'DV couché ballon + barre libre'
    
    console.log(`🔍 Recherche de la vidéo: "${videoTitle}"\n`)
    
    // Rechercher la vidéo par titre (avec variations possibles)
    const videos = await sql`
      SELECT 
        id,
        title,
        difficulty,
        intensity,
        "videoType",
        "isPublished"
      FROM videos_new
      WHERE title ILIKE ${'%' + videoTitle + '%'}
        OR title ILIKE ${'%dv couché ballon%barre libre%'}
        OR title ILIKE ${'%dv couche ballon%barre libre%'}
      ORDER BY title
    `
    
    if (videos.length === 0) {
      console.log(`❌ Aucune vidéo trouvée avec le titre "${videoTitle}"\n`)
      
      // Essayer une recherche plus large
      console.log('🔍 Recherche élargie...\n')
      const broaderSearch = await sql`
        SELECT 
          id,
          title,
          difficulty,
          intensity,
          "videoType",
          "isPublished"
        FROM videos_new
        WHERE title ILIKE '%dv%ballon%barre%'
        ORDER BY title
      `
      
      if (broaderSearch.length > 0) {
        console.log(`📋 Vidéos trouvées avec des mots-clés similaires:\n`)
        broaderSearch.forEach((video, index) => {
          console.log(`${index + 1}. "${video.title}"`)
          console.log(`   ID: ${video.id}`)
          console.log(`   Difficulté: ${video.difficulty || 'N/A'}`)
          console.log(`   Intensité: ${video.intensity || 'N/A'}`)
          console.log(`   Type: ${video.videoType}, Publié: ${video.isPublished}\n`)
        })
      }
      
      return
    }
    
    console.log(`✅ ${videos.length} vidéo(s) trouvée(s):\n`)
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. "${video.title}"`)
      console.log(`   ID: ${video.id}`)
      console.log(`   Difficulté: ${video.difficulty || 'N/A'}`)
      console.log(`   Intensité: ${video.intensity || 'N/A'}`)
      console.log(`   Type: ${video.videoType}, Publié: ${video.isPublished}`)
      
      // Vérifier si la difficulté correspond à "intermédiaire et avancé"
      const difficultyLower = (video.difficulty || '').toLowerCase()
      const intensityLower = (video.intensity || '').toLowerCase()
      
      const isIntermediateAndAdvanced = 
        difficultyLower.includes('intermediaire') && 
        (difficultyLower.includes('avance') || difficultyLower.includes('avancé'))
      
      const intensityMatches = 
        intensityLower.includes('intermediaire') && 
        (intensityLower.includes('avance') || intensityLower.includes('avancé'))
      
      if (isIntermediateAndAdvanced || intensityMatches) {
        console.log(`   ✅ CORRECT: La difficulté/intensité correspond à "intermédiaire et avancé"\n`)
      } else {
        console.log(`   ⚠️  ATTENTION: La difficulté/intensité ne correspond PAS à "intermédiaire et avancé"`)
        console.log(`      Difficulté actuelle: "${video.difficulty || 'N/A'}"`)
        console.log(`      Intensité actuelle: "${video.intensity || 'N/A'}"`)
        console.log(`      Attendu: "intermédiaire et avancé" ou "intermediaire" + "avance"\n`)
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

// Exécuter le script
checkVideoDifficulty()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
