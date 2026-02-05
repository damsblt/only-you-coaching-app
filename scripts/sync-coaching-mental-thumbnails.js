/**
 * Script pour synchroniser les images de couverture depuis S3 vers Neon
 * pour les audios de coaching mental
 * 
 * Usage: node scripts/sync-coaching-mental-thumbnails.js
 */

require('dotenv').config({ path: '.env.local' })
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { neon } = require('@neondatabase/serverless')
const ws = require('ws')

// Configure Neon for Node.js environment
const { neonConfig } = require('@neondatabase/serverless')
neonConfig.webSocketConstructor = ws

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const S3_FOLDER = 'Photos/Illustration/coaching mental/'

// Ordre d'affichage spécifié par l'utilisateur
const COACHING_MENTAL_ORDER = [
  'L\'importance de se fixer des objectifs',
  'Travailler son auto-discipline',
  'L\'importance de la pensée positive',
  'L\'importance de l\'instant présent'
]

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})

/**
 * Normalise un titre pour la comparaison (supprime accents, majuscules, etc.)
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, ' ') // Normalise les espaces
}

/**
 * Trouve l'audio correspondant à un titre (avec correspondance flexible)
 */
function findMatchingAudio(audios, targetTitle) {
  const normalizedTarget = normalizeTitle(targetTitle)
  
  // Essai 1: Correspondance exacte (normalisée)
  let match = audios.find(audio => 
    normalizeTitle(audio.title) === normalizedTarget
  )
  if (match) return match
  
  // Essai 2: Correspondance partielle (le titre contient les mots-clés)
  const targetWords = normalizedTarget.split(' ').filter(w => w.length > 2)
  match = audios.find(audio => {
    const audioTitle = normalizeTitle(audio.title)
    return targetWords.every(word => audioTitle.includes(word))
  })
  if (match) return match
  
  // Essai 3: Correspondance inversée (les mots-clés sont dans le titre)
  match = audios.find(audio => {
    const audioTitle = normalizeTitle(audio.title)
    const audioWords = audioTitle.split(' ').filter(w => w.length > 2)
    return targetWords.some(word => audioWords.some(aWord => aWord.includes(word) || word.includes(aWord)))
  })
  if (match) return match
  
  return null
}

/**
 * Trouve l'image S3 correspondant à un titre d'audio
 */
function findMatchingImage(imageFiles, audioTitle) {
  const normalizedAudioTitle = normalizeTitle(audioTitle)
  
  // Essai 1: Correspondance exacte du nom de fichier (sans extension et dossier)
  let match = imageFiles.find(imagePath => {
    const filename = imagePath.split('/').pop().replace(/\.[^.]+$/, '') // Enlève l'extension
    return normalizeTitle(filename) === normalizedAudioTitle
  })
  if (match) return match
  
  // Essai 2: Le nom de fichier contient les mots-clés du titre
  const audioWords = normalizedAudioTitle.split(' ').filter(w => w.length > 2)
  match = imageFiles.find(imagePath => {
    const filename = imagePath.split('/').pop().replace(/\.[^.]+$/, '')
    const normalizedFilename = normalizeTitle(filename)
    return audioWords.every(word => normalizedFilename.includes(word))
  })
  if (match) return match
  
  // Essai 3: Correspondance partielle avec mots-clés importants
  const keyWords = ['objectif', 'discipline', 'positiv', 'instant', 'present', 'pensee']
  match = imageFiles.find(imagePath => {
    const filename = imagePath.split('/').pop().replace(/\.[^.]+$/, '')
    const normalizedFilename = normalizeTitle(filename)
    // Cherche les mots-clés communs
    return keyWords.some(keyword => 
      normalizedFilename.includes(keyword) && normalizedAudioTitle.includes(keyword)
    )
  })
  if (match) return match
  
  return null
}

async function syncThumbnails() {
  try {
    console.log('🔄 Début de la synchronisation des images de couverture...\n')
    
    // 1. Lister les images dans S3
    console.log(`📂 Liste des images dans S3: ${S3_FOLDER}`)
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: S3_FOLDER,
    })
    
    const s3Response = await s3Client.send(listCommand)
    
    if (!s3Response.Contents || s3Response.Contents.length === 0) {
      console.log('❌ Aucune image trouvée dans S3')
      return
    }
    
    // Filtrer les fichiers image
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const imageFiles = s3Response.Contents
      .map(obj => obj.Key)
      .filter(key => {
        if (!key) return false
        const ext = key.split('.').pop()?.toLowerCase()
        return ext && imageExtensions.includes(ext)
      })
      .sort()
    
    console.log(`✅ ${imageFiles.length} image(s) trouvée(s) dans S3:`)
    imageFiles.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`)
    })
    console.log('')
    
    // 2. Récupérer les audios de coaching mental depuis Neon
    console.log('📊 Récupération des audios de coaching mental depuis Neon...')
    const audiosQuery = await sql`
      SELECT id, title, category, thumbnail, "orderIndex"
      FROM audios
      WHERE category IN ('Coaching Mental', 'Coaching mental', 'coaching_mental')
      ORDER BY title
    `
    
    const audios = Array.isArray(audiosQuery) ? audiosQuery : []
    
    console.log(`✅ ${audios.length} audio(s) de coaching mental trouvé(s):`)
    audios.forEach((audio, index) => {
      console.log(`   ${index + 1}. ${audio.title} (ID: ${audio.id})`)
    })
    console.log('')
    
    // 3. Mapper les images aux audios selon l'ordre spécifié
    console.log('🔗 Mapping des images aux audios selon l\'ordre spécifié...\n')
    
    const updates = []
    const usedImageIndices = new Set()
    
    // Pour chaque titre dans l'ordre spécifié
    for (let orderIndex = 0; orderIndex < COACHING_MENTAL_ORDER.length; orderIndex++) {
      const targetTitle = COACHING_MENTAL_ORDER[orderIndex]
      const audio = findMatchingAudio(audios, targetTitle)
      
      if (!audio) {
        console.log(`⚠️  Audio non trouvé pour: "${targetTitle}"`)
        continue
      }
      
      // Trouver l'image correspondante par nom de fichier (pas par index!)
      const imageKey = findMatchingImage(imageFiles, audio.title)
      if (!imageKey) {
        console.log(`⚠️  Image non trouvée pour l'audio: "${audio.title}"`)
        continue
      }
      
      const imageIndex = imageFiles.indexOf(imageKey)
      usedImageIndices.add(imageIndex)
      
      // Vérifier si une mise à jour est nécessaire
      const needsUpdate = audio.thumbnail !== imageKey || audio.orderIndex !== orderIndex + 1
      
      if (needsUpdate) {
        updates.push({
          audioId: audio.id,
          audioTitle: audio.title,
          thumbnail: imageKey,
          orderIndex: orderIndex + 1,
          oldThumbnail: audio.thumbnail,
          oldOrderIndex: audio.orderIndex,
        })
      } else {
        console.log(`✓ "${audio.title}" - déjà à jour`)
      }
    }
    
    // 4. Mettre à jour les audios dans Neon
    if (updates.length === 0) {
      console.log('\n✅ Tous les audios sont déjà à jour!')
      return
    }
    
    console.log(`\n📝 ${updates.length} mise(s) à jour à effectuer:\n`)
    updates.forEach((update, index) => {
      console.log(`${index + 1}. "${update.audioTitle}"`)
      console.log(`   Image: ${update.oldThumbnail || '(aucune)'} → ${update.thumbnail}`)
      console.log(`   Ordre: ${update.oldOrderIndex || '(aucun)'} → ${update.orderIndex}`)
      console.log('')
    })
    
    // Exécuter les mises à jour
    let successCount = 0
    let errorCount = 0
    
    for (const update of updates) {
      try {
        const updateQuery = await sql`
          UPDATE audios
          SET 
            thumbnail = ${update.thumbnail},
            "orderIndex" = ${update.orderIndex},
            "updatedAt" = NOW()
          WHERE id = ${update.audioId}
          RETURNING id
        `
        
        if (updateQuery && updateQuery.length > 0) {
          console.log(`✅ Mis à jour: "${update.audioTitle}"`)
          successCount++
        } else {
          console.error(`❌ Aucune ligne mise à jour pour "${update.audioTitle}"`)
          errorCount++
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de "${update.audioTitle}":`, error)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Synchronisation terminée!`)
    console.log(`   ${successCount} mise(s) à jour réussie(s)`)
    if (errorCount > 0) {
      console.log(`   ${errorCount} erreur(s)`)
    }
    console.log('='.repeat(60))
    
    // 5. Afficher les images non utilisées
    const unusedImages = imageFiles.filter((_, index) => !usedImageIndices.has(index))
    if (unusedImages.length > 0) {
      console.log(`\n⚠️  ${unusedImages.length} image(s) non utilisée(s):`)
      unusedImages.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    process.exit(1)
  }
}

// Exécuter le script
syncThumbnails()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
