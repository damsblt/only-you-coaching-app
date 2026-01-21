# 🔧 Résolution de l'erreur de connexion Stripe

## ❌ Erreur rencontrée
```
POST /api/stripe/create-subscription-direct 500 (Internal Server Error)
Subscription creation failed: An error occurred with our connection to Stripe. Request was retried 2 times.
```

## 🔍 Diagnostic rapide

### Testez d'abord votre configuration Stripe :

**En production (only-you-coaching.com):**
Visitez : https://only-you-coaching.com/api/debug/stripe-check

**En local (localhost):**
Visitez : http://localhost:3000/api/debug/stripe-check

Cette URL vous donnera un diagnostic complet de votre configuration Stripe.

## 🎯 Solution

### 1. Vérifier le fichier `.env.local`

Le fichier `.env.local` doit exister à la racine du projet et contenir vos clés Stripe :

```bash
# Clés Stripe de test
STRIPE_SECRET_KEY=sk_test_51S9oMQRnELGaRIkTpG9KHv2n784wJjfOnRUqhyCuRxRUz2GOxQkzceb9tQZ6U8O7L6QZpru22wRJ0fprqEJ8KTCb00JZCUCBNu
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S9oMQRnELGaRIkTXkwKPg3YQGcLpuU4LCyiU7MBLIhBrQ2tN1hZdyZTCyNUHFPvh5jNY5f0VSEVDwJ8EeM5tCN800iC4iKFvD

# Autres variables nécessaires
DATABASE_URL=votre_url_base_de_données
```

### 2. Vérifier que les clés sont correctes

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com/test/apikeys)
2. Copiez vos clés de test (elles commencent par `sk_test_` et `pk_test_`)
3. Remplacez les valeurs dans votre `.env.local`

### 3. Redémarrer le serveur de développement

**Important** : Les variables d'environnement ne sont chargées qu'au démarrage du serveur.

```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Puis redémarrer
npm run dev
```

### 4. Tester à nouveau

1. Rafraîchissez votre navigateur
2. Essayez de créer un nouvel abonnement
3. Les messages d'erreur sont maintenant plus détaillés dans la console

## 🔍 Vérifier la configuration

Vous pouvez visiter `http://localhost:3000/debug-env` pour vérifier que vos variables sont chargées (n'affiche que "SET" ou "NOT_SET", pas les valeurs réelles).

## 📝 Structure du fichier .env.local complet

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-3
AWS_S3_BUCKET=onlyyou-pilates

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=contact@only-you-coaching.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ✅ Résultat attendu

Après avoir configuré correctement vos variables :
- ✅ Le paiement se traite sans erreur 500
- ✅ L'abonnement est créé dans Stripe
- ✅ La redirection vers `/souscriptions/success` fonctionne
- ✅ La page scrolle automatiquement vers le haut

## 🚀 Configuration Vercel (Production)

Si l'erreur survient sur **only-you-coaching.com** (production), suivez ces étapes :

### 1. Vérifier les variables d'environnement sur Vercel

1. Connectez-vous à [Vercel](https://vercel.com)
2. Sélectionnez votre projet `pilates-app-v3-complete`
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que ces variables existent et sont correctes :

```bash
STRIPE_SECRET_KEY=sk_test_51S9oMQRnELGaRIkTpG9KHv2n784wJjfOnRUqhyCuRxRUz2GOxQkzceb9tQZ6U8O7L6QZpru22wRJ0fprqEJ8KTCb00JZCUCBNu
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S9oMQRnELGaRIkTXkwKPg3YQGcLpuU4LCyiU7MBLIhBrQ2tN1hZdyZTCyNUHFPvh5jNY5f0VSEVDwJ8EeM5tCN800iC4iKFvD
```

**Important :** Assurez-vous que les variables sont activées pour :
- ✅ Production
- ✅ Preview
- ✅ Development

### 2. Variables manquantes ou invalides ?

**Si les variables n'existent pas :**
```bash
# Via le CLI Vercel
vercel env add STRIPE_SECRET_KEY
# Collez la valeur : sk_test_51S9oMQRnELGaRIkTpG9KHv2n784wJjfOnRUqhyCuRxRUz2GOxQkzceb9tQZ6U8O7L6QZpru22wRJ0fprqEJ8KTCb00JZCUCBNu
# Sélectionnez : Production, Preview, Development

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Collez la valeur : pk_test_51S9oMQRnELGaRIkTXkwKPg3YQGcLpuU4LCyiU7MBLIhBrQ2tN1hZdyZTCyNUHFPvh5jNY5f0VSEVDwJ8EeM5tCN800iC4iKFvD
```

**Ou via l'interface Vercel :**
1. Cliquez sur **Add New** dans Environment Variables
2. Name : `STRIPE_SECRET_KEY`
3. Value : `sk_test_51S9oMQ...`
4. Cochez tous les environnements
5. Cliquez sur **Save**
6. Répétez pour `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 3. REDÉPLOYER après modification des variables

**C'est crucial !** Les variables ne sont appliquées qu'aux nouveaux déploiements.

```bash
# Méthode 1 : Via le CLI
vercel --prod

# Méthode 2 : Via l'interface Vercel
# Allez dans "Deployments" → bouton "Redeploy"
# OU faites un nouveau commit/push sur Git
```

### 4. Vérifier que ça fonctionne

Une fois redéployé, visitez :
```
https://only-you-coaching.com/api/debug/stripe-check
```

Vous devriez voir :
```json
{
  "summary": {
    "allChecksPass": true,
    "ready": true,
    "issues": []
  }
}
```

## 🆘 Si le problème persiste

### En local (localhost)
Vérifiez dans la console du terminal (là où tourne `npm run dev`) :
- Si vous voyez `❌ STRIPE_SECRET_KEY is not configured` → la variable n'est pas chargée
- Si vous voyez `⚠️ STRIPE_SECRET_KEY is invalid` → la clé est incorrecte
- Vérifiez que le fichier `.env.local` est bien à la racine du projet
- Assurez-vous qu'il n'y a pas d'espaces avant ou après les valeurs

### En production (Vercel)
1. Vérifiez les logs en temps réel :
   ```bash
   vercel logs --follow
   ```

2. Cherchez les messages d'erreur contenant "Stripe" ou "STRIPE_SECRET_KEY"

3. Si vous voyez `StripeAuthenticationError` → Les clés sont invalides
   - Récupérez de nouvelles clés depuis [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Mettez à jour les variables sur Vercel
   - Redéployez

4. Si vous voyez `StripeConnectionError` → Problème de réseau/timeout
   - Vérifiez que Stripe n'est pas en panne : https://status.stripe.com
   - Réessayez dans quelques minutes
   - Vérifiez les limites de votre compte Stripe

## 🔐 Passer en mode LIVE (Production réelle)

Quand vous serez prêt à accepter de vrais paiements :

1. Récupérez vos clés LIVE depuis [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Remplacez dans Vercel :
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
3. Redéployez
4. Testez avec une vraie carte (utilisez une petite somme pour tester)

**⚠️ ATTENTION :** En mode LIVE, les paiements sont réels et ne peuvent pas être annulés aussi facilement !
