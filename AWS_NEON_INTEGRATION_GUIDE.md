# 🔗 Guide d'Intégration AWS (S3, Lambda) avec Neon

## ✅ État de l'Intégration

### Terminé
1. ✅ **Routes API migrées vers Neon** :
   - `/api/videos` ✅
   - `/api/recipes` ✅
   - `/api/audio` ✅
   - `/api/videos/[id]/thumbnail-url` ✅
   - `/api/videos/[id]/thumbnail` ✅
   - `/api/recipes/[id]` ✅
   - `/api/admin/videos-new` ✅

2. ✅ **S3 Functions** (`lib/s3.ts`) :
   - Fonctions S3 indépendantes de la base de données
   - Génération de signed URLs fonctionne avec Neon
   - Upload/Delete fonctionnent normalement

3. ✅ **Lambda Function** :
   - Code Lambda créé (`lambda/index.js`)
   - Utilise Neon au lieu de Supabase
   - Script de déploiement mis à jour

## 🔄 Flow Complet

### 1. Upload de Vidéo → S3 → Lambda → Neon

```
1. Utilisateur upload une vidéo via admin
   ↓
2. Vidéo uploadée dans S3 (Video/*.mp4 ou videos/*.mp4)
   ↓
3. S3 déclenche Lambda automatiquement
   ↓
4. Lambda génère thumbnail (avec ffmpeg layer)
   ↓
5. Lambda upload thumbnail dans S3 (thumbnails/*.jpg)
   ↓
6. Lambda met à jour Neon avec l'URL du thumbnail
```

### 2. Génération de Signed URLs

```
1. Client demande une vidéo/audio/image
   ↓
2. API route récupère l'URL S3 depuis Neon
   ↓
3. API génère une signed URL S3 (valide 24h)
   ↓
4. Client reçoit la signed URL et peut accéder au fichier
```

## 📋 Configuration Lambda

### Variables d'Environnement Lambda

La Lambda nécessite ces variables :
- `DATABASE_URL` - URL de connexion Neon
- `AWS_REGION` - Région AWS (eu-north-1)
- `S3_BUCKET_NAME` - Nom du bucket S3

### Déploiement Lambda

```bash
# 1. Charger les variables d'environnement
export DATABASE_URL="postgresql://..."
# OU charger depuis .env.local
source <(grep DATABASE_URL .env.local | grep -v '^#' | sed 's/^/export /')

# 2. Déployer
./scripts/deploy-lambda.sh
```

## 🔧 Mise à Jour Lambda Existante

Si vous avez déjà une Lambda déployée :

```bash
# 1. Mettre à jour les variables d'environnement
aws lambda update-function-configuration \
  --function-name only-you-coaching-thumbnail-generator \
  --environment Variables="{
    S3_BUCKET_NAME=only-you-coaching,
    AWS_REGION=eu-north-1,
    DATABASE_URL=postgresql://...
  }"

# 2. Mettre à jour le code
cd lambda
npm install @neondatabase/serverless
zip -r ../lambda-deployment.zip .
cd ..
aws lambda update-function-code \
  --function-name only-you-coaching-thumbnail-generator \
  --zip-file fileb://lambda-deployment.zip
```

## 🧪 Tester l'Intégration

### 1. Tester S3 → API

```bash
# Tester la génération de signed URL
curl http://localhost:3000/api/videos/[video-id]/thumbnail-url
```

### 2. Tester Lambda

```bash
# Uploader une vidéo de test dans S3
aws s3 cp test-video.mp4 s3://only-you-coaching/Video/test/test.mp4

# Vérifier les logs Lambda
aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --follow
```

### 3. Vérifier la Base de Données

```bash
# Vérifier que le thumbnail a été mis à jour
npm run test-neon
# OU
psql "$DATABASE_URL" -c "SELECT id, title, thumbnail FROM videos_new WHERE thumbnail IS NOT NULL LIMIT 5;"
```

## 📝 Routes API Utilisant S3

### Routes qui génèrent des Signed URLs

1. **`/api/videos`** - Génère signed URLs pour thumbnails
2. **`/api/videos/[id]/thumbnail-url`** - Génère signed URL pour un thumbnail spécifique
3. **`/api/recipes`** - Génère signed URLs pour images de recettes
4. **`/api/recipes/[id]`** - Génère signed URLs pour images et PDF
5. **`/api/audio`** - Génère signed URLs pour fichiers audio

### Routes qui uploadent vers S3

1. **`/api/videos/upload`** - Upload de vidéos
2. **`/api/admin/videos-new`** - Création de vidéos (peut inclure upload)

## 🔐 Sécurité

### Variables d'Environnement Requises

**Pour l'application Next.js :**
```env
# Neon Database
DATABASE_URL="postgresql://..."
STORAGE_DATABASE_URL="postgresql://..." # Alternative

# AWS S3
AWS_REGION="eu-north-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET_NAME="only-you-coaching"
```

**Pour Lambda :**
```env
DATABASE_URL="postgresql://..."
AWS_REGION="eu-north-1"
S3_BUCKET_NAME="only-you-coaching"
```

## 🐛 Dépannage

### Lambda ne se déclenche pas

1. Vérifier les triggers S3 :
   ```bash
   aws s3api get-bucket-notification-configuration --bucket only-you-coaching
   ```

2. Vérifier les permissions :
   ```bash
   aws lambda get-policy --function-name only-you-coaching-thumbnail-generator
   ```

### Lambda ne peut pas se connecter à Neon

1. Vérifier `DATABASE_URL` dans les variables d'environnement Lambda
2. Vérifier que la Lambda a accès à Internet (VPC config)
3. Vérifier les logs CloudWatch

### Signed URLs ne fonctionnent pas

1. Vérifier les credentials AWS dans `.env.local`
2. Vérifier que le bucket S3 existe
3. Vérifier les permissions IAM

## ✨ Résultat

Votre intégration AWS + Neon est maintenant complète :

- ✅ S3 pour le stockage de fichiers
- ✅ Lambda pour la génération automatique de thumbnails
- ✅ Neon pour la base de données
- ✅ Signed URLs pour l'accès sécurisé aux fichiers
- ✅ Flow automatique : Upload → S3 → Lambda → Neon

---

**🎉 Votre stack est maintenant complètement intégrée !**

