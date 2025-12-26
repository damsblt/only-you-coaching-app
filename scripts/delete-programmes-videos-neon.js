/**
 * Script pour supprimer les vidéos des programmes prédéfinis de Neon uniquement
 * 
 * Usage: node scripts/delete-programmes-videos-neon.js [--dry-run]
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Prefer Neon DATABASE_URL over Supabase
const envPath = path.join(__dirname, '..', '.env.local')
let databaseUrl = process.env.DATABASE_URL

// If DATABASE_URL points to Supabase, try to find Neon URL in .env.local
if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    // Find the last DATABASE_URL line (should be Neon)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('DATABASE_URL=') && line.includes('neon.tech')) {
        databaseUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '')
        console.log('📌 Utilisation de l\'URL Neon trouvée dans .env.local\n')
        break
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de lire .env.local, utilisation de DATABASE_URL par défaut')
  }
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false
})

const isDryRun = process.argv.includes('--dry-run')

async function deleteProgrammesVideosFromNeon() {
  console.log('🗑️  Suppression des vidéos programmes-predefinis de Neon...\n')
  
  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN: Aucune suppression ne sera effectuée\n')
  }
  
  try {
    // Trouver toutes les vidéos programmes-predefinis dans Neon
    console.log('📋 Recherche des vidéos programmes-predefinis dans Neon...')
    const result = await pool.query(`
      SELECT id, title, "videoUrl", region
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
    `)
    
    const videos = result.rows || []
    console.log(`   ✅ ${videos.length} vidéo(s) trouvée(s) dans Neon\n`)
    
    if (videos.length === 0) {
      console.log('✅ Aucune vidéo à supprimer')
      return
    }
    
    // Afficher un échantillon
    console.log('📋 Échantillon des vidéos à supprimer:\n')
    videos.slice(0, 10).forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title}`)
      console.log(`      ID: ${video.id}`)
      console.log(`      Région: ${video.region || 'N/A'}\n`)
    })
    if (videos.length > 10) {
      console.log(`   ... et ${videos.length - 10} autre(s)\n`)
    }
    
    // Demander confirmation (sauf en dry-run)
    if (!isDryRun) {
      console.log('⚠️  ATTENTION: Cette action est irréversible!')
      console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    // Supprimer les vidéos
    if (isDryRun) {
      console.log(`[DRY-RUN] ${videos.length} vidéo(s) seraient supprimée(s) de Neon`)
    } else {
      console.log('🗑️  Suppression des vidéos de Neon...')
      let deletedCount = 0
      
      for (const video of videos) {
        try {
          await pool.query('DELETE FROM videos_new WHERE id = $1', [video.id])
          deletedCount++
          if (deletedCount % 10 === 0) {
            process.stdout.write(`   ✅ ${deletedCount}/${videos.length} supprimée(s)...\r`)
          }
        } catch (error) {
          console.error(`   ❌ Erreur lors de la suppression de ${video.id}:`, error.message)
        }
      }
      console.log(`\n   ✅ ${deletedCount} vidéo(s) supprimée(s) de Neon\n`)
    }
    
    console.log('✅ Terminé!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

deleteProgrammesVideosFromNeon()











