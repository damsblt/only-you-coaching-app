import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserPlanFeatures } from '@/lib/access-control'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Recherche de l\'utilisateur:', email)
    
    // Trouver l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        createdAt,
        subscriptions(
          id,
          status,
          stripePriceId,
          stripeSubscriptionId,
          stripeCurrentPeriodEnd,
          createdAt
        )
      `)
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    })

    // Tester la fonction getUserPlanFeatures
    console.log('🧪 Test de getUserPlanFeatures...')
    const features = await getUserPlanFeatures(user.id)
    console.log('Fonctionnalités accordées:', features)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      subscriptions: user.subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        stripePriceId: sub.stripePriceId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        stripeCurrentPeriodEnd: sub.stripeCurrentPeriodEnd,
        createdAt: sub.createdAt,
        isActive: sub.status === 'ACTIVE' && new Date(sub.stripeCurrentPeriodEnd) > new Date()
      })),
      features
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
