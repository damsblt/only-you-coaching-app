# Diagnostic: Vidéos AWS n'apparaissent pas

## Problème identifié

Les vidéos AWS ne s'affichent pas alors que les liens sont dans Neon. Voici les causes possibles et les solutions.

## Architecture actuelle

1. **Stockage des URLs**: Les URLs AWS S3 sont stockées dans la colonne `videoUrl` de la table `videos_new` dans Neon
2. **Lecture des vidéos**: Les composants vidéo utilisent l'endpoint `/api/videos/${id}/stream` pour charger les vidéos
3. **Traitement**: L'endpoint stream:
   - Récupère le `videoUrl` depuis Neon
   - Extrait la clé S3 depuis l'URL
   - Génère une URL signée pour accéder à la vidéo

## Causes possibles

### 1. Format des URLs incorrect dans Neon

L'endpoint stream attend des URLs au format:
```
https://only-you-coaching.s3.eu-north-1.amazonaws.com/Video/groupes-musculaires/abdos/video-name.mp4
```

Et extrait la clé S3 qui doit commencer par `Video/` (avec V majuscule).

**Vérification**: Utilisez l'endpoint de diagnostic:
```
GET /api/debug/videos-check
```

### 2. Vidéos non publiées

Les vidéos doivent avoir `isPublished = true` pour être visibles.

**Solution**: Vérifiez dans la base de données:
```sql
SELECT id, title, "videoUrl", "isPublished" 
FROM videos_new 
WHERE "videoUrl" LIKE '%s3%' OR "videoUrl" LIKE '%amazonaws%'
LIMIT 10;
```

### 3. Problème d'extraction de la clé S3

L'extraction peut échouer si:
- L'URL est mal encodée
- Le format de l'URL est différent de celui attendu
- La clé S3 ne commence pas par `Video/`

**Amélioration apportée**: L'endpoint stream a été amélioré pour:
- Gérer les erreurs de décodage
- Vérifier le format de manière plus flexible
- Ajouter des logs détaillés

### 4. Credentials AWS manquants ou incorrects

Les credentials AWS doivent être configurés:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`

**Vérification**: Utilisez l'endpoint de diagnostic:
```
GET /api/debug/env-check
```

## Solutions

### Solution 1: Vérifier les URLs dans Neon

Exécutez ce script SQL pour voir le format des URLs:
```sql
SELECT 
  id, 
  title, 
  "videoUrl",
  CASE 
    WHEN "videoUrl" LIKE '%s3%' OR "videoUrl" LIKE '%amazonaws.com%' THEN 'S3 URL'
    WHEN "videoUrl" LIKE '%neon%' THEN 'Neon Storage'
    ELSE 'Autre format'
  END as url_type,
  "isPublished"
FROM videos_new
WHERE "videoUrl" IS NOT NULL
LIMIT 20;
```

### Solution 2: Corriger les URLs si nécessaire

Si les URLs ne sont pas au bon format, vous pouvez les corriger avec un script. Par exemple, si les URLs sont stockées comme des clés S3 au lieu d'URLs complètes:

```sql
-- Exemple: Si les URLs sont stockées comme "Video/groupes-musculaires/abdos/video.mp4"
-- Il faut les convertir en URLs complètes
UPDATE videos_new
SET "videoUrl" = CONCAT(
  'https://only-you-coaching.s3.eu-north-1.amazonaws.com/',
  "videoUrl"
)
WHERE "videoUrl" NOT LIKE 'http%' 
  AND "videoUrl" LIKE 'Video/%';
```

### Solution 3: Publier les vidéos

Si les vidéos ne sont pas publiées:
```sql
UPDATE videos_new
SET "isPublished" = true
WHERE "videoUrl" IS NOT NULL 
  AND ("videoUrl" LIKE '%s3%' OR "videoUrl" LIKE '%amazonaws.com%')
  AND "isPublished" = false;
```

### Solution 4: Utiliser l'endpoint de diagnostic

L'endpoint `/api/debug/videos-check` a été créé pour diagnostiquer les problèmes:
- Vérifie le format des URLs
- Teste l'extraction de la clé S3
- Teste la génération d'URLs signées
- Identifie les problèmes spécifiques

## Améliorations apportées

1. **Endpoint stream amélioré** (`app/api/videos/[id]/stream/route.ts`):
   - Meilleure gestion des erreurs de décodage
   - Vérification plus flexible du format (case-insensitive)
   - Logs détaillés pour le débogage

2. **Endpoint de diagnostic créé** (`app/api/debug/videos-check/route.ts`):
   - Analyse les vidéos dans la base de données
   - Teste l'extraction des clés S3
   - Teste la génération d'URLs signées
   - Identifie les problèmes spécifiques

## Prochaines étapes

1. Exécutez l'endpoint de diagnostic: `GET /api/debug/videos-check`
2. Vérifiez les logs du serveur pour voir les erreurs spécifiques
3. Vérifiez le format des URLs dans Neon avec la requête SQL ci-dessus
4. Corrigez les URLs si nécessaire
5. Vérifiez que les vidéos sont publiées (`isPublished = true`)

## Logs à surveiller

Dans les logs du serveur, cherchez:
- `[stream] invalid video URL` - Format d'URL incorrect
- `[stream] invalid S3 key format` - Clé S3 ne commence pas par `Video/`
- `[stream] Failed to generate signed URL` - Problème avec les credentials AWS
- `Video has no videoUrl` - Vidéo sans URL
