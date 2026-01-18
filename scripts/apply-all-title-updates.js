/**
 * Script pour mettre à jour tous les titres dans Neon selon le fichier de métadonnées
 * Met à jour automatiquement les correspondances haute confiance (>= 90)
 * et génère un rapport pour validation des autres
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

async function applyAllTitleUpdates() {
  try {
    console.log('📖 Lecture du fichier de correspondances...\n')
    
    if (!fs.existsSync(JSON_FILE)) {
      console.error(`❌ Fichier de correspondances non trouvé: ${JSON_FILE}`)
      console.error('💡 Exécutez d\'abord: node scripts/update-all-titles-from-metadata.js')
      process.exit(1)
    }
    
    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'))
    console.log(`✅ ${data.matches.length} correspondances trouvées\n`)
    
    // Séparer les correspondances haute confiance (>= 90) des autres
    const highConfidence = data.matches.filter(m => m.score >= 90)
    const mediumConfidence = data.matches.filter(m => m.score >= 80 && m.score < 90)
    
    console.log(`📊 Correspondances haute confiance (>= 90): ${highConfidence.length}`)
    console.log(`📊 Correspondances moyenne confiance (80-89): ${mediumConfidence.length}\n`)
    
    // Mettre à jour automatiquement les correspondances haute confiance
    console.log('🔄 Mise à jour automatique des titres haute confiance...\n')
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const match of highConfidence) {
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
    
    // Générer un rapport pour les correspondances moyenne confiance
    const outputDir = path.join(__dirname, '..', 'temp')
    let report = `RAPPORT DE MISE À JOUR DES TITRES - CORRESPONDANCES MOYENNE CONFIANCE\n`
    report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n\n`
    report += `${'='.repeat(100)}\n`
    report += `RÉSUMÉ\n`
    report += `${'='.repeat(100)}\n`
    report += `Correspondances haute confiance mises à jour automatiquement: ${successCount}\n`
    report += `Correspondances moyenne confiance à valider: ${mediumConfidence.length}\n\n`
    
    if (mediumConfidence.length > 0) {
      report += `${'='.repeat(100)}\n`
      report += `CORRESPONDANCES MOYENNE CONFIANCE À VALIDER (${mediumConfidence.length})\n`
      report += `${'='.repeat(100)}\n\n`
      
      mediumConfidence.forEach((m, index) => {
        report += `${index + 1}. ID: ${m.videoId}\n`
        report += `   Ancien titre: "${m.oldTitle}"\n`
        report += `   Nouveau titre: "${m.newTitle}"\n`
        report += `   Score: ${m.score}/100 (${m.matchType})\n`
        report += `   ✅ VALIDATION: [ ] OUI  [ ] NON\n\n`
      })
    }
    
    const reportFile = path.join(outputDir, 'all-title-updates-medium-confidence.txt')
    fs.writeFileSync(reportFile, report, 'utf8')
    
    // Sauvegarder les résultats
    const resultsFile = path.join(outputDir, 'all-title-updates-results.json')
    fs.writeFileSync(resultsFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      highConfidenceUpdated: successCount,
      highConfidenceErrors: errorCount,
      mediumConfidencePending: mediumConfidence.length,
      results: results,
      mediumConfidence: mediumConfidence
    }, null, 2), 'utf8')
    
    // Résumé final
    console.log('='.repeat(100))
    console.log('📊 RÉSUMÉ DES MISES À JOUR')
    console.log('='.repeat(100))
    console.log(`✅ Titres mis à jour automatiquement (haute confiance): ${successCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log(`⚠️  Correspondances moyenne confiance à valider: ${mediumConfidence.length}`)
    console.log('='.repeat(100))
    
    console.log(`\n💾 Résultats sauvegardés dans: ${resultsFile}`)
    if (mediumConfidence.length > 0) {
      console.log(`💾 Rapport de validation sauvegardé dans: ${reportFile}`)
      console.log(`\n📝 Veuillez valider les correspondances moyenne confiance avant de les mettre à jour.`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

// Exécuter le script
applyAllTitleUpdates()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
