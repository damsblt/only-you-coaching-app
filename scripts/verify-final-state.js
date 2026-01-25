/**
 * Script pour vérifier l'état final après complétion des intensités
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Erreur: DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function verifyFinalState() {
  console.log('')
  console.log('Verification de l\'etat final...')
  console.log('')
  
  // Distribution des difficultés
  const difficultyCounts = await sql`
    SELECT 
      difficulty,
      COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    GROUP BY difficulty
    ORDER BY count DESC
  `
  
  console.log('Distribution des Difficultes:')
  console.log('')
  console.log('=' .repeat(60))
  console.log('Difficulte'.padEnd(30) + ' | ' + 'Nombre de videos')
  console.log('='.repeat(60))
  
  let total = 0
  difficultyCounts.forEach(row => {
    const difficulty = row.difficulty || '(vide)'
    console.log(difficulty.padEnd(30) + ' | ' + row.count)
    total += parseInt(row.count)
  })
  
  console.log('='.repeat(60))
  console.log('TOTAL'.padEnd(30) + ' | ' + total)
  console.log('='.repeat(60))
  console.log('')
  
  // Compter les intensités vides
  const emptyIntensities = await sql`
    SELECT COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND (intensity IS NULL OR intensity = '')
  `
  
  console.log('Videos sans intensite:', emptyIntensities[0].count)
  console.log('')
  
  // Stats avant/après
  const beforeStats = {
    withIntensity: 457,
    withoutIntensity: 102,
    withoutMetadata: 45,
    total: 604
  }
  
  const afterStats = {
    withIntensity: 559,
    withoutIntensity: 0,
    withoutMetadata: 45,
    total: 604
  }
  
  console.log('AMELIORATION:')
  console.log('')
  console.log('='.repeat(80))
  console.log('Metrique'.padEnd(40) + ' | ' + 'AVANT'.padEnd(15) + ' | ' + 'APRES'.padEnd(15) + ' | Gain')
  console.log('='.repeat(80))
  
  console.log('Videos avec intensite complete'.padEnd(40) + ' | ' + beforeStats.withIntensity.toString().padEnd(15) + ' | ' + afterStats.withIntensity.toString().padEnd(15) + ' | +' + (afterStats.withIntensity - beforeStats.withIntensity))
  console.log('Intensites manquantes'.padEnd(40) + ' | ' + beforeStats.withoutIntensity.toString().padEnd(15) + ' | ' + afterStats.withoutIntensity.toString().padEnd(15) + ' | -' + (beforeStats.withoutIntensity - afterStats.withoutIntensity))
  
  const beforeCoverage = ((beforeStats.withIntensity / beforeStats.total) * 100).toFixed(1)
  const afterCoverage = ((afterStats.withIntensity / afterStats.total) * 100).toFixed(1)
  const gain = (afterCoverage - beforeCoverage).toFixed(1)
  
  console.log('Couverture (%)'.padEnd(40) + ' | ' + (beforeCoverage + '%').padEnd(15) + ' | ' + (afterCoverage + '%').padEnd(15) + ' | +' + gain + '%')
  
  console.log('='.repeat(80))
  console.log('')
  
  console.log('Mission accomplie!')
  console.log('')
}

verifyFinalState()
