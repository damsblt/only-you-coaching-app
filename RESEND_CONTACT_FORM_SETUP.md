# Configuration du formulaire de contact avec Resend

## 📧 Configuration Resend

Le formulaire de contact utilise maintenant **Resend** pour envoyer les emails vers `info@only-you-coaching.com`.

## ✅ Clé API Resend

**Clé API configurée :** `[REDACTED_RESEND_KEY]`

### Configuration dans Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **pilates-app-v3-complete** (ou le nom de votre projet)
3. Allez dans **Settings** > **Environment Variables**
4. Cliquez sur **Add New**
5. Ajoutez la variable :
   - **Name:** `RESEND_API_KEY`
   - **Value:** `[REDACTED_RESEND_KEY]`
   - **Environment:** Cochez **Production**, **Preview**, et **Development** (ou au minimum Production)
6. Cliquez sur **Save**
7. **Important :** Redéployez l'application pour que la variable prenne effet :
   - Allez dans l'onglet **Deployments**
   - Cliquez sur les 3 points (⋯) du dernier déploiement
   - Sélectionnez **Redeploy**

### Configuration locale (.env.local)

Pour le développement local, ajoutez la clé API dans votre fichier `.env.local` à la racine du projet :

```bash
RESEND_API_KEY=[REDACTED_RESEND_KEY]
```

**Important** : Après avoir ajouté la variable, redémarrez votre serveur de développement :
```bash
npm run dev
```

### 4. Vérifier votre domaine (optionnel mais recommandé)

Pour utiliser votre propre domaine dans l'email d'envoi (au lieu de `onboarding@resend.dev`) :

1. Dans Resend Dashboard, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Ajoutez `only-you-coaching.com`
4. Suivez les instructions pour vérifier votre domaine (ajout de records DNS)
5. Une fois vérifié, mettez à jour `app/api/contact/route.ts` :
   ```typescript
   from: 'Only You Coaching <contact@only-you-coaching.com>',
   ```

## ✅ Test

Pour tester le formulaire :

1. Assurez-vous que `RESEND_API_KEY` est configurée
2. Allez sur la page de contact de votre site
3. Remplissez et envoyez le formulaire
4. Vérifiez que l'email arrive bien à `info@only-you-coaching.com`

## 🔧 Configuration actuelle

- **Email de destination:** `info@only-you-coaching.com`
- **Email d'envoi:** `onboarding@resend.dev` (par défaut, jusqu'à ce que le domaine soit vérifié)
- **Durée d'affichage du message de confirmation:** 8 secondes

## 📝 Notes

- Le formulaire envoie un email HTML formaté avec toutes les informations du formulaire
- L'email inclut un `replyTo` avec l'email du visiteur pour faciliter la réponse
- En cas d'erreur, un message d'erreur s'affiche à l'utilisateur
- Les emails sont envoyés en HTML et en texte brut pour une meilleure compatibilité
