import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    // Vérifier que Resend est configuré
    if (!resend || !process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY n\'est pas configurée')
      return NextResponse.json(
        { error: 'Service d\'email non configuré. Veuillez contacter l\'administrateur.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Envoyer l'email à info@only-you-coaching.com
    const { data, error } = await resend.emails.send({
      from: 'Only You Coaching <onboarding@resend.dev>', // Utilisez votre domaine vérifié si disponible
      to: 'info@only-you-coaching.com',
      replyTo: email,
      subject: `[Formulaire de contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #39334D; border-bottom: 2px solid #39334D; padding-bottom: 10px;">
            Nouveau message depuis le formulaire de contact
          </h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Nom:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p style="margin: 10px 0;"><strong>Téléphone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
            <p style="margin: 10px 0;"><strong>Sujet:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #39334D; margin: 20px 0;">
            <h3 style="color: #39334D; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Ce message a été envoyé depuis le formulaire de contact du site Only You Coaching.</p>
            <p>Vous pouvez répondre directement à cet email pour contacter ${name}.</p>
          </div>
        </div>
      `,
      text: `
Nouveau message depuis le formulaire de contact

Nom: ${name}
Email: ${email}
${phone ? `Téléphone: ${phone}` : ''}
Sujet: ${subject}

Message:
${message}

---
Ce message a été envoyé depuis le formulaire de contact du site Only You Coaching.
Vous pouvez répondre directement à cet email pour contacter ${name}.
      `,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email envoyé avec succès',
      id: data?.id 
    })
  } catch (error: any) {
    console.error('Erreur dans /api/contact:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}
