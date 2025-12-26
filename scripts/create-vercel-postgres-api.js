/**
 * Script pour créer une base de données Vercel Postgres via l'API
 * 
 * Usage:
 *   node scripts/create-vercel-postgres-api.js
 */

const https = require('https')

const VERCEL_TOKEN = '[REDACTED_VERCEL_TOKEN]'
const PROJECT_ID = 'prj_YYFFuzPFWwTpKiOazZtoAuCAjK4U'
const DB_NAME = 'pilates-app-db'
const REGION = 'iad1' // US East

async function createPostgresDatabase() {
  console.log('🚀 Création de la base de données Vercel Postgres via API\n')
  console.log(`📋 Nom: ${DB_NAME}`)
  console.log(`📍 Région: ${REGION}`)
  console.log(`🔗 Projet: ${PROJECT_ID}\n`)

  const postData = JSON.stringify({
    name: DB_NAME,
    region: REGION,
    projectId: PROJECT_ID
  })

  const options = {
    hostname: 'api.vercel.com',
    port: 443,
    path: '/v1/storage',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data)
            resolve(result)
          } catch (e) {
            resolve(data)
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

async function main() {
  try {
    console.log('⚠️  Note: La création de base de données Postgres via API')
    console.log('   nécessite une version récente de Vercel CLI ou le dashboard.\n')
    console.log('📝 Méthode recommandée:\n')
    console.log('   1. Allez sur https://vercel.com/dashboard')
    console.log(`   2. Sélectionnez le projet: only-you-coaching`)
    console.log('   3. Onglet "Storage"')
    console.log('   4. Cliquez "Create Database"')
    console.log('   5. Sélectionnez "Postgres"')
    console.log(`   6. Nom: ${DB_NAME}`)
    console.log(`   7. Région: ${REGION}`)
    console.log('   8. Cliquez "Create"\n')
    
    console.log('💡 Alternative: Mettre à jour Vercel CLI')
    console.log('   npm i -g vercel@latest\n')
    
    // Tentative via API (peut ne pas fonctionner selon les permissions)
    console.log('🔄 Tentative via API...\n')
    const result = await createPostgresDatabase()
    console.log('✅ Base de données créée!')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.log('\n💡 Utilisez le dashboard Vercel pour créer la base de données')
    console.log('   https://vercel.com/dashboard')
  }
}

main()

