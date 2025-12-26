# Migration vers Vercel Postgres avec Vercel CLI

## 🎯 Pourquoi Vercel Postgres ?

- ✅ **Intégration native** avec Vercel
- ✅ **Configuration en 1 commande** avec Vercel CLI
- ✅ **Pas de pause automatique** (contrairement à Supabase)
- ✅ **Branching** - Base de données par branche Git
- ✅ **Edge-ready** - Optimisé pour Next.js
- ✅ **Variables d'environnement automatiques**

---

## 📋 Prérequis

1. **Vercel CLI installé** :
   ```bash
   npm i -g vercel
   ```

2. **Connecté à Vercel** :
   ```bash
   vercel login
   ```

3. **Projet lié à Vercel** :
   ```bash
   vercel link
   ```

---

## 🚀 Installation en 3 étapes

### Étape 1 : Créer la base de données avec Vercel CLI

```bash
# Créer une base de données Postgres
vercel postgres create

# Suivez les instructions :
# - Nom de la base : pilates-app-db (ou autre)
# - Région : Choisissez la plus proche (ex: iad1 pour US East)
```

**Alternative : Via le dashboard Vercel**
```bash
# Ouvrir le dashboard
vercel dashboard
# Puis : Storage → Create Database → Postgres
```

### Étape 2 : Lier la base de données au projet

```bash
# Lier la base de données à votre projet
vercel postgres link

# Sélectionnez votre projet et la base de données créée
```

**Cela crée automatiquement :**
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Étape 3 : Récupérer les variables d'environnement localement

```bash
# Récupérer toutes les variables d'environnement
vercel env pull .env.local

# Ou récupérer uniquement les variables Postgres
vercel env pull .env.local --environment=development
```

---

## 📦 Installation des dépendances

```bash
# Installer le client Vercel Postgres
npm install @vercel/postgres

# Optionnel : Pour les requêtes SQL directes
npm install @vercel/postgres sql
```

---

## 🔧 Configuration du code

### Option 1 : Utiliser @vercel/postgres (Recommandé)

Créer `lib/db-vercel.ts` :

```typescript
import { sql } from '@vercel/postgres'

// Export pour compatibilité avec le code existant
export const db = {
  async query(queryText: string, params?: any[]) {
    try {
      const result = await sql.query(queryText, params)
      return { data: result.rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Helper pour les requêtes SELECT
export async function select(table: string, where?: Record<string, any>) {
  let query = `SELECT * FROM ${table}`
  const params: any[] = []
  
  if (where && Object.keys(where).length > 0) {
    const conditions = Object.keys(where).map((key, i) => {
      params.push(where[key])
      return `${key} = $${i + 1}`
    })
    query += ` WHERE ${conditions.join(' AND ')}`
  }
  
  const result = await sql.query(query, params)
  return result.rows
}

// Helper pour INSERT
export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  
  const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`
  const result = await sql.query(query, values)
  return result.rows[0]
}

// Helper pour UPDATE
export async function update(table: string, data: Record<string, any>, where: Record<string, any>) {
  const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ')
  const whereClause = Object.keys(where).map((key, i) => `${key} = $${Object.keys(data).length + i + 1}`).join(' AND ')
  const values = [...Object.values(data), ...Object.values(where)]
  
  const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`
  const result = await sql.query(query, values)
  return result.rows[0]
}

// Helper pour DELETE
export async function remove(table: string, where: Record<string, any>) {
  const whereClause = Object.keys(where).map((key, i) => `${key} = $${i + 1}`).join(' AND ')
  const values = Object.values(where)
  
  const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`
  const result = await sql.query(query, values)
  return result.rows
}

// Export sql pour requêtes directes
export { sql }
```

### Option 2 : Wrapper compatible Supabase

Créer `lib/db-vercel-compat.ts` avec une API similaire à Supabase (voir le fichier créé).

---

## 📝 Migration du schéma

### Méthode 1 : Via Vercel CLI

```bash
# Exécuter un script SQL
vercel postgres execute < script.sql

# Ou via psql
psql $POSTGRES_URL < scripts/create-recipes-table.sql
```

### Méthode 2 : Via le dashboard Vercel

1. Allez sur votre projet Vercel
2. Storage → Votre base de données → SQL Editor
3. Collez et exécutez vos scripts SQL

### Scripts SQL à exécuter (dans l'ordre) :

1. `scripts/create-recipes-table.sql`
2. `supabase-rls-final.sql` (sans les politiques RLS si vous n'en avez pas besoin)
3. Tous les autres scripts de création de tables

---

## 🔄 Migration des données

Créer `scripts/migrate-to-vercel-postgres.js` :

```javascript
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { sql } = require('@vercel/postgres')

// ... (voir le script complet ci-dessous)
```

---

## 🧪 Tester la connexion

Créer `scripts/test-vercel-postgres.js` :

```javascript
const { sql } = require('@vercel/postgres')

async function test() {
  try {
    const result = await sql`SELECT NOW() as now, version() as version`
    console.log('✅ Connexion réussie!')
    console.log('Heure serveur:', result.rows[0].now)
    console.log('Version PostgreSQL:', result.rows[0].version)
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
  }
}

test()
```

Exécuter :
```bash
node scripts/test-vercel-postgres.js
```

---

## 📚 Exemples d'utilisation

### Dans une route API

```typescript
// app/api/videos/route.ts
import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    
    const result = await sql`
      SELECT * FROM videos_new 
      WHERE "isPublished" = true 
      ORDER BY title 
      LIMIT ${limit}
    `
    
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
```

### Avec paramètres

```typescript
const { searchParams } = new URL(request.url)
const email = searchParams.get('email')

const result = await sql`
  SELECT * FROM users 
  WHERE email = ${email}
`
```

### Insertion

```typescript
const { title, description } = await request.json()

const result = await sql`
  INSERT INTO videos_new (title, description, "isPublished")
  VALUES (${title}, ${description}, true)
  RETURNING *
`

return NextResponse.json(result.rows[0])
```

---

## 🔐 Sécurité

Vercel Postgres utilise automatiquement :
- ✅ **Connection pooling** - Géré automatiquement
- ✅ **SSL/TLS** - Connexions sécurisées
- ✅ **Variables d'environnement** - Sécurisées dans Vercel

**Note :** Les variables d'environnement sont automatiquement disponibles dans :
- Vercel (production, preview, development)
- Local (après `vercel env pull`)

---

## 🚀 Déploiement

Une fois configuré, le déploiement est automatique :

```bash
# Push vers GitHub = déploiement automatique
git push origin main

# Ou déployer manuellement
vercel --prod
```

Les variables d'environnement Postgres sont automatiquement disponibles dans tous les environnements Vercel.

---

## 📊 Monitoring

```bash
# Voir les statistiques de la base de données
vercel postgres inspect

# Voir les connexions actives
vercel postgres connections
```

---

## 🔄 Migration depuis Supabase

1. **Créer la base Vercel Postgres** (voir étape 1)
2. **Migrer le schéma** (voir section Migration du schéma)
3. **Migrer les données** :
   ```bash
   node scripts/migrate-to-vercel-postgres.js
   ```
4. **Mettre à jour le code** :
   - Remplacer `@supabase/supabase-js` par `@vercel/postgres`
   - Adapter les requêtes (voir exemples)
5. **Tester** :
   ```bash
   npm run dev
   ```
6. **Déployer** :
   ```bash
   vercel --prod
   ```

---

## 🆘 Dépannage

### Erreur : "Missing POSTGRES_URL"

```bash
# Récupérer les variables d'environnement
vercel env pull .env.local

# Vérifier qu'elles sont bien présentes
cat .env.local | grep POSTGRES
```

### Erreur : "Connection refused"

```bash
# Vérifier que la base de données est bien liée
vercel postgres link

# Vérifier les connexions
vercel postgres connections
```

### Erreur : "Table does not exist"

```bash
# Vérifier que le schéma a été migré
vercel postgres execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
```

---

## 📚 Ressources

- [Documentation Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [@vercel/postgres npm](https://www.npmjs.com/package/@vercel/postgres)

---

## ✅ Checklist de migration

- [ ] Vercel CLI installé et connecté
- [ ] Base de données créée avec `vercel postgres create`
- [ ] Base de données liée avec `vercel postgres link`
- [ ] Variables d'environnement récupérées avec `vercel env pull`
- [ ] `@vercel/postgres` installé
- [ ] Schéma migré (scripts SQL exécutés)
- [ ] Données migrées (script de migration)
- [ ] Code mis à jour (remplacer Supabase par Vercel Postgres)
- [ ] Tests locaux réussis
- [ ] Déploiement en production

---

## 🎉 Avantages de Vercel Postgres

1. **Simplicité** - Configuration en 1 commande
2. **Intégration** - Variables d'environnement automatiques
3. **Performance** - Optimisé pour Vercel Edge Functions
4. **Fiabilité** - Pas de pause automatique
5. **Branching** - Base de données par branche Git
6. **Support** - Même équipe que Next.js

