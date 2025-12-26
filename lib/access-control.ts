import { db } from './db'

// Define what each subscription plan includes
export const PLAN_FEATURES = {
  essentiel: {
    name: 'Essentiel',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: true, // ✅ Has access according to your pricing
      customPrograms: 3,
      coachingCalls: 1, // per month
      emailSupport: true,
      smsSupport: true,
      audioLibrary: false,
      nutritionAdvice: false,
      progressTracking: false,
      homeVisit: false,
    }
  },
  avance: {
    name: 'Avancé',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: true,
      customPrograms: 3,
      coachingCalls: 1,
      emailSupport: true,
      smsSupport: true,
      audioLibrary: true,
      nutritionAdvice: true,
      progressTracking: true,
      homeVisit: false,
    }
  },
  premium: {
    name: 'Premium',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: true,
      customPrograms: 3,
      coachingCalls: 1,
      emailSupport: true,
      smsSupport: true,
      audioLibrary: true,
      nutritionAdvice: true,
      progressTracking: true,
      homeVisit: 1,
    }
  },
  starter: {
    name: 'Starter',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: false,
      customPrograms: 0,
      coachingCalls: 0,
      emailSupport: false,
      smsSupport: false,
      audioLibrary: true,
      nutritionAdvice: false,
      progressTracking: false,
      homeVisit: false,
    }
  },
  pro: {
    name: 'Pro',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: true,
      customPrograms: 0,
      coachingCalls: 0,
      emailSupport: false,
      smsSupport: false,
      audioLibrary: true,
      nutritionAdvice: false,
      progressTracking: false,
      homeVisit: false,
    }
  },
  expert: {
    name: 'Expert',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: true,
      customPrograms: 0,
      coachingCalls: 0,
      emailSupport: false,
      smsSupport: false,
      audioLibrary: true,
      nutritionAdvice: false,
      progressTracking: false,
      homeVisit: false,
    }
  },
  full_access: {
    name: 'Accès Intégral',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: true,
      customPrograms: 999, // Unlimited
      coachingCalls: 999, // Unlimited
      emailSupport: true,
      smsSupport: true,
      audioLibrary: true,
      nutritionAdvice: true,
      progressTracking: true,
      homeVisit: 999, // Unlimited
    }
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const now = new Date().toISOString()
    // Utiliser SQL direct car le QueryBuilder a des problèmes avec les guillemets
    const { sql } = await import('./db')
    
    if (!sql) {
      console.error('SQL client not available')
      return null
    }

    // Récupérer l'abonnement actif avec SQL direct
    const subscriptions = await (sql as any)`
      SELECT * FROM subscriptions 
      WHERE "userId" = ${userId}::uuid
      AND status = 'active'
      AND "currentPeriodEnd" >= ${now}::timestamp
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    if (subscriptions && subscriptions.length > 0) {
      return subscriptions[0]
    }

    return null
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return null
  }
}

export async function getUserPlanFeatures(userId: string) {
  // Check if user has ADMIN role - give full access
  try {
    const { data: userData, error: userError } = await db
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (userError || !userData) {
      console.error('Error fetching user: User not found', userError)
      return {
        videos: false,
        recipes: false,
        predefinedPrograms: false,
        customPrograms: 0,
        coachingCalls: 0,
        emailSupport: false,
        smsSupport: false,
        audioLibrary: false,
        nutritionAdvice: false,
        progressTracking: false,
        homeVisit: false,
      }
    }
    
    if (userData.role === 'ADMIN') {
      // Full access for admin user
      return {
        videos: true,
        recipes: true,
        predefinedPrograms: true,
        customPrograms: 999, // Unlimited
        coachingCalls: 999, // Unlimited
        emailSupport: true,
        smsSupport: true,
        audioLibrary: true,
        nutritionAdvice: true,
        progressTracking: true,
        homeVisit: 999, // Unlimited
      }
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return {
      videos: false,
      recipes: false,
      predefinedPrograms: false,
      customPrograms: 0,
      coachingCalls: 0,
      emailSupport: false,
      smsSupport: false,
      audioLibrary: false,
      nutritionAdvice: false,
      progressTracking: false,
      homeVisit: false,
    }
  }

  const subscription = await getUserSubscription(userId)
  
  if (!subscription) {
    // No active subscription - return free features only
    return {
      videos: false,
      recipes: false,
      predefinedPrograms: false,
      customPrograms: 0,
      coachingCalls: 0,
      emailSupport: false,
      smsSupport: false,
      audioLibrary: false,
      nutritionAdvice: false,
      progressTracking: false,
      homeVisit: false,
    }
  }

  // Get plan ID from Stripe price ID or metadata
  // For now, we'll use a simple mapping based on the subscription data
  const planId = getPlanIdFromSubscription(subscription)
  const planFeatures = PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES]
  
  // Si le plan est 'full_access', retourner les features d'accès intégral
  if (planId === 'full_access') {
    return PLAN_FEATURES.full_access.features
  }
  
  return planFeatures?.features || PLAN_FEATURES.starter.features
}

export async function hasAccess(userId: string, feature: keyof typeof PLAN_FEATURES.essentiel.features) {
  const features = await getUserPlanFeatures(userId)
  return features[feature] === true
}

export async function getAccessLevel(userId: string, feature: keyof typeof PLAN_FEATURES.essentiel.features) {
  const features = await getUserPlanFeatures(userId)
  return features[feature]
}

// Helper function to determine plan ID from subscription
function getPlanIdFromSubscription(subscription: any): string {
  // First try to use the stored planId field (if it exists)
  // Handle both camelCase and snake_case column names
  const planId = subscription.planId || subscription.plan_id || subscription['planId'] || subscription['plan_id']
  if (planId) {
    return planId
  }

  // Fallback to mapping from Stripe price ID
  if (!subscription.stripePriceId) {
    console.warn('No stripePriceId found in subscription, defaulting to starter')
    return 'starter'
  }

  // Extract plan ID from Stripe price ID
  const priceId = subscription.stripePriceId.toLowerCase()
  
  // Mapping spécifique pour les price IDs connus
  if (priceId === 'price_1sftnzrnelgarkti51jscso') {
    return 'essentiel' // Plan 69 CHF
  }
  
  // Check if price ID contains plan identifiers
  if (priceId.includes('essentiel')) return 'essentiel'
  if (priceId.includes('avance')) return 'avance'
  if (priceId.includes('premium')) return 'premium'
  if (priceId.includes('starter')) return 'starter'
  if (priceId.includes('pro')) return 'pro'
  if (priceId.includes('expert')) return 'expert'
  
  // Additional mapping for common Stripe price ID patterns
  // These are common patterns you might see in Stripe
  if (priceId.includes('price_')) {
    // Try to extract plan from the price ID structure
    // This is a fallback for when price IDs don't contain plan names
    console.warn(`Price ID ${priceId} doesn't contain plan identifier, defaulting to essentiel`)
  }
  
  // If no match found, default to essentiel (plan 69 CHF) but log the issue
  console.warn(`Could not determine plan from subscription data:`, {
    planId: subscription.planId,
    stripePriceId: subscription.stripePriceId
  })
  return 'essentiel' // Par défaut pour le plan 69 CHF
}

// Get all users with their subscription status
export async function getAllUsersWithSubscriptions() {
  try {
    // Utiliser SQL direct car le QueryBuilder a des problèmes avec les guillemets
    const { sql } = await import('@/lib/db')
    
    if (!sql) {
      console.error('❌ SQL client not available')
      return []
    }

    // Récupérer tous les utilisateurs avec SQL direct
    const usersData = await (sql as any)`SELECT id, email, name, role FROM users`
    console.log(`✅ Fetched ${usersData.length} users`)
    if (usersData.length > 0) {
      console.log('📋 Sample user:', JSON.stringify(usersData[0], null, 2))
    }

    // Récupérer tous les abonnements avec SQL direct
    const subscriptions = await (sql as any)`SELECT * FROM subscriptions`
    console.log(`✅ Fetched ${subscriptions.length} subscriptions`)

    // Grouper les abonnements par utilisateur
    return usersData.map(user => {
      // Special handling for admin users
      const isAdmin = user.role === 'ADMIN'
      if (isAdmin) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          hasActiveSubscription: false, // No payment made
          currentPlan: null,
          subscriptionEnd: null,
          isAdmin: true,
          adminNote: 'Full access granted (no payment required)'
        }
      }
      
      // Trouver les abonnements actifs pour cet utilisateur
      // La colonne userId peut être retournée comme "userId" ou userId selon la base de données
      const userSubscriptions = subscriptions.filter((sub: any) => {
        const subUserId = sub.userId || sub['userId'] || sub.user_id
        const matchesUser = subUserId === user.id || String(subUserId) === String(user.id)
        const isActive = sub.status === 'active' || sub.status === 'ACTIVE'
        // Utiliser currentPeriodEnd ou stripeCurrentPeriodEnd selon ce qui existe
        const periodEnd = sub.stripeCurrentPeriodEnd || sub.currentPeriodEnd || sub['currentPeriodEnd']
        const isValidDate = periodEnd && new Date(periodEnd) > new Date()
        return matchesUser && isActive && isValidDate
      })
      
      const activeSubscription = userSubscriptions[0]
      
      // Déterminer le nom du plan
      let planName = null
      if (activeSubscription) {
        if (activeSubscription.planId === 'full_access') {
          planName = 'Accès Intégral'
        } else {
          planName = activeSubscription.planId || 'Actif'
        }
      }
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        hasActiveSubscription: userSubscriptions.length > 0,
        currentPlan: planName,
        subscriptionEnd: activeSubscription?.stripeCurrentPeriodEnd || 
                        activeSubscription?.currentPeriodEnd || 
                        activeSubscription?.['currentPeriodEnd'] || 
                        null,
        isAdmin: false,
        adminNote: null
      }
    })
  } catch (error) {
    console.error('Error fetching users with subscriptions:', error)
    return []
  }
}
