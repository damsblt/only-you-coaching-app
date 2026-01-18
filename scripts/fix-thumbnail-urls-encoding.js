#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function fixThumbnailUrls() {
  try {
    console.log('🔧 Correction des URLs de thumbnails dans Neon...\n');
    
    // Récupérer toutes les vidéos avec thumbnails
    const videos = await sql`
      SELECT id, thumbnail, "videoUrl"
      FROM videos_new
      WHERE thumbnail IS NOT NULL
      AND thumbnail != ''
      AND "videoType" = 'MUSCLE_GROUPS'
      AND "videoUrl" LIKE '%groupes-musculaires%'
    `;
    
    console.log(`📊 ${videos.length} vidéos à vérifier\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const video of videos) {
      if (!video.thumbnail || !video.thumbnail.includes('thumbnails/')) {
        continue;
      }
      
      // Extraire le chemin du thumbnail de l'URL
      const urlMatch = video.thumbnail.match(/thumbnails\/(.+)$/);
      if (!urlMatch) {
        skipped++;
        continue;
      }
      
      const thumbnailPath = urlMatch[1];
      
      // Séparer le répertoire et le nom de fichier
      const parts = thumbnailPath.split('/');
      const fileName = parts[parts.length - 1];
      const dirPath = parts.slice(0, -1).join('/');
      
      // Encoder correctement le nom de fichier
      const encodedFileName = encodeURIComponent(fileName);
      
      // Construire la nouvelle URL
      const newUrl = `https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/${dirPath}/${encodedFileName}`;
      
      // Vérifier si l'URL a changé
      if (newUrl !== video.thumbnail) {
        await sql`
          UPDATE videos_new
          SET thumbnail = ${newUrl}, "updatedAt" = NOW()
          WHERE id = ${video.id}
        `;
        updated++;
        
        if (updated <= 5) {
          console.log(`✅ [${video.id.substring(0, 8)}] URL corrigée`);
          console.log(`   Avant: ${video.thumbnail.substring(0, 80)}...`);
          console.log(`   Après: ${newUrl.substring(0, 80)}...\n`);
        }
      } else {
        skipped++;
      }
    }
    
    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ Mis à jour: ${updated}`);
    console.log(`   ⏭️  Déjà correct: ${skipped}`);
    console.log(`   📦 Total: ${videos.length}\n`);
    
    console.log('✅ Correction terminée!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixThumbnailUrls();
