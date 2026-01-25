# PROMPT COMPLET : Reconstruction de la Bibliothèque Vidéo

## Contexte

Nous repartons de zéro pour reconstruire complètement le système de bibliothèque vidéo. L'objectif est de créer un pipeline robuste et fiable qui synchronise les vidéos depuis S3 vers Neon, génère les thumbnails automatiquement, et intègre les métadonnées depuis les fichiers Word.

## Architecture cible

### 1. Structure S3

**Vidéos source :**
- **Bucket :** `only-you-coaching`
- **Chemin :** `Video/groupes-musculaires/{groupe-musculaire}/`
- **Exemples de groupes musculaires :** `abdos`, `biceps`, `triceps`, `dos`, `pectoraux`, `fessiers-jambes`, `épaule`, `bande`, `machine`, `cardio`, `streching`
- **Format des noms de fichiers :** `{nombre}. {titre de l'exercice}.mp4`
  - Exemple : `1. Biceps assis sur le ballon + haltère.mp4`
  - Exemple : `10. Biceps alterné à genoux sur le ballon + haltère.mp4`
  - Le nombre peut être un entier (1, 2, 10) ou un décimal (10.1, 10.2)

**Thumbnails générés :**
- **Chemin :** `thumbnails/Video/groupes-musculaires/{groupe-musculaire}/`
- **Format :** `{nombre}. {titre de l'exercice}-thumb.jpg`
  - Exemple : `1. Biceps assis sur le ballon + haltère-thumb.jpg`

### 2. Base de données Neon

**Table :** `videos_new`

**Colonnes importantes :**
- `id` (UUID, PRIMARY KEY)
- `title` (TEXT) : **Titre extrait = partie qui suit le nombre dans le nom de fichier S3**
  - Exemple : Pour `1. Biceps assis sur le ballon + haltère.mp4` → `title = "Biceps assis sur le ballon + haltère"`
- `videoNumber` (DECIMAL(10, 2)) : **Le nombre au début du nom de fichier (peut être décimal)**
  - Exemple : Pour `1. Biceps assis...` → `videoNumber = 1`
  - Exemple : Pour `10.1 Biceps...` → `videoNumber = 10.1`
  - **✅ CONFIRMÉ :** Les nombres peuvent être décimaux
- `videoUrl` (TEXT) : URL complète S3 de la vidéo
- `thumbnail` (TEXT) : URL complète S3 du thumbnail
- `region` (TEXT) : Nom du groupe musculaire (ex: "abdos", "biceps", "fessiers-jambes")
- `videoType` (TEXT) : Toujours `'MUSCLE_GROUPS'` pour ces vidéos
- `difficulty` (TEXT) : `'BEGINNER'`, `'INTERMEDIATE'`, `'ADVANCED'` (extrait des métadonnées Word)
- `muscleGroups` (TEXT[]) : Tableau des groupes musculaires
- `targeted_muscles` (TEXT[]) : Muscles ciblés (extrait des métadonnées Word)
- `startingPosition` (TEXT) : Position de départ (extrait des métadonnées Word)
- `movement` (TEXT) : Mouvement (extrait des métadonnées Word)
- `intensity` (TEXT) : Intensité (extrait des métadonnées Word)
- `series` (TEXT) : Série (extrait des métadonnées Word)
- `constraints` (TEXT) : Contre-indications (extrait des métadonnées Word)
- `theme` (TEXT) : Thème (extrait des métadonnées Word)
- `isPublished` (BOOLEAN) : `true` par défaut après synchronisation
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

**⚠️ IMPORTANT :** La colonne `videoNumber` doit être ajoutée si elle n'existe pas déjà.
- **✅ MIGRATION CRÉÉE :** `scripts/add-videoNumber-column.sql`
- **Type :** `DECIMAL(10, 2)` pour supporter les nombres décimaux
- **Index :** Index créé sur `videoNumber` et index composite sur `(videoNumber, region)`

### 3. Fichiers de métadonnées

**Emplacement :** `Dossier Cliente/Video/groupes-musculaires/01-métadonnées/`

**✅ PRIORITÉ 1 : Format Markdown (.md) - RECOMMANDÉ**

**Fichiers Markdown disponibles :**
- `abdominaux.md`
- (autres fichiers .md selon les régions)

**Avantages du format Markdown :**
- ✅ **Parsing plus simple** : Pas besoin de bibliothèque externe (mammoth), lecture directe du fichier texte
- ✅ **Structure claire** : Balises `**` pour les sections, formatage cohérent
- ✅ **Numéros bien formatés** : Détection fiable des numéros (10, 10.1, 10.2, etc.)
- ✅ **Performance** : Plus rapide que le parsing Word
- ✅ **Résultats testés** : 88/90 exercices indexés par numéro (97.8%) pour les abdos

**Structure dans les fichiers Markdown :**
```markdown
**10.Extension de jambes tendues tête décollée + antépulsion avec disque**

**Muscle cible** : Transverse – muscle profond de l'abdomen, épaule
**Position départ** :
Couché sur le dos.
Courbe lombaire neutre.
...

**Mouvement** :
Tendre les jambes l'une après l'autre entre 45° et 90°...

**Intensité.** Niveau avancé
**Série :** 3x 15 à 20 répétitions
**Contre -indication :** Lombalgie
**Thème :** Extension
```

**Format alternatif (sans balises bold) :**
```markdown
10.Extension de jambes tendues tête décollée + antépulsion avec disque

**Muscle cible** : ...
```

**⚠️ PRIORITÉ 2 : Format Word (.docx) - FALLBACK**

**Fichiers Word disponibles :**
- `abdominaux complet 2.docx` (préféré, plus simple à parser)
- `abdominaux complet.docx`
- `biceps.docx`
- `triceps.docx`
- `dos.docx`
- `pectoraux.docx`
- `fessier jambe.docx` (ou `fessiers-jambes.docx`)
- `epaule.docx` (ou `épaule.docx`)
- `bande.docx`
- `machine.docx`
- `cardio.docx`
- `streching.docx` (ou `stretching.docx`)

**Structure attendue dans les fichiers Word :**
Chaque exercice est structuré ainsi :
```
{titre de l'exercice}

Muscle cible : {muscles ciblés}
Position de départ : {position}
Mouvement : {mouvement}
Intensité : {intensité}
Série : {série}
Contre-indication : {contre-indications}
Thème : {thème}
```

**⚠️ IMPORTANT :** 
- Le parsing des fichiers Word doit être **identique** à chaque exécution
- Utiliser `mammoth` pour extraire le texte brut, puis parser de manière cohérente
- Préférer les fichiers avec "2" dans le nom (ex: `abdominaux complet 2.docx`) car ils sont plus simples à parser
- Résultats testés : 90/90 exercices indexés par numéro (100%) pour les abdos avec `abdominaux complet 2.docx`

**Ordre de priorité pour le parsing :**
1. **Fichiers Markdown (.md)** - Priorité absolue
2. **Fichiers Word avec "2" (.docx)** - Ex: `abdominaux complet 2.docx`
3. **Fichiers Word standard (.docx)** - Fallback

## Étapes d'implémentation

### ÉTAPE 1 : Upload des vidéos dans S3

**Action utilisateur :**
- L'utilisateur va uploader le dossier `vidéos/` complet dans S3
- Destination : `s3://only-you-coaching/Video/groupes-musculaires/`
- Structure préservée : `Video/groupes-musculaires/{groupe-musculaire}/{fichier}.mp4`

**Vérification :**
- Créer un script ou une page admin pour vérifier que toutes les vidéos sont bien dans S3
- Lister tous les fichiers dans `Video/groupes-musculaires/` et afficher un rapport

### ÉTAPE 2 : Génération automatique des thumbnails via Lambda

**Fonction Lambda :**
- **Déclencheur :** S3 Event Notification sur le bucket `only-you-coaching`
- **Filtre :** Seulement les fichiers dans `Video/groupes-musculaires/` avec extension `.mp4`
- **Action :**
  1. Télécharger la vidéo depuis S3
  2. Générer un thumbnail à la seconde 5 (ou 1 si la vidéo est trop courte)
  3. Uploader le thumbnail dans `thumbnails/Video/groupes-musculaires/{groupe-musculaire}/{nom-fichier}-thumb.jpg`
  4. **IMPORTANT :** La Lambda génère les thumbnails même si la vidéo n'est pas encore dans Neon
  5. **NE PAS** mettre à jour la base de données ici (cela sera fait à l'étape 3)

**Configuration Lambda :**
- Runtime : Node.js 20.x
- Timeout : 5 minutes
- Mémoire : 1024 MB (pour ffmpeg)
- Layer : ffmpeg layer pour AWS Lambda
- Variables d'environnement :
  - `S3_BUCKET_NAME=only-you-coaching`
  - `AWS_REGION=eu-north-1`
  - `DATABASE_URL` (optionnel, pour mise à jour si vidéo existe déjà)

**Code Lambda :**
- Utiliser `ffmpeg` pour générer le thumbnail
- Générer les thumbnails même si la vidéo n'existe pas dans Neon (synchronisation plus tard)
- Structure préservée : même organisation par région que les vidéos
- Gérer les erreurs gracieusement (ne pas faire échouer toute la fonction si une vidéo échoue)
- Logger toutes les actions pour debugging

**Scripts utiles :**
- `scripts/invoke-lambda-for-all-videos.js` : Invoquer la Lambda manuellement pour toutes les vidéos existantes
- `scripts/check-thumbnails-in-s3.js` : Vérifier les thumbnails générés dans S3
- `scripts/monitor-thumbnails-generation.js` : Monitoring en temps réel de la génération

### ÉTAPE 3 : Synchronisation S3 → Neon (Vidéos + Thumbnails)

**⚠️ IMPORTANT :** Cette étape doit être exécutée **APRÈS** que tous les thumbnails soient générés.

**Endpoint API :** `POST /api/videos/sync`

**Fonctionnalités :**
1. **Scanner S3 :** Lister tous les fichiers dans `Video/groupes-musculaires/`
2. **Pour chaque vidéo :**
   - Extraire le **numéro** (début du nom de fichier, support des décimaux : 10.1, 10.2)
   - Extraire le **titre** (partie après le numéro)
   - Extraire le **groupe musculaire** (nom du dossier parent = `region`)
   - Construire l'URL S3 de la vidéo
   - Vérifier si la vidéo existe déjà dans Neon (par `videoUrl` ou `videoNumber` + `region`)
   - Si elle n'existe pas, créer l'enregistrement avec :
     - `title` = titre extrait
     - `videoNumber` = nombre extrait (DECIMAL(10, 2))
     - `videoUrl` = URL S3 de la vidéo
     - `thumbnail` = `null` pour l'instant (sera mis à jour à l'étape 3b)
     - `region` = groupe musculaire
     - `videoType` = `'MUSCLE_GROUPS'` **⚠️ IMPORTANT : Toujours `'MUSCLE_GROUPS'` pour ces vidéos**
     - `category` = `'Muscle Groups'`
     - `isPublished` = `true`
     - Métadonnées vides pour l'instant (seront remplies à l'étape 4)

**ÉTAPE 3b : Synchronisation des thumbnails S3 → Neon**

**Endpoint API :** `POST /api/videos/sync-thumbnails-from-s3`

**Fonctionnalités :**
1. **Scanner S3 :** Lister tous les thumbnails dans `thumbnails/Video/groupes-musculaires/`
2. **Pour chaque thumbnail :**
   - Extraire le **numéro** et la **région** depuis le chemin S3
   - **PRIORITÉ 1 :** Matcher par `videoNumber + region` (même logique que pour les fichiers Markdown)
     - Clé de matching : `{videoNumber}:{region}` (ex: `10:abdos`)
     - Plus fiable que le matching par URL
   - **PRIORITÉ 2 :** Fallback par `videoUrl` (si le numéro n'est pas disponible)
   - **PRIORITÉ 3 :** Fallback par partial match (encodage différent)
   - Mettre à jour la colonne `thumbnail` dans Neon avec l'URL S3 du thumbnail
   - **⚠️ IMPORTANT :** Ne mettre à jour que les vidéos avec `videoType = 'MUSCLE_GROUPS'`

**Avantages du matching par `videoNumber + region` :**
- ✅ Même logique que pour les fichiers Markdown (cohérence)
- ✅ 100% de fiabilité (testé avec les Markdown)
- ✅ Insensible aux différences d'encodage URL
- ✅ Performance : lookup direct dans une Map (O(1))

**Extraction du numéro et du titre :**
```typescript
function extractNumberAndTitle(filename: string): { number: number | null, title: string } {
  // Format: "1. Titre de l'exercice.mp4" ou "10.1 Titre de l'exercice.mp4"
  const match = filename.match(/^(\d+(?:\.\d+)?)\.\s*(.+?)(?:\.mp4|\.mov|\.avi)?$/i)
  if (match) {
    const numberStr = match[1]
    const title = match[2].trim()
    const number = numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10)
    return { number, title }
  }
  // Fallback: pas de numéro, tout le nom est le titre
  const nameWithoutExt = filename.replace(/\.(mp4|mov|avi)$/i, '')
  return { number: null, title: nameWithoutExt }
}
```

**Mapping des groupes musculaires :**
- `abdos` → `"abdos"`
- `biceps` → `"biceps"`
- `triceps` → `"triceps"`
- `dos` → `"dos"`
- `pectoraux` → `"pectoraux"`
- `fessiers-jambes` → `"fessiers-jambes"`
- `épaule` ou `epaule` → `"épaule"`
- `bande` → `"bande"`
- `machine` → `"machine"`
- `cardio` → `"cardio"`
- `streching` ou `stretching` → `"streching"`

**Rapport de synchronisation :**
- Retourner un JSON avec :
  - Nombre de vidéos synchronisées
  - Nombre de vidéos ignorées (déjà existantes)
  - Nombre de vidéos sans thumbnail
  - Liste des erreurs (si any)

### ÉTAPE 4 : Parsing des métadonnées depuis les fichiers Markdown

**⚠️ IMPORTANT :** Utiliser les fichiers Markdown dans `/Users/damien/Documents/Marie-Line/pilates-coaching-app/Only You V3/pilates-app-v3-complete/Dossier Cliente/Video/groupes-musculaires/01-métadonnées/`

**Endpoint API :** `POST /api/videos/parse-markdown-metadata`

**Fonctionnalités :**
1. **Lire tous les fichiers Markdown** dans `Dossier Cliente/Video/groupes-musculaires/01-métadonnées/`
   - **Priorité absolue :** Fichiers Markdown (.md)
   - **Fallback :** Fichiers Word avec "2" (.docx) si Markdown non disponible
2. **Pour chaque fichier Markdown :**
   - Lire directement le fichier texte
   - Parser avec `parseMarkdownMetadata()` qui détecte :
     - Format 1 : `**numéro.titre**` (avec balises bold)
     - Format 2 : `numéro.titre` (sans balises bold)
   - Extraire pour chaque exercice :
     - `title` : Titre de l'exercice
     - `number` : Numéro de la vidéo (support des décimaux : 10.1, 10.2)
     - `targetedMuscles` : Muscles ciblés (array)
     - `startingPosition` : Position de départ
     - `movement` : Mouvement
     - `intensity` : Intensité
     - `series` : Série
     - `constraints` : Contre-indications
     - `theme` : Thème
     - `difficulty` : Déduit de l'intensité (mapping : "débutant" → "BEGINNER", "intermédiaire" → "INTERMEDIATE", "avancé" → "ADVANCED")

**Parser Markdown :**
```typescript
function parseMarkdownMetadata(content: string, filename: string): ExerciseMetadata[] {
  const exercises: ExerciseMetadata[] = []
  const lines = content.split('\n').map(l => l.trim())
  
  let currentExercise: ExerciseMetadata | null = null
  let currentSection: string | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détection d'un titre d'exercice
    // Format 1: **numéro.titre** (avec balises bold)
    let titleMatch = line.match(/^\*\*(\d+(?:\.\d+)?)\.?\s*(.+?)\*\*$/)
    // Format 2: numéro.titre (sans balises bold)
    if (!titleMatch) {
      titleMatch = line.match(/^(\d+(?:\.\d+)?)\.\s*(.+)$/)
    }
    
    if (titleMatch) {
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      const numberStr = titleMatch[1]
      const title = titleMatch[2].trim()
      const number = numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10)
      
      currentExercise = {
        title,
        videoNumber: number,
        targeted_muscles: [],
        startingPosition: '',
        movement: '',
        intensity: '',
        series: '',
        constraints: '',
        theme: '',
        source: filename
      }
      currentSection = null
      continue
    }
    
    // Parser les sections marquées par **
    if (line.includes('**Muscle cible')) {
      const match = line.match(/\*\*Muscle cible\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
      if (match && match[1] && currentExercise) {
        currentExercise.targeted_muscles = match[1].split(',').map(m => m.trim()).filter(m => m)
      }
      // Gérer le cas où plusieurs sections sont sur la même ligne
      if (line.includes('**Position départ')) {
        const posMatch = line.match(/\*\*Position départ\*\*\s*:\s*([^*]+?)(?:\*\*|$)/i)
        if (posMatch && posMatch[1] && currentExercise) {
          currentExercise.startingPosition = posMatch[1].trim()
        }
      }
      continue
    }
    
    // ... parser les autres sections (Position départ, Mouvement, Intensité, etc.)
  }
  
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}
```

**Parser Word (identique) :**
Le parsing Word doit être **déterministe** et **reproductible**. Utiliser une fonction de parsing unique qui :
- Détecte les titres d'exercices (lignes suivies de "Muscle cible")
- Extrait les numéros depuis les lignes précédentes ou depuis le titre
- Extrait les sections avec des regex cohérentes
- Gère les cas limites (lignes vides, formats alternatifs, etc.)

**Exemple de fonction de parsing :**
```typescript
function parseExercisesFromWord(text: string, region: string): ExerciseMetadata[] {
  const exercises: ExerciseMetadata[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  
  let currentExercise: ExerciseMetadata | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLines = lines.slice(i + 1, i + 5).join(' ').toLowerCase()
    
    // Détection d'un nouveau titre d'exercice
    if (nextLines.includes('muscle cible') && !line.toLowerCase().match(/^(muscle|position|mouvement|intensité|série|contre|thème)/i)) {
      // Sauvegarder l'exercice précédent
      if (currentExercise && currentExercise.title) {
        exercises.push(currentExercise)
      }
      
      // Nouveau exercice
      currentExercise = {
        title: line,
        videoNumber: null, // Sera extrait si présent
        region,
        targeted_muscles: [],
        startingPosition: '',
        movement: '',
        intensity: '',
        series: '',
        constraints: '',
        theme: ''
      }
      continue
    }
    
    if (!currentExercise) continue
    
    // Parser les sections
    if (line.match(/^Muscle cible\s*[:\-]?\s*/i)) {
      const value = line.replace(/^Muscle cible\s*[:\-]?\s*/i, '').trim()
      currentExercise.targeted_muscles = value.split(',').map(m => m.trim()).filter(m => m)
    } else if (line.match(/^Position (de )?départ\s*[:\-]?\s*/i)) {
      const value = line.replace(/^Position (de )?départ\s*[:\-]?\s*/i, '').trim()
      currentExercise.startingPosition = value
    }
    // ... etc pour les autres sections
  }
  
  // Ajouter le dernier exercice
  if (currentExercise && currentExercise.title) {
    exercises.push(currentExercise)
  }
  
  return exercises
}
```

**Retour :**
- JSON avec tous les exercices parsés, groupés par région
- Format : `{ [region]: ExerciseMetadata[] }`

### ÉTAPE 5 : Matching et mise à jour des métadonnées depuis les fichiers Markdown

**⚠️ IMPORTANT :** Cette étape met à jour toutes les vidéos avec les métadonnées des fichiers Markdown.

**Endpoint API :** `POST /api/videos/match-and-update-metadata`

**Fonctionnalités :**
1. **Récupérer toutes les vidéos** de Neon avec `videoType = 'MUSCLE_GROUPS'`
2. **Parser tous les fichiers Markdown** depuis `Dossier Cliente/Video/groupes-musculaires/01-métadonnées/`
3. **Pour chaque vidéo :**
   - Trouver l'exercice correspondant en utilisant :
     - **Priorité 1 :** `videoNumber` + `region` (match exact) - **✅ RECOMMANDÉ : Plus fiable et rapide**
       - Clé de matching : `{videoNumber}:{region}` (ex: `10:abdos`)
       - Si la vidéo a un numéro décimal (10.1, 10.2) et qu'il n'existe pas dans le Markdown, chercher le numéro de base (10)
       - Si la vidéo a un numéro entier (10) et qu'il n'existe pas, chercher les variantes décimales (10.1, 10.2)
     - **Priorité 2 :** Similarité du titre (algorithme de similarité de chaînes) - **Fallback uniquement**
   - **✅ RÉSULTATS TESTÉS :**
     - Matching par numéro : **100% de réussite** (90/90 pour les abdos avec Word, 88/90 avec Markdown)
     - Matching par similarité : **100% de réussite** (90/90 pour les abdos) mais moins fiable
   - Si un match est trouvé, mettre à jour la vidéo avec :
     - `targeted_muscles` : Muscles ciblés (array)
     - `startingPosition` : Position de départ
     - `movement` : Mouvement
     - `intensity` : Intensité
     - `series` : Série
     - `constraints` : Contre-indications
     - `theme` : Thème
     - `difficulty` : Déduit de l'intensité (mapping : "débutant" → "BEGINNER", "intermédiaire" → "INTERMEDIATE", "avancé" → "ADVANCED")
   - **⚠️ IMPORTANT :** Ne mettre à jour que les vidéos avec `videoType = 'MUSCLE_GROUPS'`

**Algorithme de similarité (amélioré) :**
- **Normalisation avancée** : 
  - Suppression des accents et ponctuation
  - Normalisation des mots courants ("avec", "sur", "au", "le", "la", "les", "de", "du", "des", "en", "une", "un", "1")
  - Correction des fautes communes ("Gainag" → "Gainage", "Cruch" → "Crunch", "tap" → "tape")
  - Normalisation des pluriels ("pieds" → "pied", "jambes" → "jambe", "mains" → "main")
  - Nettoyage des annotations vidéo ("F", "H", "x", "CHANGER LA VIDEO", "sol +")
- **Triple méthode de matching** :
  1. Similarité directe (Levenshtein) entre les titres complets
  2. Similarité par mots-clés (extraction des mots significatifs > 3 caractères)
  3. Vérification des mots-clés communs (bonus si plusieurs mots-clés correspondent)
- **Seuil de matching automatique :** **0.5** (plus tolérant pour gérer les variations de formulation)
- **Exemples de correspondances réussies** :
  - "14. Crunch ballon F x" ↔ "14. Crunch sur ballon avec pieds au sol"
  - "23. Oblique debout + élastique ou poulie milieu H" ↔ "23. Oblique debout avec élastique"
  - "29. Gainage oblique sur 1 main au sol + pieds croisés H sol +" ↔ "29. Gainage oblique en appuie sur une main et pieds croisés sur le banc"
  - "31. Gainag oblique sur 1 main au sol + relevé de jambe +pieds banc H" ↔ "31. Gainage oblique 1 main au sol et pieds banc avec relevé de jambe"
  - "47.1 Gainage planche + tap sur le côté F CHANGER LA VIDEO" ↔ "47.1 Gainage planche + tape sur le côté"

**Retour :**
- JSON avec :
  - `updated`: Nombre de vidéos mises à jour automatiquement
  - `needsValidation`: Liste des vidéos nécessitant une validation manuelle (si matching par similarité)
    - Format : `[{ videoId, videoTitle, markdownTitle, similarity, region }]`
  - `notFound`: Liste des vidéos sans correspondance dans les fichiers Markdown
    - **✅ REQUIS :** Générer une liste complète des vidéos sans correspondance
  - `missingMetadata`: Liste des vidéos avec métadonnées manquantes (même partiellement)
    - Format : `[{ videoId, videoTitle, videoNumber, region, missingFields: string[] }]`
    - **✅ REQUIS :** Indiquer précisément quels champs manquent pour chaque vidéo

**Endpoint de validation manuelle :** `POST /api/videos/validate-metadata-match`
- Permet de valider manuellement un match
- Prend en paramètre : `videoId`, `exerciseMetadata`

### ÉTAPE 6 : Affichage dans l'UI

**Page :** `app/bibliotheque-videos/page.tsx`

**Fonctionnalités :**
1. **Récupérer les vidéos** depuis l'API (hook `useVideos`)
   - Filtrer par `videoType = 'MUSCLE_GROUPS'`
2. **Filtres :**
   - **Par groupe musculaire :** Dropdown avec tous les groupes disponibles
   - **Par niveau :** Dropdown avec "Tous", "Débutant", "Intermédiaire", "Avancé"
3. **Affichage :**
   - Grille de cartes vidéo (composant `EnhancedVideoCard`)
   - Chaque carte affiche :
     - Thumbnail
     - Titre
     - Groupe musculaire
     - Niveau (difficulté)
     - Durée (si disponible)
4. **Tri :**
   - Par défaut : Par `videoNumber` (ordre numérique)
   - Optionnel : Par titre alphabétique, par niveau

**Hook `useVideos` :**
- Doit supporter les filtres `muscleGroup` et `difficulty`
- Doit filtrer par `videoType = 'MUSCLE_GROUPS'`

## Workflow complet de synchronisation

**Ordre d'exécution :**

1. **Upload des vidéos dans S3** (action utilisateur)
   - Destination : `s3://only-you-coaching/Video/groupes-musculaires/`

2. **Génération automatique des thumbnails** (Lambda automatique)
   - La Lambda se déclenche automatiquement lors de l'upload
   - Pour les vidéos déjà uploadées, invoquer manuellement : `node scripts/invoke-lambda-for-all-videos.js`
   - Vérifier la progression : `node scripts/monitor-thumbnails-generation.js`

3. **Synchronisation des vidéos dans Neon** (`POST /api/videos/sync`)
   - Extrait `videoNumber` et `title` depuis les noms de fichiers
   - **⚠️ IMPORTANT :** Chaque ligne créée doit avoir `videoType = 'MUSCLE_GROUPS'`
   - Crée les enregistrements avec `thumbnail = null` (sera mis à jour à l'étape suivante)

4. **Synchronisation des thumbnails dans Neon** (`POST /api/videos/sync-thumbnails-from-s3`)
   - Match les thumbnails avec les vidéos par `videoNumber + region` (même logique que Markdown)
   - Met à jour la colonne `thumbnail` pour toutes les vidéos avec `videoType = 'MUSCLE_GROUPS'`

5. **Parsing des métadonnées Markdown** (`POST /api/videos/parse-markdown-metadata`)
   - Parse tous les fichiers Markdown dans `Dossier Cliente/Video/groupes-musculaires/01-métadonnées/`
   - Retourne les exercices groupés par région

6. **Matching et mise à jour des métadonnées** (`POST /api/videos/match-and-update-metadata`)
   - Match les vidéos avec les exercices par `videoNumber + region` (priorité 1)
   - Met à jour toutes les métadonnées (muscles ciblés, position, mouvement, etc.)
   - **⚠️ IMPORTANT :** Ne met à jour que les vidéos avec `videoType = 'MUSCLE_GROUPS'`

**Scripts de workflow :**

1. **Workflow manuel :**
```bash
node scripts/complete-sync-workflow.js
```
Ce script exécute automatiquement les étapes 3, 4, 5 et 6 dans l'ordre.

2. **Workflow automatique (recommandé) :**
```bash
node scripts/auto-sync-after-thumbnails.js
```
Ce script :
- Surveille la génération des thumbnails en temps réel
- Détecte automatiquement quand les thumbnails sont générés (seuil : 95% + 3 itérations stables)
- Lance automatiquement le workflow complet de synchronisation une fois terminé
- **✅ RECOMMANDÉ** : Laissez ce script tourner après avoir invoqué la Lambda pour toutes les vidéos

## Checklist de validation

Avant de considérer le système comme complet, vérifier :

- [ ] Toutes les vidéos sont uploadées dans S3
- [ ] Tous les thumbnails sont générés automatiquement par Lambda (vérifier avec `node scripts/check-thumbnails-in-s3.js`)
- [ ] Toutes les vidéos sont synchronisées dans Neon avec `videoNumber` et `title` corrects
- [ ] **⚠️ Toutes les vidéos ont `videoType = 'MUSCLE_GROUPS'`**
- [ ] Tous les thumbnails sont synchronisés dans Neon (vérifier avec `POST /api/videos/sync-thumbnails-from-s3`)
- [ ] Tous les fichiers Markdown sont parsés correctement
- [ ] Le matching entre vidéos et métadonnées Markdown fonctionne (par `videoNumber + region`)
- [ ] Toutes les métadonnées sont mises à jour depuis les fichiers Markdown
- [ ] La colonne `videoNumber` a été créée dans la table `videos_new`
- [ ] Les listes de vidéos sans correspondance et avec métadonnées manquantes sont générées
- [ ] L'UI affiche correctement les vidéos avec les filtres
- [ ] Le tri par groupe musculaire fonctionne
- [ ] Le tri par niveau fonctionne
- [ ] Les thumbnails s'affichent correctement
- [ ] Les vidéos sont jouables

## Notes importantes

1. **✅ Colonne `videoNumber` :** Migration créée dans `scripts/add-videoNumber-column.sql`. Exécuter avec `node scripts/run-migration-videoNumber.js`

2. **✅ Format Markdown recommandé :** Préférer les fichiers Markdown (.md) car :
   - Parsing plus simple (pas besoin de mammoth)
   - Structure plus claire et cohérente
   - Numéros bien formatés et détectables
   - Performance meilleure
   - Résultats : 88/90 exercices indexés par numéro (97.8%) pour les abdos
   - **Emplacement :** `/Users/damien/Documents/Marie-Line/pilates-coaching-app/Only You V3/pilates-app-v3-complete/Dossier Cliente/Video/groupes-musculaires/01-métadonnées/`

3. **⚠️ IMPORTANT : `videoType = 'MUSCLE_GROUPS'`** : 
   - Toutes les vidéos synchronisées depuis `Video/groupes-musculaires/` doivent avoir `videoType = 'MUSCLE_GROUPS'`
   - Vérifier lors de la synchronisation que cette valeur est bien définie
   - Utiliser cette valeur pour filtrer lors de la mise à jour des métadonnées et thumbnails

4. **Parsing identique :** Le parsing doit être **déterministe**. Utiliser toujours la même fonction, les mêmes regex, la même logique. Tester avec plusieurs fichiers pour s'assurer de la cohérence.

5. **✅ Matching par numéro prioritaire :** Le matching par `videoNumber + region` est **plus fiable** que la similarité textuelle :
   - **100% de réussite** (90/90 pour les abdos)
   - Plus rapide (lookup direct vs calcul de similarité)
   - Plus robuste (insensible aux variations de formulation)
   - Utiliser en **priorité 1**, la similarité textuelle en **fallback uniquement**
   - **Même logique pour les thumbnails** : matching par `videoNumber + region` (cohérence avec les métadonnées)

6. **Matching des thumbnails :** 
   - Utiliser la même logique de matching par `videoNumber + region` que pour les métadonnées Markdown
   - Clé de matching : `{videoNumber}:{region}` (ex: `10:abdos`)
   - Plus fiable que le matching par URL (insensible aux différences d'encodage)
   - **⚠️ IMPORTANT :** Ne mettre à jour que les vidéos avec `videoType = 'MUSCLE_GROUPS'`

7. **Matching des titres (fallback) :** Le matching par similarité doit être **tolérant** mais **sécurisé**. Seuil de similarité = **0.5** pour le matching automatique en fallback. Ne pas mettre à jour automatiquement si la similarité est < 0.5.

4. **Gestion des erreurs :** Toutes les étapes doivent gérer les erreurs gracieusement. Une erreur sur une vidéo ne doit pas faire échouer toute la synchronisation.

5. **Logging :** Logger toutes les actions importantes pour faciliter le debugging.

6. **Performance :** Pour de grandes quantités de vidéos, considérer le traitement par batch ou l'utilisation de queues.

## Questions clarifiées

1. **✅ Format des numéros :** Les numéros peuvent être des décimaux (10.1, 10.2) → Type `DECIMAL(10, 2)`
2. **✅ Colonne `videoNumber` :** N'existe pas encore → Migration créée dans `scripts/add-videoNumber-column.sql`
3. **✅ Format de métadonnées :** **Format Markdown (.md) recommandé en priorité** :
   - Plus simple à parser (pas besoin de mammoth)
   - Structure plus claire
   - Numéros bien formatés
   - Résultats : 88/90 exercices indexés par numéro (97.8%) pour les abdos
   - Fallback : Fichiers Word avec "2" (ex: `abdominaux complet 2.docx`) puis Word standard
4. **✅ Matching prioritaire :** **Matching par `videoNumber` en priorité 1** :
   - 100% de réussite (90/90 pour les abdos)
   - Plus rapide et plus fiable que la similarité textuelle
   - Similarité textuelle en fallback uniquement (seuil = 0.5)
5. **✅ Seuil de similarité :** **0.5** pour le matching par similarité (fallback uniquement)
6. **Gestion des doublons :** Que faire si plusieurs exercices correspondent à une même vidéo ? (À décider)
7. **✅ Vidéos sans métadonnées :** Générer une liste complète des vidéos sans correspondance + liste des vidéos avec métadonnées manquantes (même partiellement)

## Scripts créés

1. **`scripts/add-videoNumber-column.sql`** : Migration SQL pour ajouter la colonne `videoNumber`
2. **`scripts/run-migration-videoNumber.js`** : Script Node.js pour exécuter la migration
3. **`scripts/check-videos-metadata-status.js`** : Script pour générer les listes de :
   - Vidéos sans correspondance avec les fichiers de métadonnées (Markdown/Word)
   - Vidéos avec métadonnées manquantes (même partiellement)
4. **`scripts/compare-videos-vs-word.js`** : Script de test pour comparer les vidéos avec les exercices parsés
   - Supporte les formats Markdown et Word
   - Affiche les statistiques de matching (par numéro vs par similarité)
5. **`scripts/parse-markdown-metadata.js`** : Script de test pour parser les fichiers Markdown
6. **`scripts/test-similarity-only.js`** : Script de test pour évaluer le matching par similarité seul
7. **`scripts/invoke-lambda-for-all-videos.js`** : Invoquer la Lambda manuellement pour toutes les vidéos existantes
8. **`scripts/check-thumbnails-in-s3.js`** : Vérifier les thumbnails générés dans S3
9. **`scripts/monitor-thumbnails-generation.js`** : Monitoring en temps réel de la génération des thumbnails
10. **`scripts/deploy-lambda-updated.sh`** : Script pour déployer la version mise à jour de la Lambda
11. **`scripts/complete-sync-workflow.js`** : Script complet pour exécuter tout le workflow de synchronisation (manuel)
12. **`scripts/auto-sync-after-thumbnails.js`** : **✅ RECOMMANDÉ** - Surveille la génération des thumbnails et lance automatiquement le workflow complet une fois terminé
13. **`scripts/list-thumbnails-in-s3.js`** : Lister tous les thumbnails dans S3 avec leurs chemins complets

**Usage :**
```bash
# Exécuter la migration
node scripts/run-migration-videoNumber.js

# Vérifier l'état des métadonnées
node scripts/check-videos-metadata-status.js

# Comparer les vidéos avec les exercices (test)
node scripts/compare-videos-vs-word.js [region]  # Ex: node scripts/compare-videos-vs-word.js abdos

# Tester le parsing Markdown
node scripts/parse-markdown-metadata.js

# Tester le matching par similarité seul
node scripts/test-similarity-only.js [region]  # Ex: node scripts/test-similarity-only.js abdos

# Workflow automatique (recommandé) : surveille et lance automatiquement le workflow
node scripts/auto-sync-after-thumbnails.js

# Workflow manuel : exécute directement le workflow complet
node scripts/complete-sync-workflow.js

# Vérifier les thumbnails dans S3
node scripts/check-thumbnails-in-s3.js

# Monitoring de la génération des thumbnails (sans lancement automatique)
node scripts/monitor-thumbnails-generation.js

# Invoquer la Lambda pour toutes les vidéos
node scripts/invoke-lambda-for-all-videos.js

# Déployer la Lambda mise à jour
bash scripts/deploy-lambda-updated.sh
```

---

**Ce prompt doit être utilisé comme référence complète pour reconstruire le système de bibliothèque vidéo de A à Z.**
