# Générer les Thumbnails Manquants

## Problème

Les thumbnails ne sont pas présents pour les vidéos hébergées sur AWS S3, même si les liens vidéo sont dans Neon.

## Solution

Un endpoint a été créé pour générer automatiquement les thumbnails manquants.

## Utilisation

### 1. Générer les thumbnails manquants (10 par défaut)

```bash
POST /api/videos/generate-missing-thumbnails
Content-Type: application/json

{}
```

### 2. Générer plus de thumbnails

```bash
POST /api/videos/generate-missing-thumbnails
Content-Type: application/json

{
  "limit": 50
}
```

### 3. Forcer la régénération de tous les thumbnails

```bash
POST /api/videos/generate-missing-thumbnails
Content-Type: application/json

{
  "force": true,
  "limit": 20
}
```

## Comment ça fonctionne

1. **Trouve les vidéos sans thumbnails** dans la base de données Neon
2. **Vérifie si le thumbnail existe déjà dans S3** (dans le dossier `thumbnails/`)
3. **Si le thumbnail existe dans S3** mais pas dans la base de données, met à jour la base de données
4. **Si le thumbnail n'existe pas**, génère un thumbnail depuis la vidéo :
   - Télécharge la vidéo depuis S3
   - Utilise ffmpeg pour extraire une frame à 5 secondes
   - Upload le thumbnail vers S3 dans `thumbnails/Video/.../`
   - Met à jour la base de données avec l'URL du thumbnail

## Prérequis

- **ffmpeg** doit être installé sur le serveur
- **AWS credentials** doivent être configurés :
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_BUCKET_NAME`

## Exemple de réponse

```json
{
  "message": "Processed 10 videos",
  "summary": {
    "total": 10,
    "generated": 8,
    "skipped": 1,
    "errors": 1
  },
  "results": [
    {
      "videoId": "123...",
      "title": "Video Title",
      "success": true,
      "skipped": false,
      "reason": null,
      "error": null
    },
    {
      "videoId": "456...",
      "title": "Another Video",
      "success": true,
      "skipped": true,
      "reason": "Thumbnail already exists",
      "error": null
    }
  ]
}
```

## Vérifier les thumbnails existants

Utilisez l'endpoint de diagnostic :

```bash
GET /api/debug/thumbnails-check
```

Cela affichera :
- Les thumbnails qui existent dans la base de données
- Les thumbnails accessibles dans S3
- Les problèmes spécifiques avec chaque thumbnail

## Notes importantes

- Le processus peut être long (téléchargement + génération + upload)
- Par défaut, seulement 10 vidéos sont traitées à la fois pour éviter les timeouts
- Les thumbnails sont générés à partir de la frame à 5 secondes de la vidéo
- Les thumbnails sont stockés dans `thumbnails/Video/.../` dans S3
- Les thumbnails sont publics et accessibles directement via URL
