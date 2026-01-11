# 🚀 Quick Start : Programme ABDOS

## ✅ État : PRÊT pour l'upload

Tout est configuré et prêt pour l'automatisation Word → Neon !

---

## 📋 Checklist Avant Upload

- [x] ✅ Lambda configurée (génération thumbnails)
- [x] ✅ Système de synchronisation prêt
- [x] ✅ Configuration d'ordre créée (à compléter après identification)
- [x] ✅ API de tri prête
- [ ] ⏳ **Upload des vidéos dans S3** (à faire)
- [ ] ⏳ **Synchronisation dans Neon** (à faire après upload)
- [ ] ⏳ **Configuration de l'ordre** (à faire après identification)

---

## 🎯 Processus en 5 Étapes

### Étape 1 : Upload dans S3

**Format des noms :**
```
{numero}. {titre}.mp4
```

**Exemples :**
- `12. Crunch classique.mp4`
- `5. Planche sur les coudes.mp4`
- `8. Gainage oblique.mp4`

**Chemin S3 :**
```
Video/programmes-predefinis/abdos/{numero}. {titre}.mp4
```

**Important :**
- ✅ Le numéro doit être au début
- ✅ Format : `{numero}. ` (point + espace)
- ✅ Le titre peut contenir des accents

### Étape 2 : Synchronisation automatique

**Option A : Via l'API (recommandé)**
```bash
curl -X POST http://localhost:3000/api/videos/sync
```

**Option B : Via le script**
```bash
node scripts/sync-videos-from-s3.js
```

**Ce qui se passe :**
- ✅ Détection des vidéos dans S3
- ✅ Ajout dans Neon avec `region = 'abdos'`
- ✅ `category = 'Predefined Programs'`
- ✅ `videoType = 'PROGRAMMES'`

### Étape 3 : Génération automatique des thumbnails

**La Lambda se déclenche automatiquement** lors de l'upload :
- ✅ Génère thumbnail (frame à 5s)
- ✅ Upload dans S3
- ✅ Met à jour Neon

**Vérifier :**
```bash
aws logs tail /aws/lambda/only-you-coaching-thumbnail-generator --follow
```

### Étape 4 : Identification des vidéos

```bash
node scripts/identify-program-videos.js abdos
```

**Résultat :**
- Liste des vidéos avec leurs numéros
- Leurs IDs dans Neon
- Template de configuration à copier

### Étape 5 : Configuration de l'ordre

**Depuis le fichier Word**, donnez-moi l'ordre :
```
Pour le programme ABDOS, l'ordre est :
1. vidéo 12
2. vidéo 5
3. vidéo 8
...
```

**Je mettrai à jour `lib/program-orders.ts` automatiquement !**

---

## 🔄 Flow Automatique

```
Upload S3 → Lambda (thumbnail) → Sync Neon → Identification → Configuration ordre → ✅
```

---

## 📝 Extraction des Métadonnées (Optionnel)

Si vous voulez aussi les métadonnées (muscle cible, position départ, etc.), donnez-moi les infos dans ce format :

```
Vidéo 12 (abdos):
- Muscle cible: Abdominaux
- Position départ: Allongé sur le dos
- Mouvement: Relever le buste
- Intensité: Moyenne
- Série: 3x15
- Contre-indication: Problèmes de dos
```

Ou créez un fichier JSON (voir `docs/ABDOS_PROGRAM_SETUP.md`)

---

## ✅ Vérification

Après chaque étape, vérifiez :

```bash
# 1. Vérifier dans S3
aws s3 ls s3://only-you-coaching/Video/programmes-predefinis/abdos/

# 2. Vérifier dans Neon
node scripts/identify-program-videos.js abdos

# 3. Vérifier les thumbnails
node scripts/test-lambda-thumbnail.js
```

---

## 🎉 Résultat Final

Une fois tout configuré :
- ✅ Les vidéos apparaissent sur `/programmes/abdos`
- ✅ Dans l'ordre spécifié dans le fichier Word
- ✅ Avec leurs thumbnails
- ✅ Avec leurs métadonnées (si fournies)

---

## 🆘 En cas de problème

### Les vidéos ne sont pas synchronisées
- Vérifier le chemin S3 : `Video/programmes-predefinis/abdos/`
- Vérifier les logs : `curl -X POST http://localhost:3000/api/videos/sync`

### Les thumbnails ne sont pas générés
- Vérifier les logs Lambda
- Vérifier que la Lambda layer ffmpeg est attachée

### L'ordre ne s'applique pas
- Vérifier que `ABDOS_PROGRAM_ORDER` est complété
- Vérifier que les IDs correspondent

---

**Vous êtes prêt ! 🚀**

Upload les vidéos dans S3, puis suivez les étapes ci-dessus.

















