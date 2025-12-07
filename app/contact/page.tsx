import { Metadata } from 'next'
import { ContactForm, ContactInfo } from '@/components/contact/ContactForm'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Contact - Marie-Line Pilates',
  description: 'Contactez Marie-Line pour toute question sur le Pilates, les programmes ou les abonnements',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Section 
        gradient="soft" 
        title="Contactez-nous" 
        subtitle="Avez-vous des questions sur le Pilates ? Besoin d'aide pour choisir un programme adapté à vos besoins ? Marie-Line et son équipe sont là pour vous accompagner dans votre parcours bien-être."
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


