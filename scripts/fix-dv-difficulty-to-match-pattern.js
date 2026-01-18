/**
 * Script pour corriger la difficulté de "DV couché ballon + barre libre"
 * pour qu'elle corresponde au pattern utilisé pour les autres vidéos
 * avec intensité "Intermédiaire et avancé" (difficulté = "intermediaire")
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function fixDvDifficultyToMatchPattern() {
  try {
    const videoTitle = 'DV couché ballon + barre libre'
    const videoId = 'afb1c96f-4591-41fc-90ff-996d8bcab813'
    
    console.log(`🔍 Correction de la difficulté pour: "${videoTitle}"\n`)
    
    // Récupérer la vidéo actuelle
    const videos = await sql`
      SELECT 
        id,
        title,
        difficulty,
        intensity
      FROM videos_new
      WHERE id = ${videoId}
    `
    
    if (videos.length === 0) {
      console.log(`❌ Vidéo non trouvée avec l'ID: ${videoId}`)
      return
    }
    
    const video = videos[0]
    
    console.log(`📋 État actuel:`)
    console.log(`   Titre: "${video.title}"`)
    console.log(`   Difficulté: "${video.difficulty || 'N/A'}"`)
    console.log(`   Intensité: "${video.intensity || 'N/A'}"`)
    console.log(`\n`)
    
    // Selon le pattern observé, les vidéos avec intensité "Intermédiaire et avancé"
    // ont la difficulté "intermediaire"
    const expectedDifficulty = 'intermediaire'
    
    if (video.difficulty === expectedDifficulty) {
      console.log(`✅ La difficulté est déjà correcte: "${video.difficulty}"`)
      return
    }
    
    console.log(`🔄 Mise à jour de la difficulté...`)
    console.log(`   Ancienne: "${video.difficulty}"`)
    console.log(`   Nouvelle: "${expectedDifficulty}"`)
    console.log(`   (Pattern: intensité "Intermédiaire et avancé" → difficulté "intermediaire")`)
    console.log(`\n`)
    
    // Mettre à jour la difficulté
    const updateResult = await sql`
      UPDATE videos_new 
      SET 
        difficulty = ${expectedDifficulty},
        "updatedAt" = ${new Date().toISOString()}::timestamp with time zone
      WHERE id = ${videoId}
      RETURNING id, title, difficulty, intensity
    `
    
    if (updateResult && updateResult.length > 0) {
      const updated = updateResult[0]
      console.log(`✅ Mise à jour réussie!`)
      console.log(`   Titre: "${updated.title}"`)
      console.log(`   Difficulté: "${updated.difficulty}"`)
      console.log(`   Intensité: "${updated.intensity}"`)
      console.log(`\n`)
      console.log(`✅ La vidéo correspond maintenant au pattern utilisé pour toutes les autres vidéos`)
      console.log(`   avec intensité "Intermédiaire et avancé".`)
    } else {
      console.log(`❌ Aucune ligne mise à jour`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

// Exécuter le script
fixDvDifficultyToMatchPattern()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
