const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Lire .env.local directement
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

if (!connectionString) {
  console.error('❌ DATABASE_URL non trouvé dans .env.local');
  process.exit(1);
}

console.log('🔍 Test de connexion Neon...');
console.log('📍 Host:', connectionString.match(/@([^/]+)/)?.[1] || 'N/A');

const testConnection = async () => {
  try {
    const pool = new Pool({ connectionString });
    const result = await pool.query('SELECT version(), current_database(), current_user');
    console.log('✅ Connexion réussie!');
    console.log('📊 Version PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    console.log('📊 Base de données:', result.rows[0].current_database);
    console.log('📊 Utilisateur:', result.rows[0].current_user);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  }
};

testConnection();
