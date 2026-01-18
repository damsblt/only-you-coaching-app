/**
 * Script pour mettre à jour automatiquement TOUS les titres dans Neon
 * selon le fichier de métadonnées (correspondances >= 80)
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

// Chemin vers le fichier JSON des correspondances
const JSON_FILE = path.join(__dirname, '..', 'temp', 'all-title-updates.json')

async function updateAllTitlesAutomatically() {
  try {
    console.log('📖 Lecture du fichier de correspondances...\n')
    
    if (!fs.existsSync(JSON_FILE)) {
      console.error(`❌ Fichier de correspondances non trouvé: ${JSON_FILE}`)
      console.error('💡 Exécutez d\'abord: node scripts/update-all-titles-from-metadata.js')
      process.exit(1)
    }
    
    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'))
    console.log(`✅ ${data.matches.length} correspondances trouvées\n`)
    
    // Prendre toutes les correspondances (>= 80)
    const allMatches = data.matches.filter(m => m.score >= 80)
    
    console.log(`📊 Correspondances à mettre à jour (>= 80): ${allMatches.length}\n`)
    
    // Mettre à jour toutes les correspondances
    console.log('🔄 Mise à jour de tous les titres...\n')
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const match of allMatches) {
      try {
        console.log(`📝 "${match.oldTitle}"`)
        console.log(`   → "${match.newTitle}" (Score: ${match.score}/100)`)
        
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
            score: match.score,
            status: 'success'
          })
        } else {
          console.log(`   ⚠️  Aucune ligne mise à jour\n`)
          errorCount++
          results.push({
            videoId: match.videoId,
            oldTitle: match.oldTitle,
            newTitle: match.newTitle,
            score: match.score,
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
          score: match.score,
          status: 'error',
          message: error.message
        })
      }
    }
    
    // Sauvegarder les résultats
    const outputDir = path.join(__dirname, '..', 'temp')
    const resultsFile = path.join(outputDir, 'all-titles-updated-results.json')
    fs.writeFileSync(resultsFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalMatches: allMatches.length,
      successCount: successCount,
      errorCount: errorCount,
      results: results
    }, null, 2), 'utf8')
    
    // Résumé final
    console.log('='.repeat(100))
    console.log('📊 RÉSUMÉ DES MISES À JOUR')
    console.log('='.repeat(100))
    console.log(`Total correspondances (>= 80): ${allMatches.length}`)
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
updateAllTitlesAutomatically()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
