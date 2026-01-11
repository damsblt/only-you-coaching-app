# Configuration S3 pour rendre les photos de témoignages publiques

## Problème
Les photos de témoignages ne s'affichent pas car elles ne sont pas accessibles publiquement dans S3.

## Solution 1 : Rendre le dossier Photos/ public (Recommandé)

### Étape 1: Accéder à la console S3
1. Allez sur https://console.aws.amazon.com/s3/
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Dans la section **Bucket policy**, cliquez sur **Edit**

### Étape 2: Ajouter la politique suivante (ou mettre à jour la politique existante)

Si vous avez déjà une politique pour `thumbnails/`, ajoutez simplement une nouvelle déclaration :

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
    },
    {
      "Sid": "PublicReadGetObjectPhotos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/Photos/*"
    }
  ]
}
```

### Étape 3: Sauvegarder
Cliquez sur **Save changes** pour appliquer la politique.

### Étape 4: Vérifier les paramètres "Block public access"
1. Dans l'onglet **Permissions**, vérifiez la section **Block public access (bucket settings)**
2. Si tous les paramètres sont activés, vous devez les désactiver pour permettre l'accès public
3. Cliquez sur **Edit** et décochez tous les paramètres (ou seulement ceux nécessaires)
4. Confirmez les changements

## Solution 2 : Utiliser des URLs signées (Déjà implémentée)

Une API a été créée (`/api/testimonials/photos`) qui génère automatiquement des URLs signées pour les photos. Cette solution est déjà en place dans le composant `Testimonials.tsx`.

**Avantages :**
- Plus sécurisé (les URLs expirent après 7 jours)
- Pas besoin de modifier les permissions S3

**Inconvénients :**
- Nécessite un appel API supplémentaire
- Les URLs doivent être régénérées périodiquement

## Vérification

Après avoir appliqué la politique publique, les URLs de photos devraient être accessibles publiquement, par exemple :
- `https://only-you-coaching.s3.eu-north-1.amazonaws.com/Photos/PHOTO%20JEAN%20YVES.jpg`

Vous pouvez tester en ouvrant une URL de photo dans votre navigateur.

## Note importante

⚠️ Si vous choisissez la Solution 1 (rendre le dossier public), vous pouvez simplifier le composant `Testimonials.tsx` en utilisant directement les URLs publiques au lieu d'appeler l'API.











