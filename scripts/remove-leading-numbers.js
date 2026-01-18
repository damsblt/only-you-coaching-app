/**
 * Script pour supprimer les numéros en début de titre
 * Exemples: "18. Crunch..." -> "Crunch..."
 *           "52.1 Gainage..." -> "Gainage..."
 *           ". Pompe..." -> "Pompe..."
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

/**
 * Nettoie un titre en enlevant les numéros au début
 */
function cleanLeadingNumbers(title) {
  if (!title) return ''
  
  let cleaned = title.trim()
  
  // 1. Enlever les numéros avec décimales au début (ex: "52.1 ")
  cleaned = cleaned.replace(/^\d+\.\d+\s+/, '')
  
  // 2. Enlever les numéros simples au début (ex: "18. ", "1. ")
  cleaned = cleaned.replace(/^\d+\.\s+/, '')
  
  // 3. Enlever juste un point au début (ex: ". Pompe...")
  cleaned = cleaned.replace(/^\.\s+/, '')
  
  // 4. Enlever les espaces multiples et les espaces en début/fin
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

async function removeLeadingNumbers() {
  try {
    console.log('🔍 Récupération des vidéos MUSCLE_GROUPS depuis Neon...\n')
    
    // Récupérer toutes les vidéos MUSCLE_GROUPS
    const videos = await sql`
      SELECT 
        id, 
        title
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
        AND "isPublished" = true
      ORDER BY title
    `
    
    console.log(`📊 ${videos.length} vidéos MUSCLE_GROUPS trouvées\n`)
    
    // Identifier les titres à nettoyer
    const titlesToClean = []
    
    for (const video of videos) {
      const cleanedTitle = cleanLeadingNumbers(video.title)
      
      // Vérifier si le titre a besoin d'être nettoyé
      if (cleanedTitle !== video.title && cleanedTitle.length > 0) {
        titlesToClean.push({
          video: video,
          oldTitle: video.title,
          newTitle: cleanedTitle
        })
      }
    }
    
    console.log(`📊 ${titlesToClean.length} titre(s) nécessitant un nettoyage\n`)
    
    if (titlesToClean.length === 0) {
      console.log('✅ Tous les titres sont déjà propres!')
      return
    }
    
    // Afficher les titres à nettoyer
    console.log('📋 Titres à nettoyer:\n')
    titlesToClean.forEach((item, index) => {
      console.log(`${index + 1}. "${item.oldTitle}"`)
      console.log(`   → "${item.newTitle}"\n`)
    })
    
    // Mettre à jour directement dans Neon
    console.log('🔄 Application du nettoyage...\n')
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const item of titlesToClean) {
      try {
        console.log(`📝 "${item.oldTitle}"`)
        console.log(`   → "${item.newTitle}"`)
        
        const updateResult = await sql`
          UPDATE videos_new 
          SET 
            title = ${item.newTitle},
            "updatedAt" = ${new Date().toISOString()}::timestamp with time zone
          WHERE id = ${item.video.id}
          RETURNING id, title
        `
        
        if (updateResult && updateResult.length > 0) {
          console.log(`   ✅ Mise à jour réussie\n`)
          successCount++
          results.push({
            videoId: item.video.id,
            oldTitle: item.oldTitle,
            newTitle: item.newTitle,
            status: 'success'
          })
        } else {
          console.log(`   ⚠️  Aucune ligne mise à jour\n`)
          errorCount++
          results.push({
            videoId: item.video.id,
            oldTitle: item.oldTitle,
            newTitle: item.newTitle,
            status: 'warning',
            message: 'Aucune ligne mise à jour'
          })
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}\n`)
        errorCount++
        results.push({
          videoId: item.video.id,
          oldTitle: item.oldTitle,
          newTitle: item.newTitle,
          status: 'error',
          message: error.message
        })
      }
    }
    
    // Sauvegarder les résultats
    const outputDir = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const resultsFile = path.join(outputDir, 'remove-leading-numbers-results.json')
    fs.writeFileSync(resultsFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalTitles: titlesToClean.length,
      successCount: successCount,
      errorCount: errorCount,
      results: results
    }, null, 2), 'utf8')
    
    // Résumé final
    console.log('='.repeat(100))
    console.log('📊 RÉSUMÉ DES NETTOYAGES')
    console.log('='.repeat(100))
    console.log(`Total titres à nettoyer: ${titlesToClean.length}`)
    console.log(`✅ Mises à jour réussies: ${successCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log('='.repeat(100))
    
    console.log(`\n💾 Résultats sauvegardés dans: ${resultsFile}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    process.exit(1)
  }
}

// Exécuter le script
removeLeadingNumbers()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
