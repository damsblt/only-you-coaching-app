import { Metadata } from 'next'
import { CheckCircle } from 'lucide-react'
import { pricingPlans } from '../../data/pricingPlans'

export const metadata: Metadata = {
  title: 'Abonnements - Marie-Line Pilates',
  description: 'Découvrez nos abonnements Pilates pour un suivi régulier',
}

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Abonnements
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choisissez l'abonnement qui correspond à vos objectifs et à votre rythme
          </p>
        </div>

        {/* Personalized Coaching Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {pricingPlans.personalized.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.personalized.plans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg p-8 border-2 ${
                index === 1 ? 'border-primary-500 relative' : 'border-gray-200'
              }`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Populaire
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">DURÉE: {plan.duration}</p>
                  <div className="text-4xl font-bold text-primary-600">{plan.price}</div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                  index === 1 
                    ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}>
                  Choisir ce plan
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Online Autonomy Plans */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {pricingPlans.online.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.online.plans.map((plan, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">DURÉE: {plan.duration}</p>
                  <div className="text-4xl font-bold text-gray-900">{plan.price}</div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                  Choisir ce plan
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je changer d'abonnement ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez modifier votre abonnement à tout moment depuis votre espace personnel.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Y a-t-il des frais d'annulation ?
              </h3>
              <p className="text-gray-600">
                Non, vous pouvez annuler votre abonnement sans frais à tout moment.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Les séances sont-elles enregistrées ?
              </h3>
              <p className="text-gray-600">
                Oui, toutes les séances en ligne sont enregistrées et disponibles en replay.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je suspendre mon abonnement ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez suspendre votre abonnement pour une durée maximale de 3 mois.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
