/**
 * Script pour exécuter le SQL d'ajout de la colonne orderIndex
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const ws = require('ws')
const fs = require('fs')

// Configure Neon for Node.js environment
const { neonConfig } = require('@neondatabase/serverless')
neonConfig.webSocketConstructor = ws

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function runSQL() {
  try {
    console.log('🔄 Vérification et ajout de la colonne orderIndex...\n')
    
    // Vérifier si la colonne existe déjà
    const checkResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audios' 
      AND column_name = 'orderIndex'
    `
    
    if (checkResult && checkResult.length > 0) {
      console.log('✅ La colonne orderIndex existe déjà dans la table audios')
      console.log(`   Type: ${checkResult[0].data_type}`)
      return
    }
    
    // Ajouter la colonne si elle n'existe pas
    console.log('📝 Ajout de la colonne orderIndex...')
    await sql`
      ALTER TABLE audios ADD COLUMN IF NOT EXISTS "orderIndex" INTEGER
    `
    
    // Créer l'index
    console.log('📝 Création de l\'index...')
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audios_order_index ON audios("orderIndex")
    `
    
    console.log('✅ La colonne orderIndex a été ajoutée avec succès!')
    
    // Vérifier que la colonne existe maintenant
    const verifyResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audios' 
      AND column_name = 'orderIndex'
    `
    
    if (verifyResult && verifyResult.length > 0) {
      console.log('✅ Vérification: La colonne orderIndex existe bien dans la table audios')
      console.log(`   Type: ${verifyResult[0].data_type}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script SQL:', error.message)
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('ℹ️  La colonne existe peut-être déjà, vérification...')
      
      // Vérifier si la colonne existe
      try {
        const checkResult = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'audios' 
          AND column_name = 'orderIndex'
        `
        if (checkResult && checkResult.length > 0) {
          console.log('✅ La colonne orderIndex existe déjà, tout est OK!')
        } else {
          console.error('❌ La colonne n\'existe pas et n\'a pas pu être créée')
          process.exit(1)
        }
      } catch (checkError) {
        console.error('❌ Erreur lors de la vérification:', checkError.message)
        process.exit(1)
      }
    } else {
      process.exit(1)
    }
  }
}

runSQL()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
