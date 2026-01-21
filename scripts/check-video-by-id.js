/**
 * Script pour vérifier une vidéo dans la base de données par son ID
 */

import { neon } from '@neondatabase/serverless'
import ws from 'ws'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Configure Neon for Node.js
if (typeof window === 'undefined') {
  const { neonConfig } = await import('@neondatabase/serverless')
  neonConfig.webSocketConstructor = ws
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(databaseUrl)

const videoId = '1bd80754-5e78-4365-88b9-800bcc67741d'

console.log('🔍 Recherche de la vidéo avec l\'ID:', videoId)
console.log('')

try {
  const result = await sql`
    SELECT 
      id,
      title,
      description,
      difficulty,
      category,
      region,
      "muscleGroups",
      "videoType",
      "videoUrl",
      thumbnail,
      "isPublished",
      "createdAt",
      "updatedAt"
    FROM videos_new
    WHERE id = ${videoId}
  `

  if (result && result.length > 0) {
    const video = result[0]
    console.log('✅ Vidéo trouvée dans la base de données!')
    console.log('')
    console.log('📋 Informations de la vidéo:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID: ${video.id}`)
    console.log(`Titre: ${video.title || 'N/A'}`)
    console.log(`Description: ${video.description || 'N/A'}`)
    console.log(`Difficulté: ${video.difficulty || 'N/A'}`)
    console.log(`Catégorie: ${video.category || 'N/A'}`)
    console.log(`Région: ${video.region || 'N/A'}`)
    console.log(`Groupes musculaires: ${video.muscleGroups ? JSON.stringify(video.muscleGroups) : 'N/A'}`)
    console.log(`Type de vidéo: ${video.videoType || 'N/A'}`)
    console.log(`URL vidéo: ${video.videoUrl || 'N/A'}`)
    console.log(`Thumbnail: ${video.thumbnail || 'N/A'}`)
    console.log(`Publiée: ${video.isPublished ? 'Oui' : 'Non'}`)
    console.log(`Créée le: ${video.createdAt || 'N/A'}`)
    console.log(`Modifiée le: ${video.updatedAt || 'N/A'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } else {
    console.log('❌ Vidéo NON trouvée dans la base de données')
    console.log('')
    console.log('💡 La vidéo est référencée dans le code mais n\'existe pas dans la base de données.')
    console.log('   Elle devrait être ajoutée à la table videos_new.')
  }
} catch (error) {
  console.error('❌ Erreur lors de la requête:', error)
  process.exit(1)
}

process.exit(0)
