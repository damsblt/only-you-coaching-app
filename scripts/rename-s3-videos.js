#!/usr/bin/env node

/**
 * Rename S3 Videos to Match Database URLs
 * This script renames S3 videos from .mp4 to -mp4 to match database URLs
 */

const { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

async function renameS3Videos() {
  console.log('🔄 Renaming S3 Videos to Match Database URLs...')
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

    console.log('1️⃣ Finding videos with .mp4 extension...')
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Video/',
      MaxKeys: 1000
    })
    
    const listResult = await s3Client.send(listCommand)
    const videoFiles = listResult.Contents?.filter(obj => 
      obj.Key?.endsWith('.mp4')
    ) || []
    
    console.log(`   Found ${videoFiles.length} videos with .mp4 extension`)

    console.log('2️⃣ Renaming videos to -mp4 suffix...')
    let successCount = 0
    let errorCount = 0
    let skipCount = 0

    for (const videoFile of videoFiles) {
      const originalKey = videoFile.Key
      const newKey = originalKey.replace('.mp4', '-mp4')
      
      try {
        // Check if the new key already exists
        const checkCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: newKey,
          MaxKeys: 1
        })
        
        const checkResult = await s3Client.send(checkCommand)
        if (checkResult.Contents && checkResult.Contents.length > 0) {
          console.log(`   ⏭️  Skipping ${originalKey} (already exists as ${newKey})`)
          skipCount++
          continue
        }

        // Copy the object with the new key
        const copyCommand = new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${originalKey}`,
          Key: newKey,
          MetadataDirective: 'COPY'
        })
        
        await s3Client.send(copyCommand)
        console.log(`   ✅ Renamed: ${originalKey} → ${newKey}`)
        successCount++

        // Optional: Delete the original file (uncomment if you want to remove originals)
        // const deleteCommand = new DeleteObjectCommand({
        //   Bucket: BUCKET_NAME,
        //   Key: originalKey
        // })
        // await s3Client.send(deleteCommand)
        // console.log(`   🗑️  Deleted original: ${originalKey}`)

      } catch (error) {
        console.log(`   ❌ Failed to rename ${originalKey}: ${error.message}`)
        errorCount++
      }
    }

    console.log('')
    console.log('📊 Results:')
    console.log(`   ✅ Successfully renamed: ${successCount} videos`)
    console.log(`   ⏭️  Skipped (already exists): ${skipCount} videos`)
    console.log(`   ❌ Failed: ${errorCount} videos`)

    if (successCount > 0) {
      console.log('')
      console.log('🧪 Testing renamed videos...')
      const testVideo = videoFiles[0]
      if (testVideo) {
        const originalUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${testVideo.Key}`
        const newUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${testVideo.Key.replace('.mp4', '-mp4')}`
        
        console.log(`   Testing original: ${originalUrl}`)
        try {
          const originalResponse = await fetch(originalUrl, { method: 'HEAD' })
          console.log(`   Original status: ${originalResponse.status}`)
        } catch (error) {
          console.log(`   Original error: ${error.message}`)
        }
        
        console.log(`   Testing renamed: ${newUrl}`)
        try {
          const newResponse = await fetch(newUrl, { method: 'HEAD' })
          console.log(`   Renamed status: ${newResponse.status}`)
          console.log(`   Renamed content-type: ${newResponse.headers.get('content-type')}`)
          
          if (newResponse.status === 200) {
            console.log('   ✅ Renamed video is accessible!')
          } else {
            console.log('   ❌ Renamed video not accessible')
          }
        } catch (error) {
          console.log(`   Renamed error: ${error.message}`)
        }
      }
    }

  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

// Run the script
renameS3Videos().then(() => {
  console.log('')
  console.log('🏁 Script completed')
  console.log('')
  console.log('💡 Note: Original files are kept for safety.')
  console.log('   You can delete them later if everything works correctly.')
}).catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
