/**
 * Script pour définir un mot de passe pour un utilisateur existant
 * Usage: node scripts/set-user-password.js <email> <password>
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const bcrypt = require('bcryptjs')

async function setUserPassword(email, password) {
  if (!email || !password) {
    console.error('❌ Usage: node scripts/set-user-password.js <email> <password>')
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ Variable DATABASE_URL manquante')
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)
    
    // Vérifier si l'utilisateur existe
    const users = await sql`SELECT id, email, name FROM users WHERE email = ${email}`
    
    if (users.length === 0) {
      console.error(`❌ Utilisateur avec l'email ${email} introuvable`)
      process.exit(1)
    }

    const user = users[0]
    console.log(`👤 Utilisateur trouvé: ${user.name} (${user.email})`)

    // Hasher le mot de passe
    console.log('🔐 Hachage du mot de passe...')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe
    await sql`UPDATE users SET password = ${hashedPassword}, updated_at = NOW() WHERE id = ${user.id}`

    console.log('✅ Mot de passe défini avec succès!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Mot de passe: ${password}`)
    console.log('\n⚠️  Note: Conservez ce mot de passe en sécurité!')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

const email = process.argv[2]
const password = process.argv[3]

setUserPassword(email, password)

