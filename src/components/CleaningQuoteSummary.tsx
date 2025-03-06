'use client'

import { priceUtils } from '@/utils/priceUtils'
import type { CleaningFormData } from '@/types/quote'
import { CalendarIcon, SparklesIcon, HomeIcon, ArrowPathIcon, MapPinIcon, CheckCircleIcon, CalculatorIcon, InformationCircleIcon, SwatchIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

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

function getPropertyStateLabel(state: string): string {
  const labels: Record<string, string> = {
    normal: 'État normal',
    dirty: 'Très sale',
    construction: 'Après travaux',
    moving: 'Fin de bail'
  }
  return labels[state] || state
}

function getFloorTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    parquet: 'Parquet',
    carpet: 'Moquette',
    tile: 'Carrelage',
    vinyl: 'Vinyle/Lino',
    marble: 'Marbre'
  }
  return labels[type] || type
}

export function CleaningQuoteSummary({ formData, quoteDetails, isCalculating }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      {/* En-tête avec gradient */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-emerald-600 rounded-lg"></div>
        <div className="relative p-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Résumé de votre devis
          </h2>
          <CalculatorIcon className="w-6 h-6 text-white" />
        </div>
        <div className="h-0.5 w-24 bg-white rounded-full mx-3"></div>
      </div>
      
      <div className="space-y-3 text-sm">
        {/* Informations générales */}
        <div className="bg-emerald-50 rounded-lg p-3">
          <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-emerald-600" />
            Informations générales
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {formData.cleaningDate && (
              <div className="col-span-2 flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  Date
                </span>
                <span className="font-medium">
                  {new Date(formData.cleaningDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            <div className="col-span-2 flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <SparklesIcon className="w-4 h-4 text-emerald-600" />
                Type
              </span>
              <span className="font-medium">{getCleaningTypeLabel(formData.cleaningType)}</span>
            </div>
            <div className="col-span-2 flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <ArrowPathIcon className="w-4 h-4 text-emerald-600" />
                Fréquence
              </span>
              <span className="font-medium">{getFrequencyLabel(formData.frequency)}</span>
            </div>
          </div>
        </div>

        {/* Détails du logement */}
        <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
          <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2 mb-2">
            <HomeIcon className="w-4 h-4 text-emerald-600" />
            Détails du logement
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Surface</span>
              <span className="font-medium">{formData.squareMeters} m²</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pièces</span>
              <span className="font-medium">{formData.numberOfRooms}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">SdB</span>
              <span className="font-medium">{formData.numberOfBathrooms}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">État</span>
              <span className="font-medium">{getPropertyStateLabel(formData.propertyState)}</span>
            </div>
          </div>
        </div>

        {/* Types de sols */}
        {Object.entries(formData.floorTypes).some(([_, value]) => value) && (
          <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
            <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2 mb-2">
              <SwatchIcon className="w-4 h-4 text-emerald-600" />
              Sols
            </h3>
            <div className="flex flex-wrap gap-1">
              {Object.entries(formData.floorTypes).map(([type, value]) => value && (
                <span key={type} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700">
                  {getFloorTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Services sélectionnés */}
        {Object.entries(formData.options).some(([_, value]) => value) && (
          <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
            <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              Services additionnels
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(formData.options).map(([key, value]) => value && (
                <div key={key} className="flex items-center text-gray-600 text-xs">
                  <CheckCircleIcon className="w-3 h-3 text-emerald-600 mr-1 flex-shrink-0" />
                  <span className="truncate">{getOptionLabel(key)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détails des coûts */}
        <div className="bg-emerald-50 rounded-lg p-3">
          <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2 mb-2">
            <CalculatorIcon className="w-4 h-4 text-emerald-600" />
            Coûts
          </h3>
          {isCalculating ? (
            <div className="flex items-center justify-center p-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prix de base</span>
                <span className="font-medium">{priceUtils.format(quoteDetails.basePrice)}</span>
              </div>

              {quoteDetails.frequencyDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 text-sm">
                  <span>Réduction</span>
                  <span>-{priceUtils.format(quoteDetails.frequencyDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-emerald-200 text-base font-bold">
                <span>Total TTC</span>
                <span className="text-emerald-700">{priceUtils.format(quoteDetails.totalCost)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Note d'information */}
        <div className="bg-emerald-50 rounded-lg p-2 flex gap-2">
          <InformationCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800">
            Ce devis est calculé sur la base des informations fournies. Le prix final peut varier selon les conditions sur place.
          </p>
        </div>
      </div>
    </div>
  )
} 