# Guide de Migration de Supabase vers Neon

## Pourquoi Neon ?

Neon est une base de données PostgreSQL serverless qui offre :
- ✅ **Plan gratuit généreux** : 0.5 GB de stockage, pas de pause automatique
- ✅ **Compatible PostgreSQL** : Utilise le même protocole que Supabase
- ✅ **Migration facile** : Compatible avec le client Supabase existant
- ✅ **Performance** : Serverless avec scaling automatique
- ✅ **Pas de limitation de pause** : Contrairement au plan gratuit de Supabase

## Étapes de Migration

### 1. Créer un compte Neon

1. Allez sur [https://neon.tech](https://neon.tech)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Notez les informations de connexion :
   - **Connection String** (format: `postgresql://user:password@host/database`)
   - **Host**
   - **Database**
   - **User**
   - **Password**

### 2. Installer les dépendances

```bash
npm install @neondatabase/serverless ws
npm install --save-dev @types/ws
```

**Note** : `ws` est nécessaire pour les environnements serverless (Vercel, etc.)

### 3. Configurer les variables d'environnement

Ajoutez dans votre `.env.local` :

```env
# Neon Database
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Optionnel : Pour compatibilité avec le code existant
NEXT_PUBLIC_SUPABASE_URL=https://your-old-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-old-key
```

**Note** : On garde temporairement les variables Supabase pour la migration des données.

### 4. Migrer le schéma de base de données

1. Connectez-vous à votre projet Neon
2. Allez dans l'onglet "SQL Editor"
3. Exécutez les scripts SQL suivants dans l'ordre :
   - `scripts/create-recipes-table.sql`
   - `supabase-rls-final.sql` (sans les politiques RLS si vous n'en avez pas besoin)
   - Tous les autres scripts SQL de création de tables

### 5. Migrer les données

Utilisez le script de migration fourni :

```bash
npm run migrate-to-neon
```

### 6. Mettre à jour le code

Le fichier `lib/db.ts` a été créé pour remplacer `lib/supabase.ts`. Il utilise Neon avec une API compatible.

**Option 1 : Migration progressive (recommandé)**

Vous pouvez migrer progressivement en remplaçant les imports :

```typescript
// Avant
import { supabaseAdmin } from '@/lib/supabase'

// Après
import { db as supabaseAdmin } from '@/lib/db'
```

**Option 2 : Migration complète**

Remplacez tous les usages de `supabaseAdmin` par `db` dans vos routes API.

**Exemple de migration d'une route API :**

```typescript
// Avant (app/api/videos/route.ts)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(supabaseUrl, serviceRoleKey)
const { data, error } = await supabase.from('videos_new').select('*')

// Après
import { db } from '@/lib/db'
const { data, error } = await db.from('videos_new').select('*').execute()
```

**Note importante** : La méthode `.execute()` doit être appelée à la fin de la chaîne de requêtes.

### 7. Tester la migration

1. Vérifiez que toutes les routes API fonctionnent
2. Testez l'authentification
3. Vérifiez que les données sont correctement chargées

### 8. Mettre à jour l'authentification (Optionnel)

Si vous souhaitez migrer complètement de Supabase Auth vers NextAuth.js :

1. Configurez NextAuth.js (déjà dans package.json)
2. Créez un fichier `app/api/auth/[...nextauth]/route.ts`
3. Mettez à jour les composants d'authentification

## Structure des fichiers

- `lib/db.ts` - Client de base de données Neon (remplace `lib/supabase.ts`)
- `scripts/migrate-to-neon.js` - Script de migration des données
- `NEON_MIGRATION_GUIDE.md` - Ce guide

## Avantages de Neon

1. **Pas de pause automatique** : Contrairement à Supabase, Neon ne met pas en pause votre base de données
2. **Plan gratuit généreux** : 0.5 GB de stockage (vs 500 MB pour Supabase)
3. **Performance** : Serverless avec scaling automatique
4. **Compatibilité** : Utilise PostgreSQL standard, compatible avec tous vos outils

## Support

- Documentation Neon : https://neon.tech/docs
- Discord Neon : https://discord.gg/neondatabase

