const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

async function main() {
  console.log('🔍 Vérification des thumbnails dans S3...\n')

  try {
    // Check thumbnails at root
    console.log('📂 1. Thumbnails à la RACINE (thumbnails/):\n')
    const rootCommand = new ListObjectsV2Command({
      Bucket: 'only-you-coaching',
      Prefix: 'thumbnails/',
      Delimiter: '/',
      MaxKeys: 10
    })
    const rootResponse = await s3Client.send(rootCommand)
    
    if (rootResponse.CommonPrefixes) {
      console.log('   Dossiers trouvés:')
      rootResponse.CommonPrefixes.forEach(prefix => {
        console.log(`   📁 ${prefix.Prefix}`)
      })
    }
    
    console.log(`\n   Fichiers à la racine: ${rootResponse.KeyCount} fichiers`)

    // Check thumbnails in Video/groupes-musculaires/
    console.log('\n\n📂 2. Thumbnails dans Video/groupes-musculaires/:\n')
    
    let allThumbnails = []
    let continuationToken = undefined
    
    do {
      const gmCommand = new ListObjectsV2Command({
        Bucket: 'only-you-coaching',
        Prefix: 'thumbnails/Video/groupes-musculaires/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken
      })
      
      const gmResponse = await s3Client.send(gmCommand)
      
      if (gmResponse.Contents) {
        allThumbnails = allThumbnails.concat(gmResponse.Contents)
      }
      
      continuationToken = gmResponse.NextContinuationToken
    } while (continuationToken)

    console.log(`   Total de fichiers: ${allThumbnails.length}`)
    
    if (allThumbnails.length > 0) {
      console.log('\n   Structure des sous-dossiers:')
      const folders = new Set()
      allThumbnails.forEach(obj => {
        const parts = obj.Key.split('/')
        if (parts.length > 3) {
          folders.add(parts[3]) // Le sous-dossier après thumbnails/Video/groupes-musculaires/
        }
      })
      
      folders.forEach(folder => {
        const count = allThumbnails.filter(obj => obj.Key.includes(`/groupes-musculaires/${folder}/`)).length
        console.log(`   📁 ${folder}/: ${count} fichiers`)
      })
      
      console.log('\n   Exemples de fichiers (premiers 20):')
      allThumbnails.slice(0, 20).forEach((obj, i) => {
        console.log(`   ${i + 1}. ${obj.Key}`)
      })
      
      if (allThumbnails.length > 20) {
        console.log(`   ... et ${allThumbnails.length - 20} autres fichiers`)
      }
    } else {
      console.log('   ⚠️  Aucun fichier trouvé dans ce dossier!')
    }

    console.log('\n\n📊 RÉSUMÉ:')
    console.log(`   - Thumbnails à la racine: oui`)
    console.log(`   - Thumbnails dans Video/groupes-musculaires/: ${allThumbnails.length} fichiers`)
    
    if (allThumbnails.length > 0) {
      console.log('\n✅ Les thumbnails EXISTENT dans Video/groupes-musculaires/')
      console.log('💡 Le problème est probablement dans les URLs de la base de données')
    } else {
      console.log('\n❌ Les thumbnails N\'EXISTENT PAS dans Video/groupes-musculaires/')
      console.log('💡 Tous les thumbnails sont à la racine thumbnails/')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  }
}

main().catch(console.error)
