'use client'

import { priceUtils } from '@/utils/priceUtils'

interface BaseQuoteRecapProps {
  title: string
  date: string
  address: string | { pickup: string; delivery: string }
  pricing: {
    baseCost: number
    additionalCosts: Array<{ label: string; amount: number }>
    totalCost: number
  }
  selectedOptions: Array<{ label: string; price: string | number }>
  additionalDetails?: Record<string, string | number>
}

export function QuoteRecap({
  title,
  date,
  address,
  pricing,
  selectedOptions,
  additionalDetails
}: BaseQuoteRecapProps) {
  // Fonction pour formater les montants en euros
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">Récapitulatif de votre devis</p>
      </div>

      <div className="space-y-6">
        {/* Date */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Date prévue</span>
          <span className="font-medium">
            {new Date(date).toLocaleDateString('fr-FR')}
          </span>
        </div>

        {/* Adresse(s) */}
        {typeof address === 'string' ? (
          <div className="flex justify-between items-start">
            <span className="text-gray-600">Adresse</span>
            <span className="font-medium text-right">{address}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Adresse de départ</span>
              <span className="font-medium text-right">{address.pickup}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Adresse d'arrivée</span>
              <span className="font-medium text-right">{address.delivery}</span>
            </div>
          </div>
        )}

        {/* Détails additionnels */}
        {additionalDetails && Object.entries(additionalDetails).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-gray-600">{key}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}

        {/* Services sélectionnés */}
        {selectedOptions.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Services sélectionnés</h3>
            <div className="space-y-2">
              {selectedOptions.map((option, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">{option.label}</span>
                  <span className="font-medium">
                    {option.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résumé des coûts */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Détails des coûts</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Coût de base</span>
              <span className="font-medium">{formatPrice(pricing.baseCost)}</span>
            </div>
            {pricing.additionalCosts.map((cost, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{cost.label}</span>
                <span className="font-medium">{formatPrice(cost.amount)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total TTC</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(pricing.totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 