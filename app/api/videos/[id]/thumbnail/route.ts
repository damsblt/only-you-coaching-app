import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

// Regenerate thumbnail for a video
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const video = await prisma.video.findUnique({
      where: { id }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Extract S3 key from video URL
    const videoUrl = new URL(video.videoUrl)
    const s3Key = videoUrl.pathname.substring(1) // Remove leading slash

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Create local file paths
    const videoFileName = path.basename(s3Key)
    const videoPath = path.join(tempDir, videoFileName)
    const thumbnailFileName = `${path.parse(videoFileName).name}-thumb.jpg`
    const thumbnailPath = path.join(tempDir, thumbnailFileName)
    const thumbnailS3Key = `thumbnails/${thumbnailFileName}`

    try {
      // Download video from S3
      const downloadCommand = `aws s3 cp "s3://${process.env.AWS_S3_BUCKET_NAME}/${s3Key}" "${videoPath}"`
      await execAsync(downloadCommand)

      // Generate thumbnail using ffmpeg
      const thumbnailCommand = `ffmpeg -i "${videoPath}" -ss 5 -vframes 1 -q:v 2 "${thumbnailPath}" -y`
      await execAsync(thumbnailCommand)

      // Upload thumbnail to S3
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })

      const fileContent = fs.readFileSync(thumbnailPath)
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: thumbnailS3Key,
        Body: fileContent,
        ContentType: 'image/jpeg'
      })

      await s3Client.send(uploadCommand)

      // Generate public URL
      const thumbnailUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailS3Key}`

      // Update database with new thumbnail URL
      const updatedVideo = await prisma.video.update({
        where: { id: video.id },
        data: { thumbnail: thumbnailUrl }
      })

      // Clean up local files
      try {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files:', cleanupError)
      }

      return NextResponse.json(updatedVideo)

    } catch (error) {
      console.error('Error generating thumbnail:', error)
      return NextResponse.json(
        { error: 'Failed to generate thumbnail' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in thumbnail regeneration:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate thumbnail' },
      { status: 500 }
    )
  }
}


