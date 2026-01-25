const { Pool } = require('pg')
const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const https = require('https')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

async function testHttpUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode)
    }).on('error', () => {
      resolve(null)
    })
  })
}

async function tryS3Key(key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: 'only-you-coaching',
      Key: key
    }))
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('🔍 Test des URLs de thumbnails groupes-musculaires...\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Get some videos with groupes-musculaires thumbnails
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        thumbnail
      FROM videos_new
      WHERE "isPublished" = true
        AND thumbnail LIKE '%Video/groupes-musculaires%'
      ORDER BY RANDOM()
      LIMIT 10
    `)

    console.log(`📋 Test de ${result.rows.length} vidéos aléatoires...\n`)

    for (const video of result.rows) {
      console.log(`\n🎥 "${video.title}"`)
      
      // Extract S3 key from URL
      let s3Key
      try {
        const url = new URL(video.thumbnail)
        s3Key = decodeURIComponent(url.pathname.substring(1))
      } catch {
        console.log('   ❌ URL invalide')
        continue
      }

      console.log(`   S3 Key: ${s3Key}`)

      // Test 1: Direct S3 check with decoded key
      const existsDecoded = await tryS3Key(s3Key)
      console.log(`   Test 1 (décodé): ${existsDecoded ? '✅ EXISTE' : '❌ N\'EXISTE PAS'}`)

      // Test 2: Try with encoded key
      const encodedKey = s3Key.split('/').map(part => encodeURIComponent(part)).join('/')
      const existsEncoded = await tryS3Key(encodedKey)
      console.log(`   Test 2 (encodé): ${existsEncoded ? '✅ EXISTE' : '❌ N\'EXISTE PAS'}`)

      // Test 3: Try with URL pathname (no decode)
      try {
        const url = new URL(video.thumbnail)
        const rawKey = url.pathname.substring(1)
        const existsRaw = await tryS3Key(rawKey)
        console.log(`   Test 3 (brut): ${existsRaw ? '✅ EXISTE' : '❌ N\'EXISTE PAS'}`)
      } catch {}

      // Test 4: Try to access via HTTP
      const httpStatus = await testHttpUrl(video.thumbnail)
      console.log(`   Test 4 (HTTP direct): ${httpStatus || 'ERREUR'}`)

      // Test 5: Generate signed URL with the key that works
      if (existsDecoded || existsEncoded) {
        const workingKey = existsDecoded ? s3Key : encodedKey
        try {
          const command = new GetObjectCommand({
            Bucket: 'only-you-coaching',
            Key: workingKey
          })
          const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
          const signedStatus = await testHttpUrl(signedUrl)
          console.log(`   Test 5 (URL signée): ${signedStatus || 'ERREUR'}`)
        } catch (error) {
          console.log(`   Test 5 (URL signée): ❌ Erreur - ${error.message}`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
