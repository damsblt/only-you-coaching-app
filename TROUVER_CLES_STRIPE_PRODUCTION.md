# 🔑 Comment trouver les clés Stripe de production

## 🎯 Méthode simple (sans toggle visible)

### Étape 1 : Accéder aux clés API

1. **Connectez-vous** : https://dashboard.stripe.com
2. **Cliquez sur** : **Developers** (dans le menu de gauche)
3. **Cliquez sur** : **API keys**

### Étape 2 : Identifier le mode actuel

Sur la page **API keys**, regardez les clés affichées :

#### Si vous voyez :
- `pk_test_...` et `sk_test_...` → **Vous êtes en mode TEST**
- `pk_live_...` et `sk_live_...` → **Vous êtes en mode PRODUCTION** ✅

### Étape 3 : Basculer en mode Live (si nécessaire)

**Si vous êtes en mode TEST** et que vous voyez `pk_test_` :

1. **Regardez en haut de la page** :
   - Cherchez un indicateur "Test mode" ou "Mode test"
   - Il peut être :
     - Un bandeau orange en haut
     - Un texte cliquable en haut à droite
     - Un switch/toggle quelque part

2. **Si vous ne trouvez pas de toggle** :
   - Essayez de cliquer directement sur le texte "Test mode" ou "Mode test"
   - Ou cherchez un lien "Switch to Live mode" / "Passer en mode Live"

3. **Alternative** : Allez directement sur :
   - https://dashboard.stripe.com/apikeys (sans `/test/` dans l'URL)
   - Cela devrait vous montrer les clés Live directement

### Étape 4 : Récupérer les clés de production

Une fois en mode Live, vous verrez :

1. **Publishable key** : `pk_live_...`
   - Visible directement
   - Copiez cette clé

2. **Secret key** : `sk_live_...`
   - Cachée par défaut (affichée comme `sk_live_••••••••`)
   - Cliquez sur **"Reveal live key"** ou **"Révéler la clé"**
   - Copiez cette clé

---

## 🔍 Vérification rapide

**Dans l'URL de votre navigateur**, regardez :
- `dashboard.stripe.com/test/...` → Mode TEST
- `dashboard.stripe.com/...` (sans `/test/`) → Mode LIVE

---

## ✅ Si vous ne trouvez toujours pas les clés Live

Cela peut signifier que :

1. **Votre compte n'est pas encore activé pour la production**
   - Vérifiez que vous avez complété l'activation du compte
   - Vous devriez avoir vu un message "Merci d'avoir activé votre compte !"

2. **Vous devez activer le mode Live manuellement**
   - Contactez le support Stripe si nécessaire
   - Ou vérifiez les paramètres du compte

3. **Les clés Live sont déjà là mais vous ne les voyez pas**
   - Essayez de rafraîchir la page
   - Déconnectez-vous et reconnectez-vous

---

## 📝 Note importante

**Même sans toggle visible**, vous pouvez toujours :
- Aller directement sur : https://dashboard.stripe.com/apikeys
- Les clés Live devraient apparaître si votre compte est activé

Si vous ne voyez toujours que des clés de test, votre compte pourrait nécessiter une activation supplémentaire de la part de Stripe.
