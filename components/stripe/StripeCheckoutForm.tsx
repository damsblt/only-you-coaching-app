'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface StripeCheckoutFormProps {
  planId: string
  planName: string
  planPrice: string
  originalPrice?: string
  planDuration: string
  planFeatures: string[]
  userId: string
  promoCode?: string | null
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

interface PaymentFormProps {
  planId: string
  planName: string
  planPrice: string
  originalPrice?: string
  planDuration: string
  planFeatures: string[]
  userId: string
  promoCode?: string | null
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

function PaymentForm({
  planId,
  planName,
  planPrice,
  originalPrice,
  planDuration,
  planFeatures,
  userId,
  promoCode,
  onSuccess,
  onError
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Component is ready when Stripe and Elements are loaded
    if (stripe && elements) {
      setIsReady(true)
    }
  }, [stripe, elements])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Élément de carte non trouvé')
      setIsProcessing(false)
      return
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (pmError) {
        setError(pmError.message || 'Erreur lors de la création de la méthode de paiement')
        onError(pmError.message || 'Erreur lors de la création de la méthode de paiement')
        setIsProcessing(false)
        return
      }

      if (paymentMethod) {
        // Create subscription directly with payment method
        await createSubscription(paymentMethod.id)
      }
    } catch (err) {
      const errorMessage = 'Erreur lors du traitement du paiement'
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const createSubscription = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/stripe/create-subscription-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId, 
          userId, 
          paymentMethodId,
          promoCode: promoCode || null
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || `Erreur serveur (${response.status})`
        console.error('Subscription creation failed:', errorMessage, data)
        onError(errorMessage)
        return
      }
      
      if (data.error) {
        onError(data.error)
        return
      }

      if (!data.subscriptionId) {
        onError('Réponse invalide du serveur')
        return
      }

      onSuccess(data.subscriptionId)
    } catch (err: any) {
      console.error('Subscription creation error:', err)
      const errorMessage = err.message || 'Erreur lors de la création de l\'abonnement'
      onError(errorMessage)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informations de paiement
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carte bancaire
            </label>
            <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
              <div className="p-3">
                <CardElement options={cardElementOptions} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm mt-4">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          disabled={!isReady || isProcessing}
          className="min-w-[200px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            `Payer ${planPrice}`
          )}
        </Button>
      </div>
    </form>
  )
}

export default function StripeCheckoutForm({
  planId,
  planName,
  planPrice,
  originalPrice,
  planDuration,
  planFeatures,
  userId,
  promoCode,
  onSuccess,
  onError
}: StripeCheckoutFormProps) {
  // Check if Stripe is properly configured
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Configuration Error</h3>
            <p className="text-sm text-red-600 mt-1">
              Stripe is not properly configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        planId={planId}
        planName={planName}
        planPrice={planPrice}
        originalPrice={originalPrice}
        planDuration={planDuration}
        planFeatures={planFeatures}
        userId={userId}
        promoCode={promoCode}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
