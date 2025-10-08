#!/usr/bin/env node

/**
 * Test S3 Connection and Video Access
 * This script tests if AWS credentials are properly configured and if videos can be accessed
 */

const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { GetObjectCommand } = require('@aws-sdk/client-s3')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

console.log('🧪 Testing S3 Connection...')
console.log('Bucket:', BUCKET_NAME)
console.log('Region:', AWS_REGION)
console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing')
console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing')
console.log('')

// Test video key from the error logs
const testVideoKey = 'Video/programmes-predefinis/pectoraux/1-dv-assis-ballon-poulies-milieu-mp4'

async function testS3Connection() {
  try {
    // Create S3 client
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    console.log('1️⃣ Testing S3 client creation...')
    console.log('✅ S3 client created successfully')

    console.log('2️⃣ Testing object existence...')
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testVideoKey,
      })
      
      const headResult = await s3Client.send(headCommand)
      console.log('✅ Object exists in S3')
      console.log('   Content Type:', headResult.ContentType)
      console.log('   Content Length:', headResult.ContentLength)
      console.log('   Last Modified:', headResult.LastModified)
    } catch (headError) {
      console.log('❌ Object not found or access denied')
      console.log('   Error:', headError.message)
      console.log('   Code:', headError.name)
      
      // Try to list objects in the bucket to see what's available
      console.log('3️⃣ Trying to list bucket contents...')
      try {
        const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
        const listCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: 'Video/',
          MaxKeys: 10,
        })
        
        const listResult = await s3Client.send(listCommand)
        console.log('✅ Bucket listing successful')
        console.log('   Found', listResult.Contents?.length || 0, 'objects')
        
        if (listResult.Contents && listResult.Contents.length > 0) {
          console.log('   Sample objects:')
          listResult.Contents.slice(0, 5).forEach((obj, index) => {
            console.log(`   ${index + 1}. ${obj.Key} (${obj.Size} bytes)`)
          })
        }
      } catch (listError) {
        console.log('❌ Failed to list bucket contents')
        console.log('   Error:', listError.message)
      }
      
      return
    }

    console.log('3️⃣ Testing signed URL generation...')
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testVideoKey,
      })
      
      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 })
      console.log('✅ Signed URL generated successfully')
      console.log('   URL length:', signedUrl.length)
      console.log('   URL preview:', signedUrl.substring(0, 100) + '...')
      
      // Test if the signed URL is accessible
      console.log('4️⃣ Testing signed URL accessibility...')
      try {
        const response = await fetch(signedUrl, { method: 'HEAD' })
        console.log('✅ Signed URL is accessible')
        console.log('   Status:', response.status)
        console.log('   Content-Type:', response.headers.get('content-type'))
        console.log('   Content-Length:', response.headers.get('content-length'))
      } catch (fetchError) {
        console.log('❌ Signed URL not accessible')
        console.log('   Error:', fetchError.message)
      }
      
    } catch (signError) {
      console.log('❌ Failed to generate signed URL')
      console.log('   Error:', signError.message)
    }

  } catch (error) {
    console.log('❌ S3 connection failed')
    console.log('   Error:', error.message)
    console.log('   Code:', error.name)
    
    if (error.name === 'CredentialsProviderError') {
      console.log('')
      console.log('🔧 Fix: Set AWS credentials in .env.local:')
      console.log('   AWS_ACCESS_KEY_ID=your-access-key')
      console.log('   AWS_SECRET_ACCESS_KEY=your-secret-key')
      console.log('   AWS_S3_BUCKET_NAME=only-you-coaching')
      console.log('   AWS_REGION=eu-north-1')
    }
  }
}

// Run the test
testS3Connection().then(() => {
  console.log('')
  console.log('🏁 Test completed')
}).catch((error) => {
  console.error('💥 Test failed:', error)
  process.exit(1)
})
