'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface CancelSubscriptionProps {
  subscriptionId: string
  userId: string
  planName: string
  commitmentEndDate?: string
  isCommitmentPeriod?: boolean
}

export default function CancelSubscription({ 
  subscriptionId, 
  userId, 
  planName,
  commitmentEndDate,
  isCommitmentPeriod = false 
}: CancelSubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscriptionId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage(data.message)
        setShowConfirm(false)
        
        if (data.isCommitmentPeriod) {
          // Rediriger vers une page d'information sur l'engagement
          setTimeout(() => {
            window.location.href = '/souscriptions/personnalise?cancelled=true&commitment=true'
          }, 2000)
        } else {
          // Rediriger vers la page de confirmation d'annulation
          setTimeout(() => {
            window.location.href = '/souscriptions/personnalise?cancelled=true'
          }, 2000)
        }
      } else {
        setMessage(`Erreur: ${data.error}`)
      }
    } catch (error) {
      setMessage('Une erreur est survenue lors de l\'annulation')
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-4">
          Confirmer l'annulation
        </h3>
        
        {isCommitmentPeriod && commitmentEndDate ? (
          <div className="mb-4">
            <p className="text-red-700 mb-2">
              ⚠️ Vous êtes dans une période d'engagement de <strong>{planName}</strong>
            </p>
            <p className="text-red-600 text-sm mb-2">
              Vous êtes engagé jusqu'au <strong>{new Date(commitmentEndDate).toLocaleDateString('fr-FR')}</strong>.
            </p>
            <p className="text-red-600 text-sm font-semibold">
              Vous continuerez à être facturé chaque mois jusqu'à cette date, conformément à votre engagement.
              Après cette date, votre abonnement sera automatiquement annulé et ne sera plus renouvelé.
            </p>
          </div>
        ) : (
          <p className="text-red-700 mb-4">
            Êtes-vous sûr de vouloir annuler votre abonnement <strong>{planName}</strong> ?
            L'annulation sera immédiate et vous ne serez plus facturé.
          </p>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
          </Button>
          <Button
            onClick={() => setShowConfirm(false)}
            variant="outline"
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>
        
        {message && (
          <p className={`mt-3 text-sm ${message.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <Button
        onClick={() => setShowConfirm(true)}
        variant="outline"
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        Annuler l'abonnement
      </Button>
      
      {isCommitmentPeriod && commitmentEndDate && (
        <p className="text-xs text-gray-500 mt-2">
          Période d'engagement jusqu'au {new Date(commitmentEndDate).toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  )
}
