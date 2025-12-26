# Guide : Configuration du Programme ABDOS

## ✅ État Actuel

### Ce qui est PRÊT :

1. ✅ **Lambda de génération de thumbnails** : Configurée et déployée
2. ✅ **Système de synchronisation S3 → Neon** : `/api/videos/sync`
3. ✅ **Configuration d'ordre** : `ABDOS_PROGRAM_ORDER` créé dans `lib/program-orders.ts` (à compléter)
4. ✅ **API de tri** : Prête à appliquer l'ordre une fois configuré

### Ce qui reste à faire :

1. ⏳ **Upload des vidéos dans S3** avec les bons noms
2. ⏳ **Synchronisation dans Neon** via l'API
3. ⏳ **Identification des vidéos** pour créer l'ordre
4. ⏳ **Configuration de l'ordre** dans `lib/program-orders.ts`
5. ⏳ **Extraction des métadonnées** depuis le fichier Word

---

## 📋 Processus Complet

### Étape 1 : Upload des vidéos dans S3

**Format des noms de fichiers :**
```
{numero}. {titre}.mp4
```

**Exemples :**
- `1. Crunch classique.mp4`
- `12. Planche sur les coudes.mp4`
- `5. Gainage oblique.mp4`

**Chemin S3 :**
```
Video/programmes-predefinis/abdos/{numero}. {titre}.mp4
```

**Important :**
- ✅ Inclure le numéro au début du nom de fichier
- ✅ Utiliser un point et un espace après le numéro : `{numero}. `
- ✅ Le titre peut contenir des accents et espaces

### Étape 2 : Synchronisation dans Neon

Une fois les vidéos uploadées dans S3, synchronisez-les dans Neon :

```bash
# Option 1 : Via l'API (recommandé)
curl -X POST http://localhost:3000/api/videos/sync

# Option 2 : Via le script
node scripts/sync-videos-from-s3.js
```

**Ce qui se passe :**
- Les vidéos sont détectées dans S3
- Elles sont ajoutées dans Neon avec :
  - `region = 'abdos'`
  - `category = 'Predefined Programs'`
  - `videoType = 'PROGRAMMES'`
  - `title` généré depuis le nom de fichier

### Étape 3 : Génération automatique des thumbnails

**La Lambda se déclenche automatiquement** lors de l'upload dans S3 :
- ✅ Génère un thumbnail (frame à 5 secondes)
- ✅ Upload le thumbnail dans S3 (`thumbnails/...`)
- ✅ Met à jour la colonne `thumbnail` dans Neon

**Vérifier les logs Lambda :**
```bash
aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --follow
```

### Étape 4 : Identification des vidéos

Une fois les vidéos synchronisées, identifiez-les :

```bash
node scripts/identify-program-videos.js abdos
```

Ce script affichera :
- Toutes les vidéos avec leurs numéros
- Leurs IDs dans Neon
- Un template de configuration à copier

### Étape 5 : Configuration de l'ordre

**Depuis le fichier Word**, extrayez l'ordre des vidéos. Par exemple :
```
Pour le programme ABDOS, l'ordre est :
1. vidéo 12
2. vidéo 5
3. vidéo 8
4. vidéo 3
...
```

**Mettez à jour `lib/program-orders.ts` :**
```typescript
export const ABDOS_PROGRAM_ORDER: Record<number, string> = {
  1: 'uuid-video-12', // Vidéo 12: Titre
  2: 'uuid-video-5',  // Vidéo 5: Titre
  3: 'uuid-video-8',  // Vidéo 8: Titre
  4: 'uuid-video-3',  // Vidéo 3: Titre
  ...
}
```

### Étape 6 : Extraction des métadonnées (Optionnel)

Si vous voulez aussi mettre à jour les métadonnées (muscle cible, position départ, etc.), créez un fichier JSON :

**Format :**
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
  ...
]
```

**Mettre à jour :**
```bash
node scripts/update-video-metadata-from-word.js data/abdos-metadata.json
```

---

## 🔄 Flow Automatique

```
1. Upload vidéo dans S3
   ↓
2. Lambda génère thumbnail automatiquement
   ↓
3. Synchronisation dans Neon (via API)
   ↓
4. Vidéo disponible dans Neon avec thumbnail
   ↓
5. Configuration de l'ordre (manuel)
   ↓
6. Application automatique de l'ordre sur /programmes/abdos
```

---

## ✅ Checklist de Préparation

Avant d'uploader les vidéos :

- [x] Lambda configurée et déployée
- [x] Système de synchronisation prêt
- [x] Configuration d'ordre créée (à compléter)
- [ ] Vidéos nommées avec le format `{numero}. {titre}.mp4`
- [ ] Ordre extrait depuis le fichier Word
- [ ] Script d'identification prêt

---

## 🧪 Test Rapide

Une fois une vidéo uploadée, testez :

```bash
# 1. Vérifier dans S3
aws s3 ls s3://only-you-coaching/Video/programmes-predefinis/abdos/

# 2. Synchroniser
curl -X POST http://localhost:3000/api/videos/sync

# 3. Vérifier dans Neon
node scripts/identify-program-videos.js abdos

# 4. Vérifier les thumbnails
node scripts/test-lambda-thumbnail.js
```

---

## 📝 Notes Importantes

1. **Format des noms** : Le numéro doit être au début du nom de fichier pour être identifié
2. **Synchronisation** : Doit être faite manuellement après l'upload (pas automatique)
3. **Thumbnails** : Générés automatiquement par la Lambda
4. **Ordre** : Doit être configuré manuellement dans `lib/program-orders.ts`
5. **Métadonnées** : Optionnel, peut être fait après

---

## 🆘 En cas de problème

### Les vidéos ne sont pas synchronisées
- Vérifier que le chemin S3 est correct : `Video/programmes-predefinis/abdos/`
- Vérifier les logs de l'API : `/api/videos/sync`

### Les thumbnails ne sont pas générés
- Vérifier les logs Lambda
- Vérifier que la Lambda layer ffmpeg est attachée
- Vérifier les variables d'environnement de la Lambda

### L'ordre ne s'applique pas
- Vérifier que `ABDOS_PROGRAM_ORDER` est complété dans `lib/program-orders.ts`
- Vérifier que les IDs correspondent aux vidéos dans Neon
- Vérifier les logs de l'API `/api/videos`











