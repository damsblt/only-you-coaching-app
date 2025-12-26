/**
 * Script pour synchroniser les recettes depuis S3 vers Neon
 * 
 * Usage:
 *   node scripts/sync-recipes-from-s3.js
 * 
 * Ce script:
 * 1. Vérifie que la table recipes existe dans Neon
 * 2. Liste les dossiers dans s3://only-you-coaching/recettes/
 * 3. Synchronise chaque dossier comme une recette dans Neon
 */

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const DATABASE_URL = process.env.DATABASE_URL;
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant dans .env.local');
  process.exit(1);
}

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials manquantes dans .env.local');
  console.error('   Nécessaire: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Helper functions
function generateSlug(folderName) {
  return folderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateTitle(folderName) {
  return folderName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function detectCategory(folderName) {
  const lower = folderName.toLowerCase();
  if (lower.includes('vegetari') || lower.includes('veggie')) {
    return 'vegetarian';
  }
  if (lower.includes('breakfast') || lower.includes('petit-dejeuner') || lower.includes('déjeuner')) {
    return 'breakfast';
  }
  if (lower.includes('lunch') || lower.includes('dejeuner')) {
    return 'lunch';
  }
  if (lower.includes('dinner') || lower.includes('diner')) {
    return 'dinner';
  }
  if (lower.includes('snack')) {
    return 'snack';
  }
  return 'vegetarian'; // Default
}

async function checkTableExists() {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes'
      ) as exists;
    `;
    return result[0]?.exists || false;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la table:', error.message);
    return false;
  }
}

async function checkColumnExists(columnName) {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = ${columnName}
      ) as exists;
    `;
    return result[0]?.exists || false;
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de la colonne ${columnName}:`, error.message);
    return false;
  }
}

async function addMissingColumns() {
  console.log('🔍 Vérification des colonnes manquantes...');
  
  const pdfUrlExists = await checkColumnExists('pdf_url');
  if (!pdfUrlExists) {
    try {
      await sql`ALTER TABLE recipes ADD COLUMN IF NOT EXISTS pdf_url TEXT;`;
      console.log(`✅ Colonne pdf_url ajoutée`);
    } catch (error) {
      console.warn(`⚠️  Erreur lors de l'ajout de la colonne pdf_url:`, error.message);
    }
  } else {
    console.log(`✅ Colonne pdf_url existe déjà`);
  }
}

async function createTable() {
  console.log('📋 Création de la table recipes...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS recipes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      images JSONB DEFAULT '[]'::jsonb,
      category VARCHAR(50) NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'vegetarian')),
      prep_time INTEGER NOT NULL,
      servings INTEGER NOT NULL DEFAULT 1,
      is_vegetarian BOOLEAN DEFAULT false,
      difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
      tags JSONB DEFAULT '[]'::jsonb,
      ingredients JSONB DEFAULT '[]'::jsonb,
      instructions TEXT,
      nutrition_info JSONB,
      pdf_url TEXT,
      is_premium BOOLEAN DEFAULT false,
      is_published BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      published_at TIMESTAMP WITH TIME ZONE
    );
  `;

  const createIndexesSQL = [
    `CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON recipes(is_published);`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_is_premium ON recipes(is_premium);`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_published_at ON recipes(published_at);`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_tags_gin ON recipes USING GIN (tags);`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_ingredients_gin ON recipes USING GIN (ingredients);`,
  ];

  try {
    await sql(createTableSQL);
    console.log('✅ Table recipes créée');
    
    for (const indexSQL of createIndexesSQL) {
      try {
        await sql(indexSQL);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          console.warn('⚠️  Erreur lors de la création de l\'index:', err.message);
        }
      }
    }
    console.log('✅ Index créés');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error.message);
    return false;
  }
}

async function listRecipeFolders() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'recettes/',
      Delimiter: '/',
    });

    const response = await s3Client.send(command);

    if (!response.CommonPrefixes || response.CommonPrefixes.length === 0) {
      console.log('⚠️  Aucun dossier de recette trouvé dans S3');
      return [];
    }

    const folders = response.CommonPrefixes
      .map(prefix => prefix.Prefix)
      .filter(prefix => !!prefix)
      .map(prefix => prefix.replace('recettes/', '').replace('/', ''))
      .filter(folder => folder.length > 0);

    return folders;
  } catch (error) {
    console.error('❌ Erreur lors de la liste des dossiers S3:', error.message);
    return [];
  }
}

async function getFilesInFolder(folderName) {
  try {
    const prefix = `recettes/${folderName}/`;
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return { images: [], pdfs: [] };
    }

    const imageFiles = response.Contents
      .map(obj => obj.Key)
      .filter(key => {
        if (!key) return false;
        const ext = key.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
      })
      .sort();

    const pdfFiles = response.Contents
      .map(obj => obj.Key)
      .filter(key => {
        if (!key) return false;
        const ext = key.split('.').pop()?.toLowerCase();
        return ext === 'pdf';
      });

    return { images: imageFiles, pdfs: pdfFiles };
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des fichiers pour ${folderName}:`, error.message);
    return { images: [], pdfs: [] };
  }
}

async function syncRecipe(folderName) {
  try {
    const { images, pdfs } = await getFilesInFolder(folderName);

    if (images.length === 0) {
      console.log(`⚠️  Aucune image trouvée dans ${folderName}, ignoré`);
      return { action: 'skipped', reason: 'no images' };
    }

    const imageUrls = images.map(key => `${S3_BASE_URL}/${key}`);
    const mainImage = imageUrls[0] || '';
    const pdfUrl = pdfs.length > 0 ? `${S3_BASE_URL}/${pdfs[0]}` : null;

    const slug = generateSlug(folderName);
    const title = generateTitle(folderName);
    const category = detectCategory(folderName);
    const description = `Collection de recettes: ${title}`;

    // Check if recipe exists
    const existing = await sql`
      SELECT id, slug, title, image 
      FROM recipes 
      WHERE slug = ${slug} OR image = ${mainImage}
      LIMIT 1
    `;

    const now = new Date().toISOString();

    if (existing.length > 0) {
      // Update existing recipe
      await sql`
        UPDATE recipes 
        SET 
          image = ${mainImage},
          images = ${JSON.stringify(imageUrls)}::jsonb,
          pdf_url = ${pdfUrl},
          updated_at = ${now}
        WHERE id = ${existing[0].id}
      `;
      console.log(`✅ Mis à jour: ${title} (${imageUrls.length} images)`);
      return { action: 'updated', title, slug };
    } else {
      // Create new recipe
      await sql`
        INSERT INTO recipes (
          title, slug, description, image, images, pdf_url,
          category, prep_time, servings, is_vegetarian, difficulty,
          tags, ingredients, instructions,
          is_premium, is_published, published_at, created_at, updated_at
        ) VALUES (
          ${title},
          ${slug},
          ${description},
          ${mainImage},
          ${JSON.stringify(imageUrls)}::jsonb,
          ${pdfUrl},
          ${category},
          ${30},
          ${4},
          ${category === 'vegetarian'},
          ${'medium'},
          ${JSON.stringify([category, 'recettes'])}::jsonb,
          ${JSON.stringify([])}::jsonb,
          ${''},
          ${false},
          ${true},
          ${now},
          ${now},
          ${now}
        )
      `;
      console.log(`✅ Créé et publié: ${title} (${imageUrls.length} images)`);
      return { action: 'created', title, slug };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la synchronisation de ${folderName}:`, error.message);
    return { action: 'error', error: error.message };
  }
}

async function main() {
  console.log('🚀 Synchronisation des recettes depuis S3 vers Neon\n');
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`🗄️  Base de données: Neon\n`);

  // Check if table exists
  console.log('🔍 Vérification de la table recipes...');
  const tableExists = await checkTableExists();

  if (!tableExists) {
    console.log('⚠️  La table recipes n\'existe pas');
    const created = await createTable();
    if (!created) {
      console.error('❌ Impossible de créer la table. Arrêt.');
      process.exit(1);
    }
  } else {
    console.log('✅ La table recipes existe');
    // Vérifier et ajouter les colonnes manquantes
    await addMissingColumns();
    console.log('');
  }

  // List recipe folders
  console.log('📁 Liste des dossiers de recettes dans S3...');
  const folders = await listRecipeFolders();

  if (folders.length === 0) {
    console.log('⚠️  Aucun dossier de recette trouvé');
    console.log(`   Vérifiez que les fichiers sont dans: s3://${BUCKET_NAME}/recettes/`);
    process.exit(0);
  }

  console.log(`✅ ${folders.length} dossier(s) trouvé(s):\n`);
  folders.forEach((folder, i) => {
    console.log(`   ${i + 1}. ${folder}`);
  });
  console.log('');

  // Sync each folder
  console.log('🔄 Synchronisation des recettes...\n');
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const folder of folders) {
    const result = await syncRecipe(folder);
    if (result.action === 'created') {
      createdCount++;
    } else if (result.action === 'updated') {
      updatedCount++;
    } else if (result.action === 'error') {
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Résumé de la synchronisation:');
  console.log(`   ✅ ${createdCount} recette(s) créée(s)`);
  console.log(`   🔄 ${updatedCount} recette(s) mise(s) à jour`);
  if (errorCount > 0) {
    console.log(`   ❌ ${errorCount} erreur(s)`);
  }
  console.log('='.repeat(60));
  console.log('\n💡 Les recettes sont maintenant disponibles sur:');
  console.log('   http://localhost:3000/recettes\n');
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

