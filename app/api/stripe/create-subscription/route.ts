import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'


// Plan configuration mapping - matches your Stripe product names
const PLANS_CONFIG = {
  essentiel: {
    productName: 'Essentiel - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
  },
  avance: {
    productName: 'Avancé - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
  },
  premium: {
    productName: 'Premium - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
  },
  starter: {
    productName: 'Starter - Autonomie',
    category: 'online',
    duration: 2, // 2 mois
  },
  pro: {
    productName: 'Pro - Autonomie',
    category: 'online',
    duration: 4, // 4 mois
  },
  expert: {
    productName: 'Expert - Autonomie',
    category: 'online',
    duration: 6, // 6 mois
  },
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const { planId, userId, paymentIntentId } = await req.json()
    
    if (!userId || !paymentIntentId) {
      return NextResponse.json({ error: 'User ID and Payment Intent ID required' }, { status: 400 })
    }

    const plan = PLANS_CONFIG[planId as keyof typeof PLANS_CONFIG]
    
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Retrieve the payment intent to get the payment method
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (!paymentIntent.payment_method) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 })
    }

    // Get the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)

    // Fetch products from Stripe to find the matching price
    const products = await stripe.products.list({ active: true })
    const matchingProduct = products.data.find(p => p.name === plan.productName)
    
    if (!matchingProduct) {
      return NextResponse.json({ error: `Product "${plan.productName}" not found in Stripe` }, { status: 404 })
    }

    // Get the price for this product
    const prices = await stripe.prices.list({ product: matchingProduct.id, active: true })
    const price = prices.data[0] // Get the first active price
    
    if (!price) {
      return NextResponse.json({ error: `No active price found for "${plan.productName}"` }, { status: 404 })
    }

    // Create or retrieve customer
    let customer
    try {
      // Try to find existing customer by email
      const { data: userData } = await db
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userData?.email) {
        const customers = await stripe.customers.list({
          email: userData.email,
          limit: 1
        })
        
        if (customers.data.length > 0) {
          customer = customers.data[0]
        } else {
          // Create new customer
          customer = await stripe.customers.create({
            email: userData.email,
            metadata: {
              userId: userId,
            },
          })
        }
      } else {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 })
      }
    } catch (error) {
      console.error('Customer creation error:', error)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentIntent.payment_method as string, {
      customer: customer.id,
    })

    // Calculer la date de fin d'engagement si applicable
    let cancelAtTimestamp: number | null = null
    if (plan.duration) {
      const commitmentEndDate = new Date()
      commitmentEndDate.setMonth(commitmentEndDate.getMonth() + plan.duration)
      cancelAtTimestamp = Math.floor(commitmentEndDate.getTime() / 1000)
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: price.id,
        },
      ],
      default_payment_method: paymentIntent.payment_method as string,
      metadata: {
        userId: userId,
        planId: planId,
        category: plan.category,
        duration: plan.duration?.toString() || 'unlimited',
        duration_months: plan.duration?.toString() || 'unlimited',
        commitment_period: plan.duration ? 'true' : 'false',
      },
      // Pour plans à durée fixe, programmer l'annulation automatique à la fin de l'engagement
      ...(cancelAtTimestamp && {
        cancel_at: cancelAtTimestamp,
      }),
    })

    // Update user subscription in database
    try {
      const { error: dbError } = await db
        .from('users')
        .update({
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          plan_id: planId,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: plan.duration 
            ? new Date(Date.now() + plan.duration * 30 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .eq('id', userId)

      if (dbError) {
        console.error('Database update error:', dbError)
        // Don't fail the request, just log the error
      }
    } catch (error) {
      console.error('Database update error:', error)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      status: subscription.status 
    })
  } catch (error: any) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
