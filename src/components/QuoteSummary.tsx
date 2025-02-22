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
    <aside className="hidden lg:block bg-gray-50 border rounded-lg shadow-sm">
      <header className="sticky top-0 bg-gray-50 p-6 border-b z-10">
        <h2 className="text-2xl font-bold text-gray-900">Résumé du devis</h2>
        <p className="text-sm text-gray-500 mt-1">Déménagement</p>
      </header>
      
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Informations du déménagement */}
          <section>
            <div className="text-lg font-semibold text-gray-900 mb-4">Détails du service</div>
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date prévue</span>
                <span className="font-medium">
                  {new Date(formData.movingDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Volume</span>
                <span className="font-medium">{formData.volume} m³</span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Distance estimée</span>
                  <span className="font-medium">{Math.round(quoteDetails.distance)} km</span>
                </div>
              </div>
            </div>
          </section>

          {/* Adresses */}
          <section>
            <div className="text-lg font-semibold text-gray-900 mb-4">Adresses</div>
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Départ</div>
                <div className="text-gray-600">{formData.pickupAddress}</div>
              </div>
              
              <div className="relative">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Arrivée</div>
                <div className="text-gray-600">{formData.deliveryAddress}</div>
              </div>
            </div>
          </section>

          {/* Options sélectionnées */}
          {Object.values(formData.options).some(Boolean) && (
            <section>
              <div className="text-lg font-semibold text-gray-900 mb-4">Services additionnels</div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <ul className="space-y-3">
                  {formData.options.packing && (
                    <li className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Emballage
                    </li>
                  )}
                  {/* Répéter pour chaque option */}
                </ul>
              </div>
            </section>
          )}

          {/* Coûts détaillés */}
          {!isCalculating && (
            <section className="mb-6">
              <div className="text-lg font-semibold text-gray-900 mb-4">Détails des coûts</div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Prix de base</span>
                    <span className="font-medium">{priceUtils.format(quoteDetails.baseCost)}</span>
                  </div>

                  {quoteDetails.optionsCost > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Options</span>
                      <span className="font-medium">{priceUtils.format(quoteDetails.optionsCost)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Péages</span>
                    <span className="font-medium">{priceUtils.format(quoteDetails.tollCost)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Carburant</span>
                    <span className="font-medium">{priceUtils.format(quoteDetails.fuelCost)}</span>
                  </div>

                  <div className="pt-4 mt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total TTC</span>
                      <span className="text-xl font-bold text-green-600">
                        {priceUtils.format(quoteDetails.totalCost)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      TVA incluse
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </aside>
  )
} 