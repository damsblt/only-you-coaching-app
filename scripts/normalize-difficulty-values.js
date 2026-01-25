/**
 * Script pour normaliser les valeurs de difficulty en minuscules
 * Convertir BEGINNER → debutant, INTERMEDIATE → intermediaire, ADVANCED → avance
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function normalizeDifficulty() {
  console.log('\n🔄 Normalisation des valeurs de difficulty...\n')
  
  // Compter les valeurs à normaliser
  const beforeCounts = await sql`
    SELECT 
      difficulty,
      COUNT(*) as count
    FROM videos_new
    WHERE difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'indéfini')
    GROUP BY difficulty
  `
  
  if (beforeCounts.length === 0) {
    console.log('✅ Aucune valeur à normaliser!\n')
    return
  }
  
  console.log('📊 Valeurs à normaliser :\n')
  beforeCounts.forEach(row => {
    console.log(`- ${row.difficulty} : ${row.count} vidéos`)
  })
  console.log()
  
  // Normaliser
  const result = await sql`
    UPDATE videos_new
    SET 
      difficulty = CASE
        WHEN difficulty = 'BEGINNER' THEN 'debutant'
        WHEN difficulty = 'INTERMEDIATE' THEN 'intermediaire'
        WHEN difficulty = 'ADVANCED' THEN 'avance'
        WHEN difficulty = 'indéfini' THEN 'intermediaire'
        ELSE difficulty
      END,
      "updatedAt" = NOW()
    WHERE difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'indéfini')
  `
  
  console.log(`✅ ${result.length || result.rowCount || 'Plusieurs'} vidéos normalisées\n`)
  
  // Vérifier après
  const afterCounts = await sql`
    SELECT 
      difficulty,
      COUNT(*) as count
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    GROUP BY difficulty
    ORDER BY count DESC
  `
  
  console.log('📊 Distribution après normalisation :\n')
  afterCounts.forEach(row => {
    const difficulty = row.difficulty || '(vide)'
    console.log(`- ${difficulty.padEnd(20)} : ${row.count} vidéos`)
  })
  console.log()
  
  console.log('✅ Normalisation terminée!\n')
}

normalizeDifficulty()
