#!/usr/bin/env node
/**
 * Script pour identifier les vidéos qui avaient des doublons par URL
 * Analyse les patterns pour trouver les URLs qui pourraient avoir été dupliquées
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

async function identifyDuplicateUrls() {
  console.log('🔍 Identification des vidéos qui avaient des doublons par URL\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // Le script de nettoyage a trouvé 4 URLs avec doublons et supprimé 16 doublons
    // Cela signifie qu'il y avait probablement 4-5 vidéos par URL
    
    // Cherchons les vidéos qui ont des patterns similaires qui pourraient indiquer
    // qu'elles étaient des doublons (même URL mais encodage différent, etc.)
    
    // 1. Chercher les vidéos avec des URLs très similaires (même chemin mais encodage différent)
    console.log('📊 Analyse des URLs similaires...\n')
    
    const similarUrls = await sql`
      WITH url_parts AS (
        SELECT 
          id,
          title,
          "videoUrl",
          region,
          "videoNumber",
          "createdAt",
          -- Extraire le chemin sans l'encodage
          REGEXP_REPLACE("videoUrl", '%[0-9A-F]{2}', '', 'g') as url_normalized
        FROM videos_new
        WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "videoUrl" IS NOT NULL
      )
      SELECT 
        url_normalized,
        COUNT(*) as count,
        ARRAY_AGG(title ORDER BY "createdAt" DESC) as titles,
        ARRAY_AGG("videoUrl" ORDER BY "createdAt" DESC) as urls,
        ARRAY_AGG(region ORDER BY "createdAt" DESC) as regions,
        ARRAY_AGG("videoNumber" ORDER BY "createdAt" DESC) as numbers
      FROM url_parts
      GROUP BY url_normalized
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `
    
    if (similarUrls.length > 0) {
      console.log(`   ⚠️  ${similarUrls.length} groupes d'URLs similaires trouvés\n`)
      similarUrls.forEach((group, i) => {
        console.log(`\n${i + 1}. Groupe avec ${group.count} URLs similaires:`)
        console.log(`   Chemin normalisé: ${group.url_normalized.substring(0, 100)}...`)
        console.log(`   Titres: ${group.titles.slice(0, 3).join(', ')}`)
        console.log(`   Régions: ${group.regions.join(', ')}`)
        console.log(`   Numbers: ${group.numbers.filter(n => n !== null).join(', ')}`)
      })
    } else {
      console.log('   ✅ Aucun groupe d\'URLs similaires trouvé\n')
    }
    
    // 2. Chercher les vidéos créées exactement au même moment (probablement des doublons)
    console.log('\n📊 Analyse des vidéos créées au même moment...\n')
    
    const sameTimeVideos = await sql`
      SELECT 
        DATE_TRUNC('second', "createdAt") as created_second,
        COUNT(*) as count,
        ARRAY_AGG(title ORDER BY id) as titles,
        ARRAY_AGG("videoUrl" ORDER BY id) as urls,
        ARRAY_AGG(region ORDER BY id) as regions
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "createdAt" >= NOW() - INTERVAL '2 days'
      GROUP BY DATE_TRUNC('second', "createdAt")
      HAVING COUNT(*) >= 4
      ORDER BY count DESC, created_second DESC
      LIMIT 10
    `
    
    if (sameTimeVideos.length > 0) {
      console.log(`   ⚠️  ${sameTimeVideos.length} groupes de vidéos créées au même moment\n`)
      sameTimeVideos.forEach((group, i) => {
        console.log(`\n${i + 1}. ${group.count} vidéos créées à ${group.created_second}:`)
        console.log(`   Titres: ${group.titles.slice(0, 5).join(', ')}`)
        if (group.titles.length > 5) {
          console.log(`   ... et ${group.titles.length - 5} autres`)
        }
      })
    } else {
      console.log('   ✅ Aucun groupe de vidéos créées au même moment trouvé\n')
    }
    
    // 3. Conclusion
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('💡 Note: Les 4 URLs avec doublons ont été nettoyées.')
    console.log('   Le script a supprimé 16 doublons (probablement 4-5 vidéos par URL).')
    console.log('   Les vidéos restantes sont les versions les plus récentes.\n')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

identifyDuplicateUrls().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
