/**
 * Script pour mettre à jour les titres validés dans le fichier de validation
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

// Chemin vers le fichier de validation
const VALIDATION_FILE = path.join(__dirname, '..', 'temp', 'all-title-updates-medium-confidence.txt')
const JSON_FILE = path.join(__dirname, '..', 'temp', 'all-title-updates.json')

/**
 * Parse le fichier de validation pour trouver les correspondances validées
 */
function parseValidatedMatches() {
  // D'abord lire le JSON pour avoir toutes les données
  let jsonData = null
  if (fs.existsSync(JSON_FILE)) {
    jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'))
  }
  
  // Parser le fichier texte pour trouver les validations
  const content = fs.readFileSync(VALIDATION_FILE, 'utf8')
  const lines = content.split('\n')
  const validatedMatches = []
  
  let currentVideoId = null
  let currentOldTitle = null
  let currentNewTitle = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détecter une ligne avec ID
    const idMatch = line.match(/ID:\s+([a-f0-9-]+)/i)
    if (idMatch) {
      currentVideoId = idMatch[1]
    }
    
    // Détecter l'ancien titre
    const oldTitleMatch = line.match(/Ancien titre:\s*"(.+)"/i)
    if (oldTitleMatch) {
      currentOldTitle = oldTitleMatch[1]
    }
    
    // Détecter le nouveau titre
    const newTitleMatch = line.match(/Nouveau titre:\s*"(.+)"/i)
    if (newTitleMatch) {
      currentNewTitle = newTitleMatch[1]
    }
    
    // Détecter une validation OUI
    if (line.match(/\[x\]\s*OUI/i) || line.match(/\[X\]\s*OUI/i)) {
      if (currentVideoId && currentNewTitle) {
        validatedMatches.push({
          videoId: currentVideoId,
          oldTitle: currentOldTitle,
          newTitle: currentNewTitle
        })
        // Reset
        currentVideoId = null
        currentOldTitle = null
        currentNewTitle = null
      }
    }
  }
  
  return validatedMatches
}

async function applyValidatedTitleUpdates() {
  try {
    console.log('📖 Lecture du fichier de validation...\n')
    
    if (!fs.existsSync(VALIDATION_FILE)) {
      console.error(`❌ Fichier de validation non trouvé: ${VALIDATION_FILE}`)
      process.exit(1)
    }
    
    const validatedMatches = parseValidatedMatches()
    console.log(`✅ ${validatedMatches.length} correspondance(s) validée(s) trouvée(s)\n`)
    
    if (validatedMatches.length === 0) {
      console.log('⚠️  Aucune correspondance validée. Aucune mise à jour nécessaire.')
      return
    }
    
    // Afficher les correspondances validées
    console.log('📋 Correspondances validées:\n')
    validatedMatches.forEach((match, index) => {
      console.log(`${index + 1}. "${match.oldTitle}"`)
      console.log(`   → "${match.newTitle}"`)
      console.log(`   ID: ${match.videoId}\n`)
    })
    
    console.log('🔄 Mise à jour des titres...\n')
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const match of validatedMatches) {
      try {
        console.log(`📝 "${match.oldTitle}"`)
        console.log(`   → "${match.newTitle}"`)
        
        const updateResult = await sql`
          UPDATE videos_new 
          SET 
            title = ${match.newTitle},
            "updatedAt" = ${new Date().toISOString()}::timestamp with time zone
          WHERE id = ${match.videoId}
          RETURNING id, title
        `
        
        if (updateResult && updateResult.length > 0) {
          console.log(`   ✅ Mise à jour réussie\n`)
          successCount++
          results.push({
            videoId: match.videoId,
            oldTitle: match.oldTitle,
            newTitle: match.newTitle,
            status: 'success'
          })
        } else {
          console.log(`   ⚠️  Aucune ligne mise à jour\n`)
          errorCount++
          results.push({
            videoId: match.videoId,
            oldTitle: match.oldTitle,
            newTitle: match.newTitle,
            status: 'warning',
            message: 'Aucune ligne mise à jour'
          })
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}\n`)
        errorCount++
        results.push({
          videoId: match.videoId,
          oldTitle: match.oldTitle,
          newTitle: match.newTitle,
          status: 'error',
          message: error.message
        })
      }
    }
    
    // Sauvegarder les résultats
    const outputDir = path.join(__dirname, '..', 'temp')
    const resultsFile = path.join(outputDir, 'validated-title-updates-results.json')
    fs.writeFileSync(resultsFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalValidated: validatedMatches.length,
      successCount: successCount,
      errorCount: errorCount,
      results: results
    }, null, 2), 'utf8')
    
    // Résumé final
    console.log('='.repeat(100))
    console.log('📊 RÉSUMÉ DES MISES À JOUR')
    console.log('='.repeat(100))
    console.log(`Total correspondances validées: ${validatedMatches.length}`)
    console.log(`✅ Mises à jour réussies: ${successCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log('='.repeat(100))
    
    console.log(`\n💾 Résultats sauvegardés dans: ${resultsFile}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

// Exécuter le script
applyValidatedTitleUpdates()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
