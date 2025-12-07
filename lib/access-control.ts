import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'ACTIVE')
      .gte('stripeCurrentPeriodEnd', new Date().toISOString())
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching user subscription:', error)
      return null
    }

    return subscription
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return null
  }
}

export async function getUserPlanFeatures(userId: string) {
  // Check if user has ADMIN role - give full access
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (userError) {
    console.error('Error fetching user:', userError)
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
  
  if (user?.role === 'ADMIN') {
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
  if (subscription.planId) {
    return subscription.planId
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
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        subscriptions!inner(
          id,
          status,
          plan,
          stripeCurrentPeriodEnd,
          createdAt
        )
      `)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return []
    }

    return users.map(user => {
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
      
      const activeSubscriptions = user.subscriptions.filter(sub => 
        sub.status === 'ACTIVE' && new Date(sub.stripeCurrentPeriodEnd) > new Date()
      )
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        hasActiveSubscription: activeSubscriptions.length > 0,
        currentPlan: activeSubscriptions[0]?.plan || null,
        subscriptionEnd: activeSubscriptions[0]?.stripeCurrentPeriodEnd || null,
        isAdmin: false,
        adminNote: null
      }
    })
  } catch (error) {
    console.error('Error fetching users with subscriptions:', error)
    return []
  }
}
