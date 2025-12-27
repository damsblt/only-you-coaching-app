/**
 * Script générique pour identifier les vidéos d'un programme par leur numéro
 * 
 * Usage: node scripts/identify-program-videos.js <region>
 * Exemple: node scripts/identify-program-videos.js abdos
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

/**
 * Extrait le numéro de vidéo depuis l'URL ou le titre
 */
function extractVideoNumber(videoUrl, title) {
  // Essayer d'extraire depuis l'URL (ex: "46. exercice.mp4" ou "video-46.mp4")
  const urlMatch = videoUrl.match(/(?:^|\/)(\d+)(?:\.|[-_])/i)
  if (urlMatch) {
    return parseInt(urlMatch[1], 10)
  }
  
  // Essayer d'extraire depuis le titre (ex: "46. Exercice" ou "Video 46")
  const titleMatch = title.match(/^(\d+)(?:\.|\s)/)
  if (titleMatch) {
    return parseInt(titleMatch[1], 10)
  }
  
  return null
}

async function identifyProgramVideos(region) {
  console.log(`🔍 Identification des vidéos pour le programme: ${region}\n`)
  
  const sql = neon(databaseUrl)
  
  try {
    // Récupérer toutes les vidéos du programme
    const videos = await sql`
      SELECT id, title, "videoUrl", "videoType", region, category
      FROM videos_new
      WHERE region = ${region} 
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
        AND "isPublished" = true
      ORDER BY title
    `
    
    console.log(`📊 ${videos.length} vidéo(s) trouvée(s)\n`)
    
    if (videos.length === 0) {
      console.log('❌ Aucune vidéo trouvée pour ce programme')
      return
    }
    
    // Extraire les numéros de vidéos
    const videosWithNumbers = videos.map(video => {
      const number = extractVideoNumber(video.videoUrl, video.title)
      return {
        ...video,
        number
      }
    })
    
    // Afficher toutes les vidéos avec leurs numéros
    console.log('📋 Liste des vidéos avec leurs numéros:\n')
    videosWithNumbers.forEach((video, index) => {
      console.log(`${index + 1}. ${video.number ? `Vidéo ${video.number}` : 'Sans numéro'}`)
      console.log(`   ID: ${video.id}`)
      console.log(`   Titre: ${video.title}`)
      console.log(`   URL: ${video.videoUrl}`)
      console.log('')
    })
    
    // Générer la configuration d'ordre (à compléter manuellement)
    const videosWithNumbersOnly = videosWithNumbers.filter(v => v.number !== null)
    if (videosWithNumbersOnly.length > 0) {
      console.log('\n📝 Template de configuration à utiliser (à compléter avec l\'ordre du fichier Word):\n')
      console.log(`export const ${region.toUpperCase().replace(/-/g, '_')}_PROGRAM_ORDER: Record<number, string> = {`)
      console.log('  // TODO: Réorganiser selon l\'ordre du fichier Word')
      videosWithNumbersOnly
        .sort((a, b) => a.number - b.number)
        .forEach((video, index) => {
          console.log(`  ${index + 1}: '${video.id}', // Vidéo ${video.number}: ${video.title}`)
        })
      console.log('}')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'identification:', error)
    process.exit(1)
  }
}

// Récupérer la région depuis les arguments
const region = process.argv[2]

if (!region) {
  console.error('❌ Usage: node scripts/identify-program-videos.js <region>')
  console.error('   Exemples:')
  console.error('     node scripts/identify-program-videos.js abdos')
  console.error('     node scripts/identify-program-videos.js brule-graisse')
  console.error('     node scripts/identify-program-videos.js cuisses-abdos')
  process.exit(1)
}

identifyProgramVideos(region)















