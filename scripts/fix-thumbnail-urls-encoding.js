#!/usr/bin/env node

/**
 * Script pour corriger l'encodage des URLs de thumbnails dans Supabase
 * 
 * Le problème: Les URLs dans Supabase sont encodées (%CC%81 pour les accents),
 * mais les fichiers dans S3 ont les noms décodés (avec accents).
 * 
 * Solution: Mettre à jour les URLs dans Supabase pour utiliser les versions décodées.
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

/**
 * Décode une URL pour obtenir le chemin décodé
 */
function decodeThumbnailUrl(url) {
  try {
    const urlObj = new URL(url)
    const encodedPath = urlObj.pathname
    const decodedPath = decodeURIComponent(encodedPath)
    
    // Reconstruire l'URL avec le chemin décodé
    return `${urlObj.protocol}//${urlObj.host}${decodedPath}`
  } catch (error) {
    console.error('Erreur lors du décodage:', error)
    return url
  }
}

/**
 * Met à jour le thumbnail d'une vidéo dans Supabase
 */
async function updateVideoThumbnail(videoId, thumbnailUrl) {
  const { data, error } = await supabase
    .from('videos_new')
    .update({ thumbnail: thumbnailUrl })
    .eq('id', videoId)
    .select()
    .single()

  if (error) {
    console.error(`  ❌ Erreur lors de la mise à jour: ${error.message}`)
    return false
  }

  return true
}

async function main() {
  console.log('🔍 Correction de l\'encodage des URLs de thumbnails...\n')

  // Récupérer toutes les vidéos publiées avec leurs thumbnails
  console.log('📥 Récupération des vidéos depuis Supabase...')
  const { data: videos, error } = await supabase
    .from('videos_new')
    .select('id, title, thumbnail')
    .eq('isPublished', true)
    .not('thumbnail', 'is', null)

  if (error) {
    console.error('❌ Erreur lors de la récupération des vidéos:', error)
    process.exit(1)
  }

  console.log(`✅ ${videos.length} vidéos trouvées\n`)

  let updated = 0
  let unchanged = 0
  let errors = 0

  // Traiter chaque vidéo
  for (const video of videos) {
    if (!video.thumbnail) continue

    const decodedUrl = decodeThumbnailUrl(video.thumbnail)
    
    // Vérifier si l'URL a besoin d'être mise à jour
    if (video.thumbnail === decodedUrl) {
      unchanged++
      continue
    }

    console.log(`📹 ${video.title}`)
    console.log(`   Ancienne URL: ${video.thumbnail.substring(0, 80)}...`)
    console.log(`   Nouvelle URL: ${decodedUrl.substring(0, 80)}...`)
    console.log(`   🔄 Mise à jour...`)

    const success = await updateVideoThumbnail(video.id, decodedUrl)
    
    if (success) {
      updated++
      console.log(`   ✅ Mise à jour réussie\n`)
    } else {
      errors++
      console.log(`   ❌ Erreur lors de la mise à jour\n`)
    }
  }

  // Résumé
  console.log('='.repeat(50))
  console.log('📊 Résumé:')
  console.log(`   ✅ Mis à jour: ${updated}`)
  console.log(`   ✓ Déjà corrects: ${unchanged}`)
  console.log(`   ❌ Erreurs: ${errors}`)
  console.log(`   📊 Total: ${videos.length}`)
  console.log('='.repeat(50))
  
  if (updated > 0) {
    console.log('\n💡 Les URLs ont été corrigées.')
    console.log('   Les thumbnails devraient maintenant s\'afficher correctement dans l\'application.')
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

