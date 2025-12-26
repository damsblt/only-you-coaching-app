/**
 * Script pour mettre à jour les métadonnées des vidéos depuis les fichiers Word
 * 
 * Ce script prend un fichier JSON avec les métadonnées extraites des fichiers Word
 * et met à jour les vidéos correspondantes dans Neon.
 * 
 * Format du fichier JSON attendu:
 * [
 *   {
 *     "videoNumber": 46,
 *     "region": "machine",
 *     "muscleCible": "Abdominaux",
 *     "positionDepart": "Allongé sur le dos",
 *     "mouvement": "Relever le buste",
 *     "intensite": "Moyenne",
 *     "serie": "3x15",
 *     "contreIndication": "Problèmes de dos"
 *   },
 *   ...
 * ]
 * 
 * Usage: node scripts/update-video-metadata-from-word.js <fichier-json>
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

/**
 * Extrait le numéro de vidéo depuis l'URL ou le titre
 */
function extractVideoNumber(videoUrl, title) {
  const urlMatch = videoUrl.match(/(?:^|\/)(\d+)(?:\.|[-_])/i)
  if (urlMatch) {
    return parseInt(urlMatch[1], 10)
  }
  
  const titleMatch = title.match(/^(\d+)(?:\.|\s)/)
  if (titleMatch) {
    return parseInt(titleMatch[1], 10)
  }
  
  return null
}

/**
 * Trouve une vidéo par son numéro et sa région
 */
async function findVideoByNumber(sql, videoNumber, region) {
  const videos = await sql`
    SELECT id, title, "videoUrl"
    FROM videos_new
    WHERE region = ${region} 
      AND category = 'Predefined Programs'
      AND "videoType" = 'PROGRAMMES'
      AND "isPublished" = true
  `
  
  for (const video of videos) {
    const number = extractVideoNumber(video.videoUrl, video.title)
    if (number === videoNumber) {
      return video
    }
  }
  
  return null
}

async function updateVideoMetadata(jsonFilePath) {
  console.log('🔄 Mise à jour des métadonnées des vidéos...\n')
  
  // Lire le fichier JSON
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ Fichier non trouvé: ${jsonFilePath}`)
    process.exit(1)
  }
  
  const metadata = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'))
  
  if (!Array.isArray(metadata)) {
    console.error('❌ Le fichier JSON doit contenir un tableau de métadonnées')
    process.exit(1)
  }
  
  const sql = neon(databaseUrl)
  
  let updatedCount = 0
  let notFoundCount = 0
  const errors = []
  
  for (const item of metadata) {
    try {
      const { videoNumber, region, muscleCible, positionDepart, mouvement, intensite, serie, contreIndication } = item
      
      if (!videoNumber || !region) {
        console.warn(`⚠️  Élément ignoré (numéro ou région manquant):`, item)
        continue
      }
      
      // Trouver la vidéo
      const video = await findVideoByNumber(sql, videoNumber, region)
      
      if (!video) {
        console.warn(`⚠️  Vidéo ${videoNumber} non trouvée pour la région ${region}`)
        notFoundCount++
        continue
      }
      
      // Helper function to remove trailing dots
      const removeTrailingDot = (text) => {
        if (!text) return text
        return text.trim().replace(/\.$/, '')
      }
      
      // Préparer les données de mise à jour
      const updateData = {
        updatedAt: new Date().toISOString()
      }
      
      // Mapper les champs Word vers les champs Neon
      if (muscleCible) {
        // muscleCible -> region (si différent) ou muscleGroups
        // Pour l'instant, on garde region tel quel et on pourrait ajouter à muscleGroups
      }
      
      if (positionDepart) {
        updateData.startingPosition = positionDepart
      }
      
      if (mouvement) {
        updateData.movement = mouvement
      }
      
      if (intensite) {
        updateData.intensity = removeTrailingDot(intensite)
      }
      
      if (serie) {
        updateData.series = removeTrailingDot(serie)
      }
      
      if (contreIndication) {
        updateData.constraints = removeTrailingDot(contreIndication)
      }
      
      // Mettre à jour la vidéo
      const setClause = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
      const values = Object.values(updateData)
      values.push(video.id)
      
      await sql.query(
        `UPDATE videos_new SET ${setClause} WHERE id = $${values.length} RETURNING id, title`,
        values
      )
      
      console.log(`✅ Vidéo ${videoNumber} (${video.title}) mise à jour`)
      updatedCount++
      
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour de la vidéo ${item.videoNumber}:`, error.message)
      errors.push({ videoNumber: item.videoNumber, error: error.message })
    }
  }
  
  console.log(`\n📊 Résumé:`)
  console.log(`   ✅ Mises à jour: ${updatedCount}`)
  console.log(`   ⚠️  Non trouvées: ${notFoundCount}`)
  console.log(`   ❌ Erreurs: ${errors.length}`)
  
  if (errors.length > 0) {
    console.log(`\n❌ Erreurs détaillées:`)
    errors.forEach(err => {
      console.log(`   - Vidéo ${err.videoNumber}: ${err.error}`)
    })
  }
}

// Récupérer le chemin du fichier JSON depuis les arguments
const jsonFilePath = process.argv[2]

if (!jsonFilePath) {
  console.error('❌ Usage: node scripts/update-video-metadata-from-word.js <fichier-json>')
  console.error('   Exemple: node scripts/update-video-metadata-from-word.js data/machine-metadata.json')
  process.exit(1)
}

updateVideoMetadata(jsonFilePath)
  .then(() => {
    console.log('\n✅ Terminé !')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

