#!/usr/bin/env node
/**
 * Script pour tester tous les fichiers Markdown et générer un rapport global
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const regions = [
  'abdos',
  'biceps',
  'triceps',
  'dos',
  'pectoraux',
  'fessiers-jambes',
  'épaule',
  'bande',
  'machine',
  'cardio'
]

async function testRegion(region) {
  try {
    const { stdout, stderr } = await execAsync(`node scripts/compare-videos-vs-word.js ${region} 2>&1`)
    
    // Extraire les statistiques
    const fileMatch = stdout.match(/Fichier : (.+)/)
    const indexedMatch = stdout.match(/Exercices indexés par numéro : (\d+)/)
    const byNumberMatch = stdout.match(/Par numéro : (\d+)/)
    const bySimilarityMatch = stdout.match(/Par similarité : (\d+)/)
    const withoutMatch = stdout.match(/Vidéos SANS correspondance : (\d+)/)
    
    return {
      region,
      file: fileMatch ? fileMatch[1] : 'N/A',
      indexed: indexedMatch ? parseInt(indexedMatch[1], 10) : 0,
      byNumber: byNumberMatch ? parseInt(byNumberMatch[1], 10) : 0,
      bySimilarity: bySimilarityMatch ? parseInt(bySimilarityMatch[1], 10) : 0,
      withoutMatch: withoutMatch ? parseInt(withoutMatch[1], 10) : 0,
      success: true
    }
  } catch (error) {
    return {
      region,
      file: 'N/A',
      indexed: 0,
      byNumber: 0,
      bySimilarity: 0,
      withoutMatch: 0,
      success: false,
      error: error.message
    }
  }
}

async function main() {
  console.log('🔍 Test de tous les fichiers Markdown\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const results = []
  
  for (const region of regions) {
    console.log(`📂 Test de la région : ${region}...`)
    const result = await testRegion(region)
    results.push(result)
    
    if (result.success) {
      console.log(`   ✅ ${result.byNumber} matchs par numéro, ${result.bySimilarity} par similarité, ${result.withoutMatch} sans correspondance\n`)
    } else {
      console.log(`   ❌ Erreur : ${result.error}\n`)
    }
  }
  
  // Résumé global
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📊 RÉSUMÉ GLOBAL\n')
  
  const totalIndexed = results.reduce((sum, r) => sum + r.indexed, 0)
  const totalByNumber = results.reduce((sum, r) => sum + r.byNumber, 0)
  const totalBySimilarity = results.reduce((sum, r) => sum + r.bySimilarity, 0)
  const totalWithoutMatch = results.reduce((sum, r) => sum + r.withoutMatch, 0)
  const totalVideos = totalByNumber + totalBySimilarity + totalWithoutMatch
  
  console.log(`   Total exercices indexés : ${totalIndexed}`)
  console.log(`   Total matchs par numéro : ${totalByNumber}`)
  console.log(`   Total matchs par similarité : ${totalBySimilarity}`)
  console.log(`   Total vidéos sans correspondance : ${totalWithoutMatch}`)
  console.log(`   Total vidéos : ${totalVideos}`)
  console.log(`   Taux de réussite : ${totalVideos > 0 ? ((totalByNumber + totalBySimilarity) / totalVideos * 100).toFixed(1) : 0}%`)
  console.log(`   Taux de match par numéro : ${totalVideos > 0 ? (totalByNumber / totalVideos * 100).toFixed(1) : 0}%\n`)
  
  console.log('📋 Détail par région :\n')
  results.forEach(r => {
    if (r.success) {
      const total = r.byNumber + r.bySimilarity + r.withoutMatch
      const rate = total > 0 ? (r.byNumber / total * 100).toFixed(1) : 0
      console.log(`   ${r.region.padEnd(20)} : ${r.byNumber.toString().padStart(3)} par numéro, ${r.bySimilarity.toString().padStart(2)} par similarité, ${r.withoutMatch.toString().padStart(2)} sans match (${rate}% par numéro)`)
    } else {
      console.log(`   ${r.region.padEnd(20)} : ❌ Erreur`)
    }
  })
  
  console.log('\n✅ Test terminé !\n')
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
