# Configuration Email Supabase - Guide Rapide

## ✅ Mot de passe d'application créé
- **Application:** only-you-coaching-supabase
- **Mot de passe:** `xjvpgkesikxcfmyy` (sans espaces)

## 🔧 Configuration Supabase

### 1. Aller dans Supabase Dashboard
https://supabase.com/dashboard/project/otqyrsmxdtcvhueriwzp

### 2. Authentication → Emails → SMTP Settings

**Configuration à appliquer :**
```
✅ Enable Custom SMTP: Activé

Host: smtp.gmail.com
Port: 587
Username: baletdamien@gmail.com
Password: xjvpgkesikxcfmyy

Sender email: baletdamien@gmail.com
Sender name: Only You Coaching
```

### 3. Authentication → URL Configuration

**URLs à configurer :**
```
Site URL: http://localhost:3000

Redirect URLs:
- http://localhost:3000/auth/signin
- http://localhost:3000/auth/callback
```

### 4. Sauvegarder et tester

1. Cliquez sur "Save changes" dans SMTP Settings
2. Testez l'inscription sur votre site
3. Vérifiez que l'email de confirmation arrive

## 🧪 Test du flux complet

1. Allez sur `http://localhost:3000/subscriptions`
2. Cliquez sur "Choisir ce plan"
3. Créez un compte avec un email valide
4. Vérifiez votre boîte email
5. Cliquez sur le lien de confirmation
6. Vous devriez être redirigé vers la page de connexion avec un message de succès
7. Connectez-vous et le checkout devrait se lancer automatiquement

## 🚨 En cas de problème

Si l'erreur 500 persiste :
1. Vérifiez les logs Supabase : Dashboard → Logs
2. Assurez-vous que le port 587 est utilisé (pas 465)
3. Vérifiez que le mot de passe d'application est correct
4. Testez avec un autre compte Gmail si nécessaire


