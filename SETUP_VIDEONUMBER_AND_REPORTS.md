# Setup : Colonne videoNumber et Scripts de Rapport

## ✅ Ce qui a été fait

### 1. Migration SQL pour la colonne `videoNumber`

**Fichier :** `scripts/add-videoNumber-column.sql`

- Ajoute la colonne `videoNumber` de type `DECIMAL(10, 2)` pour supporter les nombres décimaux (ex: 10.1, 10.2)
- Crée un index sur `videoNumber` pour des recherches rapides
- Crée un index composite sur `(videoNumber, region)` pour le matching

**Exécution :**
```bash
# Option 1 : Via le script Node.js (recommandé)
node scripts/run-migration-videoNumber.js

# Option 2 : Directement dans Neon SQL Editor
# Copier-coller le contenu de scripts/add-videoNumber-column.sql
```

### 2. Script de vérification des métadonnées

**Fichier :** `scripts/check-videos-metadata-status.js`

Ce script génère deux listes importantes :

#### a) Vidéos sans correspondance avec les fichiers Word
- Liste toutes les vidéos qui n'ont pas de correspondance dans les fichiers Word (similarité < 0.95)
- Pour chaque vidéo, affiche :
  - ID
  - Titre
  - Numéro de vidéo (videoNumber)
  - Région (groupe musculaire)
  - URL de la vidéo

#### b) Vidéos avec métadonnées manquantes (même partiellement)
- Liste toutes les vidéos qui ont des champs manquants
- Pour chaque vidéo, indique précisément quels champs manquent :
  - `targeted_muscles` : Muscles ciblés
  - `startingPosition` : Position de départ
  - `movement` : Mouvement
  - `intensity` : Intensité
  - `series` : Série
  - `constraints` : Contre-indications
  - `theme` : Thème
  - `difficulty` : Niveau de difficulté
- Indique également si la vidéo a une correspondance dans les fichiers Word

**Exécution :**
```bash
node scripts/check-videos-metadata-status.js
```

**Résultats :**
Les rapports sont sauvegardés dans `data/video-metadata-reports/` :
- `videos-without-match-{timestamp}.json`
- `videos-missing-metadata-{timestamp}.json`

### 3. Mise à jour du prompt principal

**Fichier :** `PROMPT_REBUILD_BIBLIOTHEQUE_VIDEO.md`

Le prompt a été mis à jour avec :
- ✅ Confirmation que les nombres peuvent être décimaux
- ✅ Seuil de similarité confirmé : **0.95**
- ✅ Référence à la migration créée
- ✅ Instructions pour générer les listes de vidéos

## 📋 Prochaines étapes

1. **Exécuter la migration :**
   ```bash
   node scripts/run-migration-videoNumber.js
   ```

2. **Générer les rapports :**
   ```bash
   node scripts/check-videos-metadata-status.js
   ```

3. **Examiner les rapports générés** dans `data/video-metadata-reports/`

4. **Valider les résultats** et décider des actions à prendre pour :
   - Les vidéos sans correspondance
   - Les vidéos avec métadonnées manquantes

## 🔍 Détails techniques

### Colonne `videoNumber`
- **Type :** `DECIMAL(10, 2)`
- **Nullable :** Oui (les vidéos existantes n'auront pas de numéro initialement)
- **Index :** 
  - `idx_videos_new_video_number` sur `videoNumber`
  - `idx_videos_new_video_number_region` sur `(videoNumber, region)`

### Algorithme de similarité
- Utilise la normalisation des titres (minuscules, suppression accents, ponctuation)
- Algorithme de Levenshtein pour calculer la distance
- Seuil de matching automatique : **0.95**

### Champs de métadonnées vérifiés
- `targeted_muscles` : Array, doit contenir au moins un élément
- `startingPosition` : String, ne doit pas être vide
- `movement` : String, ne doit pas être vide
- `intensity` : String, ne doit pas être vide
- `series` : String, ne doit pas être vide
- `constraints` : String, ne doit pas être vide
- `theme` : String, ne doit pas être vide
- `difficulty` : String, ne doit pas être "indéfini" ou vide

## ⚠️ Notes importantes

1. Le script `check-videos-metadata-status.js` nécessite :
   - `mammoth` (déjà installé dans package.json)
   - Accès à la base de données Neon (via `DATABASE_URL`)
   - Les fichiers Word dans `Dossier Cliente/Video/groupes-musculaires/01-métadonnées/`

2. Les rapports sont générés avec un timestamp pour éviter d'écraser les rapports précédents.

3. Le script utilise le même algorithme de parsing que celui qui sera utilisé pour la synchronisation finale, garantissant la cohérence.
