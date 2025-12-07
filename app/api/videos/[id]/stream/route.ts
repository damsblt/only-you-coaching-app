import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSignedVideoUrl } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const { searchParams } = new URL(request.url)
    const startTime = searchParams.get('t') // Paramètre de temps de début
    console.log('[stream] incoming id:', videoId, 'startTime:', startTime)

    // Validate video ID
    if (!videoId || typeof videoId !== 'string') {
      console.error('[stream] invalid video ID:', videoId)
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Get video from database via Neon (server-side)
    if (!db) {
      console.error('[stream] database client not initialized')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    // Fetch video data with more fields for better error handling
    const result = await db
      .from('videos_new')
      .select('videoUrl, title, isPublished')
      .eq('id', videoId)
      .single()

    if (result.error) {
      // Check if it's a "not found" error
      if (result.error.code === 'PGRST116' || result.error.message?.includes('No rows returned')) {
        console.error('[stream] video not found for id:', videoId)
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }
      console.error('[stream] database error:', result.error.message || result.error, 'for id:', videoId)
      return NextResponse.json({ error: 'Database error', details: result.error.message || String(result.error) }, { status: 500 })
    }

    const video = result.data
    if (!video) {
      console.error('[stream] video not found for id:', videoId)
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (!video.isPublished) {
      console.error('[stream] video not published for id:', videoId)
      return NextResponse.json({ error: 'Video not available' }, { status: 403 })
    }

    if (!video.videoUrl) {
      console.error('[stream] video URL missing for id:', videoId)
      return NextResponse.json({ error: 'Video URL not available' }, { status: 404 })
    }

    console.log('[stream] found video:', { title: video.title, url: video.videoUrl })

    // Extract S3 key from the video URL
    let s3Key: string
    try {
      const videoUrl = new URL(video.videoUrl)
      // Extract key from S3 URL (remove bucket name and region)
      // URL format: https://only-you-coaching.s3.eu-north-1.amazonaws.com/Video/groupes-musculaires/abdos/video-name-mp4
      // The pathname may be URL-encoded, so decode it to get the original key
      const decodedPath = decodeURIComponent(videoUrl.pathname)
      s3Key = decodedPath.substring(1) // Remove leading slash
      console.log('[stream] extracted S3 key:', s3Key)
      
      // Validate that we have a proper S3 key
      if (!s3Key || !s3Key.startsWith('Video/')) {
        console.error('[stream] invalid S3 key format:', s3Key)
        return NextResponse.json({ error: 'Invalid video key format' }, { status: 500 })
      }
    } catch (urlError) {
      console.error('[stream] invalid video URL:', video.videoUrl, 'error:', urlError)
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 500 })
    }

    // Generate signed URL for S3 access (videos require authentication)
    try {
      console.log('[stream] Generating signed URL for S3 key:', s3Key)
      
      // Generate a signed URL (valid for 1 hour)
      const signedUrlResult = await getSignedVideoUrl(s3Key, 3600)
      
      if (!signedUrlResult.success) {
        console.error('[stream] Failed to generate signed URL:', signedUrlResult.error)
        return NextResponse.json({ 
          error: 'Failed to generate video access URL', 
          details: signedUrlResult.error || 'S3 configuration error'
        }, { status: 500 })
      }
      
      let finalUrl = signedUrlResult.url
      
      // Add start time parameter if specified (for video timestamp)
      if (startTime) {
        // For signed URLs, append the time fragment
        finalUrl = `${finalUrl}#t=${startTime}`
        console.log('[stream] added start time to signed URL:', startTime)
      }
      
      console.log('[stream] Generated signed URL (length:', finalUrl.length, 'chars)')
    
      // Set appropriate headers for video streaming
      const headers = new Headers()
      headers.set('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
      headers.set('Accept-Ranges', 'bytes')
      headers.set('Content-Type', 'video/mp4')
      
      // Add CORS headers for better compatibility
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Content-Type')

      // Handle HEAD requests for preflight checks
      if (request.method === 'HEAD') {
        return new NextResponse(null, { status: 200, headers })
      }

      // Redirect to the signed URL (307 preserves method, better for video elements)
      return NextResponse.redirect(finalUrl, 307)
    } catch (urlError) {
      console.error('[stream] error generating public URL:', urlError)
      return NextResponse.json({ error: 'Failed to generate video access URL' }, { status: 500 })
    }
  } catch (error) {
    console.error('[stream] unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    )
  }
}

// Handle HEAD requests for video preloading
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return GET(request, { params })
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Content-Type')
  
  return new NextResponse(null, { status: 200, headers })
}
