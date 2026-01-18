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
    
    // Decode the key first to handle any double-encoding
    let decodedKey: string
    try {
      decodedKey = decodeURIComponent(key)
    } catch {
      // If decoding fails, use the key as-is
      decodedKey = key
    }
    
    // Encode each segment of the path separately to handle special characters
    // This properly handles spaces, parentheses, and other special characters
    const pathSegments = decodedKey.split('/')
    const encodedSegments = pathSegments.map(segment => {
      // Encode the segment, but preserve forward slashes
      return encodeURIComponent(segment)
    })
    const encodedKey = encodedSegments.join('/')
    
    console.log('S3 Video URL request:', {
      originalKey: key,
      decodedKey: decodedKey,
      encodedKey: encodedKey
    })
    
    const publicUrl = getPublicUrl(encodedKey)
    
    console.log('Generated public URL:', publicUrl)
    
    return NextResponse.json(
      { url: publicUrl },
      {
        headers: {
          // Cache for 1 hour, stale-while-revalidate for 24 hours
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Error generating video URL:', error)
    console.error('Key that failed:', key)
    
    // Fallback: try simpler encoding
    try {
      const simpleEncodedKey = encodeURIComponent(key)
      const publicUrl = getPublicUrl(simpleEncodedKey)
      console.log('Fallback URL:', publicUrl)
      return NextResponse.json({ url: publicUrl })
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          key: key
        },
        { status: 500 }
      )
    }
  }
}


