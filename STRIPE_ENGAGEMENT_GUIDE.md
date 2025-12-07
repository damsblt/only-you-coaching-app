# Guide Stripe - Abonnements avec Période d'Engagement

## 🎯 Principe

Cette configuration permet de :
1. **Facturer mensuellement** les clients
2. **Respecter un engagement minimum** (période obligatoire de facturation)
3. **Arrêt automatique** après l'engagement (annulation automatique à la fin de la période)
4. **Annulation possible à tout moment** mais avec respect de l'engagement

## 📊 Fonctionnement

### Exemple : Plan Essentiel (69 CHF/mois, engagement 3 mois)

#### Scénario 1 : Annulation pendant l'engagement (jour 30)
- ✅ Client est facturé mensuellement : Mois 1 ✅ → Mois 2 à venir
- ✅ Client peut demander l'annulation
- ✅ **Résultat** : Continuer à facturer les 2 mois restants de l'engagement
- ✅ Abonnement s'annule automatiquement après 3 mois

#### Scénario 2 : Pas d'annulation
- ✅ Client est facturé mensuellement : Mois 1 ✅ → Mois 2 ✅ → Mois 3 ✅
- ✅ Engagement de 3 mois respecté
- ✅ **Après l'engagement** : L'abonnement est automatiquement annulé à la fin de l'engagement
- ✅ Aucune facturation supplémentaire après la fin de l'engagement

#### Scénario 3 : Annulation après l'engagement (jour 120)
- ✅ Engagement terminé
- ✅ Client peut annuler
- ✅ **Résultat** : Annulation immédiate, aucun prélèvement futur

## 🔧 Configuration Technique

### 1. Création de la session Checkout

```typescript
// app/api/stripe/create-checkout-session/route.ts
subscription_data: {
  metadata: {
    duration_months: "3", // 3 mois d'engagement
    commitment_period: "true", // Marque comme engagement
  }
}
```

### 2. Gestion de l'annulation

**Annulation automatique** :
- ✅ **À la création** : L'abonnement est automatiquement programmé pour s'arrêter à la fin de l'engagement (`cancel_at`)
- ✅ **Stripe annule automatiquement** l'abonnement à la date programmée

**Annulation manuelle par le client** :
- ✅ **Si dans engagement** : L'annulation reste programmée à la fin de l'engagement (déjà configurée)
- ✅ **Si après engagement** : Annulation immédiate (bien que l'abonnement devrait déjà être annulé)

### 3. Webhooks

Le webhook `checkout.session.completed` :
- ✅ Programme automatiquement `cancel_at` à la fin de l'engagement lors de la création
- ✅ Enregistre la date de fin d'engagement en base de données

Le webhook `customer.subscription.updated` :
- ✅ Vérifie que l'annulation automatique est bien programmée
- ✅ S'assure que l'annulation correspond à la fin de l'engagement
- ✅ Programme l'annulation si elle n'est pas déjà définie
- ✅ Met à jour le statut en base de données

Le webhook `customer.subscription.deleted` :
- ✅ Met à jour le statut à 'CANCELED' quand Stripe annule automatiquement l'abonnement

### 4. Base de données

Colonnes ajoutées dans `subscriptions` :
```sql
cancelAtPeriodEnd: BOOLEAN
commitmentEndDate: TIMESTAMP
commitmentMonths: INTEGER
willCancelAfterCommitment: BOOLEAN
```

## 📋 Matrice des Plans

### Plan Coaching personnalisé (engagement 3 mois)

| Plan | Prix/mois | Engagement | Comportement |
|------|-----------|------------|--------------|
| Essentiel | 69 CHF | 3 mois | Facturation mensuelle, engagement minimal 3 mois |
| Avancé | 109 CHF | 3 mois | Facturation mensuelle, engagement minimal 3 mois |
| Premium | 149 CHF | 3 mois | Facturation mensuelle, engagement minimal 3 mois |

### Plan Autonomie en ligne

| Plan | Prix/mois | Engagement | Comportement |
|------|-----------|------------|--------------|
| Starter | 35 CHF | 2 mois | Facturation mensuelle, engagement minimal 2 mois |
| Pro | 30 CHF | 4 mois | Facturation mensuelle, engagement minimal 4 mois |
| Expert | 25 CHF | 6 mois | Facturation mensuelle, engagement minimal 6 mois |

## 🎨 Messages Utilisateur

### Lors de l'annulation pendant engagement

```
⚠️ Vous êtes dans une période d'engagement
Vous êtes engagé jusqu'au [DATE].
Vous continuerez à être facturé chaque mois jusqu'à cette date.
Après cette date, votre abonnement sera automatiquement annulé.
```

### Lors de l'annulation après engagement

```
Êtes-vous sûr de vouloir annuler votre abonnement ?
L'annulation sera immédiate et vous ne serez plus facturé.
```

## 🔑 Points Clés

1. **Facturation mensuelle continue** pendant l'engagement uniquement
2. **Engagement = période minimale de facturation** avec arrêt automatique à la fin
3. **Annulation automatique programmée** à la création de l'abonnement
4. **Annulation manuelle possible** mais engagement toujours dû
5. **Arrêt automatique** : L'abonnement est annulé automatiquement par Stripe à la fin de l'engagement

## 🚀 Actions Nécessaires dans Stripe Dashboard

### 1. Créer les Produits et Prix

Pour chaque plan, créer :
- **Produit** : Nom du plan
- **Prix** : Montant mensuel récurrent

Exemples :
- Essentiel - Accompagnement : 69 CHF/mois
- Avancé - Accompagnement : 109 CHF/mois
- etc.

### 2. Configurer les Webhooks

Écouter les événements suivants :
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

URL webhook : `https://votre-domaine.com/api/webhooks/stripe`

### 3. Exécuter le script SQL

```bash
psql your_database < scripts/add-commitment-fields.sql
```

## ✅ Tests à Effectuer

### Test 1 : Souscription normale
- [ ] Vérifier que l'abonnement est créé
- [ ] Vérifier que la date d'engagement est calculée
- [ ] Vérifier que le statut est ACTIVE

### Test 2 : Annulation pendant engagement
- [ ] Annuler l'abonnement au jour 1
- [ ] Vérifier que cancel_at est programmé à la fin de l'engagement
- [ ] Vérifier que les mois restants seront facturés
- [ ] Vérifier que le webhook met à jour willCancelAfterCommitment

### Test 3 : Arrêt automatique après engagement
- [ ] Laisser l'abonnement tourner jusqu'à la fin de l'engagement
- [ ] Vérifier que `cancel_at` est programmé à la fin de l'engagement
- [ ] Vérifier que l'abonnement est automatiquement annulé par Stripe à la fin de l'engagement
- [ ] Vérifier qu'aucune facturation supplémentaire n'est effectuée après l'engagement
- [ ] Vérifier que le webhook `customer.subscription.deleted` est déclenché

### Test 4 : Annulation après engagement
- [ ] Annuler après la fin de l'engagement
- [ ] Vérifier que l'arrêt est immédiat
- [ ] Vérifier qu'aucune facturation supplémentaire n'est effectuée
