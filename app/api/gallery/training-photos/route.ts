import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

const awsRegion = process.env.AWS_REGION || 'eu-north-1'
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'

const s3Client = new S3Client({
  region: awsRegion,
  credentials: awsAccessKeyId && awsSecretAccessKey ? {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  } : undefined,
})

// GET /api/gallery/training-photos - Get URLs for training photos from S3
export async function GET(request: NextRequest) {
  try {
    // Check AWS credentials
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY
    )
    
    if (!hasAwsCredentials) {
      console.error('⚠️ AWS credentials not configured. Cannot fetch training photos.')
      return NextResponse.json(
        { 
          error: 'AWS credentials not configured',
          photos: [] 
        },
        { status: 500 }
      )
    }

    // List all objects in Photos/Training/ folder
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Photos/Training/',
      MaxKeys: 100,
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('No photos found in Photos/Training/ folder')
      return NextResponse.json({ photos: [] })
    }

    // Filter for image files only
    const imageFiles = response.Contents
      .map(obj => obj.Key)
      .filter((key): key is string => !!key)
      .filter(key => {
        const ext = key.split('.').pop()?.toLowerCase()
        return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')
      })
      .sort(() => Math.random() - 0.5) // Randomize order

    console.log(`Found ${imageFiles.length} training photos in S3`)

    // Generate URLs for each image
    const photoUrls: string[] = []

    for (const s3Key of imageFiles) {
      try {
        // Try to generate signed URL first (valid for 7 days)
        const signedUrlResult = await getSignedVideoUrl(s3Key, 604800)
        if (signedUrlResult.success) {
          const cleanUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
          photoUrls.push(cleanUrl)
        } else {
          // Fallback to public URL if signed URL generation fails
          const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
          const publicUrl = getPublicUrl(encodedKey)
          photoUrls.push(publicUrl)
        }
      } catch (error) {
        // Fallback to public URL on error
        console.warn(`⚠️ Error generating signed URL for ${s3Key}, using public URL:`, error)
        const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
        const publicUrl = getPublicUrl(encodedKey)
        photoUrls.push(publicUrl)
      }
    }

    console.log(`Successfully generated ${photoUrls.length} photo URLs`)
    return NextResponse.json({ photos: photoUrls })
  } catch (error) {
    console.error('❌ Error fetching training photos:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        photos: []
      },
      { status: 500 }
    )
  }
}


