# 🚀 Guide : Passer Stripe en Mode Production

## 🔍 Pourquoi le bouton "Quitter le mode test" est grisé ?

Le bouton est grisé car vous utilisez actuellement des **clés Stripe de test** (`sk_test_` et `pk_test_`). WooCommerce/Stripe détecte automatiquement que vous êtes en mode test et désactive le passage en production.

## ✅ Solution : Passer en Mode Production

### Étape 1 : Obtenir les clés de production depuis Stripe

1. **Connectez-vous au Dashboard Stripe** : https://dashboard.stripe.com
2. **Assurez-vous d'être en mode LIVE** (pas en mode test)
   - En haut à droite, vérifiez que le toggle "Test mode" est **désactivé**
   - Si vous voyez "Test mode" activé, cliquez dessus pour le désactiver
3. **Récupérez vos clés de production** :
   - Allez dans **Developers** > **API keys**
   - Vous verrez deux clés :
     - **Publishable key** : commence par `pk_live_...`
     - **Secret key** : commence par `sk_live_...` (cliquez sur "Reveal test key" pour la voir)
4. **Copiez ces deux clés** - vous en aurez besoin dans l'étape suivante

### Étape 2 : Créer les produits dans le compte de production

⚠️ **IMPORTANT** : Les produits créés en mode test ne sont pas disponibles en mode production. Vous devez les recréer.

1. **Dans le Dashboard Stripe (mode LIVE)** :
   - Allez dans **Products** > **Add product**
   - Créez les 6 produits suivants avec leurs prix :

#### Plans Accompagnement :
- **Essentiel - Accompagnement** : 69 CHF/mois
- **Avancé - Accompagnement** : 89 CHF/mois  
- **Premium - Accompagnement** : 109 CHF/mois

#### Plans Autonomie :
- **Starter - Autonomie** : 2 tarifs (vous devez créer 2 prix pour ce produit)
- **Pro - Autonomie** : 30 CHF/mois
- **Expert - Autonomie** : 25 CHF/mois

2. **Notez les Price IDs** de chaque produit (commencent par `price_...`)
   - Vous pourriez en avoir besoin plus tard pour la configuration

### Étape 3 : Configurer le Webhook en production

1. **Dans le Dashboard Stripe (mode LIVE)** :
   - Allez dans **Developers** > **Webhooks**
   - Cliquez sur **Add endpoint**
   - **Endpoint URL** : `https://only-you-coaching.com/api/webhooks/stripe`
   - **Events to send** : Sélectionnez ces événements :
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
   - Cliquez sur **Add endpoint**
   - **Copiez le "Signing secret"** (commence par `whsec_...`)

### Étape 4 : Mettre à jour les variables d'environnement dans Vercel

1. **Allez sur Vercel Dashboard** : https://vercel.com/dashboard
2. **Sélectionnez votre projet** (pilates-app-v3-complete)
3. **Allez dans Settings** > **Environment Variables**
4. **Mettez à jour ces variables** avec vos clés de production :

#### Variables à mettre à jour :

```
STRIPE_SECRET_KEY=sk_live_[VOTRE_CLE_SECRETE_PRODUCTION]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[VOTRE_CLE_PUBLIQUE_PRODUCTION]
STRIPE_WEBHOOK_SECRET=whsec_[VOTRE_WEBHOOK_SECRET_PRODUCTION]
```

**Instructions détaillées :**

Pour chaque variable :
1. Cliquez sur la variable existante (ou **Add New** si elle n'existe pas)
2. Remplacez la valeur par votre clé de production
3. Assurez-vous que **Production**, **Preview**, et **Development** sont cochés
4. Cliquez sur **Save**

### Étape 5 : Redéployer l'application

⚠️ **CRUCIAL** : Les variables d'environnement ne sont appliquées qu'aux nouveaux déploiements.

**Option 1 : Via l'interface Vercel**
1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**
4. Cochez **Use existing Build Cache** (optionnel)
5. Cliquez sur **Redeploy**

**Option 2 : Via Git**
```bash
# Faites un petit changement (commentaire, etc.) et poussez
git commit --allow-empty -m "Switch to Stripe production mode"
git push
```

### Étape 6 : Vérifier que tout fonctionne

1. **Vérifiez la configuration Stripe** :
   - Visitez : https://only-you-coaching.com/api/debug/stripe-check
   - Vous devriez voir :
     ```json
     {
       "checks": {
         "envVars": {
           "STRIPE_SECRET_KEY": {
             "isTestKey": false,
             "isLiveKey": true
           }
         }
       }
     }
     ```

2. **Testez un paiement réel** (avec une petite somme) :
   - Utilisez une vraie carte de crédit
   - ⚠️ **ATTENTION** : En mode production, les paiements sont réels !
   - Commencez par tester avec un montant minimal

3. **Vérifiez dans WooCommerce/Stripe** :
   - Le bouton "Quitter le mode test" ne devrait plus être grisé
   - Vous ne devriez plus voir le bandeau orange "Mode test"

## ⚠️ Points d'attention importants

1. **Les paiements sont réels** : En mode production, tous les paiements sont réels et ne peuvent pas être annulés facilement.

2. **Sauvegardez vos clés** : Gardez vos clés de production dans un endroit sûr (gestionnaire de mots de passe).

3. **Testez d'abord** : Avant de passer en production, testez bien tous les flux de paiement en mode test.

4. **Webhooks** : Assurez-vous que le webhook de production est bien configuré et fonctionne.

5. **Produits** : Vérifiez que tous vos produits sont bien créés dans le compte de production Stripe.

## 🔄 Revenir en mode test (si nécessaire)

Si vous devez revenir en mode test :
1. Remplacez les clés dans Vercel par vos clés de test (`sk_test_` et `pk_test_`)
2. Redéployez l'application
3. Le mode test sera réactivé

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Vercel : `vercel logs --follow`
2. Vérifiez le diagnostic Stripe : https://only-you-coaching.com/api/debug/stripe-check
3. Consultez la documentation Stripe : https://stripe.com/docs
