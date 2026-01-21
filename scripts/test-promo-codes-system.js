#!/usr/bin/env node

/**
 * Script de test complet du système de codes promo
 * 1. Crée les tables si nécessaire
 * 2. Crée un code promo de test
 * 3. Affiche les instructions pour tester
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non trouvée dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function checkAndCreateTables() {
  console.log('🔍 Vérification des tables...\n')

  try {
    // Vérifier si la table promo_codes existe
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'promo_codes'
      ) as exists;
    `

    if (!tableCheck[0].exists) {
      console.log('📝 Création de la table promo_codes...')
      
      // Créer la table promo_codes
      await sql`
        CREATE TABLE IF NOT EXISTS promo_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
          discount_value INTEGER NOT NULL,
          stripe_coupon_id VARCHAR(255),
          max_uses INTEGER,
          current_uses INTEGER DEFAULT 0,
          max_uses_per_user INTEGER DEFAULT 1,
          eligible_plans TEXT[],
          valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          valid_until TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT true,
          description TEXT,
          created_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      await sql`
        CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
      `

      console.log('✅ Table promo_codes créée\n')
    } else {
      console.log('✅ Table promo_codes existe déjà\n')
    }

    // Vérifier la table promo_code_usage
    const usageTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'promo_code_usage'
      ) as exists;
    `

    if (!usageTableCheck[0].exists) {
      console.log('📝 Création de la table promo_code_usage...')
      
      await sql`
        CREATE TABLE IF NOT EXISTS promo_code_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
          user_id UUID,
          subscription_id VARCHAR(255),
          discount_amount INTEGER NOT NULL,
          original_amount INTEGER NOT NULL,
          final_amount INTEGER NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      await sql`
        CREATE INDEX IF NOT EXISTS idx_promo_usage_promo_code ON promo_code_usage(promo_code_id);
      `

      console.log('✅ Table promo_code_usage créée\n')
    } else {
      console.log('✅ Table promo_code_usage existe déjà\n')
    }

    return true
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message)
    return false
  }
}

async function createTestPromoCode() {
  console.log('🎫 Création d\'un code promo de test...\n')

  try {
    // Vérifier si le code existe déjà
    const existing = await sql`
      SELECT id, code, is_active FROM promo_codes WHERE code = 'TEST20'
    `

    if (existing.length > 0) {
      console.log('⚠️  Le code TEST20 existe déjà')
      console.log(`   Statut: ${existing[0].is_active ? '✅ Actif' : '❌ Inactif'}`)
      console.log(`   ID: ${existing[0].id}\n`)
      
      // Réactiver si inactif
      if (!existing[0].is_active) {
        await sql`
          UPDATE promo_codes SET is_active = true WHERE code = 'TEST20'
        `
        console.log('✅ Code réactivé\n')
      }
      
      return existing[0]
    }

    // Créer un nouveau code promo de test
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
        is_active
      ) VALUES (
        'TEST20',
        'percentage',
        20,
        100,
        0,
        1,
        NULL,
        NOW(),
        NOW() + INTERVAL '30 days',
        'Code de test - 20% de réduction pour 30 jours',
        true
      )
      RETURNING *
    `

    const promoCode = result[0]

    console.log('✅ Code promo créé avec succès !')
    console.log(`   📌 Code: ${promoCode.code}`)
    console.log(`   💰 Réduction: ${promoCode.discount_value}%`)
    console.log(`   🎯 Limite: ${promoCode.max_uses} utilisations`)
    console.log(`   📅 Valide jusqu'au: ${new Date(promoCode.valid_until).toLocaleDateString('fr-FR')}`)
    console.log(`   📝 Description: ${promoCode.description}`)
    console.log(`   🆔 ID: ${promoCode.id}\n`)

    return promoCode
  } catch (error) {
    console.error('❌ Erreur lors de la création du code promo:', error.message)
    return null
  }
}

async function displayAllPromoCodes() {
  console.log('📋 Liste de tous les codes promo:\n')

  try {
    const codes = await sql`
      SELECT 
        code,
        discount_type,
        discount_value,
        current_uses,
        max_uses,
        is_active,
        valid_until
      FROM promo_codes
      ORDER BY created_at DESC
    `

    if (codes.length === 0) {
      console.log('   Aucun code promo trouvé\n')
      return
    }

    console.log('┌─────────────────┬──────────────┬────────────┬──────────┬──────────┐')
    console.log('│ Code            │ Type         │ Valeur     │ Util.    │ Statut   │')
    console.log('├─────────────────┼──────────────┼────────────┼──────────┼──────────┤')

    codes.forEach(code => {
      const type = code.discount_type === 'percentage' ? 'Pourcentage' : 'Montant fixe'
      const value = code.discount_type === 'percentage' 
        ? `${code.discount_value}%` 
        : `${(code.discount_value / 100).toFixed(2)} CHF`
      const usage = `${code.current_uses}/${code.max_uses || '∞'}`
      const status = code.is_active ? '✅ Actif' : '❌ Inactif'
      
      console.log(`│ ${code.code.padEnd(15)} │ ${type.padEnd(12)} │ ${value.padEnd(10)} │ ${usage.padEnd(8)} │ ${status.padEnd(8)} │`)
    })

    console.log('└─────────────────┴──────────────┴────────────┴──────────┴──────────┘\n')
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des codes:', error.message)
  }
}

async function displayTestInstructions() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 INSTRUCTIONS DE TEST')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('📍 ÉTAPE 1 : Interface Admin')
  console.log('   → Ouvrez: http://localhost:3000/admin/promo-codes')
  console.log('   → Connectez-vous avec: blmarieline@gmail.com')
  console.log('   → Vous devriez voir le code TEST20\n')

  console.log('📍 ÉTAPE 2 : Créer un nouveau code (optionnel)')
  console.log('   → Cliquez sur "Nouveau Code Promo"')
  console.log('   → Exemple:')
  console.log('      • Code: BIENVENUE10')
  console.log('      • Type: Pourcentage')
  console.log('      • Valeur: 10')
  console.log('      • Cochez "Créer coupon Stripe"\n')

  console.log('📍 ÉTAPE 3 : Tester le Checkout')
  console.log('   → Ouvrez: http://localhost:3000/souscriptions/personnalise')
  console.log('   → Sélectionnez un plan (ex: Essentiel - 69 CHF)')
  console.log('   → Cliquez sur "S\'abonner"')
  console.log('   → Sur la page de paiement, entrez: TEST20')
  console.log('   → Cliquez sur "Appliquer"\n')

  console.log('📍 RÉSULTAT ATTENDU :')
  console.log('   ✅ Prix original: 69 CHF (barré)')
  console.log('   ✅ Réduction: -13.80 CHF (-20%)')
  console.log('   ✅ Nouveau prix: 55.20 CHF')
  console.log('   ✅ Le bouton de paiement affiche: "Payer 55.20 CHF"\n')

  console.log('📍 ÉTAPE 4 : Tester le Paiement')
  console.log('   → Carte de test Stripe:')
  console.log('      • Numéro: 4242 4242 4242 4242')
  console.log('      • Date: 12/28 (ou n\'importe quelle date future)')
  console.log('      • CVC: 123')
  console.log('   → Complétez le paiement\n')

  console.log('📍 ÉTAPE 5 : Vérifier')
  console.log('   → Retournez à /admin/promo-codes')
  console.log('   → Le compteur de TEST20 devrait afficher: 1/100\n')

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 CODES DISPONIBLES POUR TEST:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const codes = await sql`
    SELECT code, discount_value, discount_type 
    FROM promo_codes 
    WHERE is_active = true
    ORDER BY created_at DESC
  `

  codes.forEach(code => {
    const value = code.discount_type === 'percentage' 
      ? `${code.discount_value}%` 
      : `${(code.discount_value / 100).toFixed(2)} CHF`
    console.log(`   • ${code.code} → ${value} de réduction`)
  })

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗')
  console.log('║   🧪 TEST SYSTÈME DE CODES PROMO                 ║')
  console.log('╚═══════════════════════════════════════════════════╝\n')

  // 1. Vérifier et créer les tables
  const tablesReady = await checkAndCreateTables()
  if (!tablesReady) {
    console.error('❌ Impossible de continuer sans les tables')
    process.exit(1)
  }

  // 2. Créer un code promo de test
  await createTestPromoCode()

  // 3. Afficher tous les codes
  await displayAllPromoCodes()

  // 4. Afficher les instructions
  await displayTestInstructions()

  console.log('✅ Prêt pour les tests ! Suivez les instructions ci-dessus.\n')
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
