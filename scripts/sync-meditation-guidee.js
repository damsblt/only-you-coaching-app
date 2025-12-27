/**
 * Script pour synchroniser les fichiers audio depuis S3
 * Dossier: s3://only-you-coaching/Audio/méditation guidée/
 * 
 * Usage: node scripts/sync-meditation-guidee.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function syncMeditationGuidee() {
  try {
    console.log('🔄 Synchronisation des méditations guidées depuis S3...\n')
    console.log(`📍 Dossier S3: s3://only-you-coaching/Audio/méditation guidée/\n`)

    const response = await fetch(`${API_URL}/api/audio/sync-meditation-guidee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Erreur lors de la synchronisation:', result.error || result)
      process.exit(1)
    }

    console.log('✅ Synchronisation terminée!\n')
    console.log(`📊 Résultats:`)
    console.log(`   - Fichiers synchronisés: ${result.synced}`)
    console.log(`   - Total de fichiers trouvés: ${result.total}`)
    
    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Erreurs rencontrées:`)
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    if (result.searchedPrefixes) {
      console.log(`\n🔍 Préfixes recherchés:`)
      result.searchedPrefixes.forEach(prefix => {
        console.log(`   - ${prefix}`)
      })
    }

    console.log(`\n✨ Les méditations guidées sont maintenant disponibles sur http://localhost:3000/meditation-guidee\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message)
    process.exit(1)
  }
}

// Exécuter la synchronisation
syncMeditationGuidee()







