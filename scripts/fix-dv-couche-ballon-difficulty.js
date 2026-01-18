/**
 * Script pour corriger la difficulté de "DV couché ballon + barre libre"
 * pour qu'elle corresponde à l'intensité "Intermédiaire et avancé"
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function fixDvCoucheBallonDifficulty() {
  try {
    const videoTitle = 'DV couché ballon + barre libre'
    const videoId = 'afb1c96f-4591-41fc-90ff-996d8bcab813'
    
    console.log(`🔍 Recherche de la vidéo: "${videoTitle}"\n`)
    
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
    console.log(`📋 Vidéo actuelle:`)
    console.log(`   Titre: "${video.title}"`)
    console.log(`   Difficulté actuelle: "${video.difficulty || 'N/A'}"`)
    console.log(`   Intensité: "${video.intensity || 'N/A'}"`)
    console.log(`\n`)
    
    // Déterminer la nouvelle difficulté basée sur l'intensité
    // L'intensité est "Intermédiaire et avancé", donc la difficulté devrait être "intermediaire" ET "avance"
    // Mais comme difficulty est un champ unique, on peut utiliser "avance" qui est le niveau le plus élevé
    // ou créer une valeur combinée si la contrainte le permet
    
    // Vérifier d'abord si on peut utiliser une valeur combinée
    // Pour l'instant, utilisons "avance" car c'est le niveau le plus élevé
    // Mais idéalement, on devrait avoir une valeur qui reflète les deux niveaux
    
    // Option 1: Utiliser "avance" (niveau le plus élevé)
    const newDifficulty = 'avance'
    
    console.log(`🔄 Mise à jour de la difficulté...`)
    console.log(`   Ancienne: "${video.difficulty}"`)
    console.log(`   Nouvelle: "${newDifficulty}" (basée sur l'intensité "${video.intensity}")`)
    console.log(`\n`)
    
    // Mettre à jour la difficulté
    const updateResult = await sql`
      UPDATE videos_new 
      SET 
        difficulty = ${newDifficulty},
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
      console.log(`💡 Note: La difficulté est maintenant "avance" (niveau le plus élevé)`)
      console.log(`   car l'intensité indique "Intermédiaire et avancé".`)
      console.log(`   Si vous préférez une valeur différente, dites-le moi.`)
    } else {
      console.log(`❌ Aucune ligne mise à jour`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

// Exécuter le script
fixDvCoucheBallonDifficulty()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
