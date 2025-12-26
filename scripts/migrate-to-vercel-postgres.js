/**
 * Script de migration des données de Supabase vers Vercel Postgres
 * 
 * Usage:
 *   node scripts/migrate-to-vercel-postgres.js
 * 
 * Prérequis:
 *   - Vercel CLI installé et connecté
 *   - Base de données Vercel Postgres créée et liée
 *   - Variables d'environnement récupérées (vercel env pull)
 *   - Les tables doivent déjà exister dans Vercel Postgres
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { sql } = require('@vercel/postgres')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const postgresUrl = process.env.POSTGRES_URL

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes')
  console.error('   NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis')
  process.exit(1)
}

if (!postgresUrl) {
  console.error('❌ Variable Vercel Postgres manquante')
  console.error('   POSTGRES_URL est requis')
  console.error('   Exécutez: vercel env pull .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Liste des tables à migrer
const TABLES = [
  'users',
  'videos_new',
  'recipes',
  'audios',
  'subscriptions',
  'programs',
  'program_regions'
]

async function migrateTable(tableName) {
  console.log(`\n📦 Migration de la table: ${tableName}`)
  
  try {
    // Récupérer les données de Supabase
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
    
    if (error) {
      console.error(`   ❌ Erreur lors de la récupération: ${error.message}`)
      return { success: false, count: 0 }
    }
    
    if (!data || data.length === 0) {
      console.log(`   ⚠️  Aucune donnée à migrer`)
      return { success: true, count: 0 }
    }
    
    console.log(`   📊 ${data.length} enregistrements trouvés`)
    
    // Insérer les données dans Vercel Postgres
    let inserted = 0
    let errors = 0
    
    for (const row of data) {
      try {
        const keys = Object.keys(row)
        const values = Object.values(row)
        
        // Construire la requête avec template literals de Vercel Postgres
        // Note: Vercel Postgres utilise des template literals pour la sécurité
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
        const query = `
          INSERT INTO ${tableName} (${keys.map(k => `"${k}"`).join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
          ${keys.filter(k => k !== 'id').map((k, i) => `"${k}" = $${keys.length + i + 1}`).join(', ')}
        `
        
        // Utiliser sql.query pour les requêtes avec paramètres
        await sql.query(query, [...values, ...values.filter((_, i) => keys[i] !== 'id')])
        inserted++
      } catch (insertError) {
        console.error(`   ⚠️  Erreur lors de l'insertion d'un enregistrement:`, insertError.message)
        errors++
      }
    }
    
    console.log(`   ✅ ${inserted} enregistrements migrés`)
    if (errors > 0) {
      console.log(`   ⚠️  ${errors} erreurs`)
    }
    
    return { success: true, count: inserted }
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`)
    return { success: false, count: 0 }
  }
}

async function verifyMigration(tableName) {
  try {
    const result = await sql.query(`SELECT COUNT(*) as count FROM ${tableName}`)
    const count = result.rows[0]?.count || 0
    return parseInt(count)
  } catch (error) {
    console.error(`   ⚠️  Impossible de vérifier ${tableName}: ${error.message}`)
    return 0
  }
}

async function main() {
  console.log('🚀 Début de la migration Supabase → Vercel Postgres\n')
  console.log('📋 Tables à migrer:', TABLES.join(', '))
  console.log('📍 Source: Supabase')
  console.log('📍 Destination: Vercel Postgres\n')
  
  const results = {}
  
  for (const table of TABLES) {
    const result = await migrateTable(table)
    results[table] = result
    
    // Vérifier la migration
    const vercelCount = await verifyMigration(table)
    console.log(`   📊 Vérification: ${vercelCount} enregistrements dans Vercel Postgres`)
  }
  
  // Résumé
  console.log('\n' + '='.repeat(50))
  console.log('📊 RÉSUMÉ DE LA MIGRATION')
  console.log('='.repeat(50))
  
  let totalMigrated = 0
  let totalErrors = 0
  
  for (const [table, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${table}: ${result.count} enregistrements`)
    totalMigrated += result.count
    if (!result.success) totalErrors++
  }
  
  console.log('='.repeat(50))
  console.log(`✅ Total: ${totalMigrated} enregistrements migrés`)
  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} tables avec des erreurs`)
  }
  console.log('\n✨ Migration terminée!')
  console.log('\n📝 Prochaines étapes:')
  console.log('   1. Vérifier les données dans Vercel Dashboard')
  console.log('   2. Mettre à jour le code pour utiliser @vercel/postgres')
  console.log('   3. Tester localement: npm run dev')
  console.log('   4. Déployer: vercel --prod')
}

main().catch(console.error)

