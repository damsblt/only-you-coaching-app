/**
 * Script de diagnostic pour vérifier l'accessibilité des images de recettes
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';

// URLs de test basées sur les recettes typiques
const testUrls = [
  `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/recettes/Recettes_Vol.I/1.png`,
  `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/recettes/Recettes_Vol.II/1.png`,
  `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/recettes/Recettes_Vol.III/1.png`,
];

function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];
      const contentLength = res.headers['content-length'];
      
      // Consume response to free up memory
      res.on('data', () => {});
      res.on('end', () => {
        resolve({
          url,
          status: statusCode,
          accessible: statusCode === 200,
          contentType,
          contentLength,
          error: null,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: null,
        accessible: false,
        contentType: null,
        contentLength: null,
        error: error.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: null,
        accessible: false,
        contentType: null,
        contentLength: null,
        error: 'Timeout',
      });
    });
  });
}

async function main() {
  console.log('🔍 Diagnostic des images de recettes\n');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${AWS_REGION}\n`);
  console.log('Test des URLs d\'images...\n');

  const results = await Promise.all(testUrls.map(testUrl));

  let allAccessible = true;
  let has403 = false;

  results.forEach((result) => {
    if (result.accessible) {
      console.log(`✅ ${result.url}`);
      console.log(`   Status: ${result.status} | Content-Type: ${result.contentType} | Size: ${result.contentLength} bytes\n`);
    } else {
      allAccessible = false;
      if (result.status === 403) {
        has403 = true;
      }
      console.log(`❌ ${result.url}`);
      if (result.status) {
        console.log(`   Status: ${result.status} (${result.status === 403 ? 'Forbidden - Permissions manquantes' : 'Erreur'})\n`);
      } else {
        console.log(`   Erreur: ${result.error || 'Unknown error'}\n`);
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  
  if (allAccessible) {
    console.log('✅ Toutes les images sont accessibles publiquement');
    console.log('   Le problème ne vient pas des permissions S3.');
  } else if (has403) {
    console.log('❌ Problème détecté: Erreur 403 Forbidden');
    console.log('   Les images ne sont pas accessibles publiquement.');
    console.log('\n💡 Solution:');
    console.log('   1. Exécutez le script pour configurer les permissions:');
    console.log('      node scripts/fix-recettes-permissions.js');
    console.log('\n   2. Ou configurez manuellement dans AWS Console:');
    console.log(`      - Allez sur https://console.aws.amazon.com/s3/`);
    console.log(`      - Sélectionnez le bucket: ${BUCKET_NAME}`);
    console.log('      - Onglet "Permissions" → "Bucket policy"');
    console.log('      - Ajoutez la politique depuis: scripts/s3-bucket-policy-recettes.json');
  } else {
    console.log('⚠️  Problème détecté: Les images ne sont pas accessibles');
    console.log('   Vérifiez:');
    console.log('   1. Les fichiers existent dans S3');
    console.log('   2. Les noms de fichiers sont corrects');
    console.log('   3. La région AWS est correcte');
  }
  
  console.log('\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testUrl };
