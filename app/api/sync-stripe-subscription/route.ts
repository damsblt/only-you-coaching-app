import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'




// Use service role key for admin operations



export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔄 Synchronisation de l\'abonnement pour:', email)
    
    // Trouver l'utilisateur dans notre DB
    const { data: user, error: userError } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Rechercher les abonnements dans Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 10
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const customer = customers.data[0]
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10
    })

    const activeSubscriptions = subscriptions.data.filter(sub => 
      sub.status === 'active' && sub.current_period_end > Math.floor(Date.now() / 1000)
    )

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({ error: 'No active Stripe subscriptions found' }, { status: 404 })
    }

    const subscription = activeSubscriptions[0]
    const priceId = subscription.items.data[0]?.price?.id

    if (!priceId) {
      return NextResponse.json({ error: 'No price ID found in subscription' }, { status: 400 })
    }

    // Déterminer le plan ID à partir du price ID ou des métadonnées
    const PRICE_ID_MAP: Record<string, string> = {
      // Nouveau compte acct_1Sy9bDK6CCSakHFa — LIVE
      'price_1SyAVUK6CCSakHFaPSBeq5T7': 'essentiel',
      'price_1SyAVVK6CCSakHFaiPrTWkhA': 'avance',
      'price_1SyAVWK6CCSakHFarpCXujFF': 'premium',
      'price_1SyAVXK6CCSakHFa615XIYgo': 'starter',
      'price_1SyAVYK6CCSakHFaMiK5Srcb': 'pro',
      'price_1SyAVZK6CCSakHFaleAJWFsz': 'expert',
      // Nouveau compte acct_1Sy9bDK6CCSakHFa — TEST
      'price_1SyAPFK6CCSakHFaHtnEiwid': 'essentiel',
      'price_1SyAPGK6CCSakHFae0ovoYJ1': 'avance',
      'price_1SyAPIK6CCSakHFaWXcjB89n': 'premium',
      'price_1SyAPVK6CCSakHFasJ7rIdbE': 'starter',
      'price_1SyAPXK6CCSakHFa1QzoZYIM': 'pro',
      'price_1SyAPYK6CCSakHFaJE5clUyo': 'expert',
      // Ancien compte acct_1S9oMQRnELGaRIkT (rétrocompatibilité)
      'price_1SFtNZRnELGaRIkTI51JSCso': 'essentiel',
      'price_1SFtNhRnELGaRIkTKBuUGkiY': 'avance',
      'price_1SFtNrRnELGaRIkTA4QzRecL': 'premium',
      'price_1SNC3tRnELGaRIkTOumvumpn': 'starter',
      'price_1SNC3wRnELGaRIkT5ZJUbSOR': 'pro',
      'price_1SNC3zRnELGaRIkTYvg8yx3B': 'expert',
    }

    let planId = PRICE_ID_MAP[priceId] || 'essentiel'
    
    // Fallback : chercher dans le nom du price ID
    if (!PRICE_ID_MAP[priceId]) {
      if (priceId.includes('essentiel')) planId = 'essentiel'
      else if (priceId.includes('avance')) planId = 'avance'
      else if (priceId.includes('premium')) planId = 'premium'
      else if (priceId.includes('starter')) planId = 'starter'
      else if (priceId.includes('pro')) planId = 'pro'
      else if (priceId.includes('expert')) planId = 'expert'
    }

    // Vérifier si l'abonnement existe déjà
    const { data: existingSubscription, error: existingError } = await db
      .from('subscriptions')
      .select('*')
      .eq('userId', user.id)
      .eq('stripeSubscriptionId', subscription.id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', existingError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      const { data: updatedSubscription, error: updateError } = await db
        .from('subscriptions')
        .update({
          status: 'active',
          planId: planId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated',
        subscription: updatedSubscription
      })
    } else {
      // Créer un nouvel abonnement
      const { data: newSubscription, error: createError } = await db
        .from('subscriptions')
        .insert({
          userId: user.id,
          status: 'active',
          plan: 'MONTHLY', // Type d'abonnement (monthly/yearly/lifetime)
          planId: planId, // Ajouter le planId
          stripePriceId: priceId,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating subscription:', createError)
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
      }

      console.log(`✅ Subscription synced for user ${user.id} with planId: ${planId}`)

      return NextResponse.json({
        success: true,
        message: 'Subscription created',
        subscription: newSubscription
      })
    }

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
