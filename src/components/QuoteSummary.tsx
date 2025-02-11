'use client'

import { priceUtils } from '@/utils/priceUtils'
import type { MovingFormData } from '@/types/quote'

interface QuoteDetails {
  distance: number
  tollCost: number
  fuelCost: number
  baseCost: number
  optionsCost: number
  totalCost: number
}

interface Props {
  formData: MovingFormData
  quoteDetails: QuoteDetails
  isCalculating: boolean
}

export function QuoteSummary({ formData, quoteDetails, isCalculating }: Props) {
  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-8">
        <h2 className="text-xl font-bold mb-6">Détails du Devis</h2>
        
        <div className="space-y-4">
          {/* Informations du déménagement */}
          <div className="pb-4 border-b">
            <h3 className="font-medium mb-3">Informations générales</h3>
            {formData.movingDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Date prévue</span>
                <span className="font-medium">
                  {new Date(formData.movingDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {formData.volume && (
              <div className="flex justify-between">
                <span className="text-gray-600">Volume</span>
                <span className="font-medium">{formData.volume} m³</span>
              </div>
            )}
          </div>

          {/* Adresses */}
          <div className="pb-4 border-b">
            <h3 className="font-medium mb-3">Adresses</h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Départ</span>
                <p className="font-medium">{formData.pickupAddress}</p>
              </div>
              <div>
                <span className="text-gray-600">Arrivée</span>
                <p className="font-medium">{formData.deliveryAddress}</p>
              </div>
              {formData.pickupAddress && formData.deliveryAddress && (
                <div className="flex justify-between pt-2">
                  <span className="text-gray-600">Distance</span>
                  {isCalculating ? (
                    <span className="text-gray-400">Calcul en cours...</span>
                  ) : (
                    <span className="font-medium">
                      {quoteDetails.distance > 0 
                        ? `${Math.round(quoteDetails.distance)} km`
                        : 'Non calculée'
                      }
                    </span>
                  )}
                </div>
              )}
            </div>
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
                    <span>{getServiceLabel(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Détails des coûts */}
          <div className="space-y-2">
            <h3 className="font-medium mb-3">Détails des coûts</h3>
            <div className="flex justify-between">
              <span className="text-gray-600">Coût de base</span>
              <span className="font-medium">{priceUtils.format(quoteDetails.baseCost)}</span>
            </div>
            
            {quoteDetails.optionsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Services supplémentaires</span>
                <span className="font-medium">{priceUtils.format(quoteDetails.optionsCost)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Frais de péage</span>
              <span className="font-medium">{priceUtils.format(quoteDetails.tollCost)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Frais de carburant</span>
              <span className="font-medium">{priceUtils.format(quoteDetails.fuelCost)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total TTC</span>
              <span>{priceUtils.format(quoteDetails.totalCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getServiceLabel(key: string): string {
  const labels: Record<string, string> = {
    packing: 'Emballage professionnel',
    assembly: 'Montage des meubles',
    disassembly: 'Démontage des meubles',
    insurance: 'Assurance tous risques',
    storage: 'Stockage temporaire'
  }
  return labels[key] || key
} 