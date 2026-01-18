import { NextRequest, NextResponse } from 'next/server'
import { db, update } from '@/lib/db'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getPublicUrl } from '@/lib/s3'

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
 * Extract video S3 key from thumbnail key
 * Example: thumbnails/Video/groupes-musculaires/abdos/video-thumb.jpg
 * -> Video/groupes-musculaires/abdos/video.mp4
 */
function extractVideoKeyFromThumbnailKey(thumbnailKey: string): string | null {
  // Remove thumbnails/ prefix
  if (!thumbnailKey.startsWith('thumbnails/')) {
    return null
  }
  
  const withoutPrefix = thumbnailKey.substring('thumbnails/'.length)
  // Remove -thumb.jpg suffix and try common video extensions
  const baseName = withoutPrefix.replace(/-thumb\.jpg$/, '')
  
  // Try to find matching video with common extensions
  const extensions = ['.mp4', '.mov', '.avi', '.mkv']
  for (const ext of extensions) {
    const potentialVideoKey = baseName + ext
    // We'll check if this video exists in the database
    return potentialVideoKey
  }
  
  return baseName + '.mp4' // Default to .mp4
}

export async function POST(request: NextRequest) {
  try {
    if (!hasAwsCredentials || !s3Client) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      )
    }

    console.log('🔍 Scanning S3 for thumbnails...')

    // List all thumbnails in S3
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'thumbnails/Video/',
    })

    const response = await s3Client.send(command)
    const thumbnails = response.Contents || []

    if (thumbnails.length === 0) {
      return NextResponse.json({
        message: 'No thumbnails found in S3',
        synced: 0,
        results: []
      })
    }

    console.log(`📋 Found ${thumbnails.length} thumbnails in S3`)

    // Get all videos from database
    const { data: videos, error: videosError } = await db
      .from('videos_new')
      .select('id, title, videoUrl, thumbnail')
      .eq('isPublished', true)
      .not('videoUrl', 'is', null)

    if (videosError) {
      throw videosError
    }

    console.log(`📋 Found ${videos?.length || 0} videos in database`)

    // Create a map of video URLs to video objects for quick lookup
    const videoMap = new Map<string, any>()
    videos?.forEach((video: any) => {
      if (video.videoUrl) {
        try {
          const url = new URL(video.videoUrl)
          const s3Key = decodeURIComponent(url.pathname.substring(1))
          videoMap.set(s3Key, video)
        } catch {
          // Skip invalid URLs
        }
      }
    })

    // Match thumbnails with videos
    const results = []
    let syncedCount = 0

    for (const thumbnail of thumbnails) {
      const thumbnailKey = thumbnail.Key || ''
      
      // Extract video key from thumbnail key
      const videoKey = extractVideoKeyFromThumbnailKey(thumbnailKey)
      
      if (!videoKey) {
        continue
      }

      // Find matching video
      const video = videoMap.get(videoKey)
      
      if (!video) {
        // Try to find by partial match (in case of encoding differences)
        const videoKeyLower = videoKey.toLowerCase()
        for (const [key, v] of videoMap.entries()) {
          if (key.toLowerCase() === videoKeyLower || 
              key.toLowerCase().includes(videoKeyLower) ||
              videoKeyLower.includes(key.toLowerCase())) {
            const thumbnailUrl = getPublicUrl(thumbnailKey)
            const updateResult = await update('videos_new',
              { thumbnail: thumbnailUrl, updatedAt: new Date().toISOString() },
              { id: v.id }
            )
            
            if (!updateResult.error) {
              syncedCount++
              results.push({
                videoId: v.id,
                title: v.title,
                thumbnailKey,
                videoKey: key,
                success: true,
                action: 'Updated database with existing thumbnail'
              })
            } else {
              results.push({
                videoId: v.id,
                title: v.title,
                thumbnailKey,
                videoKey: key,
                success: false,
                error: updateResult.error.message || 'Update failed'
              })
            }
            break
          }
        }
        continue
      }

      // Check if video already has this thumbnail
      if (video.thumbnail) {
        try {
          const existingThumbnailUrl = new URL(video.thumbnail)
          const existingKey = decodeURIComponent(existingThumbnailUrl.pathname.substring(1))
          if (existingKey === thumbnailKey) {
            // Already synced
            continue
          }
        } catch {
          // URL parsing failed, update anyway
        }
      }

      // Update video with thumbnail URL
      const thumbnailUrl = getPublicUrl(thumbnailKey)
      const updateResult = await update('videos_new',
        { thumbnail: thumbnailUrl, updatedAt: new Date().toISOString() },
        { id: video.id }
      )

      if (!updateResult.error) {
        syncedCount++
        results.push({
          videoId: video.id,
          title: video.title,
          thumbnailKey,
          videoKey,
          success: true,
          action: video.thumbnail ? 'Updated existing thumbnail' : 'Added new thumbnail'
        })
      } else {
        results.push({
          videoId: video.id,
          title: video.title,
          thumbnailKey,
          videoKey,
          success: false,
          error: updateResult.error.message || 'Update failed'
        })
      }
    }

    return NextResponse.json({
      message: `Synced ${syncedCount} thumbnails from S3`,
      summary: {
        thumbnailsInS3: thumbnails.length,
        videosInDatabase: videos?.length || 0,
        synced: syncedCount,
        errors: results.filter(r => !r.success).length
      },
      results: results.slice(0, 50) // Limit results to first 50
    })
  } catch (error) {
    console.error('Error syncing thumbnails:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync thumbnails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
