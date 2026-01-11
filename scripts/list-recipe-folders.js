/**
 * Script pour lister les dossiers de recettes dans S3
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const awsRegion = process.env.AWS_REGION || 'eu-north-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';

if (!awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ AWS credentials not found in environment variables');
  process.exit(1);
}

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

async function listRecipeFolders() {
  try {
    console.log('📁 Liste des dossiers de recettes dans S3\n');
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Region: ${awsRegion}\n`);

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'recettes/',
      Delimiter: '/',
    });

    const response = await s3Client.send(command);

    if (!response.CommonPrefixes || response.CommonPrefixes.length === 0) {
      console.log('⚠️  Aucun dossier de recette trouvé dans S3');
      console.log(`   Vérifiez que les fichiers sont dans: s3://${BUCKET_NAME}/recettes/`);
      return;
    }

    const folders = response.CommonPrefixes
      .map(prefix => prefix.Prefix)
      .filter(prefix => !!prefix)
      .map(prefix => prefix.replace('recettes/', '').replace('/', ''))
      .filter(folder => folder.length > 0);

    console.log(`✅ ${folders.length} dossier(s) trouvé(s):\n`);
    folders.forEach((folder, i) => {
      console.log(`   ${i + 1}. ${folder}`);
    });

    // Vérifier spécifiquement les Vol.I, Vol.II, Vol.III
    console.log('\n🔍 Vérification des volumes:\n');
    const volumes = ['Recettes_Vol.I', 'Recettes_Vol.II', 'Recettes_Vol.III'];
    volumes.forEach(vol => {
      const exists = folders.some(f => f === vol || f.includes(vol));
      if (exists) {
        console.log(`   ✅ ${vol} - Existe`);
      } else {
        console.log(`   ❌ ${vol} - N'existe pas`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la liste des dossiers S3:', error.message);
  }
}

if (require.main === module) {
  listRecipeFolders();
}

module.exports = { listRecipeFolders };
