/**
 * Script pour vérifier l'exercice "Abduction de hanche assis"
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Erreur: DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function checkAbductionHanche() {
  console.log('')
  console.log('Recherche des exercices "Abduction de hanche assis"...')
  console.log('')
  
  // Chercher tous les exercices contenant "abduction" et "hanche" et "assis"
  const results = await sql`
    SELECT 
      id,
      title,
      region,
      intensity,
      difficulty,
      targeted_muscles,
      "isPublished",
      "videoType"
    FROM videos_new
    WHERE LOWER(title) LIKE '%abduction%'
      AND LOWER(title) LIKE '%hanche%'
      AND LOWER(title) LIKE '%assis%'
      AND "videoType" = 'MUSCLE_GROUPS'
    ORDER BY title
  `
  
  console.log('Resultats trouves:', results.length)
  console.log('')
  console.log('='.repeat(80))
  
  results.forEach((video, index) => {
    console.log(`${index + 1}. ${video.title}`)
    console.log(`   ID: ${video.id}`)
    console.log(`   Region: ${video.region}`)
    console.log(`   Intensite: "${video.intensity}"`)
    console.log(`   Difficulte: "${video.difficulty}"`)
    console.log(`   Muscles: ${video.targeted_muscles ? video.targeted_muscles.join(', ') : '(aucun)'}`)
    console.log(`   Publie: ${video.isPublished ? 'Oui' : 'Non'}`)
    console.log('')
  })
  
  console.log('='.repeat(80))
  console.log('')
  
  // Vérifier le mapping intensité → difficulté
  console.log('ANALYSE DU MAPPING:')
  console.log('')
  
  results.forEach((video) => {
    const intensity = (video.intensity || '').toLowerCase()
    let expectedDifficulty = 'intermediaire' // par défaut
    
    if (intensity.includes('debutant') || intensity.includes('niveau 1')) {
      expectedDifficulty = 'debutant'
    } else if (intensity.includes('avance') || intensity.includes('niveau 2') || intensity.includes('niveau 3')) {
      expectedDifficulty = 'avance'
    } else if (intensity.includes('tout niveau')) {
      expectedDifficulty = 'intermediaire'
    }
    
    const isCorrect = video.difficulty === expectedDifficulty
    
    console.log(`${video.title}:`)
    console.log(`   Intensite: "${video.intensity}"`)
    console.log(`   Difficulte actuelle: "${video.difficulty}"`)
    console.log(`   Difficulte attendue: "${expectedDifficulty}"`)
    console.log(`   ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`)
    console.log('')
  })
}

checkAbductionHanche()
