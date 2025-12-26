# Synchronisation des Recettes depuis S3 vers Neon

Ce guide explique comment synchroniser les recettes stockées dans S3 vers la base de données Neon.

## Prérequis

1. **Variables d'environnement** dans `.env.local`:
   ```bash
   DATABASE_URL=postgresql://...  # Connection string Neon
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=eu-north-1
   AWS_S3_BUCKET_NAME=only-you-coaching
   ```

2. **Structure S3**:
   Les recettes doivent être organisées dans des dossiers sous `s3://only-you-coaching/recettes/`:
   ```
   recettes/
   ├── Recettes_Vol.I/
   │   ├── 1.png
   │   ├── 2.png
   │   ├── ...
   │   └── Recettes_Vegetariennes_Vol_I.pdf (optionnel)
   └── Autre_Recette/
       ├── image1.jpg
       └── ...
   ```

## Méthode 1 : Script Node.js (Recommandé)

Exécutez le script de synchronisation :

```bash
node scripts/sync-recipes-from-s3.js
```

Ce script :
- ✅ Vérifie que la table `recipes` existe dans Neon (la crée si nécessaire)
- ✅ Liste tous les dossiers dans `s3://only-you-coaching/recettes/`
- ✅ Synchronise chaque dossier comme une recette
- ✅ Met à jour les recettes existantes ou crée de nouvelles recettes

## Méthode 2 : API de Synchronisation

Vous pouvez aussi utiliser l'API REST :

```bash
curl -X POST http://localhost:3000/api/recipes/sync
```

Ou depuis le navigateur, allez sur :
```
http://localhost:3000/api/recipes/sync
```

## Structure de la Table

La table `recipes` contient les colonnes suivantes :

- `id` (UUID) - Identifiant unique
- `title` (VARCHAR) - Titre de la recette
- `slug` (VARCHAR) - Slug unique pour l'URL
- `description` (TEXT) - Description
- `image` (TEXT) - URL de l'image principale (première image)
- `images` (JSONB) - Tableau d'URLs de toutes les images
- `pdf_url` (TEXT) - URL du PDF si disponible
- `category` (VARCHAR) - Catégorie (breakfast, lunch, dinner, snack, vegetarian)
- `prep_time` (INTEGER) - Temps de préparation en minutes
- `servings` (INTEGER) - Nombre de portions
- `is_vegetarian` (BOOLEAN) - Est végétarien
- `difficulty` (VARCHAR) - Difficulté (easy, medium, hard)
- `tags` (JSONB) - Tableau de tags
- `ingredients` (JSONB) - Tableau d'ingrédients
- `instructions` (TEXT) - Instructions
- `is_premium` (BOOLEAN) - Est premium
- `is_published` (BOOLEAN) - Est publié
- `created_at`, `updated_at`, `published_at` (TIMESTAMP)

## Affichage des Recettes

Une fois synchronisées, les recettes sont disponibles sur :
```
http://localhost:3000/recettes
```

## Détection Automatique

Le script détecte automatiquement :
- **Titre** : Généré à partir du nom du dossier (ex: "Recettes_Vol.I" → "Recettes Vol I")
- **Slug** : Généré à partir du nom du dossier (ex: "recettes-vol-i")
- **Catégorie** : Détectée depuis le nom du dossier (recherche de mots-clés comme "vegetari", "breakfast", etc.)
- **Images** : Tous les fichiers PNG, JPG, JPEG, WEBP dans le dossier
- **PDF** : Fichier PDF optionnel dans le dossier

## Notes

- Les nouvelles recettes sont **automatiquement publiées** (`is_published = true`)
- Les recettes existantes sont **mises à jour** avec les dernières images
- Les recettes sont détectées par `slug` ou par `image` (URL principale) pour éviter les doublons


