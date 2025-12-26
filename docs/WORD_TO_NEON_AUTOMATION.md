# 🤖 Automatisation Word → Neon

## ✅ Système Automatisé Complet

Le système est maintenant **entièrement automatisé** pour extraire les métadonnées depuis les fichiers Word et les ingérer dans Neon après l'upload dans S3.

---

## 🔄 Flow Automatique Complet

```
1. Upload vidéos dans S3 (avec numéros)
   ↓
2. Lambda génère thumbnails automatiquement ✅
   ↓
3. Appel API sync-with-metadata
   ↓
4. Extraction métadonnées depuis Word ✅
   ↓
5. Synchronisation S3 → Neon ✅
   ↓
6. Matching métadonnées avec vidéos ✅
   ↓
7. Mise à jour Neon avec métadonnées ✅
   ↓
✅ Tout est prêt !
```

---

## 📋 Utilisation

### Option 1 : Via l'API (Recommandé)

```bash
curl -X POST http://localhost:3000/api/videos/sync-with-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "wordPath": "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx",
    "region": "abdos"
  }'
```

### Option 2 : Via le Script

```bash
node scripts/auto-sync-word-to-neon.js \
  "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx" \
  --region=abdos
```

---

## 🎯 Ce qui est Automatisé

### 1. Extraction des Métadonnées depuis Word ✅

Le système parse automatiquement le fichier Word et extrait :
- ✅ Numéro de vidéo
- ✅ Muscle cible
- ✅ Position départ
- ✅ Mouvement
- ✅ Intensité
- ✅ Série
- ✅ Contre-indication

**Patterns reconnus :**
- Listes numérotées (1., 2., etc.)
- Format "Vidéo X"
- Métadonnées avec labels français (Muscle cible, Position départ, etc.)

### 2. Synchronisation S3 → Neon ✅

- ✅ Détecte toutes les vidéos dans S3 pour la région
- ✅ Vérifie si elles existent déjà dans Neon
- ✅ Ajoute les nouvelles vidéos avec les bonnes propriétés :
  - `region = 'abdos'` (ou autre)
  - `category = 'Predefined Programs'`
  - `videoType = 'PROGRAMMES'`

### 3. Matching Automatique ✅

- ✅ Match les métadonnées avec les vidéos par numéro
- ✅ Extrait le numéro depuis l'URL S3 ou le titre
- ✅ Met à jour les champs correspondants dans Neon :
  - `startingPosition` ← Position départ
  - `movement` ← Mouvement
  - `intensity` ← Intensité
  - `series` ← Série
  - `constraints` ← Contre-indication

### 4. Génération de Thumbnails ✅

- ✅ Lambda se déclenche automatiquement lors de l'upload
- ✅ Génère thumbnail (frame à 5 secondes)
- ✅ Met à jour la colonne `thumbnail` dans Neon

---

## 📝 Format du Fichier Word

Le système reconnaît plusieurs formats :

### Format 1 : Liste Numérotée
```
1. Crunch classique
   Muscle cible: Abdominaux
   Position départ: Allongé sur le dos
   Mouvement: Relever le buste
   Intensité: Moyenne
   Série: 3x15
   Contre-indication: Problèmes de dos

2. Planche sur les coudes
   ...
```

### Format 2 : Format "Vidéo X"
```
Vidéo 12: Crunch classique
Muscle cible: Abdominaux
Position départ: Allongé sur le dos
...
```

### Format 3 : Tableau
Le système peut aussi parser des tableaux si le format est cohérent.

---

## 🧪 Test Rapide

### 1. Upload une vidéo de test dans S3

```bash
aws s3 cp test-video.mp4 \
  s3://only-you-coaching/Video/programmes-predefinis/abdos/12.\ Test\ video.mp4
```

### 2. Appeler l'API

```bash
curl -X POST http://localhost:3000/api/videos/sync-with-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "wordPath": "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx",
    "region": "abdos"
  }'
```

### 3. Vérifier dans Neon

```bash
node scripts/identify-program-videos.js abdos
```

---

## 📊 Résultat Attendu

Après l'automatisation, chaque vidéo dans Neon aura :
- ✅ `title` : Généré depuis le nom de fichier
- ✅ `videoUrl` : URL S3 complète
- ✅ `thumbnail` : URL du thumbnail (généré par Lambda)
- ✅ `region` : Région du programme
- ✅ `startingPosition` : Position départ (depuis Word)
- ✅ `movement` : Mouvement (depuis Word)
- ✅ `intensity` : Intensité (depuis Word)
- ✅ `series` : Série (depuis Word)
- ✅ `constraints` : Contre-indication (depuis Word)

---

## ⚙️ Configuration

### Variables d'Environnement Requises

- ✅ `DATABASE_URL` : URL Neon
- ✅ `AWS_S3_BUCKET_NAME` : Nom du bucket S3
- ✅ `AWS_ACCESS_KEY_ID` : Clé d'accès AWS
- ✅ `AWS_SECRET_ACCESS_KEY` : Clé secrète AWS
- ✅ `AWS_REGION` : Région AWS

### Dépendances Installées

- ✅ `mammoth` : Parser Word documents
- ✅ `adm-zip` : Extraction manuelle si mammoth échoue

---

## 🐛 Dépannage

### Le Word n'est pas parsé correctement

**Vérifier :**
1. Le format du document (liste numérotée ou "Vidéo X")
2. Les logs de l'API pour voir le texte extrait
3. Tester avec le script standalone : `node scripts/parse-word-metadata.js <chemin>`

**Solution :**
- Ajuster les patterns dans `parseExercisesFromText()`
- Vérifier que le document n'est pas protégé ou corrompu

### Les métadonnées ne matchent pas avec les vidéos

**Vérifier :**
1. Que les numéros dans le Word correspondent aux numéros dans les noms de fichiers
2. Que les vidéos sont bien synchronisées dans Neon
3. Les logs pour voir quelles vidéos sont trouvées

**Solution :**
- Vérifier le format des noms de fichiers : `{numero}. {titre}.mp4`
- Vérifier que les numéros dans le Word sont corrects

### Les vidéos ne sont pas synchronisées

**Vérifier :**
1. Que les vidéos existent dans S3 au bon chemin
2. Les permissions AWS
3. Les logs de l'API

**Solution :**
- Vérifier le chemin S3 : `Video/programmes-predefinis/{region}/`
- Vérifier les credentials AWS

---

## 📝 Exemple Complet

### 1. Upload des vidéos

```bash
# Upload plusieurs vidéos
aws s3 cp "12. Crunch classique.mp4" \
  s3://only-you-coaching/Video/programmes-predefinis/abdos/

aws s3 cp "5. Planche sur les coudes.mp4" \
  s3://only-you-coaching/Video/programmes-predefinis/abdos/
```

### 2. Appeler l'automatisation

```bash
curl -X POST http://localhost:3000/api/videos/sync-with-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "wordPath": "Dossier Cliente/Video/programmes-predefinis/abdos/Descriptif programme pré établit SPECIAL ABDOMINAUX.docx",
    "region": "abdos"
  }'
```

### 3. Résultat

```json
{
  "success": true,
  "exercisesExtracted": 8,
  "videosSynced": 8,
  "videosUpdated": 8
}
```

### 4. Vérification

```bash
node scripts/identify-program-videos.js abdos
```

---

## ✅ Checklist

Avant d'utiliser l'automatisation :

- [x] ✅ Lambda configurée (thumbnails)
- [x] ✅ Dépendances installées (mammoth, adm-zip)
- [x] ✅ Variables d'environnement configurées
- [ ] ⏳ Vidéos uploadées dans S3 avec numéros
- [ ] ⏳ Fichier Word accessible
- [ ] ⏳ Appel de l'API sync-with-metadata

---

## 🎉 Avantages

1. **Automatisation complète** : Plus besoin d'extraire manuellement les métadonnées
2. **Cohérence** : Les métadonnées sont directement liées aux vidéos
3. **Rapidité** : Tout se fait en une seule commande
4. **Fiabilité** : Matching automatique par numéro de vidéo

---

**Le système est prêt ! 🚀**

Upload les vidéos dans S3, puis appelle l'API `sync-with-metadata` avec le chemin du Word.














