import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { db, update } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`

/**
 * Encode S3 key to properly formatted URL path
 * Encodes each segment separately to preserve slashes
 * Example: "thumbnails/Video/file name + special.jpg" 
 * -> "thumbnails/Video/file+name+%2B+special.jpg"
 */
function encodeS3KeyToUrl(key: string): string {
  // Split by slashes, encode each segment, then rejoin
  return key.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

/**
 * Build properly encoded S3 URL from key
 */
function buildS3Url(key: string): string {
  const encodedKey = encodeS3KeyToUrl(key)
  return `${S3_BASE_URL}/${encodedKey}`
}

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
 * Extract region from S3 key path
 * Example: Video/programmes-predefinis/machine/video.mp4 -> machine
 */
function extractRegionFromKey(key: string): string | null {
  const parts = key.split('/')
  // Format: Video/programmes-predefinis/{region}/video.mp4
  if (parts.length >= 3 && parts[1] === 'programmes-predefinis') {
    return parts[2] || null
  }
  // Format: Video/groupes-musculaires/{region}/video.mp4
  if (parts.length >= 3 && parts[1] === 'groupes-musculaires') {
    return parts[2] || null
  }
  return null
}

/**
 * Generate title from filename
 * Removes leading numbers (including decimals like 10.1) and capitalizes only first letter
 */
function generateTitle(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
  // Remove leading numbers (including decimals like 10.1, 10.2) followed by optional dot and space
  // Matches: "10.1 ", "10.1. ", "2. ", "10. "
  const cleaned = nameWithoutExt.replace(/^\d+(\.\d+)?\.?\s*/, '')
  // Replace dashes and underscores with spaces
  const withSpaces = cleaned.replace(/[-_]/g, ' ')
  // Capitalize only the first letter, rest lowercase
  if (withSpaces.length === 0) return withSpaces
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase()
}

/**
 * Extract muscle groups from title/filename
 */
function extractMuscleGroups(title: string): string[] {
  const lowerTitle = title.toLowerCase()
  const groups: string[] = []
  
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
async function generateThumbnailForVideo(videoId: string, s3Key: string, videoUrl: string) {
  try {
    // Check if thumbnail already exists
    const { data: existing } = await db
      .from('videos_new')
      .select('thumbnail')
      .eq('id', videoId)
      .single()
    
    if (existing?.thumbnail) {
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
      if (!s3Client) {
        throw new Error('S3 client not available')
      }
      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
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
      await update('videos_new', 
        { thumbnail: thumbnailUrl, updatedAt: new Date().toISOString() },
        { id: videoId }
      )

      console.log(`   🖼️  Thumbnail generated for: ${path.basename(s3Key)}`)
    } catch (thumbError) {
      // If ffmpeg is not available or fails, just log a warning
      console.warn(`   ⚠️  Could not generate thumbnail (ffmpeg required): ${path.basename(s3Key)}`)
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
    console.warn(`   ⚠️  Error generating thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
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
    const prefix = body.prefix || 'Video/programmes-predefinis/machine/'

    // List all objects in the specified folder
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      return NextResponse.json({ 
        message: 'No video files found in S3', 
        synced: 0,
        found: 0 
      })
    }

    // Filter for video files
    const videoFiles = response.Contents.filter(obj => {
      const key = obj.Key || ''
      const extension = key.split('.').pop()?.toLowerCase()
      return ['mp4', 'mov', 'avi', 'webm'].includes(extension || '')
    })

    let syncedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // Process each video file
    for (const obj of videoFiles) {
      try {
        const key = obj.Key || ''
        const filename = key.split('/').pop() || ''
        const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
        
        // Generate full S3 URL with proper encoding
        const videoUrl = buildS3Url(key)
        
        // Extract metadata from path and filename
        const region = extractRegionFromKey(key) || 'machine'
        const title = generateTitle(filename)
        
        // Determine video type and category based on path
        const videoType = key.includes('programmes-predefinis') ? 'PROGRAMMES' : 'MUSCLE_GROUPS'
        const category = key.includes('programmes-predefinis') ? 'Predefined Programs' : 'Muscle Groups'
        
        // Check if video already exists (by videoUrl or title)
        const { data: existingVideos } = await db
          .from('videos_new')
          .select('id')
          .or(`videoUrl.ilike.%${key}%,title.ilike.%${title}%`)
          .single()

        if (existingVideos && existingVideos.length > 0) {
          console.log(`Video already exists: ${title}`)
          skippedCount++
          continue
        }

        // Insert video into Neon
        const now = new Date().toISOString()
        const videoData: any = {
          title,
          description: `Exercice: ${title}`,
          videoUrl,
          thumbnail: null,
          duration: 0, // Will be updated later if available
          difficulty: 'intermediaire', // Default
          category,
          region,
          muscleGroups: [], // Empty by default - no automatic filling
          targeted_muscles: [], // Empty by default - no automatic filling
          videoType,
          isPublished: true, // Auto-publish synced videos
          createdAt: now,
          updatedAt: now,
        }
        
        // Insert video using QueryBuilder
        const { data: newVideo, error } = await db
          .from('videos_new')
          .insert(videoData)

        if (error) {
          console.error(`Error inserting video ${title}:`, error)
          errors.push(`${title}: ${error.message || 'Unknown error'}`)
        } else {
          console.log(`✅ Synced video: ${title}`)
          syncedCount++
          
          // Generate thumbnail asynchronously (non-blocking)
          if (newVideo?.id) {
            generateThumbnailForVideo(newVideo.id, key, videoUrl).catch(() => {
              // Errors are already logged in the function
            })
          }
        }

      } catch (error) {
        console.error(`Error processing video file:`, error)
        errors.push(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: `Sync completed. ${syncedCount} videos synced, ${skippedCount} skipped.`,
      synced: syncedCount,
      skipped: skippedCount,
      total: videoFiles.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error syncing videos from S3:', error)
    return NextResponse.json(
      { error: 'Failed to sync videos from S3' },
      { status: 500 }
    )
  }
}

