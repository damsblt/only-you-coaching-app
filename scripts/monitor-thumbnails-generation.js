#!/usr/bin/env node
/**
 * Script de monitoring pour suivre la génération des thumbnails en temps réel
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const execAsync = promisify(exec)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

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
  
  const videosByRegion = new Map()
  const thumbnailsByRegion = new Map()
  
  videoFiles.forEach(v => {
    const region = extractRegion(v.Key) || 'unknown'
    videosByRegion.set(region, (videosByRegion.get(region) || 0) + 1)
  })
  
  thumbnailFiles.forEach(t => {
    const region = extractRegion(t.Key) || 'unknown'
    thumbnailsByRegion.set(region, (thumbnailsByRegion.get(region) || 0) + 1)
  })
  
  return { videoFiles, thumbnailFiles, videosByRegion, thumbnailsByRegion }
}

async function getRecentLogs() {
  try {
    const { stdout } = await execAsync(
      `aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --since 5m --format short 2>&1 | tail -20`
    )
    return stdout
  } catch (error) {
    return 'Erreur lors de la récupération des logs'
  }
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

async function displayStats(stats, iteration = 0) {
  const { videoFiles, thumbnailFiles, videosByRegion, thumbnailsByRegion } = stats
  const totalVideos = videoFiles.length
  const totalThumbnails = thumbnailFiles.length
  const progress = totalVideos > 0 ? ((totalThumbnails / totalVideos) * 100).toFixed(1) : 0
  
  console.clear()
  console.log('📊 Monitoring de la génération des thumbnails\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(`⏱️  Mise à jour #${iteration} - ${new Date().toLocaleTimeString()}\n`)
  console.log(`📈 Progression globale : ${totalThumbnails}/${totalVideos} (${progress}%)\n`)
  
  if (totalVideos > 0) {
    const remaining = totalVideos - totalThumbnails
    console.log(`   ✅ Générés : ${totalThumbnails}`)
    console.log(`   ⏳ Restants : ${remaining}`)
    console.log(`   📊 Barre de progression : [${'█'.repeat(Math.floor(progress / 2))}${'░'.repeat(50 - Math.floor(progress / 2))}] ${progress}%\n`)
  }
  
  console.log('📋 Détail par région :\n')
  const allRegions = new Set([...videosByRegion.keys(), ...thumbnailsByRegion.keys()])
  for (const region of Array.from(allRegions).sort()) {
    const videoCount = videosByRegion.get(region) || 0
    const thumbCount = thumbnailsByRegion.get(region) || 0
    const regionProgress = videoCount > 0 ? ((thumbCount / videoCount) * 100).toFixed(1) : 0
    const status = videoCount === thumbCount ? '✅' : videoCount > thumbCount ? '⏳' : '❌'
    console.log(`   ${status} ${region.padEnd(20)} : ${thumbCount.toString().padStart(3)}/${videoCount.toString().padStart(3)} (${regionProgress}%)`)
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📝 Logs récents de la Lambda (5 dernières minutes) :\n')
  
  const logs = await getRecentLogs()
  const logLines = logs.split('\n').filter(l => l.trim())
  if (logLines.length > 0) {
    logLines.slice(-10).forEach(line => {
      if (line.includes('✅')) {
        console.log(`   ${line}`)
      } else if (line.includes('⚠️') || line.includes('❌')) {
        console.log(`   ${line}`)
      } else if (line.includes('Processing') || line.includes('Thumbnail')) {
        console.log(`   ${line.substring(0, 100)}...`)
      }
    })
  } else {
    console.log('   Aucun log récent')
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('💡 Appuyez sur Ctrl+C pour arrêter le monitoring\n')
}

async function main() {
  console.log('🚀 Démarrage du monitoring...\n')
  console.log('   Appuyez sur Ctrl+C pour arrêter\n')
  
  let iteration = 0
  const UPDATE_INTERVAL = 10000 // 10 secondes
  
  const monitor = setInterval(async () => {
    try {
      iteration++
      const stats = await getStats()
      await displayStats(stats, iteration)
    } catch (error) {
      console.error('❌ Erreur:', error.message)
    }
  }, UPDATE_INTERVAL)
  
  // Afficher immédiatement
  try {
    const stats = await getStats()
    await displayStats(stats, 0)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  
  // Gérer l'arrêt propre
  process.on('SIGINT', () => {
    clearInterval(monitor)
    console.log('\n\n✅ Monitoring arrêté\n')
    process.exit(0)
  })
}

main().catch(error => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})
