# 🚀 Guide de Configuration Neon PostgreSQL

Vous avez créé un compte Neon ! Voici comment configurer votre projet.

## 📋 Étapes de Configuration

### 1. Obtenir les Credentials Neon

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet (ou créez-en un si nécessaire)
4. Allez dans **"Connection Details"** ou **"Dashboard"**
5. Copiez la **Connection String** qui ressemble à :
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 2. Configurer les Variables d'Environnement

Ajoutez dans votre `.env.local` :

```bash
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Important :** Remplacez la connection string par celle de votre projet Neon.

### 3. Installer les Dépendances

```bash
npm install @neondatabase/serverless ws
npm install --save-dev @types/ws
```

### 4. Tester la Connexion

Créer un script de test :

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT NOW() as now, version() as version\`.then(result => {
  console.log('✅ Connexion réussie!');
  console.log('Heure serveur:', result[0].now);
  console.log('Version:', result[0].version);
}).catch(err => {
  console.error('❌ Erreur:', err.message);
});
"
```

Ou utilisez le script de test :

```bash
# Créer scripts/test-neon.js
node scripts/test-neon.js
```

### 5. Migrer le Schéma

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"**
4. Exécutez vos scripts SQL dans l'ordre :
   - `scripts/create-recipes-table.sql`
   - `supabase-rls-final.sql` (sans les politiques RLS si vous n'en avez pas besoin)
   - Tous les autres scripts de création de tables

### 6. Migrer les Données (si vous avez des données dans Supabase)

```bash
npm run migrate-to-neon
```

### 7. Mettre à Jour le Code

Remplacez dans vos routes API :

```typescript
// Avant
import { supabaseAdmin } from '@/lib/supabase'

// Après
import { db as supabaseAdmin } from '@/lib/db'
```

N'oubliez pas d'ajouter `.execute()` à la fin des requêtes :

```typescript
// Avant
const { data } = await supabaseAdmin.from('videos').select('*')

// Après
const { data } = await db.from('videos').select('*').execute()
```

### 8. Tester Localement

```bash
npm run dev
```

---

## 🔧 Configuration Avancée

### Variables d'Environnement Complètes

```bash
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require

# Optionnel : Pour compatibilité avec le code existant
NEXT_PUBLIC_SUPABASE_URL=https://your-old-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-old-key
```

### Utilisation dans le Code

Le fichier `lib/db.ts` est déjà créé et prêt à l'emploi :

```typescript
import { db, sql } from '@/lib/db'

// Méthode 1 : Utiliser le wrapper compatible Supabase
const { data, error } = await db
  .from('videos_new')
  .select('*')
  .eq('isPublished', true)
  .execute()

// Méthode 2 : Utiliser SQL direct (recommandé)
const result = await sql`SELECT * FROM videos_new WHERE "isPublished" = true`
```

---

## 📊 Avantages de Neon

- ✅ **512 MB gratuit** (vs 256 MB pour Vercel Postgres)
- ✅ **Pas de pause automatique** (contrairement à Supabase)
- ✅ **Multi-cloud** - Fonctionne partout
- ✅ **Branching** - Base de données par branche Git
- ✅ **Performance** - Serverless avec scaling automatique

---

## 🆘 Dépannage

### Erreur : "Missing DATABASE_URL"

Vérifiez que la variable est bien dans `.env.local` :
```bash
cat .env.local | grep DATABASE_URL
```

### Erreur : "Connection refused"

1. Vérifiez que la connection string est correcte
2. Vérifiez que le projet Neon est actif
3. Vérifiez que `sslmode=require` est dans l'URL

### Erreur : "Table does not exist"

Exécutez vos scripts SQL dans le SQL Editor de Neon.

---

## ✅ Checklist

- [ ] Compte Neon créé
- [ ] Connection string récupérée
- [ ] `DATABASE_URL` configuré dans `.env.local`
- [ ] Dépendances installées (`@neondatabase/serverless`, `ws`)
- [ ] Test de connexion réussi
- [ ] Schéma migré (scripts SQL exécutés)
- [ ] Données migrées (si nécessaire)
- [ ] Code mis à jour (utiliser `lib/db.ts`)
- [ ] Testé localement

---

## 📚 Ressources

- [Documentation Neon](https://neon.tech/docs)
- [Neon Console](https://console.neon.tech)
- [Guide de Migration](NEON_MIGRATION_GUIDE.md)

---

**Besoin d'aide ?** Partagez votre connection string (sans le mot de passe) et je peux vous aider à configurer !

