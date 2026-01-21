import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl } from '@/lib/s3'

/**
 * GET /api/thumbnails/[key] - Get a thumbnail from S3 (with signed URL)
 * This endpoint proxies thumbnail requests and generates signed URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    
    if (!key) {
      return NextResponse.json({ error: 'Thumbnail key is required' }, { status: 400 })
    }

    // Decode the key (in case it's URL-encoded)
    let decodedKey: string
    try {
      decodedKey = decodeURIComponent(key)
    } catch {
      decodedKey = key
    }

    // Ensure the key starts with thumbnails/
    const s3Key = decodedKey.startsWith('thumbnails/') 
      ? decodedKey 
      : `thumbnails/${decodedKey}`

    // Generate signed URL (valid for 24 hours)
    const signedUrlResult = await getSignedVideoUrl(s3Key, 86400)

    if (!signedUrlResult.success) {
      console.error('Failed to generate signed URL for thumbnail:', s3Key, signedUrlResult.error)
      return NextResponse.json(
        { error: 'Failed to generate thumbnail URL' },
        { status: 500 }
      )
    }

    // Redirect to the signed URL
    // This allows the browser to load the image directly
    const cleanUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
    
    return NextResponse.redirect(cleanUrl, {
      status: 302,
      headers: {
        // Cache the redirect for 1 hour
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error in thumbnails route:', error)
    return NextResponse.json(
      { error: 'Failed to get thumbnail URL' },
      { status: 500 }
    )
  }
}
