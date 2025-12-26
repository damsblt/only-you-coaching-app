/**
 * Script pour migrer le schéma SQL vers Neon
 * Exécute le fichier SQL dans Neon via l'API
 * 
 * Usage:
 *   node scripts/migrate-schema-to-neon.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Variable DATABASE_URL manquante')
  console.error('   Ajoutez-la dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function executeSQLFile(filePath) {
  console.log(`\n📄 Lecture du fichier: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`)
    return false
  }
  
  const sqlContent = fs.readFileSync(filePath, 'utf-8')
  
  // Séparer les commandes SQL (séparées par ;)
  // On va exécuter le fichier en entier car Neon supporte les transactions
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`   📊 ${statements.length} commandes SQL trouvées`)
  
  try {
    // Exécuter toutes les commandes dans une transaction
    console.log('   ⏳ Exécution des commandes SQL...')
    
    // Exécuter le fichier complet (Neon supporte les scripts multi-lignes)
    await sql(sqlContent)
    
    console.log('   ✅ Schéma migré avec succès!')
    return true
  } catch (error) {
    console.error(`   ❌ Erreur lors de l'exécution:`, error.message)
    
    // Si erreur, essayer commande par commande
    console.log('   🔄 Tentative commande par commande...')
    let successCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      if (statement.trim().length === 0) continue
      
      try {
        await sql(statement)
        successCount++
      } catch (stmtError) {
        // Ignorer les erreurs "already exists" pour CREATE TABLE IF NOT EXISTS
        if (stmtError.message.includes('already exists') || 
            stmtError.message.includes('duplicate')) {
          successCount++
        } else {
          console.error(`   ⚠️  Erreur: ${stmtError.message.substring(0, 100)}`)
          errorCount++
        }
      }
    }
    
    console.log(`   📊 Résultat: ${successCount} réussies, ${errorCount} erreurs`)
    return errorCount === 0
  }
}

async function verifyTables() {
  console.log('\n🔍 Vérification des tables créées...')
  
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    if (tables.length === 0) {
      console.log('   ⚠️  Aucune table trouvée')
      return false
    }
    
    console.log(`   ✅ ${tables.length} table(s) trouvée(s):`)
    tables.forEach(row => {
      console.log(`      - ${row.table_name}`)
    })
    
    return true
  } catch (error) {
    console.error('   ❌ Erreur lors de la vérification:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Migration du schéma vers Neon PostgreSQL\n')
  console.log('='.repeat(50))
  
  // Fichier SQL principal
  const sqlFile = path.join(__dirname, 'create-all-tables-neon.sql')
  
  // Exécuter le fichier SQL
  const success = await executeSQLFile(sqlFile)
  
  if (!success) {
    console.error('\n❌ Migration échouée')
    console.log('\n💡 Alternative: Copiez-collez le contenu de create-all-tables-neon.sql')
    console.log('   dans Neon SQL Editor: https://console.neon.tech')
    process.exit(1)
  }
  
  // Vérifier les tables
  await verifyTables()
  
  console.log('\n' + '='.repeat(50))
  console.log('✨ Migration du schéma terminée!')
  console.log('\n📝 Prochaines étapes:')
  console.log('   1. Vérifier les tables dans Neon SQL Editor')
  console.log('   2. Migrer les données: npm run migrate-to-neon')
  console.log('   3. Mettre à jour le code pour utiliser lib/db.ts')
  console.log('')
}

main().catch(console.error)

