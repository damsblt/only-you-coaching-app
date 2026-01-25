#!/usr/bin/env node
/**
 * Script automatique qui :
 * 1. Surveille la génération des thumbnails par Lambda
 * 2. Détecte quand tous les thumbnails sont générés (ou seuil acceptable)
 * 3. Lance automatiquement le workflow complet de synchronisation
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const execAsync = promisify(exec)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const COMPLETION_THRESHOLD = 0.95 // 95% des thumbnails générés = considéré comme terminé
const STABLE_ITERATIONS = 3 // Nombre d'itérations stables avant de considérer comme terminé

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function listObjects(prefix) {
  const objects = []
  let continuationToken = undefined
  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })
    const response = await s3Client.send(command)
    if (response.Contents) objects.push(...response.Contents)
    continuationToken = response.NextContinuationToken
  } while (continuationToken)
  return objects
}

function extractRegion(key) {
  const parts = key.split('/')
  if (parts.length >= 3 && parts[1] === 'groupes-musculaires') return parts[2]
  return null
}

async function getStats() {
  const videos = await listObjects('Video/groupes-musculaires/')
  const videoFiles = videos.filter(v => v.Key && v.Key.match(/\.(mp4|mov|avi)$/i) && !v.Key.includes('thumbnails/'))
  
  const thumbnails = await listObjects('thumbnails/Video/groupes-musculaires/')
  const thumbnailFiles = thumbnails.filter(t => t.Key && t.Key.match(/\.(jpg|jpeg|png)$/i))
  
  const totalVideos = videoFiles.length
  const totalThumbnails = thumbnailFiles.length
  const progress = totalVideos > 0 ? totalThumbnails / totalVideos : 0
  
  return { totalVideos, totalThumbnails, progress, videoFiles, thumbnailFiles }
}

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

async function runCompleteWorkflow() {
  console.log('\n🚀 Lancement automatique du workflow complet de synchronisation\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // ÉTAPE 1 : Synchroniser les vidéos depuis S3 vers Neon
    console.log('📥 ÉTAPE 1 : Synchronisation des vidéos depuis S3...\n')
    const syncResult = await callAPI('/api/videos/sync', 'POST', { prefix: 'Video/groupes-musculaires/' })
    console.log(`   ✅ ${syncResult.synced || 0} vidéos synchronisées`)
    if (syncResult.skipped) {
      console.log(`   ⏭️  ${syncResult.skipped} vidéos déjà existantes`)
    }
    console.log('')
    
    // ÉTAPE 2 : Synchroniser les thumbnails depuis S3 vers Neon
    console.log('🖼️  ÉTAPE 2 : Synchronisation des thumbnails depuis S3...\n')
    const thumbnailResult = await callAPI('/api/videos/sync-thumbnails-from-s3')
    console.log(`   ✅ ${thumbnailResult.synced || 0} thumbnails synchronisés`)
    if (thumbnailResult.summary) {
      console.log(`   📊 ${thumbnailResult.summary.matchedByNumber || 0} matchés par videoNumber+region`)
      console.log(`   📊 ${thumbnailResult.summary.matchedByUrl || 0} matchés par URL`)
    }
    console.log('')
    
    // ÉTAPE 3 : Parser les métadonnées Markdown
    console.log('📄 ÉTAPE 3 : Parsing des métadonnées Markdown...\n')
    const parseResult = await callAPI('/api/videos/parse-markdown-metadata')
    const totalExercises = Object.values(parseResult.exercises || {}).reduce((sum, ex) => sum + ex.length, 0)
    console.log(`   ✅ ${totalExercises} exercices parsés depuis les fichiers Markdown`)
    Object.keys(parseResult.exercises || {}).forEach(region => {
      console.log(`      - ${region}: ${parseResult.exercises[region].length} exercices`)
    })
    console.log('')
    
    // ÉTAPE 4 : Matcher et mettre à jour les métadonnées
    console.log('🔗 ÉTAPE 4 : Matching et mise à jour des métadonnées...\n')
    const matchResult = await callAPI('/api/videos/match-and-update-metadata')
    console.log(`   ✅ ${matchResult.updated || 0} vidéos mises à jour`)
    if (matchResult.notFound && matchResult.notFound.length > 0) {
      console.log(`   ⚠️  ${matchResult.notFound.length} vidéos sans correspondance dans les fichiers Markdown`)
    }
    if (matchResult.missingMetadata && matchResult.missingMetadata.length > 0) {
      console.log(`   ⚠️  ${matchResult.missingMetadata.length} vidéos avec métadonnées manquantes`)
    }
    console.log('')
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✅ Workflow complet terminé avec succès !\n')
    
    return true
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution du workflow:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    return false
  }
}

async function displayProgress(stats, iteration, stableCount) {
  const { totalVideos, totalThumbnails, progress } = stats
  const progressPercent = (progress * 100).toFixed(1)
  const remaining = totalVideos - totalThumbnails
  
  console.clear()
  console.log('📊 Surveillance automatique de la génération des thumbnails\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(`⏱️  Mise à jour #${iteration} - ${new Date().toLocaleTimeString()}\n`)
  console.log(`📈 Progression : ${totalThumbnails}/${totalVideos} (${progressPercent}%)\n`)
  console.log(`   ✅ Générés : ${totalThumbnails}`)
  console.log(`   ⏳ Restants : ${remaining}`)
  console.log(`   📊 Barre : [${'█'.repeat(Math.floor(progress * 50))}${'░'.repeat(50 - Math.floor(progress * 50))}] ${progressPercent}%\n`)
  
  if (progress >= COMPLETION_THRESHOLD) {
    console.log(`   🎯 Seuil atteint : ${(COMPLETION_THRESHOLD * 100).toFixed(0)}%`)
    console.log(`   🔄 Itérations stables : ${stableCount}/${STABLE_ITERATIONS}\n`)
    
    if (stableCount >= STABLE_ITERATIONS) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      console.log('✅ Génération des thumbnails terminée !\n')
      console.log('🚀 Lancement automatique du workflow de synchronisation...\n')
      return true
    }
  } else {
    console.log(`   ⏳ En attente du seuil de ${(COMPLETION_THRESHOLD * 100).toFixed(0)}%\n`)
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('💡 Le workflow sera lancé automatiquement une fois les thumbnails générés\n')
  console.log('   Appuyez sur Ctrl+C pour arrêter\n')
  
  return false
}

async function main() {
  console.log('🚀 Démarrage de la surveillance automatique...\n')
  console.log(`   Seuil de complétion : ${(COMPLETION_THRESHOLD * 100).toFixed(0)}%`)
  console.log(`   Itérations stables requises : ${STABLE_ITERATIONS}\n`)
  console.log('   Appuyez sur Ctrl+C pour arrêter\n')
  
  let iteration = 0
  let lastProgress = 0
  let stableCount = 0
  const UPDATE_INTERVAL = 15000 // 15 secondes
  
  const monitor = setInterval(async () => {
    try {
      iteration++
      const stats = await getStats()
      const { progress } = stats
      
      // Vérifier si la progression est stable (pas de changement)
      if (Math.abs(progress - lastProgress) < 0.001) {
        if (progress >= COMPLETION_THRESHOLD) {
          stableCount++
        } else {
          stableCount = 0
        }
      } else {
        stableCount = 0 // Réinitialiser si la progression change
      }
      
      lastProgress = progress
      
      const shouldLaunch = await displayProgress(stats, iteration, stableCount)
      
      if (shouldLaunch) {
        clearInterval(monitor)
        const success = await runCompleteWorkflow()
        process.exit(success ? 0 : 1)
      }
    } catch (error) {
      console.error('❌ Erreur:', error.message)
    }
  }, UPDATE_INTERVAL)
  
  // Afficher immédiatement
  try {
    const stats = await getStats()
    await displayProgress(stats, 0, 0)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  
  // Gérer l'arrêt propre
  process.on('SIGINT', () => {
    clearInterval(monitor)
    console.log('\n\n✅ Surveillance arrêtée\n')
    process.exit(0)
  })
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
