/**
 * Script de migration : Renommer la colonne "tags" en "targeted_muscles"
 * 
 * Usage: node scripts/migrate-tags-to-targeted-muscles.js [--dry-run]
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Prefer Neon DATABASE_URL
const envPath = path.join(__dirname, '..', '.env.local')
let databaseUrl = process.env.DATABASE_URL

if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('DATABASE_URL=') && line.includes('neon.tech')) {
        databaseUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '')
        break
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de lire .env.local')
  }
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false
})

const DRY_RUN = process.argv.includes('--dry-run')

async function migrate() {
  console.log('🔄 Migration : tags → targeted_muscles\n')
  
  if (DRY_RUN) {
    console.log('🔍 Mode DRY-RUN (aucune modification)\n')
  }
  
  try {
    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'videos_new' 
        AND column_name IN ('tags', 'targeted_muscles')
    `)
    
    const columns = checkColumn.rows.map(r => r.column_name)
    const hasTags = columns.includes('tags')
    const hasTargetedMuscles = columns.includes('targeted_muscles')
    
    console.log('📊 État actuel:')
    console.log(`   - Colonne "tags": ${hasTags ? '✅ existe' : '❌ n\'existe pas'}`)
    console.log(`   - Colonne "targeted_muscles": ${hasTargetedMuscles ? '✅ existe' : '❌ n\'existe pas'}\n`)
    
    if (!hasTags && !hasTargetedMuscles) {
      console.log('⚠️  Aucune des deux colonnes n\'existe. Création de "targeted_muscles"...\n')
      
      if (!DRY_RUN) {
        await pool.query(`
          ALTER TABLE videos_new 
          ADD COLUMN IF NOT EXISTS targeted_muscles TEXT[]
        `)
        console.log('✅ Colonne "targeted_muscles" créée\n')
      } else {
        console.log('🔍 [DRY-RUN] Colonne "targeted_muscles" serait créée\n')
      }
      
      return
    }
    
    if (hasTargetedMuscles && !hasTags) {
      console.log('✅ La colonne "targeted_muscles" existe déjà. Migration terminée.\n')
      return
    }
    
    if (hasTags && hasTargetedMuscles) {
      console.log('⚠️  Les deux colonnes existent. Copie des données puis suppression de "tags"...\n')
      
      if (!DRY_RUN) {
        // Copy data from tags to targeted_muscles
        await pool.query(`
          UPDATE videos_new 
          SET targeted_muscles = tags 
          WHERE tags IS NOT NULL 
            AND (targeted_muscles IS NULL OR array_length(targeted_muscles, 1) IS NULL)
        `)
        
        // Drop tags column
        await pool.query(`
          ALTER TABLE videos_new 
          DROP COLUMN IF EXISTS tags
        `)
        
        console.log('✅ Données copiées et colonne "tags" supprimée\n')
      } else {
        console.log('🔍 [DRY-RUN] Données seraient copiées et colonne "tags" serait supprimée\n')
      }
      
      return
    }
    
    if (hasTags && !hasTargetedMuscles) {
      console.log('🔄 Renommage de "tags" en "targeted_muscles"...\n')
      
      if (!DRY_RUN) {
        // Rename column
        await pool.query(`
          ALTER TABLE videos_new 
          RENAME COLUMN tags TO targeted_muscles
        `)
        
        console.log('✅ Colonne renommée avec succès\n')
      } else {
        console.log('🔍 [DRY-RUN] Colonne serait renommée\n')
      }
      
      return
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

async function main() {
  try {
    await migrate()
    
    if (DRY_RUN) {
      console.log('💡 Pour appliquer la migration, relancez sans --dry-run')
    } else {
      console.log('✅ Migration terminée!')
    }
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
















