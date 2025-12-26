/**
 * Script pour corriger l'encodage des URLs S3 dans la base de données Neon
 * 
 * Ce script :
 * 1. Récupère toutes les vidéos avec des URLs S3
 * 2. Détecte les URLs mal encodées (avec espaces, caractères spéciaux non encodés)
 * 3. Les corrige en utilisant le bon encodage
 * 4. Met à jour la base de données
 * 
 * Usage: 
 *   node scripts/fix-s3-urls-encoding.js [--dry-run] [--fix-thumbnails] [--fix-videos]
 * 
 * Options:
 *   --dry-run          : Affiche ce qui sera corrigé sans faire de modifications
 *   --fix-thumbnails   : Corrige uniquement les URLs de thumbnails (par défaut: les deux)
 *   --fix-videos       : Corrige uniquement les URLs de vidéos (par défaut: les deux)
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`

const DRY_RUN = process.argv.includes('--dry-run')
const FIX_THUMBNAILS = process.argv.includes('--fix-thumbnails') || (!process.argv.includes('--fix-videos') && !process.argv.includes('--fix-thumbnails'))
const FIX_VIDEOS = process.argv.includes('--fix-videos') || (!process.argv.includes('--fix-thumbnails') && !process.argv.includes('--fix-videos'))

/**
 * Encode S3 key to properly formatted URL path
 * Encodes each segment separately to preserve slashes
 */
function encodeS3KeyToUrl(key) {
  return key.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

/**
 * Build properly encoded S3 URL from key
 */
function buildS3Url(key) {
  const encodedKey = encodeS3KeyToUrl(key)
  return `${S3_BASE_URL}/${encodedKey}`
}

/**
 * Extract S3 key from URL
 */
function extractS3KeyFromUrl(url) {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes('s3') || urlObj.hostname.includes('amazonaws.com')) {
      // Remove query parameters if any
      const pathname = urlObj.pathname
      // Remove leading slash
      return decodeURIComponent(pathname.substring(1))
    }
  } catch (error) {
    // Not a valid URL
  }
  return null
}

/**
 * Check if URL needs encoding fix
 * Returns true if URL contains unencoded special characters
 */
function needsEncodingFix(url) {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    
    // Check if it's an S3 URL
    if (!urlObj.hostname.includes('s3') && !urlObj.hostname.includes('amazonaws.com')) {
      return false // Not an S3 URL, skip
    }
    
    // Check if it's a Neon Storage URL
    if (urlObj.hostname.includes('neon.tech') || urlObj.hostname.includes('storage.neon')) {
      return false // Neon Storage URLs are fine
    }
    
    // Extract the path
    const pathname = urlObj.pathname
    
    // Check if path contains unencoded characters that should be encoded
    // Characters that should be encoded: spaces, + (when not part of encoding), special chars
    // But we need to be careful - if it's already properly encoded, we don't want to double-encode
    
    // Decode once to check original
    const decoded = decodeURIComponent(pathname)
    
    // Check if decoded path contains characters that need encoding
    // If the decoded path has spaces, + signs, or special characters, it needs encoding
    if (decoded.includes(' ') || decoded.includes('+') || /[^\w\-._~\/%]/g.test(decoded)) {
      // But check if it's already properly encoded by comparing
      const s3Key = decoded.substring(1) // Remove leading slash
      const properlyEncoded = buildS3Url(s3Key)
      
      // If the properly encoded URL is different from the original, it needs fixing
      if (properlyEncoded !== url) {
        return true
      }
    }
    
    return false
  } catch (error) {
    // Not a valid URL, skip
    return false
  }
}

/**
 * Fix URL encoding
 */
function fixUrlEncoding(url) {
  if (!url) return url
  
  try {
    const s3Key = extractS3KeyFromUrl(url)
    if (!s3Key) {
      return url // Can't extract key, return original
    }
    
    return buildS3Url(s3Key)
  } catch (error) {
    console.warn(`⚠️  Erreur lors de la correction de l'URL: ${url}`, error.message)
    return url // Return original on error
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Correction de l\'encodage des URLs S3 dans Neon\n')
  console.log(`📋 Mode: ${DRY_RUN ? 'DRY-RUN (aucune modification)' : 'MISE À JOUR'}`)
  console.log(`📋 Correction thumbnails: ${FIX_THUMBNAILS ? '✅' : '❌'}`)
  console.log(`📋 Correction vidéos: ${FIX_VIDEOS ? '✅' : '❌'}\n`)
  
  try {
    // Fetch all videos
    console.log('📥 Récupération des vidéos depuis Neon...')
    const videos = await sql`
      SELECT id, title, "videoUrl", thumbnail
      FROM videos_new
      WHERE "videoUrl" IS NOT NULL OR thumbnail IS NOT NULL
      ORDER BY title
    `
    
    console.log(`✅ ${videos.length} vidéo(s) trouvée(s)\n`)
    
    let fixedThumbnails = 0
    let fixedVideos = 0
    let skipped = 0
    const errors = []
    
    for (const video of videos) {
      const updates = {}
      let needsUpdate = false
      
      // Fix thumbnail URL
      if (FIX_THUMBNAILS && video.thumbnail && needsEncodingFix(video.thumbnail)) {
        const fixedThumbnail = fixUrlEncoding(video.thumbnail)
        if (fixedThumbnail !== video.thumbnail) {
          updates.thumbnail = fixedThumbnail
          needsUpdate = true
          fixedThumbnails++
          
          console.log(`🖼️  Thumbnail corrigé pour: ${video.title}`)
          console.log(`   Avant: ${video.thumbnail}`)
          console.log(`   Après: ${fixedThumbnail}\n`)
        }
      }
      
      // Fix video URL
      if (FIX_VIDEOS && video.videoUrl && needsEncodingFix(video.videoUrl)) {
        const fixedVideoUrl = fixUrlEncoding(video.videoUrl)
        if (fixedVideoUrl !== video.videoUrl) {
          updates.videoUrl = fixedVideoUrl
          needsUpdate = true
          fixedVideos++
          
          console.log(`🎬 Vidéo corrigée pour: ${video.title}`)
          console.log(`   Avant: ${video.videoUrl}`)
          console.log(`   Après: ${fixedVideoUrl}\n`)
        }
      }
      
      // Update database if needed
      if (needsUpdate && !DRY_RUN) {
        try {
          // Build dynamic UPDATE query
          const setClause = Object.keys(updates).map((key, i) => 
            `"${key}" = $${i + 1}`
          ).join(', ')
          
          const values = Object.values(updates)
          values.push(video.id)
          
          // Use sql.query() for dynamic queries
          await sql.query(
            `UPDATE videos_new SET ${setClause}, "updatedAt" = NOW() WHERE id = $${values.length}`,
            values
          )
        } catch (error) {
          errors.push(`${video.title}: ${error.message}`)
          console.error(`❌ Erreur lors de la mise à jour de ${video.title}:`, error.message)
        }
      } else if (!needsUpdate) {
        skipped++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(60))
    console.log(`✅ Thumbnails corrigés: ${fixedThumbnails}`)
    console.log(`✅ Vidéos corrigées: ${fixedVideos}`)
    console.log(`⏭️  Vidéos non modifiées: ${skipped}`)
    if (errors.length > 0) {
      console.log(`❌ Erreurs: ${errors.length}`)
      errors.forEach(err => console.log(`   - ${err}`))
    }
    console.log('='.repeat(60))
    
    if (DRY_RUN) {
      console.log('\n💡 Mode DRY-RUN: aucune modification effectuée')
      console.log('   Exécutez sans --dry-run pour appliquer les corrections\n')
    } else {
      console.log('\n✅ Correction terminée!\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

// Run
main().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

