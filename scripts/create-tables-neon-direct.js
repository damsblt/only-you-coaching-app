/**
 * Script pour créer les tables dans Neon directement
 * Utilise le client @neondatabase/serverless
 * 
 * Usage:
 *   node scripts/create-tables-neon-direct.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Variable DATABASE_URL manquante')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function executeSQLStatements() {
  console.log('🚀 Création des tables dans Neon PostgreSQL\n')
  console.log('='.repeat(50))
  
  const sqlFile = path.join(__dirname, 'create-all-tables-neon.sql')
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`)
    process.exit(1)
  }
  
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8')
  console.log(`📄 Fichier SQL: ${sqlFile}`)
  console.log(`📊 Taille: ${sqlContent.length} caractères\n`)
  
  // Séparer les commandes SQL
  // On va exécuter chaque commande séparément pour mieux gérer les erreurs
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Filtrer les commentaires et lignes vides
      const trimmed = s.trim()
      return trimmed.length > 0 && 
             !trimmed.startsWith('--') && 
             trimmed !== '$$' &&
             !trimmed.startsWith('COMMENT ON')
    })
  
  console.log(`📋 ${statements.length} commandes SQL à exécuter\n`)
  
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    
    // Ignorer les fonctions et triggers qui sont dans des blocs $$
    if (statement.includes('$$') || statement.length < 10) {
      skippedCount++
      continue
    }
    
    try {
      // Exécuter avec template literal
      await sql(statement)
      successCount++
      
      // Afficher le progrès pour les commandes importantes
      if (statement.toUpperCase().includes('CREATE TABLE') || 
          statement.toUpperCase().includes('CREATE INDEX') ||
          statement.toUpperCase().includes('CREATE EXTENSION')) {
        const tableMatch = statement.match(/CREATE\s+(?:TABLE|INDEX|EXTENSION)\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?(\w+)/i)
        if (tableMatch) {
          console.log(`   ✅ ${tableMatch[1]}`)
        }
      }
    } catch (error) {
      // Ignorer les erreurs "already exists" pour CREATE IF NOT EXISTS
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('does not exist')) {
        skippedCount++
      } else {
        console.error(`   ❌ Erreur ligne ${i + 1}: ${error.message.substring(0, 100)}`)
        errorCount++
      }
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 Résumé:')
  console.log(`   ✅ ${successCount} commandes réussies`)
  console.log(`   ⏭️  ${skippedCount} commandes ignorées (déjà existantes)`)
  if (errorCount > 0) {
    console.log(`   ❌ ${errorCount} erreurs`)
  }
  
  // Vérifier les tables créées
  console.log('\n🔍 Vérification des tables...')
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
    } else {
      console.log(`   ✅ ${tables.length} table(s) trouvée(s):`)
      tables.forEach(row => {
        console.log(`      - ${row.table_name}`)
      })
    }
  } catch (error) {
    console.error('   ❌ Erreur lors de la vérification:', error.message)
  }
  
  console.log('\n✨ Migration terminée!')
  
  if (errorCount === 0) {
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Migrer les données: npm run migrate-to-neon')
    console.log('   2. Mettre à jour le code pour utiliser lib/db.ts')
  }
}

executeSQLStatements().catch(console.error)

