/**
 * Script pour ajouter des thumbnails SVG aux audios
 * Génère des icônes SVG personnalisées selon le titre/catégorie
 */

// Charger les variables d'environnement depuis .env.local si disponible, sinon .env
require('dotenv').config({ path: '.env.local' })
require('dotenv').config() // Fallback sur .env
const { createClient } = require('@supabase/supabase-js')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const https = require('https')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Configuration S3
const awsRegion = process.env.AWS_REGION || 'eu-north-1'
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
})

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Génère une icône SVG selon le type
function generateSVGIcon(type, title) {
  const svgSize = 800
  // Toutes les icônes utilisent maintenant la couleur burgundy (#A65959) du header
  const colors = {
    primary: '#A65959', // Burgundy de la barre supérieure
    secondary: '#C48789', // Burgundy 400 pour les variations
    gradient1: '#9D4F4F', // Burgundy 600 plus foncé
    gradient2: '#E8D3D5', // Burgundy 50 très clair pour gradients
  }

  const colorScheme = colors // Utiliser le même schéma de couleurs pour tout
  
  // Icônes personnalisées selon le titre
  let iconPath = ''
  
  switch(type) {
    case 'coaching':
      // Icône motivation/dépassement sportif - Flamme dynamique et lignes de vitesse
      iconPath = `
        <circle cx="400" cy="400" r="150" fill="${colorScheme.primary}" opacity="0.1"/>
        <!-- Flamme de motivation dynamique -->
        <path d="M 400 220 Q 380 300, 400 350 Q 420 320, 400 280 Z" fill="${colorScheme.primary}"/>
        <path d="M 400 280 Q 390 320, 400 380 Q 410 350, 400 320 Z" fill="${colorScheme.secondary}"/>
        <path d="M 400 320 Q 395 360, 400 420 Q 405 390, 400 360 Z" fill="${colorScheme.primary}" opacity="0.8"/>
        <!-- Lignes de vitesse/énergie -->
        <path d="M 300 400 L 380 380" stroke="${colorScheme.primary}" stroke-width="6" fill="none" opacity="0.6"/>
        <path d="M 320 420 L 390 400" stroke="${colorScheme.secondary}" stroke-width="5" fill="none" opacity="0.5"/>
        <path d="M 420 380 L 500 400" stroke="${colorScheme.primary}" stroke-width="6" fill="none" opacity="0.6"/>
        <path d="M 410 400 L 480 420" stroke="${colorScheme.secondary}" stroke-width="5" fill="none" opacity="0.5"/>
        <!-- Étoile de performance -->
        <path d="M 400 350 L 410 370 L 430 370 L 415 385 L 420 405 L 400 395 L 380 405 L 385 385 L 370 370 L 390 370 Z" fill="white" opacity="0.9"/>
        <!-- Point central de concentration -->
        <circle cx="400" cy="360" r="8" fill="white"/>
      `
      break
      
    case 'anxiete':
      // Waves/calm icon
      iconPath = `
        <circle cx="400" cy="400" r="150" fill="${colorScheme.primary}" opacity="0.1"/>
        <path d="M 200 450 Q 300 400, 400 450 T 600 450" stroke="${colorScheme.primary}" stroke-width="8" fill="none" opacity="0.8"/>
        <path d="M 150 500 Q 300 450, 450 500 T 650 500" stroke="${colorScheme.secondary}" stroke-width="6" fill="none" opacity="0.6"/>
        <circle cx="400" cy="380" r="40" fill="${colorScheme.primary}" opacity="0.3"/>
      `
      break
      
    case 'gratitude':
      // Heart/nature icon
      iconPath = `
        <circle cx="400" cy="400" r="120" fill="${colorScheme.primary}" opacity="0.1"/>
        <path d="M 400 320 C 360 280, 300 300, 300 360 C 300 400, 400 480, 400 480 C 400 480, 500 400, 500 360 C 500 300, 440 280, 400 320 Z" fill="${colorScheme.primary}"/>
        <path d="M 350 360 L 400 410 L 450 360" stroke="${colorScheme.secondary}" stroke-width="4" fill="none"/>
      `
      break
      
    case 'confiance':
      // Mountain/strength icon
      iconPath = `
        <circle cx="400" cy="400" r="140" fill="${colorScheme.primary}" opacity="0.1"/>
        <path d="M 200 550 L 350 250 L 450 350 L 600 550 Z" fill="${colorScheme.primary}"/>
        <path d="M 250 500 L 350 300 L 450 400 L 550 500 Z" fill="${colorScheme.secondary}"/>
      `
      break
      
    case 'estime':
      // Star/achievement icon
      iconPath = `
        <circle cx="400" cy="400" r="130" fill="${colorScheme.primary}" opacity="0.1"/>
        <path d="M 400 280 L 430 370 L 520 370 L 445 430 L 470 520 L 400 460 L 330 520 L 355 430 L 280 370 L 370 370 Z" fill="${colorScheme.primary}"/>
        <circle cx="400" cy="400" r="20" fill="white"/>
      `
      break
      
    case 'affirmation':
      // Shield/protection icon
      iconPath = `
        <circle cx="400" cy="400" r="125" fill="${colorScheme.primary}" opacity="0.1"/>
        <path d="M 400 250 L 500 300 L 500 450 L 400 550 L 300 450 L 300 300 Z" fill="${colorScheme.primary}"/>
        <path d="M 350 350 L 400 400 L 450 350" stroke="white" stroke-width="8" fill="none" stroke-linecap="round"/>
      `
      break
      
    case 'detente':
      // Moon/relaxation icon
      iconPath = `
        <circle cx="400" cy="400" r="130" fill="${colorScheme.primary}" opacity="0.1"/>
        <path d="M 350 300 Q 300 400, 350 500 Q 400 550, 450 500 Q 500 400, 450 300 Q 400 250, 350 300" fill="${colorScheme.primary}"/>
        <path d="M 380 350 Q 330 400, 380 450 Q 400 480, 420 450 Q 470 400, 420 350 Q 400 320, 380 350" fill="${colorScheme.secondary}"/>
      `
      break
      
    case 'lacher-prise':
      // Cloud/floating icon
      iconPath = `
        <circle cx="400" cy="400" r="135" fill="${colorScheme.primary}" opacity="0.1"/>
        <path d="M 300 450 Q 250 400, 300 350 Q 350 300, 400 350 Q 450 300, 500 350 Q 550 400, 500 450 Q 550 500, 500 550 Q 450 600, 400 550 Q 350 600, 300 550 Q 250 500, 300 450" fill="${colorScheme.primary}"/>
      `
      break
      
    case 'couleurs':
      // Colorful circles icon
      iconPath = `
        <circle cx="400" cy="400" r="140" fill="${colorScheme.primary}" opacity="0.1"/>
        <circle cx="300" cy="350" r="60" fill="#EF4444" opacity="0.8"/>
        <circle cx="500" cy="350" r="60" fill="#3B82F6" opacity="0.8"/>
        <circle cx="400" cy="500" r="60" fill="#10B981" opacity="0.8"/>
        <circle cx="350" cy="450" r="40" fill="#F59E0B" opacity="0.7"/>
        <circle cx="450" cy="450" r="40" fill="#8B5CF6" opacity="0.7"/>
      `
      break
      
    case 'paysages':
      // Landscape/nature icon
      iconPath = `
        <circle cx="400" cy="400" r="140" fill="${colorScheme.primary}" opacity="0.1"/>
        <circle cx="400" cy="550" r="200" fill="${colorScheme.secondary}"/>
        <ellipse cx="400" cy="300" rx="180" ry="100" fill="${colorScheme.primary}"/>
        <circle cx="350" cy="280" r="30" fill="white" opacity="0.9"/>
        <circle cx="450" cy="260" r="25" fill="white" opacity="0.7"/>
      `
      break
      
    case 'valeurs':
      // Compass/guidance icon
      iconPath = `
        <circle cx="400" cy="400" r="130" fill="${colorScheme.primary}" opacity="0.1"/>
        <circle cx="400" cy="400" r="100" stroke="${colorScheme.primary}" stroke-width="6" fill="none"/>
        <path d="M 400 300 L 410 390 L 400 400 L 390 390 Z" fill="${colorScheme.primary}"/>
        <path d="M 300 400 L 390 410 L 400 400 L 390 390 Z" fill="${colorScheme.secondary}"/>
        <circle cx="400" cy="400" r="15" fill="${colorScheme.primary}"/>
      `
      break
      
    default:
      // Default meditation icon (lotus/flower)
      iconPath = `
        <circle cx="400" cy="400" r="130" fill="${colorScheme.primary}" opacity="0.1"/>
        <circle cx="400" cy="400" r="80" fill="${colorScheme.secondary}" opacity="0.3"/>
        <path d="M 400 280 L 420 360 L 400 400 L 380 360 Z" fill="${colorScheme.primary}"/>
        <path d="M 520 400 L 440 420 L 400 400 L 440 380 Z" fill="${colorScheme.primary}"/>
        <path d="M 400 520 L 380 440 L 400 400 L 420 440 Z" fill="${colorScheme.primary}"/>
        <path d="M 280 400 L 360 380 L 400 400 L 360 420 Z" fill="${colorScheme.primary}"/>
        <circle cx="400" cy="400" r="40" fill="${colorScheme.primary}"/>
      `
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorScheme.gradient1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorScheme.gradient2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${svgSize}" height="${svgSize}" fill="url(#grad1)"/>
  ${iconPath}
</svg>`
}

// Trouve le type d'icône pour un audio
function getIconTypeForAudio(audio) {
  const title = audio.title.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const category = audio.category?.toLowerCase().trim()

  // Coaching mental
  if (category === 'coaching mental') {
    return 'coaching'
  }

  // Détection par mots-clés dans le titre (ordre important pour éviter les conflits)
  if (title.includes('anxiete') || title.includes('anxiete')) return 'anxiete'
  if (title.includes('gratitude')) return 'gratitude'
  if (title.includes('confiance')) return 'confiance'
  if (title.includes('estime')) return 'estime'
  if (title.includes('affirmation')) return 'affirmation'
  if (title.includes('detente') || title.includes('corporelle')) return 'detente'
  if (title.includes('lacher') || title.includes('lacher prise') || title.includes('lacher-prise')) return 'lacher-prise'
  if (title.includes('couleurs')) return 'couleurs'
  if (title.includes('paysages')) return 'paysages'
  if (title.includes('valeurs')) return 'valeurs'

  return 'meditation' // default pour les méditations guidées
}

// Upload un SVG vers S3
async function uploadSVGToS3(svgContent, s3Key) {
  try {
    const svgBuffer = Buffer.from(svgContent, 'utf-8')
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: svgBuffer,
      ContentType: 'image/svg+xml',
      CacheControl: 'max-age=31536000',
    })

    await s3Client.send(command)
    
    const publicUrl = `https://${BUCKET_NAME}.s3.${awsRegion}.amazonaws.com/${s3Key}`
    return publicUrl
  } catch (error) {
    throw new Error(`Failed to upload SVG: ${error.message}`)
  }
}

// Met à jour les thumbnails pour tous les audios
async function updateAudioThumbnails() {
  try {
    console.log('📥 Récupération des audios depuis Supabase...')

    // Récupérer tous les audios publiés
    const { data: audios, error: fetchError } = await supabase
      .from('audios')
      .select('*')
      .eq('isPublished', true)

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des audios:', fetchError)
      return
    }

    if (!audios || audios.length === 0) {
      console.log('ℹ️  Aucun audio trouvé')
      return
    }

    console.log(`✅ ${audios.length} audio(s) trouvé(s)\n`)

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const audio of audios) {
      try {
        // Forcer la mise à jour si FORCE_UPDATE est défini ou si --force est passé en argument
        const forceUpdate = process.env.FORCE_UPDATE === 'true' || process.argv.includes('--force')
        if (audio.thumbnail && !forceUpdate) {
          console.log(`⏭️  Audio "${audio.title}" a déjà une thumbnail, skip`)
          skippedCount++
          continue
        }

        console.log(`🖼️  Traitement: "${audio.title}" (${audio.category})`)

        // Déterminer le type d'icône
        const iconType = getIconTypeForAudio(audio)
        console.log(`   🎨 Type d'icône: ${iconType}`)

        // Générer le SVG
        const svgContent = generateSVGIcon(iconType, audio.title)
        
        // Générer une clé S3 pour la thumbnail
        const thumbnailKey = `thumbnails/audios/${audio.id}.svg`

        // Uploader le SVG vers S3
        console.log(`   📤 Upload de l'icône SVG...`)
        const s3Url = await uploadSVGToS3(svgContent, thumbnailKey)
        console.log(`   ✅ Icône uploadée: ${s3Url}`)

        // Mettre à jour l'enregistrement audio dans Supabase
        const { error: updateError } = await supabase
          .from('audios')
          .update({ thumbnail: s3Url })
          .eq('id', audio.id)

        if (updateError) {
          console.error(`   ❌ Erreur lors de la mise à jour: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`   ✅ Thumbnail mise à jour pour "${audio.title}"\n`)
          updatedCount++
        }

        // Attendre un peu pour éviter de surcharger
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (error) {
        console.error(`   ❌ Erreur pour "${audio.title}":`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 Résumé:')
    console.log(`   ✅ Mis à jour: ${updatedCount}`)
    console.log(`   ⏭️  Ignorés: ${skippedCount}`)
    console.log(`   ❌ Erreurs: ${errorCount}`)

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le script
if (require.main === module) {
  // Forcer la mise à jour si spécifié
  if (process.argv.includes('--force')) {
    process.env.FORCE_UPDATE = 'true'
  }
  
  updateAudioThumbnails()
    .then(() => {
      console.log('\n✨ Script terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { updateAudioThumbnails }
