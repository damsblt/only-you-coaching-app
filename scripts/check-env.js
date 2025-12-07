/**
 * Script pour vérifier les variables d'environnement
 * Lancez: node scripts/check-env.js
 */

require('dotenv').config({ path: '.env.local' })

const requiredVars = {
  // Supabase (essentiel)
  'NEXT_PUBLIC_SUPABASE_URL': 'URL de votre projet Supabase',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Clé anon Supabase (publique)',
  'SUPABASE_SERVICE_ROLE_KEY': 'Clé service role Supabase (⚠️ SECRET)',
  
  // Database
  'DATABASE_URL': 'URL PostgreSQL Supabase',
  
  // NextAuth (optionnel si SimpleAuth est utilisé)
  'NEXTAUTH_URL': 'URL du site (localhost en dev, domaine en prod)',
  'NEXTAUTH_SECRET': 'Secret NextAuth',
  
  // AWS S3 (pour les vidéos)
  'AWS_REGION': 'Région AWS (ex: eu-north-1)',
  'AWS_ACCESS_KEY_ID': 'Access Key AWS',
  'AWS_SECRET_ACCESS_KEY': 'Secret Key AWS',
  'AWS_S3_BUCKET_NAME': 'Nom du bucket S3',
  
  // Stripe (paiements)
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Clé publique Stripe',
  'STRIPE_SECRET_KEY': 'Clé secrète Stripe',
  'STRIPE_WEBHOOK_SECRET': 'Secret webhook Stripe',
}

console.log('\n📋 Vérification des variables d\'environnement\n')
console.log('='.repeat(60))

let missingVars = []
let configuredVars = []
let warnings = []

Object.entries(requiredVars).forEach(([key, description]) => {
  const value = process.env[key]
  
  if (!value || value === '') {
    missingVars.push({ key, description })
    console.log(`❌ ${key}`)
    console.log(`   ${description}`)
    console.log()
  } else {
    configuredVars.push(key)
    // Mask sensitive values
    const maskedValue = key.includes('KEY') || key.includes('SECRET') 
      ? '***' + value.slice(-4) 
      : value
    console.log(`✅ ${key}: ${maskedValue}`)
    console.log(`   ${description}`)
    console.log()
  }
})

console.log('='.repeat(60))
console.log('\n📊 Résumé:\n')
console.log(`✅ Configurées: ${configuredVars.length}`)
console.log(`❌ Manquantes: ${missingVars.length}`)

if (missingVars.length > 0) {
  console.log('\n🚨 Variables manquantes:\n')
  missingVars.forEach(({ key, description }) => {
    console.log(`- ${key}: ${description}`)
  })
  
  console.log('\n📝 Pour ajouter ces variables:')
  console.log('1. Ouvrez le fichier .env.local')
  console.log('2. Copiez le format depuis env.example')
  console.log('3. Remplissez avec vos vraies valeurs\n')
} else {
  console.log('\n🎉 Toutes les variables requises sont configurées!\n')
}

// Vérifications supplémentaires
console.log('🔍 Vérifications supplémentaires:\n')

// Check if using test or production keys
if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  const isTest = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')
  console.log(`Stripe Mode: ${isTest ? '⚠️  TEST' : '✅ PRODUCTION'}`)
}

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  console.log(`Supabase: ${url.includes('supabase.co') ? '✅ URL valide' : '❌ URL invalide'}`)
}

// Check environment
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)

console.log('\n' + '='.repeat(60) + '\n')


