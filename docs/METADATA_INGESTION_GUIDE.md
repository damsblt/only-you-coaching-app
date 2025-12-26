# 📥 Guide d'Ingestion des Métadonnées

## ✅ Système Simplifié

Au lieu de parser automatiquement les fichiers Word (qui peuvent avoir des formats variés), vous pouvez maintenant **fournir directement les métadonnées** dans un format simple, et le système les ingère automatiquement dans Neon.

---

## 📝 Format d'Entrée

### Option 1 : Format Texte Simple (Recommandé)

Créez un fichier `.txt` avec ce format :

```
Vidéo 12 (abdos):
  - Muscle cible: Abdominaux
  - Position départ: Allongé sur le dos
  - Mouvement: Relever le buste
  - Intensité: Moyenne
  - Série: 3x15
  - Contre-indication: Problèmes de dos

Vidéo 5 (abdos):
  - Muscle cible: Transverse
  - Position départ: À genoux, appui sur les avant-bras
  - Mouvement: Maintenir la position
  - Intensité: Débutant
  - Série: 1x 30 secondes
  - Contre-indication: Aucune
```

**Avantages :**
- ✅ Format simple et lisible
- ✅ Facile à copier depuis Word
- ✅ Pas besoin de JSON

### Option 2 : Format JSON

Créez un fichier `.json` :

```json
[
  {
    "videoNumber": 12,
    "region": "abdos",
    "muscleCible": "Abdominaux",
    "positionDepart": "Allongé sur le dos",
    "mouvement": "Relever le buste",
    "intensite": "Moyenne",
    "serie": "3x15",
    "contreIndication": "Problèmes de dos"
  },
  {
    "videoNumber": 5,
    "region": "abdos",
    "muscleCible": "Transverse",
    "positionDepart": "À genoux, appui sur les avant-bras",
    "mouvement": "Maintenir la position",
    "intensite": "Débutant",
    "serie": "1x 30 secondes",
    "contreIndication": "Aucune"
  }
]
```

---

## 🚀 Utilisation

### 1. Créer le fichier de métadonnées

Créez un fichier (`.txt` ou `.json`) avec les métadonnées, par exemple :
- `data/metadata-abdos.txt`
- `data/metadata-machine.json`

### 2. Tester en mode dry-run

```bash
node scripts/ingest-metadata-to-neon.js data/metadata-abdos.txt --dry-run
```

Cela affichera ce qui sera fait **sans modifier** la base de données.

### 3. Appliquer les changements

```bash
node scripts/ingest-metadata-to-neon.js data/metadata-abdos.txt
```

---

## 🔄 Ce qui se passe automatiquement

1. **Synchronisation S3 → Neon**
   - Détecte toutes les vidéos dans S3 pour la région
   - Vérifie si elles existent déjà dans Neon
   - Ajoute les nouvelles vidéos avec les bonnes propriétés

2. **Matching par numéro**
   - Match les métadonnées avec les vidéos par numéro
   - Extrait le numéro depuis l'URL S3 ou le titre

3. **Mise à jour Neon**
   - Met à jour les champs :
     - `exo_title` ← Titre exercice
     - `targeted_muscles` ← Muscle cible (converti en array)
     - `startingPosition` ← Position départ
     - `movement` ← Mouvement
     - `intensity` ← Intensité
     - `series` ← Série
     - `constraints` ← Contre-indication

---

## 📋 Exemple Complet

### 1. Créer le fichier

```bash
cat > data/metadata-abdos.txt << 'EOF'
Vidéo 12 (abdos):
  - Muscle cible: Abdominaux
  - Position départ: Allongé sur le dos
  - Mouvement: Relever le buste
  - Intensité: Moyenne
  - Série: 3x15
  - Contre-indication: Problèmes de dos

Vidéo 5 (abdos):
  - Muscle cible: Transverse
  - Position départ: À genoux, appui sur les avant-bras
  - Mouvement: Maintenir la position
  - Intensité: Débutant
  - Série: 1x 30 secondes
  - Contre-indication: Aucune
EOF
```

### 2. Tester

```bash
node scripts/ingest-metadata-to-neon.js data/metadata-abdos.txt --dry-run
```

### 3. Appliquer

```bash
node scripts/ingest-metadata-to-neon.js data/metadata-abdos.txt
```

---

## ✅ Avantages

1. **Simple** : Format texte facile à copier depuis Word
2. **Fiable** : Pas de parsing complexe, données exactes
3. **Rapide** : Copier-coller depuis Word → Fichier → Script
4. **Sécurisé** : Mode dry-run pour vérifier avant d'appliquer

---

## 📝 Notes

- Le numéro de vidéo doit correspondre au numéro dans le nom de fichier S3
- La région doit correspondre au dossier S3 (`abdos`, `machine`, etc.)
- Les champs optionnels peuvent être omis
- "Aucune" pour contre-indication sera ignoré

---

**C'est beaucoup plus simple et fiable ! 🎉**

