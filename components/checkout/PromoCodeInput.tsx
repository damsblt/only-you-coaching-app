'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface PromoCodeInputProps {
  planId: string
  userId: string
  originalAmount: number // Montant en centimes
  onPromoApplied: (discount: {
    promoCodeId: string
    code: string
    discountAmount: number
    finalAmount: number
    stripeCouponId: string | null
  }) => void
  onPromoRemoved: () => void
}

export default function PromoCodeInput({
  planId,
  userId,
  originalAmount,
  onPromoApplied,
  onPromoRemoved,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string
    discountAmount: number
    finalAmount: number
    percentage: number | null
    promoCodeId: string
    stripeCouponId: string | null
  } | null>(null)

  const handleApplyPromo = async () => {
    if (!code.trim()) {
      setError('Veuillez entrer un code promo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          planId,
          userId,
          originalAmount,
        }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setAppliedPromo({
          code: data.promoCode.code,
          discountAmount: data.discount.amount,
          finalAmount: data.discount.finalAmount,
          percentage: data.discount.percentage,
          promoCodeId: data.promoCode.id,
          stripeCouponId: data.promoCode.stripeCouponId,
        })
        onPromoApplied({
          promoCodeId: data.promoCode.id,
          code: data.promoCode.code,
          discountAmount: data.discount.amount,
          finalAmount: data.discount.finalAmount,
          stripeCouponId: data.promoCode.stripeCouponId,
        })
        setError(null)
      } else {
        setError(data.error || 'Code promo invalide')
      }
    } catch (err) {
      setError('Erreur lors de la validation du code')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setCode('')
    setError(null)
    onPromoRemoved()
  }

  const formatAmount = (amount: number) => {
    return `${(amount / 100).toFixed(2)} CHF`
  }

  if (appliedPromo) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-900">{appliedPromo.code}</span>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Prix original:</span>
                  <span className="line-through">{formatAmount(originalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-medium">
                  <span>
                    Réduction
                    {appliedPromo.percentage && ` (${appliedPromo.percentage}%)`}:
                  </span>
                  <span>-{formatAmount(appliedPromo.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-green-900 font-bold text-base pt-1 border-t border-green-200">
                  <span>Nouveau prix:</span>
                  <span>{formatAmount(appliedPromo.finalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleRemovePromo}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Retirer le code promo"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Tag className="w-4 h-4 text-gray-500" />
        <label className="text-sm font-medium text-gray-700">Code Promo</label>
      </div>

      <div className="flex space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleApplyPromo()
              }
            }}
            placeholder="ENTREZ VOTRE CODE"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase text-sm"
            disabled={loading}
          />
        </div>
        <Button
          type="button"
          onClick={handleApplyPromo}
          disabled={loading || !code.trim()}
          className="flex items-center space-x-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Vérification...</span>
            </>
          ) : (
            <>
              <Tag className="w-4 h-4" />
              <span>Appliquer</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Vous avez un code promo ? Entrez-le ci-dessus pour bénéficier d'une réduction.
      </p>
    </div>
  )
}
