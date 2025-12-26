import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PLAN_FEATURES } from '@/lib/access-control'

function getPlanIdFromPriceId(priceId: string): string {
  const priceIdLower = priceId.toLowerCase()
  
  // Mapping spécifique pour les price IDs connus
  if (priceIdLower === 'price_1sftnzrnelgarkti51jscso') {
    return 'essentiel' // Plan 69 CHF
  }
  
  // Check if price ID contains plan identifiers
  if (priceIdLower.includes('essentiel')) return 'essentiel'
  if (priceIdLower.includes('avance')) return 'avance'
  if (priceIdLower.includes('premium')) return 'premium'
  if (priceIdLower.includes('starter')) return 'starter'
  if (priceIdLower.includes('pro')) return 'pro'
  if (priceIdLower.includes('expert')) return 'expert'
  
  // Default to essentiel for 69 CHF plan
  return 'essentiel'
}

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set')
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          message: 'DATABASE_URL environment variable is missing',
          details: 'Please check your environment variables'
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Vérification de l\'accès via Neon pour:', email)
    
    // Chercher l'utilisateur
    const { data: user, error: userError } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      // Better error handling for Neon
      const errorCode = userError.code || (userError as any).code
      const errorMessage = userError.message || (userError as any).message || 'Unknown error'
      
      // PGRST116 or "No rows returned" means user not found
      if (errorCode === 'PGRST116' || errorMessage.includes('No rows returned')) {
        console.log('👤 Utilisateur non trouvé pour:', email)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      console.error('❌ Erreur lors de la recherche de l\'utilisateur:', {
        code: errorCode,
        message: errorMessage,
        error: userError
      })
      return NextResponse.json({ 
        error: 'Database error', 
        details: errorMessage 
      }, { status: 500 })
    }

    if (!user) {
      console.log('👤 Utilisateur non trouvé (data null) pour:', email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has ADMIN role - give full access
    if (user.role === 'ADMIN') {
      console.log('👑 Admin user detected - granting full access')
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        subscriptions: [],
        planId: 'admin',
        features: {
          videos: true,
          recipes: true,
          predefinedPrograms: true,
          customPrograms: 999,
          coachingCalls: 999,
          emailSupport: true,
          smsSupport: true,
          audioLibrary: true,
          nutritionAdvice: true,
          progressTracking: true,
          homeVisit: 999,
        },
        hasAccess: true,
        isAdmin: true
      })
    }

    // Chercher les abonnements actifs
    const now = new Date().toISOString()
    // Utiliser SQL direct pour éviter les problèmes avec le QueryBuilder
    const { sql } = await import('@/lib/db')
    
    let subscriptions: any[] = []
    if (sql) {
      subscriptions = await (sql as any)`
        SELECT * FROM subscriptions 
        WHERE "userId" = ${user.id}::uuid
        AND status = 'active'
        AND "currentPeriodEnd" >= ${now}::timestamp
        ORDER BY created_at DESC
      `
    }

    console.log('📋 Abonnements actifs trouvés:', subscriptions?.length || 0)
    
    // Vérifier si l'utilisateur a un abonnement full_access
    if (subscriptions && subscriptions.length > 0) {
      const activeSubscription = subscriptions[0]
      const planId = activeSubscription.planId || activeSubscription.plan_id || activeSubscription['planId']
      
      console.log('📋 Plan ID trouvé:', planId)
      
      // Si c'est un abonnement full_access, donner accès intégral
      if (planId === 'full_access') {
        console.log('✅ Abonnement full_access détecté - accord de l\'accès intégral')
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          subscriptions: subscriptions,
          planId: 'full_access',
          features: PLAN_FEATURES.full_access.features,
          hasAccess: true,
          isFullAccess: true
        })
      }
      
      // Pour les autres plans, utiliser la logique normale
      const planFeatures = PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES]
      
      if (planFeatures && planFeatures.features) {
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          subscriptions: subscriptions,
          planId: planId,
          features: planFeatures.features,
          hasAccess: true
        })
      } else {
        console.warn(`⚠️ Plan non reconnu: ${planId}, utilisation du plan par défaut`)
        // Si le plan n'est pas reconnu, utiliser le plan essentiel par défaut
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          subscriptions: subscriptions,
          planId: 'essentiel',
          features: PLAN_FEATURES.essentiel.features,
          hasAccess: true
        })
      }
    }

    // Si pas d'abonnement actif, vérifier le planid dans la table users
    if (!subscriptions || subscriptions.length === 0) {
      // Vérifier si l'utilisateur a un planid défini dans la table users
      const userPlanId = user.planid || user.planId
      
      if (userPlanId) {
        console.log('📋 Plan trouvé dans users.planid:', userPlanId)
        
        // Valider que le planid existe dans PLAN_FEATURES
        const planFeatures = PLAN_FEATURES[userPlanId as keyof typeof PLAN_FEATURES]
        
        if (planFeatures && planFeatures.features) {
          console.log('✅ Plan valide, accord de l\'accès basé sur planid')
          return NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            },
            subscriptions: [],
            planId: userPlanId,
            features: planFeatures.features,
            hasAccess: true,
            source: 'planid'
          })
        } else {
          console.log('⚠️ Planid invalide ou features manquantes:', userPlanId)
        }
      }
      
      // En mode développement, permettre l'accès aux vidéos si l'utilisateur est connecté
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (isDevelopment) {
        console.log('⚠️ Development mode: Allowing video access for logged-in user without subscription')
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          subscriptions: [],
          features: {
            videos: true, // Allow video access in development
            recipes: true, // Allow recipe access in development
            predefinedPrograms: false,
            customPrograms: 0,
            coachingCalls: 0,
            emailSupport: false,
            smsSupport: false,
            audioLibrary: false,
            nutritionAdvice: false,
            progressTracking: false,
            homeVisit: false,
          },
          hasAccess: true,
          isDevelopment: true
        })
      }
      
      // Production: pas d'accès sans abonnement ni planid valide
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        subscriptions: [],
        features: {
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
        },
        hasAccess: false
      })
    }

    // Si on arrive ici, il y a un abonnement mais le planId n'a pas été reconnu dans le bloc précédent
    // Cela ne devrait normalement pas arriver, mais on gère le cas
    console.warn('⚠️ Abonnement trouvé mais planId non reconnu dans le traitement précédent')
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      subscriptions: subscriptions,
      planId: 'essentiel',
      features: PLAN_FEATURES.essentiel.features,
      hasAccess: true
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
