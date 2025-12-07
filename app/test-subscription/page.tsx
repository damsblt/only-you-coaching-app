'use client'

import { useState } from 'react'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'

export default function TestSubscriptionPage() {
  const { user, loading: authLoading } = useSimpleAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const testSubscription = async (planId: string) => {
    setLoading(planId)
    setResult(null)
    
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      
      const data = await res.json()
      setResult(data)
      
      if (data.url) {
        // Uncomment to actually redirect to Stripe
        // window.location.href = data.url
        console.log('Would redirect to:', data.url)
      }
    } catch (error) {
      console.error('Test error:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(null)
    }
  }

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Subscription</h1>
        <p>Please sign in to test subscriptions.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Subscription Flow</h1>
      <p className="mb-6">User: {user.email}</p>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Plans</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => testSubscription('essentiel')}
            disabled={loading === 'essentiel'}
            className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'essentiel' ? 'Testing...' : 'Test Essentiel (69 CHF)'}
          </button>
          
          <button
            onClick={() => testSubscription('avance')}
            disabled={loading === 'avance'}
            className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'avance' ? 'Testing...' : 'Test Avancé (109 CHF)'}
          </button>
          
          <button
            onClick={() => testSubscription('premium')}
            disabled={loading === 'premium'}
            className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'premium' ? 'Testing...' : 'Test Premium (149 CHF)'}
          </button>
          
          <button
            onClick={() => testSubscription('starter')}
            disabled={loading === 'starter'}
            className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'starter' ? 'Testing...' : 'Test Starter (35 CHF)'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">API Response:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
