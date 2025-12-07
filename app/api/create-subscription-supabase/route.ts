import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔄 Création d\'abonnement via Supabase pour:', email)
    
    // Chercher l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found in Supabase' }, { status: 404 })
    }

    console.log('✅ Utilisateur trouvé:', user.id)

    // Créer l'abonnement directement dans Supabase
    const now = new Date().toISOString()
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Générer un ID unique
        userId: user.id,
        status: 'ACTIVE',
        plan: 'MONTHLY',
        stripePriceId: 'price_1SFtNZRnELGaRIkTI51JSCso',
        stripeSubscriptionId: 'sub_1SLqLERnELGaRIkT04qParSX',
        stripeCurrentPeriodEnd: '2025-11-24T19:08:00.000Z',
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single()

    if (subError) {
      console.error('❌ Erreur lors de la création de l\'abonnement:', subError)
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    console.log('✅ Abonnement créé avec succès:', subscription)

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully via Supabase',
      subscription
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
