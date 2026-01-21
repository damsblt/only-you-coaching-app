const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function main() {
  console.log('🔍 Vérification des thumbnails pour "Jambes et Fessiers"...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Find videos with "jambes" or "fessiers" in muscle groups
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail,
        "videoUrl",
        "muscleGroups"
      FROM videos_new
      WHERE "isPublished" = true 
        AND (
          "muscleGroups"::text ILIKE '%jambes%' 
          OR "muscleGroups"::text ILIKE '%fessiers%'
          OR "muscleGroups"::text ILIKE '%fessier%'
          OR category ILIKE '%jambes%'
          OR category ILIKE '%fessiers%'
        )
      ORDER BY title
    `)

    const total = result.rows.length
    const withThumbnail = result.rows.filter(v => v.thumbnail && v.thumbnail.trim() !== '').length
    const withoutThumbnail = total - withThumbnail

    console.log('📊 Statistiques pour "Jambes et Fessiers":')
    console.log(`   Total vidéos: ${total}`)
    console.log(`   Avec thumbnail: ${withThumbnail}`)
    console.log(`   Sans thumbnail: ${withoutThumbnail}`)
    console.log()

    if (withoutThumbnail > 0) {
      console.log(`❌ Vidéos SANS thumbnail:\n`)
      result.rows
        .filter(v => !v.thumbnail || v.thumbnail.trim() === '')
        .forEach((v, i) => {
          console.log(`${i + 1}. ${v.title}`)
          console.log(`   ID: ${v.id}`)
          console.log(`   Groupes: ${v.muscleGroups}`)
          console.log(`   VideoURL: ${v.videoUrl ? v.videoUrl.substring(0, 80) + '...' : 'N/A'}`)
          console.log()
        })
    } else {
      console.log('✅ Toutes les vidéos ont un thumbnail!')
    }

    // Check if thumbnails are working (not just existing)
    console.log('\n📝 Exemples de thumbnails pour ce groupe:')
    result.rows
      .filter(v => v.thumbnail && v.thumbnail.trim() !== '')
      .slice(0, 5)
      .forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.title}`)
        console.log(`   Thumbnail: ${v.thumbnail.substring(0, 100)}...`)
      })

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
