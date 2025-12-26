/**
 * Script pour vérifier les régions des vidéos dans Neon
 * et comprendre pourquoi il y a 143 vidéos au lieu de 57
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
let databaseUrl = process.env.DATABASE_URL

if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('DATABASE_URL=') && line.includes('neon.tech')) {
        databaseUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '')
        break
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de lire .env.local')
  }
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false
})

async function checkRegions() {
  console.log('🔍 Analyse des régions des vidéos programmes-predefinis dans Neon...\n')
  
  try {
    const result = await pool.query(`
      SELECT region, COUNT(*) as count
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
      GROUP BY region
      ORDER BY count DESC
    `)
    
    console.log('📊 Répartition par région:\n')
    let total = 0
    result.rows.forEach(row => {
      console.log(`   ${row.region || 'NULL'}: ${row.count} vidéo(s)`)
      total += parseInt(row.count)
    })
    
    console.log(`\n   TOTAL: ${total} vidéo(s)\n`)
    
    // Vérifier les vidéos "machine" spécifiquement
    console.log('📋 Vidéos "machine" spécifiquement:\n')
    const machineResult = await pool.query(`
      SELECT id, title, "videoUrl"
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis/machine%'
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
    `)
    
    console.log(`   ✅ ${machineResult.rows.length} vidéo(s) "machine" trouvée(s)\n`)
    
    if (machineResult.rows.length > 0) {
      console.log('   Exemples:')
      machineResult.rows.slice(0, 5).forEach(video => {
        console.log(`   - ${video.title}`)
        console.log(`     URL: ${video.videoUrl}`)
        console.log('')
      })
    }
    
    // Vérifier s'il y a des vidéos avec des numéros dans le titre/URL
    console.log('📋 Vidéos avec numéros dans l\'URL:\n')
    const numberedResult = await pool.query(`
      SELECT id, title, "videoUrl", region
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
        AND category = 'Predefined Programs'
        AND "videoType" = 'PROGRAMMES'
        AND ("videoUrl" ~ '/[0-9]+[-.]' OR "videoUrl" ~ '/[0-9]+\.')
      ORDER BY region, "videoUrl"
      LIMIT 20
    `)
    
    console.log(`   ✅ ${numberedResult.rows.length} vidéo(s) avec numéro dans l'URL (échantillon de 20)\n`)
    if (numberedResult.rows.length > 0) {
      numberedResult.rows.forEach(video => {
        const urlMatch = video.videoUrl.match(/(\d+)[-.]/)
        const number = urlMatch ? urlMatch[1] : 'N/A'
        console.log(`   - [${video.region}] Vidéo ${number}: ${video.title}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkRegions()












