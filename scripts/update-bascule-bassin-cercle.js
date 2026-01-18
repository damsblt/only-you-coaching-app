/**
 * Script pour mettre à jour les métadonnées de "Bascule du bassin en cercle"
 * avec les données de "Bascule de bassin en cercle assis ballon"
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function updateBasculeBassinCercle() {
  try {
    console.log('🔍 Recherche de la vidéo "Bascule du bassin en cercle"...\n')
    
    // Chercher la vidéo par titre (insensible à la casse)
    const videos = await sql`
      SELECT id, title, "muscleGroups", "startingPosition", movement, intensity, 
             series, constraints, theme, difficulty, category, region, description
      FROM videos_new
      WHERE LOWER(title) LIKE LOWER('%bascule%') 
        AND LOWER(title) LIKE LOWER('%bassin%')
        AND LOWER(title) LIKE LOWER('%cercle%')
      ORDER BY title
    `
    
    if (videos.length === 0) {
      console.log('❌ Aucune vidéo trouvée avec "Bascule du bassin en cercle"')
      console.log('💡 Vérifiez le titre exact dans la base de données\n')
      return
    }
    
    console.log(`📊 ${videos.length} vidéo(s) trouvée(s):\n`)
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} (ID: ${video.id})`)
    })
    console.log('')
    
    // Prendre la première vidéo trouvée (ou celle qui correspond le mieux)
    const video = videos[0]
    console.log(`📝 Mise à jour de: "${video.title}" (ID: ${video.id})\n`)
    
    // Métadonnées à mettre à jour
    const updates = {
      // Titre - garder le titre existant ou mettre à jour si nécessaire
      // title: "Bascule de bassin en cercle assis ballon", // Optionnel: changer le titre
      
      // Muscle cible
      muscleGroups: ['Lombaires', 'Abdominaux'],
      
      // Position de départ
      startingPosition: 'Assis sur le ballon avec la courbe lombaire neutre. Allonger la colonne vertébrale.',
      
      // Mouvement
      movement: 'Basculer le bassin vers l\'avant, le côté, l\'arrière et de l\'autre côté en faisant un cercle. Revenir en position de départ lentement en allongeant la colonne vertébrale. Tenir les abdominaux.',
      
      // Intensité
      intensity: 'Tout niveau',
      
      // Série
      series: '2x 10 à 12 répétitions',
      
      // Contre-indication
      constraints: 'Aucune',
      
      // Thème
      theme: 'bascule du bassin',
      
      // Description (inclut les détails complets)
      description: 'Position de départ: Assis sur le ballon avec la courbe lombaire neutre. Allonger la colonne vertébrale. Mouvement: Basculer le bassin vers l\'avant, le côté, l\'arrière et de l\'autre côté en faisant un cercle. Revenir en position de départ lentement en allongeant la colonne vertébrale. Tenir les abdominaux. Intensité: Tout niveau. Série: 2x 10 à 12 répétitions. Contre-indication: Aucune.',
      
      // Difficulté (normaliser "Tout niveau" en "ALL_LEVELS" ou garder selon votre système)
      difficulty: video.difficulty || 'ALL_LEVELS',
      
      // Catégorie
      category: video.category || 'Core',
      
      // Région
      region: video.region || 'Lombaires',
      
      // Date de mise à jour
      updatedAt: new Date().toISOString()
    }
    
    console.log('📋 Métadonnées à mettre à jour:')
    console.log(JSON.stringify(updates, null, 2))
    console.log('')
    
    // Construire la requête UPDATE
    const setClause = Object.keys(updates)
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(', ')
    
    const values = Object.values(updates)
    values.push(video.id) // Pour la clause WHERE
    
    const updateQuery = `
      UPDATE videos_new 
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING id, title, "muscleGroups", "startingPosition", movement, intensity, 
                series, constraints, theme, description, "detailedDescription"
    `
    
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
updateBasculeBassinCercle()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
