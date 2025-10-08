import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cours Débutant - Marie-Line Pilates',
  description: 'Découvrez le Pilates avec nos cours spécialement conçus pour les débutants',
}

export default function BeginnerCoursePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cours Débutant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez le Pilates en douceur avec des exercices adaptés aux débutants
          </p>
        </div>

        {/* Course Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Votre parcours d'apprentissage
              </h2>
              <p className="text-gray-600 mb-6">
                Ce programme de 8 semaines vous accompagne dans la découverte du Pilates. 
                Vous apprendrez les bases essentielles, les principes fondamentaux et 
                développerez progressivement votre force et votre souplesse.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-primary-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-sm">1</span>
                  </span>
                  <span className="text-gray-700">8 semaines de cours progressifs</span>
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-primary-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-sm">2</span>
                  </span>
                  <span className="text-gray-700">2 séances par semaine</span>
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-primary-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-sm">3</span>
                  </span>
                  <span className="text-gray-700">Support vidéo et PDF</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Ce que vous allez apprendre
              </h3>
              <ul className="space-y-2 text-primary-800">
                <li>• Les 6 principes fondamentaux du Pilates</li>
                <li>• La respiration Pilates</li>
                <li>• L'alignement du corps</li>
                <li>• Les exercices de base</li>
                <li>• La concentration et la précision</li>
                <li>• La fluidité des mouvements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Weekly Program */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Programme hebdomadaire
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { week: 1, title: "Découverte", description: "Introduction au Pilates et respiration" },
              { week: 2, title: "Fondamentaux", description: "Les 6 principes de base" },
              { week: 3, title: "Alignement", description: "Posture et positionnement" },
              { week: 4, title: "Mouvements", description: "Exercices de base" },
              { week: 5, title: "Renforcement", description: "Développement de la force" },
              { week: 6, title: "Souplesse", description: "Étirements et mobilité" },
              { week: 7, title: "Coordination", description: "Fluidité des mouvements" },
              { week: 8, title: "Perfectionnement", description: "Consolidation des acquis" }
            ].map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center">
                <div className="w-8 h-8 bg-primary-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{item.week}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing and Registration */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Inscription au cours débutant
            </h2>
            <p className="text-gray-600">
              Rejoignez notre communauté de débutants et commencez votre transformation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-4">
                Cours en groupe
              </h3>
              <div className="text-3xl font-bold text-primary-600 mb-4">
                149€
              </div>
              <ul className="space-y-2 text-primary-800 mb-6">
                <li>• 8 semaines de cours</li>
                <li>• 2 séances par semaine</li>
                <li>• Maximum 8 participants</li>
                <li>• Support vidéo inclus</li>
                <li>• Groupe WhatsApp</li>
              </ul>
              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                S'inscrire en groupe
              </button>
            </div>

            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                Cours individuel
              </h3>
              <div className="text-3xl font-bold text-secondary-600 mb-4">
                299€
              </div>
              <ul className="space-y-2 text-secondary-800 mb-6">
                <li>• 8 semaines de cours</li>
                <li>• 2 séances par semaine</li>
                <li>• Suivi personnalisé</li>
                <li>• Programme adapté</li>
                <li>• Support prioritaire</li>
              </ul>
              <button className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                S'inscrire individuellement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
