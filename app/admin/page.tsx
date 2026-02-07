'use client'

import Link from 'next/link'
import { 
  Users, 
  Tag, 
  ArrowRight,
  Shield,
  ChevronLeft
} from 'lucide-react'

const adminSections = [
  {
    title: 'Gestion des Utilisateurs',
    description: 'Voir, créer et gérer les comptes utilisateurs et leurs abonnements',
    href: '/admin/users',
    icon: Users,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    title: 'Codes Promo',
    description: 'Créer et gérer les codes promotionnels et réductions',
    href: '/admin/promo-codes',
    icon: Tag,
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour au site
          </Link>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Shield className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Administration
            </h1>
          </div>
          <p className="mt-2 text-gray-600 text-lg">
            Tableau de bord d&apos;administration — Only You Coaching
          </p>
        </div>

        {/* Admin Sections Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${section.lightColor}`}>
                      <Icon className={`w-6 h-6 ${section.textColor}`} />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                <div className={`h-1 ${section.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
