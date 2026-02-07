'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import StripeCheckoutForm from '@/components/stripe/StripeCheckoutForm'
import PromoCodeInput from '@/components/checkout/PromoCodeInput'
import { pricingPlans } from '@/data/pricingPlans'
import { CheckCircle, User, CreditCard, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function CheckoutContent() {
  const { user, loading } = useSimpleAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<{
    promoCodeId: string
    code: string
    discountType: string
    discountValue: number
    discountAmount: number
    finalAmount: number
    stripeCouponId: string | null
  } | null>(null)

  useEffect(() => {
    const planId = searchParams.get('planId')
    if (planId) {
      const allPlans = [...pricingPlans.personalized.plans, ...pricingPlans.online.plans]
      const plan = allPlans.find(p => p.id === planId)
      if (plan) {
        setSelectedPlan(plan)
      } else {
        router.push('/souscriptions/personnalise')
      }
    } else {
      router.push('/souscriptions/personnalise')
    }
  }, [searchParams, router])

  const handlePaymentSuccess = async (subscriptionId: string) => {
    // Si un code promo a été appliqué, enregistrer son utilisation
    if (appliedPromo && user) {
      try {
        await fetch('/api/promo-codes/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promoCodeId: appliedPromo.promoCodeId,
            userId: user.id,
            subscriptionId,
            discountAmount: appliedPromo.discountAmount,
            originalAmount: getOriginalAmount(),
            finalAmount: appliedPromo.finalAmount,
          }),
        })
      } catch (err) {
        console.error('Error recording promo code usage:', err)
        // Ne pas échouer le paiement pour cette erreur
      }
    }

    setSuccess(true)
    setIsProcessing(false)
    // Redirect to success page after a short delay
    setTimeout(() => {
      router.push(`/souscriptions/success?subscription_id=${subscriptionId}`)
    }, 2000)
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setIsProcessing(false)
  }

  // Helper pour extraire le montant original en centimes du prix
  const getOriginalAmount = () => {
    if (!selectedPlan) return 0
    // Extraire le nombre du prix (ex: "69 CHF" -> 69)
    const priceMatch = selectedPlan.price.match(/(\d+)/)
    if (priceMatch) {
      return parseInt(priceMatch[1]) * 100 // Convertir en centimes
    }
    return 0
  }

  const handlePromoApplied = (discount: {
    promoCodeId: string
    code: string
    discountType: string
    discountValue: number
    discountAmount: number
    finalAmount: number
    stripeCouponId: string | null
  }) => {
    setAppliedPromo(discount)
  }

  const handlePromoRemoved = () => {
    setAppliedPromo(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h1>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour procéder au paiement.</p>
          <Button onClick={() => router.push('/auth/signin')}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plan non trouvé</h1>
          <Button onClick={() => router.push('/souscriptions/personnalise')}>
            Retour aux abonnements
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Paiement réussi !</h1>
          <p className="text-gray-600">Redirection vers votre espace personnel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/souscriptions/personnalise')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux abonnements
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Finaliser votre commande</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Summary & User Info */}
          <div className="space-y-6">
            {/* Product Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-primary-600 mr-2" />
                Récapitulatif de votre commande
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedPlan.name}</h3>
                    <p className="text-sm text-gray-600">Durée: {selectedPlan.duration}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary-600">{selectedPlan.price}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Ce qui est inclus :</h4>
                  <ul className="space-y-1">
                    {selectedPlan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            {user && selectedPlan && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <PromoCodeInput
                  planId={selectedPlan.id}
                  userId={user.id}
                  originalAmount={getOriginalAmount()}
                  onPromoApplied={handlePromoApplied}
                  onPromoRemoved={handlePromoRemoved}
                />
              </div>
            )}

            {/* User Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 text-primary-600 mr-2" />
                Informations client
              </h2>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connecté
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stripe Payment Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
              Paiement sécurisé
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              </div>
            )}

            <StripeCheckoutForm
              planId={selectedPlan.id}
              planName={selectedPlan.name}
              planPrice={appliedPromo ? `${(appliedPromo.finalAmount / 100).toFixed(2)} CHF` : selectedPlan.price}
              originalPrice={selectedPlan.price}
              planDuration={selectedPlan.duration}
              planFeatures={selectedPlan.features}
              userId={user.id}
              promoCode={appliedPromo?.stripeCouponId || null}
              promoDetails={appliedPromo ? {
                code: appliedPromo.code,
                discountType: appliedPromo.discountType,
                discountValue: appliedPromo.discountValue,
                discountAmount: appliedPromo.discountAmount,
                finalAmount: appliedPromo.finalAmount,
              } : null}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Paiement sécurisé</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Vos informations de paiement sont cryptées et sécurisées par Stripe. 
                    Nous ne stockons aucune information de carte bancaire.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

