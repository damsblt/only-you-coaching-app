#!/usr/bin/env node
/**
 * Script pour supprimer les lettres "F", "H" ou "X" isolées à la fin des titres dans Neon
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

/**
 * Nettoyer un titre en supprimant " F", " H" ou " X" à la fin
 */
function cleanTitle(title) {
  if (!title) return title
  
  let cleaned = title.trim()
  
  // Supprimer " F", " H" ou " X" à la fin (avec espace avant)
  if (cleaned.endsWith(' F')) {
    cleaned = cleaned.slice(0, -2).trim()
  } else if (cleaned.endsWith(' H')) {
    cleaned = cleaned.slice(0, -2).trim()
  } else if (cleaned.endsWith(' X')) {
    cleaned = cleaned.slice(0, -2).trim()
  }
  
  return cleaned
}

async function removeTrailingFHX() {
  console.log('🔄 Suppression des lettres "F", "H" et "X" isolées à la fin des titres...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // 1. Trouver toutes les vidéos avec des titres se terminant par " F", " H" ou " X"
    const videos = await sql`
      SELECT 
        id,
        title
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "isPublished" = true
      AND (title LIKE '% F' OR title LIKE '% H' OR title LIKE '% X')
      ORDER BY title
    `
    
    console.log(`📋 ${videos.length} vidéos trouvées avec titres se terminant par " F", " H" ou " X"\n`)
    
    if (videos.length === 0) {
      console.log('✅ Aucune vidéo à nettoyer\n')
      return
    }
    
    // 2. Afficher les titres avant/après
    console.log('📋 Titres à nettoyer:\n')
    const updates = []
    
    for (const video of videos) {
      const cleaned = cleanTitle(video.title)
      if (cleaned !== video.title) {
        updates.push({
          id: video.id,
          old: video.title,
          new: cleaned
        })
        console.log(`   "${video.title}" → "${cleaned}"`)
      }
    }
    
    if (updates.length === 0) {
      console.log('\n✅ Aucune modification nécessaire\n')
      return
    }
    
    console.log(`\n📊 ${updates.length} titres à mettre à jour\n`)
    
    // 3. Mettre à jour chaque titre
    let updatedCount = 0
    
    for (const update of updates) {
      await sql`
        UPDATE videos_new
        SET 
          title = ${update.new},
          "updatedAt" = NOW()
        WHERE id = ${update.id}
      `
      updatedCount++
      console.log(`   ✅ "${update.old}" → "${update.new}"`)
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`✅ ${updatedCount} titres mis à jour\n`)
    
    // 4. Vérifier qu'il ne reste plus de titres avec " F", " H" ou " X"
    const remaining = await sql`
      SELECT COUNT(*)::int as count
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "isPublished" = true
      AND (title LIKE '% F' OR title LIKE '% H' OR title LIKE '% X')
    `
    
    if (remaining && remaining.length > 0 && remaining[0].count > 0) {
      console.log(`⚠️  Il reste ${remaining[0].count} vidéos avec " F", " H" ou " X" à la fin\n`)
    } else {
      console.log('✅ Tous les titres ont été nettoyés\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

removeTrailingFHX().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
