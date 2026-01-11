# 🔧 Fix pour les erreurs de connexion Neon sur Vercel

## Problème identifié

Les erreurs 500 en production sont causées par des timeouts de connexion avec le Pool de Neon dans les environnements serverless de Vercel.

**Erreurs observées :**
- `Connection terminated unexpectedly`
- `timeout exceeded when trying to connect`
- `FUNCTION_INVOCATION_TIMEOUT`

## Solution recommandée

### Option 1 : Utiliser l'URL avec pooler (Recommandé)

Neon fournit deux types d'URLs de connexion :
1. **URL directe** : `postgresql://user:pass@host/db` (ne fonctionne pas bien avec Pool sur Vercel)
2. **URL avec pooler** : `postgresql://user:pass@host/db?pgbouncer=true` (meilleur pour serverless)

**Action à faire :**
1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet
3. Allez dans "Connection Details"
4. Utilisez l'URL avec **"Pooler"** ou **"Session mode"** au lieu de l'URL directe
5. Mettez à jour `DATABASE_URL` dans Vercel avec cette nouvelle URL

### Option 2 : Utiliser le client `neon()` directement

Le client `neon()` est conçu pour les environnements serverless et fonctionne mieux que le Pool sur Vercel.

**Modification nécessaire :**
- Remplacer toutes les utilisations de `pool.query()` par le client `neon()` avec des template literals tagués
- Cela nécessite de réécrire les requêtes SQL

### Option 3 : Vérifier la configuration du Pool

Le Pool actuel est configuré avec `max: 1`, ce qui est correct pour serverless, mais le timeout de connexion est trop court.

**Configuration actuelle :**
```typescript
pool = new Pool({ 
  connectionString: databaseUrl,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000, // Peut-être trop court
  allowExitOnIdle: true,
})
```

## Diagnostic

Pour diagnostiquer le problème :

1. **Vérifier les logs Vercel :**
   ```bash
   vercel logs https://pilates-coaching-app.vercel.app
   ```

2. **Tester la connexion :**
   ```bash
   curl https://pilates-coaching-app.vercel.app/api/debug/db-connection
   ```

3. **Vérifier DATABASE_URL dans Vercel :**
   - Allez sur Vercel Dashboard → Settings → Environment Variables
   - Vérifiez que `DATABASE_URL` est présent et correct

## Prochaines étapes

1. ✅ Code amélioré avec meilleure gestion d'erreurs
2. ⏭️ Vérifier si DATABASE_URL utilise l'URL avec pooler
3. ⏭️ Si le problème persiste, migrer vers le client `neon()` directement











