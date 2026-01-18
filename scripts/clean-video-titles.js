/**
 * Script pour nettoyer les titres des vidéos en retirant les numéros de début
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

function cleanTitle(title) {
  // Retirer le numéro au début (ex: "1. ", "10. ", "1.1 ", etc.)
  let cleaned = title.replace(/^\d+(\.\d+)?\.?\s*/, '').trim()
  
  // Retirer aussi les suffixes inutiles
  cleaned = cleaned
    .replace(/\s+A REFAIRE\s*$/i, '')
    .replace(/\s+A CORRIGER LE NOM\s*$/i, '')
    .replace(/\s+CHANGER LA VIDEO\s*$/i, '')
    .replace(/\s+X\s*$/i, '')
    .replace(/\s+F\s*$/i, '')
    .replace(/\s+H\s*$/i, '')
    .trim()
  
  return cleaned
}

async function main() {
  console.log('\n🧹 Nettoyage des titres des vidéos...\n')
  
  // Récupérer toutes les vidéos
  const allVideos = await sql`
    SELECT id, title
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    ORDER BY region, exo_title, title
  `
  
  console.log(`📹 ${allVideos.length} vidéos à traiter\n`)
  
  let updatedCount = 0
  let unchangedCount = 0
  
  for (const video of allVideos) {
    const cleanedTitle = cleanTitle(video.title)
    
    if (cleanedTitle !== video.title) {
      await sql`
        UPDATE videos_new
        SET title = ${cleanedTitle}, "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      
      if (updatedCount < 10) {
        console.log(`✅ ${video.title} → ${cleanedTitle}`)
      } else if (updatedCount === 10) {
        console.log('...')
      }
      
      updatedCount++
    } else {
      unchangedCount++
    }
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Titres nettoyés: ${updatedCount}`)
  console.log(`⏭️  Titres inchangés: ${unchangedCount}`)
  console.log(`${'='.repeat(60)}\n`)
  
  console.log('✅ Nettoyage terminé!\n')
}

main()
