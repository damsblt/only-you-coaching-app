import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Video key is required' }, { status: 400 })
  }

  try {
    // Check AWS credentials
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY
    )
    
    if (!hasAwsCredentials) {
      console.warn('⚠️ AWS credentials not configured. Using public URL fallback.')
      // Fallback to public URL if credentials are not available
      const decodedKey = decodeURIComponent(key)
      const encodedKey = decodedKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const publicUrl = getPublicUrl(encodedKey)
      return NextResponse.json({ url: publicUrl })
    }

    // Try to generate signed URL first (valid for 1 hour)
    const decodedKey = decodeURIComponent(key)
    const result = await getSignedVideoUrl(decodedKey, 3600)

    if (!result.success || !result.url) {
      // Fallback to public URL if signed URL generation fails
      console.warn(`⚠️ Failed to generate signed URL for ${decodedKey}, using public URL:`, result.error)
      const encodedKey = decodedKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const publicUrl = getPublicUrl(encodedKey)
      return NextResponse.json({ url: publicUrl })
    }

    // Clean the URL to remove any potential newlines or whitespace issues
    const cleanUrl = result.url.trim().replace(/\n/g, '').replace(/\r/g, '')
    return NextResponse.json({ url: cleanUrl })
  } catch (error) {
    console.error('Error generating video URL:', error)
    // Fallback to public URL on error
    try {
      const decodedKey = decodeURIComponent(key)
      const encodedKey = decodedKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const publicUrl = getPublicUrl(encodedKey)
      return NextResponse.json({ url: publicUrl })
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  }
}


