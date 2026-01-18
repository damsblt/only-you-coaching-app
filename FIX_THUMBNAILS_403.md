# Fix: Thumbnails retournent 403 Forbidden

## Problème identifié

Les thumbnails retournent **403 Forbidden** car :
1. La bucket policy S3 n'est pas correctement formatée (Resource ne peut pas être un tableau)
2. Les paramètres "Block public access" peuvent être activés

## Solution

### Étape 1: Corriger la bucket policy S3

1. Allez sur https://console.aws.amazon.com/s3/
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Dans la section **Bucket policy**, cliquez sur **Edit**
5. Remplacez la politique par celle dans `s3-bucket-policy-thumbnails-fixed.json` :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/Video/*"
    },
    {
      "Sid": "PublicReadThumbnails",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/thumbnails/*"
    },
    {
      "Sid": "PublicReadPhotos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-you-coaching/Photos/*"
    }
  ]
}
```

**Note importante** : Chaque `Resource` doit être une chaîne, pas un tableau. AWS S3 ne supporte pas les tableaux dans `Resource`.

### Étape 2: Vérifier "Block public access"

1. Dans l'onglet **Permissions**, section **Block public access (bucket settings)**
2. Cliquez sur **Edit**
3. **Décochez** tous les paramètres (ou au minimum ceux qui bloquent l'accès public)
4. Confirmez les changements

### Étape 3: Vérifier que ça fonctionne

Testez une URL de thumbnail :
```bash
curl -I "https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/Video/programmes-predefinis/cuisses-abdos/74.%20Abduction%20coucher%20sur%20le%20co%CC%82te%CC%81%20%20%2B%20ballon%20cheville-thumb.jpg"
```

Vous devriez recevoir **200 OK** au lieu de **403 Forbidden**.

## Alternative : Script automatique

Un script a été créé pour automatiser la correction :

```bash
# Assurez-vous que les variables d'environnement AWS sont configurées
export AWS_ACCESS_KEY_ID="votre-access-key"
export AWS_SECRET_ACCESS_KEY="votre-secret-key"
export AWS_REGION="eu-north-1"
export AWS_S3_BUCKET_NAME="only-you-coaching"

# Exécutez le script
node scripts/fix-thumbnails-permissions.js
```

Le script :
- Récupère la politique actuelle du bucket
- Corrige automatiquement les `Resource` qui sont des tableaux
- Ajoute les statements manquants
- Applique la nouvelle politique

**Note** : Le script ne peut pas désactiver "Block public access" automatiquement. Vous devez le faire manuellement dans la console S3.
