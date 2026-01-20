#!/usr/bin/env node
/**
 * Script pour normaliser toutes les valeurs de difficulté vers les valeurs standardisées
 * (BEGINNER, INTERMEDIATE, ADVANCED)
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

/**
 * Normalise les valeurs de difficulté vers les valeurs standardisées
 */
function normalizeDifficulty(value) {
  if (!value) return null
  
  const lower = value.toLowerCase().trim()
  
  // Mapping vers les valeurs standardisées (majuscules)
  if (lower.includes('debutant') || lower.includes('débutant') || lower.includes('beginner')) {
    return 'BEGINNER'
  }
  if (lower.includes('intermediaire') || lower.includes('intermédiaire') || lower.includes('intermediate')) {
    return 'INTERMEDIATE'
  }
  if (lower.includes('avance') || lower.includes('avancé') || lower.includes('advanced')) {
    return 'ADVANCED'
  }
  
  return null
}

async function normalizeDifficultyValues() {
  try {
    console.log('🔄 Normalisation des valeurs de difficulté...\n')
    
    // Récupérer toutes les vidéos avec valeurs non standardisées
    const videos = await sql`
      SELECT 
        id,
        title,
        difficulty
      FROM videos_new
      WHERE "isPublished" = true
      AND difficulty IS NOT NULL
      AND difficulty NOT IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')
      ORDER BY difficulty, title
    `
    
    console.log(`📹 ${videos.length} vidéos à normaliser\n`)
    
    let updatedCount = 0
    const stats = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0
    }
    
    for (const video of videos) {
      const normalized = normalizeDifficulty(video.difficulty)
      
      if (!normalized) {
        console.log(`⚠️  Impossible de normaliser: ${video.title} (${video.difficulty})`)
        continue
      }
      
      // Mettre à jour la vidéo
      await sql`
        UPDATE videos_new
        SET 
          difficulty = ${normalized},
          "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      
      console.log(`✅ ${video.title.substring(0, 50)}... → ${normalized} (était: ${video.difficulty})`)
      updatedCount++
      stats[normalized]++
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(80))
    console.log(`   Total vidéos normalisées: ${updatedCount}`)
    console.log('\n📈 Répartition par niveau:')
    console.log(`   BEGINNER: ${stats.BEGINNER}`)
    console.log(`   INTERMEDIATE: ${stats.INTERMEDIATE}`)
    console.log(`   ADVANCED: ${stats.ADVANCED}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

normalizeDifficultyValues()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
