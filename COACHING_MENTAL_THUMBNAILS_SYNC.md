# Guide de Synchronisation des Images de Couverture - Coaching Mental

Ce guide explique comment synchroniser les images de couverture depuis S3 vers Neon pour les audios de coaching mental et configurer l'ordre d'affichage.

## 📋 Prérequis

1. **Variables d'environnement configurées** :
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (par défaut: `eu-north-1`)
   - `AWS_S3_BUCKET_NAME` (par défaut: `only-you-coaching`)
   - `DATABASE_URL` (URL de connexion Neon)

2. **Base de données Neon configurée** :
   - La table `audios` doit exister
   - La colonne `orderIndex` doit être ajoutée (voir ci-dessous)

## 🔧 Étape 1 : Ajouter la colonne `orderIndex` à la table `audios`

Exécutez le script SQL suivant dans votre console Neon :

```sql
-- Exécutez le script : scripts/add-order-index-to-audios.sql
```

Ou exécutez directement dans le SQL Editor de Neon :

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"**
4. Copiez-collez le contenu de `scripts/add-order-index-to-audios.sql`
5. Exécutez le script

## 🚀 Étape 2 : Synchroniser les images depuis S3

Une fois la colonne `orderIndex` ajoutée, vous pouvez synchroniser les images en exécutant le script :

```bash
node scripts/sync-coaching-mental-thumbnails.js
```

### Ce que fait le script :

1. **Liste les images** dans S3 : `s3://only-you-coaching/Photos/Illustration/coaching mental/`
2. **Récupère les audios** de coaching mental depuis Neon
3. **Mappe les images aux audios** selon l'ordre spécifié :
   - 1. L'importance de se fixer des objectifs
   - 2. Travailler son auto-discipline
   - 3. L'importance de la pensée positive
   - 4. L'importance de l'instant présent
4. **Met à jour** les champs `thumbnail` et `orderIndex` dans Neon

### Correspondance des titres

Le script utilise une correspondance flexible pour trouver les audios :
- Correspondance exacte (normalisée, sans accents)
- Correspondance partielle (mots-clés présents)
- Correspondance inversée (mots-clés similaires)

## 📊 Résultat attendu

Le script affichera :
- Les images trouvées dans S3
- Les audios trouvés dans Neon
- Les mises à jour à effectuer
- Le résultat de chaque mise à jour

Exemple de sortie :
```
🔄 Début de la synchronisation des images de couverture...

📂 Liste des images dans S3: Photos/Illustration/coaching mental/
✅ 4 image(s) trouvée(s) dans S3:
   1. Photos/Illustration/coaching mental/image1.jpg
   2. Photos/Illustration/coaching mental/image2.jpg
   ...

📊 Récupération des audios de coaching mental depuis Neon...
✅ 4 audio(s) de coaching mental trouvé(s):
   1. L'importance de se fixer des objectifs (ID: ...)
   ...

🔗 Mapping des images aux audios selon l'ordre spécifié...

📝 4 mise(s) à jour à effectuer:
1. "L'importance de se fixer des objectifs"
   Image: (aucune) → Photos/Illustration/coaching mental/image1.jpg
   Ordre: (aucun) → 1

✅ Synchronisation terminée!
   4 mise(s) à jour réussie(s)
```

## ✅ Étape 3 : Vérifier sur la page

Une fois la synchronisation terminée, les audios devraient apparaître dans le bon ordre sur :

```
http://localhost:3000/coaching-mental
```

L'ordre d'affichage est maintenant géré par :
- Le champ `orderIndex` dans la base de données
- La fonction `sortCoachingMentalAudios()` dans `lib/coaching-mental-orders.ts`
- L'API `/api/audio` qui applique automatiquement le tri pour la catégorie "Coaching Mental"

## 🔍 Détails techniques

### Structure S3 attendue

Les images doivent être dans :
```
s3://only-you-coaching/Photos/Illustration/coaching mental/
```

### Formats image supportés

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.gif`

### Ordre d'affichage

L'ordre est défini dans `lib/coaching-mental-orders.ts` :
```typescript
export const COACHING_MENTAL_ORDER: Record<number, string> = {
  1: 'L\'importance de se fixer des objectifs',
  2: 'Travailler son auto-discipline',
  3: 'L\'importance de la pensée positive',
  4: 'L\'importance de l\'instant présent',
}
```

### Tri automatique

L'API `/api/audio` applique automatiquement le tri pour la catégorie "Coaching Mental" en utilisant :
1. Le champ `orderIndex` de la base de données (priorité)
2. La correspondance par titre via `getCoachingMentalOrder()`

## 🐛 Dépannage

### Erreur : "AWS credentials not configured"
- Vérifiez que `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` sont définis dans `.env.local`

### Erreur : "Column orderIndex does not exist"
- Exécutez le script `scripts/add-order-index-to-audios.sql` dans Neon

### Erreur : "Audio non trouvé pour: ..."
- Vérifiez que les titres des audios dans Neon correspondent (approximativement) aux titres dans `COACHING_MENTAL_ORDER`
- Le script utilise une correspondance flexible, mais les titres doivent être similaires

### Les images ne s'affichent pas
- Vérifiez que les images sont bien dans S3 dans le bon dossier
- Vérifiez que les permissions S3 permettent la lecture publique (ou que les URLs signées fonctionnent)
- Vérifiez que le champ `thumbnail` contient bien la clé S3 (pas une URL complète)

### L'ordre n'est pas respecté
- Vérifiez que le champ `orderIndex` est bien défini dans Neon pour chaque audio
- Vérifiez que l'API `/api/audio` retourne bien les audios avec `orderIndex`
- Vérifiez les logs du navigateur pour voir l'ordre des audios retournés

## 📝 Notes

- Les images sont stockées comme clés S3 (pas comme URLs complètes) dans le champ `thumbnail`
- L'ordre est stocké dans le champ `orderIndex` (1-based)
- La synchronisation peut être relancée plusieurs fois sans créer de doublons
- Les images non utilisées seront listées à la fin du script
