#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createVideosNewTable() {
  try {
    console.log('🔄 Creating videos_new table and copying data from videos_duplicate...\n');
    
    // Check if videos_new table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'videos_new'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ videos_new table already exists');
    } else {
      console.log('📋 Creating videos_new table...');
      
      // Create the videos_new table
      await prisma.$executeRaw`
        CREATE TABLE "videos_new" (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          "detailedDescription" TEXT,
          thumbnail TEXT,
          "videoUrl" TEXT NOT NULL,
          duration INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          category TEXT NOT NULL,
          region TEXT,
          "muscleGroups" TEXT[],
          "startingPosition" TEXT,
          movement TEXT,
          intensity TEXT,
          theme TEXT,
          series TEXT,
          constraints TEXT,
          tags TEXT[],
          "isPublished" BOOLEAN DEFAULT false,
          "videoType" TEXT DEFAULT 'MUSCLE_GROUPS',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          folder TEXT
        );
      `;
      
      console.log('✅ videos_new table created successfully');
    }
    
    // Check if videos_duplicate table exists
    const duplicateTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'videos_duplicate'
      );
    `;
    
    if (!duplicateTableExists[0].exists) {
      console.log('❌ videos_duplicate table does not exist!');
      console.log('   Please ensure the videos_duplicate table exists before running this script.');
      return;
    }
    
    // Get count from videos_duplicate
    const duplicateCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM videos_duplicate`;
    console.log(`📊 Found ${duplicateCount[0].count} records in videos_duplicate table`);
    
    // Get count from videos_new
    const newCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM videos_new`;
    console.log(`📊 Found ${newCount[0].count} records in videos_new table`);
    
    if (newCount[0].count === 0) {
      console.log('📋 Copying data from videos_duplicate to videos_new...');
      
      // Copy all data from videos_duplicate to videos_new
      await prisma.$executeRaw`
        INSERT INTO "videos_new" (
          id, title, description, "detailedDescription", thumbnail, "videoUrl", 
          duration, difficulty, category, region, "muscleGroups", "startingPosition", 
          movement, intensity, theme, series, constraints, tags, "isPublished", 
          "videoType", "createdAt", "updatedAt", folder
        )
        SELECT 
          id, title, description, "detailedDescription", thumbnail, "videoUrl", 
          duration, difficulty, category, region, "muscleGroups", "startingPosition", 
          movement, intensity, theme, series, constraints, tags, "isPublished", 
          "videoType", "createdAt", "updatedAt", folder
        FROM videos_duplicate;
      `;
      
      console.log('✅ Data copied successfully from videos_duplicate to videos_new');
    } else {
      console.log('✅ videos_new table already has data');
    }
    
    // Final count check
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM videos_new`;
    console.log(`\n🎯 Final result: ${finalCount[0].count} records in videos_new table`);
    
    // Show sample data
    const sampleData = await prisma.$queryRaw`
      SELECT id, title, region, "videoType", "isPublished"
      FROM videos_new 
      LIMIT 5
    `;
    
    console.log('\n📋 Sample data:');
    sampleData.forEach((row, i) => {
      console.log(`   ${i + 1}. "${row.title}" (${row.videoType}, region: ${row.region})`);
    });
    
    console.log('\n🎉 videos_new table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating videos_new table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createVideosNewTable();
