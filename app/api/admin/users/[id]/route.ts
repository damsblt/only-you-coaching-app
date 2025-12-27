import { NextRequest, NextResponse } from 'next/server'
import { remove, query } from '@/lib/db'
import { isAuthorizedAdminUser, getUserEmailFromRequest } from '@/lib/admin-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'utilisateur requis' },
        { status: 400 }
      )
    }

    // Vérifier l'autorisation
    const userEmail = getUserEmailFromRequest(request)
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email de l\'utilisateur requis' },
        { status: 401 }
      )
    }

    const isAuthorized = await isAuthorizedAdminUser(userEmail)
    if (!isAuthorized) {
      console.log('❌ Accès refusé pour la suppression d\'utilisateur:', userEmail)
      return NextResponse.json(
        { error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour supprimer des utilisateurs.' },
        { status: 403 }
      )
    }

    // Vérifier que l'utilisateur existe
    const existingUsers = await query('SELECT * FROM users WHERE id = $1', [id])
    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Empêcher la suppression d'un admin (sécurité)
    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un utilisateur administrateur' },
        { status: 403 }
      )
    }

    console.log(`🗑️  Suppression de l'utilisateur ${id} (${existingUser.email})...`)

    // Supprimer d'abord les abonnements associés (pour respecter les contraintes de clé étrangère)
    const { error: subDeleteError } = await remove('subscriptions', { userId: id })

    if (subDeleteError) {
      console.error('Erreur lors de la suppression des abonnements:', subDeleteError)
      // Continuer quand même, peut-être qu'il n'y a pas d'abonnements ou que la contrainte CASCADE s'en charge
    } else {
      console.log('✅ Abonnements supprimés')
    }

    // Supprimer l'utilisateur
    const { error: deleteError } = await remove('users', { id })

    if (deleteError) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'utilisateur', details: deleteError.message || String(deleteError) },
        { status: 500 }
      )
    }

    console.log(`✅ Utilisateur ${id} supprimé avec succès`)

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}

