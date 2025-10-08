#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

function normalizeForMatching(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function extractKeyWords(text) {
  const commonWords = ['le', 'la', 'les', 'de', 'du', 'des', 'avec', 'sur', 'au', 'aux', 'et', 'en', 'pour', 'dans', 'par'];
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .sort();
}

function calculateWordOverlapScore(wixWords, s3Words) {
  const wixSet = new Set(wixWords);
  const s3Set = new Set(s3Words);
  
  const intersection = [...wixSet].filter(word => s3Set.has(word));
  const union = [...new Set([...wixWords, ...s3Words])];
  
  const jaccardScore = intersection.length / union.length;
  const wixCoverage = intersection.length / wixWords.length;
  const s3Coverage = intersection.length / s3Words.length;
  
  return {
    jaccard: jaccardScore,
    wixCoverage: wixCoverage,
    s3Coverage: s3Coverage,
    intersection: intersection,
    totalScore: (jaccardScore + wixCoverage + s3Coverage) / 3
  };
}

async function loadWixData() {
  return new Promise((resolve, reject) => {
    const wixData = [];
    const csvPath = '/Users/damien/Documents/only-you-coaching/Dossier Cliente/Wix CMS/wix-crm.csv';
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        if (row.Title && row.Title.trim()) {
          wixData.push({
            title: row.Title.trim(),
            muscleCible: row['Muscle cible'] || '',
            positionDepart: row['Position de depart'] || '',
            mouvement: row.Mouvement || '',
            theme: row.Thème || '',
            serie: row.serie || '',
            contreIndication: row['Contre-indication'] || ''
          });
        }
      })
      .on('end', () => {
        console.log(`📋 Loaded ${wixData.length} valid records from Wix CRM`);
        resolve(wixData);
      })
      .on('error', reject);
  });
}

async function updateDuplicateMatches() {
  try {
    console.log('🔄 Processing duplicate matches and updating remaining records...\n');
    
    // Load Wix data
    const wixData = await loadWixData();
    
    // Get all videos from videos_duplicate
    const videos = await prisma.$queryRaw`SELECT id, title FROM videos_duplicate`;
    
    console.log(`📊 Videos in videos_duplicate: ${videos.length}`);
    console.log(`📊 Wix CRM records: ${wixData.length}\n`);
    
    const videoMatches = new Map(); // videoId -> best match
    const unmatched = [];
    
    // Find the BEST match for each video
    for (const wixRecord of wixData) {
      const wixWords = extractKeyWords(wixRecord.title);
      let bestMatch = null;
      let bestScore = 0;
      let bestVideoId = null;
      
      for (const video of videos) {
        const s3Words = extractKeyWords(video.title);
        const score = calculateWordOverlapScore(wixWords, s3Words);
        
        if (score.totalScore > bestScore && score.totalScore > 0.4) {
          bestScore = score.totalScore;
          bestMatch = { video, score };
          bestVideoId = video.id;
        }
      }
      
      if (bestMatch && bestVideoId) {
        // Check if this video already has a better match
        if (!videoMatches.has(bestVideoId) || videoMatches.get(bestVideoId).score < bestScore) {
          videoMatches.set(bestVideoId, {
            wix: wixRecord,
            video: bestMatch.video,
            score: bestScore,
            scoreDetails: bestMatch.score
          });
        }
      } else {
        unmatched.push(wixRecord);
      }
    }
    
    console.log(`📊 Analysis Results:`);
    console.log(`   Total Wix records: ${wixData.length}`);
    console.log(`   Videos with matches: ${videoMatches.size}`);
    console.log(`   Unmatched Wix records: ${unmatched.length}\n`);
    
    // Check which videos already have data
    const videosWithData = await prisma.$queryRaw`
      SELECT id FROM videos_duplicate 
      WHERE "startingPosition" IS NOT NULL 
      OR movement IS NOT NULL 
      OR theme IS NOT NULL 
      OR series IS NOT NULL 
      OR constraints IS NOT NULL
    `;
    
    const existingVideoIds = new Set(videosWithData.map(v => v.id));
    const videosToUpdate = [];
    
    for (const [videoId, match] of videoMatches) {
      if (!existingVideoIds.has(videoId)) {
        videosToUpdate.push(match);
      }
    }
    
    console.log(`📊 Update Plan:`);
    console.log(`   Videos already with data: ${existingVideoIds.size}`);
    console.log(`   Videos to update: ${videosToUpdate.length}`);
    console.log(`   Total unique matches: ${videoMatches.size}\n`);
    
    // Update the database
    let updatedCount = 0;
    let errorCount = 0;
    
    console.log('🔄 Starting database updates...\n');
    
    for (const match of videosToUpdate) {
      try {
        // Update the videos_duplicate table with Wix data using raw SQL
        await prisma.$executeRaw`
          UPDATE "videos_duplicate" 
          SET 
            "startingPosition" = ${match.wix.positionDepart || null},
            "movement" = ${match.wix.mouvement || null},
            "theme" = ${match.wix.theme || null},
            "series" = ${match.wix.serie || null},
            "constraints" = ${match.wix.contreIndication || null},
            "title" = ${match.video.title || match.wix.title}
          WHERE "id" = ${match.video.id}
        `;
        
        updatedCount++;
        
        // Show progress every 25 updates
        if (updatedCount % 25 === 0) {
          console.log(`✅ Updated ${updatedCount}/${videosToUpdate.length} records...`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to update video: ${match.wix.title}`, error.message);
      }
    }
    
    console.log('\n📊 Final Update Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${updatedCount + errorCount}`);
    console.log(`   📊 Unmatched records: ${unmatched.length}`);
    
    // Show some examples of updated records
    console.log('\n📋 Sample Updated Records:');
    const sampleMatches = videosToUpdate.slice(0, 5);
    for (const match of sampleMatches) {
      console.log(`\n• "${match.wix.title}" → "${match.video.title}" (${Math.round(match.score * 100)}%)`);
      console.log(`  - Muscle cible: ${match.wix.muscleCible.substring(0, 60)}...`);
      console.log(`  - Position: ${match.wix.positionDepart.substring(0, 60)}...`);
      console.log(`  - Mouvement: ${match.wix.mouvement.substring(0, 60)}...`);
    }
    
    if (unmatched.length > 0) {
      console.log('\n❌ Unmatched Wix Records (first 10):');
      unmatched.slice(0, 10).forEach((record, i) => {
        console.log(`${i + 1}. "${record.title}"`);
      });
    }
    
    // Final count check
    const finalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM videos_duplicate 
      WHERE "startingPosition" IS NOT NULL 
      OR movement IS NOT NULL 
      OR theme IS NOT NULL 
      OR series IS NOT NULL 
      OR constraints IS NOT NULL
    `;
    
    console.log(`\n🎯 Final Result: ${Number(finalCount[0].count)} records now have Wix CRM data!`);
    
    return { updatedCount, errorCount, unmatchedCount: unmatched.length };
    
  } catch (error) {
    console.error('❌ Error updating duplicate matches:', error.message);
    return { updatedCount: 0, errorCount: 1, unmatchedCount: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    console.log('🚀 Starting duplicate match processing and updates...\n');
    
    const { updatedCount, errorCount, unmatchedCount } = await updateDuplicateMatches();
    
    console.log('\n🎉 Duplicate match processing completed!');
    console.log(`\n📊 Final Summary:`);
    console.log(`   ✅ Successfully updated: ${updatedCount} records`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏭️  Unmatched: ${unmatchedCount} records`);
    
    if (updatedCount > 0) {
      console.log(`\n🎯 Success rate: ${Math.round((updatedCount/(updatedCount + errorCount + unmatchedCount))*100)}%`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

main();
