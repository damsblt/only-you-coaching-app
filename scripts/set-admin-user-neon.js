#!/usr/bin/env node

/**
 * Script pour définir un utilisateur comme admin dans Neon PostgreSQL
 * Usage: node scripts/set-admin-user-neon.js <email>
 * 
 * Met à jour l'utilisateur avec:
 * - Role: ADMIN
 * - Accès complet à tout le contenu
 */

const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Variable DATABASE_URL ou STORAGE_DATABASE_URL manquante')
  console.error('   Ajoutez-la dans .env.local:')
  console.error('   DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require')
  process.exit(1)
}

// Email de l'utilisateur à promouvoir admin
const userEmail = process.argv[2] || 'damien.balet@me.com'

async function setAdminUser() {
  console.log('👤 Promotion de l\'utilisateur en admin dans Neon...')
  console.log(`   Email: ${userEmail}`)
  console.log('')
  
  try {
    const sql = neon(databaseUrl)
    
    // 1. Vérifier si l'utilisateur existe
    console.log('🔍 Recherche de l\'utilisateur...')
    const existingUsers = await sql`
      SELECT id, email, name, role, created_at, updated_at
      FROM users
      WHERE email = ${userEmail}
    `
    
    if (!existingUsers || existingUsers.length === 0) {
      console.error(`❌ Utilisateur ${userEmail} non trouvé dans la table users`)
      console.error('\n💡 Vérifiez que:')
      console.error('   1. L\'utilisateur existe dans la table users')
      console.error('   2. L\'email est correct')
      console.error('   3. L\'utilisateur a été créé via l\'authentification')
      process.exit(1)
    }
    
    const user = existingUsers[0]
    console.log(`   ✅ Utilisateur trouvé (ID: ${user.id})`)
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   👤 Nom: ${user.name || 'N/A'}`)
    console.log(`   🔑 Rôle actuel: ${user.role || 'USER'}`)
    
    // 2. Mettre à jour le rôle à ADMIN
    if (user.role === 'ADMIN') {
      console.log('\n   ℹ️  L\'utilisateur est déjà admin!')
      console.log('\n✅ Aucune modification nécessaire')
      return
    }
    
    console.log('\n   📝 Mise à jour du rôle à ADMIN...')
    const now = new Date().toISOString()
    
    const result = await sql`
      UPDATE users
      SET 
        role = 'ADMIN',
        updated_at = ${now}
      WHERE email = ${userEmail}
      RETURNING id, email, name, role, updated_at
    `
    
    if (!result || result.length === 0) {
      console.error('   ❌ Erreur lors de la mise à jour')
      process.exit(1)
    }
    
    const updatedUser = result[0]
    console.log('   ✅ Rôle mis à jour avec succès!')
    console.log('\n📊 Utilisateur admin:')
    console.log(`   ID: ${updatedUser.id}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Role: ${updatedUser.role}`)
    console.log(`   Nom: ${updatedUser.name || 'N/A'}`)
    console.log(`   Mis à jour: ${updatedUser.updated_at}`)
    console.log('\n✅ Utilisateur promu admin avec succès!')
    console.log('\n🔑 L\'utilisateur a maintenant:')
    console.log('   ✅ Accès complet à tous les contenus')
    console.log('   ✅ Accès au dashboard admin')
    console.log('   ✅ Permissions de gestion sur tous les utilisateurs')
    console.log('   ✅ Accès à toutes les vidéos (publiées et non publiées)')
    console.log('   ✅ Accès à tous les programmes')
    console.log('   ✅ Accès à toutes les recettes')
    console.log('   ✅ Accès à tous les audios')
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la promotion de l\'utilisateur:', error)
    console.error('   Message:', error.message)
    if (error.details) {
      console.error('   Détails:', error.details)
    }
    process.exit(1)
  }
}

// Exécuter le script
setAdminUser().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
















