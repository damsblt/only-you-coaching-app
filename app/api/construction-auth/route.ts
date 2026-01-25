import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Emails autorisés pour accéder à la page en construction
const AUTHORIZED_EMAILS = [
  'blmarieline@gmail.com',
  'damien.balet@me.com'
]

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' }, 
        { status: 400 }
      )
    }

    // Vérifier que l'email est autorisé
    if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Accès non autorisé' }, 
        { status: 403 }
      )
    }

    // Récupérer l'utilisateur depuis la base de données
    const { data: userData, error: dbError } = await db
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (dbError || !userData) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' }, 
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a un mot de passe
    if (!userData.password) {
      return NextResponse.json(
        { error: 'Aucun mot de passe défini pour cet utilisateur' }, 
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, userData.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' }, 
        { status: 401 }
      )
    }

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    return NextResponse.json({ 
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.full_name
      }
    })
  } catch (error: any) {
    console.error('Construction auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la connexion' }, 
      { status: 500 }
    )
  }
}
