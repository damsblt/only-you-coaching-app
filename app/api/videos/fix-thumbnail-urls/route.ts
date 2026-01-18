import { NextRequest, NextResponse } from 'next/server'
import { db, update } from '@/lib/db'
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

/**
 * Extract and normalize S3 key from URL
 */
function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const decodedPath = decodeURIComponent(urlObj.pathname)
    return decodedPath.substring(1) // Remove leading slash
  } catch {
    return null
  }
}

/**
 * Check if thumbnail exists in S3
 */
async function thumbnailExistsInS3(s3Key: string): Promise<boolean> {
  if (!s3Client) return false
  
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })
    await s3Client.send(command)
    return true
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasAwsCredentials || !s3Client) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 50
    const dryRun = body.dryRun !== false // Default to dry run for safety

    console.log(`🔧 ${dryRun ? '[DRY RUN]' : ''} Fixing thumbnail URLs...`)

    // Fetch videos with thumbnails
    const { data: allVideos, error: fetchError } = await db
      .from('videos_new')
      .select('id, title, thumbnail, videoUrl')
      .eq('isPublished', true)
      .limit(limit * 2) // Get more to filter
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch videos', 
        details: fetchError.message 
      }, { status: 500 })
    }

    // Filter to only videos with thumbnails
    const videos = (allVideos || []).filter((v: any) => v.thumbnail && v.thumbnail.trim() !== '').slice(0, limit)

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch videos', 
        details: error.message 
      }, { status: 500 })
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({ 
        message: 'No videos with thumbnails found',
        fixed: 0,
        results: []
      })
    }

    const results = []
    let fixedCount = 0

    for (const video of videos) {
      const result: any = {
        videoId: video.id,
        title: video.title,
        originalUrl: video.thumbnail,
        action: 'no_change',
        newUrl: null,
        error: null
      }

      try {
        const thumbnailUrl = new URL(video.thumbnail)
        
        // Only process S3 URLs
        if (!thumbnailUrl.hostname.includes('s3') && !thumbnailUrl.hostname.includes('amazonaws.com')) {
          result.action = 'skipped'
          result.reason = 'Not an S3 URL (might be Neon Storage)'
          results.push(result)
          continue
        }

        // Extract S3 key
        const s3Key = extractS3Key(video.thumbnail)
        if (!s3Key) {
          result.action = 'error'
          result.error = 'Could not extract S3 key from URL'
          results.push(result)
          continue
        }

        // Check if it's a thumbnail in the thumbnails/ folder
        if (!s3Key.startsWith('thumbnails/')) {
          result.action = 'skipped'
          result.reason = `S3 key doesn't start with thumbnails/: ${s3Key}`
          results.push(result)
          continue
        }

        // Generate correct public URL
        const correctUrl = getPublicUrl(s3Key)

        // Check if file exists in S3
        const exists = await thumbnailExistsInS3(s3Key)
        if (!exists) {
          result.action = 'error'
          result.error = 'Thumbnail file does not exist in S3'
          result.s3Key = s3Key
          results.push(result)
          continue
        }

        // Compare URLs
        if (video.thumbnail === correctUrl) {
          result.action = 'no_change'
          result.reason = 'URL is already correct'
        } else {
          result.action = dryRun ? 'would_fix' : 'fixed'
          result.newUrl = correctUrl
          result.reason = dryRun 
            ? 'URL would be updated' 
            : 'URL updated'

          // Update database if not dry run
          if (!dryRun) {
            const updateResult = await update('videos_new',
              { thumbnail: correctUrl, updatedAt: new Date().toISOString() },
              { id: video.id }
            )

            if (updateResult.error) {
              result.action = 'error'
              result.error = `Failed to update: ${updateResult.error.message || updateResult.error}`
            } else {
              fixedCount++
            }
          }
        }

      } catch (urlError) {
        result.action = 'error'
        result.error = `Invalid URL format: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`
      }

      results.push(result)
    }

    return NextResponse.json({
      message: dryRun 
        ? `[DRY RUN] Would fix ${results.filter(r => r.action === 'would_fix').length} thumbnail URLs`
        : `Fixed ${fixedCount} thumbnail URLs`,
      dryRun,
      summary: {
        total: results.length,
        fixed: fixedCount,
        wouldFix: results.filter(r => r.action === 'would_fix').length,
        noChange: results.filter(r => r.action === 'no_change').length,
        skipped: results.filter(r => r.action === 'skipped').length,
        errors: results.filter(r => r.action === 'error').length
      },
      results: results.slice(0, 100) // Limit to first 100 results
    })

  } catch (error) {
    console.error('Error fixing thumbnail URLs:', error)
    return NextResponse.json({
      error: 'Failed to fix thumbnail URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
