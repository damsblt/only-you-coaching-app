# Métadonnées Corrigées - Incohérences Détectées

**Date**: 21 janvier 2026  
**Action**: Correction des métadonnées incorrectement matchées

## Résumé

Suite à une vérification manuelle de la vidéo **"DV Position De Fente + Poulies Hautes"**, une incohérence a été détectée entre le titre de la vidéo et les métadonnées associées. Un script de détection automatique a ensuite identifié **12 vidéos** avec des incohérences similaires.

**Problème principal**: Les métadonnées décrivaient l'utilisation d'un équipement différent de celui mentionné dans le titre de la vidéo.

## Vidéos Corrigées

### 1. DV Position De Fente + Poulies Hautes

**Incohérence détectée**: 
- **Titre mentionne**: Poulies Hautes
- **Métadonnées parlaient de**: Barre au niveau des clavicules

**Métadonnées incorrectes supprimées**:
```
Position départ: En appui sur la jambe avant, le genou légèrement fléchit. 
L'autre jambe est en arrière. Les coudes fléchis et la barre au niveau 
des clavicules. Mains largeur des épaules, les poignets dirigés vers l'extérieur.

Mouvement: Monter la barre vers l'avant et au-dessus de la tête. 
Revenir lentement en fléchissant les coudes, en position de départ.
```

**Statut**: Métadonnées réinitialisées - En attente des vraies métadonnées pour poulies

---

### 2. Squat Bosu + Rowing Poulie Basse

**Incohérence détectée**: 
- **Titre mentionne**: Poulie Basse + Bosu
- **Métadonnées parlaient de**: Barre + absence de mention du Bosu

**Statut**: Métadonnées réinitialisées

---

### 3. Tirage Poitrine À Genoux Ballon + Poulie Haute Et Barre

**Incohérence détectée**: 
- **Titre mentionne**: Poulie Haute Et Barre
- **Métadonnées parlaient de**: Barre uniquement (poulie non mentionnée)

**Statut**: Métadonnées réinitialisées

---

### 4. Tirage Bras Tendus Position De Squat + Poulie Haute

**Incohérence détectée**: 
- **Titre mentionne**: Poulie Haute
- **Métadonnées parlaient de**: Barre

**Statut**: Métadonnées réinitialisées

---

### 5. Oblique Debout + Élastique Ou Poulie Milieu

**Incohérence détectée**: 
- **Titre mentionne**: Élastique ou Poulie Milieu
- **Métadonnées parlaient de**: Équipement différent (barre/haltère)

**Statut**: Métadonnées réinitialisées

---

### 6. Biceps Debout + Poulie Basse Et Barre

**Incohérence détectée**: 
- **Titre mentionne**: Poulie Basse Et Barre
- **Métadonnées parlaient de**: Haltères ou barre uniquement

**Statut**: Métadonnées réinitialisées

---

### 7. Biceps Debout À La Poulie + Barre (2 instances)

**Incohérence détectée**: 
- **Titre mentionne**: Poulie + Barre
- **Métadonnées parlaient de**: Haltères ou équipement différent

**Note**: Cette vidéo apparaît en double dans la base de données

**Statut**: Métadonnées réinitialisées pour les 2 instances

---

### 8. Tirage Bras Tendus À Genoux Bosu + Poulie Haute

**Incohérence détectée**: 
- **Titre mentionne**: Bosu + Poulie Haute
- **Métadonnées parlaient de**: Barre + absence de mention du Bosu

**Statut**: Métadonnées réinitialisées

---

### 9. Tirage Bras Tendus À Genoux Sol + Poulie Haute

**Incohérence détectée**: 
- **Titre mentionne**: Poulie Haute
- **Métadonnées parlaient de**: Barre

**Statut**: Métadonnées réinitialisées

---

### 10. Tirage Bras Tendus Position De Squat + Poulie Haute

**Incohérence détectée**: 
- **Titre mentionne**: Poulie Haute
- **Métadonnées parlaient de**: Barre

**Statut**: Métadonnées réinitialisées

---

### 11. Tirage Assis À La Poulie Basse

**Incohérence détectée**: 
- **Titre mentionne**: Poulie Basse
- **Métadonnées parlaient de**: Barre vers le nombril

**Statut**: Métadonnées réinitialisées

---

## Autres Incohérences Détectées (Non Critiques)

Le script de détection a également identifié **26 autres incohérences** moins critiques concernant principalement des équipements accessoires (ballon, bosu, TRX) mentionnés dans le titre mais absents des métadonnées. Ces incohérences n'ont pas été corrigées automatiquement car :

1. Les métadonnées de base restent correctes
2. L'équipement accessoire peut être implicite dans la description
3. Nécessitent une vérification manuelle au cas par cas

### Liste des incohérences mineures :

- Gainage oblique avant-bras sur banc et pieds sur ballon
- Cruch Bosu + Pied Ballon
- Gainage Oblique Sur Les Pieds + Avant Bras Sur Le Ballon
- Gainage Jack Nife Sur Les Avant Bras + Pieds TRX
- Gainage Jacknif sur les avant-bras + pieds TRX
- Tirage Bras Tendus À Genoux En Appui Sur Le Ballon + Bras Alternés
- Triceps Sur 1 Pied + Main Sur Ballon + Haltère
- Traction Horizontale TRX Jambes Tendues Niveau Avançé
- Squat bosu + biceps
- Butterfly Couché Ballon + Relevé De Jambe + Haltère
- Extension De Jambes Tendues Avec Ballon Au Cheville Et Tête Au Sol
- Pompe Bosu + Pied Ballon
- Gainage planche avant-bras ballon + pieds barre
- Gainage oblique main au sol et pieds joints sur le banc
- Gainage pyramide avec genoux et cuisse sur le ballon
- Gainage Planche Avant Bras Banc + Pieds Bosu
- Pompe En Appui Sur Le Ballon
- Squat de face avec ballon au mur
- Traction Horizontale TRX Genoux Fléchit Niveau Intermédiaire
- . Tirage Poitrine À Genoux Bosu + 2 Bras Et Corde
- Abduction coucher sur le côté + ballon cheville
- Traction trx

## Cause Probable des Erreurs

Les métadonnées incorrectes provenaient probablement d'un **matching automatique basé sur la similarité des titres** lors de l'extraction depuis les fichiers sources (MD et Word). Par exemple :

- "DV Position De Fente + **Poulies Hautes**" a été matché avec "DV militaire position de fente + **barre**" en raison de la forte similarité des titres (même structure, même position).

## Actions Correctives Prises

1. ✅ **Réinitialisation des métadonnées**: Les 12 vidéos avec incohérences critiques ont eu leurs métadonnées supprimées
2. ✅ **Scripts créés**:
   - `scripts/detect-mismatched-metadata.js` : Détecte automatiquement les incohérences
   - `scripts/fix-equipment-mismatches.js` : Corrige les incohérences d'équipement automatiquement
3. ✅ **Documentation**: Ce fichier répertorie toutes les corrections effectuées

## Actions à Prendre

Pour les 12 vidéos corrigées, il faudra :

1. **Localiser les vraies métadonnées** dans les fichiers sources Word ou créer de nouvelles fiches
2. **Vérifier manuellement** que l'équipement correspond bien au titre
3. **Mettre à jour** la base de données avec les bonnes métadonnées
4. **Exécuter à nouveau** le script de détection pour valider

## Scripts Disponibles

### Détection des incohérences
```bash
node scripts/detect-mismatched-metadata.js
```

### Correction automatique des incohérences critiques
```bash
node scripts/fix-equipment-mismatches.js
```

### Extraction des métadonnées depuis les fichiers Word
```bash
node scripts/extract-metadata-from-word.js
```

### Extraction des métadonnées depuis tous les fichiers MD
```bash
node scripts/update-videos-from-all-metadata-files.js
```

---

**Note**: Ce document sera mis à jour si de nouvelles incohérences sont détectées et corrigées.
