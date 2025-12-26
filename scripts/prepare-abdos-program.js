/**
 * Script de préparation pour le programme ABDOS
 * Vérifie que tout est prêt avant l'upload des vidéos
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Vérification de la préparation pour le programme ABDOS...\n')

// 1. Vérifier les variables d'environnement
console.log('1️⃣  Vérification des variables d\'environnement...')
const requiredVars = [
  'DATABASE_URL',
  'AWS_S3_BUCKET_NAME',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY'
]

let allVarsOk = true
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}`)
  } else {
    console.log(`   ❌ ${varName} manquant`)
    allVarsOk = false
  }
})

if (!allVarsOk) {
  console.log('\n⚠️  Certaines variables d\'environnement sont manquantes')
  console.log('   Vérifiez votre fichier .env.local\n')
}

// 2. Vérifier la configuration d'ordre
console.log('\n2️⃣  Vérification de la configuration d\'ordre...')
const fs = require('fs')
const path = require('path')
const programOrdersPath = path.join(__dirname, '..', 'lib', 'program-orders.ts')

try {
  const content = fs.readFileSync(programOrdersPath, 'utf8')
  if (content.includes('ABDOS_PROGRAM_ORDER')) {
    const orderMatch = content.match(/export const ABDOS_PROGRAM_ORDER[^}]+}/s)
    if (orderMatch && orderMatch[0].includes('TODO')) {
      console.log('   ⚠️  ABDOS_PROGRAM_ORDER existe mais n\'est pas complété (contient TODO)')
      console.log('   💡 Complétez-le après avoir identifié les vidéos')
    } else if (orderMatch && !orderMatch[0].includes('TODO')) {
      const orderCount = (orderMatch[0].match(/:\s*'[^']+'/g) || []).length
      console.log(`   ✅ ABDOS_PROGRAM_ORDER configuré avec ${orderCount} vidéo(s)`)
    } else {
      console.log('   ⚠️  ABDOS_PROGRAM_ORDER existe mais est vide')
    }
  } else {
    console.log('   ❌ ABDOS_PROGRAM_ORDER non trouvé')
  }
} catch (error) {
  console.log('   ❌ Erreur lors de la lecture de lib/program-orders.ts')
}

// 3. Vérifier que la Lambda est configurée
console.log('\n3️⃣  Vérification de la Lambda...')
console.log('   💡 Pour vérifier la Lambda, exécutez:')
console.log('      aws lambda get-function-configuration --function-name only-you-coaching-thumbnail-generator')

// 4. Instructions
console.log('\n📋 Instructions pour uploader les vidéos ABDOS:\n')
console.log('1. Nommez les vidéos avec le format: {numero}. {titre}.mp4')
console.log('   Exemple: "12. Crunch classique.mp4"')
console.log('')
console.log('2. Upload dans S3:')
console.log('   Chemin: Video/programmes-predefinis/abdos/{numero}. {titre}.mp4')
console.log('')
console.log('3. Synchroniser dans Neon:')
console.log('   curl -X POST http://localhost:3000/api/videos/sync')
console.log('')
console.log('4. Identifier les vidéos:')
console.log('   node scripts/identify-program-videos.js abdos')
console.log('')
console.log('5. Configurer l\'ordre dans lib/program-orders.ts')
console.log('')
console.log('6. Extraire les métadonnées du Word (optionnel)')
console.log('')

console.log('✅ Vérification terminée!\n')

