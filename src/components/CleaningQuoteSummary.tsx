'use client'

import { priceUtils } from '@/utils/priceUtils'
import type { CleaningFormData } from '@/types/quote'

interface QuoteDetails {
  basePrice: number
  frequencyDiscount: number
  totalCost: number
  optionsPrice: number
}

interface Props {
  formData: CleaningFormData
  quoteDetails: QuoteDetails
  isCalculating: boolean
}

export function CleaningQuoteSummary({ formData, quoteDetails, isCalculating }: Props) {
  return (
    <div className="hidden lg:block w-1/3 fixed right-0 top-0 h-screen overflow-y-auto p-6 bg-gray-50 border-l">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Détails du Devis</h2>
        
        <div className="space-y-6">
          {/* Informations du service */}
          <div className="pb-4 border-b">
            <h3 className="font-medium text-gray-900 mb-3">Service</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type de nettoyage</span>
                <span className="font-medium">{getCleaningTypeLabel(formData.cleaningType)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fréquence</span>
                <span className="font-medium">{getFrequencyLabel(formData.frequency)}</span>
              </div>
              {formData.cleaningDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date prévue</span>
                  <span className="font-medium">
                    {new Date(formData.cleaningDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Détails du logement */}
          <div className="pb-4 border-b">
            <h3 className="font-medium text-gray-900 mb-3">Logement</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Surface</span>
                <span className="font-medium">{formData.squareMeters} m²</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pièces</span>
                <span className="font-medium">{formData.numberOfRooms}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Salles de bain</span>
                <span className="font-medium">{formData.numberOfBathrooms}</span>
              </div>
            </div>
          </div>

          {/* Prix et options */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Tarification</h3>
            {isCalculating ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prix de base</span>
                  <span>{priceUtils.format(quoteDetails.basePrice)}</span>
                </div>

                {quoteDetails.optionsPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Options</span>
                    <span>{priceUtils.format(quoteDetails.optionsPrice)}</span>
                  </div>
                )}

                {quoteDetails.frequencyDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Réduction fréquence</span>
                    <span>-{priceUtils.format(quoteDetails.frequencyDiscount)}</span>
                  </div>
                )}

                <div className="pt-2 mt-2 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total TTC</span>
                    <span className="font-bold text-lg text-blue-600">
                      {priceUtils.format(quoteDetails.totalCost)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    TVA incluse
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getCleaningTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    standard: 'Standard',
    deep: 'Grand nettoyage',
    movingOut: 'Fin de bail',
    postConstruction: 'Après travaux'
  }
  return labels[type] || type
}

function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    oneTime: 'Une fois',
    weekly: 'Hebdomadaire',
    biweekly: 'Bi-mensuel',
    monthly: 'Mensuel'
  }
  return labels[frequency] || frequency
}

function getOptionLabel(key: string): string {
  const labels: Record<string, string> = {
    windows: 'Nettoyage des vitres',
    deepCleaning: 'Nettoyage en profondeur',
    carpets: 'Nettoyage des tapis',
    furniture: 'Nettoyage des meubles',
    appliances: 'Nettoyage des électroménagers'
  }
  return labels[key] || key
} 