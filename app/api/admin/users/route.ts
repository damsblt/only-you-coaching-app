import { NextRequest, NextResponse } from 'next/server'
import { getAllUsersWithSubscriptions } from '@/lib/access-control'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('📥 GET /api/admin/users - Fetching users...')
    const users = await getAllUsersWithSubscriptions()
    console.log(`✅ Successfully fetched ${users.length} users`)
    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('❌ Error in GET /api/admin/users:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json({ 
      error: error.message || 'Erreur lors de la récupération des utilisateurs',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email et nom sont requis' },
        { status: 400 }
      )
    }

    // Générer un mot de passe par défaut si non fourni
    const defaultPassword = password || `OnlyYou${Math.random().toString(36).slice(-8)}`
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Vérifier si l'utilisateur existe déjà
    const existingUserResult = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    const existingUser = existingUserResult.data

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Créer l'utilisateur
    const userId = uuidv4()
    const now = new Date().toISOString()

    const insertResult = await db
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        role: 'USER',
        password: hashedPassword,
        updated_at: now,
        created_at: now
      })
    
    const { data: newUser, error: userError } = insertResult

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'utilisateur', details: userError.message },
        { status: 500 }
      )
    }

    // Créer un abonnement "full_access" pour cet utilisateur
    const subscriptionId = uuidv4()
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 100) // 100 ans = accès permanent

    const subscriptionResult = await db
      .from('subscriptions')
      .insert({
        id: subscriptionId,
        userId: userId,
        status: 'active',
        planId: 'full_access',
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        currentPeriodStart: now,
        currentPeriodEnd: subscriptionEndDate.toISOString(),
        cancelAtPeriodEnd: false,
        created_at: now,
        updated_at: now
      })
    
    const { data: subscription, error: subError } = subscriptionResult

    if (subError) {
      console.error('Error creating subscription:', subError)
      // Ne pas échouer complètement, l'utilisateur est créé même si l'abonnement échoue
      // On peut le créer manuellement plus tard
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      subscription: subscription || null,
      password: password || defaultPassword, // Toujours retourner le mot de passe (généré ou fourni)
      message: 'Utilisateur créé avec succès avec accès intégral'
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}

