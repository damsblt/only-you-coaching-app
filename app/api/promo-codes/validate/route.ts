import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Valider un code promo et calculer la réduction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, planId, userId, originalAmount } = body

    if (!code || !planId || !userId || !originalAmount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Récupérer le code promo
    const promoResult = await db
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()
    
    const promoCode = promoResult.data
    const promoError = promoResult.error

    if (promoError || !promoCode) {
      return NextResponse.json(
        { error: 'Code promo invalide', valid: false },
        { status: 404 }
      )
    }

    // Vérifications de validité
    const now = new Date()

    // 1. Code actif
    if (!promoCode.is_active) {
      return NextResponse.json({
        error: 'Ce code promo n\'est plus actif',
        valid: false
      }, { status: 400 })
    }

    // 2. Date de début
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      return NextResponse.json({
        error: 'Ce code promo n\'est pas encore valide',
        valid: false
      }, { status: 400 })
    }

    // 3. Date d'expiration
    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return NextResponse.json({
        error: 'Ce code promo a expiré',
        valid: false
      }, { status: 400 })
    }

    // 4. Nombre max d'utilisations global
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({
        error: 'Ce code promo a atteint sa limite d\'utilisation',
        valid: false
      }, { status: 400 })
    }

    // 5. Plan éligible
    if (promoCode.eligible_plans && promoCode.eligible_plans.length > 0) {
      if (!promoCode.eligible_plans.includes(planId)) {
        return NextResponse.json({
          error: 'Ce code promo n\'est pas valide pour ce plan',
          valid: false
        }, { status: 400 })
      }
    }

    // 6. Vérifier si l'utilisateur a déjà utilisé ce code
    const usageResult = await db
      .from('promo_code_usage')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId)
      .execute()
    
    const existingUsage = usageResult.data

    if (existingUsage && existingUsage.length >= (promoCode.max_uses_per_user || 1)) {
      return NextResponse.json({
        error: 'Vous avez déjà utilisé ce code promo',
        valid: false
      }, { status: 400 })
    }

    // Calculer la réduction
    let discountAmount = 0
    if (promoCode.discount_type === 'percentage') {
      discountAmount = Math.round((originalAmount * promoCode.discount_value) / 100)
    } else {
      // fixed_amount
      discountAmount = promoCode.discount_value
    }

    // S'assurer que la réduction ne dépasse pas le montant original
    discountAmount = Math.min(discountAmount, originalAmount)
    const finalAmount = Math.max(0, originalAmount - discountAmount)

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        discountType: promoCode.discount_type,
        discountValue: promoCode.discount_value,
        stripeCouponId: promoCode.stripe_coupon_id,
      },
      discount: {
        amount: discountAmount,
        originalAmount,
        finalAmount,
        percentage: promoCode.discount_type === 'percentage' ? promoCode.discount_value : null,
      }
    })
  } catch (error: any) {
    console.error('Error validating promo code:', error)
    return NextResponse.json({ error: error.message, valid: false }, { status: 500 })
  }
}
