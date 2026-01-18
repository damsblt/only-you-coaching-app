/**
 * Script pour mettre à jour les métadonnées des vidéos Machine dans Neon
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

// Métadonnées complètes des exercices de machine
const machineExercises = [
  {
    title: "Fessier jambe presse à cuisse horizontale",
    detailedDescription: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    startingPosition: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    movement: "Descendre le siège vers le plateau en fléchissant les genoux jusqu'à faire un angle de 90°. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier jambe presse à cuisse incliné",
    detailedDescription: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    startingPosition: "Assis et le dos contre le siège. Pieds largeur des épaules sur le haut du plateau. Les jambes sont tendues et les genoux souples.",
    movement: "Descendre le siège vers le plateau en fléchissant les genoux jusqu'à faire un angle de 90°. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier jambe presse à cuisse verticale",
    detailedDescription: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    startingPosition: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    movement: "Descendre en fléchissant les genoux. Amener les arrières cuisses parallèlement au sol. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier jambe presse à cuisse verticale (2)",
    detailedDescription: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    startingPosition: "Debout, pieds parallèles sur l'avant du plateau et largeur des épaules. Le fessier et le dos contre le siège. Les épaules sous les coussinets.",
    movement: "Descendre en fléchissant les genoux. Amener les arrières cuisses parallèlement au sol. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier jambe extension de hanche à plat ventre",
    detailedDescription: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Un genou fléchit sur le siège et le pied de l'autre jambe sur le rouleau. La tête dans le prolongement de la colonne.",
    startingPosition: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Un genou fléchit sur le siège et le pied de l'autre jambe sur le rouleau. La tête dans le prolongement de la colonne.",
    movement: "Tendre la jambe arrière sans bloquer le genou. Revenir genou fléchi en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "ischios"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier jambe trust",
    detailedDescription: "Le haut du dos en appui sur le siège. Le bassin décollé. Les pieds sur le plateau un peu plus large que les épaules et les genoux fléchis. La sangle fermée à hauteur du pli de l'aine.",
    startingPosition: "Le haut du dos en appui sur le siège. Le bassin décollé. Les pieds sur le plateau un peu plus large que les épaules et les genoux fléchis. La sangle fermée à hauteur du pli de l'aine.",
    movement: "Descendre le fessier en fléchissant les genoux. Poussez sur les talons dans le sol et monter les hanches vers le plafond aussi haut que possible. Expirer sur le monté et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischios"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier jambe squat guidé à la machine smith",
    detailedDescription: "Debout, pieds parallèles vers l'avant et largeur des épaules. Placer la barre sur le haut du dos et non pas sur les cervicales.",
    startingPosition: "Debout, pieds parallèles vers l'avant et largeur des épaules. Placer la barre sur le haut du dos et non pas sur les cervicales.",
    movement: "Descendre en poussant le fessier légèrement vers l'arrière et fléchir les genoux. Les genoux peuvent avancer jusqu'à la pointe des pieds. Amener les arrières cuisses parallèlement au sol. Remonter sans bloquer les genoux. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "niveau intermédiaire-avancé",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier jambe fente guidé sur smith",
    detailedDescription: "Aligner le genou de la jambe avant sous la cheville. Le genou de la jambe arrière est fléchit et la jambe relâchée. Positionner la barre sur le haut du dos et non pas sur la nuque.",
    startingPosition: "Aligner le genou de la jambe avant sous la cheville. Le genou de la jambe arrière est fléchit et la jambe relâchée. Positionner la barre sur le haut du dos et non pas sur la nuque.",
    movement: "Transférer le poids du corps sur la jambe avant. Descendre en poussant légèrement le fessier vers l'arrière. Amener l'arrière cuisse de la jambe avant parallèlement au sol au maximum. Remonter sans bloquer le genou et en maintenant l'axe genou-cheville. Inspirer sur la descente et tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "genoux",
    theme: "fessier, jambe",
    targeted_muscles: ["fessier", "cuisse", "ischio", "mollet"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Cuisse leg extension",
    detailedDescription: "Assis, le dos contre le siège. Les genoux entourent le bord du siège. Le rouleau est placé sur le coup du pied.",
    startingPosition: "Assis, le dos contre le siège. Les genoux entourent le bord du siège. Le rouleau est placé sur le coup du pied.",
    movement: "Tendre les 2 jambes en maintenant les genoux souples. Revenir en position de départ plus lentement.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "cuisse",
    targeted_muscles: ["cuisse"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Arrière cuisse leg curl ",
    detailedDescription: "A plat ventre sur le siège. Les avant-bras et les coudes sur les coussinets. Les genoux juste en dehors du siège. Le rouleau est placé derrière la cheville.",
    startingPosition: "A plat ventre sur le siège. Les avant-bras et les coudes sur les coussinets. Les genoux juste en dehors du siège. Le rouleau est placé derrière la cheville.",
    movement: "Fléchir les deux genoux et amener le rouleau vers l'arrière cuisse. Revenir en position de départ plus lentement sans bloquer les genoux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "arrière cuisse",
    targeted_muscles: ["arrière cuisse"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Arrière cuisse à plat ventre ",
    detailedDescription: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Les genoux en dehors du siège et le bas des mollets positionnés sous le rouleau. La tête dans le prolongement de la colonne.",
    startingPosition: "Couché sur le banc, les épaules alignées en appui sur les coussinets. Les genoux en dehors du siège et le bas des mollets positionnés sous le rouleau. La tête dans le prolongement de la colonne.",
    movement: "Fléchir les genoux et amener le rouleau vers l'arrière cuisse. Revenir genou souple en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "ischios",
    targeted_muscles: ["ischios"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier abduction de hanche",
    detailedDescription: "Assis avec le dos contre le siège. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos contre le siège. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    movement: "Ouvrir le plus possible les hanches sans bouger le bassin. Revenir lentement en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier",
    targeted_muscles: ["abducteur", "TFL", "moyen fessier"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier abduction de hanche incliné",
    detailedDescription: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    movement: "Ouvrir le plus possible les hanches sans bouger le bassin. Revenir lentement en position de départ.",
    intensity: "niveau intermédiaire",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier",
    targeted_muscles: ["abducteur", "TFL", "moyen fessier"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Fessier abduction de hanche incliné + petits mouvements",
    detailedDescription: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos incliné vers l'avant. Les genoux contre les coussinets intérieurs. Les pieds placer sur la première barre des plateaux.",
    movement: "Ouvrir le plus possible les hanches sans bouger le bassin. Maintenir le mouvement et faire de petits mouvements.",
    intensity: "niveau intermédiaire",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "fessier",
    targeted_muscles: ["abducteur", "TFL", "moyen fessier"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Cuisse (intérieur) adduction de hanche",
    detailedDescription: "Assis avec le dos contre le siège. Les genoux à l'extérieur des coussinets. Les pieds placer sur la première barre des plateaux.",
    startingPosition: "Assis avec le dos contre le siège. Les genoux à l'extérieur des coussinets. Les pieds placer sur la première barre des plateaux.",
    movement: "Fermer le plus possible les hanches sans bouger le bassin. Revenir lentement en position de départ.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "aucune",
    theme: "adducteur",
    targeted_muscles: ["adducteur"],
    muscleGroups: ["fessiers-jambes"]
  },
  {
    title: "Pectoraux développé assis",
    detailedDescription: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les coudes fléchis à 90° et les mains sont sous les épaules.",
    startingPosition: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les coudes fléchis à 90° et les mains sont sous les épaules.",
    movement: "Tendre les bras et les rejoindre en fin de mouvement sans bloquer les coudes. Revenir les coudes fléchis à 90°, légèrement derrière les épaules. Tenir les abdominaux.",
    intensity: "niveau débutant",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Pectoraux",
    targeted_muscles: ["pectoraux", "triceps"],
    muscleGroups: ["pectoraux"]
  },
  {
    title: "Pectoraux dv couché à la barre guidée smith",
    detailedDescription: "Couché sur le banc, courbe lombaire neutre et les pieds ancrés au sol. Les bras tendus avec la barre à hauteur du haut de la poitrine. Prise de la barre large.",
    startingPosition: "Couché sur le banc, courbe lombaire neutre et les pieds ancrés au sol. Les bras tendus avec la barre à hauteur du haut de la poitrine. Prise de la barre large.",
    movement: "Débloquer la barre en la soulevant et en tournant les poignets. Descendre la barre sur le haut de la poitrine en fléchissant les coudes. Remonter la barre bras tendu sans bloquer les coudes à hauteur du haut de la poitrine. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "Epaule, épicondylite",
    theme: "Pectoraux",
    targeted_muscles: ["pectoraux", "triceps"],
    muscleGroups: ["pectoraux"]
  },
  {
    title: "Pectoraux butterfly assis",
    detailedDescription: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les bras tendus et les mains sont sous les épaules.",
    startingPosition: "Assis avec le dos contre le siège. La courbe lombaire neutre. Les bras tendus et les mains sont sous les épaules.",
    movement: "Amener les mains l'une contre l'autre vers l'avant. Revenir les coudes souples, légèrement derrière les épaules. Tenir les abdominaux.",
    intensity: "niveau débutant",
    series: "3x 12 répétitions",
    constraints: "épaule",
    theme: "Pectoraux",
    targeted_muscles: ["pectoraux", "triceps"],
    muscleGroups: ["pectoraux"]
  },
  {
    title: "Dos rowing",
    detailedDescription: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples.",
    startingPosition: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples.",
    movement: "Tirer les deux coudes vers l'arrière en serrant tout à la fois les omoplates. Revenir bras tendu sans bloquer les coudes. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Dos",
    targeted_muscles: ["Grand dorsal", "biceps"],
    muscleGroups: ["dos"]
  },
  {
    title: "Dos (haut) tirage assis",
    detailedDescription: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples en avant.",
    startingPosition: "Assis avec l'abdomen et le milieu de la poitrine contre le siège avant. Courbe lombaire neutre. Les bras tendus avec les coudes souples en avant.",
    movement: "Tirer les deux bras vers l'arrière en serrant tout à la fois les omoplates. Revenir bras tendu sans bloquer les coudes. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Dos",
    targeted_muscles: ["Haut du dos", "arrière de l'épaule"],
    muscleGroups: ["dos"]
  },
  {
    title: "Dos tirage poitrine lat pull down",
    detailedDescription: "Assis avec le dos légèrement incliné vers l'arrière. Les bras tendus vers le haut avec les coudes souples. Les cuisses maintenues sous le rouleau. Courbe lombaire neutre.",
    startingPosition: "Assis avec le dos légèrement incliné vers l'arrière. Les bras tendus vers le haut avec les coudes souples. Les cuisses maintenues sous le rouleau. Courbe lombaire neutre.",
    movement: "Tirer les deux coudes vers l'arrière et amener la barre au-dessus de la poitrine. Revenir bras tendu sans bloquer les coudes. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épicondylite",
    theme: "Dos",
    targeted_muscles: ["Grand dorsal", "biceps"],
    muscleGroups: ["dos"]
  },
  {
    title: "Dos banc à lombaire",
    detailedDescription: "Le haut des cuisses en appui sur le siège. Les pieds bloqués sur le plateau. Les bras sur la poitrine. Courbe lombaire neutre.",
    startingPosition: "Le haut des cuisses en appui sur le siège. Les pieds bloqués sur le plateau. Les bras sur la poitrine. Courbe lombaire neutre.",
    movement: "Fléchir la colonne vertébrale lentement et bas trop bas. Revenir lentement en alignant les épaules avec le bassin et les pieds. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "lombalgie",
    theme: "Dos",
    targeted_muscles: ["lombaire", "carré des lombes"],
    muscleGroups: ["dos"]
  },
  {
    title: "Dos lombaire assis a controler !",
    detailedDescription: "Le fessier contre le siège. Les pieds sur le plateau. Les bras tendus vars l'avant. Courbe lombaire neutre.",
    startingPosition: "Le fessier contre le siège. Les pieds sur le plateau. Les bras tendus vars l'avant. Courbe lombaire neutre.",
    movement: "Amener le dos vers l'arrière en maintenant l'appui sur le siège. Revenir lentement en avant. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "lombalgie",
    theme: "Dos",
    targeted_muscles: ["lombaire", "carré des lombes"],
    muscleGroups: ["dos"]
  },
  {
    title: "Epaule abduction",
    detailedDescription: "Assis sur le siège. Les coudes fléchis sur les coussinets le long du corps. Courbe lombaire neutre.",
    startingPosition: "Assis sur le siège. Les coudes fléchis sur les coussinets le long du corps. Courbe lombaire neutre.",
    movement: "Monter les deux bras et amener les coudes à hauteur des épaules et pas plus. Revenir lentement en position de départ. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épaule",
    theme: "épaule",
    targeted_muscles: ["épaule"],
    muscleGroups: ["epaules"]
  },
  {
    title: "Epaule dv nuque",
    detailedDescription: "Assis sur le siège. Les coudes fléchis le long du corps. Courbe lombaire neutre.",
    startingPosition: "Assis sur le siège. Les coudes fléchis le long du corps. Courbe lombaire neutre.",
    movement: "Tendre les deux bras sans bloquer les coudes. Revenir lentement en position de départ. Tenir les abdominaux.",
    intensity: "tout niveau",
    series: "3x 12 répétitions",
    constraints: "épaule",
    theme: "épaule",
    targeted_muscles: ["épaule"],
    muscleGroups: ["epaules"]
  },
  {
    title: "Abdominaux oblique",
    detailedDescription: "Assis avec le haut des épaules contre les coussinets. Courbe lombaire neutre. Les mains tiennent les sangles.",
    startingPosition: "Assis avec le haut des épaules contre les coussinets. Courbe lombaire neutre. Les mains tiennent les sangles.",
    movement: "Tourner sur le côté sans forcer avec les épaules. Revenir vers l'axe central lentement et repartir. Tenir les abdominaux.",
    intensity: "niveau débutant",
    series: "3x 15 répétitions",
    constraints: "aucune",
    theme: "abdominaux",
    targeted_muscles: ["Grand dorsal", "biceps"],
    muscleGroups: ["abdos"]
  }
]

// Fonction pour normaliser les titres pour la comparaison
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
}

// Mapper les intensités vers les valeurs de difficulté
function mapIntensityToDifficulty(intensity) {
  const lowerIntensity = intensity.toLowerCase()
  if (lowerIntensity.includes('débutant')) return 'debutant'
  if (lowerIntensity.includes('intermédiaire') || lowerIntensity.includes('intermediaire')) return 'intermediaire'
  if (lowerIntensity.includes('avancé')) return 'avance'
  return 'intermediaire' // par défaut
}

async function updateMachineVideosMetadata() {
  console.log('🔄 Mise à jour des métadonnées des vidéos Machine...\n')
  
  try {
    let updatedCount = 0
    let notFoundCount = 0
    const notFound = []

    for (const exercise of machineExercises) {
      // Chercher la vidéo par titre avec une recherche flexible
      // Extraire les mots-clés principaux du titre
      const searchPattern = exercise.title.toLowerCase().trim()
      const videos = await sql`
        SELECT id, title, "videoUrl"
        FROM videos_new
        WHERE region = 'machine'
        AND LOWER(TRIM(title)) LIKE ${'%' + searchPattern + '%'}
        LIMIT 1
      `
      
      if (videos && videos.length > 0) {
        const video = videos[0]
        console.log(`🔍 Match: "${exercise.title}" → "${video.title}"`)
        const difficulty = mapIntensityToDifficulty(exercise.intensity)
        
        // Mettre à jour la vidéo avec les métadonnées complètes
        await sql`
          UPDATE videos_new
          SET 
            description = ${exercise.detailedDescription},
            "startingPosition" = ${exercise.startingPosition},
            movement = ${exercise.movement},
            intensity = ${exercise.intensity},
            series = ${exercise.series},
            constraints = ${exercise.constraints},
            theme = ${exercise.theme},
            targeted_muscles = ${exercise.targeted_muscles}::text[],
            "muscleGroups" = ${exercise.muscleGroups}::text[],
            difficulty = ${difficulty},
            "updatedAt" = NOW()
          WHERE id = ${video.id}
        `
        
        console.log(`✅ Mis à jour: ${video.title}`)
        updatedCount++
      } else {
        console.log(`⚠️  Non trouvé: ${exercise.title}`)
        notFound.push(exercise.title)
        notFoundCount++
      }
    }

    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`   ✅ Mises à jour: ${updatedCount}`)
    console.log(`   ⚠️  Non trouvées: ${notFoundCount}`)
    
    if (notFound.length > 0) {
      console.log(`\n⚠️  Vidéos non trouvées:`)
      notFound.forEach(title => console.log(`   - ${title}`))
    }
    
    console.log(`\n✅ Mise à jour terminée!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

updateMachineVideosMetadata()
