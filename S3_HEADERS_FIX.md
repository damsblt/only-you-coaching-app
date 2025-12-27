# 🔧 Fix: Photos et Vidéos des Headers en Production

## Problème

Les photos et vidéos des headers ne s'affichent pas en production sur `pilates-coaching-app.vercel.app`.

## Causes possibles

1. **Credentials AWS manquants en production** : Les routes API nécessitent `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` pour générer des URLs signées
2. **Policy S3 restrictive** : Le bucket S3 peut ne pas permettre l'accès public aux dossiers `Photos/` et `Video/`
3. **Pas de fallback** : Les routes API n'avaient pas de fallback vers les URLs publiques si les credentials manquent

## Solutions appliquées

### 1. Fallback vers URLs publiques ✅

**Fichier modifié : `app/api/videos/s3-video/route.ts`**

- Ajout d'un fallback vers les URLs publiques si les credentials AWS ne sont pas configurés
- Ajout d'un fallback si la génération d'URL signée échoue
- Gestion d'erreur améliorée avec fallback automatique

**Fichier déjà corrigé : `app/api/gallery/specific-photo/route.ts`**

- Déjà équipé d'un fallback vers les URLs publiques

### 2. Vérification de la Policy S3

La policy S3 doit permettre l'accès public aux dossiers suivants :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadPhotos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::only-you-coaching/Photos/*",
        "arn:aws:s3:::only-you-coaching/Photos/**/*"
      ]
    },
    {
      "Sid": "PublicReadVideos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::only-you-coaching/Video/*",
        "arn:aws:s3:::only-you-coaching/Video/**/*"
      ]
    }
  ]
}
```

## Actions à effectuer

### Option 1 : Vérifier/Mettre à jour la Policy S3 (Recommandé)

1. **Via la Console AWS** :
   - Allez sur https://console.aws.amazon.com/s3/
   - Sélectionnez le bucket `only-you-coaching`
   - Allez dans **Permissions** > **Bucket policy**
   - Vérifiez que les règles pour `Photos/*` et `Video/*` existent
   - Si elles n'existent pas, ajoutez-les (voir le JSON ci-dessus)

2. **Via le script** :
   ```bash
   node scripts/update-s3-headers-policy.js
   ```

### Option 2 : Vérifier les Credentials AWS en Production

1. **Dans Vercel Dashboard** :
   - Allez sur https://vercel.com/dashboard
   - Sélectionnez le projet `pilates-coaching-app`
   - Allez dans **Settings** > **Environment Variables**
   - Vérifiez que ces variables sont définies :
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_REGION` (devrait être `eu-north-1`)
     - `AWS_S3_BUCKET_NAME` (devrait être `only-you-coaching`)

2. **Si les credentials manquent** :
   - Les routes API utiliseront automatiquement les URLs publiques (fallback)
   - Mais la policy S3 doit permettre l'accès public

### Option 3 : Tester l'accès S3

Utilisez le script de vérification :

```bash
node scripts/verify-s3-headers-access.js
```

Ce script va :
- Vérifier que les objets existent dans S3
- Tester l'accès via les URLs publiques
- Tester la génération d'URLs signées
- Identifier les problèmes de permissions

## Vérification

Après avoir appliqué les corrections :

1. **Testez les routes API** :
   - `https://pilates-coaching-app.vercel.app/api/gallery/specific-photo?key=Photos/Illustration/brooke-lark-jUPOXXRNdcA-unsplash.jpg`
   - `https://pilates-coaching-app.vercel.app/api/videos/s3-video?key=Photos/Illustration/5033410_Fitness_Beach_Exercise_1920x1080%20(1)%20(1).mp4`

2. **Vérifiez les URLs retournées** :
   - Les URLs doivent être accessibles (pas de 403 Forbidden)
   - Si vous obtenez une URL signée, elle devrait fonctionner
   - Si vous obtenez une URL publique, elle devrait aussi fonctionner (si la policy S3 est correcte)

3. **Testez sur le site** :
   - Visitez une page avec un header (ex: `/videos`, `/programmes`)
   - Les images/vidéos devraient s'afficher

## Notes importantes

- **Sécurité** : Les URLs signées sont plus sécurisées (expirent après 1 heure pour les vidéos, 7 jours pour les images)
- **Performance** : Les URLs publiques sont plus rapides (pas besoin de générer une signature)
- **Recommandation** : Utilisez les URLs signées si possible, avec fallback vers les URLs publiques

## Fichiers modifiés

- ✅ `app/api/videos/s3-video/route.ts` - Ajout du fallback vers URLs publiques
- ✅ `app/api/gallery/specific-photo/route.ts` - Déjà équipé d'un fallback
- ✅ `scripts/verify-s3-headers-access.js` - Script de vérification
- ✅ `scripts/update-s3-headers-policy.js` - Script de mise à jour de la policy





