# 🧪 Test Complet du Système de Codes Promo

## ✅ Préparation Terminée !

Les tables de base de données ont été créées et un code promo de test est prêt :

**Code de test créé :** `TEST20`
- 💰 Réduction : **20%**
- 🎯 Limite : 100 utilisations
- 📅 Valide jusqu'au : 20/02/2026
- 📝 Description : Code de test - 20% de réduction pour 30 jours

---

## 🎬 Scénario de Test Complet

### Partie 1️⃣ : Test Interface Admin (Marie-Line)

#### Étape 1 : Accéder à l'interface admin
```
🌐 URL : http://localhost:3000/admin/promo-codes
👤 Email : blmarieline@gmail.com
```

**Ce que vous devriez voir :**
```
┌────────────────────────────────────────────────────┐
│  🎫 Codes Promo                [+ Nouveau Code]    │
├────────────────────────────────────────────────────┤
│  📊 Statistiques                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │    1     │ │    0     │ │    1     │          │
│  │  Actifs  │ │   Uses   │ │  Total   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────┤
│  📋 Liste des Codes                                │
│  ┌──────────────────────────────────────────────┐ │
│  │ TEST20 │ 20% │ 0/100 │ Expire: 20/02/2026   │ │
│  │        │     │       │ ✅ Actif              │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

#### Étape 2 : Créer un nouveau code (optionnel)

1. **Cliquez sur** `+ Nouveau Code Promo`
2. **Remplissez le formulaire** :
   ```
   Code Promo *          : BIENVENUE10
   Type de Réduction *   : [Pourcentage (%)]
   Valeur *              : 10
   Utilisations Max      : (laissez vide pour illimité)
   Max par Utilisateur   : 1
   Plans Éligibles       : ☐ Tous (laissez tout décoché)
   Date de Début         : (aujourd'hui par défaut)
   Date d'Expiration     : (laissez vide)
   Description           : Code de bienvenue pour nouveaux clients
   
   ☑ Créer automatiquement le coupon dans Stripe
   ```
3. **Cliquez sur** `Créer le Code Promo`

**Résultat attendu :**
```
✅ Code promo créé avec succès !

Vous devriez maintenant voir 2 codes :
- TEST20 (20%)
- BIENVENUE10 (10%)
```

---

### Partie 2️⃣ : Test Checkout Client

#### Étape 3 : Sélectionner un plan

1. **Ouvrez** : `http://localhost:3000/souscriptions/personnalise`
2. **Sélectionnez le plan "Essentiel"** :
   ```
   ┌─────────────────────────────────┐
   │  Plan Essentiel                 │
   │  69 CHF / mois                  │
   │  • 3 séances personnalisées     │
   │  • Suivi mensuel                │
   │                                 │
   │         [S'abonner]             │
   └─────────────────────────────────┘
   ```
3. **Cliquez sur** `S'abonner`

#### Étape 4 : Page de Checkout

Vous arrivez sur : `http://localhost:3000/checkout?planId=essentiel`

**Layout de la page :**

```
┌──────────────────────────────────────────────────────┐
│  🏠 [← Retour aux abonnements]                       │
│  Finaliser votre commande                            │
├──────────────────┬───────────────────────────────────┤
│ COLONNE GAUCHE   │  COLONNE DROITE                   │
│                  │                                   │
│ 📦 Récapitulatif │  💳 Paiement sécurisé            │
│ ┌──────────────┐│  ┌─────────────────────────────┐ │
│ │ Plan Essentiel││  │ 🎫 Code Promo               │ │
│ │ 69 CHF       ││  │ [ENTREZ VOTRE CODE]  [✓]   │ │
│ │              ││  │                             │ │
│ │ ✓ Séances    ││  └─────────────────────────────┘ │
│ │ ✓ Suivi      ││                                   │
│ └──────────────┘│  ┌─────────────────────────────┐ │
│                  │  │ 💳 Carte bancaire           │ │
│ 👤 Informations  │  │ [4242 4242 4242 4242]      │ │
│ ┌──────────────┐│  │ MM/YY [12/28]  CVC [123]   │ │
│ │ Email: xxx   ││  │                             │ │
│ │ ✅ Connecté  ││  └─────────────────────────────┘ │
│ └──────────────┘│                                   │
│                  │  [Payer 69 CHF]                  │
└──────────────────┴───────────────────────────────────┘
```

#### Étape 5 : Appliquer le code promo TEST20

1. **Dans le champ "Code Promo"**, tapez : `TEST20`
2. **Cliquez sur** le bouton `✓ Appliquer`

**Animation (1-2 secondes) :**
```
🔄 Vérification...
```

**Résultat attendu :**
```
┌─────────────────────────────────────────┐
│  ✅ Code Promo Appliqué                 │
├─────────────────────────────────────────┤
│  🎫 TEST20                              │
│                                         │
│  Prix original:          69.00 CHF      │
│  Réduction (-20%):     -13.80 CHF      │
│  ───────────────────────────────────    │
│  Nouveau prix:          55.20 CHF      │
│                                  [❌]   │
└─────────────────────────────────────────┘
```

**ET le bouton de paiement change :**
```
Avant : [Payer 69 CHF]
Après : [Payer 55.20 CHF]
```

#### Étape 6 : Tester l'annulation du code

1. **Cliquez sur** le `❌` dans la carte verte
2. **Résultat** : Le code promo est retiré et le prix revient à 69 CHF

#### Étape 7 : Réappliquer et procéder au paiement

1. **Réentrez** `TEST20` et cliquez sur `Appliquer`
2. **Remplissez** les informations de carte de test :
   ```
   Numéro de carte : 4242 4242 4242 4242
   Date d'expiration : 12/28
   CVC : 123
   ```
3. **Cliquez sur** `Payer 55.20 CHF`

**Animation :**
```
⏳ Traitement du paiement...
```

**Page de succès :**
```
┌─────────────────────────────────────┐
│         ✅ Paiement réussi !        │
│                                     │
│  Votre abonnement est confirmé     │
│                                     │
│  Redirection...                    │
└─────────────────────────────────────┘
```

---

### Partie 3️⃣ : Vérification Admin

#### Étape 8 : Vérifier l'utilisation du code

1. **Retournez à** : `http://localhost:3000/admin/promo-codes`
2. **Observez le code TEST20** :

**Avant le test :**
```
│ TEST20 │ 20% │ 0/100 │ ✅ Actif │
```

**Après le test :**
```
│ TEST20 │ 20% │ 1/100 │ ✅ Actif │
                  ↑
           Compteur incrémenté !
```

#### Étape 9 : Voir les statistiques détaillées

1. **Cliquez sur** le code TEST20 dans le tableau
2. **Vous verriez** (si la page de détails était implémentée) :
   ```
   📊 Statistiques TEST20
   
   Total utilisations : 1
   Utilisateurs uniques : 1
   Réduction totale accordée : 13.80 CHF
   
   📋 Utilisations récentes :
   - Utilisateur XYZ | 21/01/2026 | -13.80 CHF
   ```

---

### Partie 4️⃣ : Tests de Validation

#### Test A : Code invalide

1. **Sur le checkout**, entrez : `CODEBIDON`
2. **Cliquez sur** `Appliquer`

**Résultat attendu :**
```
❌ Code promo invalide
```

#### Test B : Réutilisation du même code

1. **Créez un deuxième compte utilisateur**
2. **Répétez le processus** avec `TEST20`
3. **Résultat** : ✅ Le code fonctionne (limite par utilisateur = 1)

4. **Essayez d'utiliser TEST20 à nouveau** avec le même compte
5. **Résultat attendu :**
```
❌ Vous avez déjà utilisé ce code promo
```

#### Test C : Code inactif

1. **Dans l'admin**, cliquez sur le badge `✅ Actif` de TEST20
2. **Le badge devient** : `❌ Inactif`
3. **Essayez d'utiliser TEST20** au checkout
4. **Résultat attendu :**
```
❌ Ce code promo n'est plus actif
```

#### Test D : Code expiré

1. **Dans l'admin**, créez un code avec une date d'expiration passée
2. **Essayez de l'utiliser** au checkout
3. **Résultat attendu :**
```
❌ Ce code promo a expiré
```

---

## 🎯 Checklist de Test

### Interface Admin
- [ ] La page `/admin/promo-codes` se charge
- [ ] Le code TEST20 apparaît dans la liste
- [ ] Les statistiques s'affichent (1 actif, 0 utilisations, 1 total)
- [ ] Le bouton "Nouveau Code Promo" ouvre le modal
- [ ] La création d'un nouveau code fonctionne
- [ ] Le toggle actif/inactif fonctionne
- [ ] La suppression d'un code fonctionne

### Checkout Client
- [ ] Le champ code promo s'affiche
- [ ] La validation du code TEST20 fonctionne
- [ ] La réduction est correctement calculée (20% de 69 = 13.80)
- [ ] Le prix final s'affiche (55.20 CHF)
- [ ] Le bouton de paiement affiche le prix réduit
- [ ] Le code peut être retiré avant paiement
- [ ] Le paiement se complète avec succès

### Validations
- [ ] Code invalide → Message d'erreur
- [ ] Code inactif → Message d'erreur
- [ ] Code déjà utilisé → Message d'erreur
- [ ] Code expiré → Message d'erreur

### Stripe
- [ ] Si "Créer coupon Stripe" coché → Coupon créé dans Stripe
- [ ] La subscription dans Stripe montre la réduction
- [ ] Le montant facturé est le montant réduit

---

## 📸 Captures d'Écran à Prendre

1. **Admin - Liste des codes**
   - Avant utilisation (0/100)
   - Après utilisation (1/100)

2. **Checkout - Sans code promo**
   - Prix: 69 CHF

3. **Checkout - Avec code promo appliqué**
   - Prix barré: 69 CHF
   - Réduction: -13.80 CHF
   - Nouveau prix: 55.20 CHF

4. **Checkout - Erreur code invalide**
   - Message d'erreur rouge

5. **Page de succès**
   - Confirmation de paiement

6. **Stripe Dashboard** (optionnel)
   - Coupon créé
   - Subscription avec réduction

---

## 🔍 Vérifications Base de Données

### Voir le code promo créé
```sql
SELECT * FROM promo_codes WHERE code = 'TEST20';
```

### Voir l'historique d'utilisation
```sql
SELECT 
  pc.code,
  pcu.user_id,
  pcu.original_amount,
  pcu.discount_amount,
  pcu.final_amount,
  pcu.used_at
FROM promo_code_usage pcu
JOIN promo_codes pc ON pcu.promo_code_id = pc.id
WHERE pc.code = 'TEST20';
```

### Voir toutes les statistiques
```sql
SELECT 
  code,
  discount_type,
  discount_value,
  current_uses,
  max_uses,
  is_active
FROM promo_codes
ORDER BY created_at DESC;
```

---

## 🎉 Résultat Attendu

Si tout fonctionne correctement :

✅ **Interface Admin**
- Création de codes fluide
- Statistiques en temps réel
- Gestion facile (activer/désactiver/supprimer)

✅ **Checkout Client**
- Champ code promo visible et intuitif
- Validation instantanée
- Réduction clairement affichée
- Expérience utilisateur fluide

✅ **Intégration Stripe**
- Coupons créés automatiquement
- Réductions appliquées correctement
- Montants corrects facturés

✅ **Sécurité**
- Validations robustes
- Pas de contournement possible
- Limites respectées

---

## 🐛 Résolution de Problèmes

### Le code TEST20 n'apparaît pas dans l'admin
→ Vérifiez la console (F12) pour les erreurs
→ Vérifiez que DATABASE_URL est correcte dans .env.local

### Le code ne s'applique pas au checkout
→ Vérifiez que le code est actif
→ Vérifiez la date de validité
→ Ouvrez la console pour voir les erreurs API

### Erreur Stripe lors de la création
→ Vérifiez vos clés Stripe dans .env.local
→ Décochez "Créer coupon Stripe" pour tester sans Stripe

### Le compteur ne s'incrémente pas
→ Vérifiez que le paiement est complété avec succès
→ Vérifiez les logs de l'API /api/promo-codes/apply

---

## 📞 Support

En cas de problème :
1. ✅ Vérifiez que `npm run dev` est actif
2. ✅ Consultez la console du navigateur (F12)
3. ✅ Vérifiez les logs du terminal
4. ✅ Consultez `PROMO_CODES_GUIDE.md` pour plus de détails

---

## 🎯 Prochaines Étapes

Après avoir validé que tout fonctionne :

1. **Créer vos vrais codes promo** pour vos campagnes
2. **Partager les codes** avec vos clients
3. **Suivre les statistiques** d'utilisation
4. **Ajuster vos promotions** en fonction des résultats

---

**🎉 Bon test ! Le système est prêt à être utilisé en production !**
