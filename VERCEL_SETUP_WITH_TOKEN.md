# Configuration Vercel Postgres avec Token

Votre token Vercel a été configuré dans les scripts. Voici comment l'utiliser.

## 🚀 Démarrage Rapide

### Option 1 : Script automatisé (recommandé)

```bash
npm run setup-vercel-postgres
```

Ce script vous guidera à travers toutes les étapes.

### Option 2 : Commandes manuelles

Toutes les commandes sont disponibles via npm scripts :

```bash
# 1. Vérifier la connexion
npm run vercel:whoami

# 2. Lier le projet (si pas déjà fait)
npm run vercel:link

# 3. Créer la base de données
npm run vercel:postgres:create

# 4. Lister les bases de données
npm run vercel:postgres:ls

# 5. Lier la base de données au projet
npm run vercel:postgres:link

# 6. Récupérer les variables d'environnement
npm run vercel:env:pull

# 7. Tester la connexion
npm run test-vercel-postgres
```

## 📋 Étapes Détaillées

### Étape 1 : Vérifier la connexion

```bash
npm run vercel:whoami
```

Vous devriez voir votre email Vercel.

### Étape 2 : Lier le projet (si nécessaire)

```bash
npm run vercel:link
```

Sélectionnez votre projet dans la liste.

### Étape 3 : Créer la base de données

```bash
npm run vercel:postgres:create
```

**Répondez aux questions :**
- Nom : `pilates-app-db` (ou autre)
- Région : `iad1` (US East) ou la plus proche de vos utilisateurs

### Étape 4 : Lier la base de données

```bash
npm run vercel:postgres:link
```

**Sélectionnez :**
- Votre projet
- La base de données que vous venez de créer

### Étape 5 : Récupérer les variables d'environnement

```bash
npm run vercel:env:pull
```

Cela crée/met à jour `.env.local` avec toutes les variables Postgres :
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Étape 6 : Installer les dépendances

```bash
npm install @vercel/postgres
```

### Étape 7 : Tester la connexion

```bash
npm run test-vercel-postgres
```

Vous devriez voir :
```
✅ Connexion réussie!
📅 Heure serveur: ...
🗄️  Version: PostgreSQL ...
```

### Étape 8 : Migrer le schéma

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Storage → Votre base de données → SQL Editor
4. Exécutez vos scripts SQL (ex: `scripts/create-recipes-table.sql`)

### Étape 9 : Migrer les données (optionnel)

Si vous avez des données dans Supabase :

```bash
npm run migrate-to-vercel-postgres
```

### Étape 10 : Mettre à jour le code

Remplacez dans vos routes API :

```typescript
// Avant
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

// Après
import { db } from '@/lib/db-vercel'
// ou
import { sql } from '@vercel/postgres'
```

## 🔐 Sécurité du Token

⚠️ **Important :** Le token est actuellement dans les scripts npm pour faciliter la configuration.

**Pour la production :**
1. Utilisez les variables d'environnement Vercel (automatiques)
2. Ne commitez pas le token dans Git
3. Le token est déjà dans `.gitignore` si vous utilisez `.env.local`

**Pour utiliser le token via variable d'environnement :**

```bash
export VERCEL_TOKEN="[REDACTED_VERCEL_TOKEN]"
vercel postgres create
```

## 📚 Commandes Utiles

```bash
# Voir les bases de données
npm run vercel:postgres:ls

# Inspecter une base de données
vercel postgres inspect --token="[REDACTED_VERCEL_TOKEN]"

# Voir les connexions
vercel postgres connections --token="[REDACTED_VERCEL_TOKEN]"

# Exécuter une requête SQL
vercel postgres execute "SELECT COUNT(*) FROM users" --token="[REDACTED_VERCEL_TOKEN]"
```

## 🆘 Dépannage

### "Token invalide"

Le token peut expirer. Générez-en un nouveau :
1. Allez sur [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Créez un nouveau token
3. Mettez à jour les scripts npm

### "Project not found"

```bash
npm run vercel:link
```

### "Database not found"

```bash
npm run vercel:postgres:create
```

### "Missing POSTGRES_URL"

```bash
npm run vercel:env:pull
```

## ✅ Checklist

- [ ] Connexion vérifiée (`npm run vercel:whoami`)
- [ ] Projet lié (`npm run vercel:link`)
- [ ] Base de données créée (`npm run vercel:postgres:create`)
- [ ] Base de données liée (`npm run vercel:postgres:link`)
- [ ] Variables récupérées (`npm run vercel:env:pull`)
- [ ] `@vercel/postgres` installé
- [ ] Test de connexion réussi (`npm run test-vercel-postgres`)
- [ ] Schéma migré (via dashboard)
- [ ] Données migrées (`npm run migrate-to-vercel-postgres`)
- [ ] Code mis à jour
- [ ] Testé localement (`npm run dev`)

---

**C'est tout ! Votre base de données Vercel Postgres est prête ! 🎉**

