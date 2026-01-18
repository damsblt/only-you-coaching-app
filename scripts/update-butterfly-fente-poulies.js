/**
 * Script pour mettre à jour les métadonnées de "Butterfly position de fente + poulies hautes"
 * avec les données combinées de "Butterfly debout à la poulie haute" et position de fente
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function updateButterflyFentePoulies() {
  try {
    console.log('🔍 Recherche de la vidéo "Butterfly position de fente + poulies hautes"...\n')
    
    // Chercher la vidéo par titre
    const videos = await sql`
      SELECT id, title, "muscleGroups", "startingPosition", movement, intensity, 
             series, constraints, theme, difficulty, category, region, description
      FROM videos_new
      WHERE LOWER(title) LIKE LOWER('%butterfly%') 
        AND LOWER(title) LIKE LOWER('%fente%')
        AND LOWER(title) LIKE LOWER('%poulie%')
      ORDER BY title
    `
    
    if (videos.length === 0) {
      console.log('❌ Aucune vidéo trouvée avec "Butterfly position de fente + poulies hautes"')
      return
    }
    
    console.log(`📊 ${videos.length} vidéo(s) trouvée(s):\n`)
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} (ID: ${video.id})`)
    })
    console.log('')
    
    // Prendre la première vidéo trouvée
    const video = videos[0]
    console.log(`📝 Mise à jour de: "${video.title}" (ID: ${video.id})\n`)
    
    // Métadonnées à mettre à jour (combinées de "Butterfly debout à la poulie haute" + position de fente)
    const updates = {
      // Muscle cible (de Butterfly debout à la poulie haute)
      muscleGroups: ['Pectoraux', 'Épaule'],
      
      // Position de départ (combinaison: position de fente + bras comme Butterfly)
      startingPosition: 'Une jambe en avant fléchie, l\'autre en arrière. Les bras tendus sur le côté à hauteur des épaules avec les coudes légèrement fléchis. Les mains et les coudes sont sous les épaules. Courbe lombaire neutre.',
      
      // Mouvement (de Butterfly debout à la poulie haute)
      movement: 'Tirer les poulies et rejoindre les deux mains à hauteur du bassin sans bloquer les coudes. Revenir bras tendus à hauteur des épaules sans bloquer les coudes. Tenir les abdominaux.',
      
      // Intensité
      intensity: 'Tout niveau',
      
      // Série
      series: '3x 12 répétitions',
      
      // Contre-indication
      constraints: 'Épaule',
      
      // Thème
      theme: 'Butterfly',
      
      // Description complète
      description: 'Position de départ: Une jambe en avant fléchie, l\'autre en arrière. Les bras tendus sur le côté à hauteur des épaules avec les coudes légèrement fléchis. Les mains et les coudes sont sous les épaules. Courbe lombaire neutre. Mouvement: Tirer les poulies et rejoindre les deux mains à hauteur du bassin sans bloquer les coudes. Revenir bras tendus à hauteur des épaules sans bloquer les coudes. Tenir les abdominaux. Intensité: Tout niveau. Série: 3x 12 répétitions. Contre-indication: Épaule.',
      
      // Difficulté (garder celle existante ou mettre par défaut)
      difficulty: video.difficulty || 'ALL_LEVELS',
      
      // Catégorie
      category: video.category || 'Muscle Groups',
      
      // Région
      region: video.region || 'Pectoraux',
      
      // Date de mise à jour
      updatedAt: new Date().toISOString()
    }
    
    console.log('📋 Métadonnées à mettre à jour:')
    console.log(JSON.stringify(updates, null, 2))
    console.log('')
    
    console.log('🔄 Exécution de la mise à jour...\n')
    
    const result = await sql`
      UPDATE videos_new 
      SET 
        "muscleGroups" = ${updates.muscleGroups}::text[],
        "startingPosition" = ${updates.startingPosition},
        movement = ${updates.movement},
        intensity = ${updates.intensity},
        series = ${updates.series},
        constraints = ${updates.constraints},
        theme = ${updates.theme},
        description = ${updates.description},
        "updatedAt" = ${updates.updatedAt}::timestamp with time zone
      WHERE id = ${video.id}
      RETURNING id, title, "muscleGroups", "startingPosition", movement, intensity, 
                series, constraints, theme, description
    `
    
    if (result && result.length > 0) {
      console.log('✅ Mise à jour réussie!\n')
      console.log('📊 Données mises à jour:')
      console.log(JSON.stringify(result[0], null, 2))
    } else {
      console.log('⚠️  Aucune ligne mise à jour')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

// Exécuter le script
updateButterflyFentePoulies()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
