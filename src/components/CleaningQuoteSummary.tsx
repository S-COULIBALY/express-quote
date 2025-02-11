'use client'

import { priceUtils } from '@/utils/priceUtils'
import type { CleaningFormData } from '@/types/quote'

interface QuoteDetails {
  basePrice: number
  frequencyDiscount: number
  totalCost: number
}

interface Props {
  formData: CleaningFormData
  quoteDetails: QuoteDetails
  isCalculating: boolean
}

export function CleaningQuoteSummary({ formData, quoteDetails, isCalculating }: Props) {
  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-8">
        <h2 className="text-xl font-bold mb-6">Détails du Devis</h2>
        
        <div className="space-y-4">
          {/* Informations générales */}
          <div className="pb-4 border-b">
            <h3 className="font-medium mb-3">Informations générales</h3>
            {formData.cleaningDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Date prévue</span>
                <span className="font-medium">
                  {new Date(formData.cleaningDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Type de nettoyage</span>
              <span className="font-medium">{getCleaningTypeLabel(formData.cleaningType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fréquence</span>
              <span className="font-medium">{getFrequencyLabel(formData.frequency)}</span>
            </div>
          </div>

          {/* Détails du logement */}
          <div className="pb-4 border-b">
            <h3 className="font-medium mb-3">Détails du logement</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Surface</span>
                <span className="font-medium">{formData.squareMeters} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre de pièces</span>
                <span className="font-medium">{formData.numberOfRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre de salles de bain</span>
                <span className="font-medium">{formData.numberOfBathrooms}</span>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="pb-4 border-b">
            <h3 className="font-medium mb-3">Adresse</h3>
            <p className="font-medium">{formData.address}</p>
          </div>

          {/* Services sélectionnés */}
          {Object.entries(formData.options).some(([_, value]) => value) && (
            <div className="pb-4 border-b">
              <h3 className="font-medium mb-3">Services additionnels</h3>
              <div className="space-y-1">
                {Object.entries(formData.options).map(([key, value]) => value && (
                  <div key={key} className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{getOptionLabel(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Détails des coûts */}
          <div className="space-y-2">
            <h3 className="font-medium mb-3">Détails des coûts</h3>
            {isCalculating ? (
              <div className="text-center text-gray-500">Calcul en cours...</div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix de base</span>
                  <span className="font-medium">{priceUtils.format(quoteDetails.basePrice)}</span>
                </div>

                {quoteDetails.frequencyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction fréquence</span>
                    <span>-{priceUtils.format(quoteDetails.frequencyDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total TTC</span>
                  <span>{priceUtils.format(quoteDetails.totalCost)}</span>
                </div>
              </>
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