#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function checkThumbnailsStatus() {
  try {
    const stats = await sql`
      SELECT 
        region,
        COUNT(*) as total,
        COUNT(thumbnail) FILTER (WHERE thumbnail IS NOT NULL AND thumbnail != '') as with_thumbnail,
        COUNT(*) FILTER (WHERE thumbnail IS NULL OR thumbnail = '') as without_thumbnail
      FROM videos_new
      WHERE "videoType" = 'MUSCLE_GROUPS'
      AND "videoUrl" LIKE '%groupes-musculaires%'
      GROUP BY region
      ORDER BY region
    `;
    
    console.log('\n🖼️  État des thumbnails par groupe musculaire:\n');
    let totalVideos = 0;
    let totalWith = 0;
    let totalWithout = 0;
    
    stats.forEach(s => {
      totalVideos += parseInt(s.total);
      totalWith += parseInt(s.with_thumbnail);
      totalWithout += parseInt(s.without_thumbnail);
      const regionStr = s.region.padEnd(15);
      const withStr = s.with_thumbnail.toString().padStart(3);
      const withoutStr = s.without_thumbnail.toString().padStart(3);
      console.log(`${regionStr} - ${withStr} avec / ${withoutStr} sans / ${s.total} total`);
    });
    
    console.log(`\nTOTAL           - ${totalWith.toString().padStart(3)} avec / ${totalWithout.toString().padStart(3)} sans / ${totalVideos} total\n`);
    
    if (totalWithout > 0) {
      console.log(`⚠️  ${totalWithout} vidéos n'ont pas encore de thumbnail\n`);
    } else {
      console.log(`✅ Tous les thumbnails sont générés!\n`);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkThumbnailsStatus();
