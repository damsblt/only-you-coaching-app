# 🔧 Configuration des Variables d'Environnement Vercel

## Variables Requises

Pour que l'application fonctionne avec Neon en production sur Vercel, vous devez configurer **une seule variable d'environnement** :

### `DATABASE_URL` (Obligatoire)

**Description :** URL de connexion complète à votre base de données Neon PostgreSQL

**Format :**
```
postgresql://user:password@host.neon.tech/database?sslmode=require
```

**Comment l'obtenir :**
1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet
4. Allez dans **"Connection Details"** ou cliquez sur **"Connect"**
5. Sélectionnez :
   - **Branch** : `main` (ou la branche que vous utilisez)
   - **Role** : `neondb_owner` (ou votre rôle)
   - **Database** : `neondb` (ou votre base de données)
6. Copiez la **Connection String** complète
7. Assurez-vous qu'elle contient `?sslmode=require` à la fin

**Exemple :**
```
postgresql://neondb_owner:npg_xxxxx@ep-solitary-band-ab6ch71l.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

## Configuration dans Vercel

### Via le Dashboard Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet : **pilates-coaching-app**
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add New**
5. Remplissez :
   - **Key** : `DATABASE_URL`
   - **Value** : Collez votre connection string Neon
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

### Via Vercel CLI

```bash
vercel env add DATABASE_URL production
# Collez votre connection string quand demandé
```

Ou utilisez le script existant :
```bash
./scripts/add-vercel-env.sh
```

## Vérification

Après avoir configuré la variable :

1. **Redéployez l'application :**
   ```bash
   vercel --prod
   ```

2. **Testez la connexion :**
   ```bash
   curl https://pilates-coaching-app.vercel.app/api/debug/db-connection
   ```

3. **Vérifiez les logs :**
   ```bash
   vercel logs https://pilates-coaching-app.vercel.app
   ```

## Notes Importantes

- ✅ **Une seule variable nécessaire** : `DATABASE_URL`
- ✅ Le client `neon()` gère automatiquement les connexions serverless
- ✅ Pas besoin de variables supplémentaires (PGHOST, PGUSER, etc.)
- ⚠️ Assurez-vous que l'URL contient `?sslmode=require` pour la sécurité
- ⚠️ Ne partagez jamais votre `DATABASE_URL` publiquement

## Dépannage

Si vous rencontrez des erreurs de connexion :

1. Vérifiez que `DATABASE_URL` est bien configuré dans Vercel
2. Vérifiez que l'URL est complète et contient `?sslmode=require`
3. Vérifiez que votre projet Neon est actif (pas en pause)
4. Consultez les logs Vercel pour plus de détails










