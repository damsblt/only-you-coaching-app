import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

/**
 * POST /api/admin/sync-stripe-coupons
 * 
 * Synchronise tous les codes promo de la base de données vers Stripe.
 * Crée les coupons Stripe manquants pour le mode test/live selon le domaine.
 * 
 * Body optionnel:
 * - codes: string[] - Liste spécifique de codes à synchroniser (sinon tous)
 * - force: boolean - Forcer la recréation même si le coupon existe déjà
 */
export async function POST(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || ''
    const stripe = getStripe(hostname)
    
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // Body vide = synchroniser tout
    }
    
    const { codes, force = false } = body

    // Récupérer les codes promo de la base de données
    let query = db.from('promo_codes').select('*').eq('is_active', true)
    
    const result = await query.execute()

    if (result.error) {
      console.error('❌ Error fetching promo codes:', result.error)
      return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 })
    }

    let promoCodes = result.data || []
    
    // Filtrer par codes spécifiques si fournis
    if (codes && Array.isArray(codes) && codes.length > 0) {
      const upperCodes = codes.map((c: string) => c.toUpperCase())
      promoCodes = promoCodes.filter((pc: any) => upperCodes.includes(pc.code.toUpperCase()))
    }

    if (promoCodes.length === 0) {
      return NextResponse.json({ 
        message: 'No promo codes to sync',
        synced: [],
        errors: [],
      })
    }

    const synced: any[] = []
    const errors: any[] = []
    const skipped: any[] = []

    for (const promoCode of promoCodes) {
      const couponId = promoCode.stripe_coupon_id || promoCode.code.toUpperCase()
      
      try {
        // Vérifier si le coupon existe déjà dans Stripe
        let couponExists = false
        if (!force) {
          try {
            await stripe.coupons.retrieve(couponId)
            couponExists = true
          } catch {
            // Coupon n'existe pas, on va le créer
          }
        }

        if (couponExists && !force) {
          skipped.push({
            code: promoCode.code,
            couponId,
            reason: 'Already exists in Stripe',
          })
          continue
        }

        // Si force et coupon existe, le supprimer d'abord
        if (force && couponExists) {
          try {
            await stripe.coupons.del(couponId)
          } catch (delError) {
            console.warn(`⚠️ Could not delete existing coupon ${couponId}:`, delError)
          }
        }

        // Créer le coupon dans Stripe
        const couponData: any = {
          id: couponId,
          name: promoCode.description || `Promo ${promoCode.code}`,
          duration: 'forever', // Applique sur toute la durée
        }

        if (promoCode.discount_type === 'percentage') {
          couponData.percent_off = promoCode.discount_value
        } else {
          // fixed_amount - Stripe attend le montant en centimes
          couponData.amount_off = promoCode.discount_value
          couponData.currency = 'chf'
        }

        // Date d'expiration
        if (promoCode.valid_until) {
          couponData.redeem_by = Math.floor(new Date(promoCode.valid_until).getTime() / 1000)
        }

        // Limite d'utilisation
        if (promoCode.max_uses) {
          couponData.max_redemptions = promoCode.max_uses
        }

        const coupon = await stripe.coupons.create(couponData)

        // Mettre à jour le stripe_coupon_id dans la base de données si différent
        if (promoCode.stripe_coupon_id !== coupon.id) {
          await db
            .from('promo_codes')
            .update({ stripe_coupon_id: coupon.id })
            .eq('id', promoCode.id)
        }

        synced.push({
          code: promoCode.code,
          couponId: coupon.id,
          discountType: promoCode.discount_type,
          discountValue: promoCode.discount_value,
        })

        console.log(`✅ Coupon Stripe créé: ${coupon.id} (${promoCode.discount_type}: ${promoCode.discount_value})`)
      } catch (error: any) {
        console.error(`❌ Error syncing coupon ${promoCode.code}:`, error)
        errors.push({
          code: promoCode.code,
          couponId,
          error: error.message,
        })
      }
    }

    const isTestMode = hostname.includes('vercel.app') || hostname.includes('localhost')
    
    return NextResponse.json({
      message: `Sync complete for ${isTestMode ? 'TEST' : 'LIVE'} mode`,
      domain: hostname,
      total: promoCodes.length,
      synced,
      skipped,
      errors,
    })
  } catch (error: any) {
    console.error('❌ Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/admin/sync-stripe-coupons
 * 
 * Liste les coupons Stripe existants et les compare avec la base de données.
 */
export async function GET(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || ''
    const stripe = getStripe(hostname)

    // Récupérer les coupons Stripe
    const stripeCoupons = await stripe.coupons.list({ limit: 100 })

    // Récupérer les codes promo de la base de données
    const result = await db
      .from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .execute()

    const promoCodes = result.data || []

    // Comparer
    const stripeCouponIds = stripeCoupons.data.map(c => c.id)
    const dbCouponIds = promoCodes
      .filter((pc: any) => pc.stripe_coupon_id)
      .map((pc: any) => pc.stripe_coupon_id)

    const missingInStripe = promoCodes.filter((pc: any) => 
      pc.stripe_coupon_id && !stripeCouponIds.includes(pc.stripe_coupon_id)
    )

    const isTestMode = hostname.includes('vercel.app') || hostname.includes('localhost')

    return NextResponse.json({
      mode: isTestMode ? 'TEST' : 'LIVE',
      domain: hostname,
      stripeCoupons: stripeCoupons.data.map(c => ({
        id: c.id,
        name: c.name,
        percent_off: c.percent_off,
        amount_off: c.amount_off,
        currency: c.currency,
        valid: c.valid,
        duration: c.duration,
      })),
      dbPromoCodes: promoCodes.map((pc: any) => ({
        code: pc.code,
        stripe_coupon_id: pc.stripe_coupon_id,
        discount_type: pc.discount_type,
        discount_value: pc.discount_value,
        is_active: pc.is_active,
      })),
      missingInStripe: missingInStripe.map((pc: any) => ({
        code: pc.code,
        stripe_coupon_id: pc.stripe_coupon_id,
        discount_type: pc.discount_type,
        discount_value: pc.discount_value,
      })),
    })
  } catch (error: any) {
    console.error('❌ Error checking sync status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
