#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function extractRegionFromFolder(folder) {
  if (!folder) return null;
  
  // Split by '/' and take the last part (region)
  const parts = folder.split('/');
  if (parts.length > 1) {
    return parts[parts.length - 1]; // Last part after the last '/'
  }
  
  // If no '/', return the folder as is
  return folder;
}

async function updateRegionFromFolder() {
  try {
    console.log('🔄 Updating region column from folder data...\n');
    
    // Get all records with folder data
    const records = await prisma.$queryRaw`
      SELECT id, folder, region 
      FROM videos_duplicate 
      WHERE folder IS NOT NULL
    `;
    
    console.log(`📊 Found ${records.length} records with folder data`);
    
    // Process each record
    let updatedCount = 0;
    let errorCount = 0;
    const regionStats = new Map();
    
    console.log('\n🔄 Processing records...\n');
    
    for (const record of records) {
      try {
        const extractedRegion = extractRegionFromFolder(record.folder);
        
        if (extractedRegion && extractedRegion !== record.region) {
          // Update the region field
          await prisma.$executeRaw`
            UPDATE "videos_duplicate" 
            SET region = ${extractedRegion}
            WHERE id = ${record.id}
          `;
          
          updatedCount++;
          
          // Track region statistics
          regionStats.set(extractedRegion, (regionStats.get(extractedRegion) || 0) + 1);
          
          // Show progress every 50 updates
          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount}/${records.length} records...`);
          }
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to update record ${record.id}:`, error.message);
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${records.length}`);
    
    // Show region statistics
    console.log('\n📈 Region Distribution:');
    console.log('========================');
    const sortedRegions = Array.from(regionStats.entries())
      .sort((a, b) => b[1] - a[1]);
    
    sortedRegions.forEach(([region, count], i) => {
      console.log(`${i + 1}. ${region}: ${count} records`);
    });
    
    // Show some examples
    console.log('\n📋 Sample Updates:');
    console.log('==================');
    const sampleRecords = records.slice(0, 10);
    for (const record of sampleRecords) {
      const extractedRegion = extractRegionFromFolder(record.folder);
      console.log(`• ${record.folder} → region: ${extractedRegion}`);
    }
    
    // Verify final count
    const finalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM videos_duplicate 
      WHERE region IS NOT NULL
    `;
    
    console.log(`\n🎯 Final Result: ${Number(finalCount[0].count)} records now have region data!`);
    
    return { updatedCount, errorCount, totalProcessed: records.length };
    
  } catch (error) {
    console.error('❌ Error updating region from folder:', error.message);
    return { updatedCount: 0, errorCount: 1, totalProcessed: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    console.log('🚀 Starting region extraction from folder data...\n');
    
    const { updatedCount, errorCount, totalProcessed } = await updateRegionFromFolder();
    
    console.log('\n🎉 Region extraction completed!');
    console.log(`\n📊 Final Summary:`);
    console.log(`   ✅ Successfully updated: ${updatedCount} records`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${totalProcessed}`);
    
    if (updatedCount > 0) {
      console.log(`\n🎯 Success rate: ${Math.round((updatedCount/totalProcessed)*100)}%`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

main();
