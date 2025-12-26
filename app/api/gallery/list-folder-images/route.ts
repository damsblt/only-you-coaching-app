import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder')

    if (!folder) {
      return NextResponse.json({ error: 'Folder parameter is required' }, { status: 400 })
    }

    // Ensure folder ends with / if not already
    const folderPrefix = folder.endsWith('/') ? folder : `${folder}/`

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: folderPrefix,
    })

    const response = await s3Client.send(command)

    if (!response.Contents || response.Contents.length === 0) {
      return NextResponse.json({ images: [] })
    }

    // Filter for image files only
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const imageFiles = response.Contents
      .map(obj => obj.Key)
      .filter(key => {
        if (!key) return false
        const ext = key.split('.').pop()?.toLowerCase()
        return ext && imageExtensions.includes(ext)
      })
      .sort()

    // Generate signed URLs for each image (with fallback to public URLs)
    const imagesWithUrls = await Promise.all(
      imageFiles.map(async (key) => {
        // Check AWS credentials
        const hasAwsCredentials = !!(
          process.env.AWS_ACCESS_KEY_ID && 
          process.env.AWS_SECRET_ACCESS_KEY
        )

        if (hasAwsCredentials) {
          const result = await getSignedVideoUrl(key, 3600) // 1 hour
          if (result.success && result.url) {
            return {
              key,
              url: result.url.trim().replace(/\n/g, '').replace(/\r/g, ''),
            }
          }
        }

        // Fallback to public URL
        const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/')
        return {
          key,
          url: getPublicUrl(encodedKey),
        }
      })
    )

    return NextResponse.json({ 
      images: imagesWithUrls.filter(img => img.url !== null)
    })
  } catch (error) {
    console.error('Error listing folder images:', error)
    return NextResponse.json(
      { error: 'Failed to list images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


