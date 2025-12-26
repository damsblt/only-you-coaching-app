/**
 * Script pour exécuter du SQL dans Neon via l'API
 * Utilise le token Neon pour exécuter des requêtes SQL
 * 
 * Usage:
 *   node scripts/execute-sql-neon-cli.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const https = require('https')

const NEON_API_KEY = 'napi_ucev18yboa60xdslc8d4uil0dw5u48ja0amm2itq8t0oq0xn76sgot0f6yavv2jl'
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Variable DATABASE_URL manquante')
  process.exit(1)
}

// Extraire le project ID et branch ID de la connection string
// Format: postgresql://user:pass@ep-xxx-xxx-pooler.region.aws.neon.tech/dbname
const urlMatch = DATABASE_URL.match(/@ep-([^-]+)-([^-]+)-pooler\.([^.]+)\.aws\.neon\.tech\/([^?]+)/)
if (!urlMatch) {
  console.error('❌ Impossible de parser DATABASE_URL')
  process.exit(1)
}

const [, projectId, branchId, region, database] = urlMatch

async function executeSQL(sqlContent) {
  const endpoint = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/endpoints`
  
  // Pour exécuter du SQL, on doit utiliser l'API Neon
  // Mais l'API REST ne supporte pas directement l'exécution SQL
  // Il faut utiliser la connection string avec le client @neondatabase/serverless
  
  console.log('⚠️  L\'API Neon REST ne supporte pas directement l\'exécution SQL')
  console.log('   Utilisation du client @neondatabase/serverless à la place...\n')
  
  const { neon } = require('@neondatabase/serverless')
  const sql = neon(DATABASE_URL)
  
  try {
    // Exécuter le SQL
    await sql(sqlContent)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Exécution du schéma SQL dans Neon\n')
  
  const sqlFile = path.join(__dirname, 'create-all-tables-neon.sql')
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier non trouvé: ${sqlFile}`)
    process.exit(1)
  }
  
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8')
  console.log(`📄 Fichier SQL chargé: ${sqlFile}`)
  console.log(`📊 Taille: ${sqlContent.length} caractères\n`)
  
  console.log('⏳ Exécution du SQL...')
  const result = await executeSQL(sqlContent)
  
  if (result.success) {
    console.log('✅ Schéma créé avec succès!')
    
    // Vérifier les tables
    console.log('\n🔍 Vérification des tables...')
    const { neon } = require('@neondatabase/serverless')
    const sql = neon(DATABASE_URL)
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log(`✅ ${tables.length} table(s) trouvée(s):`)
    tables.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })
  } else {
    console.error('❌ Erreur:', result.error)
    console.log('\n💡 Alternative: Utilisez Neon SQL Editor')
    console.log('   https://console.neon.tech')
  }
}

main().catch(console.error)

