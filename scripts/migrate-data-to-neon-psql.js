/**
 * Script de migration des données de Supabase vers Neon via psql
 * Utilise psql pour copier les données directement
 * 
 * Usage:
 *   node scripts/migrate-data-to-neon-psql.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

async function migrateTableWithPsql(tableName) {
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
    
    // Créer un fichier CSV temporaire
    const csvFile = path.join(__dirname, `temp_${tableName}.csv`)
    const csvContent = data.map(row => {
      // Convertir chaque ligne en CSV
      const values = Object.values(row).map(val => {
        if (val === null || val === undefined) return '\\N'
        if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""')
        return String(val).replace(/"/g, '""').replace(/\n/g, '\\n')
      })
      return values.map(v => `"${v}"`).join(',')
    })
    
    // En-tête CSV
    const headers = Object.keys(data[0]).map(h => `"${h}"`).join(',')
    fs.writeFileSync(csvFile, [headers, ...csvContent].join('\n'))
    
    // Générer le script SQL pour COPY
    const columns = Object.keys(data[0]).map(col => `"${col}"`).join(', ')
    const sqlFile = path.join(__dirname, `temp_${tableName}_import.sql`)
    const sqlContent = `
      \\copy ${tableName} (${columns}) FROM '${csvFile}' WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"', ESCAPE '"', NULL '\\N');
    `
    fs.writeFileSync(sqlFile, sqlContent)
    
    // Exécuter via psql
    try {
      execSync(`psql "${neonUrl}" -f "${sqlFile}"`, { 
        stdio: 'inherit',
        encoding: 'utf-8'
      })
      console.log(`   ✅ ${data.length} enregistrements migrés`)
      
      // Nettoyer les fichiers temporaires
      fs.unlinkSync(csvFile)
      fs.unlinkSync(sqlFile)
      
      return { success: true, count: data.length }
    } catch (psqlError) {
      console.error(`   ❌ Erreur psql: ${psqlError.message}`)
      
      // Nettoyer les fichiers temporaires
      if (fs.existsSync(csvFile)) fs.unlinkSync(csvFile)
      if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile)
      
      return { success: false, count: 0 }
    }
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`)
    return { success: false, count: 0 }
  }
}

async function main() {
  console.log('🚀 Migration des données Supabase → Neon via psql\n')
  console.log('📋 Tables à migrer:', TABLES.join(', '))
  
  const results = {}
  
  for (const table of TABLES) {
    const result = await migrateTableWithPsql(table)
    results[table] = result
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

