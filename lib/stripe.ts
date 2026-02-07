import Stripe from 'stripe'

/**
 * Get Stripe instance, initializing it only when needed
 * This prevents build-time errors when STRIPE_SECRET_KEY is not available
 */
export function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })
}









