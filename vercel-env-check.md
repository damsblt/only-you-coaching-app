# 🔍 Vérification des Variables d'Environnement Vercel

## ✅ Variables Présentes dans Vercel

1. `STRIPE_WEBHOOK_SECRET` ✅
2. `AWS_REGION` ✅
3. `AWS_S3_BUCKET_NAME` ✅
4. `SUPABASE_SERVICE_ROLE_KEY` ✅
5. `DATABASE_URL` ✅
6. `PRISMA_DISABLE_PREPARED_STATEMENTS` ✅
7. `AWS_SECRET_ACCESS_KEY` ✅
8. `AWS_ACCESS_KEY_ID` ✅
9. `NEXTAUTH_URL` ✅
10. `NEXTAUTH_SECRET` ✅
11. `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
12. `NEXT_PUBLIC_SUPABASE_URL` ✅

## ❌ Variables MANQUANTES dans Vercel

### 🔴 Critiques (requises pour le fonctionnement)

1. **`STRIPE_SECRET_KEY`** ❌
   - **Utilisée dans:** 
     - `app/api/stripe/create-checkout-session/route.ts`
     - `app/api/webhooks/stripe/route.ts`
     - `app/api/sync-stripe-subscription/route.ts`
     - `app/api/stripe/create-subscription-direct/route.ts`
     - `app/api/stripe/create-subscription/route.ts`
     - `app/api/stripe/products/route.ts`
     - `app/api/stripe/cancel-subscription/route.ts`
     - `app/api/stripe/create-payment-intent/route.ts`
     - `app/api/debug-stripe-sync/route.ts`
   - **Impact:** Toutes les fonctionnalités de paiement Stripe ne fonctionneront pas
   - **Solution:** Ajouter la clé secrète Stripe depuis le dashboard Stripe

2. **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** ❌
   - **Utilisée dans:**
     - `app/debug-env/page.tsx`
     - `app/debug-stripe/page.tsx`
     - `components/stripe/StripeCheckoutForm.tsx` (probablement)
   - **Impact:** Les composants Stripe côté client ne fonctionneront pas
   - **Solution:** Ajouter la clé publique Stripe depuis le dashboard Stripe

### ⚠️ Recommandées (améliorent le fonctionnement)

3. **`NEXT_PUBLIC_SITE_URL`** ⚠️
   - **Utilisée dans:**
     - `app/api/stripe/create-checkout-session/route.ts` (URLs de redirection)
     - `app/debug-auth/page.tsx`
     - `app/test-email/page.tsx`
     - `lib/supabase.ts` (URLs de redirection auth)
   - **Impact:** Les URLs de redirection pourraient être incorrectes
   - **Solution:** Ajouter l'URL du site en production (ex: `https://only-you-coaching.vercel.app`)

## 📝 Commandes pour Ajouter les Variables Manquantes

```bash
# Ajouter STRIPE_SECRET_KEY
vercel env add STRIPE_SECRET_KEY production

# Ajouter NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# Ajouter NEXT_PUBLIC_SITE_URL
vercel env add NEXT_PUBLIC_SITE_URL production
```

## 🔗 Où Trouver les Valeurs

### Stripe Keys
1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copier:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
3. Utiliser les clés de **production** pour l'environnement Production

### Site URL
- Pour production: `https://only-you-coaching.vercel.app` (ou votre domaine personnalisé)
- Utiliser le domaine exact de votre déploiement Vercel

## ⚡ Impact des Variables Manquantes

- **Sans `STRIPE_SECRET_KEY`**: ❌ Toutes les API Stripe échoueront (création de checkout, webhooks, abonnements, etc.)
- **Sans `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**: ❌ Les formulaires de paiement côté client ne fonctionneront pas
- **Sans `NEXT_PUBLIC_SITE_URL`**: ⚠️ Les URLs de redirection pourraient pointer vers localhost au lieu de votre domaine

## ✅ Résumé

**Variables critiques à ajouter:** 2
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Variables recommandées:** 1
- `NEXT_PUBLIC_SITE_URL`








