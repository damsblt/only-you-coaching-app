/**
 * Script de diagnostic pour vérifier l'accès d'un utilisateur spécifique
 * Usage: node scripts/debug-user-access.js <userId>
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas défini dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// PLAN_FEATURES (copié de lib/access-control.ts)
const PLAN_FEATURES = {
  essentiel: {
    name: 'Essentiel',
    features: {
      videos: true,
      recipes: true,
      predefinedPrograms: true,
      customPrograms: 3,
      coachingCalls: 1,
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
      customPrograms: 999,
      coachingCalls: 999,
      emailSupport: true,
      smsSupport: true,
      audioLibrary: true,
      nutritionAdvice: true,
      progressTracking: true,
      homeVisit: 999,
    }
  }
}

async function debugUserAccess(userId) {
  console.log(`\n🔍 Diagnostic de l'accès pour l'utilisateur: ${userId}\n`)
  console.log('='.repeat(60))

  try {
    // 1. Récupérer les informations de l'utilisateur
    console.log('\n1️⃣ Informations utilisateur:')
    const users = await sql`
      SELECT * FROM users WHERE id = ${userId}::uuid
    `

    if (!users || users.length === 0) {
      console.error('❌ Utilisateur non trouvé')
      return
    }

    const user = users[0]
    console.log('✅ Utilisateur trouvé:')
    console.log('   - Email:', user.email)
    console.log('   - Nom:', user.name)
    console.log('   - Rôle:', user.role)
    console.log('   - planid (users.planid):', user.planid || user.planId || '❌ NON DÉFINI')
    console.log('   - plan_id (users.plan_id):', user.plan_id || '❌ NON DÉFINI')

    // 2. Récupérer les abonnements actifs
    console.log('\n2️⃣ Abonnements actifs:')
    const now = new Date().toISOString()
    
    const subscriptions = await sql`
      SELECT * FROM subscriptions 
      WHERE "userId" = ${userId}::uuid
      AND status = 'active'
    `

    console.log(`📋 Nombre d'abonnements trouvés: ${subscriptions?.length || 0}`)
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ Aucun abonnement actif trouvé')
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`\n   Abonnement ${index + 1}:`)
        console.log('   - ID:', sub.id)
        console.log('   - Status:', sub.status)
        console.log('   - planId:', sub.planId || sub.plan_id || '❌ NON DÉFINI')
        console.log('   - plan:', sub.plan || '❌ NON DÉFINI')
        console.log('   - stripePriceId:', sub.stripePriceId || sub.stripe_price_id || '❌ NON DÉFINI')
        console.log('   - stripeSubscriptionId:', sub.stripeSubscriptionId || sub.stripe_subscription_id || '❌ NON DÉFINI')
        console.log('   - currentPeriodEnd:', sub.currentPeriodEnd || sub.current_period_end || '❌ NON DÉFINI')
        console.log('   - stripeCurrentPeriodEnd:', sub.stripeCurrentPeriodEnd || sub.stripe_current_period_end || '❌ NON DÉFINI')
        
        // Vérifier si l'abonnement est encore valide
        const periodEnd = sub.stripeCurrentPeriodEnd || sub.currentPeriodEnd || sub.current_period_end
        if (periodEnd) {
          const endDate = new Date(periodEnd)
          const isValid = endDate > new Date()
          console.log('   - Date de fin:', endDate.toISOString())
          console.log('   - Valide:', isValid ? '✅ OUI' : '❌ NON (expiré)')
        }
      })
    }

    // 3. Simuler la logique de check-access
    console.log('\n3️⃣ Simulation de la logique check-access:')
    
    if (user.role === 'ADMIN') {
      console.log('✅ Utilisateur ADMIN - Accès complet accordé')
      return
    }

    // Chercher les abonnements actifs avec SQL direct (comme dans check-access)
    let activeSubscriptions = []
    
    try {
      activeSubscriptions = await sql`
        SELECT * FROM subscriptions 
        WHERE "userId" = ${userId}::uuid
        AND status = 'active'
        AND "currentPeriodEnd" >= ${now}::timestamp
        ORDER BY created_at DESC
      `
      console.log(`📋 Abonnements actifs (SQL direct): ${activeSubscriptions?.length || 0}`)
    } catch (error) {
      console.error('❌ Erreur SQL:', error)
    }

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      const activeSubscription = activeSubscriptions[0]
      console.log('\n   Abonnement actif trouvé:')
      console.log('   - Raw subscription object keys:', Object.keys(activeSubscription))
      
      // Simuler l'extraction du planId (comme dans check-access ligne 133)
      const planId = activeSubscription.planId || activeSubscription.plan_id || activeSubscription['planId']
      console.log('   - planId extrait:', planId || '❌ NULL/UNDEFINED')
      
      if (!planId) {
        console.log('\n   ⚠️ PROBLÈME DÉTECTÉ: planId est null/undefined!')
        console.log('   - activeSubscription.planId:', activeSubscription.planId)
        console.log('   - activeSubscription.plan_id:', activeSubscription.plan_id)
        console.log('   - activeSubscription["planId"]:', activeSubscription['planId'])
        console.log('\n   💡 SOLUTION: Le planId doit être défini dans la table subscriptions')
        console.log('   💡 Vous pouvez corriger cela avec:')
        console.log(`   UPDATE subscriptions SET "planId" = 'essentiel' WHERE id = '${activeSubscription.id}'`)
      } else {
        console.log('   ✅ planId trouvé:', planId)
        
        // Vérifier si le plan existe dans PLAN_FEATURES
        const planFeatures = PLAN_FEATURES[planId]
        
        if (planFeatures) {
          console.log('   ✅ Plan reconnu dans PLAN_FEATURES')
          console.log('   - Features:', JSON.stringify(planFeatures.features, null, 2))
          console.log('   - Accès vidéos:', planFeatures.features.videos ? '✅ OUI' : '❌ NON')
        } else {
          console.log('   ⚠️ Plan non reconnu dans PLAN_FEATURES')
        }
      }
    } else {
      console.log('   ⚠️ Aucun abonnement actif trouvé')
      console.log('   - Vérification du planid dans users.planid...')
      
      const userPlanId = user.planid || user.planId
      if (userPlanId) {
        console.log('   ✅ planid trouvé dans users:', userPlanId)
        const planFeatures = PLAN_FEATURES[userPlanId]
        if (planFeatures) {
          console.log('   ✅ Plan reconnu, accès basé sur users.planid')
          console.log('   - Accès vidéos:', planFeatures.features.videos ? '✅ OUI' : '❌ NON')
        }
      } else {
        console.log('   ❌ Aucun planid trouvé dans users')
      }
    }

    // 4. Test de l'API check-access
    console.log('\n4️⃣ Test de l\'API check-access:')
    if (user.email) {
      console.log(`   Test avec email: ${user.email}`)
      console.log(`   URL: /api/check-access?email=${encodeURIComponent(user.email)}`)
      console.log('   💡 Vous pouvez tester cette URL dans votre navigateur ou avec curl')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Diagnostic terminé\n')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Récupérer l'userId depuis les arguments
const userId = process.argv[2]

if (!userId) {
  console.error('❌ Usage: node scripts/debug-user-access.js <userId>')
  console.error('   Exemple: node scripts/debug-user-access.js fe4b1b75-9dc1-4d79-913b-30caaab72f19')
  process.exit(1)
}

debugUserAccess(userId).then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
