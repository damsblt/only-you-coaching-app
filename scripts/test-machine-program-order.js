/**
 * Script pour tester que l'ordre du programme machine est correct
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

// Configuration de l'ordre attendu
const EXPECTED_ORDER = [
  '3427a1c1-1d44-41af-9a6c-c8a4f19d8ecf', // Vidéo 46
  '0933d4c9-fbd4-47ee-9216-b8759700e045', // Vidéo 6
  '20426fe1-82a4-4e20-9408-58a7a325f95f', // Vidéo 18
  '893e464d-12e8-49e7-831b-1ba43d15907e', // Vidéo 1
  '22f4d0e9-3d9e-4539-aca3-04784afa66a2', // Vidéo 16
  'e93d32cb-d7b4-408d-a2af-712537cbee35', // Vidéo 8
  '7eced650-9c28-4f3b-8e6c-e1c39c544b2c', // Vidéo 9
  '6e36390f-1283-45b4-98d0-6ec3ab3a5034', // Vidéo 3
]

async function testMachineProgramOrder() {
  console.log('🧪 Test de l\'ordre du programme machine...\n')
  
  const sql = neon(databaseUrl)
  
  try {
    // Simuler une requête API pour récupérer les vidéos
    const videos = await sql`
      SELECT id, title, "videoUrl"
      FROM videos_new
      WHERE region = 'machine' 
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
        AND "isPublished" = true
    `
    
    console.log(`📊 ${videos.length} vidéo(s) trouvée(s)\n`)
    
    // Appliquer le tri comme dans lib/program-orders.ts
    const orderMap = new Map()
    EXPECTED_ORDER.forEach((videoId, index) => {
      orderMap.set(videoId, index + 1)
    })
    
    const orderedVideos = []
    const unorderedVideos = []
    
    videos.forEach(video => {
      const order = orderMap.get(video.id)
      if (order !== undefined) {
        orderedVideos.push({ video, order })
      } else {
        unorderedVideos.push(video)
      }
    })
    
    orderedVideos.sort((a, b) => a.order - b.order)
    const sortedVideos = [
      ...orderedVideos.map(item => item.video),
      ...unorderedVideos
    ]
    
    // Vérifier l'ordre
    console.log('📋 Ordre des vidéos après tri:\n')
    let allCorrect = true
    
    sortedVideos.slice(0, EXPECTED_ORDER.length).forEach((video, index) => {
      const expectedId = EXPECTED_ORDER[index]
      const isCorrect = video.id === expectedId
      const status = isCorrect ? '✅' : '❌'
      
      console.log(`${status} Position ${index + 1}: ${video.title}`)
      console.log(`   ID: ${video.id}`)
      if (!isCorrect) {
        console.log(`   ⚠️  Attendu: ${expectedId}`)
        allCorrect = false
      }
      console.log('')
    })
    
    if (allCorrect && sortedVideos.length >= EXPECTED_ORDER.length) {
      console.log('✅ L\'ordre est correct !\n')
    } else {
      console.log('❌ L\'ordre n\'est pas correct.\n')
    }
    
    // Afficher les vidéos supplémentaires (non ordonnées)
    if (sortedVideos.length > EXPECTED_ORDER.length) {
      console.log(`📌 ${sortedVideos.length - EXPECTED_ORDER.length} vidéo(s) supplémentaire(s) (non ordonnées):\n`)
      sortedVideos.slice(EXPECTED_ORDER.length).forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.title} (ID: ${video.id})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    process.exit(1)
  }
}

testMachineProgramOrder()
















