/**
 * Script pour créer les utilisateurs autorisés pour la page en construction
 * Usage: node scripts/create-construction-users.js
 */

require('dotenv').config({ path: '.env.local' })
const bcrypt = require('bcryptjs')
const { neon } = require('@neondatabase/serverless')
const { randomUUID } = require('crypto')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas défini dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// Utilisateurs à créer
const USERS = [
  {
    email: 'blmarieline@gmail.com',
    name: 'Marie-Line',
    full_name: 'Marie-Line',
    password: 'ChangeMe123!', // ⚠️ À CHANGER après la première connexion
    role: 'ADMIN'
  },
  {
    email: 'damien.balet@me.com',
    name: 'Damien',
    full_name: 'Damien Balet',
    password: 'ChangeMe123!', // ⚠️ À CHANGER après la première connexion
    role: 'ADMIN'
  }
]

async function createUsers() {
  console.log('🚀 Création des utilisateurs pour la page en construction...\n')

  // Vérifier et ajouter la colonne password si nécessaire
  try {
    console.log('🔧 Vérification de la colonne password...')
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255)
    `
    console.log('✅ Colonne password vérifiée/ajoutée\n')
  } catch (error) {
    console.error('⚠️  Erreur lors de la vérification de la colonne password:', error.message)
    console.log('   Continuez quand même...\n')
  }

  for (const userData of USERS) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await sql`
        SELECT id, email FROM users WHERE email = ${userData.email.toLowerCase()}
      `

      if (existingUser && existingUser.length > 0) {
        console.log(`⚠️  L'utilisateur ${userData.email} existe déjà.`)
        
        // Vérifier si un mot de passe existe
        const userWithPassword = await sql`
          SELECT password FROM users WHERE email = ${userData.email.toLowerCase()}
        `
        
        if (userWithPassword && userWithPassword.length > 0 && userWithPassword[0].password) {
          console.log(`   ✅ L'utilisateur a déjà un mot de passe défini.`)
          console.log(`   💡 Pour changer le mot de passe, utilisez: UPDATE users SET password = $1 WHERE email = $2\n`)
        } else {
          // Ajouter le mot de passe
          const hashedPassword = await bcrypt.hash(userData.password, 10)
          await sql`
            UPDATE users 
            SET password = ${hashedPassword},
                updated_at = NOW()
            WHERE email = ${userData.email.toLowerCase()}
          `
          console.log(`   ✅ Mot de passe ajouté pour ${userData.email}`)
          console.log(`   🔑 Mot de passe temporaire: ${userData.password}`)
          console.log(`   ⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!\n`)
        }
      } else {
        // Créer un nouvel utilisateur
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        const userId = randomUUID()
        
        await sql`
          INSERT INTO users (
            id, email, name, full_name, password, role, 
            planid, created_at, updated_at
          ) VALUES (
            ${userId},
            ${userData.email.toLowerCase()},
            ${userData.name},
            ${userData.full_name},
            ${hashedPassword},
            ${userData.role},
            'essentiel',
            NOW(),
            NOW()
          )
        `
        
        console.log(`✅ Utilisateur créé: ${userData.email}`)
        console.log(`   🔑 Mot de passe temporaire: ${userData.password}`)
        console.log(`   ⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!\n`)
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création de ${userData.email}:`, error.message)
      console.error('   Détails:', error)
      console.log('')
    }
  }

  console.log('✅ Processus terminé!')
  console.log('\n📝 Prochaines étapes:')
  console.log('   1. Connectez-vous à /construction/login')
  console.log('   2. Utilisez votre email et le mot de passe temporaire')
  console.log('   3. Changez votre mot de passe dès que possible\n')
}

// Exécuter le script
createUsers()
  .then(() => {
    console.log('✨ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
