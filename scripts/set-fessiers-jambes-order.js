/**
 * Script pour définir l'ordre d'affichage des vidéos Fessiers-Jambes
 * Extrait l'ordre depuis les noms de fichiers S3
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function setFessiersJambesOrder() {
  console.log('🔄 Définition de l\'ordre des vidéos Fessiers-Jambes...\n')
  
  try {
    // Récupérer toutes les vidéos fessiers-jambes
    const allVideos = await sql`
      SELECT id, title, "videoUrl"
      FROM videos_new
      WHERE "videoUrl" LIKE '%groupes-musculaires/fessiers-jambes%'
    `
    
    console.log(`📦 ${allVideos.length} vidéos Fessiers-Jambes trouvées dans la base\n`)
    
    let updatedCount = 0
    let skippedCount = 0

    for (const video of allVideos) {
      // Extraire le numéro du nom de fichier depuis l'URL
      const urlParts = video.videoUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      const match = filename.match(/^(\d+(\.\d+)?)/)
      
      if (match) {
        const order = match[1]
        
        // Mettre à jour l'ordre de la vidéo
        await sql`
          UPDATE videos_new
          SET 
            exo_title = ${order},
            "updatedAt" = NOW()
          WHERE id = ${video.id}
        `
        
        console.log(`✅ Ordre ${order}: ${video.title}`)
        updatedCount++
      } else {
        console.log(`⚠️  Pas de numéro trouvé pour: ${video.title}`)
        skippedCount++
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⚠️  Sans numéro: ${skippedCount}`)
    
    console.log(`\n✅ Ordre défini!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

setFessiersJambesOrder()
