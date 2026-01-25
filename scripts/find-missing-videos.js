/**
 * Script pour trouver les vidéos manquantes avec des recherches flexibles
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL
const sql = neon(DATABASE_URL)

const searches = [
  { term: 'Pullover', regions: ['bande', 'pectoraux'] },
  { term: 'Jack nife', regions: ['abdominaux'] },
  { term: 'Jacknif', regions: ['abdominaux'] },
  { term: 'Avant bras', regions: ['genou', 'triceps'] },
  { term: 'avant-bras', regions: ['genou', 'triceps'] }
]

async function findVideos() {
  for (const search of searches) {
    console.log(`\n🔍 Recherche: "${search.term}" dans ${search.regions.join(', ')}`)
    
    for (const region of search.regions) {
      const results = await sql`
        SELECT id, title, region 
        FROM videos_new 
        WHERE LOWER(title) LIKE ${'%' + search.term.toLowerCase() + '%'}
        AND region = ${region}
        LIMIT 10
      `
      
      if (results && results.length > 0) {
        console.log(`   ✅ Trouvé dans ${region}:`)
        results.forEach(v => console.log(`      - "${v.title}" (ID: ${v.id})`))
      }
    }
  }
}

findVideos().then(() => process.exit(0))
