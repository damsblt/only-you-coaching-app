/**
 * Script pour vérifier et corriger "DV couché ballon + barre libre"
 * selon les métadonnées du fichier
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function checkDvMetadataMatch() {
  try {
    const videoTitle = 'DV couché ballon + barre libre'
    const videoId = 'afb1c96f-4591-41fc-90ff-996d8bcab813'
    
    console.log(`🔍 Vérification de la vidéo: "${videoTitle}"\n`)
    
    // Selon le fichier metadonnees-completes.md ligne 1281-1301:
    // - Intensité : Intermédiaire et avancé
    // - Pas de champ "Difficulté" mentionné
    
    const expectedIntensity = 'Intermédiaire et avancé'
    
    // Récupérer la vidéo actuelle
    const videos = await sql`
      SELECT 
        id,
        title,
        difficulty,
        intensity,
        "muscleGroups",
        "startingPosition",
        movement,
        series,
        constraints,
        theme
      FROM videos_new
      WHERE id = ${videoId}
    `
    
    if (videos.length === 0) {
      console.log(`❌ Vidéo non trouvée avec l'ID: ${videoId}`)
      return
    }
    
    const video = videos[0]
    
    console.log(`📋 État actuel dans Neon:`)
    console.log(`   Titre: "${video.title}"`)
    console.log(`   Difficulté: "${video.difficulty || 'N/A'}"`)
    console.log(`   Intensité: "${video.intensity || 'N/A'}"`)
    console.log(`\n`)
    
    console.log(`📋 Valeurs attendues selon le fichier:`)
    console.log(`   Intensité: "${expectedIntensity}"`)
    console.log(`   Difficulté: (non mentionnée dans le fichier)`)
    console.log(`\n`)
    
    // Vérifier l'intensité
    const intensityMatches = video.intensity === expectedIntensity
    
    if (intensityMatches) {
      console.log(`✅ Intensité correcte: "${video.intensity}"`)
    } else {
      console.log(`❌ Intensité incorrecte:`)
      console.log(`   Actuelle: "${video.intensity || 'N/A'}"`)
      console.log(`   Attendue: "${expectedIntensity}"`)
    }
    
    // Pour la difficulté, comme elle n'est pas mentionnée dans le fichier,
    // on peut soit la laisser vide (NULL), soit la mettre à "avance" (niveau le plus élevé)
    // car l'intensité indique "Intermédiaire et avancé"
    
    console.log(`\n💡 Note: Le fichier ne mentionne pas de "Difficulté".`)
    console.log(`   L'intensité est "${expectedIntensity}".`)
    console.log(`   La difficulté actuelle est "${video.difficulty || 'NULL'}"`)
    
    // Si l'intensité est correcte, on peut soit:
    // 1. Laisser la difficulté à "avance" (niveau le plus élevé)
    // 2. Mettre la difficulté à NULL (puisque non mentionnée dans le fichier)
    // 3. Mettre la difficulté à "intermediaire" (niveau intermédiaire)
    
    // Je vais proposer de mettre la difficulté à NULL puisque le fichier ne la mentionne pas
    // Mais d'abord, vérifions si l'intensité est correcte
    
    if (!intensityMatches) {
      console.log(`\n🔄 Correction de l'intensité...`)
      const updateResult = await sql`
        UPDATE videos_new 
        SET 
          intensity = ${expectedIntensity},
          "updatedAt" = ${new Date().toISOString()}::timestamp with time zone
        WHERE id = ${videoId}
        RETURNING id, title, difficulty, intensity
      `
      
      if (updateResult && updateResult.length > 0) {
        console.log(`✅ Intensité mise à jour!`)
        console.log(`   Nouvelle intensité: "${updateResult[0].intensity}"`)
      }
    }
    
    // Pour la difficulté, comme elle n'est pas dans le fichier, on peut la mettre à NULL
    // ou la garder à "avance" (niveau le plus élevé). Je vais demander confirmation.
    
    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   Intensité dans Neon: "${video.intensity}"`)
    console.log(`   Intensité attendue: "${expectedIntensity}"`)
    console.log(`   Difficulté dans Neon: "${video.difficulty || 'NULL'}"`)
    console.log(`   Difficulté dans le fichier: (non mentionnée)`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

// Exécuter le script
checkDvMetadataMatch()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
