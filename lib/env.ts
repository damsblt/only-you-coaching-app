/**
 * Environment validation and configuration
 * Ensures all required environment variables are present
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
  isServer: boolean
}

function validateEnvironment(): EnvironmentConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  const isServer = typeof window === 'undefined'

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
    isServer,
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
  console.log(`   Environment: ${env.isDevelopment ? 'Development' : 'Production'}`)
}
