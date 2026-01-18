#!/usr/bin/env node

/**
 * Script pour créer des codes promo de démonstration
 * Usage: node scripts/create-demo-promo-codes.js
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non trouvée dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

const demoCodes = [
  {
    code: 'BIENVENUE10',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: null, // Illimité
    max_uses_per_user: 1,
    eligible_plans: null, // Tous les plans
    valid_from: new Date().toISOString(),
    valid_until: null, // Pas d'expiration
    description: 'Code de bienvenue - 10% de réduction pour tous les nouveaux clients',
    is_active: true,
  },
  {
    code: 'NOEL2026',
    discount_type: 'percentage',
    discount_value: 20,
    max_uses: 100,
    max_uses_per_user: 1,
    eligible_plans: ['essentiel', 'avance', 'premium'],
    valid_from: '2026-12-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    description: 'Promotion de Noël 2026 - 20% sur plans accompagnement',
    is_active: true,
  },
  {
    code: 'FLASH50',
    discount_type: 'percentage',
    discount_value: 50,
    max_uses: 10,
    max_uses_per_user: 1,
    eligible_plans: ['premium', 'expert'],
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    description: 'Promotion flash 24h - 50% sur plans premium',
    is_active: true,
  },
  {
    code: 'FIDELE15',
    discount_type: 'fixed_amount',
    discount_value: 1500, // 15 CHF
    max_uses: 200,
    max_uses_per_user: 1,
    eligible_plans: null,
    valid_from: new Date().toISOString(),
    valid_until: '2026-12-31T23:59:59Z',
    description: 'Récompense fidélité - 15 CHF pour tous les clients existants',
    is_active: true,
  },
  {
    code: 'STARTER5',
    discount_type: 'fixed_amount',
    discount_value: 500, // 5 CHF
    max_uses: null,
    max_uses_per_user: 1,
    eligible_plans: ['starter'],
    valid_from: new Date().toISOString(),
    valid_until: null,
    description: 'Réduction permanente pour le plan Starter',
    is_active: true,
  },
]

async function createDemoCodes() {
  console.log('🎫 Création des codes promo de démonstration...\n')

  try {
    for (const code of demoCodes) {
      console.log(`📝 Création du code: ${code.code}`)

      // Vérifier si le code existe déjà
      const existing = await sql`
        SELECT id FROM promo_codes WHERE code = ${code.code}
      `

      if (existing.length > 0) {
        console.log(`   ⚠️  Le code ${code.code} existe déjà, ignoré\n`)
        continue
      }

      // Insérer le code promo
      const result = await sql`
        INSERT INTO promo_codes (
          code,
          discount_type,
          discount_value,
          max_uses,
          current_uses,
          max_uses_per_user,
          eligible_plans,
          valid_from,
          valid_until,
          description,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ${code.code},
          ${code.discount_type},
          ${code.discount_value},
          ${code.max_uses},
          0,
          ${code.max_uses_per_user},
          ${code.eligible_plans},
          ${code.valid_from},
          ${code.valid_until},
          ${code.description},
          ${code.is_active},
          NOW(),
          NOW()
        )
        RETURNING id, code
      `

      console.log(`   ✅ Code créé avec succès (ID: ${result[0].id})`)
      console.log(`   📊 Type: ${code.discount_type}`)
      console.log(`   💰 Valeur: ${code.discount_value}${code.discount_type === 'percentage' ? '%' : ' centimes'}`)
      console.log(`   🎯 Limite: ${code.max_uses || 'Illimité'}`)
      console.log(`   📅 Expire: ${code.valid_until ? new Date(code.valid_until).toLocaleDateString('fr-FR') : 'Jamais'}`)
      console.log(`   📝 Description: ${code.description}\n`)
    }

    console.log('✅ Tous les codes promo de démonstration ont été créés !')
    console.log('\n📍 Accédez à /admin/promo-codes pour les voir et les gérer')
    console.log('\n🧪 Codes de test disponibles:')
    demoCodes.forEach(code => {
      console.log(`   • ${code.code}`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création des codes promo:', error)
    console.error(error.message)
    process.exit(1)
  }
}

// Exécuter le script
createDemoCodes()
