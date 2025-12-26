import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Video key is required' }, { status: 400 })
  }

  try {
    // Use public URLs directly for production (signed URLs require proper IAM permissions)
    // The bucket policy allows public read access for Photos/*, Video/*, and thumbnails/*
    const decodedKey = decodeURIComponent(key)
    const encodedKey = decodedKey.split('/').map(segment => encodeURIComponent(segment)).join('/')
    const publicUrl = getPublicUrl(encodedKey)
    return NextResponse.json({ url: publicUrl })
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


