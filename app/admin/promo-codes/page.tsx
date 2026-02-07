'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, Edit, CheckCircle, XCircle, Tag, TrendingUp } from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  stripe_coupon_id: string | null
  max_uses: number | null
  current_uses: number
  max_uses_per_user: number
  eligible_plans: string[] | null
  valid_from: string
  valid_until: string | null
  is_active: boolean
  description: string | null
  created_at: string
}

export default function PromoCodesAdminPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: '',
    maxUses: '',
    maxUsesPerUser: '1',
    eligiblePlans: [] as string[],
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    description: '',
    createStripeCoupon: true,
  })

  const availablePlans = ['essentiel', 'avance', 'premium', 'starter', 'pro', 'expert']

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/promo-codes')
      const data = await response.json()
      
      if (response.ok) {
        setPromoCodes(data.promoCodes || [])
      } else {
        setError(data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discountType: formData.discountType,
          discountValue: parseInt(formData.discountValue),
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: parseInt(formData.maxUsesPerUser),
          eligiblePlans: formData.eligiblePlans.length > 0 ? formData.eligiblePlans : null,
          validFrom: formData.validFrom,
          validUntil: formData.validUntil || null,
          description: formData.description,
          createStripeCoupon: formData.createStripeCoupon,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Code promo créé avec succès !')
        setShowCreateModal(false)
        resetForm()
        fetchPromoCodes()
      } else {
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleDeletePromoCode = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) return

    try {
      const response = await fetch(`/api/admin/promo-codes?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Code promo supprimé')
        fetchPromoCodes()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        setSuccess('Statut mis à jour')
        fetchPromoCodes()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '',
      maxUsesPerUser: '1',
      eligiblePlans: [],
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      description: '',
      createStripeCoupon: true,
    })
  }

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`
    } else {
      return `${(value / 100).toFixed(2)} CHF`
    }
  }

  const getUsageColor = (current: number, max: number | null) => {
    if (!max) return 'text-gray-600'
    const percentage = (current / max) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-orange-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Tag className="w-8 h-8 text-primary-600 mr-3" />
              Codes Promo
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez les codes promotionnels et les réductions pour vos abonnements
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau Code Promo</span>
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes Actifs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {promoCodes.filter(p => p.is_active).length}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Utilisations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {promoCodes.reduce((sum, p) => sum + p.current_uses, 0)}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {promoCodes.length}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Promo Codes List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Réduction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Tag className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-lg font-medium">Aucun code promo</p>
                      <p className="text-sm mt-1">Créez votre premier code promo pour commencer</p>
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{promo.code}</div>
                            {promo.description && (
                              <div className="text-xs text-gray-500">{promo.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDiscount(promo.discount_type, promo.discount_value)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {promo.discount_type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${getUsageColor(
                            promo.current_uses,
                            promo.max_uses
                          )}`}
                        >
                          {promo.current_uses} / {promo.max_uses || '∞'}
                        </div>
                        <div className="text-xs text-gray-500">utilisations</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {promo.valid_until
                            ? new Date(promo.valid_until).toLocaleDateString('fr-FR')
                            : 'Illimité'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(promo.valid_from).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          {promo.eligible_plans && promo.eligible_plans.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {promo.eligible_plans.map((plan) => (
                                <span
                                  key={plan}
                                  className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded"
                                >
                                  {plan}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">Tous les plans</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(promo.id, promo.is_active)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            promo.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {promo.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeletePromoCode(promo.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Créer un Code Promo
              </h2>

              <form onSubmit={handleCreatePromoCode} className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Promo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="NOEL2026"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de Réduction *
                    </label>
                    <select
                      required
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as 'percentage' | 'fixed_amount',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="percentage">Pourcentage (%)</option>
                      <option value="fixed_amount">Montant fixe (CHF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valeur *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: e.target.value })
                      }
                      placeholder={formData.discountType === 'percentage' ? '10' : '1000'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.discountType === 'percentage'
                        ? 'Ex: 10 pour 10%'
                        : 'En centimes. Ex: 1000 = 10 CHF'}
                    </p>
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Utilisations Max (global)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      placeholder="Illimité"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max par Utilisateur
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUsesPerUser}
                      onChange={(e) =>
                        setFormData({ ...formData, maxUsesPerUser: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Eligible Plans */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Plans Éligibles
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = availablePlans.every(plan => formData.eligiblePlans.includes(plan))
                        setFormData({
                          ...formData,
                          eligiblePlans: allSelected ? [] : [...availablePlans],
                        })
                      }}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
                    >
                      {availablePlans.every(plan => formData.eligiblePlans.includes(plan)) ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {availablePlans.map((plan) => (
                      <label key={plan} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.eligiblePlans.includes(plan)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                eligiblePlans: [...formData.eligiblePlans, plan],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                eligiblePlans: formData.eligiblePlans.filter((p) => p !== plan),
                              })
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{plan}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour tous les plans
                  </p>
                </div>

                {/* Validity Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de Début
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) =>
                        setFormData({ ...formData, validFrom: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'Expiration
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) =>
                        setFormData({ ...formData, validUntil: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (interne)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Notes internes sur ce code promo..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Stripe Coupon */}
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.createStripeCoupon}
                      onChange={(e) =>
                        setFormData({ ...formData, createStripeCoupon: e.target.checked })
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      Créer automatiquement le coupon dans Stripe
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">Créer le Code Promo</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
