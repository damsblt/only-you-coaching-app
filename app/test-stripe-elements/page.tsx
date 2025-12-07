'use client'

import { useState } from 'react'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import StripeCheckoutForm from '@/components/stripe/StripeCheckoutForm'
import { pricingPlans } from '@/data/pricingPlans'
import { Button } from '@/components/ui/Button'

export default function TestStripeElementsPage() {
  const { user, loading } = useSimpleAuth()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allPlans = [...pricingPlans.personalized.plans, ...pricingPlans.online.plans]

  const handlePaymentSuccess = (subscriptionId: string) => {
    setSuccess(true)
    console.log('Payment successful, subscription ID:', subscriptionId)
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    console.error('Payment error:', errorMessage)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in to test Stripe Elements</div>
  }

  if (success) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p>Test completed successfully.</p>
        <Button onClick={() => {
          setSuccess(false)
          setSelectedPlan(null)
          setError(null)
        }}>
          Test Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Stripe Elements Integration</h1>
      
      {!selectedPlan ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select a plan to test:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-gray-600">{plan.price} - {plan.duration}</p>
                <Button 
                  onClick={() => setSelectedPlan(plan)}
                  className="mt-2 w-full"
                >
                  Test {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Testing: {selectedPlan.name}</h2>
            <p className="text-gray-600">{selectedPlan.price} - {selectedPlan.duration}</p>
            <Button 
              onClick={() => setSelectedPlan(null)}
              variant="ghost"
              className="mt-2"
            >
              ← Back to plan selection
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <StripeCheckoutForm
            planId={selectedPlan.id}
            planName={selectedPlan.name}
            planPrice={selectedPlan.price}
            planDuration={selectedPlan.duration}
            planFeatures={selectedPlan.features}
            userId={user.id}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      )}
    </div>
  )
}

