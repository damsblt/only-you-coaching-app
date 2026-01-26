'use client'

import { CheckCircle, ArrowRight } from 'lucide-react'
import { pricingPlans } from '../../../data/pricingPlans'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'

function PersonnaliseContent() {
  // Use the auth context instead of direct auth calls
  const { user, loading } = useSimpleAuth()
  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(null)
  const [autoCheckoutAttempted, setAutoCheckoutAttempted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Reset auto-checkout flag when searchParams change
    setAutoCheckoutAttempted(false)
    
    // Sync user with database when user is available
    const syncUser = async () => {
      if (user) {
        try {
          const response = await fetch('/api/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          })
          if (response.ok) {
            console.log('User synced with database')
          }
        } catch (error) {
          console.error('Error syncing user:', error)
        }
      }
    }
    
    syncUser()

    // Vérifier si on doit faire un auto-checkout
    const planId = searchParams.get('planId')
    const autoCheckout = searchParams.get('autoCheckout')
    
    if (user && planId && autoCheckout === 'true' && !autoCheckoutAttempted) {
      console.log('Auto-checkout triggered for plan:', planId)
      setAutoCheckoutAttempted(true)
      // Délai pour s'assurer que l'état est mis à jour
      setTimeout(() => {
        handleSubscribe(planId)
      }, 1000) // Increased delay to ensure auth state is stable
    }
  }, [user, searchParams])

  const handleSubscribe = async (planId: string) => {
    console.log('handleSubscribe called with planId:', planId, 'user:', user?.id)
    
    if (!user) {
      console.log('No user found, redirecting to signin for existing users')
      // Flow 2: Existing user - redirect to signin with planId
      router.push(`/auth/signin-simple?planId=${planId}&callbackUrl=${encodeURIComponent('/souscriptions/personnalise')}`)
      return
    }

    // User is authenticated, proceed with payment
    await processPayment(planId)
  }

  const processPayment = async (planId: string) => {
    if (!user) {
      return
    }
    
    setSubscriptionLoading(planId)
    
    try {
      console.log('Redirecting to native checkout for plan:', planId, 'user:', user.id)
      // Redirect to native checkout page instead of Stripe hosted checkout
      router.push(`/checkout?planId=${planId}`)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Erreur lors de la redirection vers la page de paiement. Veuillez réessayer.')
    } finally {
      setSubscriptionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <Section 
          gradient="soft" 
          title="Plan Coaching personnalisé et accompagnement" 
          subtitle="Chargement de vos options d'abonnement..."
        >
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Section>
      </div>
    )
  }

  // Récupérer le plan sélectionné pour l'affichage
  const selectedPlanId = searchParams.get('planId')
  const selectedPlan = selectedPlanId ? 
    pricingPlans.personalized.plans.find(plan => plan.id === selectedPlanId) : 
    null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Section 
        gradient="soft" 
        title="Plan Coaching personnalisé et accompagnement" 
        subtitle="Choisissez l'abonnement qui correspond à vos objectifs et à votre rythme"
      >
        {/* Indication du plan sélectionné */}
        {selectedPlan && (
          <div className="mb-12 max-w-md mx-auto p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/50 rounded-lg">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent-600 dark:text-accent-400 mr-2" />
              <span className="text-accent-800 dark:text-accent-300 font-semibold">
                Plan sélectionné : {selectedPlan.name}
              </span>
            </div>
            <p className="text-accent-700 dark:text-accent-400 text-sm mt-1 text-center">
              Redirection vers le paiement en cours...
            </p>
          </div>
        )}

        {/* Personalized Coaching Plans */}
        <div className="mb-16 scroll-mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.personalized.plans.map((plan, index) => (
              <div key={index} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-2 ${
                index === 1 ? 'border-accent-500 dark:border-accent-400 relative' : 'border-gray-200 dark:border-gray-700'
              }`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-footer-500 dark:bg-footer-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Populaire
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">DURÉE: {plan.duration}</p>
                  <div className="text-4xl font-bold text-accent-600 dark:text-accent-400">{plan.price}</div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-accent-500 dark:text-accent-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div>
                  <Button 
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscriptionLoading === plan.id}
                    fullWidth
                    className="curved-button inline-flex items-center justify-center font-semibold transition-all bg-footer-500 text-white shadow-organic hover:shadow-floating transform hover:scale-105 hover:bg-footer-600 px-5 py-3 text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {subscriptionLoading === plan.id ? 'Chargement...' : 'Choisir ce plan'}
                  </Button>
                  {plan.id === 'premium' && (
                    <p className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                      Les séances à domicile sont proposées dans un périmètre d'environ 30 km autour de Saillon, avec une extension possible jusqu'à Monthey et Sierre.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free Trial CTA Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Pas encore convaincu ?
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
                Découvrez notre essai gratuit et explorez une sélection de notre contenu premium pour vous donner un avant-goût de ce qui vous attend !
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/essai-gratuit"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  Essayer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default function PersonnalisePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <Section 
          gradient="soft" 
          title="Plan Coaching personnalisé et accompagnement" 
          subtitle="Chargement de vos options d'abonnement..."
        >
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Section>
      </div>
    }>
      <PersonnaliseContent />
    </Suspense>
  )
}

