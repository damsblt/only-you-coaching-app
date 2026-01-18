import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPublicUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
  try {
    // Simple test - get videos exactly like /api/videos does
    const { data: videos, error } = await db
      .from('videos_new')
      .select('id, title, thumbnail, videoUrl')
      .eq('isPublished', true)
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch videos', 
        details: error.message 
      }, { status: 500 })
    }

    // Analyze thumbnails
    const results = (videos || []).map((video: any) => {
      const result: any = {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        hasThumbnail: !!video.thumbnail,
        thumbnailLength: video.thumbnail ? video.thumbnail.length : 0
      }

      if (video.thumbnail) {
        try {
          const url = new URL(video.thumbnail)
          result.isValidUrl = true
          result.hostname = url.hostname
          result.pathname = url.pathname
          
          // Extract S3 key
          const s3Key = decodeURIComponent(url.pathname.substring(1))
          result.s3Key = s3Key
          
          // Generate public URL
          if (s3Key.startsWith('thumbnails/')) {
            result.generatedPublicUrl = getPublicUrl(s3Key)
            result.urlMatches = video.thumbnail === result.generatedPublicUrl
          }
        } catch (e) {
          result.isValidUrl = false
          result.error = e instanceof Error ? e.message : 'Unknown error'
        }
      }

      return result
    })

    return NextResponse.json({
      total: videos?.length || 0,
      videos: results
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check thumbnails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
