/**
 * Environment validation and configuration
 * Ensures all required environment variables are present
 * 
 * Environment detection:
 * - VERCEL_ENV = 'production' → Production (only-you-coaching.com)
 * - VERCEL_ENV = 'preview' → Preview/Test (pilates-coaching-app.vercel.app)
 * - NODE_ENV = 'development' → Local development (localhost)
 */

interface EnvironmentConfig {
  // Database (Neon)
  databaseUrl: string
  
  // NextAuth
  nextAuthUrl: string
  nextAuthSecret: string
  
  // AWS S3
  awsRegion: string
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  awsS3BucketName: string
  
  // Environment
  isDevelopment: boolean
  isProduction: boolean
  isPreview: boolean
  isServer: boolean
  
  // Vercel environment ('production' | 'preview' | 'development')
  vercelEnv: 'production' | 'preview' | 'development'
}

function validateEnvironment(): EnvironmentConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isServer = typeof window === 'undefined'
  
  // Vercel provides VERCEL_ENV: 'production', 'preview', or 'development'
  const vercelEnv = (process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || 
    (isDevelopment ? 'development' : 'production')) as 'production' | 'preview' | 'development'
  
  // isProduction = true ONLY for the production domain (only-you-coaching.com)
  const isProduction = vercelEnv === 'production'
  // isPreview = true for preview deployments (pilates-coaching-app.vercel.app)
  const isPreview = vercelEnv === 'preview'

  // Required environment variables
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }

  // Check for missing required variables
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`
    
    if (isServer) {
      console.error('❌ Environment Error:', errorMessage)
    } else {
      console.warn('⚠️  Environment Warning:', errorMessage)
    }
    
    // In development, we can continue with warnings
    // In production, we should fail fast
    if (isProduction) {
      throw new Error(errorMessage)
    }
  }

  return {
    // Database (Neon)
    databaseUrl: process.env.DATABASE_URL || '',
    
    // NextAuth
    nextAuthUrl: process.env.NEXTAUTH_URL || '',
    nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
    
    // AWS S3
    awsRegion: process.env.AWS_REGION || 'eu-north-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsS3BucketName: process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching',
    
    // Environment
    isDevelopment,
    isProduction,
    isPreview,
    isServer,
    vercelEnv,
  }
}

// Export validated environment configuration
export const env = validateEnvironment()

// Helper functions
export const isS3Configured = () => {
  return !!(env.awsAccessKeyId && env.awsSecretAccessKey)
}

export const isDatabaseConfigured = () => {
  return !!env.databaseUrl
}

// Log environment status
if (env.isServer) {
  console.log('🔧 Environment Status:')
  console.log(`   Database (Neon): ${isDatabaseConfigured() ? '✅' : '❌'}`)
  console.log(`   S3: ${isS3Configured() ? '✅' : '❌'}`)
  console.log(`   Environment: ${env.vercelEnv} (NODE_ENV: ${process.env.NODE_ENV})`)
  console.log(`   Stripe mode: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ? '🧪 TEST' : '💳 LIVE'}`)
  console.log(`   Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || '(not set)'}`)
}
