/**
 * Script pour identifier les vidéos machine par leur numéro
 * et préparer la configuration de l'ordre du programme
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

async function identifyMachineVideos() {
  console.log('🔍 Identification des vidéos machine...\n')
  
  const sql = neon(databaseUrl)
  
  try {
    // Récupérer toutes les vidéos machine
    const videos = await sql`
      SELECT id, title, "videoUrl", "videoType", region, category
      FROM videos_new
      WHERE region = 'machine' 
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
        AND "isPublished" = true
      ORDER BY title
    `
    
    console.log(`📊 ${videos.length} vidéo(s) machine trouvée(s)\n`)
    
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
    
    // Vérifier les vidéos demandées (46, 6, 18, 1, 16, 8, 9, 3)
    const requestedNumbers = [46, 6, 18, 1, 16, 8, 9, 3]
    console.log('\n🎯 Vérification des vidéos demandées:\n')
    
    const foundVideos = []
    const missingVideos = []
    
    requestedNumbers.forEach(num => {
      const video = videosWithNumbers.find(v => v.number === num)
      if (video) {
        foundVideos.push({ number: num, video })
        console.log(`✅ Vidéo ${num}: ${video.title} (ID: ${video.id})`)
      } else {
        missingVideos.push(num)
        console.log(`❌ Vidéo ${num}: Non trouvée`)
      }
    })
    
    console.log(`\n📊 Résumé:`)
    console.log(`   ✅ Trouvées: ${foundVideos.length}/${requestedNumbers.length}`)
    console.log(`   ❌ Manquantes: ${missingVideos.length > 0 ? missingVideos.join(', ') : 'Aucune'}`)
    
    // Générer la configuration d'ordre
    if (foundVideos.length === requestedNumbers.length) {
      console.log('\n📝 Configuration d\'ordre à utiliser:\n')
      console.log('const MACHINE_PROGRAM_ORDER = {')
      foundVideos.forEach(({ number, video }, index) => {
        console.log(`  ${index + 1}: '${video.id}', // Vidéo ${number}: ${video.title}`)
      })
      console.log('}')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'identification:', error)
    process.exit(1)
  }
}

identifyMachineVideos()











