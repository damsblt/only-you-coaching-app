# Exemple de Migration d'une Route API

Ce document montre comment migrer une route API de Supabase vers Neon.

## Exemple : Route `/api/videos`

### Avant (avec Supabase)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })

  const { data, error } = await supabase
    .from('videos_new')
    .select('*')
    .eq('isPublished', true)
    .order('title', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### Après (avec Neon)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { data, error } = await db
    .from('videos_new')
    .select('*')
    .eq('isPublished', true)
    .order('title', { ascending: true })
    .execute() // ⚠️ Important : ajouter .execute() à la fin

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

## Différences principales

1. **Import** : `createClient` → `db` depuis `@/lib/db`
2. **Initialisation** : Plus besoin de créer un client, `db` est déjà initialisé
3. **Execute()** : Ajouter `.execute()` à la fin de chaque chaîne de requêtes
4. **Variables d'environnement** : Utiliser `DATABASE_URL` au lieu de `NEXT_PUBLIC_SUPABASE_URL`

## Requêtes complexes

### Filtres multiples

```typescript
// Supabase
const { data } = await supabase
  .from('videos')
  .select('*')
  .eq('isPublished', true)
  .eq('difficulty', 'beginner')
  .order('title')

// Neon (même syntaxe)
const { data } = await db
  .from('videos')
  .select('*')
  .eq('isPublished', true)
  .eq('difficulty', 'beginner')
  .order('title')
  .execute()
```

### Recherche avec OR

```typescript
// Supabase
const { data } = await supabase
  .from('videos')
  .select('*')
  .or('title.ilike.%pilates%,description.ilike.%pilates%')

// Neon (même syntaxe)
const { data } = await db
  .from('videos')
  .select('*')
  .or('title.ilike.%pilates%,description.ilike.%pilates%')
  .execute()
```

### Pagination

```typescript
// Supabase
const { data } = await supabase
  .from('videos')
  .select('*')
  .range(0, 9) // 10 premiers résultats

// Neon (même syntaxe)
const { data } = await db
  .from('videos')
  .select('*')
  .range(0, 9)
  .execute()
```

### Single() pour un seul résultat

```typescript
// Supabase
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single()

// Neon (même syntaxe)
const { data, error } = await db
  .from('users')
  .select('*')
  .eq('email', email)
  .single()
```

## Insertion

```typescript
// Supabase
const { data, error } = await supabase
  .from('users')
  .insert({ email, name })
  .select()

// Neon - Option 1 : Utiliser le helper
import { insert } from '@/lib/db'
const { data, error } = await insert('users', { email, name })

// Neon - Option 2 : Requête SQL directe
import { neonSql } from '@/lib/db'
const result = await neonSql(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
  [email, name]
)
```

## Mise à jour

```typescript
// Supabase
const { data, error } = await supabase
  .from('users')
  .update({ name: 'New Name' })
  .eq('id', userId)
  .select()

// Neon - Option 1 : Utiliser le helper
import { update } from '@/lib/db'
const { data, error } = await update('users', { name: 'New Name' }, { id: userId })

// Neon - Option 2 : Requête SQL directe
import { neonSql } from '@/lib/db'
const result = await neonSql(
  'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
  ['New Name', userId]
)
```

## Suppression

```typescript
// Supabase
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId)

// Neon - Option 1 : Utiliser le helper
import { remove } from '@/lib/db'
const { data, error } = await remove('users', { id: userId })

// Neon - Option 2 : Requête SQL directe
import { neonSql } from '@/lib/db'
await neonSql('DELETE FROM users WHERE id = $1', [userId])
```

## Checklist de migration

- [ ] Installer les dépendances (`@neondatabase/serverless`, `ws`)
- [ ] Configurer `DATABASE_URL` dans `.env.local`
- [ ] Migrer le schéma de base de données vers Neon
- [ ] Migrer les données avec `npm run migrate-to-neon`
- [ ] Remplacer les imports dans les routes API
- [ ] Ajouter `.execute()` à toutes les requêtes
- [ ] Tester toutes les routes API
- [ ] Mettre à jour l'authentification (optionnel)



