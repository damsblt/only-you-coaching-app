# Guide de Synchronisation des Audios de Coaching Mental

Ce guide explique comment synchroniser les audios du dossier `Audio/coaching mental/` depuis S3 vers Neon et les afficher sur la page `/coaching-mental`.

## 📋 Prérequis

1. **Variables d'environnement configurées** :
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (par défaut: `eu-north-1`)
   - `AWS_S3_BUCKET_NAME` (par défaut: `only-you-coaching`)
   - `DATABASE_URL` (URL de connexion Neon)

2. **Base de données Neon configurée** :
   - La table `audios` doit exister
   - La colonne `tags` doit être ajoutée (voir ci-dessous)

## 🔧 Étape 1 : Mettre à jour le schéma de la base de données

Exécutez le script SQL suivant dans votre console Neon pour ajouter la colonne `tags` et mettre à jour les contraintes de catégorie :

```sql
-- Exécutez le script : scripts/add-tags-to-audios.sql
```

Ou exécutez directement dans le SQL Editor de Neon :

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"**
4. Copiez-collez le contenu de `scripts/add-tags-to-audios.sql`
5. Exécutez le script

## 🚀 Étape 2 : Synchroniser les audios depuis S3

Une fois le schéma mis à jour, vous pouvez synchroniser les audios en appelant l'API :

### Option 1 : Via curl (ligne de commande)

```bash
curl -X POST http://localhost:3000/api/audio/sync-coaching-mental
```

### Option 2 : Via le navigateur (développement)

1. Démarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Ouvrez votre navigateur et allez sur :
   ```
   http://localhost:3000/api/audio/sync-coaching-mental
   ```
   
   Note: Vous devrez utiliser un outil comme Postman ou faire un POST request, car les navigateurs font des GET par défaut.

### Option 3 : Via un script Node.js

Créez un fichier `scripts/sync-coaching-mental.js` :

```javascript
const fetch = require('node-fetch');

async function syncCoachingMental() {
  try {
    const response = await fetch('http://localhost:3000/api/audio/sync-coaching-mental', {
      method: 'POST',
    });
    const data = await response.json();
    console.log('Sync result:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

syncCoachingMental();
```

Puis exécutez :
```bash
node scripts/sync-coaching-mental.js
```

## 📊 Réponse de l'API

L'API retourne un JSON avec les informations suivantes :

```json
{
  "message": "Sync completed. X audios synced from Audio/coaching mental/ folder.",
  "synced": 5,
  "total": 5,
  "errors": [] // ou un tableau d'erreurs si des problèmes sont survenus
}
```

## ✅ Étape 3 : Vérifier sur la page

Une fois la synchronisation terminée, les audios devraient apparaître sur :

```
http://localhost:3000/coaching-mental
```

La page récupère automatiquement les audios avec la catégorie "Coaching Mental" depuis l'API `/api/audio?category=Coaching Mental`.

## 🔍 Détails techniques

### Structure S3 attendue

Les fichiers doivent être dans l'un de ces dossiers (l'API essaie toutes les variations) :
- `Audio/coaching mental/`
- `Audio/Coaching Mental/`
- `Audio/coaching-mental/`
- `Audio/Coaching-Mental/`

### Formats audio supportés

- `.mp3`
- `.wav`
- `.m4a`
- `.aac`
- `.ogg`

### Métadonnées générées automatiquement

L'API génère automatiquement :
- **Titre** : Basé sur le nom du fichier (sans extension)
- **Description** : Basée sur le contenu du nom du fichier
- **Tags** : Générés automatiquement selon le contenu
- **Catégorie** : Toujours "Coaching Mental"
- **Durée** : 300 secondes par défaut (peut être mis à jour manuellement)

### Détection de contenu

L'API détecte automatiquement le type de contenu basé sur le nom du fichier et génère des tags et descriptions appropriés :
- Anxiété → tags: anxiété, relaxation, gestion-stress
- Gratitude → tags: gratitude, méditation, positivité
- Confiance → tags: confiance, méditation, développement-personnel
- etc.

## 🐛 Dépannage

### Erreur : "AWS credentials not configured"
- Vérifiez que `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` sont définis dans `.env.local`

### Erreur : "Column tags does not exist"
- Exécutez le script `scripts/add-tags-to-audios.sql` dans Neon

### Erreur : "category value violates check constraint"
- Exécutez le script `scripts/add-tags-to-audios.sql` pour mettre à jour la contrainte

### Aucun fichier trouvé
- Vérifiez que les fichiers sont bien dans `Audio/coaching mental/` dans S3
- Vérifiez les permissions S3 (l'utilisateur AWS doit avoir les droits de lecture)

### Les audios n'apparaissent pas sur la page
- Vérifiez que la catégorie est bien "Coaching Mental" (avec espace)
- Vérifiez que `isPublished` est `true` dans la base de données
- Vérifiez les logs du navigateur pour les erreurs de l'API

## 📝 Notes

- Les URLs signées sont générées à chaque requête pour éviter l'expiration
- Les fichiers déjà synchronisés (détectés par `s3key` ou `title`) sont ignorés
- La synchronisation peut être relancée plusieurs fois sans créer de doublons

