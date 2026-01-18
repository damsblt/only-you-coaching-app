# Diagnostic des Thumbnails

## Problème
Les thumbnails ne s'affichent pas même si les URLs S3 sont présentes dans Neon.

## Vérifications à faire

### 1. Vérifier que les URLs sont accessibles
```bash
# Tester une URL de thumbnail directement
curl -I "https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/Video/programmes-predefinis/cuisses-abdos/74.%20Abduction%20coucher%20sur%20le%20co%CC%82te%CC%81%20%20%2B%20ballon%20cheville-thumb.jpg"
```

### 2. Vérifier les permissions S3
Les thumbnails dans le dossier `thumbnails/` doivent être publics. Vérifier la bucket policy S3.

### 3. Vérifier l'encodage des URLs
Les URLs peuvent avoir des problèmes d'encodage avec les caractères spéciaux (espaces, accents, etc.).

### 4. Endpoints de diagnostic disponibles

#### Vérifier les thumbnails dans la base de données
```bash
GET /api/debug/thumbnails-check
```

#### Vérifier et corriger les URLs
```bash
# Voir ce qui serait corrigé (DRY RUN)
POST /api/videos/fix-thumbnail-urls
Body: { "limit": 50 }

# Appliquer les corrections
POST /api/videos/fix-thumbnail-urls
Body: { "limit": 50, "dryRun": false }
```

## Solutions possibles

1. **Problème de permissions S3** : Les thumbnails doivent être publics
2. **Problème d'encodage** : Les URLs peuvent nécessiter un ré-encodage
3. **Fichiers manquants** : Les thumbnails peuvent ne pas exister dans S3 même si les URLs sont dans Neon
