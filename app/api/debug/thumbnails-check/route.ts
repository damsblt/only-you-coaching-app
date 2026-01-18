import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPublicUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking thumbnails in database...')
    
    if (!db) {
      return NextResponse.json({ 
        error: 'Database client not initialized' 
      }, { status: 500 })
    }

    // Fetch sample videos with thumbnails
    const { data: videos, error } = await db
      .from('videos_new')
      .select('id, title, thumbnail, videoUrl')
      .not('thumbnail', 'is', null)
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
        message: 'No videos with thumbnails found',
        videos: []
      })
    }

    // Test each thumbnail URL
    const results = await Promise.all(
      videos.map(async (video) => {
        const result: any = {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          issues: []
        }

        // Check if thumbnail exists
        if (!video.thumbnail) {
          result.issues.push('❌ thumbnail is missing')
          return result
        }

        // Try to parse the URL
        try {
          const thumbnailUrl = new URL(video.thumbnail)
          result.urlParsed = true
          result.hostname = thumbnailUrl.hostname
          result.pathname = thumbnailUrl.pathname
          result.decodedPath = decodeURIComponent(thumbnailUrl.pathname)
          
          // Extract S3 key
          const s3Key = thumbnailUrl.pathname.substring(1) // Remove leading slash
          const decodedS3Key = decodeURIComponent(s3Key)
          result.s3Key = decodedS3Key
          
          // Check if it starts with thumbnails/
          if (!decodedS3Key.startsWith('thumbnails/')) {
            result.issues.push(`⚠️ S3 key doesn't start with "thumbnails/": "${decodedS3Key}"`)
          } else {
            result.issues.push('✅ S3 key format is correct')
          }

          // Generate public URL
          try {
            const publicUrl = getPublicUrl(decodedS3Key)
            result.publicUrl = publicUrl
            result.issues.push('✅ Public URL generated')
            
            // Test if URL is accessible (HEAD request)
            try {
              const response = await fetch(publicUrl, { method: 'HEAD' })
              if (response.ok) {
                result.accessible = true
                result.contentType = response.headers.get('content-type')
                result.issues.push('✅ Thumbnail is accessible')
              } else {
                result.accessible = false
                result.statusCode = response.status
                result.issues.push(`❌ Thumbnail not accessible (HTTP ${response.status})`)
              }
            } catch (fetchError) {
              result.accessible = false
              result.issues.push(`❌ Error checking accessibility: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
            }
          } catch (urlError) {
            result.issues.push(`❌ Error generating public URL: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`)
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
        withValidS3Keys: results.filter(r => r.s3Key?.startsWith('thumbnails/')).length,
        withPublicUrls: results.filter(r => r.publicUrl).length,
        accessible: results.filter(r => r.accessible).length,
        withIssues: results.filter(r => r.issues.some((i: string) => i.startsWith('❌'))).length
      }
    })
  } catch (error) {
    console.error('Error in thumbnails check:', error)
    return NextResponse.json({
      error: 'Failed to check thumbnails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
