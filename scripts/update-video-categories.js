/**
 * Script pour mettre à jour les catégories des vidéos existantes
 * selon leur chemin S3 (programmes-predefinis/ ou groupes-musculaires/)
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

async function updateCategories() {
  console.log('🔄 Mise à jour des catégories des vidéos...\n')
  
  const sql = neon(databaseUrl)
  
  try {
    // Mettre à jour les vidéos de programmes-predefinis
    console.log('1️⃣ Mise à jour des vidéos "programmes-predefinis" → "Predefined Programs"...')
    const result1 = await sql`
      UPDATE videos_new
      SET category = 'Predefined Programs'
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
        AND (category IS NULL OR category != 'Predefined Programs')
    `
    console.log(`   ✅ ${result1.count || result1.rowCount || 'N/A'} vidéo(s) mise(s) à jour\n`)
    
    // Mettre à jour les vidéos de groupes-musculaires
    console.log('2️⃣ Mise à jour des vidéos "groupes-musculaires" → "Muscle Groups"...')
    const result2 = await sql`
      UPDATE videos_new
      SET category = 'Muscle Groups'
      WHERE "videoUrl" LIKE '%groupes-musculaires%'
        AND (category IS NULL OR category != 'Muscle Groups')
    `
    console.log(`   ✅ ${result2.count || result2.rowCount || 'N/A'} vidéo(s) mise(s) à jour\n`)
    
    // Afficher un résumé
    console.log('3️⃣ Résumé des catégories:')
    const summary = await sql`
      SELECT category, COUNT(*) as count
      FROM videos_new
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `
    
    summary.forEach(row => {
      console.log(`   - ${row.category}: ${row.count} vidéo(s)`)
    })
    
    console.log('\n✅ Mise à jour terminée!\n')
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

updateCategories()


















