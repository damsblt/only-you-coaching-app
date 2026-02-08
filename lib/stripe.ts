import Stripe from 'stripe'

/**
 * Get Stripe instance, initializing it only when needed
 * This prevents build-time errors when STRIPE_SECRET_KEY is not available
 * 
 * Environment differentiation:
 * - Production (VERCEL_ENV=production) → Stripe LIVE keys (sk_live_*, pk_live_*)
 * - Preview/Development → Stripe TEST keys (sk_test_*, pk_test_*)
 */
export function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  
  const isTestMode = stripeKey.startsWith('sk_test_')
  const vercelEnv = process.env.VERCEL_ENV || 'development'
  
  // Safety check: warn if production env is using test keys or vice versa
  if (vercelEnv === 'production' && isTestMode) {
    console.warn('⚠️ WARNING: Production environment is using Stripe TEST keys!')
  }
  if (vercelEnv !== 'production' && !isTestMode) {
    console.warn('⚠️ WARNING: Non-production environment is using Stripe LIVE keys!')
  }
  
  return new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })
}









