#!/usr/bin/env node

// Test the region extraction logic from the Lambda function
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

function parseCategoryAndRegionFromKey(key) {
  // key: Video/<category-folder>/<region-or-subfolder>/file.mp4
  const parts = key.split('/');
  // parts[0] = 'Video'
  const categoryFolder = parts[1] || '';
  const region = parts[2] || null;
  if (categoryFolder === 'groupes-musculaires') {
    return { category: 'Muscle Groups', region };
  }
  if (categoryFolder === 'programmes-predefinis') {
    return { category: 'Predefined Programs', region };
  }
  return { category: 'General', region };
}

function testRegionExtraction() {
  console.log('🧪 Testing Lambda region extraction logic...\n');
  
  const testCases = [
    'Video/groupes-musculaires/abdos/test-video.mp4',
    'Video/groupes-musculaires/fessiers-jambes/leg-workout.mp4',
    'Video/groupes-musculaires/dos/back-exercise.mp4',
    'Video/programmes-predefinis/pectoraux/chest-program.mp4',
    'Video/programmes-predefinis/machine/machine-workout.mp4',
    'Video/groupes-musculaires/bande/resistance-band.mp4',
    'Video/groupes-musculaires/cardio/cardio-session.mp4',
    'Video/groupes-musculaires/triceps/tricep-exercise.mp4',
    'Video/groupes-musculaires/streching/stretching.mp4',
    'Video/groupes-musculaires/biceps/bicep-curl.mp4',
    'Video/programmes-predefinis/brule-graisse/fat-burn.mp4',
    'Video/programmes-predefinis/haute-intensite/hiit-workout.mp4',
    'Video/programmes-predefinis/rehabilitation-dos/back-rehab.mp4',
    'Video/groupes-musculaires/abdos/crunch-exercise.mp4',
    'Video/programmes-predefinis/femmes/women-program.mp4'
  ];
  
  console.log('📋 Test Results:');
  console.log('================');
  
  testCases.forEach((key, i) => {
    const { category, region: oldRegion } = parseCategoryAndRegionFromKey(key);
    const folder = key.replace(/^Video\//, '').replace(/\/[^\/]+\.mp4$/, '');
    const extractedRegion = extractRegionFromFolder(folder);
    
    console.log(`${i + 1}. ${key}`);
    console.log(`   Folder: ${folder}`);
    console.log(`   Category: ${category}`);
    console.log(`   Old Region: ${oldRegion || 'null'}`);
    console.log(`   Extracted Region: ${extractedRegion}`);
    console.log('');
  });
  
  console.log('✅ Region extraction logic test completed!');
  console.log('\n🎯 The Lambda function will now automatically extract regions from folder paths');
  console.log('   when new videos are uploaded to S3.');
}

testRegionExtraction();
