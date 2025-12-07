import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { userId, subscriptionId } = await req.json()
    
    if (!userId || !subscriptionId) {
      return NextResponse.json({ error: 'User ID and Subscription ID required' }, { status: 400 })
    }

    // Récupérer l'abonnement depuis Stripe
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    // Vérifier si c'est un engagement
    const isCommitmentPeriod = subscription.metadata?.commitment_period === 'true'
    const durationMonths = parseInt(subscription.metadata?.duration_months || '0')
    
    if (isCommitmentPeriod && durationMonths > 0) {
      // Calculer la date de fin d'engagement
      const subscriptionStart = new Date(subscription.current_period_start * 1000)
      const commitmentEndDate = new Date(subscriptionStart)
      commitmentEndDate.setMonth(commitmentEndDate.getMonth() + durationMonths)
      
      // Calculer combien de cycles de paiement il reste
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      const now = new Date()
      
      let remainingPeriods = 0
      let testDate = new Date(subscriptionStart)
      
      // Compter les cycles restants jusqu'à la fin de l'engagement
      while (testDate < commitmentEndDate) {
        if (testDate > now) {
          remainingPeriods++
        }
        testDate = new Date(testDate)
        testDate.setMonth(testDate.getMonth() + 1)
      }
      
      // Si on est encore dans la période d'engagement
      if (now < commitmentEndDate) {
        // Programmer l'annulation à la fin de l'engagement (mais continuer à facturer)
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false, // Ne pas annuler à la fin de la période courante
          cancel_at: Math.floor(commitmentEndDate.getTime() / 1000), // Annuler à la fin de l'engagement
        })
        
        // Mettre à jour en base
        await supabaseAdmin
          .from('subscriptions')
          .update({
            cancelAtPeriodEnd: false,
            commitmentEndDate: commitmentEndDate.toISOString(),
            willCancelAfterCommitment: true,
          })
          .eq('stripeSubscriptionId', subscriptionId)
        
        return NextResponse.json({ 
          success: true,
          message: `Votre engagement de ${durationMonths} mois se termine le ${commitmentEndDate.toLocaleDateString('fr-FR')}. Vous continuerez à être facturé chaque mois jusqu'à cette date. Après cette date, votre abonnement sera automatiquement annulé.`,
          cancelAt: commitmentEndDate.toISOString(),
          remainingPeriods: remainingPeriods,
          isCommitmentPeriod: true
        })
      }
    }
    
    // Si engagement terminé, annulation immédiate
    await stripe.subscriptions.cancel(subscriptionId)
    
    await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'CANCELLED',
        cancelAtPeriodEnd: false
      })
      .eq('stripeSubscriptionId', subscriptionId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Votre abonnement a été annulé avec succès. Aucun prélèvement ne sera effectué à partir de maintenant.',
      isCommitmentPeriod: false
    })
    
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
