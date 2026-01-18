import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

// GET - Liste tous les codes promo (admin uniquement)
export async function GET(request: NextRequest) {
  try {
    const { data: promoCodes, error } = await db
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promo codes:', error)
      return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 })
    }

    return NextResponse.json({ promoCodes })
  } catch (error: any) {
    console.error('Error in GET /api/admin/promo-codes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Créer un nouveau code promo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      maxUsesPerUser,
      eligiblePlans,
      validFrom,
      validUntil,
      description,
      createStripeCoupon
    } = body

    // Validation
    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Code, discount type, and discount value are required' },
        { status: 400 }
      )
    }

    if (!['percentage', 'fixed_amount'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Discount type must be percentage or fixed_amount' },
        { status: 400 }
      )
    }

    // Vérifier si le code existe déjà
    const { data: existingCode } = await db
      .from('promo_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single()

    if (existingCode) {
      return NextResponse.json(
        { error: 'Ce code promo existe déjà' },
        { status: 400 }
      )
    }

    // Créer le coupon dans Stripe si demandé
    let stripeCouponId = null
    if (createStripeCoupon) {
      try {
        const stripe = getStripe()
        const couponData: any = {
          id: code.toUpperCase(),
          name: description || code,
        }

        if (discountType === 'percentage') {
          couponData.percent_off = discountValue
        } else {
          // fixed_amount - Stripe attend le montant en centimes
          couponData.amount_off = discountValue
          couponData.currency = 'chf'
        }

        // Ajouter la date d'expiration si fournie
        if (validUntil) {
          couponData.redeem_by = Math.floor(new Date(validUntil).getTime() / 1000)
        }

        // Limite d'utilisation
        if (maxUses) {
          couponData.max_redemptions = maxUses
        }

        const coupon = await stripe.coupons.create(couponData)
        stripeCouponId = coupon.id
      } catch (stripeError: any) {
        console.error('Stripe coupon creation error:', stripeError)
        // Continue même si Stripe échoue, on pourra synchroniser plus tard
      }
    }

    // Insérer dans la base de données
    const { data: newPromoCode, error: insertError } = await db
      .from('promo_codes')
      .insert({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        stripe_coupon_id: stripeCouponId,
        max_uses: maxUses || null,
        max_uses_per_user: maxUsesPerUser || 1,
        eligible_plans: eligiblePlans || null,
        valid_from: validFrom || new Date().toISOString(),
        valid_until: validUntil || null,
        description: description || null,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting promo code:', insertError)
      return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 })
    }

    return NextResponse.json({ promoCode: newPromoCode }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/promo-codes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Supprimer un code promo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID required' }, { status: 400 })
    }

    // Récupérer le code promo pour supprimer aussi le coupon Stripe
    const { data: promoCode } = await db
      .from('promo_codes')
      .select('stripe_coupon_id')
      .eq('id', id)
      .single()

    // Supprimer le coupon Stripe si présent
    if (promoCode?.stripe_coupon_id) {
      try {
        const stripe = getStripe()
        await stripe.coupons.del(promoCode.stripe_coupon_id)
      } catch (stripeError) {
        console.error('Error deleting Stripe coupon:', stripeError)
        // Continue même si Stripe échoue
      }
    }

    // Supprimer de la base de données
    const { error } = await db
      .from('promo_codes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting promo code:', error)
      return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Promo code deleted successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/promo-codes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
