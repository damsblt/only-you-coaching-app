# Guide du Mode Test

Ce guide explique comment utiliser le mode test pour contourner l'authentification Supabase tout en gardant le flux normal d'inscription et de paiement.

## 🚀 Activation du Mode Test

### 1. Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```bash
# Mode Test - Contourne l'authentification Supabase
NEXT_PUBLIC_TEST_MODE=true

# Supabase (garder les vraies valeurs pour le retour à la normale)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 2. Redémarrer le serveur de développement

```bash
npm run dev
```

## 🔄 Flux Normal en Mode Test

Le mode test utilise le flux normal d'inscription et de paiement, mais contourne l'authentification Supabase :

### 1. Inscription/Connexion
- Allez sur `/auth/signin`
- Entrez un email (ex: `test@test.com`)
- Cliquez sur "Se connecter" ou "S'inscrire"
- L'utilisateur est créé automatiquement dans la base de données Supabase

### 2. Redirection Automatique
- **Nouvel utilisateur** : Redirigé vers `/subscriptions` pour choisir un plan
- **Utilisateur existant** : Redirigé vers la page d'accueil

### 3. Paiement Stripe
- Le processus de paiement Stripe fonctionne normalement
- Les abonnements sont créés dans Stripe
- Les utilisateurs sont mis à jour dans la base de données

## 👥 Utilisateurs de Test

### Création Automatique
- Les utilisateurs sont créés automatiquement dans la table `users` de Supabase
- Pas besoin de gestion manuelle des utilisateurs
- Chaque email unique crée un nouvel utilisateur

### Utilisateur par Défaut
- **Email** : `test@test.com`
- **Nom** : `Test User`
- **Plan** : `essentiel` (par défaut)
- **Fonctionnalités** : Basées sur le plan choisi

## 📋 Plans Disponibles

### Plan Essentiel
- ✅ Vidéos
- ✅ Recettes
- ✅ Programmes prédéfinis
- ✅ 3 programmes personnalisés
- ✅ 2 appels de coaching
- ✅ Support email
- ✅ Bibliothèque audio
- ✅ Conseils nutrition
- ✅ Suivi des progrès

### Plan Premium
- ✅ Toutes les fonctionnalités du plan essentiel
- ✅ 10 programmes personnalisés
- ✅ 5 appels de coaching
- ✅ Support SMS
- ✅ Visite à domicile

### Plan VIP
- ✅ Toutes les fonctionnalités du plan premium
- ✅ Programmes personnalisés illimités
- ✅ Appels de coaching illimités

## 🔄 Retour au Mode Normal

Pour désactiver le mode test et revenir à l'authentification Supabase normale :

1. Modifiez le fichier `.env.local` :
   ```bash
   NEXT_PUBLIC_TEST_MODE=false
   ```

2. Redémarrez le serveur :
   ```bash
   npm run dev
   ```

## 🐛 Dépannage

### Le mode test ne s'active pas
- Vérifiez que `NEXT_PUBLIC_TEST_MODE=true` est bien dans votre `.env.local`
- Redémarrez le serveur de développement
- Videz le cache du navigateur

### Les utilisateurs ne sont pas créés
- Vérifiez que la base de données Supabase est accessible
- Vérifiez les logs de la console pour d'éventuelles erreurs
- Assurez-vous que `SUPABASE_SERVICE_ROLE_KEY` est correct

### Problèmes de fonctionnalités
- Les fonctionnalités sont basées sur les plans définis dans `lib/test-auth.ts`
- Vérifiez que l'utilisateur actuel a les bonnes permissions
- Les utilisateurs sont stockés dans la base de données Supabase

## 📁 Fichiers Modifiés

- `lib/test-auth.ts` - Système d'authentification de test avec base de données
- `components/providers/SupabaseAuthProvider.tsx` - Provider mis à jour pour le mode test
- `components/ProtectedContent.tsx` - Composants protégés mis à jour
- `app/auth/signin/page.tsx` - Page de connexion adaptée au mode test
- `app/api/test-users/route.ts` - API pour gérer les utilisateurs de test
- `app/api/test-users/[id]/route.ts` - API pour récupérer un utilisateur spécifique

## ⚠️ Important

- Le mode test ne fonctionne qu'en développement (`NODE_ENV === 'development'`)
- Les utilisateurs sont créés dans la base de données Supabase (table `users`)
- Le flux de paiement Stripe fonctionne normalement
- Ne jamais activer le mode test en production
- Pour revenir à l'authentification normale, changez `NEXT_PUBLIC_TEST_MODE` à `false`

## 🎯 Utilisation Recommandée

1. **Test rapide** : Utilisez `test@test.com` pour un test rapide
2. **Test de différents plans** : Créez des utilisateurs avec différents emails et testez les plans
3. **Test de paiement** : Utilisez les clés Stripe de test pour tester le processus de paiement
4. **Test de fonctionnalités** : Vérifiez que les fonctionnalités sont correctement accordées selon les plans
