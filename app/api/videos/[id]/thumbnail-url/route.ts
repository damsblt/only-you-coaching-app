import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSignedVideoUrl } from '@/lib/s3'

/**
 * GET - Get signed URL for video thumbnail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get video from database
    const { data: videos, error } = await db
      .from('videos_new')
      .select('thumbnail, videoUrl')
      .eq('id', id)
      .execute()
    
    const video = videos && videos.length > 0 ? videos[0] : null

    if (error || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (!video.thumbnail) {
      return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 })
    }

    // Extract S3 key from thumbnail URL
    try {
      const thumbnailUrl = new URL(video.thumbnail)
      const encodedPath = thumbnailUrl.pathname
      const decodedPath = decodeURIComponent(encodedPath)
      const s3Key = decodedPath.substring(1) // Remove leading slash

      // Generate signed URL (valid for 24 hours)
      const signedUrlResult = await getSignedVideoUrl(s3Key, 86400)

      if (!signedUrlResult.success) {
        console.error('Failed to generate signed URL:', signedUrlResult.error)
        // Return original URL as fallback
        return NextResponse.json({ url: video.thumbnail })
      }

      return NextResponse.json({ url: signedUrlResult.url })
    } catch (urlError) {
      console.error('Error processing thumbnail URL:', urlError)
      // Return original URL as fallback
      return NextResponse.json({ url: video.thumbnail })
    }
  } catch (error) {
    console.error('Error in thumbnail-url route:', error)
    return NextResponse.json(
      { error: 'Failed to get thumbnail URL' },
      { status: 500 }
    )
  }
}

