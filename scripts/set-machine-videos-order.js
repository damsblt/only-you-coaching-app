/**
 * Script pour définir l'ordre d'affichage des vidéos Machine
 * Basé sur l'ordre spécifié dans le dossier S3
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

// Ordre des vidéos Machine tel que spécifié
const machineVideosOrder = [
  { order: 1, title: "fessier jambe presse à cuisse horizontale" },
  { order: 2, title: "fessier jambe presse à cuisse incliné" },
  { order: 3, title: "fessier jambe presse à cuisse verticale" },
  { order: 3.1, title: "fessier jambe presse à cuisse verticale (2)" },
  { order: 4, title: "fessier jambe extension de hanche à plat ventre" },
  { order: 5, title: "fessier jambe trust" },
  { order: 6, title: "fessier jambe squat guidé à la machine smith" },
  { order: 7, title: "fessier jambe fente guidé sur smith" },
  { order: 8, title: "cuisse leg extension" },
  { order: 9, title: "arrière cuisse leg curl" },
  { order: 10, title: "arrière cuisse à plat ventre" },
  { order: 11, title: "fessier abduction de hanche" },
  { order: 12, title: "fessier abduction de hanche incliné" },
  { order: 13, title: "fessier abduction de hanche incliné + petits mouvements" },
  { order: 14, title: "cuisse (intérieur) adduction de hanche" },
  { order: 15, title: "pectoraux développé assis" },
  { order: 16, title: "pectoraux dv couché à la barre guidée smith" },
  { order: 17, title: "pectoraux butterfly assis" },
  { order: 18, title: "dos rowing" },
  { order: 19, title: "dos (haut) tirage assis" },
  { order: 20, title: "dos tirage poitrine lat pull down" },
  { order: 21, title: "dos banc à lombaire" },
  { order: 22, title: "dos lombaire assis a controler !" },
  { order: 23, title: "epaule abduction" },
  { order: 24, title: "epaule dv nuque" },
  { order: 25, title: "abdominaux oblique" }
]

function normalizeTitle(title) {
  return title.toLowerCase().trim().replace(/\s+/g, ' ').normalize('NFC')
}

async function setMachineVideosOrder() {
  console.log('🔄 Définition de l\'ordre des vidéos Machine...\n')
  
  try {
    // Récupérer toutes les vidéos machine
    const allVideos = await sql`
      SELECT id, title
      FROM videos_new
      WHERE region = 'machine'
    `
    
    console.log(`📦 ${allVideos.length} vidéos Machine trouvées dans la base\n`)
    
    // Créer un map normalisé des vidéos
    const videoMap = new Map()
    allVideos.forEach(video => {
      const normalizedTitle = normalizeTitle(video.title)
      videoMap.set(normalizedTitle, video)
    })
    
    let updatedCount = 0
    let notFoundCount = 0
    const notFound = []

    for (const item of machineVideosOrder) {
      const normalizedTitle = normalizeTitle(item.title)
      const video = videoMap.get(normalizedTitle)
      
      if (video) {
        // Mettre à jour l'ordre de la vidéo
        await sql`
          UPDATE videos_new
          SET 
            exo_title = ${item.order.toString()},
            "updatedAt" = NOW()
          WHERE id = ${video.id}
        `
        
        console.log(`✅ Ordre ${item.order}: ${video.title}`)
        updatedCount++
      } else {
        console.log(`⚠️  Non trouvée: ${item.title}`)
        notFound.push(item.title)
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
    
    console.log(`\n✅ Ordre défini!\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    process.exit(1)
  }
}

setMachineVideosOrder()
