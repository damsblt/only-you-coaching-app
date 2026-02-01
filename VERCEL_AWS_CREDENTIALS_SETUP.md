# Configuration des Credentials AWS dans Vercel

## 🎯 Problème
La galerie ne s'affiche pas en production car les credentials AWS ne sont pas configurés dans Vercel.

## ✅ Solution : Ajouter les variables d'environnement

### Méthode 1 : Via le Dashboard Vercel (Recommandé)

1. **Allez sur [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Sélectionnez votre projet** `pilates-app-v3-complete`
3. **Allez dans Settings → Environment Variables**
4. **Ajoutez les variables suivantes pour Production** :

#### Variables à ajouter :

```
AWS_REGION = eu-north-1
AWS_ACCESS_KEY_ID = VOTRE_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = VOTRE_SECRET_ACCESS_KEY
AWS_S3_BUCKET_NAME = only-you-coaching
```

**Important :** 
- ✅ Cochez **Production** pour chaque variable
- ✅ Cochez aussi **Preview** si vous voulez tester sur les previews
- ❌ Ne cochez **pas** Development (utilisez `.env.local` en local)

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add AWS_REGION production
# Entrez: eu-north-1

vercel env add AWS_ACCESS_KEY_ID production
# Entrez: VOTRE_ACCESS_KEY_ID

vercel env add AWS_SECRET_ACCESS_KEY production
# Entrez: VOTRE_SECRET_ACCESS_KEY

vercel env add AWS_S3_BUCKET_NAME production
# Entrez: only-you-coaching
```

## 🔄 Redéploiement

**Après avoir ajouté les variables, vous DEVEZ redéployer :**

### Option 1 : Via le Dashboard
1. Allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Sélectionnez **Redeploy**

### Option 2 : Via CLI
```bash
vercel --prod
```

### Option 3 : Push Git (si auto-deploy activé)
```bash
git commit --allow-empty -m "Trigger redeploy for AWS credentials"
git push
```

## ✅ Vérification

### 1. Testez l'endpoint de diagnostic
Visitez : `https://only-you-coaching.com/api/gallery/debug`

Vous devriez voir :
- ✅ `awsCredentials.configured: true`
- ✅ `foundObjects: 8` (ou plus)
- ✅ `sampleUrl` avec une URL accessible

### 2. Testez l'endpoint de la galerie
Visitez : `https://only-you-coaching.com/api/gallery/training-photos`

Vous devriez voir un JSON avec un tableau `photos` contenant les URLs des images.

### 3. Vérifiez la galerie sur le site
Visitez : `https://only-you-coaching.com/methode`

La galerie devrait maintenant afficher les 8 images au lieu du message d'erreur.

## 🔍 Dépannage

### Si les images ne s'affichent toujours pas après redéploiement :

1. **Vérifiez les logs Vercel** :
   - Allez dans **Deployments** → Sélectionnez le dernier déploiement
   - Cliquez sur **Functions** → Cherchez `/api/gallery/training-photos`
   - Vérifiez les erreurs dans les logs

2. **Vérifiez que les variables sont bien dans Production** :
   - Allez dans **Settings** → **Environment Variables**
   - Vérifiez que chaque variable a **Production** coché
   - Les variables doivent être visibles (pas masquées)

3. **Testez l'endpoint de diagnostic** :
   - `https://only-you-coaching.com/api/gallery/debug`
   - Cela vous dira exactement ce qui ne va pas

4. **Vérifiez les permissions AWS** :
   - Les credentials doivent avoir les permissions `s3:ListBucket` et `s3:GetObject`
   - Testez avec le script local : `npm run check-s3-gallery`

## 📝 Notes importantes

- ⚠️ **Ne commitez JAMAIS les credentials AWS dans Git**
- ✅ Utilisez `.env.local` pour le développement local
- ✅ Utilisez Vercel Environment Variables pour la production
- 🔄 **Toujours redéployer après avoir ajouté/modifié des variables**

## 🎯 Résultat attendu

Après configuration et redéploiement :
- ✅ La galerie affiche les 8 images
- ✅ Les images se chargent correctement
- ✅ Le carousel fonctionne
- ✅ Plus de message d'erreur "Photos non disponibles"
