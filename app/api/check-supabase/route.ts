import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    console.log('🔍 Vérification dans Supabase pour:', email)
    
    // Vérifier la structure de la table subscriptions
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'subscriptions')
      .order('ordinal_position')

    if (tableError) {
      console.log('❌ Erreur lors de la vérification de la table:', tableError)
    } else {
      console.log('📊 Structure de la table subscriptions:')
      console.table(tableInfo)
    }

    // Chercher l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found in Supabase' }, { status: 404 })
    }

    console.log('✅ Utilisateur trouvé:', user)

    // Chercher les abonnements existants
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('userId', user.id)

    if (subError) {
      console.log('❌ Erreur lors de la recherche des abonnements:', subError)
    } else {
      console.log('📋 Abonnements existants:', subscriptions)
    }

    return NextResponse.json({
      user,
      subscriptions: subscriptions || [],
      tableStructure: tableInfo || []
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
