import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 Configuration with environment validation
const awsRegion = process.env.AWS_REGION || 'eu-north-1'
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

// Validate AWS credentials
if (!awsAccessKeyId || !awsSecretAccessKey) {
  console.warn('⚠️  AWS credentials not found. S3 operations will fail.')
  console.warn('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment variables.')
}

const s3Client = new S3Client({
  region: awsRegion,
  credentials: awsAccessKeyId && awsSecretAccessKey ? {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  } : undefined,
})

// Use S3 Access Point instead of direct bucket
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const ACCESS_POINT_ALIAS = process.env.AWS_S3_ACCESS_POINT_ALIAS || 's3-access-56ig858wntepzkh8ssrxmmjor4psgeun1a-s3alias'

// Upload a file to S3
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME, // Use direct bucket for now (access point needs policy configuration)
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: metadata,
  })

  try {
    const result = await s3Client.send(command)
    return {
      success: true,
      key,
      etag: result.ETag,
      location: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`,
    }
  } catch (error) {
    console.error('Error uploading to S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get a signed URL for private video access
export async function getSignedVideoUrl(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME, // Use direct bucket for now
    Key: key,
  })

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return {
      success: true,
      url: signedUrl,
    }
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Delete a file from S3
export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME, // Use direct bucket for now
    Key: key,
  })

  try {
    await s3Client.send(command)
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting from S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Generate a unique key for video files
export function generateVideoKey(userId: string, filename: string): string {
  const timestamp = Date.now()
  const extension = filename.split('.').pop()
  return `videos/${userId}/${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`
}

// Generate a unique key for thumbnail files
export function generateThumbnailKey(userId: string, videoKey: string): string {
  const videoName = videoKey.split('/').pop()?.split('.')[0]
  return `thumbnails/${userId}/${videoName}-thumb.jpg`
}

// Get public URL for a file
export function getPublicUrl(key: string): string {
  // Use direct S3 URL since videos are now publicly accessible
  // The key is already properly encoded, just use it as is
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`
}

// Check if an object exists in S3 (HEAD request)
export async function objectExistsInS3(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    await s3Client.send(command)
    return true
  } catch (error) {
    return false
  }
}
