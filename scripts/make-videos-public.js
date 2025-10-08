#!/usr/bin/env node

/**
 * Make S3 Videos Public
 * This script makes all videos in the S3 bucket publicly accessible
 */

const { S3Client, PutObjectAclCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

async function makeVideosPublic() {
  console.log('🔓 Making S3 Videos Public...')
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

    console.log('1️⃣ Listing all video files...')
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Video/',
      MaxKeys: 1000
    })
    
    const listResult = await s3Client.send(listCommand)
    const videoFiles = listResult.Contents?.filter(obj => 
      obj.Key?.endsWith('.mp4') || obj.Key?.endsWith('-mp4')
    ) || []
    
    console.log(`   Found ${videoFiles.length} video files`)

    console.log('2️⃣ Making videos public...')
    let successCount = 0
    let errorCount = 0

    for (const videoFile of videoFiles) {
      try {
        const aclCommand = new PutObjectAclCommand({
          Bucket: BUCKET_NAME,
          Key: videoFile.Key,
          ACL: 'public-read'
        })
        
        await s3Client.send(aclCommand)
        console.log(`   ✅ Made public: ${videoFile.Key}`)
        successCount++
      } catch (error) {
        console.log(`   ❌ Failed: ${videoFile.Key} - ${error.message}`)
        errorCount++
      }
    }

    console.log('')
    console.log('📊 Results:')
    console.log(`   ✅ Successfully made public: ${successCount} videos`)
    console.log(`   ❌ Failed: ${errorCount} videos`)

    if (successCount > 0) {
      console.log('')
      console.log('🧪 Testing public access...')
      const testVideo = videoFiles[0]
      if (testVideo) {
        const publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${testVideo.Key}`
        console.log(`   Testing: ${publicUrl}`)
        
        try {
          const response = await fetch(publicUrl, { method: 'HEAD' })
          console.log(`   Status: ${response.status}`)
          console.log(`   Content-Type: ${response.headers.get('content-type')}`)
          
          if (response.status === 200) {
            console.log('   ✅ Public access working!')
          } else {
            console.log('   ❌ Public access not working')
          }
        } catch (fetchError) {
          console.log(`   ❌ Error testing public access: ${fetchError.message}`)
        }
      }
    }

  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

// Run the script
makeVideosPublic().then(() => {
  console.log('')
  console.log('🏁 Script completed')
}).catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
