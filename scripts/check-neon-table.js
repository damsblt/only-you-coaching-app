const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Lire .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

if (!connectionString) {
  console.error('❌ DATABASE_URL non trouvé');
  process.exit(1);
}

const checkTable = async () => {
  const pool = new Pool({ connectionString });
  
  try {
    // Vérifier si la table videos_new existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'videos_new'
      );
    `);
    
    console.log('📊 Table videos_new existe:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Compter les vidéos
      const count = await pool.query('SELECT COUNT(*) as count FROM videos_new');
      console.log('📊 Nombre de vidéos:', count.rows[0].count);
      
      // Vérifier les colonnes
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'videos_new'
        ORDER BY ordinal_position;
      `);
      console.log('\n📋 Colonnes de la table:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('\n⚠️  La table videos_new n\'existe pas!');
      console.log('Vérifiant les tables existantes...');
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      console.log('\n📋 Tables existantes:');
      tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
    process.exit(1);
  }
};

checkTable();
