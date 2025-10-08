import { Metadata } from 'next'
import { ContactForm, ContactInfo } from '@/components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'Contact - Marie-Line Pilates',
  description: 'Contactez Marie-Line pour toute question sur le Pilates, les programmes ou les abonnements',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contactez-nous
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Avez-vous des questions sur le Pilates ? Besoin d'aide pour choisir un programme adapté à vos besoins ? 
            Marie-Line et son équipe sont là pour vous accompagner dans votre parcours bien-être.
          </p>
        </div>

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

        {/* Section FAQ rapide */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-gray-600">
              Trouvez rapidement des réponses aux questions les plus courantes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Comment choisir mon niveau ?
              </h3>
              <p className="text-gray-600 text-sm">
                Si vous débutez, commencez par les vidéos "Débutant". Pour les pratiquants réguliers, 
                les niveaux "Intermédiaire" et "Avancé" vous conviendront mieux.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="text-gray-600 text-sm">
                Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel. 
                Aucun frais d'annulation ne s'applique.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Les vidéos sont-elles accessibles hors ligne ?
              </h3>
              <p className="text-gray-600 text-sm">
                Pour le moment, les vidéos nécessitent une connexion internet. Nous travaillons sur 
                une fonctionnalité de téléchargement pour les abonnés premium.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Y a-t-il un essai gratuit ?
              </h3>
              <p className="text-gray-600 text-sm">
                Oui ! Vous pouvez accéder à plusieurs vidéos gratuites pour découvrir notre méthode 
                avant de vous abonner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


