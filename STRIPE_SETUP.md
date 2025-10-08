# 💳 Configuration Stripe - Only You Coaching

> Guide complet pour configurer les 6 plans d'abonnement dans Stripe

---

## 🎯 Vue d'Ensemble

Only You Coaching propose **6 plans d'abonnement** répartis en 2 catégories :

### **Plans avec Accompagnement** (Coaching)
1. **Essentiel** - 69 CHF/mois (engagement et renouvellement 3 mois)
2. **Avancé** - 109 CHF/mois (engagement et renouvellement 3 mois)
3. **Premium** - 149 CHF/mois (engagement et renouvellement 3 mois)

### **Plans en Autonomie** (Sans coaching)
4. **Starter** - 35 CHF/mois (engagement et renouvellement 2 mois)
5. **Pro** - 30 CHF/mois (engagement et renouvellement 4 mois)
6. **Expert** - 25 CHF/mois (engagement et renouvellement 6 mois)

---

## 🔧 Prérequis

1. **Compte Stripe** : https://dashboard.stripe.com/register
2. **Mode Test** activé pour développement
3. **Webhook endpoint** configuré (voir section Webhooks)

---

## 📦 Création des Produits

### **Étape 1 : Créer les Produits dans Stripe**

#### **1. Essentiel - 69 CHF/mois**

```bash
# Via Stripe Dashboard:
1. Aller sur: https://dashboard.stripe.com/test/products
2. Cliquer "Add Product"
3. Remplir:
   - Name: "Plan Essentiel - Accompagnement"
   - Description: "Accès vidéos + recettes + programmes + 3 programmes personnalisés + 1 appel coaching/mois + support"
   - Statement descriptor: "OYCOACHING-ESS"
   
4. Prix:
   - Model: "Standard pricing"
   - Price: 69.00
   - Currency: CHF (Franc Suisse)
   - Billing period: Monthly
   - Usage type: Licensed
   
5. Save product

6. ✅ Copier le Price ID: price_xxxxxxxxxxxxx
   → Mettre dans .env.local comme STRIPE_ESSENTIEL_PRICE_ID
```

#### **2. Avancé - 109 CHF/mois**

```bash
1. Add Product
2. Remplir:
   - Name: "Plan Avancé - Accompagnement"
   - Description: "Tous les avantages Essentiel + audios guidés + conseil nutritionnel + suivi progrès"
   - Statement descriptor: "OYCOACHING-AVA"
   
3. Prix:
   - Price: 109.00 CHF
   - Billing: Monthly
   
4. Save

5. ✅ Copier Price ID → STRIPE_AVANCE_PRICE_ID
```

#### **3. Premium - 149 CHF/mois**

```bash
1. Add Product
2. Remplir:
   - Name: "Plan Premium - Accompagnement"
   - Description: "Tous les avantages Avancé + 1 visite à domicile"
   - Statement descriptor: "OYCOACHING-PRE"
   
3. Prix:
   - Price: 149.00 CHF
   - Billing: Monthly
   
4. Save

5. ✅ Copier Price ID → STRIPE_PREMIUM_PRICE_ID
```

#### **4. Starter - 35 CHF/mois (2 mois)**

```bash
1. Add Product
2. Remplir:
   - Name: "Plan Starter - Autonomie"
   - Description: "Accès vidéos + audios + recettes (2 mois)"
   - Statement descriptor: "OYCOACHING-STA"
   
3. Prix:
   - Price: 35.00 CHF
   - Billing: Monthly
   
4. Advanced options:
   ⚠️ IMPORTANT pour durée fixe de 2 mois:
   - Cliquer "Add another price"
   - OU utiliser Stripe API pour créer avec metadata
   
5. Save

6. ✅ Copier Price ID → STRIPE_STARTER_PRICE_ID

Note: La limitation à 2 mois sera gérée dans le code via:
- subscription_schedule (Stripe API)
- OU metadata + webhook logic
```

#### **5. Pro - 30 CHF/mois (4 mois)**

```bash
1. Add Product
2. Remplir:
   - Name: "Plan Pro - Autonomie"
   - Description: "Accès complet: vidéos + programmes + audios + recettes (4 mois)"
   - Statement descriptor: "OYCOACHING-PRO"
   
3. Prix:
   - Price: 30.00 CHF
   - Billing: Monthly
   
4. Metadata (pour durée fixe):
   - duration_months: 4
   
5. Save

6. ✅ Copier Price ID → STRIPE_PRO_PRICE_ID
```

#### **6. Expert - 25 CHF/mois (6 mois)**

```bash
1. Add Product
2. Remplir:
   - Name: "Plan Expert - Autonomie"
   - Description: "Accès complet: vidéos + programmes + audios + recettes (6 mois)"
   - Statement descriptor: "OYCOACHING-EXP"
   
3. Prix:
   - Price: 25.00 CHF
   - Billing: Monthly
   
4. Metadata:
   - duration_months: 6
   
5. Save

6. ✅ Copier Price ID → STRIPE_EXPERT_PRICE_ID
```

---

## 🔑 Configuration Variables d'Environnement

### **Créer `.env.local`**

```bash
# ==========================================
# STRIPE - Test Keys
# ==========================================
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxx"

# Price IDs - Plans Accompagnement
STRIPE_ESSENTIEL_PRICE_ID="price_1xxxxxxxxxxxxx"
STRIPE_AVANCE_PRICE_ID="price_1xxxxxxxxxxxxx"
STRIPE_PREMIUM_PRICE_ID="price_1xxxxxxxxxxxxx"

# Price IDs - Plans Autonomie
STRIPE_STARTER_PRICE_ID="price_1xxxxxxxxxxxxx"
STRIPE_PRO_PRICE_ID="price_1xxxxxxxxxxxxx"
STRIPE_EXPERT_PRICE_ID="price_1xxxxxxxxxxxxx"

# Webhook
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"
```

---

## 🪝 Configuration Webhooks

### **Créer un Webhook Endpoint**

```bash
1. Aller sur: https://dashboard.stripe.com/test/webhooks
2. Cliquer "Add endpoint"
3. Endpoint URL:
   - Dev: http://localhost:3000/api/webhooks/stripe
   - Prod: https://only-you-coaching.com/api/webhooks/stripe
   
4. Events à écouter:
   ✅ checkout.session.completed
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.paid
   ✅ invoice.payment_failed
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   
5. Save

6. ✅ Copier "Signing secret": whsec_xxxxx
   → Mettre dans .env.local comme STRIPE_WEBHOOK_SECRET
```

### **Tester les Webhooks localement**

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks vers localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# ✅ Copier le webhook secret affiché
# Tester un webhook
stripe trigger checkout.session.completed
```

---

## 💻 Implémentation Code

### **1. Créer `/src/app/api/stripe/create-checkout-session/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Map des plans avec leurs caractéristiques
const PLANS_CONFIG = {
  essentiel: {
    priceId: process.env.STRIPE_ESSENTIEL_PRICE_ID!,
    category: 'accompagnement',
    duration: null, // Récurrent infini
  },
  avance: {
    priceId: process.env.STRIPE_AVANCE_PRICE_ID!,
    category: 'accompagnement',
    duration: null,
  },
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    category: 'accompagnement',
    duration: null,
  },
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    category: 'autonomie',
    duration: 2, // 2 mois fixes
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    category: 'autonomie',
    duration: 4, // 4 mois fixes
  },
  expert: {
    priceId: process.env.STRIPE_EXPERT_PRICE_ID!,
    category: 'autonomie',
    duration: 6, // 6 mois fixes
  },
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await req.json()
    const plan = PLANS_CONFIG[planId as keyof typeof PLANS_CONFIG]
    
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Créer la session Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email!,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscriptions`,
      metadata: {
        userId: session.user.id,
        planId: planId,
        category: plan.category,
        duration: plan.duration?.toString() || 'unlimited',
      },
      // Pour plans à durée fixe
      ...(plan.duration && {
        subscription_data: {
          metadata: {
            duration_months: plan.duration.toString(),
            end_behavior: 'cancel', // Annuler après la durée
          },
        },
      }),
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### **2. Créer `/src/app/api/webhooks/stripe/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Gérer les événements
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      // Créer la subscription dans la DB
      await supabase.from('subscriptions').insert({
        user_id: session.metadata?.userId,
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        plan_id: session.metadata?.planId,
        status: 'active',
        current_period_start: new Date(),
      })

      // Si durée fixe, planifier l'annulation
      const durationMonths = session.metadata?.duration_months
      if (durationMonths) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        
        // Calculer date de fin
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + parseInt(durationMonths))
        
        // Mettre à jour pour annuler à la fin
        await stripe.subscriptions.update(subscription.id, {
          cancel_at: Math.floor(endDate.getTime() / 1000),
        })
      }
      
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000),
        })
        .eq('stripe_subscription_id', subscription.id)
      
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', invoice.subscription as string)
      
      // TODO: Envoyer email à l'utilisateur
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### **3. Page Subscriptions `/src/app/subscriptions/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    id: 'essentiel',
    category: 'accompagnement',
    name: 'Essentiel',
    price: 69,
    duration: 'récurrent',
    features: [
      'Accès à la bibliothèque de vidéos',
      'Accès à "mes recettes"',
      'Accès aux programmes prédéfinis',
      '3 Programmes personnalisés',
      '1 appel coaching/mois (30 min)',
      'Support SMS/Mail 5j/sem',
    ],
  },
  // ... autres plans
]

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      
      const { url } = await res.json()
      
      if (url) {
        window.location.href = url // Redirection vers Stripe Checkout
      }
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-12">
        Choisissez Votre Plan
      </h1>
      
      {/* Plans Accompagnement */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8">Plans avec Accompagnement</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.filter(p => p.category === 'accompagnement').map(plan => (
            <div key={plan.id} className="border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">
                {plan.price} CHF
                <span className="text-sm font-normal">/mois</span>
              </p>
              <ul className="mb-6 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className="w-full bg-burgundy-500 text-white py-3 rounded-lg hover:bg-burgundy-600 disabled:opacity-50"
              >
                {loading === plan.id ? 'Chargement...' : 'S\'abonner'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Plans Autonomie */}
      <section>
        <h2 className="text-2xl font-bold mb-8">Plans en Autonomie</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Même structure pour plans autonomie */}
        </div>
      </section>
    </div>
  )
}
```

---

## 🧪 Tests

### **1. Tester un paiement (Mode Test)**

```bash
# Cartes de test Stripe
Succès: 4242 4242 4242 4242
Décliné: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184

# Expiration: N'importe quelle date future
# CVC: N'importe quel 3 chiffres
# ZIP: N'importe quel code
```

### **2. Vérifier le webhook**

```bash
# Dans les logs Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Déclencher un événement test
stripe trigger checkout.session.completed
```

### **3. Vérifier dans Supabase**

```sql
-- Vérifier la subscription créée
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;

-- Vérifier l'utilisateur
SELECT u.*, s.* 
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'test@example.com';
```

---

## 🚀 Mise en Production

### **Checklist Production**

- [ ] Activer le mode Live dans Stripe
- [ ] Obtenir les **Live API Keys**
- [ ] Créer les 6 produits en mode **Live**
- [ ] Configurer webhook en **production** (https://...)
- [ ] Mettre à jour `.env` Vercel avec clés Live
- [ ] Tester un vrai paiement de test (1 CHF)
- [ ] Configurer remboursements automatiques
- [ ] Activer Stripe Radar (anti-fraude)
- [ ] Configurer emails transactionnels

### **Variables Production (Vercel)**

```bash
# Dans Vercel Dashboard > Settings > Environment Variables
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

STRIPE_ESSENTIEL_PRICE_ID=price_live_xxxxx
STRIPE_AVANCE_PRICE_ID=price_live_xxxxx
# ... etc
```

---

## 📊 Monitoring & Analytics

### **Dashboard Stripe**

- **MRR** (Monthly Recurring Revenue)
- **Taux de conversion** checkout
- **Churn rate** (taux d'annulation)
- **Failed payments**

### **Custom Analytics**

```typescript
// Ajouter dans votre code
import { supabase } from '@/lib/supabase'

// Tracker conversions
await supabase.from('analytics_events').insert({
  event: 'subscription_started',
  plan_id: planId,
  amount: price,
  user_id: userId,
})
```

---

## 🆘 Troubleshooting

### **Webhook ne fonctionne pas**

```bash
# Vérifier signature
console.log('Signature:', req.headers.get('stripe-signature'))
console.log('Secret:', process.env.STRIPE_WEBHOOK_SECRET)

# Tester localement
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### **Paiement décliné**

```javascript
// Gérer les erreurs
try {
  const session = await stripe.checkout.sessions.create({...})
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Carte déclinée
  }
}
```

### **Plans à durée fixe ne s'annulent pas**

```typescript
// Vérifier metadata
const subscription = await stripe.subscriptions.retrieve(subId)
console.log(subscription.metadata.duration_months)

// Forcer cancel_at
await stripe.subscriptions.update(subId, {
  cancel_at: futureTimestamp
})
```

---

## ✅ Résumé

Vous avez maintenant :

✅ 6 plans configurés dans Stripe  
✅ Webhook endpoint fonctionnel  
✅ Code d'intégration Next.js  
✅ Gestion des durées fixes (2/4/6 mois)  
✅ Tests et monitoring  

**🎉 Prêt pour la production !**

---

**Liens Utiles**

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Docs](https://stripe.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhooks Testing](https://stripe.com/docs/webhooks/test)

