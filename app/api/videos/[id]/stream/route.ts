import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSignedVideoUrl } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: videoId } = params
    console.log('[stream] incoming id:', videoId)

    // Validate video ID
    if (!videoId || typeof videoId !== 'string') {
      console.error('[stream] invalid video ID:', videoId)
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Get video from database via Supabase (server-side)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[stream] missing envs:', { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey })
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    // Fetch video data with more fields for better error handling
    const { data: video, error } = await supabase
      .from('videos_new')
      .select('videoUrl, title, isPublished')
      .eq('id', videoId)
      .maybeSingle()

    if (error) {
      console.error('[stream] database error:', error.message, 'for id:', videoId)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

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
      s3Key = videoUrl.pathname.substring(1) // Remove leading slash
      console.log('[stream] extracted S3 key:', s3Key)
      
      // Validate that we have a proper S3 key
      if (!s3Key || !s3Key.startsWith('Video/')) {
        console.error('[stream] invalid S3 key format:', s3Key)
        return NextResponse.json({ error: 'Invalid video key format' }, { status: 500 })
      }
    } catch (urlError) {
      console.error('[stream] invalid video URL:', video.videoUrl)
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 500 })
    }

    // Generate public URL for S3 access (videos are now publicly accessible)
    try {
      const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${s3Key}`
      console.log('[stream] generated public URL for key:', s3Key)
      
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

      // Redirect to the public URL
      return NextResponse.redirect(publicUrl, { headers })
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
  { params }: { params: { id: string } }
) {
  return GET(request, { params })
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Content-Type')
  
  return new NextResponse(null, { status: 200, headers })
}
