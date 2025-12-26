/**
 * Script de migration des données de Supabase vers Neon (Version corrigée)
 * Utilise sql.query() pour la compatibilité avec la nouvelle API Neon
 * 
 * Usage:
 *   node scripts/migrate-data-neon-fixed.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { neon } = require('@neondatabase/serverless')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const neonUrl = process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes')
  console.error('   NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis')
  process.exit(1)
}

if (!neonUrl) {
  console.error('❌ Variable Neon manquante')
  console.error('   DATABASE_URL ou STORAGE_DATABASE_URL est requis')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const sql = neon(neonUrl)

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
    
    // Insérer les données dans Neon
    let inserted = 0
    let errors = 0
    
    for (const row of data) {
      try {
        const keys = Object.keys(row)
        const values = Object.values(row)
        
        // Construire la requête INSERT avec ON CONFLICT
        // Utiliser sql.query() avec des placeholders
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
        const setClause = keys.filter(k => k !== 'id').map((k, i) => `"${k}" = $${keys.length + i + 1}`).join(', ')
        
        const query = `
          INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET ${setClause}
        `
        
        // Utiliser sql.query() au lieu de sql()
        const result = await sql.query(query, [...values, ...values.filter((_, i) => keys[i] !== 'id')])
        inserted++
      } catch (insertError) {
        // Ignorer les erreurs de doublons
        if (insertError.message.includes('duplicate') || insertError.message.includes('already exists')) {
          inserted++ // Compter comme succès
        } else {
          console.error(`   ⚠️  Erreur ligne ${inserted + errors + 1}: ${insertError.message.substring(0, 80)}`)
          errors++
        }
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
    const result = await sql.query(`SELECT COUNT(*) as count FROM "${tableName}"`, [])
    const count = result[0]?.count || 0
    return parseInt(count)
  } catch (error) {
    return 0
  }
}

async function main() {
  console.log('🚀 Migration des données Supabase → Neon\n')
  console.log('📋 Tables à migrer:', TABLES.join(', '))
  console.log('📍 Source: Supabase')
  console.log('📍 Destination: Neon\n')
  
  const results = {}
  
  for (const table of TABLES) {
    const result = await migrateTable(table)
    results[table] = result
    
    // Vérifier la migration
    const neonCount = await verifyMigration(table)
    console.log(`   📊 Vérification: ${neonCount} enregistrements dans Neon`)
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
}

main().catch(console.error)

