#!/usr/bin/env node

/**
 * Script pour corriger le mapping des thumbnails avec les vidéos dans Supabase
 * 
 * Ce script:
 * 1. Récupère toutes les vidéos depuis Supabase avec leurs thumbnails
 * 2. Pour chaque vidéo, extrait le nom de fichier de l'URL de la vidéo
 * 3. Pour chaque thumbnail dans Supabase, extrait le nom de fichier du thumbnail
 * 4. Remappe les thumbnails aux bonnes vidéos en fonction du nom de fichier
 * 5. Met à jour la base de données avec les bons thumbnails
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
  console.error('   NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis')
  process.exit(1)
}

// Initialiser le client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

/**
 * Décode une URL pour obtenir le nom de fichier réel
 */
function decodeUrl(urlString) {
  try {
    return decodeURIComponent(urlString)
  } catch (error) {
    return urlString
  }
}

/**
 * Extrait le nom de fichier depuis l'URL de la vidéo (décodé)
 */
function extractVideoFilename(videoUrl) {
  try {
    const url = new URL(videoUrl)
    const pathname = url.pathname.substring(1) // Enlever le slash initial
    return decodeUrl(pathname)
  } catch (error) {
    console.error('Erreur lors de l\'extraction du nom de fichier:', error)
    return null
  }
}

/**
 * Extrait le nom de base du fichier vidéo (sans extension, sans préfixe de dossier)
 * Enlève aussi les suffixes comme "-mp4" qui peuvent être dans le nom de fichier
 */
function extractVideoBaseName(videoUrl) {
  try {
    const videoPath = extractVideoFilename(videoUrl)
    if (!videoPath) return null
    
    // Extraire le nom de fichier sans extension
    const videoFileName = path.basename(videoPath)
    let videoNameWithoutExt = path.parse(videoFileName).name
    
    // Enlever les suffixes communs comme "-mp4", ".mp4" dans le nom de fichier
    videoNameWithoutExt = videoNameWithoutExt.replace(/-mp4$/i, '').replace(/\.mp4$/i, '')
    
    return videoNameWithoutExt
  } catch (error) {
    console.error('Erreur lors de l\'extraction du nom de base:', error)
    return null
  }
}

/**
 * Extrait le nom de base du thumbnail depuis son URL (décodé)
 */
function extractThumbnailBaseName(thumbnailUrl) {
  try {
    if (!thumbnailUrl) return null
    const url = new URL(thumbnailUrl)
    const pathname = url.pathname.substring(1) // Enlever le slash initial
    const decodedPathname = decodeUrl(pathname)
    
    // Extraire le nom de fichier sans extension
    const thumbnailFileName = path.basename(decodedPathname)
    // Enlever "-thumb.jpg" ou ".jpg"
    const baseName = thumbnailFileName.replace(/-thumb\.jpg$/i, '').replace(/\.jpg$/i, '').replace(/\.jpeg$/i, '')
    
    return baseName
  } catch (error) {
    console.error('Erreur lors de l\'extraction du nom de base du thumbnail:', error)
    return null
  }
}

/**
 * Vérifie si le thumbnail correspond à la vidéo
 */
function doesThumbnailMatchVideo(videoUrl, thumbnailUrl) {
  const videoBaseName = extractVideoBaseName(videoUrl)
  const thumbnailBaseName = extractThumbnailBaseName(thumbnailUrl)
  
  if (!videoBaseName || !thumbnailBaseName) return false
  
  // Comparaison insensible à la casse
  return videoBaseName.toLowerCase() === thumbnailBaseName.toLowerCase()
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

/**
 * Trouve le bon thumbnail pour une vidéo en cherchant parmi tous les thumbnails existants
 */
function findCorrectThumbnailFromList(video, allThumbnails) {
  const videoUrl = video.videoUrl
  if (!videoUrl) {
    return null
  }

  const videoBaseName = extractVideoBaseName(videoUrl)
  if (!videoBaseName) {
    return null
  }

  // Chercher parmi tous les thumbnails celui qui correspond au nom de la vidéo
  for (const thumbnailUrl of allThumbnails) {
    const thumbnailBaseName = extractThumbnailBaseName(thumbnailUrl)
    if (thumbnailBaseName && videoBaseName.toLowerCase() === thumbnailBaseName.toLowerCase()) {
      return thumbnailUrl
    }
  }

  return null
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Démarrage de la correction des thumbnails...\n')

  // Récupérer toutes les vidéos publiées avec leurs thumbnails
  console.log('📥 Récupération des vidéos depuis Supabase...')
  const { data: videos, error } = await supabase
    .from('videos_new')
    .select('id, title, videoUrl, thumbnail')
    .eq('isPublished', true)

  if (error) {
    console.error('❌ Erreur lors de la récupération des vidéos:', error)
    process.exit(1)
  }

  console.log(`✅ ${videos.length} vidéos trouvées\n`)

  // Créer une liste de tous les thumbnails uniques existants
  const allThumbnails = [...new Set(videos.map(v => v.thumbnail).filter(Boolean))]
  console.log(`📋 ${allThumbnails.length} thumbnails uniques trouvés dans Supabase\n`)

  let updated = 0
  let unchanged = 0
  let notFound = 0
  let mismatched = 0

  // Traiter chaque vidéo
  for (const video of videos) {
    console.log(`\n📹 ${video.title}`)
    console.log(`   Video URL: ${video.videoUrl}`)
    console.log(`   Thumbnail actuel: ${video.thumbnail || '(aucun)'}`)

    // Vérifier si le thumbnail actuel correspond à la vidéo
    const currentThumbnailMatches = video.thumbnail && doesThumbnailMatchVideo(video.videoUrl, video.thumbnail)
    
    if (currentThumbnailMatches) {
      unchanged++
      console.log(`   ✓ Thumbnail correspond déjà à la vidéo`)
      continue
    }
    
    if (video.thumbnail && !currentThumbnailMatches) {
      const videoBaseName = extractVideoBaseName(video.videoUrl)
      const thumbnailBaseName = extractThumbnailBaseName(video.thumbnail)
      console.log(`   ⚠️  MISMATCH détecté!`)
      console.log(`      Nom vidéo attendu: "${videoBaseName}"`)
      console.log(`      Nom thumbnail actuel: "${thumbnailBaseName}"`)
      mismatched++
    }

    // Trouver le bon thumbnail parmi ceux qui existent déjà dans Supabase
    const correctThumbnail = findCorrectThumbnailFromList(video, allThumbnails)

    if (!correctThumbnail) {
      notFound++
      console.log(`   ⚠️  Pas de thumbnail correspondant trouvé dans Supabase - ignoré`)
      continue
    }

    // Vérifier si le thumbnail trouvé correspond bien
    const correctThumbnailMatches = doesThumbnailMatchVideo(video.videoUrl, correctThumbnail)
    
    if (!correctThumbnailMatches) {
      const videoBaseName = extractVideoBaseName(video.videoUrl)
      const foundThumbnailBaseName = extractThumbnailBaseName(correctThumbnail)
      console.log(`   ⚠️  ATTENTION: Le thumbnail trouvé ne correspond peut-être pas:`)
      console.log(`      Nom vidéo: "${videoBaseName}"`)
      console.log(`      Nom thumbnail trouvé: "${foundThumbnailBaseName}"`)
    }

    // Mettre à jour le thumbnail
    console.log(`   🔄 Mise à jour du thumbnail...`)
    const success = await updateVideoThumbnail(video.id, correctThumbnail)
    
    if (success) {
      updated++
      console.log(`   ✅ Thumbnail mis à jour: ${correctThumbnail}`)
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(50))
  console.log('📊 Résumé:')
  console.log(`   ✅ Mis à jour: ${updated}`)
  console.log(`   ✓ Déjà corrects: ${unchanged}`)
  console.log(`   ⚠️  Mismatches détectés: ${mismatched}`)
  console.log(`   ⚠️  Non trouvés: ${notFound}`)
  console.log(`   📊 Total: ${videos.length}`)
  console.log('='.repeat(50))
}

// Exécuter le script
main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

