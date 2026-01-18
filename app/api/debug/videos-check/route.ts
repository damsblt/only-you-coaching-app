import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSignedVideoUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking videos in database...')
    
    if (!db) {
      return NextResponse.json({ 
        error: 'Database client not initialized' 
      }, { status: 500 })
    }

    // Fetch a few sample videos (both published and unpublished)
    const { data: videos, error } = await db
      .from('videos_new')
      .select('id, title, videoUrl, isPublished')
      .limit(20)

    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch videos', 
        details: error.message 
      }, { status: 500 })
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({ 
        message: 'No published videos found',
        videos: []
      })
    }

    // Test each video URL
    const results = await Promise.all(
      videos.map(async (video) => {
        const result: any = {
          id: video.id,
          title: video.title,
          videoUrl: video.videoUrl,
          issues: []
        }

        // Check if videoUrl exists
        if (!video.videoUrl) {
          result.issues.push('❌ videoUrl is missing')
          return result
        }

        // Try to parse the URL
        try {
          const videoUrl = new URL(video.videoUrl)
          result.urlParsed = true
          result.hostname = videoUrl.hostname
          result.pathname = videoUrl.pathname
          result.decodedPath = decodeURIComponent(videoUrl.pathname)
          
          // Extract S3 key
          const s3Key = videoUrl.pathname.substring(1) // Remove leading slash
          const decodedS3Key = decodeURIComponent(s3Key)
          result.s3Key = decodedS3Key
          
          // Check if it starts with Video/
          if (!decodedS3Key.startsWith('Video/')) {
            result.issues.push(`⚠️ S3 key doesn't start with "Video/": "${decodedS3Key}"`)
          } else {
            result.issues.push('✅ S3 key format is correct')
          }

          // Try to generate signed URL
          try {
            const signedUrlResult = await getSignedVideoUrl(decodedS3Key, 3600)
            if (signedUrlResult.success) {
              result.signedUrlGenerated = true
              result.signedUrlLength = signedUrlResult.url.length
              result.issues.push('✅ Signed URL generated successfully')
            } else {
              result.issues.push(`❌ Failed to generate signed URL: ${signedUrlResult.error}`)
            }
          } catch (s3Error) {
            result.issues.push(`❌ Error generating signed URL: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`)
          }
        } catch (urlError) {
          result.issues.push(`❌ Invalid URL format: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`)
          result.urlParsed = false
        }

        return result
      })
    )

    return NextResponse.json({
      totalVideos: videos.length,
      videos: results,
      summary: {
        withValidUrls: results.filter(r => r.urlParsed).length,
        withValidS3Keys: results.filter(r => r.s3Key?.startsWith('Video/')).length,
        withSignedUrls: results.filter(r => r.signedUrlGenerated).length,
        withIssues: results.filter(r => r.issues.some((i: string) => i.startsWith('❌'))).length
      }
    })
  } catch (error) {
    console.error('Error in videos check:', error)
    return NextResponse.json({
      error: 'Failed to check videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
