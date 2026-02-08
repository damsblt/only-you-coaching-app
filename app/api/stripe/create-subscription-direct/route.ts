import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import {
  sendAdminNewSubscriberEmail,
  sendClientSubscriptionConfirmationEmail,
} from '@/lib/emails'


// Plan configuration mapping - matches your Stripe product names
const PLANS_CONFIG = {
  essentiel: {
    productName: 'Essentiel - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
    amount: 6900, // 69 CHF in cents
  },
  avance: {
    productName: 'Avancé - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
    amount: 10900, // 109 CHF in cents
  },
  premium: {
    productName: 'Premium - Accompagnement',
    category: 'personalized',
    duration: 3, // 3 mois
    amount: 14900, // 149 CHF in cents
  },
  starter: {
    productName: 'Starter - Autonomie',
    category: 'online',
    duration: 2, // 2 mois
    amount: 3500, // 35 CHF in cents
  },
  pro: {
    productName: 'Pro - Autonomie',
    category: 'online',
    duration: 4, // 4 mois
    amount: 3000, // 30 CHF in cents
  },
  expert: {
    productName: 'Expert - Autonomie',
    category: 'online',
    duration: 6, // 6 mois
    amount: 2500, // 25 CHF in cents
  },
}

export async function POST(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || ''
    const stripe = getStripe(hostname)
    const { planId, userId, paymentMethodId, promoCode, promoDetails } = await req.json()
    
    if (!userId || !paymentMethodId) {
      return NextResponse.json({ error: 'User ID and Payment Method ID required' }, { status: 400 })
    }

    const plan = PLANS_CONFIG[planId as keyof typeof PLANS_CONFIG]
    
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Fetch products from Stripe to find the matching price
    const products = await stripe.products.list({ active: true })
    const matchingProduct = products.data.find(p => p.name === plan.productName)
    
    if (!matchingProduct) {
      return NextResponse.json({ error: `Product "${plan.productName}" not found in Stripe` }, { status: 404 })
    }

    // Get the price for this product
    const prices = await stripe.prices.list({ product: matchingProduct.id, active: true })
    const price = prices.data[0] // Get the first active price
    
    if (!price) {
      return NextResponse.json({ error: `No active price found for "${plan.productName}"` }, { status: 404 })
    }

    // Create or retrieve customer
    let customer
    let userEmail = ''
    try {
      // Try to find existing customer by email from users table
      const { data: userData, error: userError } = await db
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userError || !userData?.email) {
        console.error('Error fetching user from database:', userError)
        return NextResponse.json({ error: 'User email not found' }, { status: 400 })
      }

      userEmail = userData.email

      // Try to find existing customer by email
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      })
      
      if (customers.data.length > 0) {
        customer = customers.data[0]
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId,
          },
        })
      }
    } catch (error) {
      console.error('Customer creation error:', error)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    // Attach the payment method to the customer
    try {
      // Check if payment method is already attached to a customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
      
      if (paymentMethod.customer) {
        if (paymentMethod.customer === customer.id) {
          // Already attached to this customer, no action needed
          console.log('Payment method already attached to customer')
        } else {
          // Attached to a different customer, detach first
          try {
            await stripe.paymentMethods.detach(paymentMethodId)
            // Now attach to the current customer
            await stripe.paymentMethods.attach(paymentMethodId, {
              customer: customer.id,
            })
          } catch (detachError: any) {
            console.error('Error detaching/reattaching payment method:', detachError)
            throw new Error(`Failed to attach payment method: ${detachError.message}`)
          }
        }
      } else {
        // Not attached to any customer, attach it
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        })
      }
    } catch (attachError: any) {
      // If payment method is already attached to this customer, that's fine
      if (attachError.code === 'resource_already_exists' || attachError.code === 'payment_method_already_attached') {
        // Payment method is already attached, continue
        console.log('Payment method already attached (handled)')
      } else {
        console.error('Payment method attachment error:', attachError)
        throw new Error(`Failed to attach payment method: ${attachError.message}`)
      }
    }

    // Calculer la date de fin d'engagement si applicable
    let cancelAtTimestamp: number | null = null
    if (plan.duration) {
      const commitmentEndDate = new Date()
      commitmentEndDate.setMonth(commitmentEndDate.getMonth() + plan.duration)
      cancelAtTimestamp = Math.floor(commitmentEndDate.getTime() / 1000)
    }

    // Préparer les données de création de subscription
    const subscriptionData: any = {
      customer: customer.id,
      items: [
        {
          price: price.id,
        },
      ],
      default_payment_method: paymentMethodId,
      metadata: {
        userId: userId,
        planId: planId,
        category: plan.category,
        duration: plan.duration?.toString() || 'unlimited',
        duration_months: plan.duration?.toString() || 'unlimited',
        commitment_period: plan.duration ? 'true' : 'false',
      },
    }

    // Appliquer le code promo si fourni (Stripe API v2023+ utilise `discounts` au lieu de `coupon`)
    if (promoCode || (promoDetails && promoDetails.code && promoDetails.discountAmount > 0)) {
      let stripeCouponId: string | null = null

      // Étape 1 : Si un coupon Stripe existe déjà (stripe_coupon_id), vérifier qu'il est valide
      if (promoCode) {
        try {
          await stripe.coupons.retrieve(promoCode)
          stripeCouponId = promoCode
          console.log(`✅ Coupon Stripe existant trouvé: ${promoCode}`)
        } catch (retrieveError: any) {
          console.warn(`⚠️ Coupon Stripe '${promoCode}' introuvable, tentative de création à la volée...`)
          // Le coupon n'existe pas dans Stripe (mode test vs live), on va le créer
          stripeCouponId = null
        }
      }

      // Étape 2 : Si pas de coupon valide, créer à la volée avec promoDetails
      if (!stripeCouponId && promoDetails && promoDetails.code) {
        try {
          // Utiliser le promoCode original comme ID si possible, sinon générer un nouveau
          const couponId = promoCode || `PROMO_${promoDetails.code}_${Date.now()}`
          
          const couponData: any = {
            id: couponId,
            duration: 'forever', // Applique la réduction sur toute la durée de l'abonnement
            name: `Promo ${promoDetails.code}`,
          }

          if (promoDetails.discountType === 'percentage') {
            // Réduction en pourcentage : utiliser la valeur exacte du pourcentage
            couponData.percent_off = promoDetails.discountValue
          } else {
            // Réduction en montant fixe : utiliser amount_off en centimes
            couponData.amount_off = promoDetails.discountAmount
            couponData.currency = 'chf'
          }
          
          const coupon = await stripe.coupons.create(couponData)
          stripeCouponId = coupon.id
          console.log(`✅ Coupon Stripe créé à la volée: ${coupon.id} (type: ${promoDetails.discountType}, value: ${promoDetails.discountValue})`)
        } catch (couponError: any) {
          console.error('❌ Erreur création coupon Stripe à la volée:', couponError)
          // BLOQUER le paiement : l'utilisateur voit un prix réduit, on ne doit pas le débiter au plein tarif
          return NextResponse.json(
            { error: 'Impossible d\'appliquer le code promo. Veuillez réessayer ou retirer le code promo.' },
            { status: 500 }
          )
        }
      } else if (!stripeCouponId && promoCode && !promoDetails) {
        // Cas où on a un promoCode Stripe mais pas de promoDetails pour recréer
        // Essayer de recréer à partir des infos de la base de données
        try {
          const promoResult = await db
            .from('promo_codes')
            .select('*')
            .eq('stripe_coupon_id', promoCode)
            .single()
          
          if (promoResult.data) {
            const pc = promoResult.data
            const couponData: any = {
              id: promoCode,
              duration: 'forever',
              name: pc.description || `Promo ${pc.code}`,
            }

            if (pc.discount_type === 'percentage') {
              couponData.percent_off = pc.discount_value
            } else {
              couponData.amount_off = pc.discount_value
              couponData.currency = 'chf'
            }

            const coupon = await stripe.coupons.create(couponData)
            stripeCouponId = coupon.id
            console.log(`✅ Coupon Stripe recréé depuis la BDD: ${coupon.id}`)
          }
        } catch (dbError: any) {
          console.error('❌ Impossible de recréer le coupon depuis la BDD:', dbError)
          return NextResponse.json(
            { error: `Le coupon '${promoCode}' n'existe pas dans Stripe. Synchronisez les coupons via /api/admin/sync-stripe-coupons.` },
            { status: 500 }
          )
        }
      }

      if (stripeCouponId) {
        subscriptionData.discounts = [{ coupon: stripeCouponId }]
        subscriptionData.metadata.promo_code = promoDetails?.code || promoCode || ''
      }
    }

    // Pour plans à durée fixe, programmer l'annulation automatique à la fin de l'engagement
    if (cancelAtTimestamp) {
      subscriptionData.cancel_at = cancelAtTimestamp
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create(subscriptionData)

    // Update user subscription in database
    try {
      const { error: dbError } = await db
        .from('users')
        .update({
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          plan_id: planId,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: plan.duration 
            ? new Date(Date.now() + plan.duration * 30 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .eq('id', userId)

      if (dbError) {
        console.error('Database update error:', dbError)
        // Don't fail the request, just log the error
      }
    } catch (error) {
      console.error('Database update error:', error)
      // Don't fail the request, just log the error
    }

    // ====================================================================
    // 📧 ENVOI DES EMAILS — Confirmation abonnement
    // ====================================================================
    try {
      const subscriptionStartDate = new Date()
      const subscriptionEndDate = plan.duration
        ? new Date(Date.now() + plan.duration * 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const nextPaymentDate = new Date((subscription as any).current_period_end * 1000)
      const amountPaid = subscription.items.data[0]?.price?.unit_amount || 0
      const customerEmail = customer.email || userEmail
      const customerName = customer.name || ''

      // Email 1: Notification admin (nouvel adhérent)
      await sendAdminNewSubscriberEmail({
        customerEmail,
        customerName,
        planId,
        amountPaid,
        currency: 'chf',
        subscriptionId: subscription.id,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        renewalDate: plan.duration ? subscriptionEndDate : null,
      })
      console.log('📧 Admin notification email sent')

      // Email 2: Confirmation client
      await sendClientSubscriptionConfirmationEmail({
        customerEmail,
        customerName,
        planId,
        amountPaid,
        currency: 'chf',
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        renewalDate: plan.duration ? subscriptionEndDate : null,
        nextPaymentDate,
        willAutoRenew: !plan.duration,
      })
      console.log('📧 Client confirmation email sent')
    } catch (emailError) {
      // Ne pas bloquer la souscription si l'email échoue
      console.error('📧 Error sending subscription emails:', emailError)
    }

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      status: subscription.status 
    })
  } catch (error: any) {
    console.error('❌ Subscription creation error:', error)
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw,
    })
    
    // Provide more specific error messages
    let errorMessage = 'Une erreur est survenue lors de la création de l\'abonnement'
    
    // Handle specific Stripe error types
    if (error.type === 'StripeConnectionError') {
      errorMessage = 'Impossible de se connecter à Stripe. Vérifiez votre connexion internet et vos clés API.'
      console.error('⚠️ STRIPE_SECRET_KEY may be invalid or missing')
    } else if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Erreur d\'authentification Stripe. Vérifiez vos clés API.'
      console.error('⚠️ STRIPE_SECRET_KEY is invalid')
    } else if (error.message) {
      errorMessage = error.message
    } else if (error.type) {
      errorMessage = `Erreur Stripe: ${error.type}`
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          type: error.type,
          code: error.code,
          message: error.message,
          raw: error.raw,
        } : undefined
      },
      { status: 500 }
    )
  }
}

