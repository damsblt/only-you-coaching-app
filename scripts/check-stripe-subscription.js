/**
 * Script pour vérifier les abonnements Stripe d'un utilisateur
 * Usage: node scripts/check-stripe-subscription.js <userId>
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY n\'est pas défini dans .env.local')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

async function checkStripeSubscription(userId) {
  console.log(`\n🔍 Vérification Stripe pour l'utilisateur: ${userId}\n`)
  console.log('='.repeat(60))

  try {
    // 1. Récupérer l'utilisateur depuis la base de données
    const { neon } = require('@neondatabase/serverless')
    const DATABASE_URL = process.env.DATABASE_URL
    
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL n\'est pas défini')
      process.exit(1)
    }

    const sql = neon(DATABASE_URL)
    
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
    console.log('   - Stripe Customer ID (users.stripeCustomerId):', user.stripeCustomerId || user.stripe_customer_id || '❌ NON DÉFINI')

    // 2. Chercher le customer Stripe
    console.log('\n2️⃣ Recherche du customer Stripe:')
    
    let customer = null
    const customerId = user.stripeCustomerId || user.stripe_customer_id

    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId)
        console.log('   ✅ Customer trouvé via customer ID:', customerId)
      } catch (error) {
        console.log('   ⚠️ Customer ID invalide ou non trouvé:', error.message)
      }
    }

    // Si pas de customer ID ou customer non trouvé, chercher par email
    if (!customer) {
      console.log('   🔍 Recherche par email:', user.email)
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 10
        })
        
        if (customers.data.length > 0) {
          customer = customers.data[0]
          console.log('   ✅ Customer trouvé via email:', customer.id)
          console.log('   💡 Customer ID à mettre à jour dans la base:', customer.id)
        } else {
          console.log('   ⚠️ Aucun customer trouvé avec cet email')
        }
      } catch (error) {
        console.error('   ❌ Erreur lors de la recherche par email:', error.message)
      }
    }

    if (!customer) {
      console.log('\n❌ Aucun customer Stripe trouvé pour cet utilisateur')
      return
    }

    console.log('\n   Informations du customer:')
    console.log('   - Customer ID:', customer.id)
    console.log('   - Email:', customer.email)
    console.log('   - Nom:', customer.name)
    console.log('   - Créé le:', new Date(customer.created * 1000).toISOString())

    // 3. Chercher les abonnements actifs
    console.log('\n3️⃣ Abonnements Stripe actifs:')
    
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all', // Chercher tous les statuts
        limit: 100
      })

      console.log(`   📋 Nombre d'abonnements trouvés: ${subscriptions.data.length}`)

      if (subscriptions.data.length === 0) {
        console.log('   ⚠️ Aucun abonnement trouvé dans Stripe')
      } else {
        for (let index = 0; index < subscriptions.data.length; index++) {
          const sub = subscriptions.data[index]
          console.log(`\n   Abonnement ${index + 1}:`)
          console.log('   - Subscription ID:', sub.id)
          console.log('   - Status:', sub.status)
          try {
            console.log('   - Créé le:', sub.created ? new Date(sub.created * 1000).toISOString() : 'N/A')
            console.log('   - Période actuelle - Début:', sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : 'N/A')
            console.log('   - Période actuelle - Fin:', sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : 'N/A')
          } catch (dateError) {
            console.log('   - Dates:', 'Erreur de conversion')
          }
          
          // Vérifier si l'abonnement est encore valide
          const isValid = sub.status === 'active' && new Date(sub.current_period_end * 1000) > new Date()
          console.log('   - Valide:', isValid ? '✅ OUI' : '❌ NON')
          
          // Informations sur le plan
          if (sub.items && sub.items.data.length > 0) {
            const price = sub.items.data[0].price
            console.log('   - Price ID:', price.id)
            console.log('   - Montant:', `${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`)
            console.log('   - Interval:', price.recurring?.interval || 'N/A')
            
            // Extraire le planId depuis les metadata
            const planId = sub.metadata?.planId || price.metadata?.planId
            console.log('   - Plan ID (metadata):', planId || '❌ NON DÉFINI')
            
            // Essayer de déterminer le plan depuis le price ID
            const priceIdLower = price.id.toLowerCase()
            let detectedPlan = null
            if (priceIdLower.includes('essentiel') || priceIdLower === 'price_1sftnzrnelgarkti51jscso') {
              detectedPlan = 'essentiel'
            } else if (priceIdLower.includes('avance')) {
              detectedPlan = 'avance'
            } else if (priceIdLower.includes('premium')) {
              detectedPlan = 'premium'
            } else if (priceIdLower.includes('starter')) {
              detectedPlan = 'starter'
            } else if (priceIdLower.includes('pro')) {
              detectedPlan = 'pro'
            } else if (priceIdLower.includes('expert')) {
              detectedPlan = 'expert'
            }
            
            if (detectedPlan) {
              console.log('   - Plan détecté (depuis price ID):', detectedPlan)
            }
          }

          // Metadata
          if (sub.metadata && Object.keys(sub.metadata).length > 0) {
            console.log('   - Metadata:', JSON.stringify(sub.metadata, null, 2))
          }

          // Vérifier si cet abonnement existe dans notre base de données
          console.log('\n   🔍 Vérification dans la base de données:')
          const dbSubscriptions = await sql`
            SELECT * FROM subscriptions 
            WHERE "stripeSubscriptionId" = ${sub.id}
          `
          
          if (dbSubscriptions && dbSubscriptions.length > 0) {
            console.log('   ✅ Abonnement trouvé dans la base de données')
            const dbSub = dbSubscriptions[0]
            console.log('   - planId dans DB:', dbSub.planId || dbSub.plan_id || '❌ NON DÉFINI')
            console.log('   - Status dans DB:', dbSub.status)
          } else {
            console.log('   ⚠️ Abonnement NON trouvé dans la base de données')
            console.log('   💡 Cet abonnement doit être synchronisé!')
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des abonnements:', error.message)
    }

    // 4. Résumé et recommandations
    console.log('\n' + '='.repeat(60))
    console.log('📋 Résumé:')
    console.log('   - Customer Stripe:', customer ? '✅ Trouvé' : '❌ Non trouvé')
    console.log('   - Customer ID:', customer?.id || 'N/A')
    
    if (customer && !customerId) {
      console.log('\n   💡 RECOMMANDATION: Mettre à jour le customer ID dans la base:')
      console.log(`   UPDATE users SET "stripeCustomerId" = '${customer.id}' WHERE id = '${userId}'`)
    }

    console.log('\n✅ Vérification terminée\n')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    if (error.type === 'StripeAuthenticationError') {
      console.error('   ⚠️ Erreur d\'authentification Stripe - vérifiez STRIPE_SECRET_KEY')
    }
  }
}

// Récupérer l'userId depuis les arguments
const userId = process.argv[2]

if (!userId) {
  console.error('❌ Usage: node scripts/check-stripe-subscription.js <userId>')
  console.error('   Exemple: node scripts/check-stripe-subscription.js fe4b1b75-9dc1-4d79-913b-30caaab72f19')
  process.exit(1)
}

checkStripeSubscription(userId).then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
