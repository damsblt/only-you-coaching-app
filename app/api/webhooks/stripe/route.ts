import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  console.log(`🔔 Received webhook: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer
        
        // Trouver l'utilisateur par email si userId n'est pas dans les métadonnées
        let userId = session.metadata?.userId
        
        if (!userId && customer.email) {
          console.log(`⚠️ userId not in metadata, searching by email: ${customer.email}`)
          const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', customer.email)
            .single()
          
          if (user && !userError) {
            userId = user.id
            console.log(`✅ Found user by email: ${userId}`)
          } else {
            console.error(`❌ User not found for email: ${customer.email}`, userError)
          }
        }
        
        if (!userId) {
          console.error('❌ Cannot create subscription: userId not found')
          return NextResponse.json({ error: 'User not found' }, { status: 400 })
        }
        
        // Vérifier si l'abonnement existe déjà
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('stripeSubscriptionId', subscription.id)
          .single()
        
        if (existingSubscription) {
          console.log(`ℹ️ Subscription already exists: ${subscription.id}`)
          break
        }
        
        // Vérifier si c'est un plan avec engagement et programmer l'annulation automatique
        const durationMonths = parseInt(session.metadata?.duration || subscription.metadata?.duration_months || '0')
        const isCommitmentPeriod = session.metadata?.commitment_period === 'true' || subscription.metadata?.commitment_period === 'true'
        
        let commitmentEndDate: Date | null = null
        let cancelAtTimestamp: number | null = null
        
        if (isCommitmentPeriod && durationMonths > 0) {
          // Calculer la date de fin d'engagement (date de début + nombre de mois)
          const subscriptionStart = new Date((subscription as any).current_period_start * 1000)
          commitmentEndDate = new Date(subscriptionStart)
          commitmentEndDate.setMonth(commitmentEndDate.getMonth() + durationMonths)
          cancelAtTimestamp = Math.floor(commitmentEndDate.getTime() / 1000)
          
          // Programmer l'annulation automatique à la fin de l'engagement
          await stripe.subscriptions.update(subscription.id, {
            cancel_at: cancelAtTimestamp,
          })
          
          console.log(`📅 Programmed automatic cancellation at end of commitment: ${commitmentEndDate.toISOString()}`)
        }
        
        // Déterminer le planId depuis les métadonnées ou le priceId
        const planIdFromMetadata = session.metadata?.planId || subscription.metadata?.planId
        const priceId = subscription.items.data[0]?.price?.id
        
        // Créer l'enregistrement d'abonnement dans notre base de données
        const { error: createError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            userId: userId,
            stripeCustomerId: typeof customer === 'string' ? customer : customer.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId || '',
            status: 'ACTIVE',
            plan: getPlanFromMetadata(planIdFromMetadata),
            planId: planIdFromMetadata || getPlanIdFromPriceId(priceId || ''),
            stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            commitmentEndDate: commitmentEndDate?.toISOString() || null,
            willCancelAfterCommitment: cancelAtTimestamp ? true : false,
          })

        if (createError) {
          console.error('❌ Error creating subscription:', createError)
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        console.log(`✅ Subscription created for user ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Vérifier si c'est un engagement
        const isCommitmentPeriod = subscription.metadata?.commitment_period === 'true'
        const durationMonths = parseInt(subscription.metadata?.duration_months || '0')
        
        let status = subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE'
        
        // Calculer la date de fin d'engagement
        const commitmentEndDate = isCommitmentPeriod && durationMonths > 0 
          ? new Date(new Date((subscription as any).current_period_start * 1000).setMonth(
              new Date((subscription as any).current_period_start * 1000).getMonth() + durationMonths
            ))
          : null
        
        // Si engagement défini, s'assurer que l'annulation automatique est programmée
        if (commitmentEndDate && isCommitmentPeriod) {
          const commitmentEndTimestamp = Math.floor(commitmentEndDate.getTime() / 1000)
          const now = Math.floor(new Date().getTime() / 1000)
          
          // Si engagement pas encore terminé
          if (now < commitmentEndTimestamp) {
            status = 'ACTIVE'
            
            // Si aucune annulation n'est programmée OU si elle ne correspond pas à la fin de l'engagement, la programmer
            if (!subscription.cancel_at || subscription.cancel_at !== commitmentEndTimestamp) {
              await stripe.subscriptions.update(subscription.id, {
                cancel_at: commitmentEndTimestamp,
              })
              console.log(`📅 Programmed/Adjusted automatic cancellation at end of commitment: ${commitmentEndDate.toISOString()}`)
            }
          } else {
            // Engagement terminé - si l'abonnement est toujours actif, il sera annulé automatiquement par Stripe
            // Le statut sera mis à jour lors du webhook customer.subscription.deleted
            if (subscription.status === 'active' && subscription.cancel_at) {
              // L'abonnement devrait être annulé bientôt
              status = 'ACTIVE'
            }
          }
        }
        
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: status,
            stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            commitmentEndDate: commitmentEndDate?.toISOString() || null,
            willCancelAfterCommitment: subscription.cancel_at ? true : false,
          })
          .eq('stripeSubscriptionId', subscription.id)

        if (error) {
          console.error('Error updating subscription:', error)
        }

        console.log(`✅ Subscription updated: ${subscription.id} - Status: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'CANCELED' })
          .eq('stripeSubscriptionId', subscription.id)

        if (error) {
          console.error('Error canceling subscription:', error)
        }

        console.log(`✅ Subscription canceled: ${subscription.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'PAST_DUE' })
          .eq('stripeCustomerId', invoice.customer as string)

        if (error) {
          console.error('Error updating subscription status:', error)
        }

        console.log(`⚠️ Payment failed for customer: ${invoice.customer}`)
        break
      }

      default:
        console.log(`🤷‍♂️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getPlanFromMetadata(planId: string | undefined): 'MONTHLY' | 'YEARLY' | 'LIFETIME' {
  // Map your plan IDs to subscription plan types
  const planMapping: Record<string, 'MONTHLY' | 'YEARLY' | 'LIFETIME'> = {
    'essentiel': 'MONTHLY',
    'avance': 'MONTHLY', 
    'premium': 'MONTHLY',
    'starter': 'MONTHLY',
    'pro': 'MONTHLY',
    'expert': 'MONTHLY',
  }
  
  return planMapping[planId || ''] || 'MONTHLY'
}

function getPlanIdFromPriceId(priceId: string): string {
  const priceIdLower = priceId.toLowerCase()
  
  // Mapping spécifique pour les price IDs connus
  if (priceIdLower === 'price_1sftnzrnelgarkti51jscso') {
    return 'essentiel' // Plan 69 CHF
  }
  
  // Check if price ID contains plan identifiers
  if (priceIdLower.includes('essentiel')) return 'essentiel'
  if (priceIdLower.includes('avance')) return 'avance'
  if (priceIdLower.includes('premium')) return 'premium'
  if (priceIdLower.includes('starter')) return 'starter'
  if (priceIdLower.includes('pro')) return 'pro'
  if (priceIdLower.includes('expert')) return 'expert'
  
  // Default to starter
  return 'starter'
}
