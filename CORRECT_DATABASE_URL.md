# ✅ URL de Connexion Correcte pour Vercel

## ❌ INCORRECT (ne pas utiliser)
```
psql 'postgresql://neondb_owner:npg_w3FSnLB4WgNe@ep-solitary-band-ab6ch71l-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

## ✅ CORRECT (à utiliser dans Vercel)
```
postgresql://neondb_owner:npg_w3FSnLB4WgNe@ep-solitary-band-ab6ch71l-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 📝 Instructions pour Vercel

1. **Allez sur Vercel Dashboard** : https://vercel.com/dashboard
2. **Sélectionnez votre projet** : pilates-coaching-app
3. **Settings** → **Environment Variables**
4. **Trouvez ou créez** la variable `DATABASE_URL`
5. **Collez cette valeur** (sans `psql` et sans guillemets) :
   ```
   postgresql://neondb_owner:npg_w3FSnLB4WgNe@ep-solitary-band-ab6ch71l-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
6. **Sauvegardez** et **redéployez** l'application

## 🔍 Vérification

Après avoir mis à jour la variable, testez :
```bash
curl https://pilates-coaching-app.vercel.app/api/debug/db-connection
```

Vous devriez voir `"status": "healthy"` si tout fonctionne correctement.










