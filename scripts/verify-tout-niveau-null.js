/**
 * Script pour vérifier que les exercices "tout niveau" ont bien difficulty = NULL
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Erreur: DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function verifyToutNiveauNull() {
  console.log('')
  console.log('Verification des exercices "tout niveau"...')
  console.log('')
  
  // Compter les exercices "tout niveau" avec difficulty = NULL
  const correctCount = await sql`
    SELECT COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND LOWER(intensity) LIKE '%tout niveau%'
      AND difficulty IS NULL
  `
  
  // Compter les exercices "tout niveau" avec difficulty != NULL (erreurs)
  const incorrectCount = await sql`
    SELECT COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND LOWER(intensity) LIKE '%tout niveau%'
      AND difficulty IS NOT NULL
  `
  
  console.log('='.repeat(80))
  console.log('RESULTATS')
  console.log('='.repeat(80))
  console.log(`Exercices "tout niveau" avec difficulty = NULL: ${correctCount[0].count} ✅`)
  console.log(`Exercices "tout niveau" avec difficulty != NULL: ${incorrectCount[0].count} ${incorrectCount[0].count > 0 ? '❌' : '✅'}`)
  console.log('='.repeat(80))
  console.log('')
  
  // Afficher quelques exemples
  const examples = await sql`
    SELECT title, intensity, difficulty
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND LOWER(intensity) LIKE '%tout niveau%'
      AND difficulty IS NULL
    LIMIT 5
  `
  
  console.log('Exemples d\'exercices "tout niveau" (difficulty = NULL):')
  examples.forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.title}`)
    console.log(`   Intensite: "${ex.intensity}"`)
    console.log(`   Difficulte: NULL ✅`)
    console.log('')
  })
  
  // Distribution complète
  const distribution = await sql`
    SELECT 
      difficulty,
      COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    GROUP BY difficulty
    ORDER BY 
      CASE 
        WHEN difficulty IS NULL THEN 0
        WHEN difficulty = 'debutant' THEN 1
        WHEN difficulty = 'intermediaire' THEN 2
        WHEN difficulty = 'avance' THEN 3
        ELSE 4
      END
  `
  
  console.log('Distribution complete:')
  console.log('')
  distribution.forEach(row => {
    const diff = row.difficulty || 'NULL (Tout niveau)'
    console.log(`  ${diff.padEnd(30)} : ${row.count} videos`)
  })
  console.log('')
}

verifyToutNiveauNull()
