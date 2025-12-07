import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔄 Création manuelle d\'abonnement pour:', email)
    
    // Trouver l'utilisateur dans notre DB
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Créer un abonnement Essentiel (plan 69 CHF) directement
    const { data: newSubscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        userId: user.id,
        status: 'ACTIVE',
        plan: 'MONTHLY',
        stripePriceId: 'price_1SFtNZRnELGaRIkTI51JSCso',
        stripeSubscriptionId: 'sub_1SLqLERnELGaRIkT04qParSX',
        stripeCurrentPeriodEnd: new Date('2025-11-24T19:08:00.000Z').toISOString()
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    console.log('✅ Abonnement créé:', newSubscription)

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: newSubscription
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
