import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

// PATCH - Mettre à jour un code promo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    // Récupérer le code promo actuel
    const result = await db
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single()
    
    const currentPromoCode = result.data

    if (!currentPromoCode) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.maxUses !== undefined) updateData.max_uses = body.maxUses
    if (body.maxUsesPerUser !== undefined) updateData.max_uses_per_user = body.maxUsesPerUser
    if (body.validUntil !== undefined) updateData.valid_until = body.validUntil
    if (body.description !== undefined) updateData.description = body.description
    if (body.eligiblePlans !== undefined) updateData.eligible_plans = body.eligiblePlans

    updateData.updated_at = new Date().toISOString()

    // Mettre à jour dans la base de données
    const updateResult = await db
      .from('promo_codes')
      .update(updateData)
      .eq('id', id)
    
    const updatedPromoCode = updateResult.data
    const error = updateResult.error

    if (error) {
      console.error('Error updating promo code:', error)
      return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 })
    }

    // Si le code a un coupon Stripe et qu'on veut mettre à jour la validité
    if (currentPromoCode.stripe_coupon_id && body.validUntil) {
      try {
        const stripe = getStripe()
        // Note: Les coupons Stripe ne peuvent pas être modifiés une fois créés
        // On peut seulement les archiver. Pour de vrais changements, il faut créer un nouveau coupon
        console.log('Note: Stripe coupons cannot be modified. Consider creating a new coupon.')
      } catch (stripeError) {
        console.error('Stripe update error:', stripeError)
      }
    }

    return NextResponse.json({ promoCode: updatedPromoCode })
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/promo-codes/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Récupérer un code promo spécifique avec ses statistiques
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Récupérer le code promo
    const result = await db
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single()
    
    const promoCode = result.data
    const error = result.error

    if (error || !promoCode) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    // Récupérer les statistiques d'utilisation
    const usageResult = await db
      .from('promo_code_usage')
      .select('*')
      .eq('promo_code_id', id)
      .execute()
    
    const usage = usageResult.data

    const stats = {
      totalUses: usage?.length || 0,
      totalDiscountGiven: usage?.reduce((sum, u) => sum + u.discount_amount, 0) || 0,
      uniqueUsers: new Set(usage?.map(u => u.user_id)).size || 0,
    }

    return NextResponse.json({
      promoCode,
      stats,
      recentUsage: usage?.slice(0, 10) || []
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/promo-codes/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
