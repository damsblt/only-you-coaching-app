import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'
import { cleanEnvVar } from '@/lib/env-utils'

const awsRegion = cleanEnvVar(process.env.AWS_REGION) || 'eu-north-1'
const awsAccessKeyId = cleanEnvVar(process.env.AWS_ACCESS_KEY_ID)
const awsSecretAccessKey = cleanEnvVar(process.env.AWS_SECRET_ACCESS_KEY)
const BUCKET_NAME = cleanEnvVar(process.env.AWS_S3_BUCKET_NAME) || 'only-you-coaching'

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
      console.warn('⚠️ AWS credentials not configured. Cannot list S3 objects. Returning empty array.')
      // Return empty array if we can't list objects, but don't fail completely
      return NextResponse.json({ 
        photos: [],
        error: 'AWS credentials not configured',
        message: 'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Vercel environment variables'
      })
    }

    // List all objects in Photos/Training/gallery/ folder with pagination
    const imageFiles: string[] = []
    let continuationToken: string | undefined = undefined
    
    try {
      do {
        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: 'Photos/Training/gallery/',
          ContinuationToken: continuationToken,
        })
        const response = await s3Client.send(command)
        
        if (response.Contents && response.Contents.length > 0) {
          // Filter for image files only
          const batchImages = response.Contents
            .map(obj => obj.Key)
            .filter((key): key is string => !!key)
            .filter(key => {
              const ext = key.split('.').pop()?.toLowerCase()
              return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')
            })
          
          imageFiles.push(...batchImages)
        }
        
        continuationToken = response.NextContinuationToken
      } while (continuationToken)
    } catch (error) {
      console.error('❌ Error listing S3 objects:', error)
      return NextResponse.json({ photos: [] })
    }
    
    if (imageFiles.length === 0) {
      console.log('No photos found in Photos/Training/gallery/ folder')
      return NextResponse.json({ 
        photos: [],
        error: 'No photos found',
        message: 'No images found in Photos/Training/gallery/ folder. Check if the folder exists in S3 bucket.'
      })
    }

    // Remove duplicates by S3 key (case-insensitive comparison)
    const uniqueImageFiles = Array.from(
      new Map(
        imageFiles.map(key => [key.toLowerCase(), key])
      ).values()
    )

    console.log(`Found ${uniqueImageFiles.length} unique training photos in S3 (${imageFiles.length} total before deduplication)`)

    // Generate URLs for each image
    const photoUrls: string[] = []

    for (const s3Key of uniqueImageFiles) {
      try {
        // Use public URLs directly for production (signed URLs require proper IAM permissions)
        // The bucket policy allows public read access for Photos/*, Video/*, and thumbnails/*
        const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
        const publicUrl = getPublicUrl(encodedKey)
        photoUrls.push(publicUrl)
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


