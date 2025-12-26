/**
 * Script pour mettre à jour les titres des vidéos déjà synchronisées
 * Applique le nouveau formatage (supprime les numéros décimaux, capitalise seulement la première lettre)
 * Usage: node scripts/update-video-titles.js
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
 * Generate title from filename
 * Removes leading numbers (including decimals like 10.1) and capitalizes only first letter
 */
function generateTitle(filename) {
  const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
  // Remove leading numbers (including decimals like 10.1, 10.2) followed by optional dot and space
  // Matches: "10.1 ", "10.1. ", "2. ", "10. "
  const cleaned = nameWithoutExt.replace(/^\d+(\.\d+)?\.?\s*/, '')
  const withSpaces = cleaned.replace(/[-_]/g, ' ')
  // Capitalize only the first letter, rest lowercase
  if (withSpaces.length === 0) return withSpaces
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase()
}

/**
 * Extract filename from S3 URL
 */
function extractFilenameFromUrl(videoUrl) {
  try {
    // URL format: https://bucket.s3.region.amazonaws.com/Video/programmes-predefinis/region/filename.mp4
    const url = new URL(videoUrl)
    // Decode URL-encoded characters (e.g., %20 -> space, %C3%A0 -> à)
    const decodedPath = decodeURIComponent(url.pathname)
    const pathParts = decodedPath.split('/')
    return pathParts[pathParts.length - 1] // Get last part (filename)
  } catch (error) {
    return null
  }
}

async function updateVideoTitles() {
  console.log('🔄 Mise à jour des titres des vidéos...\n')

  try {
    // Get all videos from programmes-predefinis
    const videos = await sql`
      SELECT id, title, "videoUrl" 
      FROM videos_new 
      WHERE "videoUrl" LIKE '%programmes-predefinis%'
      ORDER BY title
    `

    const rows = videos.rows || videos
    console.log(`📦 ${rows.length} vidéo(s) trouvée(s)\n`)

    let updatedCount = 0
    let skippedCount = 0
    const errors = []

    for (const video of rows) {
      try {
        const filename = extractFilenameFromUrl(video.videoUrl)
        if (!filename) {
          console.warn(`⚠️  Impossible d'extraire le nom de fichier pour: ${video.title}`)
          skippedCount++
          continue
        }

        // Generate new title using the corrected function
        const newTitle = generateTitle(filename)

        // Skip if title is already correct (after trimming)
        const currentTitle = video.title ? video.title.trim() : ''
        const expectedTitle = newTitle.trim()
        
        if (currentTitle === expectedTitle) {
          skippedCount++
          continue
        }
        
        // Skip if title is empty or just whitespace (might indicate a problem)
        if (!newTitle || newTitle.trim().length === 0) {
          console.warn(`⚠️  Titre vide pour: ${filename}`)
          skippedCount++
          continue
        }

        // Update title in database
        await sql`
          UPDATE videos_new 
          SET title = ${newTitle}, "updatedAt" = NOW()
          WHERE id = ${video.id}
        `

        console.log(`✅ ${video.title}`)
        console.log(`   → ${newTitle}\n`)
        updatedCount++

      } catch (error) {
        const errorMsg = `Erreur pour "${video.title}": ${error.message}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⏭️  Ignorées: ${skippedCount}`)
    console.log(`   ❌ Erreurs: ${errors.length}`)

    if (errors.length > 0) {
      console.log(`\n❌ Erreurs:`)
      errors.forEach(err => console.log(`   - ${err}`))
    }

    console.log(`\n✅ Mise à jour terminée!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

updateVideoTitles()

