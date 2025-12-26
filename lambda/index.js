/**
 * AWS Lambda function for generating video thumbnails
 * Triggered by S3 when a video is uploaded
 * Updates Neon database with thumbnail URL
 * 
 * Requirements:
 * - Lambda layer with ffmpeg (or use AWS MediaConvert)
 * - Environment variables: DATABASE_URL, AWS_REGION
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { neon } = require('@neondatabase/serverless')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' })
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
    
    // Generate thumbnail using ffmpeg
    // Extract frame at 5 seconds (or 10% of video if shorter)
    const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -ss ${timestamp} -vframes 1 -q:v 2 "${tempThumbnailPath}" -y 2>&1`
    
    try {
      execSync(ffmpegCommand, { timeout: 30000 }) // 30 second timeout
    } catch (ffmpegError) {
      // If ffmpeg fails, try at 1 second
      console.warn('⚠️  FFmpeg failed at 5s, trying at 1s:', ffmpegError.message)
      const fallbackCommand = `ffmpeg -i "${tempVideoPath}" -ss 1 -vframes 1 -q:v 2 "${tempThumbnailPath}" -y 2>&1`
      execSync(fallbackCommand, { timeout: 30000 })
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
 */
function generateThumbnailKey(s3Key) {
  const videoId = extractVideoId(s3Key)
  // Extract path without filename
  const pathParts = s3Key.split('/')
  pathParts.pop() // Remove filename
  const basePath = pathParts.join('/')
  
  // Create thumbnail path: same path but in thumbnails/ folder
  return `thumbnails/${basePath}/${videoId}-thumb.jpg`
}

/**
 * Find video in database by videoUrl containing the S3 key
 */
async function findVideoByS3Key(s3Key) {
  try {
    // Search for video where videoUrl contains the S3 key
    // The videoUrl format is: https://bucket.s3.region.amazonaws.com/{s3Key}
    const searchPattern = `%${s3Key}%`
    const result = await sql.query(
      'SELECT id, "videoUrl", thumbnail FROM videos_new WHERE "videoUrl" LIKE $1 LIMIT 1',
      [searchPattern]
    )
    const rows = result.rows || result
    return rows && rows.length > 0 ? rows[0] : null
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
    const result = await sql.query(
      'UPDATE videos_new SET thumbnail = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id',
      [thumbnailUrl, videoId]
    )
    const rows = result.rows || result
    if (rows && rows.length > 0) {
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
      const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
      
      console.log(`📦 Processing: s3://${bucket}/${s3Key}`)
      
      // Only process video files
      if (!s3Key.match(/\.(mp4|mov|avi)$/i)) {
        console.log('⏭️  Skipping non-video file')
        continue
      }
      
      // Skip if already a thumbnail
      if (s3Key.includes('thumbnails/') || s3Key.includes('thumbnail')) {
        console.log('⏭️  Skipping thumbnail file')
        continue
      }
      
      // Skip if not in programmes-predefinis folder
      if (!s3Key.includes('programmes-predefinis/')) {
        console.log('⏭️  Skipping non-programme video')
        continue
      }
      
      // Find video in database
      const video = await findVideoByS3Key(s3Key)
      
      if (!video) {
        console.log(`⚠️  Video not found in database for key: ${s3Key}`)
        console.log(`   This is normal if the video hasn't been synced to Neon yet.`)
        continue
      }
      
      console.log(`✅ Found video: ${video.id}`)
      
      // Check if thumbnail already exists
      if (video.thumbnail) {
        console.log('ℹ️  Video already has a thumbnail, skipping')
        continue
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
        
        // Generate thumbnail S3 key
        const thumbnailKey = generateThumbnailKey(s3Key)
        console.log(`📤 Uploading thumbnail to: ${thumbnailKey}`)
        
        // Upload thumbnail to S3
        const putObjectCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000' // Cache for 1 year
        })
        
        await s3Client.send(putObjectCommand)
        console.log(`✅ Uploaded thumbnail to S3`)
        
        // Generate thumbnail URL
        const region = process.env.AWS_REGION || 'eu-north-1'
        const thumbnailUrl = `https://${bucket}.s3.${region}.amazonaws.com/${thumbnailKey}`
        
        // Update database
        const updated = await updateVideoThumbnail(video.id, thumbnailUrl)
        if (updated) {
          console.log(`✅ Successfully processed video ${video.id}`)
        } else {
          console.error(`❌ Failed to update database for video ${video.id}`)
        }
        
      } catch (processingError) {
        console.error(`❌ Error processing video ${video.id}:`, processingError)
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
