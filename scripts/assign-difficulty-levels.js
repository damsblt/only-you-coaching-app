#!/usr/bin/env node
/**
 * Script pour attribuer automatiquement un niveau (difficulty) à chaque vidéo
 * basé sur les métadonnées disponibles (titre, description, intensity, etc.)
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

/**
 * Normalise les valeurs de difficulté vers les valeurs standardisées
 * Utilise les valeurs en majuscules pour correspondre à l'UI
 */
function normalizeDifficulty(value) {
  if (!value) return null
  
  const lower = value.toLowerCase().trim()
  
  // Mapping vers les valeurs standardisées (majuscules pour correspondre à l'UI)
  if (lower.includes('debutant') || lower.includes('débutant') || lower.includes('beginner')) {
    return 'BEGINNER'
  }
  if (lower.includes('intermediaire') || lower.includes('intermédiaire') || lower.includes('intermediate')) {
    return 'INTERMEDIATE'
  }
  if (lower.includes('avance') || lower.includes('avancé') || lower.includes('advanced')) {
    return 'ADVANCED'
  }
  
  return null
}

/**
 * Détermine le niveau à partir des métadonnées d'une vidéo
 */
function determineDifficultyFromMetadata(video) {
  // 1. Vérifier le champ intensity (priorité la plus haute)
  if (video.intensity) {
    const difficulty = normalizeDifficulty(video.intensity)
    if (difficulty) {
      return { source: 'intensity', value: difficulty }
    }
  }
  
  // 2. Vérifier le champ difficulty existant
  if (video.difficulty) {
    const difficulty = normalizeDifficulty(video.difficulty)
    if (difficulty) {
      return { source: 'difficulty', value: difficulty }
    }
  }
  
  // 3. Analyser le titre
  if (video.title) {
    const titleLower = video.title.toLowerCase()
    
    // Mots-clés pour débutant
    if (titleLower.match(/\b(debutant|débutant|beginner|niveau\s*1|level\s*1|facile|easy|simple)\b/)) {
      return { source: 'title', value: 'BEGINNER' }
    }
    
    // Mots-clés pour avancé
    if (titleLower.match(/\b(avance|avancé|advanced|niveau\s*3|level\s*3|difficile|hard|complexe)\b/)) {
      return { source: 'title', value: 'ADVANCED' }
    }
    
    // Mots-clés pour intermédiaire
    if (titleLower.match(/\b(intermediaire|intermédiaire|intermediate|niveau\s*2|level\s*2|moyen|medium)\b/)) {
      return { source: 'title', value: 'INTERMEDIATE' }
    }
  }
  
  // 4. Analyser la description
  if (video.description) {
    const descLower = video.description.toLowerCase()
    
    if (descLower.match(/\b(debutant|débutant|beginner|niveau\s*1|level\s*1|facile|easy)\b/)) {
      return { source: 'description', value: 'BEGINNER' }
    }
    
    if (descLower.match(/\b(avance|avancé|advanced|niveau\s*3|level\s*3|difficile|hard)\b/)) {
      return { source: 'description', value: 'ADVANCED' }
    }
    
    if (descLower.match(/\b(intermediaire|intermédiaire|intermediate|niveau\s*2|level\s*2|moyen)\b/)) {
      return { source: 'description', value: 'INTERMEDIATE' }
    }
  }
  
  // 5. Analyser le champ exo_title
  if (video.exo_title) {
    const exoLower = video.exo_title.toLowerCase()
    
    if (exoLower.match(/\b(debutant|débutant|beginner|niveau\s*1|level\s*1)\b/)) {
      return { source: 'exo_title', value: 'BEGINNER' }
    }
    
    if (exoLower.match(/\b(avance|avancé|advanced|niveau\s*3|level\s*3)\b/)) {
      return { source: 'exo_title', value: 'ADVANCED' }
    }
    
    if (exoLower.match(/\b(intermediaire|intermédiaire|intermediate|niveau\s*2|level\s*2)\b/)) {
      return { source: 'exo_title', value: 'INTERMEDIATE' }
    }
  }
  
  // 6. Par défaut, utiliser INTERMEDIATE si aucune indication n'est trouvée
  return { source: 'default', value: 'INTERMEDIATE' }
}

async function assignDifficultyLevels() {
  console.log('🔄 Attribution automatique des niveaux aux vidéos...\n')
  
  try {
    // Récupérer toutes les vidéos publiées
    const videos = await sql`
      SELECT 
        id,
        title,
        description,
        difficulty,
        intensity,
        exo_title,
        region,
        "videoType"
      FROM videos_new
      WHERE "isPublished" = true
      ORDER BY title
    `
    
    console.log(`📹 ${videos.length} vidéos trouvées\n`)
    
    let updatedCount = 0
    let skippedCount = 0
    const stats = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
      sources: {
        intensity: 0,
        difficulty: 0,
        title: 0,
        description: 0,
        exo_title: 0,
        default: 0
      }
    }
    
    for (const video of videos) {
      const result = determineDifficultyFromMetadata(video)
      
      // Vérifier si le niveau a changé
      const currentDifficulty = normalizeDifficulty(video.difficulty)
      const newDifficulty = result.value
      
      if (currentDifficulty === newDifficulty) {
        skippedCount++
        stats[newDifficulty]++
        continue
      }
      
      // Mettre à jour la vidéo
      await sql`
        UPDATE videos_new
        SET 
          difficulty = ${newDifficulty},
          "updatedAt" = NOW()
        WHERE id = ${video.id}
      `
      
      console.log(`✅ ${video.title.substring(0, 50)}... → ${newDifficulty} (${result.source})`)
      updatedCount++
      stats[newDifficulty]++
      stats.sources[result.source]++
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(80))
    console.log(`   Total vidéos: ${videos.length}`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⏭️  Déjà correct: ${skippedCount}`)
    console.log('\n📈 Répartition par niveau:')
    console.log(`   BEGINNER: ${stats.BEGINNER}`)
    console.log(`   INTERMEDIATE: ${stats.INTERMEDIATE}`)
    console.log(`   ADVANCED: ${stats.ADVANCED}`)
    console.log('\n🔍 Sources d\'attribution:')
    console.log(`   intensity: ${stats.sources.intensity}`)
    console.log(`   difficulty: ${stats.sources.difficulty}`)
    console.log(`   title: ${stats.sources.title}`)
    console.log(`   description: ${stats.sources.description}`)
    console.log(`   exo_title: ${stats.sources.exo_title}`)
    console.log(`   default: ${stats.sources.default}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

// Exécuter le script
assignDifficultyLevels()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
