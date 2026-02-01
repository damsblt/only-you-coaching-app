# Configuration S3 pour rendre video-presentation.mp4 public

## Problème
La vidéo `video-presentation.mp4` à la racine du bucket S3 n'est pas accessible publiquement car elle n'est pas couverte par la politique actuelle qui permet uniquement l'accès à `Video/*`.

## Solution 1 : Utiliser le script automatique (Recommandé)

### Étape 1: Exécuter le script

```bash
node scripts/add-video-presentation-permission.js
```

Ce script :
- ✅ Récupère la politique actuelle du bucket S3
- ✅ Vérifie si la règle existe déjà
- ✅ Ajoute la règle pour `video-presentation.mp4` et les fichiers `.mp4` à la racine
- ✅ Applique la nouvelle politique automatiquement

### Étape 2: Vérifier les paramètres "Block public access"

1. Allez sur https://console.aws.amazon.com/s3/
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Dans la section **Block public access (bucket settings)**, cliquez sur **Edit**
5. **Décochez** tous les paramètres (ou au minimum ceux qui bloquent l'accès public)
6. Confirmez les changements

## Solution 2 : Mise à jour manuelle dans la console AWS

### Étape 1: Accéder à la console S3
1. Allez sur https://console.aws.amazon.com/s3/
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Dans la section **Bucket policy**, cliquez sur **Edit**

### Étape 2: Ajouter la déclaration suivante

Ajoutez cette déclaration à la liste des `Statement` existants :

```json
{
  "Sid": "PublicReadRootVideos",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": [
    "arn:aws:s3:::only-you-coaching/video-presentation.mp4",
    "arn:aws:s3:::only-you-coaching/*.mp4"
  ]
}
```

### Étape 3: Sauvegarder
Cliquez sur **Save changes** pour appliquer la politique.

### Étape 4: Vérifier les paramètres "Block public access"
1. Dans l'onglet **Permissions**, section **Block public access (bucket settings)**
2. Cliquez sur **Edit**
3. **Décochez** tous les paramètres (ou seulement ceux nécessaires)
4. Confirmez les changements

## Solution 3 : Remplacer complètement la politique

Si vous préférez remplacer toute la politique, utilisez le fichier `s3-bucket-policy-complete.json` qui inclut tous les dossiers et la vidéo de présentation :

1. Dans la console S3, allez à **Permissions** > **Bucket policy** > **Edit**
2. Remplacez le contenu par celui de `s3-bucket-policy-complete.json`
3. Cliquez sur **Save changes**

## Vérification

Après avoir appliqué la politique, l'URL de la vidéo devrait être accessible publiquement :
- `https://only-you-coaching.s3.eu-north-1.amazonaws.com/video-presentation.mp4`

Vous pouvez tester en ouvrant cette URL dans votre navigateur.

## Politique complète mise à jour

La politique complète dans `s3-bucket-policy-complete.json` inclut maintenant :
- ✅ `Video/*` - Toutes les vidéos dans le dossier Video/
- ✅ `thumbnails/*` - Tous les thumbnails
- ✅ `Photos/*` - Toutes les photos
- ✅ `recettes/*` - Tous les fichiers de recettes
- ✅ `video-presentation.mp4` et `*.mp4` - Vidéos à la racine du bucket

## Notes importantes

⚠️ Cette politique rend **uniquement** les fichiers spécifiés publics. Les autres fichiers restent privés.

⚠️ Assurez-vous que les paramètres "Block public access" permettent l'accès public aux objets spécifiés dans la politique.
