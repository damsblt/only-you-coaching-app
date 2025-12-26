# 🚀 Guide Final de Migration vers Neon

## ✅ État Actuel

### Terminé
1. ✅ **Base de données Neon créée et configurée**
2. ✅ **7 tables créées** avec tous les index
3. ✅ **3 routes API principales migrées** :
   - `/api/videos` ✅
   - `/api/recipes` ✅
   - `/api/audio` ✅
4. ✅ **Client Neon configuré** (`lib/db.ts`)

## 📋 Prochaines Étapes

### 1. Migrer les Données

Exécutez le script de migration des données :

```bash
npm run migrate-data-neon
```

**OU manuellement :**

```bash
./scripts/migrate-data-neon.sh
```

Ce script va :
- Exporter les données depuis Supabase
- Les importer dans Neon
- Vérifier que tout s'est bien passé

### 2. Tester les Routes Migrées

Démarrez le serveur de développement :

```bash
npm run dev
```

Testez les routes :
- `GET /api/videos` - Devrait retourner les vidéos depuis Neon
- `GET /api/recipes` - Devrait retourner les recettes depuis Neon
- `GET /api/audio` - Devrait retourner les audios depuis Neon

### 3. Migrer les Routes Restantes (Optionnel)

Les routes suivantes utilisent encore Supabase pour la DB (pas l'auth) :
- `app/api/check-supabase/route.ts`
- `app/api/check-access-supabase/route.ts`
- `app/api/create-subscription-manual/route.ts`
- `app/api/sync-stripe-subscription/route.ts`
- Et autres routes qui utilisent `supabaseAdmin.from()`

**Pour migrer une route :**

1. Remplacer :
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient(supabaseUrl, serviceKey)
   ```

2. Par :
   ```typescript
   import { db } from '@/lib/db'
   ```

3. Remplacer :
   ```typescript
   const { data, error } = await supabase.from('table').select('*')
   ```

4. Par :
   ```typescript
   const { data, error } = await db.from('table').select('*').execute()
   ```

**Important :** N'oubliez pas `.execute()` à la fin !

## 🔐 Authentification

**Les routes d'authentification gardent Supabase Auth :**
- `app/api/auth/signin/route.ts`
- `app/api/auth/signup/route.ts`
- `app/api/sync-user/route.ts`

Ces routes continuent d'utiliser Supabase pour l'authentification, mais peuvent utiliser Neon pour les opérations de base de données.

## 📊 Vérification

### Vérifier les Tables dans Neon

```bash
npm run test-neon
```

### Vérifier les Données Migrées

Connectez-vous à Neon SQL Editor et exécutez :

```sql
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'videos_new', COUNT(*) FROM videos_new
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'audios', COUNT(*) FROM audios
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions;
```

## 🐛 Dépannage

### Erreur : "This function can now be called only as a tagged-template function"

Cette erreur signifie que le code utilise l'ancienne API Neon. Vérifiez que vous utilisez :
- `sql.query(query, params)` au lieu de `sql(query, params)`
- `.execute()` à la fin des requêtes avec le QueryBuilder

### Erreur : "Table does not exist"

Vérifiez que les tables sont créées :
```bash
./scripts/create-tables-neon-psql.sh
```

### Erreur : "Connection failed"

Vérifiez les variables d'environnement :
- `DATABASE_URL` ou `STORAGE_DATABASE_URL` doit pointer vers Neon
- Le format doit être : `postgresql://user:pass@host/db?sslmode=require`

## 📝 Variables d'Environnement

Assurez-vous d'avoir dans `.env.local` :

```env
# Neon Database
DATABASE_URL="postgresql://..."
# OU
STORAGE_DATABASE_URL="postgresql://..."

# Supabase (pour l'auth uniquement)
NEXT_PUBLIC_SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

## ✨ Résultat Final

Une fois la migration terminée, vous aurez :
- ✅ Base de données Neon (pas de pause automatique)
- ✅ Routes principales migrées
- ✅ Authentification Supabase toujours fonctionnelle
- ✅ Meilleures performances
- ✅ Compatibilité Vercel

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console
2. Testez la connexion : `npm run test-neon`
3. Vérifiez que les tables existent dans Neon SQL Editor
4. Vérifiez les variables d'environnement

---

**🎉 Félicitations ! Votre migration vers Neon est presque terminée !**

