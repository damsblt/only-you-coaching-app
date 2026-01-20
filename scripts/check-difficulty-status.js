#!/usr/bin/env node
/**
 * Script pour vérifier le statut des niveaux de difficulté dans la base de données
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function checkDifficultyStatus() {
  try {
    console.log('🔍 Vérification du statut des niveaux de difficulté...\n')
    
    // Statistiques générales
    const stats = await sql`
      SELECT 
        difficulty,
        COUNT(*) as count
      FROM videos_new
      WHERE "isPublished" = true
      GROUP BY difficulty
      ORDER BY count DESC
    `
    
    console.log('📊 Répartition par niveau:')
    console.log('='.repeat(60))
    for (const stat of stats) {
      console.log(`   ${stat.difficulty || 'NULL'}: ${stat.count} vidéos`)
    }
    console.log('='.repeat(60))
    
    // Vidéos sans niveau
    const noDifficulty = await sql`
      SELECT COUNT(*) as count
      FROM videos_new
      WHERE "isPublished" = true
      AND (difficulty IS NULL OR difficulty = '')
    `
    
    console.log(`\n⚠️  Vidéos sans niveau: ${noDifficulty[0].count}`)
    
    // Vidéos avec valeurs non standardisées (minuscules)
    const nonStandard = await sql`
      SELECT 
        difficulty,
        COUNT(*) as count
      FROM videos_new
      WHERE "isPublished" = true
      AND difficulty IS NOT NULL
      AND difficulty NOT IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')
      GROUP BY difficulty
      ORDER BY count DESC
    `
    
    if (nonStandard.length > 0) {
      console.log(`\n⚠️  Vidéos avec valeurs non standardisées:`)
      for (const stat of nonStandard) {
        console.log(`   ${stat.difficulty}: ${stat.count} vidéos`)
      }
    } else {
      console.log(`\n✅ Toutes les vidéos ont des valeurs standardisées`)
    }
    
    // Total
    const total = await sql`
      SELECT COUNT(*) as count
      FROM videos_new
      WHERE "isPublished" = true
    `
    
    console.log(`\n📹 Total vidéos publiées: ${total[0].count}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

checkDifficultyStatus()
  .then(() => {
    console.log('\n✅ Vérification terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
