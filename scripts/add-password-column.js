/**
 * Script pour ajouter la colonne password à la table users
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function addPasswordColumn() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ Variable DATABASE_URL manquante')
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)
    
    console.log('🔧 Ajout de la colonne password à la table users...')
    
    // Ajouter la colonne si elle n'existe pas
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255)
    `
    
    console.log('✅ Colonne password ajoutée avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

addPasswordColumn()





