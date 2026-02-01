import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getPublicUrl } from '@/lib/s3'
import { cleanEnvVar } from '@/lib/env-utils'

const awsRegion = cleanEnvVar(process.env.AWS_REGION) || 'eu-north-1'
const awsAccessKeyId = cleanEnvVar(process.env.AWS_ACCESS_KEY_ID)
const awsSecretAccessKey = cleanEnvVar(process.env.AWS_SECRET_ACCESS_KEY)
const BUCKET_NAME = cleanEnvVar(process.env.AWS_S3_BUCKET_NAME) || 'only-you-coaching'

// GET /api/gallery/debug - Diagnostic endpoint for gallery issues
export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    errors: [],
    warnings: [],
  }

  // Check 1: AWS Credentials
  const hasAwsCredentials = !!(awsAccessKeyId && awsSecretAccessKey)
  diagnostics.checks.awsCredentials = {
    configured: hasAwsCredentials,
    hasAccessKey: !!awsAccessKeyId,
    hasSecretKey: !!awsSecretAccessKey,
    region: awsRegion,
    bucket: BUCKET_NAME,
  }

  if (!hasAwsCredentials) {
    diagnostics.errors.push('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Vercel environment variables.')
  }

  // Check 2: Try to list S3 objects
  if (hasAwsCredentials) {
    try {
      const s3Client = new S3Client({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId!,
          secretAccessKey: awsSecretAccessKey!,
        },
      })

      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'Photos/Training/gallery/',
        MaxKeys: 10, // Just check first 10
      })

      const response = await s3Client.send(command)
      
      diagnostics.checks.s3Listing = {
        success: true,
        foundObjects: response.Contents?.length || 0,
        sampleKeys: response.Contents?.slice(0, 5).map(obj => obj.Key) || [],
      }

      if (!response.Contents || response.Contents.length === 0) {
        diagnostics.warnings.push('No images found in Photos/Training/gallery/ folder. Check if the folder exists in S3.')
      } else {
        // Test public URL access
        const firstKey = response.Contents[0].Key
        if (firstKey) {
          const publicUrl = getPublicUrl(firstKey)
          diagnostics.checks.sampleUrl = {
            s3Key: firstKey,
            publicUrl: publicUrl,
            note: 'Test this URL in browser to verify public access',
          }
        }
      }
    } catch (error) {
      diagnostics.checks.s3Listing = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      diagnostics.errors.push(`Failed to list S3 objects: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check 3: Environment variables
  diagnostics.checks.envVars = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT_SET (will use window.location.origin)',
    AWS_REGION: awsRegion,
    AWS_S3_BUCKET_NAME: BUCKET_NAME,
  }

  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    diagnostics.warnings.push('NEXT_PUBLIC_SITE_URL not set. Gallery will use window.location.origin which should work but may cause issues.')
  }

  // Summary
  diagnostics.summary = {
    status: diagnostics.errors.length > 0 ? 'ERROR' : diagnostics.warnings.length > 0 ? 'WARNING' : 'OK',
    totalErrors: diagnostics.errors.length,
    totalWarnings: diagnostics.warnings.length,
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.errors.length > 0 ? 500 : 200,
  })
}
