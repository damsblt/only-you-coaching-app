import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

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
      
      // Extract S3 key from pathname
      let s3Key: string
      try {
        // Decode pathname to handle URL encoding
        const decodedPath = decodeURIComponent(thumbnailUrl.pathname)
        s3Key = decodedPath.substring(1) // Remove leading slash
      } catch (decodeError) {
        // If decode fails, use pathname as-is
        s3Key = thumbnailUrl.pathname.substring(1)
      }
      
      // If it's in the thumbnails folder, use public URL (thumbnails are public)
      if (s3Key.startsWith('thumbnails/')) {
        // Use getPublicUrl which handles encoding properly
        const publicUrl = getPublicUrl(s3Key)
        return NextResponse.json({ url: publicUrl })
      }
      
      // For non-thumbnail files, generate signed URL
      const signedUrlResult = await getSignedVideoUrl(s3Key, 86400)

      if (!signedUrlResult.success) {
        console.error('Failed to generate signed URL:', signedUrlResult.error)
        // Try public URL as fallback
        try {
          const publicUrl = getPublicUrl(s3Key)
          return NextResponse.json({ url: publicUrl })
        } catch {
          // Return original URL as final fallback
          return NextResponse.json({ url: video.thumbnail })
        }
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

