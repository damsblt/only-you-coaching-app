# Résolution du problème SMTP Supabase

## 🚨 Problème actuel
Erreur: "Error sending confirmation email" - AuthApiError

## ✅ Solution temporaire appliquée
- Email de confirmation désactivé temporairement
- L'inscription fonctionne maintenant sans erreur
- L'utilisateur peut se connecter immédiatement

## 🔧 Résolution définitive du problème SMTP

### Option 1: Corriger la configuration Gmail

1. **Vérifier la configuration dans Supabase Dashboard :**
   - Authentication → Emails → SMTP Settings
   - **IMPORTANT:** Changer le port de `465` à `587`
   - Host: `smtp.gmail.com`
   - Port: `587` (pas 465)
   - Username: `baletdamien@gmail.com`
   - Password: `xjvpgkesikxcfmyy`

2. **Vérifier les paramètres Gmail :**
   - L'authentification 2FA doit être activée
   - Le mot de passe d'application doit être correct
   - Tester avec un autre compte Gmail si nécessaire

### Option 2: Utiliser SendGrid (Recommandé)

SendGrid est plus fiable que Gmail pour les emails transactionnels :

1. **Créer un compte SendGrid :**
   - Allez sur https://sendgrid.com
   - Créez un compte gratuit (100 emails/jour)
   - Vérifiez votre email

2. **Créer une clé API :**
   - Settings → API Keys
   - Create API Key
   - Full Access
   - Copiez la clé générée

3. **Configurer dans Supabase :**
   - Authentication → Emails → SMTP Settings
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: `[VOTRE_CLE_API_SENDGRID]`

### Option 3: Utiliser Resend (Alternative moderne)

1. **Créer un compte Resend :**
   - Allez sur https://resend.com
   - Créez un compte gratuit
   - Vérifiez votre domaine

2. **Configurer dans Supabase :**
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: `[VOTRE_CLE_API_RESEND]`

## 🧪 Test de la solution

Une fois la configuration SMTP corrigée :

1. **Réactiver l'email de confirmation :**
   ```typescript
   // Dans lib/supabase-auth.ts
   emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/signin`
   ```

2. **Tester le flux complet :**
   - Inscription → Email reçu → Clic sur le lien → Connexion → Checkout

## 📊 Avantages de chaque solution

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| Gmail | Gratuit, familier | Limites strictes, moins fiable |
| SendGrid | Très fiable, 100 emails/jour gratuit | Configuration plus complexe |
| Resend | Moderne, API simple | Nouveau service |

## 🎯 Recommandation

**Pour la production :** Utilisez SendGrid ou Resend
**Pour le développement :** La solution temporaire actuelle fonctionne parfaitement


