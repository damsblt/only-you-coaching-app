/**
 * Script pour ajouter la colonne exo_title à la table videos_new
 * 
 * Usage: node scripts/add-exo-title-column.js [--dry-run]
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

async function addColumn() {
  console.log('🔄 Ajout de la colonne exo_title...\n')
  
  if (DRY_RUN) {
    console.log('🔍 Mode DRY-RUN (aucune modification)\n')
  }
  
  try {
    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'videos_new' 
        AND column_name = 'exo_title'
    `)
    
    const hasColumn = checkColumn.rows.length > 0
    
    console.log('📊 État actuel:')
    console.log(`   - Colonne "exo_title": ${hasColumn ? '✅ existe' : '❌ n\'existe pas'}\n`)
    
    if (hasColumn) {
      console.log('✅ La colonne "exo_title" existe déjà. Aucune action nécessaire.\n')
      return
    }
    
    console.log('🔄 Ajout de la colonne "exo_title"...\n')
    
    if (!DRY_RUN) {
      await pool.query(`
        ALTER TABLE videos_new 
        ADD COLUMN exo_title TEXT
      `)
      
      console.log('✅ Colonne "exo_title" ajoutée avec succès\n')
    } else {
      console.log('🔍 [DRY-RUN] Colonne serait ajoutée\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne:', error)
    throw error
  }
}

async function main() {
  try {
    await addColumn()
    
    if (DRY_RUN) {
      console.log('💡 Pour appliquer les changements, relancez sans --dry-run')
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















