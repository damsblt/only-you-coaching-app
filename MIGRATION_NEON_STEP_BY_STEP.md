# 🚀 Migration vers Neon - Guide Étape par Étape

## ✅ Étape 1 : Configuration (DÉJÀ FAIT)

- [x] Compte Neon créé
- [x] Base de données créée
- [x] Variables d'environnement configurées
- [x] Test de connexion réussi

## 📋 Étape 2 : Créer les Tables

### Option A : Via Neon SQL Editor (RECOMMANDÉ)

1. **Ouvrir Neon SQL Editor** :
   - Allez sur [console.neon.tech](https://console.neon.tech)
   - Sélectionnez votre projet
   - Cliquez sur **"SQL Editor"**

   **OU via Vercel Dashboard** :
   - Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sélectionnez votre projet `only-you-coaching`
   - Onglet **"Storage"**
   - Cliquez sur votre base de données Neon
   - Cliquez sur **"Open in Neon Console"**
   - Allez dans **"SQL Editor"**

2. **Copier le contenu du fichier SQL** :
   ```bash
   cat scripts/create-all-tables-neon.sql
   ```

3. **Coller dans le SQL Editor** et cliquer sur **"Run"**

### Option B : Via Script (Alternative)

Le fichier SQL est prêt : `scripts/create-all-tables-neon.sql`

Copiez son contenu dans Neon SQL Editor.

## 📊 Étape 3 : Vérifier les Tables

Après avoir exécuté le SQL, vérifiez que les tables sont créées :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Vous devriez voir :
- `users`
- `videos_new`
- `subscriptions`
- `recipes`
- `audios`
- `programs`
- `program_regions`

## 🔄 Étape 4 : Migrer les Données (si vous avez des données dans Supabase)

```bash
npm run migrate-to-neon
```

**Note :** Ce script nécessite que les variables Supabase soient encore dans `.env.local`.

## 🔧 Étape 5 : Mettre à Jour le Code

Remplacez dans vos routes API :

```typescript
// Avant
import { supabaseAdmin } from '@/lib/supabase'
const { data } = await supabaseAdmin.from('videos_new').select('*')

// Après
import { db } from '@/lib/db'
const { data } = await db.from('videos_new').select('*').execute()
```

**Important :** N'oubliez pas `.execute()` à la fin !

## 🧪 Étape 6 : Tester

```bash
npm run dev
```

---

## 📝 Fichiers Créés

- ✅ `scripts/create-all-tables-neon.sql` - Schéma complet
- ✅ `scripts/migrate-schema-to-neon.js` - Script de migration (alternative)
- ✅ `scripts/migrate-to-neon.js` - Migration des données
- ✅ `lib/db.ts` - Client Neon

---

## 🆘 Besoin d'Aide ?

Si vous avez des erreurs :
1. Vérifiez que `DATABASE_URL` est correct dans `.env.local`
2. Vérifiez que le projet Neon est actif
3. Exécutez `npm run test-neon` pour diagnostiquer

---

**Prochaine étape : Ouvrir Neon SQL Editor et exécuter le fichier SQL !**

