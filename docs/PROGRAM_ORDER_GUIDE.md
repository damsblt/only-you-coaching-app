# Guide : Comment ordonner les programmes prédéfinis

## 📋 Vue d'ensemble

Ce guide explique comment ajouter l'ordre des vidéos pour les programmes prédéfinis à partir des fichiers Word.

## 🔍 Méthode utilisée

### 1. Identification des vidéos

Les vidéos sont identifiées par leur **numéro** qui apparaît dans :
- Le nom du fichier (ex: `46. Gainage planche...mp4`)
- L'URL S3 (ex: `.../46. Gainage planche...mp4`)
- Parfois dans le titre de la vidéo

### 2. Configuration de l'ordre

L'ordre est stocké dans le fichier `lib/program-orders.ts` sous forme de mapping :
```typescript
export const MACHINE_PROGRAM_ORDER: Record<number, string> = {
  1: 'uuid-video-1', // Vidéo 46: Titre
  2: 'uuid-video-2', // Vidéo 6: Titre
  ...
}
```

### 3. Application automatique

L'API `/api/videos` détecte automatiquement quand il s'agit d'un programme avec ordre personnalisé et applique le tri.

## 📝 Processus pour ajouter un nouveau programme

### Étape 1 : Identifier les vidéos

```bash
node scripts/identify-program-videos.js <region>
```

Exemples :
```bash
node scripts/identify-program-videos.js abdos
node scripts/identify-program-videos.js brule-graisse
node scripts/identify-program-videos.js cuisses-abdos
```

Ce script affichera :
- Toutes les vidéos du programme avec leurs numéros
- Un template de configuration à copier

### Étape 2 : Extraire l'ordre depuis le fichier Word

**IMPORTANT** : Je ne peux pas lire directement les fichiers Word (format binaire).

Vous devez me donner l'ordre des vidéos dans ce format :

```
Pour le programme ABDOS, l'ordre est :
1. vidéo 12
2. vidéo 5
3. vidéo 8
4. vidéo 3
...
```

### Étape 3 : Mettre à jour `lib/program-orders.ts`

1. Trouver la constante correspondante (ex: `ABDOS_PROGRAM_ORDER`)
2. Remplacer le `TODO` par l'ordre réel
3. Utiliser les IDs de vidéos trouvés à l'étape 1

Exemple :
```typescript
export const ABDOS_PROGRAM_ORDER: Record<number, string> = {
  1: 'uuid-video-12', // Vidéo 12: Titre
  2: 'uuid-video-5',  // Vidéo 5: Titre
  3: 'uuid-video-8',  // Vidéo 8: Titre
  4: 'uuid-video-3',  // Vidéo 3: Titre
}
```

### Étape 4 : Tester

L'ordre sera automatiquement appliqué sur `/programmes/<region>`.

## 🗂️ Mapping des champs Word → Neon

Pour mettre à jour les métadonnées des vidéos :

| Champ Word | Champ Neon | Type |
|-----------|-----------|------|
| Muscle cible | `region` (ou `muscleGroups`) | text |
| Position départ | `startingPosition` | text |
| Mouvement | `movement` | text |
| Intensité | `intensity` | varchar |
| Série | `series` | text |
| Contre-indication | `constraints` | text |

### Format JSON pour les métadonnées

Créez un fichier JSON avec ce format :

```json
[
  {
    "videoNumber": 46,
    "region": "machine",
    "muscleCible": "Abdominaux",
    "positionDepart": "Allongé sur le dos",
    "mouvement": "Relever le buste",
    "intensite": "Moyenne",
    "serie": "3x15",
    "contreIndication": "Problèmes de dos"
  },
  {
    "videoNumber": 6,
    "region": "machine",
    "muscleCible": "Fessiers",
    "positionDepart": "Debout",
    "mouvement": "Squat",
    "intensite": "Élevée",
    "serie": "4x12",
    "contreIndication": "Aucune"
  }
]
```

### Mettre à jour les métadonnées

```bash
node scripts/update-video-metadata-from-word.js data/machine-metadata.json
```

## 📊 Programmes à configurer

- [x] Machine (SPECIAL MACHINE) - ✅ Fait
- [ ] Abdos (SPECIAL ABDOMINAUX)
- [ ] Brûle Graisse (SPECIAL BRULE GRAISSE)
- [ ] Cuisses-Abdos (CUISSE ABDOS FESSIER)
- [ ] Dos-Abdos (SPECIAL DOS-ABDOMINAUX)
- [ ] Femmes (SPECIAL FEMME)
- [ ] Haute Intensité (SPECIAL HAUTE INTENSITE)
- [ ] Jambes (SPECIALE JAMBE)
- [ ] Réhabilitation Dos (SPECIAL REHABILITATION DU DOS)

## 💡 Recommandations

### Pourquoi en dur dans le code plutôt qu'en DB ?

✅ **Avantages** :
- Versionné avec le code (Git)
- Pas besoin de migrations DB
- Facile à modifier et déployer
- Pas de risque de corruption de données

❌ **Inconvénients** :
- Nécessite un déploiement pour changer
- Pas d'interface admin pour modifier

**Recommandation** : Garder en dur dans le code pour l'instant. Si besoin d'une interface admin plus tard, on pourra migrer vers une table DB.

## 🔧 Scripts disponibles

1. **`identify-program-videos.js`** : Identifie les vidéos d'un programme
2. **`update-video-metadata-from-word.js`** : Met à jour les métadonnées depuis un JSON
3. **`test-machine-program-order.js`** : Teste l'ordre d'un programme

## 📞 Besoin d'aide ?

Pour chaque nouveau programme, donnez-moi :
1. Le nom de la région (ex: `abdos`, `brule-graisse`)
2. L'ordre des vidéos (ex: `1. vidéo 12, 2. vidéo 5, ...`)
3. Optionnellement : les métadonnées (muscle cible, position départ, etc.)

Je m'occuperai du reste ! 🚀

















