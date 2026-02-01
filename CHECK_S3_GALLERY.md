# Vérification de l'accès S3 à la galerie

Ce guide vous permet de vérifier l'accès S3 à la galerie de photos en utilisant le CLI.

## Prérequis

### Option 1: AWS CLI (recommandé pour bash)

1. Installez AWS CLI:
   ```bash
   # macOS
   brew install awscli
   
   # Linux
   sudo apt-get install awscli
   
   # Ou via pip
   pip install awscli
   ```

2. Configurez vos credentials:
   ```bash
   aws configure
   ```
   
   Ou utilisez les variables d'environnement:
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=eu-north-1
   export AWS_S3_BUCKET_NAME=only-you-coaching
   ```

3. Exécutez le script:
   ```bash
   ./scripts/check-s3-gallery-access.sh
   ```

### Option 2: Script Node.js (utilise AWS SDK)

1. Les dépendances sont déjà installées (AWS SDK v3)

2. Configurez les variables d'environnement:
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=eu-north-1
   export AWS_S3_BUCKET_NAME=only-you-coaching
   ```

3. Exécutez le script:
   ```bash
   npm run check-s3-gallery
   # ou directement
   node scripts/check-s3-gallery-access.js
   ```

## Ce que le script vérifie

1. ✅ **Credentials AWS** - Vérifie que les credentials sont configurés
2. ✅ **Accès au bucket** - Teste la connexion au bucket S3
3. ✅ **Existence du dossier** - Vérifie que `Photos/Training/gallery/` existe
4. ✅ **Images présentes** - Compte les images dans le dossier
5. ✅ **Bucket policy** - Vérifie les permissions publiques
6. ✅ **Block Public Access** - Vérifie si l'accès public est bloqué
7. ✅ **Test HTTP** - Teste l'accès public à une image

## Exemple de sortie

```
========================================
Vérification de l'accès S3 - Galerie
========================================

1. Vérification des credentials AWS...
✅ Credentials AWS configurés
   Region: eu-north-1
   Bucket: only-you-coaching

2. Vérification du dossier 'Photos/Training/gallery/'...
✅ 12 image(s) trouvée(s)

   Premières images:
   - photo1.jpg (245 KB)
   - photo2.jpg (312 KB)
   - photo3.jpg (189 KB)

3. Vérification de la bucket policy...
✅ Bucket policy trouvée avec accès à Photos/*

4. Vérification de Block Public Access...
✅ Block Public Access n'est pas activé

5. Test d'accès public à une image...
   Test de l'URL: https://only-you-coaching.s3.eu-north-1.amazonaws.com/...
✅ L'image est accessible publiquement (HTTP 200)

========================================
Résumé
========================================

Bucket: only-you-coaching
Région: eu-north-1
Dossier: Photos/Training/gallery/
Nombre d'images: 12

✅ Tout semble correct !
   Les images devraient s'afficher sur le site
```

## Résolution des problèmes

### ❌ "Les credentials AWS ne sont pas configurés"

**Solution:**
```bash
# Configurez AWS CLI
aws configure

# Ou utilisez les variables d'environnement
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### ❌ "Aucune image trouvée dans le dossier"

**Solution:**
1. Vérifiez que le dossier existe dans S3:
   ```bash
   aws s3 ls s3://only-you-coaching/Photos/Training/gallery/
   ```

2. Si le dossier n'existe pas, créez-le et uploadez des images:
   ```bash
   aws s3 cp photo.jpg s3://only-you-coaching/Photos/Training/gallery/photo.jpg
   ```

### ❌ "Accès refusé (HTTP 403)"

**Solution:**
1. Vérifiez la bucket policy dans AWS Console
2. Assurez-vous qu'elle permet l'accès public à `Photos/*`
3. Désactivez Block Public Access si nécessaire

### ❌ "Block Public Access est activé"

**Solution:**
1. Allez sur AWS S3 Console
2. Sélectionnez le bucket `only-you-coaching`
3. Onglet **Permissions** → **Block public access (bucket settings)**
4. Cliquez sur **Edit** et désactivez les paramètres nécessaires
5. Confirmez les changements

## Commandes utiles

### Lister les images dans la galerie
```bash
aws s3 ls s3://only-you-coaching/Photos/Training/gallery/ --recursive
```

### Uploader une image
```bash
aws s3 cp photo.jpg s3://only-you-coaching/Photos/Training/gallery/photo.jpg
```

### Uploader plusieurs images
```bash
aws s3 sync ./photos/ s3://only-you-coaching/Photos/Training/gallery/
```

### Vérifier la bucket policy
```bash
aws s3api get-bucket-policy --bucket only-you-coaching --region eu-north-1
```

### Vérifier Block Public Access
```bash
aws s3api get-public-access-block --bucket only-you-coaching --region eu-north-1
```

## Notes

- Le script utilise les variables d'environnement par défaut
- Vous pouvez aussi spécifier les valeurs directement dans le script
- Les images doivent être des formats: jpg, jpeg, png, webp, gif
- Le script teste l'accès HTTP à une image pour vérifier les permissions
