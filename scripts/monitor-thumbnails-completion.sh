#!/bin/bash

# Script de monitoring pour vérifier la fin des processus de génération et synchronisation

echo "🔍 Monitoring des processus de génération et synchronisation..."
echo ""

# Fonction pour vérifier si un processus est actif
check_process() {
    local pid=$1
    local name=$2
    if ps -p $pid > /dev/null 2>&1; then
        return 0  # Processus actif
    else
        return 1  # Processus terminé
    fi
}

# Vérifier les PIDs
LAMBDA_PID=$(cat /tmp/lambda-thumbnails.pid 2>/dev/null)
SYNC_PID=$(cat /tmp/sync-thumbnails-wait.pid 2>/dev/null)

echo "📋 PIDs à surveiller:"
echo "   Génération thumbnails: ${LAMBDA_PID:-N/A}"
echo "   Synchronisation: ${SYNC_PID:-N/A}"
echo ""

# Attendre que les deux processus soient terminés
while true; do
    LAMBDA_RUNNING=0
    SYNC_RUNNING=0
    
    if [ ! -z "$LAMBDA_PID" ] && check_process $LAMBDA_PID "lambda-thumbnails"; then
        LAMBDA_RUNNING=1
    fi
    
    if [ ! -z "$SYNC_PID" ] && check_process $SYNC_PID "sync-thumbnails"; then
        SYNC_RUNNING=1
    fi
    
    if [ $LAMBDA_RUNNING -eq 0 ] && [ $SYNC_RUNNING -eq 0 ]; then
        echo ""
        echo "✅ Tous les processus sont terminés !"
        echo ""
        break
    fi
    
    # Afficher le statut toutes les 5 minutes
    if [ $(($(date +%s) % 300)) -eq 0 ]; then
        echo "⏳ $(date +%H:%M:%S) - En attente..."
        if [ $LAMBDA_RUNNING -eq 1 ]; then
            echo "   🔄 Génération en cours..."
        fi
        if [ $SYNC_RUNNING -eq 1 ]; then
            echo "   ⏰ Synchronisation programmée..."
        fi
    fi
    
    sleep 60  # Vérifier toutes les minutes
done

# Attendre encore 2 minutes pour être sûr que tout est bien terminé
echo "⏳ Attente finale de 2 minutes..."
sleep 120

echo ""
echo "📊 Génération du rapport final..."
echo ""

# Lancer le script de vérification finale
cd "$(dirname "$0")/.."
node -e "
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  console.log('\\n${'='.repeat(60)}');
  console.log('📊 RAPPORT FINAL - THUMBNAILS');
  console.log('${'='.repeat(60)}\\n');
  
  const stats = await sql\`
    SELECT 
      region,
      COUNT(*) as total,
      COUNT(CASE WHEN thumbnail IS NOT NULL AND thumbnail != '' THEN 1 END) as with_thumbnail,
      COUNT(CASE WHEN thumbnail IS NULL OR thumbnail = '' THEN 1 END) as without_thumbnail
    FROM videos_new
    WHERE \"videoType\" = 'MUSCLE_GROUPS'
    GROUP BY region
    ORDER BY region
  \`;
  
  console.log('Region'.padEnd(20) + 'Total'.padEnd(10) + 'Avec thumb'.padEnd(15) + 'Sans thumb'.padEnd(15) + '%');
  console.log('-'.repeat(70));
  
  let totalVideos = 0;
  let totalWithThumb = 0;
  let totalWithoutThumb = 0;
  
  stats.forEach(s => {
    totalVideos += Number(s.total);
    totalWithThumb += Number(s.with_thumbnail);
    totalWithoutThumb += Number(s.without_thumbnail);
    const percentage = ((s.with_thumbnail / s.total) * 100).toFixed(0);
    const status = percentage == 100 ? '✅' : percentage >= 80 ? '🟡' : '🔴';
    console.log(
      (s.region + ' ' + status).padEnd(20) + 
      s.total.toString().padEnd(10) + 
      s.with_thumbnail.toString().padEnd(15) + 
      s.without_thumbnail.toString().padEnd(15) + 
      percentage + '%'
    );
  });
  
  console.log('-'.repeat(70));
  const totalPercentage = ((totalWithThumb / totalVideos) * 100).toFixed(1);
  console.log('TOTAL'.padEnd(20) + totalVideos.toString().padEnd(10) + totalWithThumb.toString().padEnd(15) + totalWithoutThumb.toString().padEnd(15) + totalPercentage + '%');
  console.log('');
  
  // Vérifier les thumbnails sur S3
  console.log('\\n📦 Vérification des thumbnails sur S3...');
  const { execSync } = require('child_process');
  
  const regions = ['dos', 'pectoraux', 'abdos', 'biceps', 'triceps', 'epaules', 'streching', 'cardio', 'bande'];
  let s3Total = 0;
  
  for (const region of regions) {
    try {
      const count = execSync(\`aws s3 ls s3://only-you-coaching/thumbnails/Video/groupes-musculaires/\${region}/ --recursive 2>/dev/null | wc -l\`, { encoding: 'utf-8' }).trim();
      const num = parseInt(count) || 0;
      s3Total += num;
      if (num > 0) {
        console.log(\`   \${region}: \${num} thumbnails\`);
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  console.log(\`\\n   Total sur S3: \${s3Total} thumbnails\`);
  console.log(\`   Total dans Neon: \${totalWithThumb} vidéos avec thumbnail\`);
  console.log('');
  
  console.log('${'='.repeat(60)}');
  console.log('✅ RAPPORT TERMINÉ');
  console.log('${'='.repeat(60)}\\n');
})();
"

echo ""
echo "✅ Monitoring terminé !"
echo ""
