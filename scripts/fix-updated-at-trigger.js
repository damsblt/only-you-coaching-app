/**
 * Script pour corriger le trigger updatedAt dans Neon
 * Exécute le script SQL pour créer la fonction et le trigger corrects
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

async function fixTrigger() {
  console.log('🔧 Correction du trigger updatedAt pour videos_new...\n')
  
  const sql = neon(databaseUrl)
  
  try {
    // Lire le script SQL
    const sqlFile = path.join(__dirname, 'fix-updated-at-trigger.sql')
    const sqlScript = fs.readFileSync(sqlFile, 'utf8')
    
    // Exécuter le script SQL
    // Note: neon() ne supporte pas les scripts multi-lignes directement
    // On doit exécuter chaque commande séparément
    
    console.log('1️⃣ Création de la fonction update_updated_at_camelcase()...')
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_camelcase()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
    console.log('   ✅ Fonction créée\n')
    
    console.log('2️⃣ Suppression de l\'ancien trigger...')
    await sql`
      DROP TRIGGER IF EXISTS update_videos_new_updated_at ON videos_new;
    `
    console.log('   ✅ Ancien trigger supprimé\n')
    
    console.log('3️⃣ Création du nouveau trigger...')
    await sql`
      CREATE TRIGGER update_videos_new_updated_at 
        BEFORE UPDATE ON videos_new 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_camelcase();
    `
    console.log('   ✅ Nouveau trigger créé\n')
    
    console.log('4️⃣ Vérification du trigger...')
    const triggers = await sql`
      SELECT 
        trigger_name, 
        event_manipulation, 
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'videos_new';
    `
    
    if (triggers && triggers.length > 0) {
      console.log('   ✅ Trigger vérifié:')
      triggers.forEach(trigger => {
        console.log(`      - ${trigger.trigger_name} (${trigger.event_manipulation})`)
      })
    } else {
      console.log('   ⚠️  Aucun trigger trouvé')
    }
    
    console.log('\n✅ Correction terminée! Le trigger updatedAt fonctionne maintenant correctement.\n')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    process.exit(1)
  }
}

fixTrigger()












