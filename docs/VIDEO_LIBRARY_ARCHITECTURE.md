# Architecture de la Bibliothèque de Vidéos

## Recommandation : Une seule table avec attributs distincts

### Structure actuelle

La base de données utilise **une seule table `videos_new`** avec un champ `videoType` pour distinguer les types de vidéos :

- `videoType = 'MUSCLE_GROUPS'` : Vidéos des groupes musculaires (s3://only-you-coaching/Video/groupes-musculaires/)
- `videoType = 'PROGRAMMES'` : Vidéos des programmes prédéfinis (s3://only-you-coaching/Video/programmes-predefinis/)

### Pourquoi une seule table ?

✅ **Avantages :**
1. **Structure commune** : Toutes les vidéos partagent les mêmes champs (title, description, videoUrl, thumbnail, etc.)
2. **Simplicité** : Pas de duplication de code ou de logique
3. **Requêtes unifiées** : Facile de récupérer tous les types ou de filtrer par type
4. **Maintenance** : Un seul endroit pour gérer les vidéos
5. **Évolutivité** : Facile d'ajouter de nouveaux types à l'avenir

❌ **Pourquoi pas deux tables ?**
- Duplication de structure et de code
- Requêtes plus complexes (UNION ou requêtes séparées)
- Maintenance plus difficile
- Risque d'incohérence entre les tables

### Structure de la table `videos_new`

```sql
CREATE TABLE videos_new (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  videoUrl TEXT NOT NULL,
  thumbnail TEXT,
  duration INTEGER,
  difficulty TEXT,
  category TEXT,
  region TEXT,
  muscleGroups TEXT[],
  targeted_muscles TEXT[],
  startingPosition TEXT,
  movement TEXT,
  intensity TEXT,
  series TEXT,
  constraints TEXT,
  videoType TEXT CHECK (videoType IN ('MUSCLE_GROUPS', 'PROGRAMMES')),
  isPublished BOOLEAN DEFAULT false,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Filtrage par type

Le champ `videoType` permet de filtrer facilement :

```typescript
// Récupérer uniquement les vidéos de groupes musculaires
query.eq('videoType', 'MUSCLE_GROUPS')

// Récupérer uniquement les vidéos de programmes
query.eq('videoType', 'PROGRAMMES')

// Récupérer toutes les vidéos (pas de filtre)
// (pas de .eq('videoType', ...))
```

### Page Bibliothèque de Vidéos

La page `/bibliotheque-videos` affiche maintenant **tous les types de vidéos** :
- Vidéos des groupes musculaires (`MUSCLE_GROUPS`)
- Vidéos des programmes prédéfinis (`PROGRAMMES`)

### Synchronisation S3 → Neon

Les scripts de synchronisation déterminent automatiquement le `videoType` selon le chemin S3 :

```javascript
// Dans scripts/sync-videos-from-s3.js et app/api/videos/sync/route.ts
const videoType = key.includes('programmes-predefinis') 
  ? 'PROGRAMMES' 
  : 'MUSCLE_GROUPS'

const category = key.includes('programmes-predefinis')
  ? 'Predefined Programs'
  : 'Muscle Groups'
```

### Emplacements S3

- **Programmes prédéfinis** : `s3://only-you-coaching/Video/programmes-predefinis/`
  - → `videoType = 'PROGRAMMES'`
  - → `category = 'Predefined Programs'`

- **Groupes musculaires** : `s3://only-you-coaching/Video/groupes-musculaires/`
  - → `videoType = 'MUSCLE_GROUPS'`
  - → `category = 'Muscle Groups'`

### Conclusion

L'architecture actuelle avec **une seule table et un attribut `videoType`** est la meilleure solution car elle est :
- Simple à maintenir
- Performante
- Évolutive
- Cohérente

Aucun changement de structure n'est nécessaire. Il suffit de s'assurer que les vidéos sont synchronisées avec le bon `videoType`.







