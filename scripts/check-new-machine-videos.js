/**
 * Script pour vérifier les nouvelles vidéos machine dans S3 qui ne sont pas encore dans Neon
 */

require('dotenv').config({ path: '.env.local' })
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { neon } = require('@neondatabase/serverless')

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

if (!hasAwsCredentials) {
  console.error('❌ AWS credentials manquantes dans .env.local')
  process.exit(1)
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function checkNewMachineVideos() {
  console.log('🔍 Vérification des nouvelles vidéos machine dans S3...\n')
  
  try {
    // 1. Lister les vidéos dans S3
    console.log('📦 Liste des vidéos dans S3 (Video/programmes-predefinis/machine/)...')
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Video/programmes-predefinis/machine/',
    })
    
    const response = await s3Client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ Aucune vidéo trouvée dans S3')
      return
    }
    
    // Filtrer les fichiers vidéo
    const videoFiles = response.Contents
      .map(obj => obj.Key)
      .filter(key => !!key)
      .filter(key => {
        const ext = key.split('.').pop()?.toLowerCase()
        return ['mp4', 'mov', 'avi', 'webm'].includes(ext || '')
      })
    
    console.log(`✅ ${videoFiles.length} fichier(s) vidéo trouvé(s) dans S3\n`)
    
    // 2. Récupérer les vidéos déjà dans Neon
    console.log('📊 Récupération des vidéos déjà dans Neon...')
    const sql = neon(databaseUrl)
    const existingVideos = await sql`
      SELECT "videoUrl"
      FROM videos_new
      WHERE "videoUrl" LIKE '%programmes-predefinis/machine%'
    `
    
    const existingUrls = new Set(
      existingVideos.map(v => v.videoUrl)
    )
    
    console.log(`✅ ${existingVideos.length} vidéo(s) déjà dans Neon\n`)
    
    // 3. Comparer et trouver les nouvelles vidéos
    const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`
    const newVideos = []
    
    for (const s3Key of videoFiles) {
      const fullUrl = `${S3_BASE_URL}/${s3Key}`
      
      // Vérifier aussi avec différentes variantes d'URL
      const urlVariants = [
        fullUrl,
        fullUrl.replace('.mp4', '-mp4'),
        fullUrl.replace('.mp4', ''),
        s3Key,
        s3Key.replace('.mp4', '-mp4'),
        s3Key.replace('.mp4', ''),
      ]
      
      const exists = urlVariants.some(url => {
        return existingUrls.has(url) || 
               Array.from(existingUrls).some(existing => existing.includes(s3Key.split('/').pop() || ''))
      })
      
      if (!exists) {
        newVideos.push(s3Key)
      }
    }
    
    // Afficher les résultats
    console.log('📋 RÉSUMÉ:\n')
    console.log(`   Total dans S3: ${videoFiles.length}`)
    console.log(`   Déjà dans Neon: ${existingVideos.length}`)
    console.log(`   Nouvelles vidéos: ${newVideos.length}\n`)
    
    if (newVideos.length === 0) {
      console.log('✅ Toutes les vidéos sont déjà synchronisées dans Neon!\n')
    } else {
      console.log('⚠️  Nouvelles vidéos à synchroniser:\n')
      newVideos.forEach((video, index) => {
        const filename = video.split('/').pop()
        console.log(`   ${index + 1}. ${filename}`)
      })
      console.log('\n💡 Pour synchroniser ces vidéos, utilisez le script de synchronisation.\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

checkNewMachineVideos()

