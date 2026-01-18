import { NextRequest, NextResponse } from 'next/server'
import { db, update } from '@/lib/db'
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

// Check if AWS credentials are available
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

const s3Client = hasAwsCredentials ? new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

/**
 * Build S3 URL from key
 */
function buildS3Url(key: string): string {
  const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/')
  return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${encodedKey}`
}

/**
 * Check if thumbnail exists in S3
 */
async function thumbnailExistsInS3(thumbnailKey: string): Promise<boolean> {
  if (!s3Client) return false
  
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailKey,
    })
    await s3Client.send(command)
    return true
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    return false
  }
}

/**
 * Generate thumbnail key from video key
 */
function generateThumbnailKey(videoKey: string): string {
  const videoFileName = path.basename(videoKey)
  const thumbnailFileName = `${path.parse(videoFileName).name}-thumb.jpg`
  return `thumbnails/${path.dirname(videoKey)}/${thumbnailFileName}`
}

/**
 * Generate thumbnail for a video
 */
async function generateThumbnailForVideo(videoId: string, videoKey: string, videoUrl: string) {
  try {
    // Check if thumbnail already exists in database
    const { data: existing } = await db
      .from('videos_new')
      .select('thumbnail')
      .eq('id', videoId)
      .single()
    
    if (existing?.thumbnail) {
      // Check if thumbnail exists in S3
      try {
        const thumbnailUrl = new URL(existing.thumbnail)
        const s3Key = decodeURIComponent(thumbnailUrl.pathname.substring(1))
        const exists = await thumbnailExistsInS3(s3Key)
        if (exists) {
          return { success: true, skipped: true, reason: 'Thumbnail already exists' }
        }
      } catch {
        // URL parsing failed, continue to generate
      }
    }

    // Generate thumbnail key
    const thumbnailS3Key = generateThumbnailKey(videoKey)
    
    // Check if thumbnail already exists in S3
    const exists = await thumbnailExistsInS3(thumbnailS3Key)
    if (exists) {
      // Update database with existing thumbnail URL
      const thumbnailUrl = buildS3Url(thumbnailS3Key)
      const updateResult = await update('videos_new', 
        { thumbnail: thumbnailUrl, updatedAt: new Date().toISOString() },
        { id: videoId }
      )
      if (updateResult.error) {
        console.warn('Failed to update database with existing thumbnail:', updateResult.error)
      }
      return { success: true, skipped: false, reason: 'Thumbnail found in S3, database updated' }
    }

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const videoFileName = path.basename(videoKey)
    const videoPath = path.join(tempDir, `video-${Date.now()}-${videoFileName}`)
    const thumbnailFileName = `${path.parse(videoFileName).name}-thumb.jpg`
    const thumbnailPath = path.join(tempDir, `thumb-${Date.now()}-${thumbnailFileName}`)

    try {
      // Download video from S3
      if (!s3Client) {
        throw new Error('S3 client not available')
      }
      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: videoKey
      })
      const videoObject = await s3Client.send(getObjectCommand)
      const videoBuffer = await streamToBuffer(videoObject.Body as any)
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
      const updateResult = await update('videos_new', 
        { thumbnail: thumbnailUrl, updatedAt: new Date().toISOString() },
        { id: videoId }
      )
      if (updateResult.error) {
        throw new Error(`Failed to update database: ${updateResult.error.message || updateResult.error}`)
      }

      return { success: true, skipped: false, thumbnailUrl }
    } catch (thumbError) {
      return { 
        success: false, 
        error: thumbError instanceof Error ? thumbError.message : 'Unknown error',
        skipped: false
      }
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      skipped: false
    }
  }
}

/**
 * Extract S3 key from video URL
 */
function extractS3KeyFromUrl(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl)
    const decodedPath = decodeURIComponent(url.pathname)
    return decodedPath.substring(1) // Remove leading slash
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasAwsCredentials || !s3Client) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 10 // Limit to 10 videos at a time to avoid timeout
    const force = body.force || false // Force regeneration even if thumbnail exists

    // Find videos without thumbnails or with invalid thumbnails
    let videos: any[] = []
    
    if (!force) {
      // Only get videos without thumbnails (null or empty string)
      const { data: allVideos, error: fetchError } = await db
        .from('videos_new')
        .select('id, title, videoUrl, thumbnail')
        .eq('isPublished', true)
        .not('videoUrl', 'is', null)
        .limit(limit * 3) // Get more to filter
      
      if (fetchError) {
        throw fetchError
      }
      
      // Filter to only videos without thumbnails
      videos = (allVideos || []).filter((v: any) => {
        return !v.thumbnail || v.thumbnail.trim() === ''
      }).slice(0, limit)
    } else {
      // Force mode: process all videos
      const { data: allVideos, error: fetchError } = await db
        .from('videos_new')
        .select('id, title, videoUrl, thumbnail')
        .eq('isPublished', true)
        .not('videoUrl', 'is', null)
        .limit(limit)
      
      if (fetchError) {
        throw fetchError
      }
      
      videos = allVideos || []
    }

    if (videos.length === 0) {
      return NextResponse.json({
        message: 'No videos found that need thumbnails',
        processed: 0,
        results: []
      })
    }

    console.log(`🖼️  Generating thumbnails for ${videos.length} videos...`)

    // Process videos in batches to avoid timeout
    const results = []
    const BATCH_SIZE = 3 // Process 3 videos at a time

    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
      const batch = videos.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (video: any) => {
          const s3Key = extractS3KeyFromUrl(video.videoUrl)
          if (!s3Key) {
            return {
              videoId: video.id,
              title: video.title,
              success: false,
              error: 'Could not extract S3 key from video URL',
              skipped: false
            }
          }

          const result = await generateThumbnailForVideo(video.id, s3Key, video.videoUrl)
          return {
            videoId: video.id,
            title: video.title,
            ...result
          }
        })
      )
      results.push(...batchResults)
    }

    const successCount = results.filter(r => r.success && !r.skipped).length
    const skippedCount = results.filter(r => r.skipped).length
    const errorCount = results.filter(r => !r.success && !r.skipped).length

    return NextResponse.json({
      message: `Processed ${videos.length} videos`,
      summary: {
        total: videos.length,
        generated: successCount,
        skipped: skippedCount,
        errors: errorCount
      },
      results: results.map(r => ({
        videoId: r.videoId,
        title: r.title,
        success: r.success,
        skipped: r.skipped,
        reason: r.reason,
        error: r.error
      }))
    })
  } catch (error) {
    console.error('Error generating thumbnails:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate thumbnails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
