# 📋 Mapping des Métadonnées Word → Neon

## ✅ Plan de Matching

| Depuis Word | Vers Neon | Type | Notes |
|------------|-----------|------|-------|
| **Titre exercice** | `exo_title` | TEXT | Titre de l'exercice |
| **Muscle cible** | `targeted_muscles` | TEXT[] | Converti en array (split par virgule) |
| **Position départ** | `startingPosition` | TEXT | Texte libre |
| **Mouvement** | `movement` | TEXT | Texte libre |
| **Intensité** | `intensity` | VARCHAR | Ex: "Débutant", "Moyenne", "Avancé" |
| **Série** | `series` | TEXT | Ex: "3x15", "1x 30 secondes" |
| **Contre-indication** | `constraints` | TEXT | Texte libre |

---

## 🔄 Exemple de Conversion

### Input (Word/Format texte)
```
Vidéo 12 (abdos):
  - Titre exercice: Planche à genoux sol
  - Muscle cible: Transverse, épaule
  - Position départ: Coude et épaule alignés en appuie sur les avant-bras
  - Mouvement: Maintenir la position en contractant les abdominaux
  - Intensité: Débutant
  - Série: 1x 30 à 60 secondes
  - Contre-indication: Aucune
```

### Output (Neon)
```json
{
  "exo_title": "Planche à genoux sol",
  "targeted_muscles": ["Transverse", "épaule"],
  "startingPosition": "Coude et épaule alignés en appuie sur les avant-bras",
  "movement": "Maintenir la position en contractant les abdominaux",
  "intensity": "Débutant",
  "series": "1x 30 à 60 secondes",
  "constraints": null
}
```

---

## 📝 Notes Importantes

1. **Muscle cible** : 
   - Si plusieurs muscles séparés par des virgules, ils sont automatiquement convertis en array
   - Ex: "Transverse, épaule" → `["Transverse", "épaule"]`
   - Ex: "Abdominaux" → `["Abdominaux"]`

2. **Contre-indication** :
   - Si la valeur est "Aucune", le champ est laissé à `null`
   - Sinon, le texte est stocké tel quel

3. **Champs optionnels** :
   - Tous les champs sont optionnels
   - Seuls les champs fournis sont mis à jour dans Neon

---

## ✅ Fichiers Concernés

- `scripts/ingest-metadata-to-neon.js`
- `scripts/auto-sync-word-to-neon.js`
- `app/api/videos/sync-with-metadata/route.ts`

Tous ces fichiers appliquent le même mapping.

