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
 * Extract region from S3 key path
 */
function extractRegionFromKey(key: string): string | null {
  const parts = key.split('/')
  // Format: thumbnails/Video/groupes-musculaires/{region}/...
  if (parts.length >= 4 && parts[0] === 'thumbnails' && parts[1] === 'Video' && parts[2] === 'groupes-musculaires') {
    return parts[3] || null
  }
  // Format: Video/groupes-musculaires/{region}/...
  if (parts.length >= 3 && parts[1] === 'groupes-musculaires') {
    return parts[2] || null
  }
  return null
}

/**
 * Extract video number and title from thumbnail filename
 * Format: "10. Extension de jambes tendues-thumb.jpg" or "10.1 Extension-thumb.jpg"
 */
function extractNumberAndTitleFromThumbnail(filename: string): { number: number | null, title: string } {
  // Remove -thumb.jpg suffix
  const nameWithoutExt = filename.replace(/-thumb\.(jpg|jpeg|png)$/i, '')
  
  // Format 1: "10.1 Titre..." (numéro décimal)
  let match = nameWithoutExt.match(/^(\d+\.\d+)\s+(.+)$/)
  if (match) {
    return {
      number: parseFloat(match[1]),
      title: match[2].trim()
    }
  }
  
  // Format 2: "10. Titre..." (numéro entier)
  match = nameWithoutExt.match(/^(\d+)\.\s*(.+)$/)
  if (match) {
    return {
      number: parseInt(match[1], 10),
      title: match[2].trim()
    }
  }
  
  // Pas de numéro
  return { number: null, title: nameWithoutExt }
}

/**
 * Extract video S3 key from thumbnail key (for fallback matching)
 */
function extractVideoKeyFromThumbnailKey(thumbnailKey: string): string | null {
  if (!thumbnailKey.startsWith('thumbnails/')) {
    return null
  }
  
  const withoutPrefix = thumbnailKey.substring('thumbnails/'.length)
  const baseName = withoutPrefix.replace(/-thumb\.(jpg|jpeg|png)$/i, '')
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
    console.log('⚠️  IMPORTANT: Only processing thumbnails from thumbnails/Video/groupes-musculaires/')
    console.log('   PROGRAMMES thumbnails will remain unchanged')

    // List all thumbnails in S3 (only groupes-musculaires)
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'thumbnails/Video/groupes-musculaires/',
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
    // ⚠️ IMPORTANT: Only sync thumbnails for MUSCLE_GROUPS videos
    // PROGRAMMES videos remain unchanged
    const { data: allVideos, error: videosError } = await db
      .from('videos_new')
      .select('id, title, videoUrl, thumbnail, videoNumber, region')
      .eq('isPublished', true)
      .eq('videoType', 'MUSCLE_GROUPS')
      .execute()
    
    // Filter out videos with null videoUrl (since .not() is not available)
    const videos = (allVideos || []).filter((v: any) => v.videoUrl !== null && v.videoUrl !== undefined && v.videoUrl !== '')

    if (videosError) {
      throw videosError
    }

    console.log(`📋 Found ${videos?.length || 0} videos in database`)

    // Create multiple maps for different matching strategies
    // 1. Map by videoNumber + region (PRIORITÉ 1 - comme pour les fichiers Markdown)
    const videoMapByNumber = new Map<string, any>()
    // 2. Map by videoUrl (fallback)
    const videoMapByUrl = new Map<string, any>()
    
    videos?.forEach((video: any) => {
      // Strategy 1: videoNumber + region
      if (video.videoNumber !== null && video.videoNumber !== undefined && video.region) {
        const key = `${video.videoNumber}:${video.region}`
        videoMapByNumber.set(key, video)
      }
      
      // Strategy 2: videoUrl (fallback)
      if (video.videoUrl) {
        try {
          const url = new URL(video.videoUrl)
          const s3Key = decodeURIComponent(url.pathname.substring(1))
          videoMapByUrl.set(s3Key, video)
        } catch {
          // Skip invalid URLs
        }
      }
    })

    // Match thumbnails with videos
    const results = []
    let syncedCount = 0
    let matchedByNumber = 0
    let matchedByUrl = 0

    for (const thumbnail of thumbnails) {
      const thumbnailKey = thumbnail.Key || ''
      const filename = thumbnailKey.split('/').pop() || ''
      
      // PRIORITÉ 1 : Matching par videoNumber + region (comme pour les fichiers Markdown)
      const region = extractRegionFromKey(thumbnailKey)
      const { number: videoNumber, title: thumbnailTitle } = extractNumberAndTitleFromThumbnail(filename)
      
      let video: any = null
      let matchMethod = ''
      
      if (videoNumber !== null && videoNumber !== undefined && region) {
        const key = `${videoNumber}:${region}`
        video = videoMapByNumber.get(key)
        if (video) {
          matchMethod = 'videoNumber+region'
          matchedByNumber++
        }
      }
      
      // PRIORITÉ 2 : Fallback par videoUrl (si matching par numéro échoue)
      if (!video) {
        const videoKey = extractVideoKeyFromThumbnailKey(thumbnailKey)
        if (videoKey) {
          video = videoMapByUrl.get(videoKey)
          if (video) {
            matchMethod = 'videoUrl'
            matchedByUrl++
          }
        }
      }
      
      // PRIORITÉ 3 : Fallback par partial match (encodage différent)
      if (!video) {
        const videoKey = extractVideoKeyFromThumbnailKey(thumbnailKey)
        if (videoKey) {
          const videoKeyLower = videoKey.toLowerCase()
          for (const [key, v] of videoMapByUrl.entries()) {
            if (key.toLowerCase() === videoKeyLower || 
                key.toLowerCase().includes(videoKeyLower) ||
                videoKeyLower.includes(key.toLowerCase())) {
              video = v
              matchMethod = 'videoUrl-partial'
              matchedByUrl++
              break
            }
          }
        }
      }
      
      if (!video) {
        // No match found
        results.push({
          thumbnailKey,
          videoNumber,
          region,
          success: false,
          error: 'No matching video found in database'
        })
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
          videoNumber: video.videoNumber,
          region: video.region,
          thumbnailKey,
          matchMethod,
          success: true,
          action: video.thumbnail ? 'Updated existing thumbnail' : 'Added new thumbnail'
        })
      } else {
        results.push({
          videoId: video.id,
          title: video.title,
          thumbnailKey,
          matchMethod,
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
        matchedByNumber: matchedByNumber,
        matchedByUrl: matchedByUrl,
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
