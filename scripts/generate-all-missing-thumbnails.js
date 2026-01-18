/**
 * Script pour générer tous les thumbnails manquants
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fetch = require('node-fetch')

const databaseUrl = process.env.DATABASE_URL
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function generateThumbnail(videoId) {
  try {
    const response = await fetch(`${baseUrl}/api/videos/${videoId}/generate-thumbnail`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }
    
    const result = await response.json()
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('\n🎬 Génération des thumbnails manquants...\n')
  
  // Récupérer toutes les vidéos sans thumbnail
  const videosWithoutThumbnail = await sql`
    SELECT id, title, region, "videoUrl"
    FROM videos_new
    WHERE "videoType" = 'MUSCLE_GROUPS'
    AND (thumbnail IS NULL OR thumbnail = '')
    ORDER BY region, exo_title, title
  `
  
  console.log(`📹 ${videosWithoutThumbnail.length} vidéos sans thumbnail\n`)
  
  if (videosWithoutThumbnail.length === 0) {
    console.log('✅ Tous les thumbnails sont déjà générés!\n')
    return
  }
  
  let successCount = 0
  let errorCount = 0
  let currentRegion = ''
  
  for (let i = 0; i < videosWithoutThumbnail.length; i++) {
    const video = videosWithoutThumbnail[i]
    
    if (video.region !== currentRegion) {
      currentRegion = video.region
      console.log(`\n📦 Région: ${currentRegion}`)
    }
    
    const result = await generateThumbnail(video.id)
    
    if (result.success) {
      console.log(`✅ [${i + 1}/${videosWithoutThumbnail.length}] ${video.title}`)
      successCount++
    } else {
      console.log(`❌ [${i + 1}/${videosWithoutThumbnail.length}] ${video.title}`)
      console.log(`   Erreur: ${result.error}`)
      errorCount++
    }
    
    // Attendre 500ms entre chaque génération pour éviter de surcharger
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RÉSUMÉ')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Thumbnails générés: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`${'='.repeat(60)}\n`)
  
  console.log('✅ Génération terminée!\n')
}

main()
