/**
 * Script simplifié pour mettre à jour les métadonnées des vidéos Machine dans Neon
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

// Mapping des métadonnées par titre
const metadataMap = {
  "fessier jambe presse à cuisse horizontale": {
    description: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    startingPosition: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    movement: "Descendre le siège vers le plateau en fléchissant les genoux jusqu'à faire un angle de 90°. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier jambe presse à cuisse incliné": {
    description: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    startingPosition: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    movement: "Descendre le siège vers le plateau en fléchissant les genoux jusqu'à faire un angle de 90°. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier jambe presse à cuisse verticale": {
    description: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    startingPosition: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    movement: "Descendre en fléchissant les genoux. Amener les arrières cuisses parallèlement au sol. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier jambe presse à cuisse verticale (2)": {
    description: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    startingPosition: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    movement: "Descendre en fléchissant les genoux. Amener les arrières cuisses parallèlement au sol. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier jambe extension de hanche à plat ventre": {
    description: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Un genou fléchit sur le siège et le pied de l'autre jambe sur le rouleau. La tête dans le prolongement de la colonne.",
    startingPosition: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Un genou fléchit sur le siège et le pied de l'autre jambe sur le rouleau. La tête dans le prolongement de la colonne.",
    movement: "Tendre la jambe arrière sans bloquer le genou. Revenir genou fléchi en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "ischios"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier jambe trust": {
    description: "Le haut du dos en appui sur le siège. Le bassin décollé. Les pieds sur le plateau un peu plus large que les épaules et les genoux fléchis. La sangle fermée à hauteur du pli de l'aine.",
    startingPosition: "Le haut du dos en appui sur le siège. Le bassin décollé. Les pieds sur le plateau un peu plus large que les épaules et les genoux fléchis. La sangle fermée à hauteur du pli de l'aine.",
    movement: "Descendre le fessier en fléchissant les genoux. Poussez sur les talons dans le sol et monter les hanches vers le plafond aussi haut que possible. Expirer sur le monté et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischios"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier jambe squat guidé à la machine smith": {
    description: "Debout, pieds parallèles vers l'avant et largeur des épaules. Placer la barre sur le haut du dos et non pas sur les cervicales.",
    startingPosition: "Debout, pieds parallèles vers l'avant et largeur des épaules. Placer la barre sur le haut du dos et non pas sur les cervicales.",
    movement: "Descendre en poussant le fessier légèrement vers l'arrière et fléchir les genoux. Les genoux peuvent avancer jusqu'à la pointe des pieds. Amener les arrières cuisses parallèlement au sol. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "niveau intermédiaire-avancé",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "avance"
  },
  "fessier jambe fente guidé sur smith": {
    description: "Aligner le genou de la jambe avant sous la cheville. Le genou de la jambe arrière est fléchit et la jambe relâchée. Positionner la barre sur le haut du dos et non pas sur la nuque.",
    startingPosition: "Aligner le genou de la jambe avant sous la cheville. Le genou de la jambe arrière est fléchit et la jambe relâchée. Positionner la barre sur le haut du dos et non pas sur la nuque.",
    movement: "Transférer le poids du corps sur la jambe avant. Descendre en poussant légèrement le fessier vers l'arrière. Amener l'arrière cuisse de la jambe avant parallèlement au sol au maximum. Remonter sans bloquer le genou et en maintenant l'axe genou-cheville. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "genoux",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "cuisse leg extension": {
    description: "Assis, le dos contre le siège. Les genoux entourent le bord du siège. Le rouleau est placé sur le coup du pied.",
    startingPosition: "Assis, le dos contre le siège. Les genoux entourent le bord du siège. Le rouleau est placé sur le coup du pied.",
    movement: "Tendre les 2 jambes en maintenant les genoux souples. Revenir en position de départ plus lentement.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "cuisse",
    targeted_muscles: ["cuisse"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "arrière cuisse leg curl": {
    description: "A plat ventre sur le siège. Les avant-bras et les coudes sur les coussinets. Les genoux juste en dehors du siège. Le rouleau est placé derrière la cheville.",
    startingPosition: "A plat ventre sur le siège. Les avant-bras et les coudes sur les coussinets. Les genoux juste en dehors du siège. Le rouleau est placé derrière la cheville.",
    movement: "Fléchir les deux genoux et amener le rouleau vers l'arrière cuisse. Revenir en position de départ plus lentement sans bloquer les genoux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "arrière cuisse",
    targeted_muscles: ["arrière cuisse"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "arrière cuisse à plat ventre": {
    description: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Les genoux en dehors du siège et le bas des mollets positionnés sous le rouleau. La tête dans le prolongement de la colonne.",
    startingPosition: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Les genoux en dehors du siège et le bas des mollets positionnés sous le rouleau. La tête dans le prolongement de la colonne.",
    movement: "Fléchir les genoux et amener le rouleau vers l'arrière cuisse. Revenir genou souple en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "ischios",
    targeted_muscles: ["ischios"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier abduction de hanche": {
    description: "Assis avec le dos contre le siège. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos contre le siège. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    movement: "Ouvrir le plus possible les hanches sans bouger le bassin. Revenir lentement en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier",
    targeted_muscles: ["abducteur", "TFL", "moyen fessier"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier abduction de hanche incliné": {
    description: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    movement: "Ouvrir le plus possible les hanches sans bouger le bassin. Revenir lentement en position de départ.",
    intensity: "niveau intermédiaire",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier",
    targeted_muscles: ["abducteur", "TFL", "moyen fessier"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "fessier abduction de hanche incliné + petits mouvements": {
    description: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    movement: "Ouvrir le plus possible les hanches sans bouger le bassin. Maintenir le mouvement et faire de petits mouvements.",
    intensity: "niveau intermédiaire",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier",
    targeted_muscles: ["abducteur", "TFL", "moyen fessier"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "cuisse (intérieur) adduction de hanche": {
    description: "Assis avec le dos contre le siège. Les genoux à l'extérieur des coussinets. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos contre le siège. Les genoux à l'extérieur des coussinets. Les pieds placer sur la première barre des plateaux.",
    movement: "Fermer le plus possible les hanches sans bouger le bassin. Revenir lentement en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "adducteur",
    targeted_muscles: ["adducteur"],
    muscleGroups: ["fessiers-jambes"],
    difficulty: "intermediaire"
  },
  "pectoraux développé assis": {
    description: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les coudes fléchis à 90° et les mains sont sous les épaules.",
    startingPosition: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les coudes fléchis à 90° et les mains sont sous les épaules.",
    movement: "Tendre les bras et les rejoindre en fin de mouvement sans bloquer les coudes. Revenir les coudes fléchis à 90°, légèrement derrière les épaules. Tenir les abdominaux.",
    intensity: "niveau débutant",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Pectoraux",
    targeted_muscles: ["pectoraux", "triceps"],
    muscleGroups: ["pectoraux"],
    difficulty: "debutant"
  },
  "pectoraux dv couché à la barre guidée smith": {
    description: "Couché sur le banc, courbe lombaire neutre et les pieds ancrés au sol. Les bras tendus avec la barre à hauteur du haut de la poitrine. Prise de la barre large.",
    startingPosition: "Couché sur le banc, courbe lombaire neutre et les pieds ancrés au sol. Les bras tendus avec la barre à hauteur du haut de la poitrine. Prise de la barre large.",
    movement: "Débloquer la barre en la soulevant et en tournant les poignets. Descendre la barre sur le haut de la poitrine en fléchissant les coudes. Remonter la barre bras tendu sans bloquer les coudes à hauteur du haut de la poitrine. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "Epaule, épicondylite",
    theme: "Pectoraux",
    targeted_muscles: ["pectoraux", "triceps"],
    muscleGroups: ["pectoraux"],
    difficulty: "intermediaire"
  },
  "pectoraux butterfly assis": {
    description: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les bras tendus et les mains sont sous les épaules.",
    startingPosition: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les bras tendus et les mains sont sous les épaules.",
    movement: "Amener les mains l'une contre l'autre vers l'avant. Revenir les coudes souples, légèrement derrière les épaules. Tenir les abdominaux.",
    intensity: "niveau débutant",
    series: "3x 12 répétitions",
    constraints: "épaule",
    theme: "Pectoraux",
    targeted_muscles: ["pectoraux", "triceps"],
    muscleGroups: ["pectoraux"],
    difficulty: "debutant"
  },
  "dos rowing": {
    description: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples.",
    startingPosition: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples.",
    movement: "Tirer les deux coudes vers l'arrière en serrant tout à la fois les omoplates. Revenir bras tendu sans bloquer les coudes. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Dos",
    targeted_muscles: ["Grand dorsal", "biceps"],
    muscleGroups: ["dos"],
    difficulty: "intermediaire"
  },
  "dos (haut) tirage assis": {
    description: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples en avant.",
    startingPosition: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples en avant.",
    movement: "Tirer les deux bras vers l'arrière en serrant tout à la fois les omoplates. Revenir bras tendu sans bloquer les coudes. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Dos",
    targeted_muscles: ["Haut du dos", "arrière de l'épaule"],
    muscleGroups: ["dos"],
    difficulty: "intermediaire"
  },
  "dos tirage poitrine lat pull down": {
    description: "Assis avec le dos légèrement incliné vers l'arrière. Les bras tendus vers le haut avec les coudes souples. Les cuisses maintenues sous le rouleau. Courbe lombaire neutre.",
    startingPosition: "Assis avec le dos légèrement incliné vers l'arrière. Les bras tendus vers le haut avec les coudes souples. Les cuisses maintenues sous le rouleau. Courbe lombaire neutre.",
    movement: "Tirer les deux coudes vers l'arrière et amener la barre au-dessus de la poitrine. Revenir bras tendu sans bloquer les coudes. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Dos",
    targeted_muscles: ["Grand dorsal", "biceps"],
    muscleGroups: ["dos"],
    difficulty: "intermediaire"
  },
  "dos banc à lombaire": {
    description: "Le haut des cuisses en appui sur le siège. Les pieds bloqués sur le plateau. Les bras sur la poitrine. Courbe lombaire neutre.",
    startingPosition: "Le haut des cuisses en appui sur le siège. Les pieds bloqués sur le plateau. Les bras sur la poitrine. Courbe lombaire neutre.",
    movement: "Fléchir la colonne vertébrale lentement et bas trop bas. Revenir lentement en alignant les épaules avec le bassin et les pieds. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "lombalgie",
    theme: "Dos",
    targeted_muscles: ["lombaire", "carré des lombes"],
    muscleGroups: ["dos"],
    difficulty: "intermediaire"
  },
  "dos lombaire assis a controler !": {
    description: "Le fessier contre le siège. Les pieds sur le plateau. Les bras tendus vars l'avant. Courbe lombaire neutre.",
    startingPosition: "Le fessier contre le siège. Les pieds sur le plateau. Les bras tendus vars l'avant. Courbe lombaire neutre.",
    movement: "Amener le dos vers l'arrière en maintenant l'appui sur le siège. Revenir lentement en avant. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "lombalgie",
    theme: "Dos",
    targeted_muscles: ["lombaire", "carré des lombes"],
    muscleGroups: ["dos"],
    difficulty: "intermediaire"
  },
  "epaule abduction": {
    description: "Assis sur le siège. Les coudes fléchis sur les coussinets le long du corps. Courbe lombaire neutre.",
    startingPosition: "Assis sur le siège. Les coudes fléchis sur les coussinets le long du corps. Courbe lombaire neutre.",
    movement: "Monter les deux bras et amener les coudes à hauteur des épaules et pas plus. Revenir lentement en position de départ. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épaule",
    theme: "épaule",
    targeted_muscles: ["épaule"],
    muscleGroups: ["epaules"],
    difficulty: "intermediaire"
  },
  "epaule dv nuque": {
    description: "Assis sur le siège. Les coudes fléchis le long du corps. Courbe lombaire neutre.",
    startingPosition: "Assis sur le siège. Les coudes fléchis le long du corps. Courbe lombaire neutre.",
    movement: "Tendre les deux bras sans bloquer les coudes. Revenir lentement en position de départ. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épaule",
    theme: "épaule",
    targeted_muscles: ["épaule"],
    muscleGroups: ["epaules"],
    difficulty: "intermediaire"
  },
  "abdominaux oblique": {
    description: "Assis avec le haut des épaules contre les coussinets. Courbe lombaire neutre. Les mains tiennent les sangles.",
    startingPosition: "Assis avec le haut des épaules contre les coussinets. Courbe lombaire neutre. Les mains tiennent les sangles.",
    movement: "Tourner sur le côté sans forcer avec les épaules. Revenir vers l'axe central lentement et repartir. Tenir les abdominaux.",
    intensity: "niveau débutant",
    series: "3x 15 répétitions",
    constraints: "aucune",
    theme: "abdominaux",
    targeted_muscles: ["Grand dorsal", "biceps"],
    muscleGroups: ["abdos"],
    difficulty: "debutant"
  }
}

function normalizeTitle(title) {
  return title.toLowerCase().trim().replace(/\s+/g, ' ').normalize('NFC')
}

async function updateMachineVideosMetadata() {
  console.log('🔄 Mise à jour des métadonnées des vidéos Machine...\n')
  
  // Normaliser toutes les clés du metadataMap pour éviter les problèmes d'encodage Unicode
  const normalizedMetadataMap = {}
  for (const [key, value] of Object.entries(metadataMap)) {
    const normalizedKey = key.normalize('NFC')
    normalizedMetadataMap[normalizedKey] = value
  }
  
  console.log(`📋 Nombre de clés dans metadataMap: ${Object.keys(normalizedMetadataMap).length}`)
  console.log(`📋 Exemple de clés: ${Object.keys(normalizedMetadataMap).slice(0, 3).join(', ')}\n`)
  
  try {
    // Récupérer toutes les vidéos machine
    const allVideos = await sql`
      SELECT id, title, "videoUrl"
      FROM videos_new
      WHERE region = 'machine'
    `
    
    console.log(`📦 ${allVideos.length} vidéos Machine trouvées dans la base\n`)
    
    let updatedCount = 0
    let notFoundCount = 0
    const notFound = []

    for (const video of allVideos) {
      const normalizedTitle = normalizeTitle(video.title)
      const metadata = normalizedMetadataMap[normalizedTitle]
      
      if (metadata) {
        // Mettre à jour la vidéo avec les métadonnées complètes
        await sql`
          UPDATE videos_new
          SET 
            description = ${metadata.description},
            "startingPosition" = ${metadata.startingPosition},
            movement = ${metadata.movement},
            intensity = ${metadata.intensity},
            series = ${metadata.series},
            constraints = ${metadata.constraints},
            theme = ${metadata.theme},
            targeted_muscles = ${metadata.targeted_muscles}::text[],
            "muscleGroups" = ${metadata.muscleGroups}::text[],
            difficulty = ${metadata.difficulty},
            "updatedAt" = NOW()
          WHERE id = ${video.id}
        `
        
        console.log(`✅ Mis à jour: ${video.title}`)
        updatedCount++
      } else {
        console.log(`⚠️  Pas de métadonnées pour: ${video.title}`)
        notFound.push(video.title)
        notFoundCount++
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⚠️  Sans métadonnées: ${notFoundCount}`)
    
    if (notFound.length > 0) {
      console.log(`\n⚠️  Vidéos sans métadonnées:`)
      notFound.forEach(title => console.log(`   - ${title}`))
    }
    
    console.log(`\n✅ Mise à jour terminée!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

updateMachineVideosMetadata()
