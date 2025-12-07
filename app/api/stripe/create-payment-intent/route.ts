import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'


// Plan configuration mapping - matches your Stripe product names
const PLANS_CONFIG = {
  essentiel: {
    productName: 'Essentiel - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
    amount: 6900, // 69 CHF in cents
  },
  avance: {
    productName: 'Avancé - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
    amount: 10900, // 109 CHF in cents
  },
  premium: {
    productName: 'Premium - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
    amount: 14900, // 149 CHF in cents
  },
  starter: {
    productName: 'Starter - Autonomie',
    category: 'online',
    duration: 2, // 2 mois
    amount: 3500, // 35 CHF in cents
  },
  pro: {
    productName: 'Pro - Autonomie',
    category: 'online',
    duration: 4, // 4 mois
    amount: 3000, // 30 CHF in cents
  },
  expert: {
    productName: 'Expert - Autonomie',
    category: 'online',
    duration: 6, // 6 mois
    amount: 2500, // 25 CHF in cents
  },
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
  try {
    const { planId, userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const plan = PLANS_CONFIG[planId as keyof typeof PLANS_CONFIG]
    
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.amount,
      currency: 'chf',
      metadata: {
        userId: userId,
        planId: planId,
        category: plan.category,
        duration: plan.duration?.toString() || 'unlimited',
      },
    })

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    })
  } catch (error: any) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

