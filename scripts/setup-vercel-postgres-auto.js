/**
 * Script automatisé de configuration Vercel Postgres
 * Utilise le token Vercel pour automatiser la configuration
 * 
 * Usage:
 *   node scripts/setup-vercel-postgres-auto.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const VERCEL_TOKEN = '[REDACTED_VERCEL_TOKEN]'

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      env: { ...process.env, VERCEL_TOKEN }
    })
    return { success: true, output: result }
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr }
  }
}

async function main() {
  console.log('🚀 Configuration automatique de Vercel Postgres\n')
  console.log('='.repeat(50))
  
  // 1. Vérifier Vercel CLI
  console.log('\n1️⃣  Vérification de Vercel CLI...')
  const vercelCheck = exec('which vercel', { silent: true })
  if (!vercelCheck.success) {
    console.error('❌ Vercel CLI n\'est pas installé')
    console.error('   Installez-le avec: npm i -g vercel')
    process.exit(1)
  }
  console.log('✅ Vercel CLI trouvé')
  
  // 2. Vérifier la connexion
  console.log('\n2️⃣  Vérification de la connexion à Vercel...')
  const whoami = exec(`vercel whoami --token="${VERCEL_TOKEN}"`, { silent: true })
  if (!whoami.success) {
    console.error('❌ Token Vercel invalide ou expiré')
    process.exit(1)
  }
  console.log('✅ Connecté à Vercel')
  if (whoami.output) {
    console.log(`   Utilisateur: ${whoami.output.trim()}`)
  }
  
  // 3. Vérifier/Initialiser le projet
  console.log('\n3️⃣  Vérification du projet...')
  const vercelDir = path.join(process.cwd(), '.vercel')
  if (!fs.existsSync(vercelDir)) {
    console.log('📦 Liaison du projet à Vercel...')
    const link = exec(`vercel link --token="${VERCEL_TOKEN}" --yes`, { silent: true })
    if (!link.success) {
      console.error('❌ Impossible de lier le projet')
      console.error('   Exécutez manuellement: vercel link')
      process.exit(1)
    }
    console.log('✅ Projet lié')
  } else {
    console.log('✅ Projet déjà lié')
    try {
      const projectInfo = JSON.parse(fs.readFileSync(path.join(vercelDir, 'project.json'), 'utf-8'))
      console.log(`   Projet: ${projectInfo.name || 'N/A'}`)
    } catch (e) {
      // Ignore
    }
  }
  
  // 4. Lister les bases de données existantes
  console.log('\n4️⃣  Vérification des bases de données existantes...')
  const dbList = exec(`vercel postgres ls --token="${VERCEL_TOKEN}"`, { silent: true })
  if (dbList.success && dbList.output) {
    console.log('📋 Bases de données existantes:')
    console.log(dbList.output)
  }
  
  // 5. Instructions pour créer la base
  console.log('\n5️⃣  Création de la base de données...')
  console.log('⚠️  La création nécessite une interaction manuelle')
  console.log('\n   Exécutez cette commande:')
  console.log(`   vercel postgres create --token="${VERCEL_TOKEN}"`)
  console.log('\n   Ou via le dashboard: https://vercel.com/dashboard')
  console.log('   → Storage → Create Database → Postgres')
  console.log('\n   Nom suggéré: pilates-app-db')
  console.log('   Région suggérée: iad1 (US East)')
  
  // 6. Instructions pour lier
  console.log('\n6️⃣  Liaison de la base de données...')
  console.log('⚠️  La liaison nécessite une interaction manuelle')
  console.log('\n   Exécutez cette commande:')
  console.log(`   vercel postgres link --token="${VERCEL_TOKEN}"`)
  console.log('\n   Sélectionnez votre projet et la base de données')
  
  // 7. Récupérer les variables d'environnement
  console.log('\n7️⃣  Récupération des variables d\'environnement...')
  console.log('   (À exécuter après avoir lié la base)')
  console.log(`   vercel env pull .env.local --token="${VERCEL_TOKEN}"`)
  
  // 8. Installer les dépendances
  console.log('\n8️⃣  Installation des dépendances...')
  if (fs.existsSync('package.json')) {
    const install = exec('npm install @vercel/postgres --save', { silent: true })
    if (install.success) {
      console.log('✅ @vercel/postgres installé')
    } else {
      console.log('⚠️  Installation échouée, exécutez manuellement:')
      console.log('   npm install @vercel/postgres')
    }
  }
  
  // Résumé
  console.log('\n' + '='.repeat(50))
  console.log('📋 RÉSUMÉ')
  console.log('='.repeat(50))
  console.log('\n✅ Étapes automatiques terminées')
  console.log('\n📝 Étapes manuelles restantes:')
  console.log('   1. Créer la base: vercel postgres create --token="..."')
  console.log('   2. Lier la base: vercel postgres link --token="..."')
  console.log('   3. Récupérer les variables: vercel env pull .env.local --token="..."')
  console.log('   4. Tester: npm run test-vercel-postgres')
  console.log('   5. Migrer le schéma SQL dans Vercel Dashboard')
  console.log('   6. Migrer les données: npm run migrate-to-vercel-postgres')
  console.log('\n💡 Toutes les commandes peuvent utiliser le token:')
  console.log(`   --token="${VERCEL_TOKEN}"`)
  console.log('\n✨ Configuration terminée!')
}

main().catch(console.error)

