import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique des cookies - Marie-Line Pilates',
  description: 'Politique des cookies',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Politique des cookies
          </h1>
          <p className="text-xl text-gray-600">
            Page en construction
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Cette page sera bientôt disponible.</p>
        </div>
      </div>
    </div>
  )
}
