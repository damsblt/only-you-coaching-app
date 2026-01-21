# 🚀 Configuration Resend dans Vercel - Guide Rapide

## ✅ Clé API Resend

**Clé API :** `re_JKxGAGB1_PJ15QtQoHCN8C4fCUyamgu2d`

## 📝 Étapes pour ajouter dans Vercel

### 1. Accéder aux variables d'environnement

1. Allez sur [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez le projet **pilates-app-v3-complete** (ou votre projet)
4. Cliquez sur **Settings** dans le menu de navigation
5. Cliquez sur **Environment Variables** dans le menu de gauche

### 2. Ajouter la variable

1. Cliquez sur le bouton **Add New** (ou **Add**)
2. Remplissez le formulaire :
   - **Key (Name):** `RESEND_API_KEY`
   - **Value:** `re_JKxGAGB1_PJ15QtQoHCN8C4fCUyamgu2d`
   - **Environment:** 
     - ✅ Cochez **Production**
     - ✅ Cochez **Preview** (optionnel mais recommandé)
     - ✅ Cochez **Development** (optionnel mais recommandé)
3. Cliquez sur **Save**

### 3. Redéployer l'application

**⚠️ IMPORTANT :** Les nouvelles variables d'environnement ne sont appliquées qu'après un redéploiement.

#### Option A : Redéploiement manuel
1. Allez dans l'onglet **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points (⋯)** à droite
4. Sélectionnez **Redeploy**
5. Confirmez le redéploiement

#### Option B : Déclencher un nouveau déploiement
- Faites un commit et push sur votre branche principale
- Vercel redéploiera automatiquement avec les nouvelles variables

### 4. Vérifier la configuration

Après le redéploiement, vous pouvez vérifier que la variable est bien configurée :

1. Allez dans **Settings** > **Environment Variables**
2. Vérifiez que `RESEND_API_KEY` apparaît dans la liste
3. Testez le formulaire de contact sur votre site
4. Vérifiez que l'email arrive bien à `info@only-you-coaching.com`

## 🧪 Test

Pour tester que tout fonctionne :

1. Allez sur la page de contact de votre site
2. Remplissez le formulaire avec des données de test
3. Envoyez le formulaire
4. Vérifiez que :
   - Le message de confirmation s'affiche pendant 8 secondes
   - L'email arrive dans la boîte `info@only-you-coaching.com`
   - L'email contient toutes les informations du formulaire

## 🔍 Dépannage

### Si l'email n'arrive pas :

1. **Vérifiez les logs Vercel :**
   - Allez dans **Deployments** > Sélectionnez le dernier déploiement > **Functions** > `/api/contact`
   - Vérifiez s'il y a des erreurs

2. **Vérifiez que la variable est bien configurée :**
   - Dans Vercel, allez dans **Settings** > **Environment Variables**
   - Vérifiez que `RESEND_API_KEY` est présente et correcte

3. **Vérifiez le dashboard Resend :**
   - Allez sur [https://resend.com/emails](https://resend.com/emails)
   - Vérifiez si les emails sont envoyés et leur statut

4. **Vérifiez les spams :**
   - L'email peut être dans le dossier spam de `info@only-you-coaching.com`

## 📧 Configuration actuelle

- **Service:** Resend
- **Email de destination:** `info@only-you-coaching.com`
- **Email d'envoi:** `onboarding@resend.dev` (par défaut)
- **Durée d'affichage du message de confirmation:** 8 secondes

## 🔐 Sécurité

⚠️ **Important :** Ne partagez jamais votre clé API publiquement. Cette clé est déjà dans ce fichier de documentation, mais assurez-vous que ce fichier n'est pas commité dans un dépôt public.
