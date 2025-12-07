# Mise à jour des clés Stripe

## ⚠️ Action requise : Mettre à jour les variables d'environnement Stripe

Les clés Stripe suivantes doivent être mises à jour dans votre fichier `.env.local` (pour le développement local) et dans les paramètres Vercel (pour la production).

### Clés Stripe à mettre à jour

```bash
# Clé publique Stripe (pour le client)
STRIPE_PUBLISHABLE_KEY="pk_test_51S9oMQRnELGaRIkTw1uJb73gBmnwOgvMKtpciOV5IGM4iKGAFRxtK4I0oWvplL1P1kCF70Msglct4u0kxtv2kmD300y5qLrUvE"

# Clé publique Stripe (Next.js - variable publique)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51S9oMQRnELGaRIkTw1uJb73gBmnwOgvMKtpciOV5IGM4iKGAFRxtK4I0oWvplL1P1kCF70Msglct4u0kxtv2kmD300y5qLrUvE"

# Clé secrète Stripe (pour les API server-side)
STRIPE_SECRET_KEY="sk_test_51S9oMQRnELGaRIkTpG9KHv2n784wJjfOnRUqhyCuRxRUz2GOxQkzceb9tQZ6U8O7L6QZpru22wRJ0fprqEJ8KTCb00JZCUCBNu"

# Secret webhook Stripe
STRIPE_WEBHOOK_SECRET="whsec_tEWl3g7vE6JuNFCWGrZZ7AAl6u1J4cux"
```

## 📝 Instructions

### 1. Développement local (.env.local)

Ajoutez ou mettez à jour ces variables dans votre fichier `.env.local` à la racine du projet :

```bash
# .env.local
STRIPE_PUBLISHABLE_KEY="pk_test_51S9oMQRnELGaRIkTw1uJb73gBmnwOgvMKtpciOV5IGM4iKGAFRxtK4I0oWvplL1P1kCF70Msglct4u0kxtv2kmD300y5qLrUvE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51S9oMQRnELGaRIkTw1uJb73gBmnwOgvMKtpciOV5IGM4iKGAFRxtK4I0oWvplL1P1kCF70Msglct4u0kxtv2kmD300y5qLrUvE"
STRIPE_SECRET_KEY="sk_test_51S9oMQRnELGaRIkTpG9KHv2n784wJjfOnRUqhyCuRxRUz2GOxQkzceb9tQZ6U8O7L6QZpru22wRJ0fprqEJ8KTCb00JZCUCBNu"
STRIPE_WEBHOOK_SECRET="whsec_tEWl3g7vE6JuNFCWGrZZ7AAl6u1J4cux"
```

**Important** : Après avoir mis à jour `.env.local`, redémarrez votre serveur de développement :
```bash
npm run dev
```

### 2. Production (Vercel)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Environment Variables**
4. Mettez à jour ou ajoutez ces variables :
   - `STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
5. Redéployez l'application pour que les nouvelles variables prennent effet

## ✅ Vérification

Pour vérifier que les clés sont correctement configurées, vous pouvez :

1. Visiter `/debug-env` sur votre application
2. Ou utiliser le script de vérification :
   ```bash
   node scripts/check-env.js
   ```

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ne commitez jamais votre fichier `.env.local` dans Git. Ce fichier est déjà dans `.gitignore`.

Ces clés sont des clés de **test**. Pour la production, utilisez les clés **live** de Stripe.

## 📌 Notes

- `STRIPE_PUBLISHABLE_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` doivent avoir la même valeur (clé publique)
- La clé publique peut être exposée dans le code client (d'où le préfixe `NEXT_PUBLIC_`)
- La clé secrète ne doit jamais être exposée au client
- Le webhook secret est utilisé pour valider les événements Stripe

