#!/usr/bin/env node

/**
 * Script de synchronisation des coupons Stripe
 * 
 * Crée les coupons manquants dans Stripe (mode test ou live)
 * 
 * Usage:
 *   node scripts/sync-stripe-coupons.js
 *   node scripts/sync-stripe-coupons.js --force  (recréer même si existant)
 *   node scripts/sync-stripe-coupons.js --key sk_test_xxx  (utiliser une clé spécifique)
 * 
 * Ou via l'API déployée:
 *   curl -X POST https://pilates-coaching-app.vercel.app/api/admin/sync-stripe-coupons
 */

const Stripe = require('stripe')

// Parse command line arguments
const args = process.argv.slice(2)
const force = args.includes('--force')
const keyIndex = args.indexOf('--key')
const customKey = keyIndex >= 0 ? args[keyIndex + 1] : null

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

// Determine which Stripe key to use
const stripeKey = customKey 
  || process.env.STRIPE_SECRET_KEY_TEST 
  || process.env.STRIPE_SECRET_KEY

if (!stripeKey) {
  console.error('❌ No Stripe secret key found. Set STRIPE_SECRET_KEY or use --key flag.')
  process.exit(1)
}

const isTestMode = stripeKey.startsWith('sk_test_')
console.log(`\n💳 Stripe mode: ${isTestMode ? '🧪 TEST' : '🔴 LIVE'}`)
console.log(`🔑 Key: ${stripeKey.substring(0, 20)}...${stripeKey.substring(stripeKey.length - 4)}`)

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-08-27.basil',
})

// Coupons à créer - correspond aux codes promo dans la base de données
// Ajoutez vos coupons ici
const COUPONS_TO_SYNC = [
  {
    id: 'ONLYYOU20',
    name: 'Only You -20%',
    percent_off: 20,
    duration: 'forever',
  },
  {
    id: 'ONLYYOU30',
    name: 'Only You -30%',
    percent_off: 30,
    duration: 'forever',
  },
  {
    id: 'ONLYYOU10',
    name: 'Only You -10%',
    percent_off: 10,
    duration: 'forever',
  },
  {
    id: 'ONLYYOU50',
    name: 'Only You -50%',
    percent_off: 50,
    duration: 'forever',
  },
  {
    id: 'BIENVENUE10',
    name: 'Bienvenue -10%',
    percent_off: 10,
    duration: 'forever',
  },
  {
    id: 'NOEL2026',
    name: 'Noël 2026 -20%',
    percent_off: 20,
    duration: 'forever',
  },
  {
    id: 'FLASH50',
    name: 'Flash Sale -50%',
    percent_off: 50,
    duration: 'forever',
  },
  {
    id: 'FIDELE15',
    name: 'Fidélité -15 CHF',
    amount_off: 1500,
    currency: 'chf',
    duration: 'forever',
  },
  {
    id: 'STARTER5',
    name: 'Starter -5 CHF',
    amount_off: 500,
    currency: 'chf',
    duration: 'forever',
  },
]

async function syncCoupons() {
  console.log(`\n📋 Coupons à synchroniser: ${COUPONS_TO_SYNC.length}`)
  console.log('─'.repeat(60))

  const results = {
    created: [],
    skipped: [],
    errors: [],
  }

  for (const couponConfig of COUPONS_TO_SYNC) {
    try {
      // Vérifier si le coupon existe déjà
      let exists = false
      if (!force) {
        try {
          await stripe.coupons.retrieve(couponConfig.id)
          exists = true
        } catch {
          // N'existe pas
        }
      }

      if (exists && !force) {
        console.log(`⏭️  ${couponConfig.id} - Déjà existant (--force pour recréer)`)
        results.skipped.push(couponConfig.id)
        continue
      }

      // Si force et existe, supprimer d'abord
      if (force && exists) {
        try {
          await stripe.coupons.del(couponConfig.id)
          console.log(`🗑️  ${couponConfig.id} - Supprimé (recréation en cours...)`)
        } catch (delErr) {
          console.warn(`⚠️  ${couponConfig.id} - Impossible de supprimer: ${delErr.message}`)
        }
      }

      // Créer le coupon
      const coupon = await stripe.coupons.create(couponConfig)
      
      const discountInfo = coupon.percent_off 
        ? `${coupon.percent_off}% off` 
        : `${(coupon.amount_off / 100).toFixed(2)} ${coupon.currency.toUpperCase()} off`
      
      console.log(`✅ ${coupon.id} - Créé (${discountInfo})`)
      results.created.push(coupon.id)
    } catch (error) {
      console.error(`❌ ${couponConfig.id} - Erreur: ${error.message}`)
      results.errors.push({ id: couponConfig.id, error: error.message })
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('📊 Résumé:')
  console.log(`   ✅ Créés: ${results.created.length}`)
  console.log(`   ⏭️  Ignorés: ${results.skipped.length}`)
  console.log(`   ❌ Erreurs: ${results.errors.length}`)
  
  if (results.errors.length > 0) {
    console.log('\n❌ Erreurs détaillées:')
    results.errors.forEach(e => console.log(`   - ${e.id}: ${e.error}`))
  }

  // Lister tous les coupons actuels dans Stripe
  console.log('\n📋 Coupons actuels dans Stripe:')
  const allCoupons = await stripe.coupons.list({ limit: 100 })
  allCoupons.data.forEach(c => {
    const discount = c.percent_off 
      ? `${c.percent_off}% off` 
      : `${(c.amount_off / 100).toFixed(2)} ${c.currency.toUpperCase()} off`
    console.log(`   - ${c.id}: ${c.name || 'Sans nom'} (${discount}) ${c.valid ? '✅' : '❌ invalide'}`)
  })

  console.log('\n✨ Terminé!')
}

syncCoupons().catch(err => {
  console.error('💥 Erreur fatale:', err)
  process.exit(1)
})
