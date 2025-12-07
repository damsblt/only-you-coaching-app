#!/usr/bin/env node
/**
 * Script pour supprimer les chiffres au début des titres de vidéos dans Supabase
 * 
 * Usage: node scripts/fix-video-titles-with-numbers.js
 * 
 * Ce script met à jour les titres qui commencent par un chiffre suivi d'un espace,
 * par exemple : "1 extension de jambes..." devient "Extension de jambes..."
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('   Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixVideoTitles() {
  try {
    console.log('🔍 Recherche des titres commençant par un chiffre...\n');
    
    // Récupérer tous les titres (on devra filtrer côté JavaScript)
    // Note: Supabase ne supporte pas directement les regex dans les requêtes
    const { data: allVideos, error: fetchError } = await supabase
      .from('videos_new')
      .select('id, title')
      .order('title');

    if (fetchError) {
      throw fetchError;
    }

    // Filtrer les vidéos dont le titre commence par un chiffre suivi d'un espace
    const videosToUpdate = allVideos.filter(video => {
      return /^\d+\s+/.test(video.title);
    });

    if (videosToUpdate.length === 0) {
      console.log('✅ Aucun titre ne commence par un chiffre. Aucune action nécessaire.');
      return;
    }

    console.log(`📋 ${videosToUpdate.length} titre(s) à modifier :\n`);
    
    // Afficher un aperçu
    videosToUpdate.slice(0, 10).forEach((video, index) => {
      const newTitle = video.title.replace(/^\d+\s+/, '');
      console.log(`   ${index + 1}. "${video.title}"`);
      console.log(`      → "${newTitle}"\n`);
    });

    if (videosToUpdate.length > 10) {
      console.log(`   ... et ${videosToUpdate.length - 10} autre(s)\n`);
    }

    // Mettre à jour chaque titre
    console.log('🔄 Mise à jour des titres...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const video of videosToUpdate) {
      const newTitle = video.title.replace(/^\d+\s+/, '');
      
      const { error: updateError } = await supabase
        .from('videos_new')
        .update({ 
          title: newTitle,
          updatedAt: new Date().toISOString()
        })
        .eq('id', video.id);

      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour de ${video.id}:`, updateError.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          process.stdout.write(`   ✓ ${successCount} titre(s) mis à jour...\r`);
        }
      }
    }

    console.log(`\n✅ Mise à jour terminée !\n`);
    console.log(`   ✓ ${successCount} titre(s) modifié(s) avec succès`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} erreur(s)`);
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    
    const { data: finalVideos, error: finalCheckError } = await supabase
      .from('videos_new')
      .select('id, title');

    if (!finalCheckError && finalVideos) {
      const remainingWithNumbers = finalVideos.filter(v => /^\d+\s+/.test(v.title)).length;
      if (remainingWithNumbers === 0) {
        console.log('✅ Tous les titres ont été corrigés avec succès !');
      } else {
        console.log(`⚠️  ${remainingWithNumbers} titre(s) commence(nt) encore par un chiffre.`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des titres:', error);
    process.exit(1);
  }
}

// Exécuter le script
fixVideoTitles()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

