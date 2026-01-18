import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPublicUrl } from '@/lib/s3'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

const s3Client = hasAwsCredentials ? new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const checkS3 = searchParams.get('checkS3') === 'true'

    console.log('🔍 Checking thumbnail URLs in Neon database...')

    // Fetch ALL published videos first to see what we have
    // Try without isPublished filter first to see what's in the database
    const { data: allVideos, error: fetchError } = await db
      .from('videos_new')
      .select('id, title, thumbnail, videoUrl, isPublished')
      .limit(limit * 3) // Get more to see what's there
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch videos', 
        details: fetchError.message 
      }, { status: 500 })
    }

    console.log(`📋 Found ${allVideos?.length || 0} published videos total`)

    // Show all videos first (for debugging)
    const allVideosInfo = (allVideos || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      hasThumbnail: !!v.thumbnail,
      thumbnailType: v.thumbnail ? typeof v.thumbnail : 'null',
      thumbnailLength: v.thumbnail ? v.thumbnail.length : 0,
      thumbnailPreview: v.thumbnail ? v.thumbnail.substring(0, 100) : null
    }))

    // Filter to only videos with thumbnails (non-null and non-empty)
    const videos = (allVideos || []).filter((v: any) => {
      return v.thumbnail !== null && v.thumbnail !== undefined && String(v.thumbnail).trim() !== ''
    }).slice(0, limit)

    console.log(`📋 Found ${videos.length} videos with thumbnails (out of ${allVideos?.length || 0} total)`)

    if (!videos || videos.length === 0) {
      return NextResponse.json({ 
        message: 'No videos with thumbnails found',
        debug: {
          totalVideos: allVideos?.length || 0,
          allVideosInfo: allVideosInfo,
          filterResult: (allVideos || []).map((v: any) => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
            thumbnailType: typeof v.thumbnail,
            isNull: v.thumbnail === null,
            isUndefined: v.thumbnail === undefined,
            isEmpty: v.thumbnail === '',
            trimmedEmpty: v.thumbnail ? String(v.thumbnail).trim() === '' : true
          }))
        },
        videos: []
      })
    }

    console.log(`📋 Found ${videos.length} videos with thumbnails`)

    // Analyze each thumbnail URL
    const results = await Promise.all(
      videos.map(async (video: any) => {
        const result: any = {
          videoId: video.id,
          title: video.title,
          thumbnailInNeon: video.thumbnail,
          issues: [],
          suggestions: []
        }

        if (!video.thumbnail) {
          result.issues.push('❌ Thumbnail is null or empty in database')
          return result
        }

        // Try to parse the URL from Neon
        try {
          const thumbnailUrl = new URL(video.thumbnail)
          result.urlParsed = true
          result.hostname = thumbnailUrl.hostname
          result.pathname = thumbnailUrl.pathname
          result.searchParams = thumbnailUrl.search

          // Extract S3 key
          let s3Key: string
          try {
            const decodedPath = decodeURIComponent(thumbnailUrl.pathname)
            s3Key = decodedPath.substring(1) // Remove leading slash
          } catch {
            s3Key = thumbnailUrl.pathname.substring(1)
          }

          result.s3Key = s3Key
          result.decodedS3Key = decodeURIComponent(thumbnailUrl.pathname.substring(1))

          // Check if it's an S3 URL
          if (thumbnailUrl.hostname.includes('s3') || thumbnailUrl.hostname.includes('amazonaws.com')) {
            result.isS3Url = true

            // Check if it starts with thumbnails/
            if (s3Key.startsWith('thumbnails/')) {
              result.isPublicThumbnail = true
              
              // Generate public URL using our function
              const publicUrl = getPublicUrl(s3Key)
              result.generatedPublicUrl = publicUrl
              result.issues.push('✅ S3 key format is correct (thumbnails/)')

              // Check if file exists in S3
              if (checkS3 && s3Client) {
                try {
                  const headCommand = new HeadObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                  })
                  await s3Client.send(headCommand)
                  result.existsInS3 = true
                  result.issues.push('✅ Thumbnail exists in S3')
                } catch (s3Error: any) {
                  if (s3Error.name === 'NotFound' || s3Error.$metadata?.httpStatusCode === 404) {
                    result.existsInS3 = false
                    result.issues.push('❌ Thumbnail does NOT exist in S3')
                  } else {
                    result.existsInS3 = 'unknown'
                    result.issues.push(`⚠️ Error checking S3: ${s3Error.message}`)
                  }
                }
              }

              // Test HTTP accessibility
              try {
                const testUrl = publicUrl
                const response = await fetch(testUrl, { 
                  method: 'HEAD',
                  signal: AbortSignal.timeout(5000) // 5 second timeout
                })
                if (response.ok) {
                  result.httpAccessible = true
                  result.httpStatusCode = response.status
                  result.contentType = response.headers.get('content-type')
                  result.issues.push('✅ Thumbnail is HTTP accessible')
                } else {
                  result.httpAccessible = false
                  result.httpStatusCode = response.status
                  result.issues.push(`❌ Thumbnail not HTTP accessible (${response.status})`)
                  
                  if (response.status === 403) {
                    result.suggestions.push('🔧 Thumbnail might be private - check S3 bucket policy for thumbnails/ folder')
                  } else if (response.status === 404) {
                    result.suggestions.push('🔧 Thumbnail file does not exist at this path in S3')
                  }
                }
              } catch (fetchError: any) {
                result.httpAccessible = false
                result.issues.push(`❌ Error testing HTTP access: ${fetchError.message}`)
              }

              // Compare URLs
              if (video.thumbnail !== publicUrl) {
                result.urlMismatch = true
                result.suggestions.push(`🔧 URL in Neon differs from generated public URL. Consider updating to: ${publicUrl}`)
              } else {
                result.issues.push('✅ URL in Neon matches generated public URL')
              }

            } else {
              result.isPublicThumbnail = false
              result.issues.push(`⚠️ S3 key doesn't start with "thumbnails/": "${s3Key}"`)
              result.suggestions.push('🔧 Thumbnail should be in thumbnails/ folder for public access')
            }

          } else if (thumbnailUrl.hostname.includes('neon.tech') || thumbnailUrl.hostname.includes('storage.neon')) {
            result.isNeonUrl = true
            result.issues.push('✅ Thumbnail URL is from Neon Storage')
          } else {
            result.issues.push(`⚠️ Unknown URL hostname: ${thumbnailUrl.hostname}`)
          }

        } catch (urlError) {
          result.urlParsed = false
          result.issues.push(`❌ Invalid URL format: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`)
          result.suggestions.push('🔧 Thumbnail URL in Neon is not a valid URL format')
        }

        return result
      })
    )

    // Summary
    const summary = {
      total: results.length,
      withValidUrls: results.filter(r => r.urlParsed).length,
      withS3Urls: results.filter(r => r.isS3Url).length,
      withPublicThumbnails: results.filter(r => r.isPublicThumbnail).length,
      httpAccessible: results.filter(r => r.httpAccessible === true).length,
      httpNotAccessible: results.filter(r => r.httpAccessible === false).length,
      existsInS3: results.filter(r => r.existsInS3 === true).length,
      notExistsInS3: results.filter(r => r.existsInS3 === false).length,
      urlMismatches: results.filter(r => r.urlMismatch).length,
      withIssues: results.filter(r => r.issues.some((i: string) => i.startsWith('❌'))).length
    }

    return NextResponse.json({
      message: `Analyzed ${results.length} videos with thumbnails`,
      summary,
      allVideosInfo, // Show all videos for debugging
      videos: results,
      note: checkS3 ? 'S3 existence check was performed' : 'S3 existence check was skipped (add ?checkS3=true to enable)'
    })
  } catch (error) {
    console.error('Error checking thumbnail URLs:', error)
    return NextResponse.json({
      error: 'Failed to check thumbnail URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
