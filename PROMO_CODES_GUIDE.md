# 🎫 Guide Complet des Codes Promo

## 📋 Vue d'ensemble

Le système de codes promo permet à votre cliente de créer et gérer des codes promotionnels pour offrir des réductions sur les abonnements. Le système est entièrement intégré avec Stripe pour une gestion automatisée des coupons.

---

## 🚀 Installation et Configuration

### 1. Créer les tables dans la base de données

Exécutez le script SQL dans votre console Neon :

```bash
# Connectez-vous à votre console Neon
# Puis exécutez le fichier :
cat scripts/create-promo-codes-table.sql
```

Ou copiez-collez le contenu du fichier `scripts/create-promo-codes-table.sql` dans la console SQL de Neon.

### 2. Vérifier l'intégration Stripe

Assurez-vous que vos clés Stripe sont configurées dans `.env.local` :

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🎯 Fonctionnalités

### ✅ Interface Admin

**URL :** `/admin/promo-codes`

L'interface admin permet de :
- ✅ Créer de nouveaux codes promo
- ✅ Voir tous les codes promo avec leurs statistiques
- ✅ Activer/désactiver un code
- ✅ Supprimer un code
- ✅ Voir les statistiques d'utilisation en temps réel

### ✅ Types de Réduction

1. **Pourcentage (%)** : Réduction en pourcentage du prix
   - Exemple : 10% de réduction
   - Valeur : 10 (pour 10%)

2. **Montant Fixe (CHF)** : Réduction d'un montant fixe
   - Exemple : 10 CHF de réduction
   - Valeur : 1000 (en centimes)

### ✅ Limites et Restrictions

- **Limite globale** : Nombre maximum d'utilisations du code (ex: 100)
- **Limite par utilisateur** : Nombre de fois qu'un utilisateur peut utiliser le code (par défaut: 1)
- **Plans éligibles** : Restreindre le code à certains plans spécifiques
- **Dates de validité** : Date de début et d'expiration

### ✅ Synchronisation Stripe

Lors de la création d'un code promo, vous pouvez choisir de :
- ✅ Créer automatiquement le coupon dans Stripe
- ✅ Le système utilisera ce coupon lors du paiement
- ✅ Les réductions seront visibles dans le dashboard Stripe

---

## 📖 Comment Utiliser

### Pour l'Administrateur (Marie-Line)

#### 1. Créer un Code Promo

1. Accédez à `/admin/promo-codes`
2. Cliquez sur **"Nouveau Code Promo"**
3. Remplissez le formulaire :
   - **Code** : NOEL2026, BIENVENUE10, etc. (majuscules recommandées)
   - **Type de Réduction** : Pourcentage ou Montant Fixe
   - **Valeur** : 
     - Pour %, entrez 10, 20, 50...
     - Pour montant fixe, entrez en centimes (1000 = 10 CHF)
   - **Utilisations Max** : Laissez vide pour illimité
   - **Max par Utilisateur** : Généralement 1
   - **Plans Éligibles** : Sélectionnez les plans ou laissez vide pour tous
   - **Dates** : Date de début (aujourd'hui par défaut) et date d'expiration
   - **Description** : Note interne pour vous rappeler l'objectif
   - **Créer coupon Stripe** : Cochez pour synchroniser avec Stripe

4. Cliquez sur **"Créer le Code Promo"**

#### 2. Gérer les Codes Existants

- **Activer/Désactiver** : Cliquez sur le badge de statut
- **Supprimer** : Cliquez sur l'icône de poubelle
- **Voir les stats** : Consultez le nombre d'utilisations, utilisateurs uniques, etc.

### Pour les Clients

#### 1. Lors du Checkout

1. Sélectionnez un plan d'abonnement
2. Sur la page de paiement, vous verrez une section **"Code Promo"**
3. Entrez votre code (ex: NOEL2026)
4. Cliquez sur **"Appliquer"**
5. La réduction s'affiche immédiatement :
   - Prix original barré
   - Montant de la réduction
   - Nouveau prix à payer
6. Procédez au paiement avec le prix réduit

---

## 💡 Exemples de Codes Promo

### Exemple 1 : Promotion de Noël
```
Code: NOEL2026
Type: Pourcentage
Valeur: 20
Limite globale: 50
Limite par utilisateur: 1
Plans éligibles: Tous
Validité: Du 1er décembre au 31 décembre 2026
Description: Promotion de Noël - 20% de réduction
```

### Exemple 2 : Code de Bienvenue
```
Code: BIENVENUE10
Type: Montant Fixe
Valeur: 1000 (10 CHF)
Limite globale: Illimité
Limite par utilisateur: 1
Plans éligibles: essentiel, starter
Validité: Permanent
Description: Code de bienvenue pour nouveaux clients
```

### Exemple 3 : Promotion Flash
```
Code: FLASH50
Type: Pourcentage
Valeur: 50
Limite globale: 10
Limite par utilisateur: 1
Plans éligibles: premium, expert
Validité: 24 heures
Description: Promotion flash - 50% sur plans premium
```

### Exemple 4 : Fidélité
```
Code: FIDELE2026
Type: Montant Fixe
Valeur: 2000 (20 CHF)
Limite globale: 100
Limite par utilisateur: 1
Plans éligibles: Tous
Validité: Toute l'année 2026
Description: Récompense fidélité clients existants
```

---

## 🔧 API Endpoints

### Pour l'Admin

#### GET `/api/admin/promo-codes`
Liste tous les codes promo

#### POST `/api/admin/promo-codes`
Crée un nouveau code promo

```json
{
  "code": "NOEL2026",
  "discountType": "percentage",
  "discountValue": 20,
  "maxUses": 50,
  "maxUsesPerUser": 1,
  "eligiblePlans": ["essentiel", "premium"],
  "validFrom": "2026-12-01",
  "validUntil": "2026-12-31",
  "description": "Promotion de Noël",
  "createStripeCoupon": true
}
```

#### PATCH `/api/admin/promo-codes/[id]`
Met à jour un code promo

#### DELETE `/api/admin/promo-codes?id=[id]`
Supprime un code promo

### Pour les Clients

#### POST `/api/promo-codes/validate`
Valide un code promo avant application

```json
{
  "code": "NOEL2026",
  "planId": "essentiel",
  "userId": "user-uuid",
  "originalAmount": 6900
}
```

Réponse :
```json
{
  "valid": true,
  "promoCode": {
    "id": "uuid",
    "code": "NOEL2026",
    "discountType": "percentage",
    "discountValue": 20,
    "stripeCouponId": "NOEL2026"
  },
  "discount": {
    "amount": 1380,
    "originalAmount": 6900,
    "finalAmount": 5520,
    "percentage": 20
  }
}
```

#### POST `/api/promo-codes/apply`
Enregistre l'utilisation d'un code promo après paiement réussi

---

## 📊 Structure de la Base de Données

### Table `promo_codes`
```sql
- id (UUID)
- code (VARCHAR) - Le code promo (ex: NOEL2026)
- discount_type (VARCHAR) - 'percentage' ou 'fixed_amount'
- discount_value (INTEGER) - Valeur de la réduction
- stripe_coupon_id (VARCHAR) - ID du coupon Stripe
- max_uses (INTEGER) - Limite globale
- current_uses (INTEGER) - Compteur actuel
- max_uses_per_user (INTEGER) - Limite par utilisateur
- eligible_plans (TEXT[]) - Plans éligibles
- valid_from (TIMESTAMP)
- valid_until (TIMESTAMP)
- is_active (BOOLEAN)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Table `promo_code_usage`
```sql
- id (UUID)
- promo_code_id (UUID) - Référence au code promo
- user_id (UUID) - Référence à l'utilisateur
- subscription_id (VARCHAR) - ID de l'abonnement Stripe
- discount_amount (INTEGER) - Montant de la réduction appliquée
- original_amount (INTEGER) - Montant original
- final_amount (INTEGER) - Montant final payé
- used_at (TIMESTAMP)
```

---

## 🔒 Validations et Sécurité

Le système vérifie automatiquement :

✅ **Code actif** : Le code doit être actif (is_active = true)
✅ **Validité temporelle** : Le code doit être dans sa période de validité
✅ **Limite globale** : Le nombre d'utilisations ne doit pas dépasser max_uses
✅ **Limite par utilisateur** : L'utilisateur ne doit pas avoir déjà utilisé le code
✅ **Plan éligible** : Le plan sélectionné doit être dans la liste des plans éligibles
✅ **Montant minimum** : La réduction ne peut pas dépasser le montant original

---

## 🎨 Composants UI

### `PromoCodeInput.tsx`
Composant React pour le champ de saisie du code promo dans le checkout :
- Validation en temps réel
- Affichage des réductions
- Gestion des erreurs
- Design responsive

### Page Admin `/admin/promo-codes/page.tsx`
Interface complète de gestion :
- Tableau avec tous les codes
- Formulaire de création
- Statistiques en temps réel
- Actions rapides (activer, désactiver, supprimer)

---

## 📈 Statistiques Disponibles

L'interface admin affiche :
- **Total codes actifs** : Nombre de codes actuellement actifs
- **Total utilisations** : Nombre total d'utilisations de tous les codes
- **Total codes** : Nombre total de codes créés
- **Par code** :
  - Utilisations actuelles / maximum
  - Progression (barre colorée selon le taux d'utilisation)
  - Date d'expiration
  - Plans éligibles

---

## 🚨 Gestion des Erreurs

Messages d'erreur possibles :

| Erreur | Signification |
|--------|---------------|
| "Code promo invalide" | Le code n'existe pas dans la base de données |
| "Ce code promo n'est plus actif" | Le code a été désactivé |
| "Ce code promo n'est pas encore valide" | Date de début non atteinte |
| "Ce code promo a expiré" | Date d'expiration dépassée |
| "Ce code promo a atteint sa limite d'utilisation" | Limite globale atteinte |
| "Ce code promo n'est pas valide pour ce plan" | Plan non éligible |
| "Vous avez déjà utilisé ce code promo" | L'utilisateur a déjà utilisé ce code |

---

## 🔄 Intégration avec Stripe

### Création automatique des coupons

Lorsque vous cochez "Créer automatiquement le coupon dans Stripe" :

1. Le système crée un coupon Stripe avec :
   - **ID** : Le code promo (ex: NOEL2026)
   - **Réduction** : Pourcentage ou montant fixe
   - **Devise** : CHF (pour montants fixes)
   - **Date d'expiration** : Si définie
   - **Limite d'utilisation** : Si définie

2. Le coupon est automatiquement appliqué lors du paiement

3. Vous pouvez voir les coupons dans votre [Dashboard Stripe](https://dashboard.stripe.com/coupons)

### Application lors du paiement

```javascript
// Le système applique automatiquement le coupon
stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: price.id }],
  coupon: 'NOEL2026', // Appliqué automatiquement
  // ...
})
```

---

## 📝 Bonnes Pratiques

### ✅ Codes Courts et Mémorables
- Préférez des codes courts (8-12 caractères max)
- Utilisez des mots-clés évocateurs (NOEL, BIENVENUE, FLASH)
- Ajoutez l'année si nécessaire (NOEL2026)

### ✅ Limites Raisonnables
- Définissez toujours une limite par utilisateur (généralement 1)
- Pour les promotions limitées, définissez une limite globale
- Pour les codes de bienvenue, laissez illimité

### ✅ Communication Claire
- Informez vos clients des conditions (date d'expiration, plans éligibles)
- Utilisez des descriptions internes pour vous souvenir de l'objectif
- Désactivez les codes expirés plutôt que de les supprimer (pour garder l'historique)

### ✅ Suivi et Analyse
- Consultez régulièrement les statistiques d'utilisation
- Ajustez vos promotions en fonction des résultats
- Gardez un historique des codes pour analyser les tendances

---

## 🎯 Cas d'Usage Courants

### 1. Lancement d'un Nouveau Programme
```
Code: NOUVEAUTE30
Type: Pourcentage 30%
Validité: 2 semaines
Plans: Le nouveau programme uniquement
```

### 2. Reconquête de Clients
```
Code: RETOUR15
Type: Montant Fixe 15 CHF
Validité: 1 mois
Plans: Tous
Description: Pour clients inactifs depuis 3 mois
```

### 3. Parrainage
```
Code: PARRAIN20
Type: Pourcentage 20%
Limite: 1 utilisation par utilisateur parrainé
Plans: Tous sauf gratuit
```

### 4. Événement Spécial
```
Code: WEBINAR50
Type: Pourcentage 50%
Limite globale: 30 (places limitées)
Validité: Jour de l'événement uniquement
```

---

## 🛠️ Dépannage

### Problème : Le code ne fonctionne pas

**Solutions :**
1. Vérifiez que le code est actif dans l'admin
2. Vérifiez la date de validité
3. Vérifiez que le plan est éligible
4. Vérifiez que l'utilisateur n'a pas déjà utilisé le code
5. Vérifiez la limite globale

### Problème : Le coupon Stripe n'est pas créé

**Solutions :**
1. Vérifiez vos clés Stripe dans `.env.local`
2. Vérifiez les logs de l'API
3. Créez manuellement le coupon dans Stripe avec le même ID

### Problème : La réduction ne s'applique pas

**Solutions :**
1. Vérifiez que le coupon existe dans Stripe
2. Vérifiez les logs du navigateur (F12)
3. Testez avec la carte de test Stripe

---

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs de l'API : `/api/admin/promo-codes`
2. Vérifiez le dashboard Stripe : https://dashboard.stripe.com
3. Consultez la console du navigateur pour les erreurs côté client

---

## 🎉 Félicitations !

Votre système de codes promo est maintenant opérationnel ! Vous pouvez commencer à créer des promotions pour vos clients. 🚀
