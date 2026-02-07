# 🔴 Pourquoi je n'arrive pas à passer en production Stripe ?

## 🎯 Diagnostic du problème

Vous êtes actuellement en **mode TEST** dans Stripe (visible dans l'URL : `/test/settings`).

## ❌ Raisons possibles pour lesquelles vous ne pouvez pas passer en production

### 1. **Le compte Stripe n'est pas encore activé pour la production**

**Symptôme** : Le toggle "Test mode" est grisé ou n'existe pas, ou vous ne voyez que des clés de test.

**Solution** :
1. Allez sur : https://dashboard.stripe.com/account
2. Vérifiez l'état de votre compte :
   - Si vous voyez "Activate your account" → Cliquez dessus et complétez le processus
   - Si vous voyez des avertissements → Résolvez-les (informations manquantes, vérification d'identité, etc.)
3. Vérifiez les **Settings** → **Business settings** :
   - Informations d'entreprise complètes
   - Informations bancaires configurées
   - Vérification d'identité complétée

### 2. **Le compte nécessite une vérification supplémentaire**

**Symptôme** : Vous voyez un message "Account verification required" ou similaire.

**Solution** :
1. Allez sur : https://dashboard.stripe.com/account/verification
2. Complétez toutes les étapes demandées :
   - Informations personnelles/entreprise
   - Documents d'identité
   - Informations bancaires
   - Adresse de facturation

### 3. **Vous essayez de basculer depuis la mauvaise page**

**Symptôme** : Le toggle n'est pas visible ou ne fonctionne pas.

**Solution** :
1. Allez directement sur : https://dashboard.stripe.com/apikeys (sans `/test/` dans l'URL)
2. En haut de la page, cherchez le toggle "Test mode" / "Live mode"
3. Cliquez dessus pour basculer

### 4. **Les clés Live n'existent pas encore**

**Symptôme** : Même en mode Live, vous ne voyez que des clés de test.

**Solution** :
1. En mode Live, allez dans **Developers** → **API keys**
2. Si vous ne voyez que des clés de test, c'est normal au début
3. Les clés Live (`pk_live_` et `sk_live_`) apparaîtront automatiquement une fois le compte activé
4. Si elles n'apparaissent pas, contactez le support Stripe

---

## ✅ Solution étape par étape

### Étape 1 : Vérifier l'état du compte

1. Allez sur : https://dashboard.stripe.com/account
2. Regardez les sections suivantes :
   - **Account status** : Doit être "Active" ou "Activated"
   - **Verification status** : Doit être "Complete" ou "Verified"
   - **Business information** : Doit être complète

### Étape 2 : Compléter l'activation si nécessaire

Si votre compte n'est pas complètement activé :

1. **Informations d'entreprise** :
   - Allez sur : https://dashboard.stripe.com/settings/business
   - Complétez toutes les informations demandées
   - Type d'entreprise, adresse, numéro de téléphone, etc.

2. **Informations bancaires** :
   - Allez sur : https://dashboard.stripe.com/settings/payouts
   - Ajoutez un compte bancaire pour recevoir les paiements
   - C'est **obligatoire** pour activer la production

3. **Vérification d'identité** :
   - Allez sur : https://dashboard.stripe.com/account/verification
   - Téléchargez les documents demandés
   - Attendez la validation (peut prendre quelques heures/jours)

### Étape 3 : Basculer en mode Live

Une fois le compte activé :

1. Allez sur : https://dashboard.stripe.com/apikeys
2. En haut de la page, cherchez le toggle "Test mode"
3. Cliquez dessus pour le désactiver (passer en "Live mode")
4. Vous devriez maintenant voir les clés Live :
   - `pk_live_...` (Publishable key)
   - `sk_live_...` (Secret key - cliquez sur "Reveal live key")

### Étape 4 : Vérifier que les clés Live existent

1. En mode Live, allez dans **Developers** → **API keys**
2. Vous devriez voir :
   - **Publishable key** : `pk_live_...` ✅
   - **Secret key** : `sk_live_...` ✅ (cliquez sur "Reveal" pour la voir)

Si vous ne voyez toujours que des clés de test (`pk_test_`, `sk_test_`), votre compte n'est probablement pas encore activé.

---

## 🔍 Comment vérifier si votre compte est activé

### Méthode 1 : Via l'URL

Regardez l'URL de votre dashboard :
- `dashboard.stripe.com/test/...` → Mode TEST (compte pas encore activé ou basculé en test)
- `dashboard.stripe.com/...` (sans `/test/`) → Mode LIVE possible

### Méthode 2 : Via les clés API

1. Allez sur : https://dashboard.stripe.com/apikeys
2. Regardez les clés affichées :
   - Si vous voyez `pk_test_` et `sk_test_` → Mode TEST
   - Si vous voyez `pk_live_` et `sk_live_` → Mode LIVE ✅

### Méthode 3 : Via le bandeau en haut

- Si vous voyez un **bandeau orange "Test mode"** en haut → Mode TEST
- Si vous ne voyez **pas de bandeau orange** → Mode LIVE possible

---

## 🚨 Problèmes courants et solutions

### Problème 1 : "Your account is not activated for live mode"

**Solution** :
1. Complétez toutes les informations dans **Settings** → **Business settings**
2. Ajoutez un compte bancaire dans **Settings** → **Payouts**
3. Complétez la vérification d'identité
4. Attendez la validation de Stripe (peut prendre 24-48h)

### Problème 2 : Le toggle "Test mode" est grisé

**Solution** :
- Cela signifie que votre compte n'est pas encore activé
- Suivez l'étape 2 ci-dessus pour compléter l'activation

### Problème 3 : Je ne vois pas de toggle du tout

**Solution** :
1. Essayez d'aller directement sur : https://dashboard.stripe.com/apikeys
2. Ou cherchez dans le menu de gauche : **Developers** → **API keys**
3. Le toggle devrait être en haut de la page des clés API

### Problème 4 : Les clés Live n'apparaissent pas

**Solution** :
1. Vérifiez que vous êtes bien en mode Live (pas de bandeau orange)
2. Rafraîchissez la page (F5 ou Cmd+R)
3. Si elles n'apparaissent toujours pas, contactez le support Stripe

---

## 📞 Contactez le support Stripe

Si après avoir suivi toutes ces étapes vous ne pouvez toujours pas passer en production :

1. **Support Stripe** : https://support.stripe.com
2. **Chat en direct** : Disponible dans le dashboard Stripe (icône de chat en bas à droite)
3. **Email** : support@stripe.com

**Informations à fournir** :
- Votre Account ID : `acct_1S9oMQRnELGaRIkT`
- Le problème rencontré : "Cannot switch to Live mode"
- Les étapes déjà tentées

---

## ✅ Checklist rapide

Avant de pouvoir passer en production, vérifiez que :

- [ ] Informations d'entreprise complètes
- [ ] Compte bancaire ajouté
- [ ] Vérification d'identité complétée
- [ ] Aucun avertissement dans **Settings** → **Account**
- [ ] Le compte est "Active" dans **Settings** → **Account**

Une fois tout cela complété, vous devriez pouvoir basculer en mode Live et voir les clés de production.

---

## 🎯 Prochaines étapes (une fois en production)

Une fois que vous avez réussi à passer en mode Live et récupéré vos clés :

1. ✅ Suivez le guide : `ACTION_PLANE_STRIPE_PRODUCTION.md`
2. ✅ Créez les produits en production
3. ✅ Configurez le webhook de production
4. ✅ Mettez à jour les variables dans Vercel
5. ✅ Redéployez l'application
