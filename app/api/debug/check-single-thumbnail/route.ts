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
    const videoId = searchParams.get('videoId')
    const thumbnailUrl = searchParams.get('thumbnailUrl')

    if (!videoId && !thumbnailUrl) {
      return NextResponse.json({
        error: 'Provide either videoId or thumbnailUrl parameter'
      }, { status: 400 })
    }

    let video: any = null
    let thumbnail: string | null = null

    if (videoId) {
      // Fetch video by ID
      const { data: videos, error } = await db
        .from('videos_new')
        .select('id, title, thumbnail, videoUrl')
        .eq('id', videoId)
        .single()

      if (error) {
        return NextResponse.json({
          error: 'Failed to fetch video',
          details: error.message
        }, { status: 500 })
      }

      if (!videos) {
        return NextResponse.json({
          error: 'Video not found'
        }, { status: 404 })
      }

      video = videos
      thumbnail = video.thumbnail
    } else if (thumbnailUrl) {
      thumbnail = thumbnailUrl
    }

    if (!thumbnail) {
      return NextResponse.json({
        error: 'No thumbnail URL found',
        video: video ? { id: video.id, title: video.title } : null
      }, { status: 404 })
    }

    const result: any = {
      video: video ? { id: video.id, title: video.title } : null,
      thumbnailInNeon: thumbnail,
      issues: [],
      suggestions: []
    }

    // Parse URL
    try {
      const url = new URL(thumbnail)
      result.urlParsed = true
      result.hostname = url.hostname
      result.pathname = url.pathname
      result.searchParams = url.search

      // Extract S3 key
      let s3Key: string
      try {
        const decodedPath = decodeURIComponent(url.pathname)
        s3Key = decodedPath.substring(1)
      } catch {
        s3Key = url.pathname.substring(1)
      }

      result.s3Key = s3Key

      // Check if it's S3
      if (url.hostname.includes('s3') || url.hostname.includes('amazonaws.com')) {
        result.isS3Url = true

        // Generate correct public URL
        if (s3Key.startsWith('thumbnails/')) {
          const publicUrl = getPublicUrl(s3Key)
          result.generatedPublicUrl = publicUrl
          result.urlMatches = thumbnail === publicUrl

          if (!result.urlMatches) {
            result.issues.push('⚠️ URL in Neon differs from generated public URL')
            result.suggestions.push(`Update to: ${publicUrl}`)
          }

          // Check if file exists in S3
          if (s3Client) {
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
                result.suggestions.push('The file needs to be uploaded to S3 or the URL is incorrect')
              } else {
                result.existsInS3 = 'unknown'
                result.issues.push(`⚠️ Error checking S3: ${s3Error.message}`)
              }
            }
          }

          // Test HTTP accessibility
          try {
            const testUrl = result.generatedPublicUrl || thumbnail
            const response = await fetch(testUrl, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
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
                result.suggestions.push('🔧 Check S3 bucket policy for thumbnails/ folder')
              } else if (response.status === 404) {
                result.suggestions.push('🔧 File does not exist at this path in S3')
              }
            }
          } catch (fetchError: any) {
            result.httpAccessible = false
            result.issues.push(`❌ Error testing HTTP access: ${fetchError.message}`)
          }
        } else {
          result.issues.push(`⚠️ S3 key doesn't start with "thumbnails/": "${s3Key}"`)
        }
      } else if (url.hostname.includes('neon.tech') || url.hostname.includes('storage.neon')) {
        result.isNeonUrl = true
        result.issues.push('✅ Thumbnail URL is from Neon Storage')
      } else {
        result.issues.push(`⚠️ Unknown URL hostname: ${url.hostname}`)
      }
    } catch (urlError) {
      result.urlParsed = false
      result.issues.push(`❌ Invalid URL format: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`)
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check thumbnail',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
