/**
 * AWS Lambda function for generating video thumbnails
 * Triggered by S3 when a video is uploaded
 * Updates Neon database with thumbnail URL
 * 
 * Requirements:
 * - Lambda layer with ffmpeg (or use AWS MediaConvert)
 * - Environment variables: DATABASE_URL, AWS_REGION
 */

const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { neon } = require('@neondatabase/serverless')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const s3Client = new S3Client({ region: 'eu-north-1' })
const sql = neon(process.env.DATABASE_URL)
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'only-you-coaching'

/**
 * Generate thumbnail from video using ffmpeg
 * Uses ffmpeg from Lambda layer or system
 */
async function generateThumbnail(videoBuffer, timestamp = 5) {
  const tempVideoPath = `/tmp/video-${Date.now()}.mp4`
  const tempThumbnailPath = `/tmp/thumbnail-${Date.now()}.jpg`
  
  try {
    // Write video buffer to temp file
    fs.writeFileSync(tempVideoPath, videoBuffer)
    console.log(`   Video written to temp file: ${tempVideoPath} (${videoBuffer.length} bytes)`)
    
    // Try multiple timestamps if needed
    const timestamps = [timestamp, 1, 0.5, 0.1]
    let thumbnailGenerated = false
    
    for (const ts of timestamps) {
      try {
        // Generate thumbnail using ffmpeg
        const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -ss ${ts} -vframes 1 -q:v 2 "${tempThumbnailPath}" -y 2>&1`
        console.log(`   Trying ffmpeg at ${ts}s...`)
        const output = execSync(ffmpegCommand, { timeout: 30000, encoding: 'utf8' })
        
        // Check if thumbnail file was created
        if (fs.existsSync(tempThumbnailPath)) {
          const stats = fs.statSync(tempThumbnailPath)
          if (stats.size > 0) {
            console.log(`   ✅ Thumbnail generated at ${ts}s (${stats.size} bytes)`)
            thumbnailGenerated = true
            break
          } else {
            console.warn(`   ⚠️  Thumbnail file exists but is empty at ${ts}s`)
            fs.unlinkSync(tempThumbnailPath)
          }
        } else {
          console.warn(`   ⚠️  Thumbnail file not created at ${ts}s`)
        }
      } catch (ffmpegError) {
        console.warn(`   ⚠️  FFmpeg failed at ${ts}s:`, ffmpegError.message)
        // Try next timestamp
        continue
      }
    }
    
    if (!thumbnailGenerated) {
      throw new Error('Failed to generate thumbnail at any timestamp')
    }
    
    // Read thumbnail file
    const thumbnailBuffer = fs.readFileSync(tempThumbnailPath)
    
    return thumbnailBuffer
  } catch (error) {
    console.error('❌ Error generating thumbnail:', error)
    throw error
  } finally {
    // Clean up temp files
    try {
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath)
      if (fs.existsSync(tempThumbnailPath)) fs.unlinkSync(tempThumbnailPath)
    } catch (cleanupError) {
      console.warn('⚠️  Error cleaning up temp files:', cleanupError)
    }
  }
}

/**
 * Extract video ID from S3 key
 * Format: Video/programmes-predefinis/{region}/{number}. {title}.mp4
 */
function extractVideoId(s3Key) {
  const parts = s3Key.split('/')
  const filename = parts[parts.length - 1]
  // Remove extension
  return filename.replace(/\.(mp4|mov|avi)$/i, '')
}

/**
 * Generate thumbnail S3 key from video S3 key
 * Preserves the same folder structure:
 * Video/groupes-musculaires/{region}/{filename}.mp4
 * -> thumbnails/Video/groupes-musculaires/{region}/{filename}-thumb.jpg
 */
function generateThumbnailKey(s3Key) {
  // Remove extension and add -thumb.jpg
  // Example: Video/groupes-musculaires/abdos/1. Titre.mp4
  // -> thumbnails/Video/groupes-musculaires/abdos/1. Titre-thumb.jpg
  const thumbnailKey = s3Key
    .replace(/\.(mp4|mov|avi)$/i, '-thumb.jpg') // Replace extension with -thumb.jpg
    .replace(/^Video\//, 'thumbnails/Video/') // Add thumbnails/ prefix
  
  return thumbnailKey
}

/**
 * Find video in database by videoUrl containing the S3 key
 */
async function findVideoByS3Key(s3Key) {
  try {
    // Search for video where videoUrl contains the S3 key
    // The videoUrl in database is URL-encoded, so we need to encode the key too
    const encodedKey = encodeURIComponent(s3Key)
      .replace(/%2F/g, '/') // Keep slashes unencoded
      .replace(/'/g, '%27')  // Encode single quotes
    
    const searchPattern = `%${encodedKey}%`
    console.log(`   Searching for pattern: ${searchPattern.substring(0, 80)}...`)
    
    const result = await sql`
      SELECT id, "videoUrl", thumbnail 
      FROM videos_new 
      WHERE "videoUrl" LIKE ${searchPattern} 
      LIMIT 1
    `
    return result && result.length > 0 ? result[0] : null
  } catch (error) {
    console.error('❌ Error finding video:', error)
    return null
  }
}

/**
 * Update video thumbnail in database
 */
async function updateVideoThumbnail(videoId, thumbnailUrl) {
  try {
    const result = await sql`
      UPDATE videos_new 
      SET thumbnail = ${thumbnailUrl}, "updatedAt" = NOW() 
      WHERE id = ${videoId} 
      RETURNING id
    `
    if (result && result.length > 0) {
      console.log(`✅ Updated thumbnail for video ${videoId}`)
      return true
    }
    return false
  } catch (error) {
    console.error('❌ Error updating thumbnail:', error)
    return false
  }
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('📥 Lambda triggered by S3 event')
  
  try {
    // Process each S3 event
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name
      const rawKey = record.s3.object.key
      const s3Key = decodeURIComponent(rawKey.replace(/\+/g, ' '))
      
      console.log(`📦 Processing: s3://${bucket}/${s3Key}`)
      console.log(`   Raw key: ${rawKey}`)
      console.log(`   Decoded key: ${s3Key}`)
      console.log(`   Last 10 chars: "${s3Key.slice(-10)}"`)
      const videoMatch = s3Key.match(/\.(mp4|mov|avi)$/i)
      console.log(`   Video match: ${videoMatch ? 'YES' : 'NO'}`)
      
      // Only process video files
      if (!videoMatch) {
        console.log('⏭️  Skipping non-video file')
        continue
      }
      
      // Skip if already a thumbnail
      if (s3Key.includes('thumbnails/') || s3Key.includes('thumbnail')) {
        console.log('⏭️  Skipping thumbnail file')
        continue
      }
      
      // Process only videos in programmes-predefinis or groupes-musculaires folders
      if (!s3Key.includes('programmes-predefinis/') && !s3Key.includes('groupes-musculaires/')) {
        console.log('⏭️  Skipping video (not in programmes-predefinis or groupes-musculaires)')
        continue
      }
      
      // Check if thumbnail already exists in S3
      const thumbnailKey = generateThumbnailKey(s3Key)
      console.log(`🔍 Checking if thumbnail already exists: ${thumbnailKey}`)
      
      // Check if thumbnail already exists in S3
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey
        })
        
        await s3Client.send(headCommand)
        console.log('ℹ️  Thumbnail already exists in S3, skipping')
        continue
      } catch (headError) {
        // Thumbnail doesn't exist (404 is expected), continue with generation
        if (headError.name === 'NotFound' || headError.$metadata?.httpStatusCode === 404) {
          console.log('📝 Thumbnail does not exist, will generate it')
        } else {
          console.log(`⚠️  Error checking thumbnail existence: ${headError.message}, proceeding anyway`)
        }
      }
      
      // Try to find video in database (optional - for updating database if video exists)
      const video = await findVideoByS3Key(s3Key)
      
      if (video) {
        console.log(`✅ Found video in database: ${video.id}`)
        
        // Check if video already has a thumbnail in database
        if (video.thumbnail) {
          console.log('ℹ️  Video already has a thumbnail in database, but will still generate/update in S3')
        }
      } else {
        console.log(`ℹ️  Video not found in database (will generate thumbnail anyway)`)
        console.log(`   The thumbnail will be synced to Neon later via /api/videos/sync-thumbnails-from-s3`)
      }
      
      try {
        // Download video from S3
        console.log('📥 Downloading video from S3...')
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: s3Key
        })
        
        const videoObject = await s3Client.send(getObjectCommand)
        const videoBuffer = await streamToBuffer(videoObject.Body)
        console.log(`✅ Downloaded video (${videoBuffer.length} bytes)`)
        
        // Generate thumbnail
        console.log('🖼️  Generating thumbnail...')
        const thumbnailBuffer = await generateThumbnail(videoBuffer, 5)
        console.log(`✅ Generated thumbnail (${thumbnailBuffer.length} bytes)`)
        
        // Generate thumbnail S3 key (preserve same folder structure)
        console.log(`📤 Uploading thumbnail to: ${thumbnailKey}`)
        
        // Upload thumbnail to S3
        const putObjectCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000', // Cache for 1 year
          // Note: With Object Ownership (Bucket owner enforced), ACLs are not supported
          // The bucket policy should handle public access
        })
        
        await s3Client.send(putObjectCommand)
        console.log(`✅ Uploaded thumbnail to S3`)
        
        // Generate thumbnail URL (properly encoded)
        const region = process.env.AWS_REGION || 'eu-north-1'
        // Encode each segment separately to preserve slashes
        const encodedKey = thumbnailKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
        const thumbnailUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`
        
        // Update database ONLY if video exists in database
        if (video) {
          const updated = await updateVideoThumbnail(video.id, thumbnailUrl)
          if (updated) {
            console.log(`✅ Successfully updated database for video ${video.id}`)
          } else {
            console.log(`⚠️  Thumbnail generated in S3 but failed to update database for video ${video.id}`)
            console.log(`   The thumbnail will be synced later via /api/videos/sync-thumbnails-from-s3`)
          }
        } else {
          console.log(`✅ Thumbnail generated in S3 (video not in database yet)`)
          console.log(`   The thumbnail will be synced to Neon later via /api/videos/sync-thumbnails-from-s3`)
        }
        
      } catch (processingError) {
        console.error(`❌ Error processing video:`, processingError)
        // Continue with next video instead of failing completely
        continue
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Processed successfully' })
    }
  } catch (error) {
    console.error('❌ Error in Lambda handler:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
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
