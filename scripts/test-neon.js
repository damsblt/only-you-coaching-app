/**
 * Script de test de connexion à Neon PostgreSQL
 * 
 * Usage:
 *   node scripts/test-neon.js
 * 
 * Prérequis:
 *   - DATABASE_URL configuré dans .env.local
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function test() {
  console.log('🧪 Test de connexion à Neon PostgreSQL\n')
  
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ Variable DATABASE_URL manquante')
    console.error('   Ajoutez-la dans .env.local:')
    console.error('   DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require')
    process.exit(1)
  }
  
  // Masquer le mot de passe dans l'URL pour l'affichage
  const safeUrl = databaseUrl.replace(/:[^:@]+@/, ':****@')
  console.log(`📍 Connection String: ${safeUrl}\n`)
  
  try {
    const sql = neon(databaseUrl)
    
    // Test 1: Connexion de base
    console.log('1️⃣  Test de connexion...')
    const result = await sql`SELECT NOW() as now, version() as version`
    console.log('   ✅ Connexion réussie!')
    console.log(`   📅 Heure serveur: ${result[0].now}`)
    console.log(`   🗄️  Version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}\n`)
    
    // Test 2: Lister les tables
    console.log('2️⃣  Liste des tables...')
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    if (tables.length === 0) {
      console.log('   ⚠️  Aucune table trouvée')
      console.log('   💡 Exécutez vos scripts SQL dans Neon SQL Editor\n')
    } else {
      console.log(`   ✅ ${tables.length} table(s) trouvée(s):`)
      tables.forEach(row => {
        console.log(`      - ${row.table_name}`)
      })
      console.log()
    }
    
    // Test 3: Compter les enregistrements (si tables existent)
    if (tables.length > 0) {
      console.log('3️⃣  Nombre d\'enregistrements par table...')
      for (const table of tables) {
        try {
          const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`
          console.log(`   📊 ${table.table_name}: ${count[0].count} enregistrement(s)`)
        } catch (error) {
          console.log(`   ⚠️  ${table.table_name}: erreur lors du comptage`)
        }
      }
      console.log()
    }
    
    // Test 4: Test d'écriture (créer une table de test temporaire)
    console.log('4️⃣  Test d\'écriture...')
    try {
      await sql`CREATE TABLE IF NOT EXISTS _test_neon (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())`
      await sql`INSERT INTO _test_neon DEFAULT VALUES RETURNING id`
      await sql`DROP TABLE _test_neon`
      console.log('   ✅ Écriture réussie!\n')
    } catch (error) {
      console.log(`   ⚠️  Erreur d'écriture: ${error.message}\n`)
    }
    
    console.log('✨ Tous les tests sont passés!')
    console.log('\n📝 Votre base de données Neon est prête à être utilisée.')
    console.log('\n💡 Prochaines étapes:')
    console.log('   1. Migrer le schéma SQL dans Neon SQL Editor')
    console.log('   2. Migrer les données: npm run migrate-to-neon')
    console.log('   3. Mettre à jour le code pour utiliser lib/db.ts')
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    console.error('\n💡 Vérifiez que:')
    console.error('   1. DATABASE_URL est correct dans .env.local')
    console.error('   2. Le projet Neon est actif')
    console.error('   3. sslmode=require est dans l\'URL')
    console.error('   4. Les dépendances sont installées: npm install @neondatabase/serverless ws')
    process.exit(1)
  }
}

test()

