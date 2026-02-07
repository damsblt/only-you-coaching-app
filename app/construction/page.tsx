'use client'

import { Construction } from 'lucide-react'

export default function ConstructionPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://only-you-coaching.s3.eu-north-1.amazonaws.com/Photos/logo.png"
            alt="Only You Coaching"
            className="rounded-[0.9rem] object-contain max-h-12 w-auto"
            style={{ width: 'auto', height: 'auto', maxHeight: '48px' }}
            crossOrigin="anonymous"
            onError={(e) => {
              // Fallback vers le logo local si S3 échoue
              const target = e.target as HTMLImageElement
              if (!target.src.includes('/logo.png') && !target.src.includes('only-you-coaching.s3')) {
                target.src = '/logo.png'
              }
            }}
          />
        </div>
        
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
          <Construction className="w-8 h-8 text-burgundy-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Site en Construction
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Nous travaillons dur pour vous offrir une expérience exceptionnelle. 
          Le site sera bientôt disponible.
        </p>
        <div className="text-sm text-gray-500">
          <p>
            Pour toute question, contactez-nous à{' '}
            <a 
              href="mailto:info@only-you-coaching.com" 
              className="text-burgundy-500 hover:text-burgundy-600 transition-colors font-medium"
            >
              info@only-you-coaching.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
