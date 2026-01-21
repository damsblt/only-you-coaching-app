const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function main() {
  console.log('🔍 Vérification des thumbnails dans la base de données...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Count total videos
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM videos_new WHERE "isPublished" = true'
    )
    const total = parseInt(totalResult.rows[0].count)

    // Count videos with thumbnails
    const withThumbnailResult = await pool.query(
      'SELECT COUNT(*) FROM videos_new WHERE "isPublished" = true AND thumbnail IS NOT NULL AND thumbnail != \'\''
    )
    const withThumbnail = parseInt(withThumbnailResult.rows[0].count)

    // Count videos without thumbnails
    const withoutThumbnail = total - withThumbnail

    console.log('📊 Statistiques:')
    console.log(`   Total vidéos publiées: ${total}`)
    console.log(`   Avec thumbnail: ${withThumbnail} (${Math.round(withThumbnail / total * 100)}%)`)
    console.log(`   Sans thumbnail: ${withoutThumbnail} (${Math.round(withoutThumbnail / total * 100)}%)`)
    console.log()

    if (withoutThumbnail > 0) {
      // Get videos without thumbnails
      const missingResult = await pool.query(`
        SELECT id, title, "videoUrl", thumbnail
        FROM videos_new
        WHERE "isPublished" = true 
          AND (thumbnail IS NULL OR thumbnail = '')
        ORDER BY title
        LIMIT 10
      `)

      console.log(`❌ ${withoutThumbnail} vidéos SANS thumbnail:\n`)
      missingResult.rows.forEach((v, i) => {
        console.log(`${i + 1}. ${v.title}`)
        console.log(`   ID: ${v.id}`)
        console.log(`   VideoURL: ${v.videoUrl ? v.videoUrl.substring(0, 80) : 'N/A'}`)
        console.log(`   Thumbnail: ${v.thumbnail || 'NULL'}`)
        console.log()
      })

      if (withoutThumbnail > 10) {
        console.log(`... et ${withoutThumbnail - 10} autres\n`)
      }
    } else {
      console.log('✅ Toutes les vidéos ont un thumbnail!\n')
    }

    // Check thumbnail URL formats
    const formatResult = await pool.query(`
      SELECT 
        CASE 
          WHEN thumbnail LIKE '%s3.amazonaws.com%' THEN 'S3'
          WHEN thumbnail LIKE '%neon%' THEN 'Neon'
          ELSE 'Other'
        END as format,
        COUNT(*) as count
      FROM videos_new
      WHERE "isPublished" = true 
        AND thumbnail IS NOT NULL 
        AND thumbnail != ''
      GROUP BY format
    `)

    console.log('📍 Format des thumbnails:')
    formatResult.rows.forEach(row => {
      console.log(`   ${row.format}: ${row.count}`)
    })
    console.log()

    // Show some examples
    const examplesResult = await pool.query(`
      SELECT title, thumbnail
      FROM videos_new
      WHERE "isPublished" = true 
        AND thumbnail IS NOT NULL 
        AND thumbnail != ''
      ORDER BY title
      LIMIT 3
    `)

    console.log('📝 Exemples de thumbnails:')
    examplesResult.rows.forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.title}`)
      console.log(`   ${v.thumbnail}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
