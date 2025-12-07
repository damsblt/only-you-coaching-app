'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'

export default function DebugStripePage() {
  const [stripe, setStripe] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [envVar, setEnvVar] = useState<string | null>(null)

  useEffect(() => {
    // Check environment variable
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    setEnvVar(publishableKey || 'NOT_SET')

    // Try to load Stripe
    const loadStripeInstance = async () => {
      try {
        console.log('Loading Stripe with key:', publishableKey)
        const stripeInstance = await loadStripe(publishableKey || 'pk_test_placeholder')
        console.log('Stripe loaded:', stripeInstance)
        setStripe(stripeInstance)
      } catch (err) {
        console.error('Error loading Stripe:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    loadStripeInstance()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Stripe Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Environment Variable:</h2>
          <p className="font-mono bg-gray-100 p-2 rounded">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = {envVar}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Stripe Instance:</h2>
          <p className="font-mono bg-gray-100 p-2 rounded">
            {stripe ? 'Loaded successfully' : 'Not loaded'}
          </p>
        </div>

        {error && (
          <div>
            <h2 className="text-lg font-semibold mb-2 text-red-600">Error:</h2>
            <p className="font-mono bg-red-100 p-2 rounded text-red-800">
              {error}
            </p>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Console Logs:</h2>
          <p className="text-sm text-gray-600">
            Check the browser console for detailed logs
          </p>
        </div>
      </div>
    </div>
  )
}

