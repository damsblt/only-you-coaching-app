import { NextRequest } from 'next/server'
import { uploadToS3, generateVideoKey, generateThumbnailKey } from './s3'
import { pool } from './db'

// Define types locally since we're not using Prisma anymore
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

interface Video {
  id: string
  title: string
  description: string | null
  videoUrl: string
  thumbnail: string | null
  duration: number
  difficulty: Difficulty
  category: string | null
  tags: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

// Video upload handler
export async function handleVideoUpload(
  request: NextRequest,
  userId: string
): Promise<{ success: boolean; video?: Video; error?: string }> {
  try {
    const formData = await request.formData()
    const file = formData.get('video') as File
    const thumbnail = formData.get('thumbnail') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const difficulty = formData.get('difficulty') as Difficulty
    const tags = JSON.parse(formData.get('tags') as string || '[]')

    if (!file) {
      return { success: false, error: 'No video file provided' }
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return { success: false, error: 'File must be a video' }
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 500MB' }
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Generate unique keys
    const videoKey = generateVideoKey(userId, file.name)
    const thumbnailKey = thumbnail ? generateThumbnailKey(userId, videoKey) : null

    // Upload video to S3
    const videoUpload = await uploadToS3(
      fileBuffer,
      videoKey,
      file.type,
      {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      }
    )

    if (!videoUpload.success) {
      return { success: false, error: videoUpload.error }
    }

    // Upload thumbnail if provided
    let thumbnailUrl = null
    if (thumbnail && thumbnailKey) {
      const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer())
      const thumbnailUpload = await uploadToS3(
        thumbnailBuffer,
        thumbnailKey,
        thumbnail.type
      )
      
      if (thumbnailUpload.success) {
        thumbnailUrl = thumbnailUpload.location
      }
    }

    // Calculate duration (simplified - in production, use ffmpeg)
    const duration = 0 // This would be calculated from video metadata

    // Save to database
    const videoResult = await pool.query(
      `INSERT INTO videos_new (title, description, "videoUrl", thumbnail, duration, difficulty, category, tags, "isPublished")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        description,
        videoUpload.location!,
        thumbnailUrl,
        duration,
        difficulty,
        category,
        JSON.stringify(tags),
        false // Admin needs to approve
      ]
    )

    if (videoResult.rows.length === 0) {
      console.error('Error creating video: No rows returned')
      return { success: false, error: 'Failed to save video to database' }
    }

    return { success: true, video: videoResult.rows[0] }
  } catch (error) {
    console.error('Error uploading video:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get video with signed URL for private access
export async function getVideoWithSignedUrl(videoId: string, userId: string) {
  try {
    const videoResult = await pool.query(
      'SELECT * FROM videos_new WHERE id = $1',
      [videoId]
    )

    if (videoResult.rows.length === 0) {
      console.error('Video not found')
      return { success: false, error: 'Video not found' }
    }

    const video = videoResult.rows[0]

    // Check if user has access to this video
    // This would include subscription checks, etc.
    
    // For now, return the video with public URL
    // In production, you'd generate signed URLs for private videos
    return {
      success: true,
      video: {
        ...video,
        videoUrl: video.videoUrl, // This could be a signed URL
      },
    }
  } catch (error) {
    console.error('Error getting video:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
