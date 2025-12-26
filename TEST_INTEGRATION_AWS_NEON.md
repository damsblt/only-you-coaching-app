# 🧪 Guide de Test - Intégration AWS + Neon

## ✅ Checklist de Vérification

### 1. Vérifier les Routes API

```bash
# Démarrer le serveur
npm run dev

# Tester les routes dans un autre terminal
curl http://localhost:3000/api/videos | jq '.[0]'
curl http://localhost:3000/api/recipes | jq '.recipes[0]'
curl http://localhost:3000/api/audio | jq '.[0]'
```

**Vérifier :**
- ✅ Les données viennent de Neon
- ✅ Les signed URLs S3 sont générées
- ✅ Les thumbnails/images sont accessibles

### 2. Vérifier Lambda

```bash
# Mettre à jour les variables d'environnement Lambda
./scripts/update-lambda-env.sh

# Vérifier la configuration
aws lambda get-function-configuration \
  --function-name only-you-coaching-thumbnail-generator \
  --query 'Environment.Variables' \
  --output table
```

**Vérifier :**
- ✅ `DATABASE_URL` pointe vers Neon
- ✅ `S3_BUCKET_NAME` est correct
- ✅ `AWS_REGION` est correct

### 3. Tester le Flow Complet

#### Test 1 : Upload Vidéo → Lambda → Neon

```bash
# 1. Uploader une vidéo de test dans S3
aws s3 cp test-video.mp4 s3://only-you-coaching/Video/test/test-$(date +%s).mp4

# 2. Surveiller les logs Lambda
aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --follow

# 3. Vérifier dans Neon que le thumbnail a été mis à jour
psql "$DATABASE_URL" -c "
  SELECT id, title, thumbnail 
  FROM videos_new 
  WHERE \"videoUrl\" LIKE '%test%' 
  ORDER BY \"createdAt\" DESC 
  LIMIT 1;
"
```

#### Test 2 : Génération de Signed URLs

```bash
# 1. Récupérer un ID de vidéo
VIDEO_ID=$(psql "$DATABASE_URL" -tAc "SELECT id FROM videos_new WHERE thumbnail IS NOT NULL LIMIT 1")

# 2. Tester la génération de signed URL
curl "http://localhost:3000/api/videos/$VIDEO_ID/thumbnail-url" | jq

# 3. Vérifier que l'URL est valide et accessible
THUMBNAIL_URL=$(curl -s "http://localhost:3000/api/videos/$VIDEO_ID/thumbnail-url" | jq -r '.url')
curl -I "$THUMBNAIL_URL"
```

### 4. Vérifier les Données dans Neon

```bash
# Compter les enregistrements
psql "$DATABASE_URL" -c "
  SELECT 
    'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'videos_new', COUNT(*) FROM videos_new
  UNION ALL
  SELECT 'recipes', COUNT(*) FROM recipes
  UNION ALL
  SELECT 'audios', COUNT(*) FROM audios;
"
```

### 5. Tester les Routes Admin

```bash
# Tester la création d'une vidéo
curl -X POST http://localhost:3000/api/admin/videos-new \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Video",
    "videoUrl": "https://only-you-coaching.s3.eu-north-1.amazonaws.com/Video/test/test.mp4",
    "difficulty": "debutant",
    "isPublished": false
  }' | jq
```

## 🐛 Dépannage

### Problème : Lambda ne se connecte pas à Neon

**Solution :**
1. Vérifier `DATABASE_URL` dans les variables Lambda
2. Vérifier que la Lambda a accès à Internet (pas de VPC restrictif)
3. Vérifier les logs CloudWatch pour les erreurs de connexion

### Problème : Signed URLs ne fonctionnent pas

**Solution :**
1. Vérifier les credentials AWS dans `.env.local`
2. Vérifier que le bucket S3 existe
3. Vérifier les permissions IAM

### Problème : Thumbnails ne sont pas générés

**Solution :**
1. Vérifier que Lambda se déclenche (logs CloudWatch)
2. Vérifier que ffmpeg est disponible dans Lambda layer
3. Vérifier que Lambda a les permissions S3

## ✨ Tests Automatisés

Créer un script de test complet :

```bash
#!/bin/bash
# scripts/test-aws-neon-integration.sh

echo "🧪 Test d'intégration AWS + Neon"
echo "================================"

# Test 1: Connexion Neon
echo "1️⃣  Test connexion Neon..."
npm run test-neon

# Test 2: Routes API
echo "2️⃣  Test routes API..."
curl -s http://localhost:3000/api/videos | jq 'length' || echo "❌ API non disponible"

# Test 3: Lambda config
echo "3️⃣  Test configuration Lambda..."
aws lambda get-function-configuration \
  --function-name only-you-coaching-thumbnail-generator \
  --query 'Environment.Variables.DATABASE_URL' \
  --output text | grep -q "neon" && echo "✅ Lambda configurée" || echo "❌ Lambda non configurée"

echo ""
echo "✨ Tests terminés!"
```

---

**📝 Note :** Assurez-vous que le serveur de développement est démarré avant de tester les routes API.

