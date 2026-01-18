# Diagnostic d'un Thumbnail Spécifique

## Problème
Un thumbnail spécifique ne s'affiche pas dans `EnhancedVideoCard`.

## Solution : Diagnostic étape par étape

### Étape 1: Identifier la vidéo

1. Ouvrez la console du navigateur (F12)
2. Survolez la carte vidéo qui pose problème
3. Regardez l'attribut `data-video-id` dans l'élément HTML
4. Ou regardez les logs dans la console qui affichent `Thumbnail failed to load for video: [ID]`

### Étape 2: Diagnostiquer avec l'API

Une fois que vous avez l'ID de la vidéo, utilisez l'endpoint de diagnostic :

```bash
# Remplacer [VIDEO_ID] par l'ID réel de la vidéo
curl "http://localhost:3000/api/debug/check-single-thumbnail?videoId=[VIDEO_ID]" | python3 -m json.tool
```

Ou dans le navigateur :
```
http://localhost:3000/api/debug/check-single-thumbnail?videoId=[VIDEO_ID]
```

### Étape 3: Analyser les résultats

L'endpoint retournera :
- L'URL du thumbnail dans Neon
- Si l'URL est correctement formatée
- Si le fichier existe dans S3
- Si l'URL est accessible via HTTP
- Des suggestions pour corriger le problème

### Problèmes possibles et solutions

#### 1. Fichier n'existe pas dans S3
**Symptôme**: `existsInS3: false`
**Solution**: Le thumbnail doit être généré ou uploadé vers S3

#### 2. URL mal encodée
**Symptôme**: `urlMatches: false`
**Solution**: Utiliser l'endpoint `/api/videos/fix-thumbnail-urls` pour corriger

#### 3. Permissions S3
**Symptôme**: `httpAccessible: false`, `httpStatusCode: 403`
**Solution**: Vérifier que la bucket policy est correctement configurée (déjà fait)

#### 4. URL incorrecte dans Neon
**Symptôme**: `urlParsed: false` ou `isS3Url: false`
**Solution**: L'URL dans Neon doit être mise à jour

## Alternative : Diagnostic depuis la console

Dans la console du navigateur, vous verrez maintenant :
```
Thumbnail failed to load for video: [ID] {
  originalUrl: "...",
  attemptedUrl: "...",
  videoTitle: "...",
  debugUrl: "/api/debug/check-single-thumbnail?videoId=[ID]"
}
```

Copiez l'URL `debugUrl` et ouvrez-la dans le navigateur pour voir le diagnostic complet.
