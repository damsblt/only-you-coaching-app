/**
 * Script de migration des données de Supabase vers Neon
 * Utilise les clients Supabase et Neon pour une migration fiable
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { neon } = require('@neondatabase/serverless')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const neonUrl = process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes')
  process.exit(1)
}

if (!neonUrl) {
  console.error('❌ Variable Neon manquante (STORAGE_DATABASE_URL)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const sql = neon(neonUrl)

const TABLES = ['users', 'videos_new', 'recipes', 'audios', 'subscriptions']

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
    
    // Récupérer les colonnes existantes dans Neon
    const neonColumnsResult = await sql.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
    `, [tableName])
    
    const neonColumns = (neonColumnsResult.rows || neonColumnsResult).map(r => r.column_name)
    
    for (const row of data) {
      try {
        // Filtrer les colonnes pour ne garder que celles qui existent dans Neon
        const filteredRow = {}
        for (const [key, value] of Object.entries(row)) {
          if (neonColumns.includes(key)) {
            let processedValue = value
            
            // Traitement spécial selon le type de colonne
            if (value !== null && value !== undefined) {
              // Pour les colonnes JSON, s'assurer que c'est un JSON valide
              if (typeof value === 'string' && (key.includes('json') || key.includes('info') || key.includes('data') || key.includes('nutrition'))) {
                try {
                  // Si c'est déjà un JSON valide, le parser et le re-sérialiser
                  JSON.parse(value)
                  processedValue = value
                } catch {
                  // Si ce n'est pas un JSON valide, essayer de le convertir
                  try {
                    processedValue = JSON.stringify(value)
                  } catch {
                    processedValue = null
                  }
                }
              } else if (typeof value === 'object' && value !== null && (key.includes('json') || key.includes('info') || key.includes('data') || key.includes('nutrition'))) {
                // Si c'est déjà un objet, le sérialiser en JSON
                try {
                  processedValue = JSON.stringify(value)
                } catch {
                  processedValue = null
                }
              }
              
              // Pour les colonnes difficulty, normaliser les valeurs
              if (key === 'difficulty') {
                if (value === null || value === undefined || value === '') {
                  // Valeur par défaut selon la table
                  if (tableName === 'recipes') {
                    processedValue = 'easy' // Valeur par défaut pour recipes (easy, medium, hard)
                  } else {
                    processedValue = 'debutant' // Valeur par défaut pour videos (debutant, intermediaire, avance)
                  }
                } else if (typeof value === 'string') {
                  const normalized = value.toLowerCase()
                  // Mapper les valeurs communes selon la table
                  if (tableName === 'recipes') {
                    // Recipes utilise: easy, medium, hard (en anglais)
                    if (normalized === 'medium' || normalized === 'moyen' || normalized === 'intermediate') {
                      processedValue = 'medium'
                    } else if (normalized === 'easy' || normalized === 'facile' || normalized === 'beginner') {
                      processedValue = 'easy'
                    } else if (normalized === 'hard' || normalized === 'difficile' || normalized === 'advanced' || normalized === 'avance') {
                      processedValue = 'hard'
                    } else if (!['easy', 'medium', 'hard'].includes(normalized)) {
                      // Mapper les valeurs invalides
                      if (normalized.includes('debut') || normalized.includes('begin') || normalized.includes('easy') || normalized.includes('facile')) {
                        processedValue = 'easy'
                      } else if (normalized.includes('inter') || normalized.includes('medium') || normalized.includes('moyen')) {
                        processedValue = 'medium'
                      } else if (normalized.includes('avanc') || normalized.includes('expert') || normalized.includes('hard') || normalized.includes('difficile')) {
                        processedValue = 'hard'
                      } else {
                        processedValue = 'easy' // Valeur par défaut
                      }
                    } else {
                      processedValue = normalized
                    }
                  } else {
                    // Videos utilise: debutant, intermediaire, avance
                    if (normalized === 'medium' || normalized === 'moyen' || normalized === 'intermediate') {
                      processedValue = 'intermediaire'
                    } else if (normalized === 'easy' || normalized === 'facile' || normalized === 'beginner') {
                      processedValue = 'debutant'
                    } else if (normalized === 'hard' || normalized === 'difficile' || normalized === 'advanced') {
                      processedValue = 'avance'
                    } else if (!['debutant', 'intermediaire', 'avance', 'beginner', 'intermediate', 'advanced'].includes(normalized)) {
                      // Mapper les valeurs invalides
                      if (normalized.includes('debut') || normalized.includes('begin') || normalized.includes('easy')) {
                        processedValue = 'debutant'
                      } else if (normalized.includes('inter') || normalized.includes('medium')) {
                        processedValue = 'intermediaire'
                      } else if (normalized.includes('avanc') || normalized.includes('expert') || normalized.includes('hard')) {
                        processedValue = 'avance'
                      } else {
                        processedValue = 'debutant'
                      }
                    } else {
                      // Normaliser les valeurs valides
                      if (normalized === 'beginner') processedValue = 'debutant'
                      else if (normalized === 'intermediate') processedValue = 'intermediaire'
                      else if (normalized === 'advanced') processedValue = 'avance'
                      else processedValue = normalized
                    }
                  }
                }
              }
              
              // Pour les IDs non-UUID dans audios, générer un UUID
              if (key === 'id' && tableName === 'audios' && typeof value === 'string' && !value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                // Générer un UUID v4
                const { randomUUID } = require('crypto')
                processedValue = randomUUID()
              }
              
              // Pour les colonnes category dans audios, normaliser les valeurs
              if (key === 'category' && tableName === 'audios' && typeof value === 'string') {
                const normalized = value.toLowerCase()
                if (!['meditation', 'coaching_mental', 'meditation_guidee'].includes(normalized)) {
                  // Mapper les valeurs invalides
                  if (normalized.includes('meditation')) {
                    processedValue = 'meditation'
                  } else if (normalized.includes('coaching') || normalized.includes('mental')) {
                    processedValue = 'coaching_mental'
                  } else {
                    processedValue = 'meditation_guidee' // Valeur par défaut
                  }
                } else {
                  processedValue = normalized
                }
              }
            }
            
            filteredRow[key] = processedValue
          }
        }
        
        const keys = Object.keys(filteredRow)
        const values = Object.values(filteredRow)
        
        if (keys.length === 0) {
          console.error(`   ⚠️  Aucune colonne valide pour l'enregistrement ${row.id || 'sans ID'}`)
          errors++
          continue
        }
        
        // Construire la requête INSERT avec ON CONFLICT
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
        const columns = keys.map(k => `"${k}"`).join(', ')
        
        // Pour ON CONFLICT, on a besoin de la clé primaire (généralement 'id')
        const conflictColumns = keys.filter(k => k === 'id' || k.toLowerCase() === 'id')
        const conflictClause = conflictColumns.length > 0 
          ? `ON CONFLICT (${conflictColumns.map(k => `"${k}"`).join(', ')}) DO NOTHING`
          : ''
        
        const query = `
          INSERT INTO "${tableName}" (${columns})
          VALUES (${placeholders})
          ${conflictClause}
        `
        
        // Convertir les valeurs JSON en string si nécessaire
        const processedValues = values.map((val, idx) => {
          const key = keys[idx]
          // Si la colonne est de type JSON et la valeur est un objet/array, la sérialiser
          if (val !== null && val !== undefined && typeof val === 'object') {
            try {
              return JSON.stringify(val)
            } catch {
              return val
            }
          }
          return val
        })
        
        await sql.query(query, processedValues)
        inserted++
      } catch (insertError) {
        // Ignorer les erreurs de doublons
        if (insertError.message.includes('duplicate') || 
            insertError.message.includes('already exists') ||
            insertError.message.includes('violates unique constraint')) {
          inserted++ // Compter comme succès
        } else {
          console.error(`   ⚠️  Erreur ligne ${inserted + errors + 1}: ${insertError.message.substring(0, 100)}`)
          errors++
        }
      }
    }
    
    console.log(`   ✅ ${inserted} enregistrements migrés`)
    if (errors > 0) {
      console.log(`   ⚠️  ${errors} erreurs`)
    }
    
    // Vérifier le résultat
    const result = await sql.query(`SELECT COUNT(*) as count FROM "${tableName}"`, [])
    const neonCount = parseInt(result[0]?.count || result.count || 0)
    console.log(`   📊 Vérification: ${neonCount} enregistrements dans Neon`)
    
    return { success: true, count: inserted }
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`)
    return { success: false, count: 0 }
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

