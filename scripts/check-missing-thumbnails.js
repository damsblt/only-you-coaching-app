const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔍 Vérification des thumbnails manquants...\n')

  // Fetch all published videos
  const { data: videos, error } = await supabase
    .from('videos_new')
    .select('id, title, thumbnail, videoUrl')
    .eq('isPublished', true)
    .order('title')

  if (error) {
    console.error('❌ Erreur:', error)
    return
  }

  const total = videos.length
  const withThumbnail = videos.filter(v => v.thumbnail && v.thumbnail.trim() !== '').length
  const withoutThumbnail = videos.filter(v => !v.thumbnail || v.thumbnail.trim() === '').length

  console.log('📊 Statistiques:')
  console.log(`   Total vidéos publiées: ${total}`)
  console.log(`   Avec thumbnail: ${withThumbnail} (${Math.round(withThumbnail / total * 100)}%)`)
  console.log(`   Sans thumbnail: ${withoutThumbnail} (${Math.round(withoutThumbnail / total * 100)}%)`)
  console.log()

  if (withoutThumbnail > 0) {
    console.log(`❌ ${withoutThumbnail} vidéos sans thumbnail:\n`)
    videos
      .filter(v => !v.thumbnail || v.thumbnail.trim() === '')
      .slice(0, 20)
      .forEach((v, i) => {
        console.log(`${i + 1}. ${v.title}`)
        console.log(`   ID: ${v.id}`)
        console.log(`   VideoURL: ${v.videoUrl ? v.videoUrl.substring(0, 60) + '...' : 'N/A'}`)
        console.log()
      })
    
    if (withoutThumbnail > 20) {
      console.log(`... et ${withoutThumbnail - 20} autres vidéos sans thumbnail\n`)
    }
  } else {
    console.log('✅ Toutes les vidéos ont un thumbnail!\n')
  }

  // Check thumbnail URL format
  const s3Thumbnails = videos.filter(v => v.thumbnail && v.thumbnail.includes('s3.amazonaws.com')).length
  const neonThumbnails = videos.filter(v => v.thumbnail && v.thumbnail.includes('neon')).length
  const otherThumbnails = videos.filter(v => v.thumbnail && !v.thumbnail.includes('s3.amazonaws.com') && !v.thumbnail.includes('neon')).length

  console.log('📍 Format des thumbnails:')
  console.log(`   S3 (amazonaws.com): ${s3Thumbnails}`)
  console.log(`   Neon Storage: ${neonThumbnails}`)
  console.log(`   Autres: ${otherThumbnails}`)
  console.log()

  // Show examples
  if (s3Thumbnails > 0) {
    console.log('Exemples de thumbnails S3:')
    videos
      .filter(v => v.thumbnail && v.thumbnail.includes('s3.amazonaws.com'))
      .slice(0, 3)
      .forEach(v => {
        console.log(`   ${v.title}`)
        console.log(`   ${v.thumbnail}`)
        console.log()
      })
  }
}

main().catch(console.error)
