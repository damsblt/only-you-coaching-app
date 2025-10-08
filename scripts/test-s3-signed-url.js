#!/usr/bin/env node

/**
 * Test S3 Signed URL Generation
 * This script tests if S3 signed URLs can be generated and accessed
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

const testKey = 'Video/groupes-musculaires/abdos/gainage-planche-avec-mains-sur-ballon-h-mp4'

async function testSignedUrlGeneration() {
  console.log('🧪 Testing S3 Signed URL Generation...')
  console.log('Bucket:', BUCKET_NAME)
  console.log('Region:', AWS_REGION)
  console.log('Key:', testKey)
  console.log('')

  try {
    // Create S3 client
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    console.log('1️⃣ Creating S3 client...')
    console.log('✅ S3 client created successfully')

    console.log('2️⃣ Generating signed URL...')
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
    })
    
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 })
    console.log('✅ Signed URL generated successfully')
    console.log('   URL length:', signedUrl.length)
    console.log('   URL preview:', signedUrl.substring(0, 100) + '...')
    console.log('   Full URL:', signedUrl)

    console.log('3️⃣ Testing signed URL accessibility...')
    try {
      const response = await fetch(signedUrl, { method: 'HEAD' })
      console.log('   Status:', response.status)
      console.log('   Status Text:', response.statusText)
      console.log('   Content-Type:', response.headers.get('content-type'))
      console.log('   Content-Length:', response.headers.get('content-length'))
      console.log('   Accept-Ranges:', response.headers.get('accept-ranges'))
      
      if (response.status === 200) {
        console.log('   ✅ Signed URL is accessible')
      } else {
        console.log('   ❌ Signed URL not accessible')
      }
    } catch (fetchError) {
      console.log('   ❌ Error accessing signed URL:', fetchError.message)
    }

    console.log('4️⃣ Testing video range request...')
    try {
      const rangeResponse = await fetch(signedUrl, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-1023'
        }
      })
      console.log('   Range Status:', rangeResponse.status)
      console.log('   Content-Range:', rangeResponse.headers.get('content-range'))
      console.log('   Content-Length:', rangeResponse.headers.get('content-length'))
      
      if (rangeResponse.status === 206) {
        console.log('   ✅ Range requests work (partial content)')
      } else if (rangeResponse.status === 200) {
        console.log('   ⚠️  Range requests not supported (full content)')
      } else {
        console.log('   ❌ Range request failed')
      }
    } catch (rangeError) {
      console.log('   ❌ Range request error:', rangeError.message)
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message)
    console.log('   Error name:', error.name)
    console.log('   Error code:', error.code)
  }
}

// Run the test
testSignedUrlGeneration().then(() => {
  console.log('')
  console.log('🏁 Test completed')
}).catch((error) => {
  console.error('💥 Test failed:', error)
  process.exit(1)
})
