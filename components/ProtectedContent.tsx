'use client'

import { useState, useEffect } from 'react'
import { useSimpleAuth } from './providers/SimpleAuthProvider'

interface ProtectedContentProps {
  children: React.ReactNode
  feature: string
  fallback?: React.ReactNode
  userId?: string
}

export default function ProtectedContent({ 
  children, 
  feature, 
  fallback,
  userId 
}: ProtectedContentProps) {
  const [hasAccessToFeature, setHasAccessToFeature] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useSimpleAuth()

  useEffect(() => {
    const currentUserId = userId || user?.id
    const currentUserEmail = user?.email
    
    if (!currentUserId || !currentUserEmail) {
      setHasAccessToFeature(false)
      setLoading(false)
      return
    }

    const checkAccess = async () => {
      try {
        // Check access via API (uses Neon, not Supabase)
        const response = await fetch(`/api/check-access?email=${encodeURIComponent(currentUserEmail)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error checking access:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'Unknown error',
            details: errorData.details
          })
          
          // If user not found (404), they don't have access
          if (response.status === 404) {
            console.log('User not found in database, denying access')
          }
          
          setHasAccessToFeature(false)
          return
        }

        const data = await response.json()
        
        // Admin users always have access
        if (data.isAdmin) {
          setHasAccessToFeature(true)
          return
        }

        // Check if user has active subscription
        if (!data.hasAccess || !data.subscriptions || data.subscriptions.length === 0) {
          setHasAccessToFeature(false)
          return
        }

        // Check specific feature access
        let hasFeatureAccess = false
        
        switch (feature) {
          case 'videoLibrary':
          case 'videos':
            // All subscriptions allow video access
            hasFeatureAccess = data.features?.videos === true
            break
          case 'audioLibrary':
          case 'audio':
            hasFeatureAccess = data.features?.audioLibrary === true
            break
          case 'recipes':
            hasFeatureAccess = data.features?.recipes === true
            break
          case 'programs':
          case 'predefinedPrograms':
            hasFeatureAccess = data.features?.predefinedPrograms === true
            break
          default:
            // For unknown features, check if user has any active subscription
            hasFeatureAccess = data.hasAccess && data.subscriptions.length > 0
        }

        setHasAccessToFeature(hasFeatureAccess)
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccessToFeature(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [userId, user?.id, user?.email, feature])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!hasAccessToFeature) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Get subscription info based on feature
    const getSubscriptionInfo = (feature: string) => {
      switch (feature) {
        case 'audioLibrary':
          return {
            title: "Accès aux Audios Guidés",
            description: "Cette fonctionnalité nécessite un abonnement actif.",
            eligiblePlans: [
              "Plan Coaching personnalisé - Avancé (109 CHF/3 mois)",
              "Plan Coaching personnalisé - Premium (149 CHF/3 mois)",
              "Plan Autonomie en ligne - Starter (35 CHF/2 mois)",
              "Plan Autonomie en ligne - Pro (30 CHF/4 mois)",
              "Plan Autonomie en ligne - Expert (25 CHF/6 mois)"
            ]
          }
        case 'videoLibrary':
          return {
            title: "Accès à la Bibliothèque Vidéo",
            description: "Cette fonctionnalité nécessite un abonnement actif.",
            eligiblePlans: [
              "Tous les plans d'abonnement incluent l'accès aux vidéos"
            ]
          }
        case 'recipes':
          return {
            title: "Accès aux Recettes",
            description: "Cette fonctionnalité nécessite un abonnement actif.",
            eligiblePlans: [
              "Tous les plans d'abonnement incluent l'accès aux recettes"
            ]
          }
        case 'programs':
        case 'predefinedPrograms':
          return {
            title: "Accès aux Programmes Prédéfinis",
            description: "Cette fonctionnalité nécessite un abonnement actif.",
            eligiblePlans: [
              "Plan Coaching personnalisé - Essentiel (69 CHF/3 mois)",
              "Plan Coaching personnalisé - Avancé (109 CHF/3 mois)",
              "Plan Coaching personnalisé - Premium (149 CHF/3 mois)",
              "Plan Autonomie en ligne - Pro (30 CHF/4 mois)",
              "Plan Autonomie en ligne - Expert (25 CHF/6 mois)"
            ]
          }
        default:
          return {
            title: "Accès Restreint",
            description: "Cette fonctionnalité nécessite un abonnement actif.",
            eligiblePlans: []
          }
      }
    }

    const subscriptionInfo = getSubscriptionInfo(feature)

    return (
      <div className="rounded-lg p-6 text-center max-w-2xl mx-auto border" style={{ backgroundColor: '#39334D', borderColor: '#4A4358' }}>
        <h3 className="text-lg font-semibold text-white mb-2">
          {subscriptionInfo.title}
        </h3>
        <p className="text-white/90 mb-4">
          {subscriptionInfo.description}
        </p>
        
        
        <a 
          href="/souscriptions/personnalise" 
          className="inline-block bg-white hover:bg-white/90 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Voir les abonnements
        </a>
      </div>
    )
  }

  return <>{children}</>
}

// Hook for checking access in components
export function useAccessControl(userId?: string | null) {
  const [features, setFeatures] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useSimpleAuth()

  useEffect(() => {
    const currentUserId = userId || user?.id
    if (!currentUserId) {
      setFeatures(null)
      setLoading(false)
      return
    }

    const loadFeatures = async () => {
      try {
        // Simple access control - for testing, return mock features
        const mockFeatures = {
          videos: true,
          audio: true,
          courses: true,
          meditation: true,
          coaching: true
        }
        setFeatures(mockFeatures)
      } catch (error) {
        console.error('Error loading user features:', error)
        setFeatures(null)
      } finally {
        setLoading(false)
      }
    }

    loadFeatures()
  }, [userId, user?.id])

  return { features, loading }
}
