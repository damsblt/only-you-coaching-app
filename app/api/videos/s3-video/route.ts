import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Video key is required' }, { status: 400 })
  }

  try {
    // Generate a signed URL (valid for 1 hour)
    const result = await getSignedVideoUrl(decodeURIComponent(key), 3600)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate video URL', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error('Error generating signed video URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


