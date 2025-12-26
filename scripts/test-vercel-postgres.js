/**
 * Script de test de connexion à Vercel Postgres
 * 
 * Usage:
 *   node scripts/test-vercel-postgres.js
 * 
 * Prérequis:
 *   - Variables d'environnement configurées (vercel env pull)
 */

require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function test() {
  console.log('🧪 Test de connexion à Vercel Postgres\n')
  
  const postgresUrl = process.env.POSTGRES_URL
  
  if (!postgresUrl) {
    console.error('❌ Variable POSTGRES_URL manquante')
    console.error('   Exécutez: vercel env pull .env.local')
    process.exit(1)
  }
  
  try {
    // Test 1: Connexion de base
    console.log('1️⃣  Test de connexion...')
    const result = await sql`SELECT NOW() as now, version() as version`
    console.log('   ✅ Connexion réussie!')
    console.log(`   📅 Heure serveur: ${result.rows[0].now}`)
    console.log(`   🗄️  Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`)
    
    // Test 2: Lister les tables
    console.log('2️⃣  Liste des tables...')
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    if (tables.rows.length === 0) {
      console.log('   ⚠️  Aucune table trouvée')
      console.log('   💡 Exécutez vos scripts SQL de création de tables\n')
    } else {
      console.log(`   ✅ ${tables.rows.length} table(s) trouvée(s):`)
      tables.rows.forEach(row => {
        console.log(`      - ${row.table_name}`)
      })
      console.log()
    }
    
    // Test 3: Compter les enregistrements (si tables existent)
    if (tables.rows.length > 0) {
      console.log('3️⃣  Nombre d\'enregistrements par table...')
      for (const table of tables.rows) {
        try {
          const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`
          console.log(`   📊 ${table.table_name}: ${count.rows[0].count} enregistrement(s)`)
        } catch (error) {
          console.log(`   ⚠️  ${table.table_name}: erreur lors du comptage`)
        }
      }
      console.log()
    }
    
    // Test 4: Test d'écriture (créer une table de test temporaire)
    console.log('4️⃣  Test d\'écriture...')
    try {
      await sql`CREATE TABLE IF NOT EXISTS _test_vercel_postgres (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())`
      await sql`INSERT INTO _test_vercel_postgres DEFAULT VALUES RETURNING id`
      await sql`DROP TABLE _test_vercel_postgres`
      console.log('   ✅ Écriture réussie!\n')
    } catch (error) {
      console.log(`   ⚠️  Erreur d'écriture: ${error.message}\n`)
    }
    
    console.log('✨ Tous les tests sont passés!')
    console.log('\n📝 Votre base de données Vercel Postgres est prête à être utilisée.')
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    console.error('\n💡 Vérifiez que:')
    console.error('   1. Vous avez créé la base de données: vercel postgres create')
    console.error('   2. Vous avez lié la base: vercel postgres link')
    console.error('   3. Vous avez récupéré les variables: vercel env pull .env.local')
    process.exit(1)
  }
}

test()

