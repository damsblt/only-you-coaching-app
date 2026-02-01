# Guide de Diagnostic - Galerie Photos Non Affichées

## 🔍 Problème
Les photos de la galerie ne s'affichent pas sur le site en production (only-you-coaching.com).

## 🛠️ Diagnostic Rapide

### Étape 1: Vérifier l'endpoint de diagnostic
Visitez cette URL sur votre site en production :
```
https://only-you-coaching.com/api/gallery/debug
```

Cet endpoint vous donnera des informations détaillées sur :
- ✅ Configuration des credentials AWS
- ✅ Connexion au bucket S3
- ✅ Existence du dossier `Photos/Training/gallery/`
- ✅ Accès public aux images

### Étape 2: Vérifier les logs Vercel
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans l'onglet **Logs**
4. Cherchez les erreurs liées à `/api/gallery/training-photos`

## 🔧 Causes Possibles et Solutions

### Cause 1: Credentials AWS non configurés ❌

**Symptôme:** L'endpoint `/api/gallery/debug` montre `awsCredentials.configured: false`

**Solution:**
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes pour l'environnement **Production** :
   - `AWS_ACCESS_KEY_ID` = votre clé d'accès AWS
   - `AWS_SECRET_ACCESS_KEY` = votre clé secrète AWS
   - `AWS_REGION` = `eu-north-1` (ou votre région)
   - `AWS_S3_BUCKET_NAME` = `only-you-coaching`

5. **Important:** Après avoir ajouté les variables, redéployez votre application :
   ```bash
   # Via Vercel CLI
   vercel --prod
   
   # Ou via le dashboard: Deployments → Redeploy
   ```

### Cause 2: Dossier S3 inexistant ou vide ❌

**Symptôme:** L'endpoint de debug montre `foundObjects: 0`

**Solution:**
1. Allez sur [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Sélectionnez le bucket `only-you-coaching`
3. Vérifiez que le dossier `Photos/Training/gallery/` existe
4. Si le dossier n'existe pas, créez-le et uploadez vos photos
5. Vérifiez que les fichiers sont bien des images (jpg, png, webp, gif)

**Structure attendue:**
```
only-you-coaching/
  └── Photos/
      └── Training/
          └── gallery/
              ├── photo1.jpg
              ├── photo2.jpg
              └── ...
```

### Cause 3: Permissions S3 incorrectes ❌

**Symptôme:** Les URLs sont générées mais les images ne se chargent pas (erreur 403)

**Solution:**
1. Allez sur [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Vérifiez la **Bucket policy** - elle doit contenir :

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
    }
  ]
}
```

5. Vérifiez aussi **Block public access (bucket settings)** :
   - Si tous les paramètres sont activés, vous devez les désactiver pour permettre l'accès public
   - Cliquez sur **Edit** et décochez les paramètres nécessaires
   - Confirmez les changements

### Cause 4: Variable d'environnement NEXT_PUBLIC_SITE_URL manquante ⚠️

**Symptôme:** L'API est appelée avec une mauvaise URL

**Solution:**
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez pour l'environnement **Production** :
   - `NEXT_PUBLIC_SITE_URL` = `https://only-you-coaching.com`

**Note:** Si cette variable n'est pas définie, le composant utilisera `window.location.origin` qui devrait fonctionner, mais il est recommandé de la définir explicitement.

### Cause 5: Problème CORS (si accès depuis un autre domaine) ❌

**Symptôme:** Erreurs CORS dans la console du navigateur

**Solution:**
1. Allez sur [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Vérifiez la configuration **CORS** - elle doit contenir :

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://only-you-coaching.com",
      "https://www.only-you-coaching.com"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## 📋 Checklist de Vérification

- [ ] Credentials AWS configurés dans Vercel (Production)
- [ ] Dossier `Photos/Training/gallery/` existe dans S3
- [ ] Des images sont présentes dans le dossier
- [ ] Bucket policy permet l'accès public à `Photos/*`
- [ ] Block public access est désactivé pour `Photos/*`
- [ ] Variable `NEXT_PUBLIC_SITE_URL` configurée (optionnel mais recommandé)
- [ ] Application redéployée après modification des variables d'environnement
- [ ] Endpoint `/api/gallery/debug` accessible et sans erreurs

## 🧪 Test Manuel

1. **Tester l'API directement:**
   ```
   https://only-you-coaching.com/api/gallery/training-photos
   ```
   Devrait retourner un JSON avec un tableau `photos` contenant les URLs.

2. **Tester une URL d'image directement:**
   Copiez une URL depuis la réponse de l'API et ouvrez-la dans un navigateur.
   L'image devrait s'afficher. Si vous obtenez une erreur 403, c'est un problème de permissions.

3. **Vérifier la console du navigateur:**
   Ouvrez les outils de développement (F12) et regardez l'onglet **Console** et **Network**.
   Cherchez les erreurs liées à `/api/gallery/training-photos` ou aux URLs d'images S3.

## 🆘 Support

Si le problème persiste après avoir vérifié tous les points ci-dessus :

1. Visitez `/api/gallery/debug` et copiez la réponse complète
2. Vérifiez les logs Vercel pour les erreurs détaillées
3. Testez une URL d'image S3 directement dans le navigateur
4. Vérifiez que les credentials AWS ont les permissions nécessaires :
   - `s3:ListBucket` sur le bucket
   - `s3:GetObject` sur les objets dans `Photos/*`

## 📝 Notes Techniques

- Le composant Gallery fait un appel à `/api/gallery/training-photos` qui liste les objets dans `Photos/Training/gallery/`
- Les URLs générées sont des URLs publiques S3 directes (pas de signed URLs)
- Le composant affiche maintenant des messages d'erreur clairs si les photos ne peuvent pas être chargées
- L'endpoint `/api/gallery/debug` fournit des informations de diagnostic détaillées
