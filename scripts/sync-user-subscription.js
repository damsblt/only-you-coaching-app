/**
 * Script pour synchroniser un abonnement Stripe vers la base de données
 * Usage: node scripts/sync-user-subscription.js <userId>
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')
const { neon } = require('@neondatabase/serverless')

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const DATABASE_URL = process.env.DATABASE_URL

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY n\'est pas défini dans .env.local')
  process.exit(1)
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas défini dans .env.local')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)
const sql = neon(DATABASE_URL)

async function syncUserSubscription(userId) {
  console.log(`\n🔄 Synchronisation de l'abonnement pour l'utilisateur: ${userId}\n`)
  console.log('='.repeat(60))

  try {
    // 1. Récupérer l'utilisateur
    const users = await sql`
      SELECT * FROM users WHERE id = ${userId}::uuid
    `

    if (!users || users.length === 0) {
      console.error('❌ Utilisateur non trouvé dans la base de données')
      return
    }

    const user = users[0]
    console.log('✅ Utilisateur trouvé:')
    console.log('   - Email:', user.email)
    console.log('   - Nom:', user.name)

    // 2. Chercher le customer Stripe
    let customer = null
    const customerId = user.stripeCustomerId || user.stripe_customer_id

    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId)
        console.log('   ✅ Customer trouvé via customer ID:', customerId)
      } catch (error) {
        console.log('   ⚠️ Customer ID invalide, recherche par email...')
      }
    }

    if (!customer) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 10
      })
      
      if (customers.data.length > 0) {
        customer = customers.data[0]
        console.log('   ✅ Customer trouvé via email:', customer.id)
      } else {
        console.error('❌ Aucun customer Stripe trouvé')
        return
      }
    }

    // 3. Chercher les abonnements actifs dans Stripe
    console.log('\n3️⃣ Recherche des abonnements Stripe actifs...')
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 100
    })

    console.log(`   📋 Total d'abonnements trouvés: ${subscriptions.data.length}`)
    
    // Afficher tous les abonnements pour debug
    subscriptions.data.forEach((sub, index) => {
      console.log(`   Abonnement ${index + 1}: ${sub.id}, status: ${sub.status}, period_end: ${sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : 'N/A'}`)
    })

    // Chercher les abonnements avec status 'active' (même si la période semble expirée)
    const activeSubscriptions = subscriptions.data.filter(sub => 
      sub.status === 'active'
    )

    if (activeSubscriptions.length === 0) {
      console.error('❌ Aucun abonnement avec status "active" trouvé dans Stripe')
      return
    }

    const subscription = activeSubscriptions[0]
    console.log('   ✅ Abonnement actif trouvé:')
    console.log('   - Subscription ID:', subscription.id)
    console.log('   - Status:', subscription.status)

    const priceId = subscription.items.data[0]?.price?.id
    if (!priceId) {
      console.error('❌ Aucun price ID trouvé dans l\'abonnement')
      return
    }

    // 4. Déterminer le planId (priorité aux metadata)
    const planIdFromMetadata = subscription.metadata?.planId
    let planId = planIdFromMetadata || 'essentiel' // Par défaut
    
    if (!planIdFromMetadata) {
      // Fallback: déterminer depuis le price ID
      const priceIdLower = priceId.toLowerCase()
      if (priceIdLower.includes('essentiel') || priceIdLower === 'price_1sftnzrnelgarkti51jscso') {
        planId = 'essentiel'
      } else if (priceIdLower.includes('avance')) {
        planId = 'avance'
      } else if (priceIdLower.includes('premium')) {
        planId = 'premium'
      } else if (priceIdLower.includes('starter')) {
        planId = 'starter'
      } else if (priceIdLower.includes('pro')) {
        planId = 'pro'
      } else if (priceIdLower.includes('expert')) {
        planId = 'expert'
      }
    }

    console.log('   - Plan ID:', planId)
    console.log('   - Price ID:', priceId)
    
    // Gérer current_period_end (peut être undefined dans certains cas)
    let periodEnd = null
    if (subscription.current_period_end) {
      periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
      console.log('   - Période fin:', periodEnd)
    } else {
      // Si pas de current_period_end, utiliser une date future (ex: +1 mois)
      periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      console.log('   - Période fin: N/A dans Stripe, utilisation d\'une date par défaut (+1 mois):', periodEnd)
    }

    // 5. Vérifier si l'abonnement existe déjà dans la base
    console.log('\n4️⃣ Vérification dans la base de données...')
    const existingSubscriptions = await sql`
      SELECT * FROM subscriptions 
      WHERE "stripeSubscriptionId" = ${subscription.id}
    `

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSub = existingSubscriptions[0]
      console.log('   ⚠️ Abonnement existe déjà, mise à jour...')
      
      await sql`
        UPDATE subscriptions 
        SET 
          status = 'active',
          "planId" = ${planId},
          "stripeCustomerId" = ${customer.id},
          "currentPeriodEnd" = ${periodEnd}::timestamp,
          updated_at = ${new Date().toISOString()}::timestamp
        WHERE id = ${existingSub.id}::uuid
      `

      console.log('   ✅ Abonnement mis à jour avec succès')
    } else {
      console.log('   📝 Création d\'un nouvel abonnement...')
      
      await sql`
        INSERT INTO subscriptions (
          "userId",
          status,
          "planId",
          "stripeSubscriptionId",
          "stripeCustomerId",
          "currentPeriodEnd",
          created_at,
          updated_at
        ) VALUES (
          ${userId}::uuid,
          'active',
          ${planId},
          ${subscription.id},
          ${customer.id},
          ${periodEnd}::timestamp,
          ${new Date().toISOString()}::timestamp,
          ${new Date().toISOString()}::timestamp
        )
      `

      console.log('   ✅ Abonnement créé avec succès')
    }

    // 6. Mettre à jour le customer ID dans users si nécessaire (optionnel, pas critique)
    if (!user.stripeCustomerId && !user.stripe_customer_id) {
      console.log('\n5️⃣ Mise à jour du customer ID dans users...')
      try {
        // Essayer avec stripeCustomerId (camelCase)
        await sql`
          UPDATE users 
          SET "stripeCustomerId" = ${customer.id}
          WHERE id = ${userId}::uuid
        `
        console.log('   ✅ Customer ID mis à jour')
      } catch (error) {
        // Si la colonne n'existe pas, ce n'est pas grave
        console.log('   ⚠️ Colonne stripeCustomerId n\'existe pas dans users (non critique)')
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Synchronisation terminée avec succès!')
    console.log(`\n💡 L'utilisateur devrait maintenant avoir accès aux vidéos via son abonnement "${planId}"\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    if (error.type === 'StripeAuthenticationError') {
      console.error('   ⚠️ Erreur d\'authentification Stripe - vérifiez STRIPE_SECRET_KEY')
    }
    throw error
  }
}

// Récupérer l'userId depuis les arguments
const userId = process.argv[2]

if (!userId) {
  console.error('❌ Usage: node scripts/sync-user-subscription.js <userId>')
  console.error('   Exemple: node scripts/sync-user-subscription.js fe4b1b75-9dc1-4d79-913b-30caaab72f19')
  process.exit(1)
}

syncUserSubscription(userId).then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
