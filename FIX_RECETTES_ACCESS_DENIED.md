# Fix: Access Denied pour les fichiers de recettes sur S3

## Problème identifié

Les fichiers de recettes retournent **Access Denied** car le dossier `recettes/` n'est pas inclus dans la politique publique du bucket S3.

L'URL testée:
```
https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/15.png
```

## Solution

### Option 1: Utiliser le script automatique (Recommandé)

Exécutez le script qui ajoute automatiquement `recettes/` à la politique existante:

```bash
node scripts/add-recettes-to-bucket-policy.js
```

Ce script:
- ✅ Récupère la politique actuelle
- ✅ Vérifie si `recettes/` est déjà inclus
- ✅ Ajoute la règle pour `recettes/*` sans écraser les autres permissions
- ✅ Applique la nouvelle politique

### Option 2: Mise à jour manuelle dans la console AWS

1. Allez sur https://console.aws.amazon.com/s3/
2. Sélectionnez le bucket `only-you-coaching`
3. Allez dans l'onglet **Permissions**
4. Dans la section **Bucket policy**, cliquez sur **Edit**
5. Ajoutez cette déclaration à la liste des `Statement`:

```json
{
  "Sid": "PublicReadRecettes",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::only-you-coaching/recettes/*"
}
```

6. Cliquez sur **Save changes**

### Option 3: Remplacer complètement la politique

Si vous préférez remplacer toute la politique, utilisez le fichier `s3-bucket-policy-complete.json` qui inclut tous les dossiers:

1. Dans la console S3, allez à **Permissions** > **Bucket policy** > **Edit**
2. Remplacez le contenu par celui de `s3-bucket-policy-complete.json`
3. Cliquez sur **Save changes**

## Vérification des paramètres "Block public access"

Même avec la politique correcte, les fichiers peuvent retourner 403 si "Block public access" est activé:

1. Dans l'onglet **Permissions**, section **Block public access (bucket settings)**
2. Cliquez sur **Edit**
3. **Décochez** tous les paramètres (ou au minimum ceux qui bloquent l'accès public)
4. Confirmez les changements

## Vérification

Testez une URL de recette:
```bash
curl -I "https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/15.png"
```

Vous devriez recevoir **200 OK** au lieu de **403 Forbidden**.

## Note importante

⚠️ Cette politique rend **uniquement** le dossier `recettes/` public. Les autres dossiers (Video, thumbnails, Photos) restent accessibles comme avant.
