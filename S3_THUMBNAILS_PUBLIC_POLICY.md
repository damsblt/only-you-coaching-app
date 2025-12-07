# Configuration S3 pour rendre les thumbnails publics

## Problème
Les thumbnails retournent une erreur 403 Forbidden car ils ne sont pas accessibles publiquement dans S3.

## Solution

Ajoutez cette politique de bucket dans la console AWS S3 pour rendre le dossier `thumbnails/` public :

### Étape 1: Accéder à la console S3
1. Allez sur https://console.aws.amazon.com/s3/
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Dans la section **Bucket policy**, cliquez sur **Edit**

### Étape 2: Ajouter la politique suivante

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObjectThumbnails",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/thumbnails/*"
    }
  ]
}
```

### Étape 3: Sauvegarder
Cliquez sur **Save changes** pour appliquer la politique.

## Vérification

Après avoir appliqué la politique, les URLs de thumbnails devraient être accessibles publiquement, par exemple :
- `https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/1-fente-avant-fente-arrière-poids-du-corps-thumb.jpg`

Vous pouvez tester en ouvrant une URL de thumbnail dans votre navigateur.

## Alternative : Utiliser des URLs signées (plus complexe)

Si vous préférez ne pas rendre les thumbnails publics, vous pouvez utiliser des URLs signées générées côté serveur. Cela nécessiterait de modifier les composants pour charger les URLs de manière asynchrone depuis une API.

## Note importante

⚠️ Cette politique rend **uniquement** le dossier `thumbnails/` public. Les vidéos et autres fichiers restent privés.

