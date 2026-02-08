/**
 * Centralized site URL resolution
 * 
 * Determines the correct site URL based on the environment:
 * - Production (VERCEL_ENV=production) → https://only-you-coaching.com
 * - Preview (VERCEL_ENV=preview) → https://pilates-coaching-app.vercel.app
 * - Development → http://localhost:3000
 * 
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (if explicitly set)
 * 2. Automatic detection via VERCEL_ENV
 * 3. Fallback to localhost
 */

const PRODUCTION_URL = 'https://only-you-coaching.com'
const PREVIEW_URL = 'https://pilates-coaching-app.vercel.app'
const LOCAL_URL = 'http://localhost:3000'

/**
 * Get the site URL for the current environment.
 * Works on both server and client side.
 */
export function getSiteUrl(): string {
  // 1. If explicitly set via env var, use that
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // 2. Automatic detection via Vercel environment
  const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV

  if (vercelEnv === 'production') {
    return PRODUCTION_URL
  }

  if (vercelEnv === 'preview') {
    return PREVIEW_URL
  }

  // 3. Client-side fallback
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // 4. Local development fallback
  return LOCAL_URL
}

/**
 * Check if the current environment is using Stripe test mode.
 * Returns true for preview/development, false for production.
 */
export function isStripeTestMode(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  return publishableKey.startsWith('pk_test_')
}

/**
 * Get the current Vercel environment name.
 * Returns 'production', 'preview', or 'development'.
 */
export function getVercelEnv(): 'production' | 'preview' | 'development' {
  const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV
  
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  return 'development'
}
