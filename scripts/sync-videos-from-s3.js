/**
 * Script standalone pour synchroniser les vidéos depuis S3 vers Neon
 * Usage: node scripts/sync-videos-from-s3.js [prefix]
 * Exemple: node scripts/sync-videos-from-s3.js "Video/programmes-predefinis/machine/"
 */

require('dotenv').config({ path: '.env.local' })
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { neon } = require('@neondatabase/serverless')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const execAsync = promisify(exec)

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`
const databaseUrl = process.env.DATABASE_URL

/**
 * Encode S3 key to properly formatted URL path
 * Encodes each segment separately to preserve slashes
 * Example: "thumbnails/Video/file name + special.jpg" 
 * -> "thumbnails/Video/file+name+%2B+special.jpg"
 */
function encodeS3KeyToUrl(key) {
  // Split by slashes, encode each segment, then rejoin
  return key.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

/**
 * Build properly encoded S3 URL from key
 */
function buildS3Url(key) {
  const encodedKey = encodeS3KeyToUrl(key)
  return `${S3_BASE_URL}/${encodedKey}`
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

if (!hasAwsCredentials) {
  console.error('❌ AWS credentials manquantes dans .env.local')
  process.exit(1)
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const sql = neon(databaseUrl)

/**
 * Extract region from S3 key path
 */
function extractRegionFromKey(key) {
  const parts = key.split('/')
  if (parts.length >= 3 && parts[1] === 'programmes-predefinis') {
    return parts[2] || null
  }
  if (parts.length >= 3 && parts[1] === 'groupes-musculaires') {
    return parts[2] || null
  }
  return null
}

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
 * Extract muscle groups from title
 */
function extractMuscleGroups(title) {
  const lowerTitle = title.toLowerCase()
  const groups = []
  
  if (lowerTitle.includes('fessier') || lowerTitle.includes('jambe')) {
    groups.push('fessiers-jambes')
  }
  if (lowerTitle.includes('pectoraux') || lowerTitle.includes('pec')) {
    groups.push('pectoraux')
  }
  if (lowerTitle.includes('dos') || lowerTitle.includes('lombaire')) {
    groups.push('dos')
  }
  if (lowerTitle.includes('abdos') || lowerTitle.includes('abdominal')) {
    groups.push('abdos')
  }
  if (lowerTitle.includes('epaule') || lowerTitle.includes('épaule')) {
    groups.push('epaules')
  }
  if (lowerTitle.includes('triceps')) {
    groups.push('triceps')
  }
  if (lowerTitle.includes('biceps')) {
    groups.push('biceps')
  }
  if (lowerTitle.includes('cuisse')) {
    groups.push('fessiers-jambes')
  }
  
  return groups.length > 0 ? groups : []
}

/**
 * Generate thumbnail for a video (async, non-blocking)
 */
async function generateThumbnailForVideo(videoId, s3Key, videoUrl) {
  try {
    // Check if thumbnail already exists
    const existing = await sql`
      SELECT thumbnail FROM videos_new WHERE id = ${videoId}
    `
    if (existing && existing.length > 0 && existing[0].thumbnail) {
      return // Thumbnail already exists
    }

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const videoFileName = path.basename(s3Key)
    const videoPath = path.join(tempDir, `video-${Date.now()}-${videoFileName}`)
    const thumbnailFileName = `${path.parse(videoFileName).name}-thumb.jpg`
    const thumbnailPath = path.join(tempDir, `thumb-${Date.now()}-${thumbnailFileName}`)
    const thumbnailS3Key = `thumbnails/${path.dirname(s3Key)}/${thumbnailFileName}`

    try {
      // Download video from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      })
      const videoObject = await s3Client.send(getObjectCommand)
      const videoBuffer = await streamToBuffer(videoObject.Body)
      fs.writeFileSync(videoPath, videoBuffer)

      // Generate thumbnail using ffmpeg
      const thumbnailCommand = `ffmpeg -i "${videoPath}" -ss 5 -vframes 1 -q:v 2 "${thumbnailPath}" -y 2>&1`
      await execAsync(thumbnailCommand, { timeout: 30000 })

      // Upload thumbnail to S3
      const thumbnailBuffer = fs.readFileSync(thumbnailPath)
      const putObjectCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailS3Key,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=31536000'
      })
      await s3Client.send(putObjectCommand)

      // Generate thumbnail URL with proper encoding
      const thumbnailUrl = buildS3Url(thumbnailS3Key)

      // Update database
      await sql`
        UPDATE videos_new SET thumbnail = ${thumbnailUrl}, "updatedAt" = NOW() WHERE id = ${videoId}
      `

      console.log(`   🖼️  Thumbnail généré pour: ${path.basename(s3Key)}`)
    } catch (thumbError) {
      // If ffmpeg is not available or fails, just log a warning
      console.warn(`   ⚠️  Impossible de générer le thumbnail (ffmpeg requis): ${path.basename(s3Key)}`)
    } finally {
      // Clean up temp files
      try {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    // Silently fail - thumbnails are optional
    console.warn(`   ⚠️  Erreur lors de la génération du thumbnail: ${error.message}`)
  }
}

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function syncVideosFromS3(prefix) {
  console.log(`🔄 Synchronisation des vidéos depuis S3...\n`)
  console.log(`📁 Dossier: ${prefix}\n`)
  
  try {
    // List all objects in the specified folder
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ Aucune vidéo trouvée dans S3')
      return
    }

    // Filter for video files
    const videoFiles = response.Contents.filter(obj => {
      const key = obj.Key || ''
      const extension = key.split('.').pop()?.toLowerCase()
      return ['mp4', 'mov', 'avi', 'webm'].includes(extension || '')
    })

    console.log(`📦 ${videoFiles.length} fichier(s) vidéo trouvé(s)\n`)

    let syncedCount = 0
    let skippedCount = 0
    const errors = []

    // Process each video file
    for (const obj of videoFiles) {
      try {
        const key = obj.Key || ''
        const filename = key.split('/').pop() || ''
        const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
        
        // Generate full S3 URL
        // Generate full S3 URL with proper encoding
        const videoUrl = buildS3Url(key)
        
        // Extract metadata
        const region = extractRegionFromKey(key) || 'machine'
        const title = generateTitle(filename)
        
        // Determine video type and category based on path
        const videoType = key.includes('programmes-predefinis') ? 'PROGRAMMES' : 'MUSCLE_GROUPS'
        const category = key.includes('programmes-predefinis') ? 'Predefined Programs' : 'Muscle Groups'
        
        // Check if video already exists (only by URL, not by title, to avoid conflicts with other folders)
        const existingVideos = await sql`
          SELECT id FROM videos_new
          WHERE "videoUrl" LIKE ${'%' + key + '%'}
        `
        
        if (existingVideos && existingVideos.length > 0) {
          console.log(`⏭️  Déjà existant: ${title}`)
          skippedCount++
          continue
        }

        // Insert video into Neon
        const now = new Date().toISOString()
        // Leave muscleGroups and targeted_muscles empty - no automatic filling
        const muscleGroups = []
        const targeted_muscles = []
        
        const result = await sql`
          INSERT INTO videos_new (
            title, description, "videoUrl", thumbnail, duration,
            difficulty, category, region, "muscleGroups", targeted_muscles,
            "videoType", "isPublished", "createdAt", "updatedAt"
          ) VALUES (
            ${title},
            ${`Exercice: ${title}`},
            ${videoUrl},
            NULL,
            0,
            ${'intermediaire'},
            ${category},
            ${region},
            ${muscleGroups}::text[],
            ${targeted_muscles}::text[],
            ${videoType},
            true,
            ${now},
            ${now}
          ) RETURNING id
        `
        
        const newVideoId = result && result.length > 0 ? result[0].id : null
        
        console.log(`✅ Synchronisé: ${title}`)
        syncedCount++

        // Generate thumbnail asynchronously (non-blocking)
        if (newVideoId) {
          generateThumbnailForVideo(newVideoId, key, videoUrl).catch(() => {
            // Errors are already logged in the function
          })
        }

      } catch (error) {
        const errorFilename = obj.Key?.split('/').pop() || 'unknown'
        console.error(`❌ Erreur pour ${errorFilename}:`, error.message)
        errors.push(`${errorFilename}: ${error.message}`)
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Synchronisées: ${syncedCount}`)
    console.log(`   ⏭️  Ignorées: ${skippedCount}`)
    console.log(`   ❌ Erreurs: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log(`\n❌ Erreurs:`)
      errors.forEach(err => console.log(`   - ${err}`))
    }
    
    console.log(`\n✅ Synchronisation terminée!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    process.exit(1)
  }
}

// Get prefix from command line or use default
const prefix = process.argv[2] || 'Video/programmes-predefinis/machine/'

syncVideosFromS3(prefix)

