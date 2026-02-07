# 🔧 Diagnostic du Mode Construction

## Problème : Le site n'affiche pas la page de construction

Si `only-you-coaching.com` n'affiche pas la page de construction alors que les variables sont configurées dans Vercel, voici les étapes de diagnostic :

## ✅ Vérifications à faire

### 1. Vérifier que le domaine `.com` est configuré dans Vercel

**Important** : Le domaine `only-you-coaching.com` doit être configuré dans Vercel et pointer vers le bon projet.

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **pilates-coaching-app**
3. Allez dans **Settings** → **Domains**
4. Vérifiez que `only-you-coaching.com` est listé
5. Si ce n'est pas le cas, ajoutez-le :
   - Cliquez sur **Add Domain**
   - Entrez `only-you-coaching.com`
   - Suivez les instructions DNS

### 2. Vérifier les variables d'environnement dans Vercel

1. Dans Vercel Dashboard → **Settings** → **Environment Variables**
2. Vérifiez que ces variables existent pour **Production** :
   - `CONSTRUCTION_MODE` = `true`
   - `CONSTRUCTION_JWT_SECRET` = (clé secrète)
3. **Important** : Les variables doivent être définies pour **Production** (pas seulement Preview ou Development)

### 3. Vérifier que le dernier déploiement inclut les variables

1. Allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Vérifiez les **Build Logs** et cherchez :
   ```
   [Middleware] CONSTRUCTION_MODE env: true | Active: true
   ```
4. Si vous voyez `Active: false`, les variables ne sont pas correctement chargées

### 4. Vérifier les logs en temps réel

1. Allez dans **Deployments** → Dernier déploiement
2. Cliquez sur **Functions** → **Middleware**
3. Visitez `only-you-coaching.com` dans votre navigateur
4. Regardez les logs en temps réel - vous devriez voir :
   ```
   [Middleware] CONSTRUCTION_MODE env: true | Active: true
   [Middleware] Pathname: / | Host: only-you-coaching.com
   ```

### 5. Vérifier le DNS

Assurez-vous que le domaine `.com` pointe bien vers Vercel :

```bash
# Vérifier où pointe le domaine
dig only-you-coaching.ch +short
# Devrait retourner une IP Vercel (ex: 76.76.21.21 ou 216.198.79.1)
```

### 6. Vider le cache

- Videz le cache de votre navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
- Testez en navigation privée
- Vérifiez si le problème persiste

## 🔍 Diagnostic automatique

Exécutez ce script pour vérifier la configuration locale :

```bash
node scripts/check-construction-mode.js
```

## 🚨 Problèmes courants

### Le domaine `.ch` n'est pas dans Vercel

**Solution** : Ajoutez le domaine dans Vercel Dashboard → Settings → Domains

### Les variables sont définies mais le middleware ne les voit pas

**Solution** :
1. Vérifiez que les variables sont définies pour **Production**
2. Redéployez l'application : `vercel --prod`
3. Attendez quelques minutes pour la propagation

### Le domaine pointe vers un autre projet Vercel

**Solution** : Vérifiez dans Vercel Dashboard que `only-you-coaching.ch` est bien lié au projet `pilates-coaching-app`

### Cache du navigateur

**Solution** : Testez en navigation privée ou videz le cache

## 📞 Support

Si le problème persiste après ces vérifications :

1. Vérifiez les logs du middleware dans Vercel
2. Vérifiez que le domaine `.ch` est bien configuré dans Vercel
3. Vérifiez que les variables d'environnement sont bien définies pour Production
4. Redéployez l'application
