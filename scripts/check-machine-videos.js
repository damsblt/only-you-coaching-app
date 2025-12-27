/**
 * Script pour vérifier si les vidéos du dossier machine sont dans Neon
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

async function checkMachineVideos() {
  console.log('🔍 Vérification des vidéos machine dans Neon...\n')
  
  const sql = neon(databaseUrl)
  
  try {
    // Chercher les vidéos avec videoUrl contenant "programmes-predefinis/machine"
    const videos = await sql`
      SELECT id, title, "videoUrl", "videoType", region, "isPublished"
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis/machine%'
      ORDER BY title
    `
    
    console.log(`📊 Résultats: ${videos.length} vidéo(s) trouvée(s)\n`)
    
    if (videos.length === 0) {
      console.log('❌ Aucune vidéo du dossier machine trouvée dans Neon')
      console.log('💡 Les vidéos doivent être synchronisées depuis S3\n')
    } else {
      console.log('✅ Vidéos trouvées:\n')
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`)
        console.log(`   URL: ${video.videoUrl}`)
        console.log(`   Type: ${video.videoType || 'N/A'}`)
        console.log(`   Région: ${video.region || 'N/A'}`)
        console.log(`   Publiée: ${video.isPublished ? 'Oui' : 'Non'}`)
        console.log('')
      })
    }
    
    // Vérifier aussi toutes les vidéos de type PROGRAMMES
    const allProgrammes = await sql`
      SELECT COUNT(*) as count
      FROM videos_new
      WHERE "videoType" = 'PROGRAMMES'
    `
    
    console.log(`📈 Total vidéos de type PROGRAMMES: ${allProgrammes[0].count}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

checkMachineVideos()

















