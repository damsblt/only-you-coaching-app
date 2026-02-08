/**
 * Centralized site URL and environment resolution
 * 
 * Since both domains (only-you-coaching.com and pilates-coaching-app.vercel.app)
 * point to the SAME Vercel Production deployment, we use HOSTNAME detection
 * at runtime to differentiate:
 * 
 * - only-you-coaching.com / www.only-you-coaching.com → Production (Stripe LIVE)
 * - pilates-coaching-app.vercel.app → Test (Stripe TEST)
 * - localhost → Development (Stripe TEST)
 */

const PRODUCTION_HOSTNAMES = ['only-you-coaching.com', 'www.only-you-coaching.com']
const PRODUCTION_URL = 'https://only-you-coaching.com'
const PREVIEW_URL = 'https://pilates-coaching-app.vercel.app'
const LOCAL_URL = 'http://localhost:3000'

// ============================================================================
// Hostname detection
// ============================================================================

/**
 * Check if the given hostname (or current hostname) is the production domain.
 * Works on both server-side (pass hostname from request) and client-side.
 */
export function isProductionDomain(hostname?: string): boolean {
  const host = hostname || getClientHostname()
  if (!host) return false
  return PRODUCTION_HOSTNAMES.includes(host)
}

/**
 * Get the hostname from the client (browser) side.
 * Returns null on server-side.
 */
function getClientHostname(): string | null {
  if (typeof window !== 'undefined') {
    return window.location.hostname
  }
  return null
}

// ============================================================================
// Site URL
// ============================================================================

/**
 * Get the site URL for the current environment.
 * @param hostname - Optional hostname from server request headers
 */
export function getSiteUrl(hostname?: string): string {
  // If hostname provided, determine URL from it
  if (hostname) {
    if (PRODUCTION_HOSTNAMES.includes(hostname)) return PRODUCTION_URL
    if (hostname.includes('vercel.app')) return PREVIEW_URL
    if (hostname === 'localhost' || hostname.startsWith('localhost:')) return LOCAL_URL
  }

  // Client-side detection
  if (typeof window !== 'undefined') {
    const clientHost = window.location.hostname
    if (PRODUCTION_HOSTNAMES.includes(clientHost)) return PRODUCTION_URL
    if (clientHost.includes('vercel.app')) return PREVIEW_URL
    return window.location.origin
  }

  // Fallback to env var
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  return LOCAL_URL
}

// ============================================================================
// Stripe key selection based on hostname
// ============================================================================

/**
 * Get the correct Stripe secret key based on the domain.
 * - only-you-coaching.com → STRIPE_SECRET_KEY (live)
 * - pilates-coaching-app.vercel.app → STRIPE_SECRET_KEY_TEST
 * - localhost → STRIPE_SECRET_KEY_TEST or STRIPE_SECRET_KEY
 * 
 * @param hostname - The hostname from the request's Host header
 */
export function getStripeSecretKey(hostname?: string): string {
  const isProd = hostname ? isProductionDomain(hostname) : false
  
  if (isProd) {
    // Production domain → use LIVE keys
    return process.env.STRIPE_SECRET_KEY || ''
  }
  
  // Test/preview domain → prefer TEST keys, fallback to regular key
  return process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || ''
}

/**
 * Get the correct Stripe publishable key based on the domain.
 * Used client-side to initialize Stripe.js
 * 
 * @param hostname - Optional hostname (auto-detected on client)
 */
export function getStripePublishableKey(hostname?: string): string {
  const host = hostname || getClientHostname()
  const isProd = host ? isProductionDomain(host) : false
  
  if (isProd) {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  }
  
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST 
    || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    || ''
}

/**
 * Get the correct Stripe webhook secret based on the domain.
 * 
 * @param hostname - The hostname from the request's Host header
 */
export function getStripeWebhookSecret(hostname?: string): string {
  const isProd = hostname ? isProductionDomain(hostname) : false
  
  if (isProd) {
    return process.env.STRIPE_WEBHOOK_SECRET || ''
  }
  
  return process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET || ''
}

/**
 * Check if Stripe is in test mode for the current domain.
 */
export function isStripeTestMode(hostname?: string): boolean {
  const key = getStripePublishableKey(hostname)
  return key.startsWith('pk_test_')
}

/**
 * Get the current Vercel environment name.
 */
export function getVercelEnv(): 'production' | 'preview' | 'development' {
  const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  return 'development'
}
