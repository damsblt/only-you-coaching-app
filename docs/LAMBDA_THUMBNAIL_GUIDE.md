# Guide : Lambda de génération de thumbnails

## 📋 Vue d'ensemble

La Lambda `only-you-coaching-thumbnail-generator` est déclenchée automatiquement lorsqu'une vidéo est uploadée dans S3. Elle :
1. Génère un thumbnail à partir de la vidéo (frame à 5 secondes)
2. Upload le thumbnail dans S3 (`thumbnails/...`)
3. Met à jour la colonne `thumbnail` dans Neon

## ✅ Validation de votre compréhension

Vous avez bien compris ! Pour que le système fonctionne :

1. ✅ Les numéros de vidéos doivent être identifiables depuis l'URL
2. ✅ Il faut supprimer les vidéos existantes de S3 (`programmes-predefinis/`)
3. ✅ Il faut supprimer ces mêmes vidéos de Neon
4. ✅ Il faut re-uploader les vidéos avec les bons noms (incluant les numéros)

## 🔧 Configuration Lambda

### Prérequis

1. **Lambda layer avec ffmpeg** (obligatoire)
   - Utilisez : https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
   - Ou créez votre propre layer avec ffmpeg

2. **Variables d'environnement** :
   - `DATABASE_URL` : URL de connexion Neon
   - `S3_BUCKET_NAME` : `only-you-coaching` (par défaut)

### Déploiement

```bash
# 1. Charger DATABASE_URL depuis .env.local
export DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-)

# 2. Déployer la Lambda
./scripts/deploy-lambda-thumbnail.sh
```

## 🗑️ Suppression des vidéos existantes

### Script de suppression

```bash
# Mode dry-run (affiche ce qui sera supprimé sans supprimer)
node scripts/delete-programmes-videos.js --dry-run

# Suppression réelle
node scripts/delete-programmes-videos.js
```

Le script supprime :
- ✅ Toutes les vidéos dans `Video/programmes-predefinis/` de S3
- ✅ Les vidéos correspondantes dans Neon
- ✅ Les thumbnails associés dans S3

## 🧪 Tester la Lambda

### 1. Vérifier l'état actuel

```bash
node scripts/test-lambda-thumbnail.js
```

### 2. Tester avec une vidéo

```bash
# Uploader une vidéo de test
aws s3 cp test-video.mp4 s3://only-you-coaching/Video/programmes-predefinis/machine/46.\ Test.mp4

# Surveiller les logs Lambda
aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --follow
```

### 3. Vérifier dans Neon

```sql
SELECT id, title, thumbnail 
FROM videos_new 
WHERE "videoUrl" LIKE '%programmes-predefinis%' 
  AND thumbnail IS NOT NULL 
ORDER BY "updatedAt" DESC 
LIMIT 10;
```

## 📝 Format des noms de fichiers

Pour que les numéros soient identifiables, les vidéos doivent être nommées ainsi :

```
Video/programmes-predefinis/{region}/{numero}. {titre}.mp4
```

Exemples :
- `Video/programmes-predefinis/machine/46. Gainage planche.mp4`
- `Video/programmes-predefinis/abdos/12. Crunch.mp4`
- `Video/programmes-predefinis/brule-graisse/5. Burpee.mp4`

## 🔄 Flow complet

```
1. Upload vidéo dans S3
   ↓
2. S3 déclenche Lambda automatiquement
   ↓
3. Lambda trouve la vidéo dans Neon via videoUrl (LIKE %s3Key%)
   ↓
4. Lambda télécharge la vidéo depuis S3
   ↓
5. Lambda génère thumbnail avec ffmpeg (frame à 5s)
   ↓
6. Lambda upload thumbnail dans S3 (thumbnails/...)
   ↓
7. Lambda met à jour Neon avec thumbnail URL
```

## ⚠️ Points d'attention

### 1. Lambda layer ffmpeg

La Lambda **nécessite** une layer avec ffmpeg. Sans elle, la génération de thumbnail échouera.

Pour ajouter une layer :
```bash
# Utiliser une layer publique
LAYER_ARN="arn:aws:lambda:eu-north-1:550368846364:layer:ffmpeg:1"

aws lambda update-function-configuration \
  --function-name only-you-coaching-thumbnail-generator \
  --layers $LAYER_ARN \
  --region eu-north-1
```

### 2. Timeout Lambda

La Lambda a besoin de temps pour :
- Télécharger la vidéo
- Générer le thumbnail
- Uploader le thumbnail

Recommandation : **Timeout de 5 minutes (300s)**

### 3. Mémoire Lambda

Recommandation : **1024 MB** minimum pour ffmpeg

### 4. Vidéos non trouvées dans Neon

Si la Lambda ne trouve pas la vidéo dans Neon, elle log :
```
⚠️  Video not found in database for key: ...
```

Cela signifie que la vidéo n'a pas encore été synchronisée dans Neon. Utilisez :
```bash
# Synchroniser depuis S3
curl -X POST http://localhost:3000/api/videos/sync
```

## 🐛 Dépannage

### La Lambda ne se déclenche pas

1. Vérifier le trigger S3 :
```bash
aws s3api get-bucket-notification-configuration \
  --bucket only-you-coaching
```

2. Vérifier les permissions :
```bash
aws lambda get-policy \
  --function-name only-you-coaching-thumbnail-generator
```

### Les thumbnails ne sont pas générés

1. Vérifier les logs Lambda :
```bash
aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --follow
```

2. Vérifier que ffmpeg est disponible :
   - La Lambda doit avoir une layer avec ffmpeg
   - Vérifier dans les logs : erreurs liées à ffmpeg

3. Vérifier les variables d'environnement :
```bash
aws lambda get-function-configuration \
  --function-name only-you-coaching-thumbnail-generator \
  --query 'Environment.Variables'
```

### Les thumbnails ne sont pas mis à jour dans Neon

1. Vérifier DATABASE_URL dans les variables d'environnement
2. Vérifier les logs Lambda pour les erreurs de connexion
3. Tester la connexion Neon depuis la Lambda

## 📊 Scripts disponibles

- `scripts/delete-programmes-videos.js` : Supprime les vidéos programmes de S3 et Neon
- `scripts/test-lambda-thumbnail.js` : Teste l'état des thumbnails
- `scripts/deploy-lambda-thumbnail.sh` : Déploie la Lambda mise à jour

## ✅ Checklist de déploiement

- [ ] Lambda layer avec ffmpeg ajoutée
- [ ] Variables d'environnement configurées (DATABASE_URL, S3_BUCKET_NAME)
- [ ] Timeout Lambda ≥ 300s
- [ ] Mémoire Lambda ≥ 1024 MB
- [ ] Trigger S3 configuré
- [ ] Permissions S3 → Lambda configurées
- [ ] Test avec une vidéo de test
- [ ] Vérification des logs Lambda
- [ ] Vérification dans Neon que thumbnail est mis à jour

## 🚀 Prochaines étapes

1. **Supprimer les vidéos existantes** :
   ```bash
   node scripts/delete-programmes-videos.js --dry-run  # Vérifier d'abord
   node scripts/delete-programmes-videos.js            # Supprimer réellement
   ```

2. **Re-uploader les vidéos** avec les bons noms (incluant les numéros)

3. **Vérifier que les thumbnails sont générés** :
   ```bash
   node scripts/test-lambda-thumbnail.js
   ```

4. **Synchroniser les vidéos dans Neon** si nécessaire












