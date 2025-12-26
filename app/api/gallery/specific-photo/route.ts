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

    // Use public URLs directly for production (signed URLs require proper IAM permissions)
    // The bucket policy allows public read access for Photos/*, Video/*, and thumbnails/*
    const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
    const publicUrl = getPublicUrl(encodedKey)
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


