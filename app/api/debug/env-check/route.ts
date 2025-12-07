import { NextResponse } from 'next/server'

export async function GET() {
  // This endpoint helps debug environment variable access
  // Only enable in development!
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const envCheck = {
    aws: {
      AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME ? '✅ Set' : '❌ Missing',
      AWS_REGION: process.env.AWS_REGION ? '✅ Set' : '❌ Missing',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set (hidden)' : '❌ Missing',
      bucketName: process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching (default)',
      region: process.env.AWS_REGION || 'eu-north-1 (default)',
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set (hidden)' : '❌ Missing',
    },
    nodeEnv: process.env.NODE_ENV,
  }

  return NextResponse.json(envCheck, { status: 200 })
}


