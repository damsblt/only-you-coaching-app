# ✅ Plan d'Action : Passer en Production Stripe

## 🎯 Objectif
Remplacer les clés de test par les clés de production dans Vercel pour activer les paiements réels.

---

## 📋 Checklist d'Action (à suivre dans l'ordre)

### ✅ Étape 1 : Récupérer les clés de production Stripe

1. **Allez sur** : https://dashboard.stripe.com
2. **Allez directement dans** : **Developers** → **API keys**
3. **Vérifiez le mode actuel** :
   - Si vous voyez un bandeau orange "Mode test" en haut → vous êtes en mode test
   - Si vous ne voyez pas de bandeau orange → vous êtes peut-être déjà en mode Live
4. **Pour voir les clés de production** :
   - **Option A** : Si vous voyez "Test mode" en haut, cliquez dessus pour basculer en "Live mode"
   - **Option B** : Dans la page **API keys**, regardez les clés affichées :
     - Si elles commencent par `pk_test_` et `sk_test_` → vous êtes en mode test
     - Si elles commencent par `pk_live_` et `sk_live_` → vous êtes en mode production ✅
5. **Copiez les clés de production** :
   - **Publishable key** : `pk_live_...` (visible directement)
   - **Secret key** : `sk_live_...` (cliquez sur "Reveal live key" pour la voir)

**💾 Gardez ces clés dans un endroit sûr !**

**💡 Astuce** : Si vous ne voyez que des clés de test (`pk_test_`, `sk_test_`), c'est normal - vous devez d'abord activer votre compte pour la production (ce qui semble déjà fait d'après votre écran précédent). Les clés Live apparaîtront une fois que vous basculerez en mode Live.

---

### ✅ Étape 2 : Créer les produits en production

⚠️ **IMPORTANT** : Les produits de test ne sont pas transférés automatiquement.

1. **Dans Stripe Dashboard (mode LIVE)** :
   - Allez dans **Products** → **Add product**
   - Créez ces 6 produits :

#### Plans à créer :

| Produit | Prix | Type |
|---------|------|------|
| Essentiel - Accompagnement | 69 CHF | Récurrent (mois) |
| Avancé - Accompagnement | 89 CHF | Récurrent (mois) |
| Premium - Accompagnement | 109 CHF | Récurrent (mois) |
| Starter - Autonomie | 2 tarifs différents | Récurrent (mois) |
| Pro - Autonomie | 30 CHF | Récurrent (mois) |
| Expert - Autonomie | 25 CHF | Récurrent (mois) |

**📝 Note** : Les noms doivent être **exactement** identiques à ceux ci-dessus pour que le code les reconnaisse.

---

### ✅ Étape 3 : Configurer le Webhook de production

1. **Dans Stripe Dashboard (mode LIVE)** :
   - Allez dans **Developers** → **Webhooks**
   - Cliquez sur **Add endpoint**
   - **Endpoint URL** : `https://only-you-coaching.com/api/webhooks/stripe`
   - **Events à sélectionner** :
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
   - Cliquez sur **Add endpoint**
   - **Copiez le "Signing secret"** : `whsec_...`

---

### ✅ Étape 4 : Mettre à jour Vercel (CRUCIAL)

1. **Allez sur** : https://vercel.com/dashboard
2. **Sélectionnez votre projet** : `pilates-app-v3-complete`
3. **Allez dans** : **Settings** → **Environment Variables**

4. **Mettez à jour ces 3 variables** :

   #### Variable 1 : `STRIPE_SECRET_KEY`
   - Cliquez sur la variable existante
   - Remplacez `sk_test_...` par `sk_live_...` (votre clé de production)
   - Cochez : Production, Preview, Development
   - Cliquez **Save**

   #### Variable 2 : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Cliquez sur la variable existante
   - Remplacez `pk_test_...` par `pk_live_...` (votre clé de production)
   - Cochez : Production, Preview, Development
   - Cliquez **Save**

   #### Variable 3 : `STRIPE_WEBHOOK_SECRET`
   - Cliquez sur la variable existante
   - Remplacez `whsec_...` (test) par `whsec_...` (production - celui que vous venez de copier)
   - Cochez : Production, Preview, Development
   - Cliquez **Save**

---

### ✅ Étape 5 : Redéployer sur Vercel

⚠️ **OBLIGATOIRE** : Les nouvelles variables ne sont appliquées qu'après un redéploiement.

**Option A : Via l'interface Vercel (recommandé)**
1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**
4. Cliquez sur **Redeploy** (confirmation)

**Option B : Via Git**
```bash
git commit --allow-empty -m "Switch to Stripe production keys"
git push
```

---

### ✅ Étape 6 : Vérifier que tout fonctionne

1. **Vérifiez la configuration** :
   - Visitez : https://only-you-coaching.com/api/debug/stripe-check
   - Vous devez voir :
     ```json
     {
       "checks": {
         "envVars": {
           "STRIPE_SECRET_KEY": {
             "isTestKey": false,
             "isLiveKey": true  ← Doit être true
           }
         }
       }
     }
     ```

2. **Vérifiez dans Stripe Dashboard** :
   - Le bandeau orange "Mode test" ne doit plus apparaître
   - Vous êtes maintenant en mode production

3. **Testez un paiement** (avec précaution) :
   - ⚠️ **ATTENTION** : Les paiements seront réels !
   - Testez avec un petit montant d'abord
   - Utilisez une vraie carte de crédit

---

## ⚠️ Points d'attention

1. **HTTPS** : ✅ Déjà activé (Vercel le fait automatiquement)
2. **Paiements réels** : Tous les paiements seront réels, non annulables facilement
3. **Sauvegarde** : Gardez vos clés de production dans un gestionnaire de mots de passe
4. **Produits** : Vérifiez que tous les produits sont créés avec les bons noms

---

## 🆘 En cas de problème

1. **Vérifiez les logs Vercel** :
   ```bash
   vercel logs --follow
   ```

2. **Vérifiez le diagnostic** :
   - https://only-you-coaching.com/api/debug/stripe-check

3. **Vérifiez que les variables sont bien mises à jour** :
   - Dans Vercel → Settings → Environment Variables
   - Les valeurs doivent commencer par `sk_live_` et `pk_live_` (pas `sk_test_` ou `pk_test_`)

---

## ✅ Résumé rapide

1. ✅ Récupérer `pk_live_...` et `sk_live_...` depuis Stripe
2. ✅ Créer les 6 produits en mode production
3. ✅ Créer le webhook de production et copier `whsec_...`
4. ✅ Mettre à jour les 3 variables dans Vercel
5. ✅ Redéployer sur Vercel
6. ✅ Vérifier avec `/api/debug/stripe-check`

**Temps estimé** : 15-20 minutes
