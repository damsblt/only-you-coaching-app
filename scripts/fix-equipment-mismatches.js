/**
 * Script pour corriger les métadonnées incorrectes où l'équipement ne correspond pas
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

console.log('🔧 Correction des métadonnées avec équipement incorrect...\n')

// Récupérer les vidéos avec incohérences équipement
const videos = await sql`
  SELECT id, title, "startingPosition", movement
  FROM videos_new
  WHERE "videoType" = 'MUSCLE_GROUPS'
  AND ("startingPosition" IS NOT NULL OR movement IS NOT NULL)
`

let fixedCount = 0
const fixes = []

for (const video of videos) {
  const titleLower = video.title.toLowerCase()
  const positionLower = (video.startingPosition || '').toLowerCase()
  const movementLower = (video.movement || '').toLowerCase()
  const combinedMetadata = positionLower + ' ' + movementLower
  
  let needsFix = false
  let reason = ''
  
  // Détecter les incohérences critiques d'équipement
  if (titleLower.includes('poulie') && !combinedMetadata.includes('poulie') && 
      (combinedMetadata.includes('barre') || combinedMetadata.includes('haltère'))) {
    needsFix = true
    reason = 'Titre: POULIE, Métadonnées: BARRE/HALTÈRE'
  } else if (titleLower.includes('barre') && !titleLower.includes('barre au sol') && 
             !combinedMetadata.includes('barre') && combinedMetadata.includes('poulie')) {
    needsFix = true
    reason = 'Titre: BARRE, Métadonnées: POULIE'
  } else if (titleLower.includes('haltère') && !combinedMetadata.includes('haltère') && 
             (combinedMetadata.includes('barre') || combinedMetadata.includes('poulie'))) {
    needsFix = true
    reason = 'Titre: HALTÈRE, Métadonnées: BARRE/POULIE'
  } else if (titleLower.includes('élastique') && !combinedMetadata.includes('élastique') && 
             (combinedMetadata.includes('barre') || combinedMetadata.includes('haltère') || combinedMetadata.includes('poulie'))) {
    needsFix = true
    reason = 'Titre: ÉLASTIQUE, Métadonnées: BARRE/HALTÈRE/POULIE'
  }
  
  if (needsFix) {
    fixes.push({ title: video.title, id: video.id, reason })
    
    // Réinitialiser les métadonnées incorrectes
    await sql`
      UPDATE videos_new
      SET 
        "startingPosition" = NULL,
        movement = NULL,
        targeted_muscles = '{}',
        intensity = NULL,
        series = NULL,
        constraints = NULL,
        theme = NULL,
        difficulty = 'indéfini',
        "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${video.id}
    `
    
    fixedCount++
  }
}

if (fixedCount === 0) {
  console.log('✅ Aucune incohérence d\'équipement critique détectée!')
} else {
  console.log(`🔧 ${fixedCount} vidéos corrigées (métadonnées réinitialisées):\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  fixes.forEach((fix, index) => {
    console.log(`${index + 1}. ${fix.title}`)
    console.log(`   ⚠️  ${fix.reason}`)
    console.log()
  })
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n💡 Ces vidéos sont maintenant sans métadonnées jusqu'à ce que les bonnes soient trouvées.`)
}

console.log('\n✅ Correction terminée!')
process.exit(0)
