import { NextRequest, NextResponse } from 'next/server'
import { uploadToS3, generateVideoKey, generateThumbnailKey } from '@/lib/s3'

// POST - Upload video and/or thumbnail files to S3
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File | null
    const thumbnailFile = formData.get('thumbnail') as File | null

    if (!videoFile && !thumbnailFile) {
      return NextResponse.json(
        { error: 'At least one file (video or thumbnail) is required' },
        { status: 400 }
      )
    }

    const results: {
      videoUrl?: string
      thumbnailUrl?: string
      errors?: string[]
    } = {}

    // Upload video file if provided
    if (videoFile) {
      // Validate file type
      if (!videoFile.type.startsWith('video/')) {
        return NextResponse.json(
          { error: 'Video file must be a valid video format' },
          { status: 400 }
        )
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024 // 500MB
      if (videoFile.size > maxSize) {
        return NextResponse.json(
          { error: 'Video file size must be less than 500MB' },
          { status: 400 }
        )
      }

      // Convert file to buffer
      const fileBuffer = Buffer.from(await videoFile.arrayBuffer())

      // Generate unique key using admin identifier
      const videoKey = generateVideoKey('admin', videoFile.name)

      // Upload to S3
      const videoUpload = await uploadToS3(
        fileBuffer,
        videoKey,
        videoFile.type,
        {
          originalName: videoFile.name,
          uploadedBy: 'admin',
          uploadedAt: new Date().toISOString(),
        }
      )

      if (!videoUpload.success) {
        return NextResponse.json(
          { error: videoUpload.error || 'Failed to upload video' },
          { status: 500 }
        )
      }

      results.videoUrl = videoUpload.location
    }

    // Upload thumbnail file if provided
    if (thumbnailFile) {
      // Validate file type
      if (!thumbnailFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Thumbnail file must be a valid image format' },
          { status: 400 }
        )
      }

      // Convert file to buffer
      const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer())

      // Generate unique key
      // If we have a video file, use it for the thumbnail key, otherwise generate a unique key
      let thumbnailKey: string
      if (videoFile) {
        // Use video file name to generate thumbnail key
        const videoKey = generateVideoKey('admin', videoFile.name)
        // Extract base thumbnail key and replace extension
        const baseThumbnailKey = generateThumbnailKey('admin', videoKey)
        const extension = thumbnailFile.name.split('.').pop() || 'jpg'
        // Replace .jpg extension with actual file extension
        thumbnailKey = baseThumbnailKey.replace(/\.jpg$/, `.${extension}`)
      } else {
        // Generate a standalone thumbnail key
        const timestamp = Date.now()
        const extension = thumbnailFile.name.split('.').pop() || 'jpg'
        thumbnailKey = `thumbnails/admin/${timestamp}-${thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`
      }

      // Upload to S3
      const thumbnailUpload = await uploadToS3(
        thumbnailBuffer,
        thumbnailKey,
        thumbnailFile.type
      )

      if (!thumbnailUpload.success) {
        // If video was uploaded successfully but thumbnail failed, still return video URL
        if (results.videoUrl) {
          results.errors = results.errors || []
          results.errors.push(
            `Video uploaded successfully, but thumbnail upload failed: ${thumbnailUpload.error}`
          )
        } else {
          return NextResponse.json(
            { error: thumbnailUpload.error || 'Failed to upload thumbnail' },
            { status: 500 }
          )
        }
      } else {
        results.thumbnailUrl = thumbnailUpload.location
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload files' },
      { status: 500 }
    )
  }
}

