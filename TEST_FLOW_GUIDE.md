# Guide de Test - Flux Complet de Souscription

## 🎯 Objectif
Tester le parcours utilisateur complet depuis la sélection d'un abonnement jusqu'à l'accès aux programmes.

## ✅ Résultats des Tests Automatiques

Tous les composants principaux sont fonctionnels :
- ✅ Page d'accueil accessible
- ✅ Page des abonnements accessible  
- ✅ Inscription utilisateur fonctionnelle
- ✅ Connexion utilisateur fonctionnelle
- ✅ Configuration Stripe opérationnelle
- ✅ 6 produits Stripe configurés avec prix mensuels
- ✅ Page de checkout accessible
- ✅ Page de succès accessible

## 🧪 Test Manuel Complet

### Étape 1: Accès à l'application
1. Ouvrez votre navigateur
2. Allez sur `http://localhost:3000`
3. ✅ Vérifiez que la page d'accueil se charge correctement
4. ✅ Vérifiez que le bouton "JE VEUX UN ABONNEMENT !" est visible

### Étape 2: Sélection d'un abonnement
1. Cliquez sur "JE VEUX UN ABONNEMENT !"
2. ✅ Vérifiez que vous arrivez sur `/subscriptions`
3. ✅ Vérifiez que les 6 plans sont affichés :
   - **Plans Coaching personnalisé** : Essentiel (69 CHF/mois), Avancé (109 CHF/mois), Premium (149 CHF/mois)
   - **Plans Autonomie en ligne** : Starter (35 CHF/mois), Pro (30 CHF/mois), Expert (25 CHF/mois)
4. ✅ Vérifiez que les prix affichent bien "/mois" et les durées d'engagement

### Étape 3: Test d'inscription (nouvel utilisateur)
1. Cliquez sur "Choisir ce plan" pour le plan **Essentiel**
2. ✅ Vérifiez que vous arrivez sur `/auth/signup`
3. Remplissez le formulaire :
   - Prénom : `Test`
   - Nom : `User`
   - Email : `test-${Date.now()}@example.com`
   - Mot de passe : `testpassword123`
   - Confirmer mot de passe : `testpassword123`
   - ✅ Cochez "J'accepte les conditions d'utilisation"
4. Cliquez sur "Créer mon compte"
5. ✅ Vérifiez que vous voyez le message de succès
6. ✅ Vérifiez que l'email de confirmation est mentionné

### Étape 4: Connexion et redirection automatique
1. Cliquez sur "Se connecter"
2. ✅ Vérifiez que vous arrivez sur `/auth/signin`
3. Entrez vos identifiants :
   - Email : celui utilisé à l'étape 3
   - Mot de passe : `testpassword123`
4. Cliquez sur "Se connecter"
5. ✅ Vérifiez que vous êtes redirigé vers `/subscriptions`
6. ✅ Vérifiez que le plan sélectionné est indiqué

### Étape 5: Processus de paiement
1. Cliquez sur "Choisir ce plan" pour le plan **Essentiel**
2. ✅ Vérifiez que vous arrivez sur `/checkout`
3. ✅ Vérifiez que le récapitulatif du plan est affiché
4. ✅ Vérifiez que vos informations utilisateur sont affichées
5. Dans le formulaire de paiement Stripe, utilisez les données de test :
   - **Numéro de carte** : `4242 4242 4242 4242`
   - **Date d'expiration** : `12/25` (ou toute date future)
   - **CVC** : `123`
   - **Code postal** : `12345`
6. Cliquez sur "Payer 69 CHF/mois"
7. ✅ Vérifiez que le paiement est traité
8. ✅ Vérifiez que vous arrivez sur `/subscriptions/success`

### Étape 6: Vérification de l'accès
1. ✅ Vérifiez que la page de succès affiche "Félicitations !"
2. ✅ Vérifiez que les prochaines étapes sont listées
3. Cliquez sur "Accéder à mes vidéos"
4. ✅ Vérifiez que vous arrivez sur `/videos`
5. ✅ Vérifiez que vous pouvez accéder au contenu (si protégé par abonnement)

### Étape 7: Test de connexion (utilisateur existant)
1. Déconnectez-vous (si possible) ou ouvrez une fenêtre privée
2. Allez sur `http://localhost:3000/subscriptions`
3. Cliquez sur "Choisir ce plan" pour le plan **Starter**
4. ✅ Vérifiez que vous arrivez sur `/auth/signin`
5. Entrez les identifiants de l'utilisateur créé précédemment
6. ✅ Vérifiez que vous êtes redirigé vers le checkout automatiquement

## 🔧 Données de Test Stripe

### Cartes de test valides :
- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

### Informations communes :
- **Date d'expiration** : `12/25` (ou toute date future)
- **CVC** : `123`
- **Code postal** : `12345`

## 🐛 Points de Vérification

### Configuration Stripe
- ✅ Les produits sont créés avec les bons noms
- ✅ Les prix sont configurés en mensuel (`interval_count: 1`)
- ✅ Les montants correspondent à la matrice des prix
- ✅ Les métadonnées d'engagement sont présentes

### Flux Utilisateur
- ✅ Redirection automatique après inscription/connexion
- ✅ Persistance du plan sélectionné dans l'URL
- ✅ Messages d'erreur clairs
- ✅ Interface responsive

### Sécurité
- ✅ Validation des données côté serveur
- ✅ Gestion des erreurs Stripe
- ✅ Protection des informations sensibles

## 📊 Métriques de Succès

- **Temps de chargement** : < 3 secondes par page
- **Taux de conversion** : Test réussi de bout en bout
- **Erreurs** : Aucune erreur bloquante
- **UX** : Parcours fluide et intuitif

## 🚨 Problèmes Potentiels

### Si le paiement échoue :
1. Vérifiez les logs Stripe dans le dashboard
2. Vérifiez les logs de l'application
3. Testez avec une autre carte de test

### Si la redirection ne fonctionne pas :
1. Vérifiez les paramètres d'URL
2. Vérifiez l'état d'authentification
3. Vérifiez les cookies de session

### Si l'accès au contenu est refusé :
1. Vérifiez que l'abonnement est bien créé en base
2. Vérifiez les webhooks Stripe
3. Vérifiez la logique d'autorisation

## 🎉 Conclusion

Le flux complet de souscription est **opérationnel** et prêt pour les tests utilisateurs réels !

**Prochaines étapes recommandées :**
1. Tests avec de vrais utilisateurs
2. Monitoring des métriques de conversion
3. Optimisation UX basée sur les retours
4. Tests de charge pour la production
