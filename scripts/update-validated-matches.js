/**
 * Script pour mettre à jour les vidéos MUSCLE_GROUPS dans Neon
 * avec les métadonnées des vidéos PROGRAMMES validées
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

// Chemins vers les fichiers
const VALIDATION_FILE = path.join(__dirname, '..', 'temp', 'matches-in-programmes.txt')
const JSON_FILE = path.join(__dirname, '..', 'temp', 'matches-in-programmes.json')

/**
 * Parse le fichier de validation pour trouver les correspondances validées
 */
function parseValidatedMatches() {
  // D'abord, essayer de lire le JSON pour avoir les métadonnées complètes
  let jsonData = null
  if (fs.existsSync(JSON_FILE)) {
    jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'))
  }
  
  // Parser le fichier texte pour trouver les validations
  const content = fs.readFileSync(VALIDATION_FILE, 'utf8')
  const lines = content.split('\n')
  const validatedMatches = []
  
  let currentVideoId = null
  let currentProgrammeId = null
  let currentVideoTitle = null
  let currentProgrammeTitle = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détecter une ligne avec ID vidéo
    const videoIdMatch = line.match(/ID:\s+([a-f0-9-]+)/i)
    if (videoIdMatch) {
      currentVideoId = videoIdMatch[1]
    }
    
    // Détecter une ligne avec ID Programme
    const programmeIdMatch = line.match(/ID Programme:\s+([a-f0-9-]+)/i)
    if (programmeIdMatch) {
      currentProgrammeId = programmeIdMatch[1]
    }
    
    // Détecter le titre de la vidéo MUSCLE_GROUPS
    const videoTitleMatch = line.match(/VIDÉO MUSCLE_GROUPS:\s+(.+)/i)
    if (videoTitleMatch) {
      currentVideoTitle = videoTitleMatch[1].trim()
    }
    
    // Détecter le titre du programme
    const programmeTitleMatch = line.match(/→ CORRESPONDANCE PROGRAMME:\s+(.+)/i)
    if (programmeTitleMatch) {
      currentProgrammeTitle = programmeTitleMatch[1].trim()
    }
    
    // Détecter une validation OUI
    if (line.match(/\[x\]\s*OUI/i) || line.match(/\[X\]\s*OUI/i)) {
      if (currentVideoId && currentProgrammeId) {
        // Chercher les métadonnées dans le JSON si disponible
        let metadata = null
        if (jsonData && jsonData.matches) {
          const match = jsonData.matches.find(m => 
            m.videoId === currentVideoId && m.programmeVideoId === currentProgrammeId
          )
          if (match) {
            metadata = match.metadata
          }
        }
        
        validatedMatches.push({
          videoId: currentVideoId,
          videoTitle: currentVideoTitle,
          programmeId: currentProgrammeId,
          programmeTitle: currentProgrammeTitle,
          metadata: metadata
        })
        // Reset pour éviter les doublons
        currentVideoId = null
        currentProgrammeId = null
        currentVideoTitle = null
        currentProgrammeTitle = null
      }
    }
  }
  
  return validatedMatches
}

async function updateValidatedMatches() {
  try {
    console.log('📖 Lecture du fichier de validation...\n')
    
    if (!fs.existsSync(VALIDATION_FILE)) {
      console.error(`❌ Fichier de validation non trouvé: ${VALIDATION_FILE}`)
      process.exit(1)
    }
    
    const validatedMatches = parseValidatedMatches(VALIDATION_FILE)
    console.log(`✅ ${validatedMatches.length} correspondance(s) validée(s) trouvée(s)\n`)
    
    if (validatedMatches.length === 0) {
      console.log('⚠️  Aucune correspondance validée. Aucune mise à jour nécessaire.')
      return
    }
    
    // Afficher les correspondances validées
    console.log('📋 Correspondances validées:')
    validatedMatches.forEach((match, index) => {
      console.log(`\n${index + 1}. ${match.videoTitle}`)
      console.log(`   Video ID: ${match.videoId}`)
      console.log(`   Programme: ${match.programmeTitle}`)
      console.log(`   Programme ID: ${match.programmeId}`)
    })
    
    // Mettre à jour chaque vidéo MUSCLE_GROUPS
    console.log('🔄 Mise à jour des vidéos MUSCLE_GROUPS...\n')
    
    const results = []
    
    for (const match of validatedMatches) {
      // Utiliser les métadonnées du JSON si disponibles, sinon récupérer depuis la DB
      let metadata = match.metadata
      
      if (!metadata) {
        // Récupérer depuis la base de données
        const programmeVideo = await sql`
          SELECT 
            "muscleGroups",
            "startingPosition",
            movement,
            intensity,
            series,
            constraints,
            theme,
            description
          FROM videos_new
          WHERE id = ${match.programmeId}
        `
        
        if (!programmeVideo || programmeVideo.length === 0) {
          console.log(`⚠️  Vidéo PROGRAMME non trouvée: ${match.programmeId}`)
          results.push({
            videoId: match.videoId,
            videoTitle: match.videoTitle,
            status: 'error',
            message: 'Vidéo PROGRAMME non trouvée'
          })
          continue
        }
        
        metadata = programmeVideo[0]
      }
      
      // Préparer les métadonnées à mettre à jour
      const cleanUpdates = {
        muscleGroups: metadata.muscleGroups && Array.isArray(metadata.muscleGroups) && metadata.muscleGroups.length > 0 
          ? metadata.muscleGroups 
          : null,
        startingPosition: metadata.startingPosition && metadata.startingPosition.trim() !== '' 
          ? metadata.startingPosition.trim() 
          : null,
        movement: metadata.movement && metadata.movement.trim() !== '' 
          ? metadata.movement.trim() 
          : null,
        intensity: metadata.intensity && metadata.intensity.trim() !== '' 
          ? metadata.intensity.trim() 
          : null,
        series: metadata.series && metadata.series.trim() !== '' 
          ? metadata.series.trim() 
          : null,
        constraints: metadata.constraints && metadata.constraints.trim() !== '' 
          ? metadata.constraints.trim() 
          : null,
        theme: metadata.theme && metadata.theme.trim() !== '' 
          ? metadata.theme.trim() 
          : null,
        description: metadata.description && metadata.description.trim() !== '' 
          ? metadata.description.trim() 
          : null,
        updatedAt: new Date().toISOString()
      }
      
      try {
        console.log(`📝 Mise à jour: ${match.videoTitle}`)
        
        // Construire la requête UPDATE avec les valeurs non-null
        const updateResult = await sql`
          UPDATE videos_new 
          SET 
            "muscleGroups" = ${cleanUpdates.muscleGroups}::text[],
            "startingPosition" = ${cleanUpdates.startingPosition},
            movement = ${cleanUpdates.movement},
            intensity = ${cleanUpdates.intensity},
            series = ${cleanUpdates.series},
            constraints = ${cleanUpdates.constraints},
            theme = ${cleanUpdates.theme},
            description = ${cleanUpdates.description},
            "updatedAt" = ${cleanUpdates.updatedAt}::timestamp with time zone
          WHERE id = ${match.videoId}
          RETURNING id, title, "muscleGroups", "startingPosition", movement, intensity, 
                    series, constraints, theme, description
        `
        
        if (updateResult && updateResult.length > 0) {
          console.log(`   ✅ Mise à jour réussie`)
          results.push({
            videoId: match.videoId,
            videoTitle: match.videoTitle,
            status: 'success',
            updated: updateResult[0]
          })
        } else {
          console.log(`   ⚠️  Aucune ligne mise à jour`)
          results.push({
            videoId: match.videoId,
            videoTitle: match.videoTitle,
            status: 'warning',
            message: 'Aucune ligne mise à jour'
          })
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`)
        results.push({
          videoId: match.videoId,
          videoTitle: match.videoTitle,
          status: 'error',
          message: error.message
        })
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(100))
    console.log('📊 RÉSUMÉ DES MISES À JOUR')
    console.log('='.repeat(100))
    
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const warningCount = results.filter(r => r.status === 'warning').length
    
    console.log(`Total correspondances validées: ${validatedMatches.length}`)
    console.log(`✅ Mises à jour réussies: ${successCount}`)
    console.log(`⚠️  Avertissements: ${warningCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log('='.repeat(100))
    
    // Sauvegarder le rapport
    const outputDir = path.join(__dirname, '..', 'temp')
    const reportFile = path.join(outputDir, 'update-results.json')
    fs.writeFileSync(reportFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalValidated: validatedMatches.length,
      results: results
    }, null, 2), 'utf8')
    
    console.log(`\n💾 Rapport sauvegardé dans: ${reportFile}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

// Exécuter le script
updateValidatedMatches()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
