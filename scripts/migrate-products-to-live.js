#!/usr/bin/env node
/**
 * Script de migration des produits Stripe vers le mode LIVE
 * 
 * Usage: 
 *   node scripts/migrate-products-to-live.js sk_live_VOTRE_CLE_SECRETE
 * 
 * Ce script crée les 6 produits Only You Coaching avec leurs prix
 * sur le compte Stripe en mode LIVE.
 */

const Stripe = require('stripe')

const LIVE_KEY = process.argv[2]

if (!LIVE_KEY || !LIVE_KEY.startsWith('sk_live_')) {
  console.error('❌ Usage: node scripts/migrate-products-to-live.js sk_live_VOTRE_CLE_SECRETE')
  console.error('   Récupérez votre clé secrète live depuis https://dashboard.stripe.com/apikeys')
  process.exit(1)
}

const stripe = new Stripe(LIVE_KEY, { apiVersion: '2025-08-27.basil' })

const PRODUCTS = [
  {
    name: 'Essentiel - Accompagnement',
    description: "Accès à la bibliothèque de vidéos d'exercices, recettes, programmes prédéfinis, 3 Programmes d'entraînement personnalisés, 1 appel de coaching par mois de 30 mn, Vidéo des exercices et explicatif envoyé par mail, Assistance Messagerie Sms – mail 5 jours/semaine",
    metadata: { planId: 'essentiel', category: 'personalized', duration_months: '3', commitment_period: 'true' },
    price: { unit_amount: 6900, currency: 'chf', nickname: 'Essentiel - 69 CHF/mois', planId: 'essentiel' },
  },
  {
    name: 'Avancé - Accompagnement',
    description: "Tous les avantages Essentiel + Accès à la bibliothèque d'audios guidés + Surveillance et conseil nutritionnel continue + Suivi des progrès",
    metadata: { planId: 'avance', category: 'personalized', duration_months: '3', commitment_period: 'true' },
    price: { unit_amount: 10900, currency: 'chf', nickname: 'Avancé - 109 CHF/mois', planId: 'avance' },
  },
  {
    name: 'Premium - Accompagnement',
    description: "Tous les avantages Avancé + 1 Visite à domicile de présentation du programme",
    metadata: { planId: 'premium', category: 'personalized', duration_months: '3', commitment_period: 'true' },
    price: { unit_amount: 14900, currency: 'chf', nickname: 'Premium - 149 CHF/mois', planId: 'premium' },
  },
  {
    name: 'Starter - Autonomie',
    description: "Accès à la bibliothèque de vidéos d'exercices + Accès à la bibliothèque d'audios guidés + Accès à mes recettes",
    metadata: { planId: 'starter', category: 'online', duration_months: '2', commitment_period: 'true' },
    price: { unit_amount: 3500, currency: 'chf', nickname: 'Starter - 35 CHF/mois', planId: 'starter' },
  },
  {
    name: 'Pro - Autonomie',
    description: "Accès à la bibliothèque de vidéos d'exercices + Accès aux programmes prédéfinis + Accès à la bibliothèque d'audios guidés + Accès à mes recettes",
    metadata: { planId: 'pro', category: 'online', duration_months: '4', commitment_period: 'true' },
    price: { unit_amount: 3000, currency: 'chf', nickname: 'Pro - 30 CHF/mois', planId: 'pro' },
  },
  {
    name: 'Expert - Autonomie',
    description: "Accès à la bibliothèque de vidéos d'exercices + Accès aux programmes prédéfinis + Accès à la bibliothèque d'audios guidés + Accès à mes recettes",
    metadata: { planId: 'expert', category: 'online', duration_months: '6', commitment_period: 'true' },
    price: { unit_amount: 2500, currency: 'chf', nickname: 'Expert - 25 CHF/mois', planId: 'expert' },
  },
]

async function migrate() {
  console.log('🚀 Migration des produits vers Stripe LIVE...\n')

  // Verify account
  const account = await stripe.accounts.retrieve()
  console.log(`✅ Connecté au compte: ${account.id} (${account.settings?.dashboard?.display_name || 'N/A'})`)
  console.log(`   Charges: ${account.charges_enabled} | Payouts: ${account.payouts_enabled}\n`)

  if (!account.charges_enabled) {
    console.error('❌ Le compte n\'a pas les charges activées. Impossible de continuer.')
    process.exit(1)
  }

  const results = []

  for (const prod of PRODUCTS) {
    try {
      console.log(`📦 Création: ${prod.name}`)

      const product = await stripe.products.create({
        name: prod.name,
        description: prod.description,
        metadata: prod.metadata,
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: prod.price.unit_amount,
        currency: prod.price.currency,
        recurring: { interval: 'month', interval_count: 1 },
        nickname: prod.price.nickname,
        metadata: { planId: prod.price.planId },
      })

      // Set default price
      await stripe.products.update(product.id, {
        default_price: price.id,
      })

      const amount = (prod.price.unit_amount / 100).toFixed(2)
      console.log(`   ✅ Product: ${product.id}`)
      console.log(`   ✅ Price:   ${price.id} (${amount} ${prod.price.currency.toUpperCase()}/mois)`)
      console.log()

      results.push({
        planId: prod.price.planId,
        name: prod.name,
        productId: product.id,
        priceId: price.id,
        amount: `${amount} ${prod.price.currency.toUpperCase()}`,
      })
    } catch (err) {
      console.error(`   ❌ Erreur: ${err.message}`)
    }
  }

  console.log('\n============================================')
  console.log('  RÉSUMÉ MIGRATION LIVE')
  console.log('============================================\n')

  console.log('Copiez ces Price IDs pour mettre à jour votre code :\n')
  for (const r of results) {
    console.log(`  ${r.planId.padEnd(12)} → ${r.priceId}  (${r.amount}/mois)`)
  }

  console.log('\n✅ Migration terminée !')
  console.log('\n📌 Prochaine étape: Mettez à jour le mapping des Price IDs dans votre code.')
}

migrate().catch(err => {
  console.error('❌ Erreur fatale:', err.message)
  process.exit(1)
})
