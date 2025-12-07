# Configuration Gmail pour Supabase

## Problème actuel
Erreur 500 lors de l'inscription : "Error sending confirmation email"

## Solution : Configuration Gmail

### 1. Activer l'authentification à 2 facteurs
1. Allez sur https://myaccount.google.com/security
2. Activez la "Vérification en 2 étapes" si ce n'est pas déjà fait

### 2. Créer un mot de passe d'application
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Mail" comme application
3. Sélectionnez "Autre (nom personnalisé)" comme appareil
4. Tapez "Supabase" comme nom
5. Cliquez sur "Générer"
6. **COPIEZ LE MOT DE PASSE GÉNÉRÉ** (16 caractères sans espaces)

### 3. Configuration Supabase
Dans Supabase Dashboard → Authentication → Emails → SMTP Settings :

- **Enable Custom SMTP:** ✅ Activé
- **Host:** `smtp.gmail.com`
- **Port:** `587` (IMPORTANT: pas 465)
- **Username:** `baletdamien@gmail.com`
- **Password:** [Le mot de passe d'application de 16 caractères]
- **Sender email:** `baletdamien@gmail.com`
- **Sender name:** `Only You Coaching`

### 4. Configuration des URLs
Dans Supabase Dashboard → Authentication → URL Configuration :

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** 
  - `http://localhost:3000/auth/signin`
  - `http://localhost:3000/auth/callback`

### 5. Test
1. Sauvegardez la configuration SMTP
2. Testez l'inscription sur votre site
3. Vérifiez que l'email de confirmation arrive

## Dépannage

### Si l'erreur persiste :
1. Vérifiez les logs Supabase : Dashboard → Logs
2. Assurez-vous que le port 587 est utilisé (pas 465)
3. Vérifiez que le mot de passe d'application est correct
4. Testez avec un autre compte Gmail si nécessaire

### Alternative : Utiliser SendGrid
Si Gmail ne fonctionne pas, considérez utiliser SendGrid :
1. Créez un compte SendGrid gratuit
2. Générez une clé API
3. Configurez SendGrid dans Supabase


