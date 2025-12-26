# 🚀 Guide de Démarrage Rapide - Vercel Postgres

## Installation en 5 minutes

### 1. Installer Vercel CLI (si pas déjà fait)

```bash
npm i -g vercel
```

### 2. Se connecter à Vercel

```bash
vercel login
```

### 3. Lier votre projet (si pas déjà fait)

```bash
cd /path/to/your/project
vercel link
```

### 4. Créer la base de données Postgres

```bash
vercel postgres create
```

**Répondez aux questions :**
- Nom de la base : `pilates-app-db` (ou autre)
- Région : Choisissez la plus proche (ex: `iad1` pour US East)

### 5. Lier la base de données au projet

```bash
vercel postgres link
```

**Sélectionnez :**
- Votre projet
- La base de données que vous venez de créer

### 6. Récupérer les variables d'environnement

```bash
vercel env pull .env.local
```

Cela crée automatiquement toutes les variables Postgres dans `.env.local` :
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 7. Installer les dépendances

```bash
npm install @vercel/postgres
```

### 8. Tester la connexion

```bash
npm run test-vercel-postgres
```

Vous devriez voir :
```
✅ Connexion réussie!
📅 Heure serveur: ...
🗄️  Version: PostgreSQL ...
```

### 9. Migrer le schéma

Exécutez vos scripts SQL dans Vercel Dashboard :
1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Storage → Votre base de données → SQL Editor
4. Collez et exécutez vos scripts SQL (ex: `scripts/create-recipes-table.sql`)

### 10. Migrer les données (optionnel)

Si vous avez des données dans Supabase :

```bash
npm run migrate-to-vercel-postgres
```

### 11. Mettre à jour votre code

Remplacez dans vos routes API :

```typescript
// Avant
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
const { data } = await supabase.from('videos').select('*')

// Après
import { db } from '@/lib/db-vercel'
const { data } = await db.from('videos').select('*').execute()
```

### 12. Tester localement

```bash
npm run dev
```

### 13. Déployer

```bash
git push origin main
# Ou
vercel --prod
```

Les variables d'environnement Postgres sont automatiquement disponibles dans Vercel ! 🎉

---

## Commandes utiles

```bash
# Voir les bases de données
vercel postgres ls

# Inspecter une base de données
vercel postgres inspect

# Voir les connexions
vercel postgres connections

# Exécuter une requête SQL
vercel postgres execute "SELECT COUNT(*) FROM users"

# Ouvrir le dashboard
vercel dashboard
```

---

## Exemples d'utilisation

### Dans une route API

```typescript
// app/api/videos/route.ts
import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await sql`SELECT * FROM videos_new WHERE "isPublished" = true`
  return NextResponse.json(result.rows)
}
```

### Avec le wrapper compatible Supabase

```typescript
// app/api/videos/route.ts
import { db } from '@/lib/db-vercel'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await db
    .from('videos_new')
    .select('*')
    .eq('isPublished', true)
    .execute()
  
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

---

## 🆘 Dépannage

### "Missing POSTGRES_URL"

```bash
vercel env pull .env.local
```

### "Connection refused"

```bash
# Vérifier que la base est liée
vercel postgres link

# Vérifier les connexions
vercel postgres connections
```

### "Table does not exist"

Exécutez vos scripts SQL dans Vercel Dashboard → Storage → SQL Editor

---

## 📚 Documentation complète

Voir `VERCEL_POSTGRES_MIGRATION.md` pour plus de détails.

---

## ✅ Checklist

- [ ] Vercel CLI installé
- [ ] Connecté à Vercel (`vercel login`)
- [ ] Projet lié (`vercel link`)
- [ ] Base de données créée (`vercel postgres create`)
- [ ] Base de données liée (`vercel postgres link`)
- [ ] Variables récupérées (`vercel env pull`)
- [ ] `@vercel/postgres` installé
- [ ] Test de connexion réussi
- [ ] Schéma migré
- [ ] Code mis à jour
- [ ] Testé localement
- [ ] Déployé en production

---

**C'est tout ! Votre base de données Vercel Postgres est prête ! 🎉**

