import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

/**
 * 🔍 Endpoint de diagnostic Resend
 * GET /api/diagnose-resend
 * 
 * ⚠️  À SUPPRIMER après diagnostic
 */
export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_PREFIX: process.env.RESEND_API_KEY 
        ? process.env.RESEND_API_KEY.substring(0, 6) + '...' 
        : 'NOT SET',
      ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL || '(not set, default: info@only-you-coaching.com)',
      EMAIL_FROM: process.env.EMAIL_FROM || '(not set, default: onboarding@resend.dev)',
      NODE_ENV: process.env.NODE_ENV,
    },
    sendTest: null as any,
  }

  // Tenter un envoi test si la clé est configurée
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const toEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@only-you-coaching.com'
    const fromEmail = process.env.EMAIL_FROM || 'Only You Coaching <onboarding@resend.dev>'

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: '[DIAGNOSTIC] Test envoi Resend',
        html: '<p>Ceci est un email de test de diagnostic Resend. Si vous recevez cet email, la configuration fonctionne correctement.</p>',
        text: 'Ceci est un email de test de diagnostic Resend.',
      })

      if (error) {
        diagnostics.sendTest = {
          success: false,
          error: error,
          errorMessage: (error as any).message || JSON.stringify(error),
          errorName: (error as any).name,
          errorStatusCode: (error as any).statusCode,
          from: fromEmail,
          to: toEmail,
          hint: 'Avec onboarding@resend.dev, Resend ne permet l\'envoi qu\'à l\'email du compte. Vérifiez le domaine only-you-coaching.com dans Resend pour envoyer à info@only-you-coaching.com.',
        }
      } else {
        diagnostics.sendTest = {
          success: true,
          emailId: data?.id,
          from: fromEmail,
          to: toEmail,
          message: 'Email envoyé avec succès ! Vérifiez la boîte de réception.',
        }
      }
    } catch (err: any) {
      diagnostics.sendTest = {
        success: false,
        exception: err.message || String(err),
        from: fromEmail,
        to: toEmail,
      }
    }
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
