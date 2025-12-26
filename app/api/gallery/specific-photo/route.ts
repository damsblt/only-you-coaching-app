import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

// GET /api/gallery/specific-photo - Get URL for a specific photo from S3
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const s3Key = searchParams.get('key')
    
    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key parameter is required' },
        { status: 400 }
      )
    }

    // Check AWS credentials
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY
    )
    
    if (!hasAwsCredentials) {
      console.warn('⚠️ AWS credentials not configured. Using public URL fallback.')
      // Fallback to public URL if credentials are not available
      const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const publicUrl = getPublicUrl(encodedKey)
      return NextResponse.json({ url: publicUrl })
    }

    try {
      // Try to generate signed URL first (valid for 7 days)
      const signedUrlResult = await getSignedVideoUrl(s3Key, 604800)
      if (signedUrlResult.success && signedUrlResult.url) {
        const cleanUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
        return NextResponse.json({ url: cleanUrl })
      } else {
        // Fallback to public URL if signed URL generation fails
        console.warn(`⚠️ Failed to generate signed URL for ${s3Key}, using public URL`)
        const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
        const publicUrl = getPublicUrl(encodedKey)
        return NextResponse.json({ url: publicUrl })
      }
    } catch (error) {
      // Fallback to public URL on error
      console.warn(`⚠️ Error generating signed URL for ${s3Key}, using public URL:`, error)
      const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const publicUrl = getPublicUrl(encodedKey)
      return NextResponse.json({ url: publicUrl })
    }
  } catch (error) {
    console.error('❌ Error fetching specific photo:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        url: null
      },
      { status: 500 }
    )
  }
}


