import { NextRequest, NextResponse } from 'next/server'
import {
  sendAdminNewSubscriberEmail,
  sendClientSubscriptionConfirmationEmail,
} from '@/lib/emails'

/**
 * API de test pour vérifier l'envoi des emails
 * GET /api/test-emails?type=admin — envoie un email de test admin
 * GET /api/test-emails?type=client&email=xxx — envoie un email de test client
 * GET /api/test-emails?type=all&email=xxx — envoie les deux
 * 
 * ⚠️  À SUPPRIMER en production
 */
export async function GET(req: NextRequest) {
  // Seulement en développement
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get('type') || 'all'
  const testEmail = req.nextUrl.searchParams.get('email') || 'test@example.com'
  
  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 3)
  const nextPayment = new Date(now)
  nextPayment.setMonth(nextPayment.getMonth() + 1)

  const results: string[] = []

  try {
    if (type === 'admin' || type === 'all') {
      await sendAdminNewSubscriberEmail({
        customerEmail: testEmail,
        customerName: 'Marie-Line Dupont (TEST)',
        planId: 'essentiel',
        amountPaid: 6900,
        currency: 'chf',
        subscriptionId: 'sub_test_123456',
        startDate: now,
        endDate: endDate,
        renewalDate: endDate,
      })
      results.push('✅ Admin new subscriber email sent')
    }

    if (type === 'client' || type === 'all') {
      await sendClientSubscriptionConfirmationEmail({
        customerEmail: testEmail,
        customerName: 'Marie-Line Dupont (TEST)',
        planId: 'essentiel',
        amountPaid: 6900,
        currency: 'chf',
        startDate: now,
        endDate: endDate,
        renewalDate: endDate,
        nextPaymentDate: nextPayment,
        willAutoRenew: true,
      })
      results.push(`✅ Client confirmation email sent to ${testEmail}`)
    }

    return NextResponse.json({
      success: true,
      results,
      note: 'Check info@only-you-coaching.com for admin email and the test email address for client email',
    })
  } catch (error: any) {
    console.error('❌ Test email error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
    }, { status: 500 })
  }
}
