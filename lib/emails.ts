import { Resend } from 'resend'

// ============================================================================
// Configuration
// ============================================================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@only-you-coaching.com'
const FROM_EMAIL = process.env.EMAIL_FROM || 'Only You Coaching <onboarding@resend.dev>' // Remplacer par noreply@only-you-coaching.com si domaine vérifié dans Resend
const SITE_URL = 'https://only-you-coaching.com'

// ============================================================================
// Plan Configuration
// ============================================================================

interface PlanInfo {
  name: string
  category: string
  categoryLabel: string
  price: string
  duration: number
  durationLabel: string
  totalPrice: string
}

const PLANS: Record<string, PlanInfo> = {
  essentiel: {
    name: 'Essentiel',
    category: 'personalized',
    categoryLabel: 'Accompagnement',
    price: '69 CHF/mois',
    duration: 3,
    durationLabel: '3 mois',
    totalPrice: '207 CHF',
  },
  avance: {
    name: 'Avancé',
    category: 'personalized',
    categoryLabel: 'Accompagnement',
    price: '109 CHF/mois',
    duration: 3,
    durationLabel: '3 mois',
    totalPrice: '327 CHF',
  },
  premium: {
    name: 'Premium',
    category: 'personalized',
    categoryLabel: 'Accompagnement',
    price: '149 CHF/mois',
    duration: 3,
    durationLabel: '3 mois',
    totalPrice: '447 CHF',
  },
  starter: {
    name: 'Starter',
    category: 'online',
    categoryLabel: 'Autonomie',
    price: '35 CHF/mois',
    duration: 2,
    durationLabel: '2 mois',
    totalPrice: '70 CHF',
  },
  pro: {
    name: 'Pro',
    category: 'online',
    categoryLabel: 'Autonomie',
    price: '30 CHF/mois',
    duration: 4,
    durationLabel: '4 mois',
    totalPrice: '120 CHF',
  },
  expert: {
    name: 'Expert',
    category: 'online',
    categoryLabel: 'Autonomie',
    price: '25 CHF/mois',
    duration: 6,
    durationLabel: '6 mois',
    totalPrice: '150 CHF',
  },
}

// ============================================================================
// Helpers
// ============================================================================

function getPlanInfo(planId: string): PlanInfo {
  return PLANS[planId] || {
    name: planId || 'Inconnu',
    category: 'unknown',
    categoryLabel: 'Abonnement',
    price: 'N/A',
    duration: 1,
    durationLabel: '1 mois',
    totalPrice: 'N/A',
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatAmount(amountInCents: number, currency: string = 'chf'): string {
  const amount = amountInCents / 100
  const currencyLabel = currency.toUpperCase()
  return `${amount.toFixed(2)} ${currencyLabel}`
}

// ============================================================================
// Email Styles (shared)
// ============================================================================

const styles = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;',
  header: 'background: linear-gradient(135deg, #39334D 0%, #5B4F7A 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;',
  headerTitle: 'color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;',
  headerSubtitle: 'color: #D4CCE6; margin: 8px 0 0; font-size: 14px;',
  body: 'padding: 30px;',
  card: 'background-color: #F8F7FA; border-radius: 12px; padding: 24px; margin: 20px 0;',
  cardTitle: 'color: #39334D; margin: 0 0 16px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #39334D; padding-bottom: 8px;',
  row: 'display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; line-height: 1.6;',
  label: 'color: #666; font-weight: 500;',
  value: 'color: #39334D; font-weight: 600;',
  badge: 'display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;',
  badgeGreen: 'background-color: #E8F5E9; color: #2E7D32;',
  badgePurple: 'background-color: #EDE7F6; color: #4A148C;',
  badgeOrange: 'background-color: #FFF3E0; color: #E65100;',
  divider: 'border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;',
  footer: 'padding: 20px 30px; background-color: #F5F5F5; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #888;',
  button: 'display: inline-block; padding: 12px 28px; background-color: #39334D; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;',
  highlight: 'background: linear-gradient(135deg, #39334D 0%, #5B4F7A 100%); color: #ffffff; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;',
}

// ============================================================================
// EMAIL 1: Admin — Nouveau adhérent + paiement
// ============================================================================

interface AdminNewSubscriberParams {
  customerEmail: string
  customerName: string
  planId: string
  amountPaid: number
  currency: string
  subscriptionId: string
  startDate: Date
  endDate: Date
  renewalDate: Date | null
}

export async function sendAdminNewSubscriberEmail(params: AdminNewSubscriberParams) {
  if (!resend) {
    console.error('📧 Resend not configured — skipping admin email')
    return
  }

  const plan = getPlanInfo(params.planId)

  const html = `
    <div style="${styles.container}">
      <!-- Header -->
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">🎉 Nouvel adhérent !</h1>
        <p style="${styles.headerSubtitle}">Un nouveau paiement vient d'être effectué</p>
      </div>

      <!-- Body -->
      <div style="${styles.body}">

        <!-- Client Info -->
        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">👤 Informations du client</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 140px;">Nom</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${params.customerName || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${params.customerEmail}" style="color: #5B4F7A; font-weight: 600;">${params.customerEmail}</a></td>
            </tr>
          </table>
        </div>

        <!-- Plan Info -->
        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">📋 Abonnement souscrit</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 140px;">Plan</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">
                ${plan.name} — ${plan.categoryLabel}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Tarif</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${plan.price}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Engagement</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${plan.durationLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Total engagement</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${plan.totalPrice}</td>
            </tr>
          </table>
        </div>

        <!-- Payment Info -->
        <div style="${styles.highlight}">
          <p style="margin: 0 0 4px 0; font-size: 13px; opacity: 0.8;">Montant encaissé</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700;">${formatAmount(params.amountPaid, params.currency)}</p>
        </div>

        <!-- Dates -->
        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">📅 Dates clés</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 160px;">Début d'abonnement</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${formatDate(params.startDate)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Fin d'engagement</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${formatDate(params.endDate)}</td>
            </tr>
            ${params.renewalDate ? `
            <tr>
              <td style="padding: 6px 0; color: #666;">Prochain renouvellement</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${formatDate(params.renewalDate)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Stripe Link -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://dashboard.stripe.com/subscriptions/${params.subscriptionId}" style="${styles.button}">
            Voir dans Stripe →
          </a>
        </div>

        <!-- Subscription ID -->
        <p style="text-align: center; color: #aaa; font-size: 11px; margin-top: 16px;">
          ID Abonnement : ${params.subscriptionId}
        </p>
      </div>

      <!-- Footer -->
      <div style="${styles.footer}">
        <p style="margin: 0;">Only You Coaching — Notification automatique</p>
        <p style="margin: 4px 0 0;">Cet email a été envoyé automatiquement suite à un nouveau paiement.</p>
      </div>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🎉 Nouvel adhérent : ${params.customerName || params.customerEmail} — Plan ${plan.name} ${plan.categoryLabel}`,
      html,
    })

    if (error) {
      console.error('📧 ❌ Error sending admin new subscriber email:', error)
    } else {
      console.log(`📧 ✅ Admin new subscriber email sent: ${data?.id}`)
    }
  } catch (error) {
    console.error('📧 ❌ Exception sending admin email:', error)
  }
}

// ============================================================================
// EMAIL 2: Admin — Paiement récurrent réussi
// ============================================================================

interface AdminPaymentReceivedParams {
  customerEmail: string
  customerName: string
  planId: string
  amountPaid: number
  currency: string
  invoiceUrl: string | null
  periodStart: Date
  periodEnd: Date
}

export async function sendAdminPaymentReceivedEmail(params: AdminPaymentReceivedParams) {
  if (!resend) {
    console.error('📧 Resend not configured — skipping admin payment email')
    return
  }

  const plan = getPlanInfo(params.planId)

  const html = `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">💰 Paiement reçu</h1>
        <p style="${styles.headerSubtitle}">Un paiement récurrent vient d'être encaissé</p>
      </div>

      <div style="${styles.body}">
        <div style="${styles.highlight}">
          <p style="margin: 0 0 4px 0; font-size: 13px; opacity: 0.8;">Montant encaissé</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700;">${formatAmount(params.amountPaid, params.currency)}</p>
        </div>

        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">👤 Client</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 140px;">Nom</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${params.customerName || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${params.customerEmail}" style="color: #5B4F7A; font-weight: 600;">${params.customerEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Plan</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${plan.name} — ${plan.categoryLabel}</td>
            </tr>
          </table>
        </div>

        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">📅 Période de facturation</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 140px;">Du</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${formatDate(params.periodStart)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Au</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${formatDate(params.periodEnd)}</td>
            </tr>
          </table>
        </div>

        ${params.invoiceUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.invoiceUrl}" style="${styles.button}">
            Voir la facture →
          </a>
        </div>
        ` : ''}
      </div>

      <div style="${styles.footer}">
        <p style="margin: 0;">Only You Coaching — Notification automatique</p>
        <p style="margin: 4px 0 0;">Paiement récurrent encaissé avec succès.</p>
      </div>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `💰 Paiement reçu : ${formatAmount(params.amountPaid, params.currency)} — ${params.customerName || params.customerEmail}`,
      html,
    })

    if (error) {
      console.error('📧 ❌ Error sending admin payment email:', error)
    } else {
      console.log(`📧 ✅ Admin payment email sent: ${data?.id}`)
    }
  } catch (error) {
    console.error('📧 ❌ Exception sending admin payment email:', error)
  }
}

// ============================================================================
// EMAIL 3: Client — Confirmation de souscription
// ============================================================================

interface ClientSubscriptionConfirmationParams {
  customerEmail: string
  customerName: string
  planId: string
  amountPaid: number
  currency: string
  startDate: Date
  endDate: Date
  renewalDate: Date | null
  nextPaymentDate: Date
  willAutoRenew: boolean
}

export async function sendClientSubscriptionConfirmationEmail(params: ClientSubscriptionConfirmationParams) {
  if (!resend) {
    console.error('📧 Resend not configured — skipping client confirmation email')
    return
  }

  const plan = getPlanInfo(params.planId)
  const firstName = params.customerName?.split(' ')[0] || 'Cher(e) adhérent(e)'

  const html = `
    <div style="${styles.container}">
      <!-- Header -->
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">Bienvenue chez Only You Coaching !</h1>
        <p style="${styles.headerSubtitle}">Votre abonnement est confirmé</p>
      </div>

      <!-- Body -->
      <div style="${styles.body}">
        <!-- Welcome message -->
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Bonjour ${firstName},
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          Merci pour votre confiance ! Votre abonnement au plan 
          <strong style="color: #39334D;">${plan.name} — ${plan.categoryLabel}</strong> 
          est désormais actif. Voici le récapitulatif de votre souscription :
        </p>

        <!-- Subscription Summary -->
        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">📋 Votre abonnement</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 180px;">Plan choisi</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">
                ${plan.name} — ${plan.categoryLabel}
                <span style="${styles.badge} ${plan.category === 'personalized' ? styles.badgePurple : styles.badgeGreen}; margin-left: 8px;">
                  ${plan.category === 'personalized' ? 'Coaching' : 'En ligne'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Tarif mensuel</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">${plan.price}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Durée d'engagement</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">${plan.durationLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Montant total engagement</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">${plan.totalPrice}</td>
            </tr>
          </table>
        </div>

        <!-- Dates -->
        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">📅 Dates importantes</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 180px;">Début de l'abonnement</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">${formatDate(params.startDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Fin de l'engagement</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">${formatDate(params.endDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Prochain prélèvement</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">${formatDate(params.nextPaymentDate)}</td>
            </tr>
            ${params.renewalDate ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Renouvellement</td>
              <td style="padding: 8px 0; color: #39334D; font-weight: 600;">
                ${params.willAutoRenew 
                  ? `Automatique — l'abonnement prendra fin le ${formatDate(params.renewalDate)}` 
                  : `L'abonnement prendra fin le ${formatDate(params.renewalDate)}`
                }
              </td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Payment Confirmation -->
        <div style="${styles.highlight}">
          <p style="margin: 0 0 4px 0; font-size: 13px; opacity: 0.8;">Premier paiement effectué</p>
          <p style="margin: 0; font-size: 28px; font-weight: 700;">${formatAmount(params.amountPaid, params.currency)}</p>
          <p style="margin: 8px 0 0; font-size: 12px; opacity: 0.7;">✅ Paiement confirmé</p>
        </div>

        <!-- Renewal conditions -->
        <div style="background-color: #FFF8E1; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #FFA000;">
          <h4 style="color: #E65100; margin: 0 0 8px 0; font-size: 14px;">⚠️ Conditions de renouvellement</h4>
          <p style="color: #555; font-size: 13px; line-height: 1.6; margin: 0;">
            Votre abonnement est un engagement de <strong>${plan.durationLabel}</strong>. 
            ${params.willAutoRenew 
              ? `À la fin de la période d'engagement, l'abonnement prendra fin automatiquement. Vous n'avez rien à faire.`
              : `Le prélèvement de <strong>${plan.price}</strong> sera effectué mensuellement pendant la durée de votre engagement.`
            }
            <br><br>
            Pour toute question concernant votre abonnement, n'hésitez pas à nous contacter à 
            <a href="mailto:info@only-you-coaching.com" style="color: #5B4F7A;">info@only-you-coaching.com</a>.
          </p>
        </div>

        <hr style="${styles.divider}" />

        <!-- CTA -->
        <div style="text-align: center; margin: 24px 0;">
          <p style="color: #555; font-size: 15px; margin-bottom: 16px;">
            Accédez dès maintenant à votre espace membre :
          </p>
          <a href="${SITE_URL}/dashboard" style="${styles.button}">
            Accéder à mon espace →
          </a>
        </div>

        <!-- Contact -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #888; font-size: 13px;">
            Des questions ? Contactez-nous :<br/>
            📧 <a href="mailto:info@only-you-coaching.com" style="color: #5B4F7A;">info@only-you-coaching.com</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            📞 <a href="tel:+41762508024" style="color: #5B4F7A;">+41 76 250 80 24</a>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="${styles.footer}">
        <p style="margin: 0; font-weight: 600;">Only You Coaching</p>
        <p style="margin: 4px 0 0;">Pilates & Bien-être — Suisse</p>
        <p style="margin: 8px 0 0;">
          <a href="${SITE_URL}" style="color: #5B4F7A; text-decoration: none;">www.only-you-coaching.com</a>
        </p>
      </div>
    </div>
  `

  const text = `
Bienvenue chez Only You Coaching !

Bonjour ${firstName},

Merci pour votre confiance ! Votre abonnement au plan ${plan.name} — ${plan.categoryLabel} est désormais actif.

VOTRE ABONNEMENT
- Plan : ${plan.name} — ${plan.categoryLabel}
- Tarif : ${plan.price}
- Engagement : ${plan.durationLabel}
- Total : ${plan.totalPrice}

DATES IMPORTANTES
- Début : ${formatDate(params.startDate)}
- Fin d'engagement : ${formatDate(params.endDate)}
- Prochain prélèvement : ${formatDate(params.nextPaymentDate)}

PAIEMENT
- Montant débité : ${formatAmount(params.amountPaid, params.currency)}
- Statut : Confirmé ✅

CONDITIONS DE RENOUVELLEMENT
Votre abonnement est un engagement de ${plan.durationLabel}. Le prélèvement de ${plan.price} sera effectué mensuellement pendant la durée de votre engagement.

Accédez à votre espace membre : ${SITE_URL}/dashboard

Des questions ? Contactez-nous :
📧 info@only-you-coaching.com
📞 +41 76 250 80 24

---
Only You Coaching — Pilates & Bien-être — Suisse
www.only-you-coaching.com
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.customerEmail,
      replyTo: ADMIN_EMAIL,
      subject: `✅ Bienvenue ! Votre abonnement ${plan.name} — ${plan.categoryLabel} est confirmé`,
      html,
      text,
    })

    if (error) {
      console.error('📧 ❌ Error sending client confirmation email:', error)
    } else {
      console.log(`📧 ✅ Client confirmation email sent to ${params.customerEmail}: ${data?.id}`)
    }
  } catch (error) {
    console.error('📧 ❌ Exception sending client confirmation email:', error)
  }
}

// ============================================================================
// EMAIL 4: Admin — Échec de paiement
// ============================================================================

interface AdminPaymentFailedParams {
  customerEmail: string
  customerName: string
  amountDue: number
  currency: string
  invoiceUrl: string | null
}

export async function sendAdminPaymentFailedEmail(params: AdminPaymentFailedParams) {
  if (!resend) {
    console.error('📧 Resend not configured — skipping admin payment failed email')
    return
  }

  const html = `
    <div style="${styles.container}">
      <div style="background: linear-gradient(135deg, #C62828 0%, #E53935 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="${styles.headerTitle}">⚠️ Échec de paiement</h1>
        <p style="color: #FFCDD2; margin: 8px 0 0; font-size: 14px;">Un paiement récurrent a échoué</p>
      </div>

      <div style="${styles.body}">
        <div style="${styles.card}">
          <h3 style="${styles.cardTitle}">👤 Client concerné</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 140px;">Nom</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${params.customerName || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${params.customerEmail}" style="color: #5B4F7A; font-weight: 600;">${params.customerEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Montant dû</td>
              <td style="padding: 6px 0; color: #C62828; font-weight: 600;">${formatAmount(params.amountDue, params.currency)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #FFEBEE; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #C62828;">
          <p style="color: #555; font-size: 13px; line-height: 1.6; margin: 0;">
            <strong>Action recommandée :</strong> Contactez le client pour résoudre le problème de paiement. 
            Stripe tentera automatiquement de relancer le paiement dans les jours à venir.
          </p>
        </div>

        ${params.invoiceUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.invoiceUrl}" style="${styles.button}">
            Voir la facture →
          </a>
        </div>
        ` : ''}
      </div>

      <div style="${styles.footer}">
        <p style="margin: 0;">Only You Coaching — Notification automatique</p>
      </div>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `⚠️ Échec de paiement : ${params.customerName || params.customerEmail} — ${formatAmount(params.amountDue, params.currency)}`,
      html,
    })

    if (error) {
      console.error('📧 ❌ Error sending admin payment failed email:', error)
    } else {
      console.log(`📧 ✅ Admin payment failed email sent: ${data?.id}`)
    }
  } catch (error) {
    console.error('📧 ❌ Exception sending admin payment failed email:', error)
  }
}

// ============================================================================
// EMAIL 5: Admin — Abonnement annulé
// ============================================================================

interface AdminSubscriptionCanceledParams {
  customerEmail: string
  customerName: string
  planId: string
  subscriptionId: string
  cancelDate: Date
}

export async function sendAdminSubscriptionCanceledEmail(params: AdminSubscriptionCanceledParams) {
  if (!resend) {
    console.error('📧 Resend not configured — skipping admin cancellation email')
    return
  }

  const plan = getPlanInfo(params.planId)

  const html = `
    <div style="${styles.container}">
      <div style="background: linear-gradient(135deg, #E65100 0%, #FF8F00 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="${styles.headerTitle}">📤 Abonnement résilié</h1>
        <p style="color: #FFE0B2; margin: 8px 0 0; font-size: 14px;">Un adhérent a mis fin à son abonnement</p>
      </div>

      <div style="${styles.body}">
        <div style="${styles.card}">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 140px;">Client</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${params.customerName || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${params.customerEmail}" style="color: #5B4F7A; font-weight: 600;">${params.customerEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Plan</td>
              <td style="padding: 6px 0; color: #39334D; font-weight: 600;">${plan.name} — ${plan.categoryLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Date de résiliation</td>
              <td style="padding: 6px 0; color: #E65100; font-weight: 600;">${formatDate(params.cancelDate)}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="${styles.footer}">
        <p style="margin: 0;">Only You Coaching — Notification automatique</p>
      </div>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `📤 Résiliation : ${params.customerName || params.customerEmail} — Plan ${plan.name}`,
      html,
    })

    if (error) {
      console.error('📧 ❌ Error sending admin cancellation email:', error)
    } else {
      console.log(`📧 ✅ Admin cancellation email sent: ${data?.id}`)
    }
  } catch (error) {
    console.error('📧 ❌ Exception sending admin cancellation email:', error)
  }
}
