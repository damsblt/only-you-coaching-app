import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSiteUrl } from '@/lib/get-site-url'


// Plan configuration mapping - matches your Stripe product names
const PLANS_CONFIG = {
  essentiel: {
    productName: 'Essentiel - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois d'engagement
    priceNickname: 'Essentiel - 69 CHF/mois',
  },
  avance: {
    productName: 'Avancé - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois d'engagement
    priceNickname: 'Avancé - 109 CHF/mois',
  },
  premium: {
    productName: 'Premium - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois d'engagement
    priceNickname: 'Premium - 149 CHF/mois',
  },
  starter: {
    productName: 'Starter - Autonomie',
    category: 'online',
    duration: 2, // 2 mois d'engagement
    priceNickname: 'Starter - 35 CHF/mois',
  },
  pro: {
    productName: 'Pro - Autonomie',
    category: 'online',
    duration: 4, // 4 mois d'engagement
    priceNickname: 'Pro - 30 CHF/mois',
  },
  expert: {
    productName: 'Expert - Autonomie',
    category: 'online',
    duration: 6, // 6 mois d'engagement
    priceNickname: 'Expert - 25 CHF/mois',
  },
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const { planId, userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    const plan = PLANS_CONFIG[planId as keyof typeof PLANS_CONFIG]
    
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Fetch products from Stripe to find the matching price
    const products = await stripe.products.list({ active: true })
    const matchingProduct = products.data.find(p => p.name === plan.productName)
    
    if (!matchingProduct) {
      return NextResponse.json({ error: `Product "${plan.productName}" not found in Stripe` }, { status: 404 })
    }

    // Get the price for this product - look for the monthly price by nickname
    const prices = await stripe.prices.list({ product: matchingProduct.id, active: true })
    const price = prices.data.find(p => p.nickname === plan.priceNickname) || prices.data[0]
    
    if (!price) {
      return NextResponse.json({ error: `No active price found for "${plan.productName}"` }, { status: 404 })
    }

    // Créer la session Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${getSiteUrl()}/souscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getSiteUrl()}/souscriptions/personnalise`,
      metadata: {
        userId: userId,
        planId: planId,
        category: plan.category,
        duration: plan.duration?.toString() || 'unlimited',
      },
      // Configuration pour période d'engagement
      subscription_data: {
        metadata: {
          duration_months: plan.duration?.toString() || 'unlimited',
          commitment_period: 'true', // Marque que c'est un engagement
        },
        // Pour les plans avec durée fixe, programmer l'annulation automatique à la fin de l'engagement
        ...(plan.duration && {
          trial_end: undefined, // Pas de période d'essai
          // Calculer la date de fin d'engagement (date de début + nombre de mois)
          // Note: Stripe programmera l'annulation automatique à cette date
        }),
      },
      // Permettre l'annulation mais avec engagement
      payment_method_collection: 'always',
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
