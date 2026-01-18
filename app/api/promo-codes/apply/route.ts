import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Enregistrer l'utilisation d'un code promo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      promoCodeId,
      userId,
      subscriptionId,
      discountAmount,
      originalAmount,
      finalAmount
    } = body

    if (!promoCodeId || !userId || !subscriptionId || discountAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà utilisé ce code
    const { data: existingUsage } = await db
      .from('promo_code_usage')
      .select('id')
      .eq('promo_code_id', promoCodeId)
      .eq('user_id', userId)
      .single()

    if (existingUsage) {
      return NextResponse.json(
        { error: 'Code promo déjà utilisé' },
        { status: 400 }
      )
    }

    // Enregistrer l'utilisation
    const { data: usage, error: usageError } = await db
      .from('promo_code_usage')
      .insert({
        promo_code_id: promoCodeId,
        user_id: userId,
        subscription_id: subscriptionId,
        discount_amount: discountAmount,
        original_amount: originalAmount,
        final_amount: finalAmount,
      })
      .select()
      .single()

    if (usageError) {
      console.error('Error recording promo code usage:', usageError)
      return NextResponse.json(
        { error: 'Failed to record promo code usage' },
        { status: 500 }
      )
    }

    // Incrémenter le compteur d'utilisations du code promo
    const { error: updateError } = await db
      .from('promo_codes')
      .update({
        current_uses: db.raw('current_uses + 1')
      })
      .eq('id', promoCodeId)

    if (updateError) {
      console.error('Error updating promo code usage count:', updateError)
      // Ne pas échouer la requête pour cette erreur
    }

    return NextResponse.json({
      success: true,
      usage
    })
  } catch (error: any) {
    console.error('Error applying promo code:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
