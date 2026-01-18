# 🚀 Quick Start - Codes Promo

## Installation Rapide en 3 Étapes

### ✅ Étape 1 : Créer les Tables

Connectez-vous à votre [console Neon](https://console.neon.tech) et exécutez :

```bash
# Copier le contenu du fichier SQL
cat scripts/create-promo-codes-table.sql
```

Ou exécutez directement dans la console SQL de Neon.

---

### ✅ Étape 2 : Créer des Codes de Test (Optionnel)

Pour tester rapidement avec des codes de démonstration :

```bash
node scripts/create-demo-promo-codes.js
```

Cela créera 5 codes promo de test :
- `BIENVENUE10` - 10% pour tous (illimité)
- `NOEL2026` - 20% de Noël (100 utilisations)
- `FLASH50` - 50% flash 24h (10 utilisations)
- `FIDELE15` - 15 CHF fidélité (200 utilisations)
- `STARTER5` - 5 CHF pour plan Starter (illimité)

---

### ✅ Étape 3 : Tester le Système

1. **Interface Admin**
   - Accédez à `/admin/promo-codes`
   - Vous verrez vos codes de test
   - Créez-en de nouveaux

2. **Checkout Client**
   - Allez sur `/souscriptions/personnalise`
   - Sélectionnez un plan
   - Sur la page de paiement, testez un code : `BIENVENUE10`
   - Voyez la réduction s'appliquer en temps réel

3. **Carte de Test Stripe**
   ```
   Numéro: 4242 4242 4242 4242
   Date: N'importe quelle date future
   CVC: N'importe quel 3 chiffres
   ```

---

## 📊 Accès Rapide

| Fonction | URL | Description |
|----------|-----|-------------|
| **Admin Codes Promo** | `/admin/promo-codes` | Gérer tous les codes |
| **Dashboard Admin** | `/admin` | Accueil admin |
| **Test Checkout** | `/checkout?planId=essentiel` | Tester le paiement |

---

## 🎯 Créer Votre Premier Code

1. Accédez à `/admin/promo-codes`
2. Cliquez sur **"Nouveau Code Promo"**
3. Remplissez :
   ```
   Code: MONCODE
   Type: Pourcentage
   Valeur: 10
   Cochez "Créer coupon Stripe"
   ```
4. Cliquez sur **"Créer"**
5. Testez-le immédiatement !

---

## 🔧 Vérifications

### La table existe-t-elle ?
```sql
SELECT COUNT(*) FROM promo_codes;
```

### Y a-t-il des codes ?
```sql
SELECT code, is_active, discount_type, discount_value 
FROM promo_codes 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## ❓ Problèmes Courants

### Le bouton "Nouveau Code Promo" ne fait rien
- ✅ Vérifiez que les tables sont créées
- ✅ Ouvrez la console (F12) pour voir les erreurs

### Le code ne s'applique pas
- ✅ Vérifiez que le code est actif (is_active = true)
- ✅ Vérifiez la date de validité
- ✅ Vérifiez que le plan est éligible

### Erreur Stripe
- ✅ Vérifiez vos clés dans `.env.local`
- ✅ Cochez "Créer coupon Stripe" lors de la création du code

---

## 📚 Documentation Complète

Pour plus de détails, consultez `PROMO_CODES_GUIDE.md`

---

## 🎉 Prêt !

Votre système de codes promo est maintenant opérationnel ! 🚀

Commencez par créer un code de bienvenue pour vos nouveaux clients.
