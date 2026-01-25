#!/usr/bin/env node
/**
 * Script complet pour exécuter tout le workflow de synchronisation :
 * 1. Synchroniser les vidéos depuis S3 vers Neon (avec videoNumber)
 * 2. Synchroniser les thumbnails depuis S3 vers Neon
 * 3. Parser les métadonnées Markdown
 * 4. Matcher et mettre à jour les métadonnées
 */

// Using native fetch (available in Node.js 18+)
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function callAPI(endpoint, method = 'POST', body = null) {
  const url = `${API_BASE_URL}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error(`❌ Erreur API ${endpoint}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🚀 Workflow complet de synchronisation\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // ÉTAPE 1 : Synchroniser les vidéos depuis S3 vers Neon
    console.log('📥 ÉTAPE 1 : Synchronisation des vidéos depuis S3...\n')
    const syncResult = await callAPI('/api/videos/sync', 'POST', { prefix: 'Video/groupes-musculaires/' })
    console.log(`   ✅ ${syncResult.synced || 0} vidéos synchronisées`)
    console.log(`   ⏭️  ${syncResult.skipped || 0} vidéos déjà existantes`)
    if (syncResult.errors && syncResult.errors.length > 0) {
      console.log(`   ⚠️  ${syncResult.errors.length} erreurs`)
    }
    console.log('')
    
    // ÉTAPE 2 : Synchroniser les thumbnails depuis S3 vers Neon
    console.log('🖼️  ÉTAPE 2 : Synchronisation des thumbnails depuis S3...\n')
    const thumbnailsResult = await callAPI('/api/videos/sync-thumbnails-from-s3')
    console.log(`   ✅ ${thumbnailsResult.summary?.synced || 0} thumbnails synchronisés`)
    console.log(`   📋 ${thumbnailsResult.summary?.thumbnailsInS3 || 0} thumbnails trouvés dans S3`)
    if (thumbnailsResult.summary?.errors > 0) {
      console.log(`   ⚠️  ${thumbnailsResult.summary.errors} erreurs`)
    }
    console.log('')
    
    // ÉTAPE 3 : Parser les métadonnées Markdown
    console.log('📄 ÉTAPE 3 : Parsing des métadonnées Markdown...\n')
    const parseResult = await callAPI('/api/videos/parse-markdown-metadata')
    console.log(`   ✅ ${parseResult.total || 0} exercices chargés`)
    console.log(`   📂 ${parseResult.regions?.length || 0} régions traitées`)
    for (const region of parseResult.regions || []) {
      const count = parseResult.exercises?.[region]?.length || 0
      console.log(`      - ${region}: ${count} exercices`)
    }
    console.log('')
    
    // ÉTAPE 4 : Matcher et mettre à jour les métadonnées
    console.log('🔗 ÉTAPE 4 : Matching et mise à jour des métadonnées...\n')
    const matchResult = await callAPI('/api/videos/match-and-update-metadata')
    console.log(`   ✅ ${matchResult.updated || 0} vidéos mises à jour`)
    console.log(`   ❌ ${matchResult.notFound?.length || 0} vidéos sans correspondance`)
    console.log(`   ⚠️  ${matchResult.needsValidation?.length || 0} nécessitent validation`)
    console.log(`   📝 ${matchResult.missingMetadata?.length || 0} avec métadonnées manquantes`)
    console.log('')
    
    // Résumé final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✅ Workflow terminé avec succès !\n')
    console.log('📊 Résumé :')
    console.log(`   - Vidéos synchronisées : ${syncResult.synced || 0}`)
    console.log(`   - Thumbnails synchronisés : ${thumbnailsResult.summary?.synced || 0}`)
    console.log(`   - Exercices parsés : ${parseResult.total || 0}`)
    console.log(`   - Métadonnées mises à jour : ${matchResult.updated || 0}\n`)
    
  } catch (error) {
    console.error('\n❌ Erreur lors du workflow:', error.message)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
