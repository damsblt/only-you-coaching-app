/**
 * Script pour détecter les métadonnées potentiellement mal matchées
 * Compare le titre de la vidéo avec les métadonnées pour trouver des incohérences
 */

import { neon } from '@neondatabase/serverless'
import ws from 'ws'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Configure Neon for Node.js
if (typeof window === 'undefined') {
  const { neonConfig } = await import('@neondatabase/serverless')
  neonConfig.webSocketConstructor = ws
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(databaseUrl)

console.log('🔍 Détection des métadonnées potentiellement incorrectes...\n')

// Récupérer toutes les vidéos avec métadonnées
const videos = await sql`
  SELECT id, title, "startingPosition", movement, targeted_muscles, intensity, series, constraints, theme
  FROM videos_new
  WHERE "videoType" = 'MUSCLE_GROUPS'
  AND ("startingPosition" IS NOT NULL OR movement IS NOT NULL)
`

console.log(`📊 ${videos.length} vidéos avec métadonnées à vérifier\n`)

const mismatches = []

for (const video of videos) {
  const titleLower = video.title.toLowerCase()
  const positionLower = (video.startingPosition || '').toLowerCase()
  const movementLower = (video.movement || '').toLowerCase()
  const combinedMetadata = positionLower + ' ' + movementLower
  
  const issues = []
  
  // Vérifier les incohérences équipement
  if (titleLower.includes('poulie') && !combinedMetadata.includes('poulie') && (combinedMetadata.includes('barre') || combinedMetadata.includes('haltère'))) {
    issues.push('Titre mentionne POULIE mais métadonnées parlent de BARRE/HALTÈRE')
  }
  
  if (titleLower.includes('barre') && !combinedMetadata.includes('barre') && combinedMetadata.includes('poulie')) {
    issues.push('Titre mentionne BARRE mais métadonnées parlent de POULIE')
  }
  
  if (titleLower.includes('haltère') && !combinedMetadata.includes('haltère') && (combinedMetadata.includes('barre') || combinedMetadata.includes('poulie'))) {
    issues.push('Titre mentionne HALTÈRE mais métadonnées parlent de BARRE/POULIE')
  }
  
  if (titleLower.includes('élastique') && !combinedMetadata.includes('élastique') && (combinedMetadata.includes('barre') || combinedMetadata.includes('haltère') || combinedMetadata.includes('poulie'))) {
    issues.push('Titre mentionne ÉLASTIQUE mais métadonnées parlent de BARRE/HALTÈRE/POULIE')
  }
  
  if (titleLower.includes('ballon') && !combinedMetadata.includes('ballon') && combinedMetadata.length > 20) {
    issues.push('Titre mentionne BALLON mais métadonnées ne le mentionnent pas')
  }
  
  if (titleLower.includes('bosu') && !combinedMetadata.includes('bosu') && combinedMetadata.length > 20) {
    issues.push('Titre mentionne BOSU mais métadonnées ne le mentionnent pas')
  }
  
  if (titleLower.includes('trx') && !combinedMetadata.includes('trx') && combinedMetadata.length > 20) {
    issues.push('Titre mentionne TRX mais métadonnées ne le mentionnent pas')
  }
  
  // Vérifier les incohérences de position
  if (titleLower.includes('debout') && combinedMetadata.includes('couché') && !combinedMetadata.includes('debout')) {
    issues.push('Titre mentionne DEBOUT mais métadonnées parlent de COUCHÉ')
  }
  
  if (titleLower.includes('couché') && combinedMetadata.includes('debout') && !combinedMetadata.includes('couché')) {
    issues.push('Titre mentionne COUCHÉ mais métadonnées parlent de DEBOUT')
  }
  
  if (titleLower.includes('assis') && !combinedMetadata.includes('assis') && combinedMetadata.includes('debout') && combinedMetadata.length > 20) {
    issues.push('Titre mentionne ASSIS mais métadonnées parlent de DEBOUT')
  }
  
  if (issues.length > 0) {
    mismatches.push({
      title: video.title,
      id: video.id,
      issues,
      positionPreview: video.startingPosition ? video.startingPosition.substring(0, 80) + '...' : 'N/A',
      movementPreview: video.movement ? video.movement.substring(0, 80) + '...' : 'N/A'
    })
  }
}

if (mismatches.length === 0) {
  console.log('✅ Aucune incohérence détectée!')
} else {
  console.log(`⚠️  ${mismatches.length} incohérences potentielles détectées:\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  mismatches.forEach((mismatch, index) => {
    console.log(`${index + 1}. ${mismatch.title}`)
    mismatch.issues.forEach(issue => {
      console.log(`   ⚠️  ${issue}`)
    })
    console.log(`   Position: ${mismatch.positionPreview}`)
    console.log(`   Mouvement: ${mismatch.movementPreview}`)
    console.log()
  })
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n💡 Recommandation: Vérifier ces vidéos et corriger les métadonnées si nécessaire`)
}

console.log('\n✅ Vérification terminée!')
process.exit(0)
