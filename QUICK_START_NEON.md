# 🚀 Démarrage Rapide Neon - 5 Minutes

Vous avez créé un compte Neon ! Suivez ces étapes pour configurer votre projet.

## 📋 Checklist Rapide

- [ ] 1. Récupérer la Connection String Neon
- [ ] 2. Configurer DATABASE_URL dans .env.local
- [ ] 3. Installer les dépendances
- [ ] 4. Tester la connexion
- [ ] 5. Migrer le schéma SQL
- [ ] 6. Migrer les données (optionnel)
- [ ] 7. Mettre à jour le code

---

## 🎯 Étapes Détaillées

### 1. Récupérer la Connection String

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Connectez-vous
3. Sélectionnez votre projet
4. Cliquez sur **"Connection Details"** ou **"Dashboard"**
5. Copiez la **Connection String** (format : `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`)

### 2. Configurer .env.local

Ouvrez `.env.local` et ajoutez :

```bash
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Remplacez** par votre vraie connection string.

### 3. Installer les Dépendances

```bash
npm install @neondatabase/serverless
```

(ws est déjà installé via Supabase)

### 4. Tester la Connexion

```bash
npm run test-neon
```

Vous devriez voir :
```
✅ Connexion réussie!
📅 Heure serveur: ...
🗄️  Version: PostgreSQL ...
```

### 5. Migrer le Schéma

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"**
4. Exécutez vos scripts SQL dans l'ordre :
   - `scripts/create-recipes-table.sql`
   - `supabase-rls-final.sql` (sans les politiques RLS)
   - Autres scripts de création de tables

### 6. Migrer les Données (si vous avez des données dans Supabase)

```bash
npm run migrate-to-neon
```

### 7. Mettre à Jour le Code

Dans vos routes API, remplacez :

```typescript
// Avant
import { supabaseAdmin } from '@/lib/supabase'
const { data } = await supabaseAdmin.from('videos').select('*')

// Après
import { db } from '@/lib/db'
const { data } = await db.from('videos').select('*').execute()
```

**Important :** N'oubliez pas `.execute()` à la fin !

---

## 🧪 Test Rapide

Après configuration, testez :

```bash
# Tester la connexion
npm run test-neon

# Démarrer le serveur
npm run dev
```

---

## 📚 Documentation

- Guide complet : `NEON_SETUP_GUIDE.md`
- Guide de migration : `NEON_MIGRATION_GUIDE.md`
- Exemples de code : `MIGRATION_EXEMPLE.md`

---

## 🆘 Besoin d'Aide ?

Si vous avez des erreurs :
1. Vérifiez que `DATABASE_URL` est correct dans `.env.local`
2. Vérifiez que le projet Neon est actif
3. Vérifiez que `sslmode=require` est dans l'URL
4. Exécutez `npm run test-neon` pour diagnostiquer

---

**C'est tout ! Votre base de données Neon est prête ! 🎉**

