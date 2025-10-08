#!/usr/bin/env node

/**
 * Set S3 Bucket Policy for Public Video Access
 * This script sets a bucket policy to make videos publicly accessible
 */

const { S3Client, PutBucketPolicyCommand } = require('@aws-sdk/client-s3')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

async function setBucketPolicy() {
  console.log('🔓 Setting S3 Bucket Policy for Public Video Access...')
  console.log('Bucket:', BUCKET_NAME)
  console.log('Region:', AWS_REGION)
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

    // Bucket policy to allow public read access to videos
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/Video/*`
        }
      ]
    }

    console.log('1️⃣ Setting bucket policy...')
    const policyCommand = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    })
    
    await s3Client.send(policyCommand)
    console.log('✅ Bucket policy set successfully')

    console.log('2️⃣ Testing public access...')
    const testUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/Video/groupes-musculaires/abdos/1-gainage-planche-sur-les-pieds-barre.mp4`
    console.log('   Testing:', testUrl)
    
    try {
      const response = await fetch(testUrl, { method: 'HEAD' })
      console.log(`   Status: ${response.status}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
      console.log(`   Content-Length: ${response.headers.get('content-length')}`)
      
      if (response.status === 200) {
        console.log('   ✅ Public access working!')
      } else {
        console.log('   ❌ Public access not working')
      }
    } catch (fetchError) {
      console.log(`   ❌ Error testing public access: ${fetchError.message}`)
    }

  } catch (error) {
    console.log('❌ Error:', error.message)
    console.log('   Error name:', error.name)
    console.log('   Error code:', error.code)
  }
}

// Run the script
setBucketPolicy().then(() => {
  console.log('')
  console.log('🏁 Script completed')
}).catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
