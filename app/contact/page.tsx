import { Metadata } from 'next'
import { ContactForm, ContactInfo } from '@/components/contact/ContactForm'
import { Section } from '@/components/ui/Section'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Contact - Only You Coaching',
  description: 'Contactez Marie-Line pour toute question sur les programmes ou les abonnements',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <PageHeader
        title="Contactez-nous"
        height="medium"
      />
      <Section 
        gradient="soft"
      >
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Informations de contact */}
          <div className="lg:col-span-1">
            <ContactInfo />
          </div>
        </div>
      </Section>
    </div>
  )
}


