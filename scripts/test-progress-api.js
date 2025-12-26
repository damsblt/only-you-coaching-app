#!/usr/bin/env node
/**
 * Script to test the progress API and database directly
 * Run: node scripts/test-progress-api.js
 */

const { pool } = require('../lib/db')

async function testProgress() {
  const userId = '79009ecc-7fec-486a-9602-fbec0e2008f9'
  const videoId = 'b715f139-e108-4c48-b79f-dc44350ef74c'
  const region = 'abdos'

  try {
    console.log('🔍 Testing progress API...\n')

    // 1. Check if progress exists for this user and video
    console.log('1️⃣ Checking progress for user and video...')
    const progressQuery = `
      SELECT * FROM "user_video_progress" 
      WHERE "user_id" = $1::uuid AND "video_id" = $2
    `
    const progressResult = await pool.query(progressQuery, [userId, videoId])
    console.log('   Progress records found:', progressResult.rows.length)
    if (progressResult.rows.length > 0) {
      console.log('   First record:', JSON.stringify(progressResult.rows[0], null, 2))
    }

    // 2. Check all progress for this user
    console.log('\n2️⃣ Checking all progress for user...')
    const allProgressQuery = `SELECT * FROM "user_video_progress" WHERE "user_id" = $1::uuid`
    const allProgressResult = await pool.query(allProgressQuery, [userId])
    console.log('   Total progress records:', allProgressResult.rows.length)
    if (allProgressResult.rows.length > 0) {
      console.log('   Video IDs in DB:', allProgressResult.rows.map(r => r.video_id))
    }

    // 3. Get videos for the region
    console.log('\n3️⃣ Getting videos for region...')
    const videosQuery = `
      SELECT id, title, region, "videoType" 
      FROM videos_new 
      WHERE region = $1 AND "videoType" = 'PROGRAMMES' AND "isPublished" = true
    `
    const videosResult = await pool.query(videosQuery, [region])
    console.log('   Videos found:', videosResult.rows.length)
    const videoIds = videosResult.rows.map(v => v.id)
    console.log('   Video IDs:', videoIds)

    // 4. Check if progress exists for these videos
    console.log('\n4️⃣ Checking progress for these videos...')
    if (videoIds.length > 0) {
      const placeholders = videoIds.map((_, i) => `$${i + 2}`).join(', ')
      const progressForVideosQuery = `
        SELECT * FROM "user_video_progress" 
        WHERE "user_id" = $1::uuid AND "video_id" IN (${placeholders})
      `
      const progressForVideosResult = await pool.query(
        progressForVideosQuery,
        [userId, ...videoIds]
      )
      console.log('   Progress records found:', progressForVideosResult.rows.length)
      if (progressForVideosResult.rows.length > 0) {
        console.log('   Progress records:', JSON.stringify(progressForVideosResult.rows, null, 2))
      } else {
        console.log('   ⚠️ No progress found for these videos!')
        console.log('   This might be the issue - the video IDs might not match.')
      }
    }

    // 5. Check data types
    console.log('\n5️⃣ Checking data types...')
    const typesQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'user_video_progress' AND column_name IN ('user_id', 'video_id')
      ORDER BY column_name
    `
    const typesResult = await pool.query(typesQuery)
    console.log('   Column types:', JSON.stringify(typesResult.rows, null, 2))

    console.log('\n✅ Test completed!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

testProgress()










