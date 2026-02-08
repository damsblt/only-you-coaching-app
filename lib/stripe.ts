import Stripe from 'stripe'
import { getStripeSecretKey, isProductionDomain } from '@/lib/get-site-url'

/**
 * Get Stripe instance based on the request hostname.
 * 
 * - only-you-coaching.com → Stripe LIVE (sk_live_*)
 * - pilates-coaching-app.vercel.app → Stripe TEST (sk_test_*)
 * - localhost → Stripe TEST (sk_test_*)
 * 
 * @param hostname - The hostname from the request's Host header.
 *                   If not provided, defaults to test mode.
 */
export function getStripe(hostname?: string): Stripe {
  const stripeKey = getStripeSecretKey(hostname)
  
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  
  const isTestMode = stripeKey.startsWith('sk_test_')
  const isProd = hostname ? isProductionDomain(hostname) : false
  
  console.log(`💳 Stripe initialized: ${isTestMode ? '🧪 TEST' : '🔴 LIVE'} mode (domain: ${hostname || 'unknown'})`)
  
  // Safety check
  if (isProd && isTestMode) {
    console.warn('⚠️ WARNING: Production domain is using Stripe TEST keys!')
  }
  if (!isProd && !isTestMode) {
    console.warn('⚠️ WARNING: Non-production domain is using Stripe LIVE keys!')
  }
  
  return new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })
}
