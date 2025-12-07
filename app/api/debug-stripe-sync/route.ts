import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Recherche de l\'utilisateur dans Stripe:', email)
    
    // Trouver l'utilisateur dans notre DB
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        subscriptions (*)
      `)
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Rechercher les abonnements dans Stripe
    const stripe = getStripe()
    const customers = await stripe.customers.list({
      email: email,
      limit: 10
    })

    console.log('👥 Clients Stripe trouvés:', customers.data.length)

    let stripeSubscriptions: any[] = []
    
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10
      })
      
      stripeSubscriptions.push(...subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_end: sub.current_period_end,
        price_id: sub.items.data[0]?.price?.id,
        customer_id: customer.id,
        customer_email: customer.email
      })))
    }

    console.log('💳 Abonnements Stripe trouvés:', stripeSubscriptions.length)

    // Vérifier les abonnements actifs
    const activeStripeSubscriptions = stripeSubscriptions.filter(sub => 
      sub.status === 'active' && sub.current_period_end > Math.floor(Date.now() / 1000)
    )

    console.log('✅ Abonnements Stripe actifs:', activeStripeSubscriptions.length)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      databaseSubscriptions: (user.subscriptions || []).map(sub => ({
        id: sub.id,
        status: sub.status,
        planId: sub.planId,
        stripePriceId: sub.stripePriceId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        stripeCurrentPeriodEnd: sub.stripeCurrentPeriodEnd,
        isActive: sub.status === 'ACTIVE' && new Date(sub.stripeCurrentPeriodEnd) > new Date()
      })),
      stripeCustomers: customers.data.map(c => ({
        id: c.id,
        email: c.email,
        created: c.created
      })),
      stripeSubscriptions: stripeSubscriptions,
      activeStripeSubscriptions: activeStripeSubscriptions,
      syncNeeded: activeStripeSubscriptions.length > 0 && (user.subscriptions || []).length === 0
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
