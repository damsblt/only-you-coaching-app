/**
 * Script pour mettre à jour les exercices avec "tout niveau" 
 * pour avoir difficulty = NULL au lieu de "intermediaire"
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Erreur: DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function updateToutNiveauToNull() {
  console.log('')
  console.log('Mise a jour des exercices "tout niveau" vers difficulty = NULL...')
  console.log('')
  
  // Compter avant
  const beforeCount = await sql`
    SELECT COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND LOWER(intensity) LIKE '%tout niveau%'
      AND difficulty = 'intermediaire'
  `
  
  console.log(`Exercices a mettre a jour: ${beforeCount[0].count}`)
  console.log('')
  
  if (beforeCount[0].count === 0) {
    console.log('Aucun exercice a mettre a jour!')
    return
  }
  
  // Afficher quelques exemples
  const examples = await sql`
    SELECT title, intensity, difficulty
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND LOWER(intensity) LIKE '%tout niveau%'
      AND difficulty = 'intermediaire'
    LIMIT 5
  `
  
  console.log('Exemples avant modification:')
  examples.forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.title}`)
    console.log(`   Intensite: "${ex.intensity}"`)
    console.log(`   Difficulte actuelle: "${ex.difficulty}"`)
    console.log('')
  })
  
  // Mettre à jour
  const result = await sql`
    UPDATE videos_new
    SET difficulty = NULL,
        "updatedAt" = NOW()
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND LOWER(intensity) LIKE '%tout niveau%'
      AND difficulty = 'intermediaire'
  `
  
  console.log('='.repeat(80))
  console.log('Mise a jour terminee!')
  console.log('='.repeat(80))
  console.log('')
  
  // Vérifier après
  const afterCount = await sql`
    SELECT COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
      AND LOWER(intensity) LIKE '%tout niveau%'
      AND difficulty IS NULL
  `
  
  console.log(`Exercices "tout niveau" avec difficulty = NULL: ${afterCount[0].count}`)
  console.log('')
  
  // Distribution finale
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
  
  console.log('Distribution finale des difficultes:')
  console.log('')
  distribution.forEach(row => {
    const diff = row.difficulty || '(NULL - Tout niveau)'
    console.log(`  ${diff.padEnd(30)} : ${row.count} videos`)
  })
  console.log('')
}

updateToutNiveauToNull()
