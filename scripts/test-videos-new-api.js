#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVideosNewAPI() {
  try {
    console.log('🧪 Testing videos_new table and API integration...\n');
    
    // Test 1: Check if videos_new table exists and has data
    console.log('📊 Checking videos_new table...');
    const totalCountResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM videos_new`;
    const totalCount = Number(totalCountResult[0].count);
    console.log(`   Total records in videos_new: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('❌ No data found in videos_new table!');
      console.log('   You may need to copy data from videos_duplicate to videos_new');
      return;
    }
    
    // Test 2: Check videoType distribution
    console.log('\n📈 VideoType distribution:');
    const videoTypeStats = await prisma.$queryRaw`
      SELECT "videoType", COUNT(*) as count 
      FROM videos_new 
      GROUP BY "videoType"
    `;
    
    videoTypeStats.forEach(row => {
      console.log(`   ${row.videoType}: ${row.count} videos`);
    });
    
    // Test 3: Check region distribution
    console.log('\n📈 Region distribution (top 10):');
    const regionStats = await prisma.$queryRaw`
      SELECT region, COUNT(*) as count 
      FROM videos_new 
      WHERE region IS NOT NULL
      GROUP BY region 
      ORDER BY count DESC 
      LIMIT 10
    `;
    
    regionStats.forEach(row => {
      console.log(`   ${row.region}: ${row.count} videos`);
    });
    
    // Test 4: Test PROGRAMMES filtering
    console.log('\n🎯 Testing PROGRAMMES filtering:');
    const programmesVideos = await prisma.$queryRaw`
      SELECT id, title, region, "videoType"
      FROM videos_new 
      WHERE "videoType" = 'PROGRAMMES' AND "isPublished" = true
      LIMIT 5
    `;
    
    console.log(`   Found ${programmesVideos.length} PROGRAMMES videos (showing first 5):`);
    programmesVideos.forEach((video, i) => {
      console.log(`   ${i + 1}. "${video.title}" (region: ${video.region})`);
    });
    
    // Test 5: Test MUSCLE_GROUPS filtering
    console.log('\n🎯 Testing MUSCLE_GROUPS filtering:');
    const muscleGroupVideos = await prisma.$queryRaw`
      SELECT id, title, region, "videoType"
      FROM videos_new 
      WHERE "videoType" = 'MUSCLE_GROUPS' AND "isPublished" = true
      LIMIT 5
    `;
    
    console.log(`   Found ${muscleGroupVideos.length} MUSCLE_GROUPS videos (showing first 5):`);
    muscleGroupVideos.forEach((video, i) => {
      console.log(`   ${i + 1}. "${video.title}" (region: ${video.region})`);
    });
    
    // Test 6: Test region filtering for programmes
    console.log('\n🎯 Testing region filtering for programmes:');
    const pectorauxVideos = await prisma.$queryRaw`
      SELECT id, title, region
      FROM videos_new 
      WHERE "videoType" = 'PROGRAMMES' AND region = 'pectoraux' AND "isPublished" = true
      LIMIT 3
    `;
    
    console.log(`   Found ${pectorauxVideos.length} pectoraux programme videos:`);
    pectorauxVideos.forEach((video, i) => {
      console.log(`   ${i + 1}. "${video.title}"`);
    });
    
    // Test 7: Test region filtering for muscle groups
    console.log('\n🎯 Testing region filtering for muscle groups:');
    const abdosVideos = await prisma.$queryRaw`
      SELECT id, title, region
      FROM videos_new 
      WHERE "videoType" = 'MUSCLE_GROUPS' AND region = 'abdos' AND "isPublished" = true
      LIMIT 3
    `;
    
    console.log(`   Found ${abdosVideos.length} abdos muscle group videos:`);
    abdosVideos.forEach((video, i) => {
      console.log(`   ${i + 1}. "${video.title}"`);
    });
    
    console.log('\n✅ API integration test completed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Test the /programmes page');
    console.log('   3. Test the /videos page');
    console.log('   4. Verify filtering works correctly');
    
  } catch (error) {
    console.error('❌ Error testing videos_new API:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVideosNewAPI();
