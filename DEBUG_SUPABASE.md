# Debug Supabase - Erreur 500 Signup

## Étapes de diagnostic

### 1. Vérifier les logs Supabase
1. Allez sur https://supabase.com/dashboard/project/otqyrsmxdtcvhueriwzp
2. Cliquez sur "Logs" dans la sidebar gauche
3. Filtrez par "Auth" ou "Error"
4. Cherchez les erreurs récentes lors de l'inscription

### 2. Vérifier la configuration de la base de données
1. Allez sur "Database" → "Tables"
2. Vérifiez que la table `auth.users` existe
3. Vérifiez s'il y a des triggers ou des fonctions qui pourraient causer l'erreur

### 3. Tester l'API directement
```bash
curl -X POST 'https://otqyrsmxdtcvhueriwzp.supabase.co/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "options": {
      "emailRedirectTo": "http://localhost:3000/auth/signin"
    }
  }'
```

### 4. Vérifier les variables d'environnement
Assurez-vous que ces variables sont correctement définies :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Solutions possibles

#### A. Problème SMTP
- Changer le port de 465 à 587
- Utiliser un mot de passe d'application Gmail
- Vérifier que l'authentification 2FA est activée

#### B. Problème de base de données
- Vérifier les contraintes de la table auth.users
- Désactiver temporairement les triggers
- Vérifier les permissions

#### C. Problème de configuration
- Vérifier les URLs de redirection
- Vérifier les domaines autorisés
- Tester avec une URL de redirection différente


