# 📚 Source de Vérité des Métadonnées

**Date de création :** 22 janvier 2026  
**Auteur :** Assistant IA  
**Statut :** ✅ Document de référence officiel

---

## 🎯 Objectif

Ce document définit **LA SOURCE DE VÉRITÉ UNIQUE** pour toutes les métadonnées des exercices de la plateforme Pilates.

**RÈGLE D'OR** : Toutes les modifications de métadonnées doivent UNIQUEMENT se baser sur ce fichier source.

---

## 📄 Fichier Source de Vérité

### Localisation

```
/Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-structurees.md
```

### Description

Ce fichier contient **toutes les métadonnées extraites et structurées** depuis les fichiers Word originaux fournis par la cliente.

**Contenu :**
- ✅ 569 exercices au total
- ✅ 11 régions musculaires (abdos, biceps, dos, épaule, fessiers-jambes, etc.)
- ✅ Métadonnées complètes pour chaque exercice :
  - Titre de l'exercice
  - Muscle cible
  - Position de départ
  - Mouvement
  - **Intensité** (Niveau débutant, Tout niveau, Niveau intermédiaire, Niveau avancé, etc.)
  - Série (nombre de répétitions)
  - Contre-indication
  - Thème (optionnel)

---

## 🔄 Processus de Synchronisation

### 1. Extraction depuis Word → Fichier Structuré

**Script :** `scripts/extract-word-metadata-properly.js`

```bash
node scripts/extract-word-metadata-properly.js
```

Ce script :
- Lit les 11 fichiers Word (.docx) du dossier `01-métadonnées`
- Extrait les métadonnées de manière structurée
- Génère le fichier `metadonnees-structurees.md`

### 2. Synchronisation vers Neon

**Script :** `scripts/sync-neon-from-structured-metadata.js`

```bash
node scripts/sync-neon-from-structured-metadata.js
```

Ce script :
- Lit le fichier `metadonnees-structurees.md`
- Parse les métadonnées structurées
- Normalise les titres pour le matching avec les vidéos en base
- Met à jour les champs suivants dans `videos_new` :
  - `description`
  - `startingPosition`
  - `movement`
  - `intensity`
  - `series`
  - `constraints`
  - `theme`
  - `targeted_muscles`
  - `muscleGroups`
  - `difficulty` (calculé depuis `intensity`)

### 3. Vérification

**Script :** `scripts/check-current-intensities.js`

```bash
node scripts/check-current-intensities.js
```

Affiche :
- Distribution des intensités et difficultés
- Échantillon de vidéos avec leurs métadonnées
- Permet de vérifier la cohérence

---

## 📋 Mapping Intensité → Difficulté

Le champ `intensity` (texte libre) est converti en `difficulty` (valeur normalisée) selon cette logique :

| Intensité (Word) | Difficulté (Neon) | Exemples |
|------------------|-------------------|----------|
| Contient "débutant" ou "niveau 1" | `debutant` | "Niveau débutant", "Débutant" |
| Contient "avancé" ou "avance" ou "niveau 2/3" | `avance` | "Niveau avancé", "Très avancé", "Intermédiaire et avancé" |
| Tout le reste (dont "tout niveau", "intermédiaire") | `intermediaire` | "Tout niveau", "Niveau intermédiaire", "Tour niveau" |
| Vide ou non défini | `intermediaire` | (par défaut) |

**Note importante** : "Tout niveau" est mappé vers `intermediaire` car il s'agit d'exercices adaptables à tous, donc de difficulté moyenne.

---

## 📊 Statistiques Actuelles

**Dernière synchronisation :** 22 janvier 2026

### Résultats
- ✅ **457 vidéos** mises à jour avec les métadonnées correctes
- ⚠️ **102 vidéos** avec intensité manquante dans les fichiers Word source
- ⚠️ **45 vidéos** sans métadonnées correspondantes

### Couverture
- **75%** des vidéos ont des métadonnées complètes et cohérentes
- **17%** ont des métadonnées partielles (intensité manquante)
- **8%** n'ont pas de métadonnées correspondantes

---

## ⚠️ Problèmes Identifiés et Résolus

### ❌ AVANT (Problèmes)

1. **Incohérences massives** :
   - "Tout niveau" marqué comme `ADVANCED` ❌
   - "Niveau avancé" marqué comme `BEGINNER` ❌
   - "Intermédiaire" marqué comme `ADVANCED` ❌

2. **Variations non normalisées** :
   - "Tour niveau", "Tout niveau", "tout niveau"
   - Points finaux inconsistants
   - Espaces multiples

3. **Source de vérité inexistante** :
   - Le fichier `metadonnees-completes.md` contenait du texte brut non structuré
   - Impossible d'extraire proprement les champs "Intensité:", "Série:", etc.

### ✅ APRÈS (Solutions)

1. **Extraction structurée** depuis les fichiers Word originaux
2. **Fichier unique** `metadonnees-structurees.md` avec format Markdown cohérent
3. **Script de synchronisation** avec matching intelligent (exact + partiel)
4. **Normalisation** des titres et valeurs d'intensité
5. **Mapping cohérent** Intensité → Difficulté

---

## 🚫 À NE PAS FAIRE

1. ❌ **Ne JAMAIS** modifier manuellement les métadonnées dans Neon
2. ❌ **Ne JAMAIS** inventer des valeurs d'intensité
3. ❌ **Ne JAMAIS** se fier à `metadonnees-completes.md` (texte brut non structuré)
4. ❌ **Ne JAMAIS** utiliser les anciens scripts de synchronisation

---

## ✅ Workflow Recommandé

### Pour ajouter/modifier des métadonnées :

1. **Modifier les fichiers Word source** dans `Dossier Cliente/Video/groupes-musculaires/01-métadonnées/*.docx`
2. **Ré-extraire** : `node scripts/extract-word-metadata-properly.js`
3. **Synchroniser** : `node scripts/sync-neon-from-structured-metadata.js`
4. **Vérifier** : `node scripts/check-current-intensities.js`

### Pour vérifier la cohérence :

```bash
# Vérifier les intensités actuelles
node scripts/check-current-intensities.js

# Voir le fichier source
cat "Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-structurees.md"
```

---

## 📝 Notes pour la Cliente

**Problème signalé :** "Je vois des exercices avec pas les bonnes intensités"

**Cause identifiée :**
- Les métadonnées n'avaient pas été extraites correctement depuis les fichiers Word
- Un fichier intermédiaire (`metadonnees-completes.md`) contenait du texte brut sans structure
- Les scripts de synchronisation ne pouvaient pas extraire les champs "Intensité:" correctement
- Des valeurs par défaut ou incorrectes avaient été appliquées

**Solution mise en place :**
- ✅ Extraction propre depuis les fichiers Word originaux
- ✅ Création d'un fichier structuré unique : `metadonnees-structurees.md`
- ✅ Synchronisation complète vers Neon
- ✅ 457 vidéos corrigées avec les bonnes intensités

**Prochaines étapes pour compléter :**
- 📝 Remplir les 102 exercices manquant le champ "Intensité:" dans les fichiers Word
- 📝 Ajouter les métadonnées pour les 45 vidéos sans correspondance

---

## 🔗 Fichiers Liés

- **Source de vérité** : `Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-structurees.md`
- **Scripts** :
  - `scripts/extract-word-metadata-properly.js`
  - `scripts/sync-neon-from-structured-metadata.js`
  - `scripts/check-current-intensities.js`
- **Documentation** :
  - `docs/METADATA_MAPPING.md`
  - `docs/VIDEO_LIBRARY_ARCHITECTURE.md`

---

**Dernière mise à jour :** 22 janvier 2026
