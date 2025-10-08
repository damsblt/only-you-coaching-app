import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cours Intermédiaire - Marie-Line Pilates',
  description: 'Cours de Pilates de niveau intermédiaire',
}

export default function IntermediateCoursePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cours Intermédiaire
          </h1>
          <p className="text-xl text-gray-600">
            Cours de Pilates de niveau intermédiaire - Page en construction
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Cette page sera bientôt disponible.</p>
        </div>
      </div>
    </div>
  )
}
