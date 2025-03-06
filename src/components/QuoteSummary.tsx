'use client'

import { priceUtils } from '@/utils/priceUtils'
import type { MovingFormData, QuoteDetails, AddressDetails } from '@/types/quote'
import { CalendarIcon, SparklesIcon, HomeIcon, ArrowPathIcon, MapPinIcon, CheckCircleIcon, CalculatorIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface BaseProps {
  type: 'cleaning' | 'moving'
  id: string
  status: string
  createdAt: string
  date: string
  time: string
  estimatedPrice: number
  isCalculating: boolean
  quoteDetails: {
    baseCost: number
    optionsCost: number
    totalCost: number
    fuelCost?: number
    tollCost?: number
    distance?: number
  }
}

interface CleaningProps extends BaseProps {
  type: 'cleaning'
  propertyType: string
  cleaningType: string
}

interface MovingProps extends BaseProps {
  type: 'moving'
  formData: MovingFormData
  quoteDetails: QuoteDetails
  addressDetails: AddressDetails
}

type Props = CleaningProps | MovingProps

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payé',
    completed: 'Terminé',
    cancelled: 'Annulé'
  }
  return labels[status] || status
}

export function QuoteSummary(props: Props) {
  const { type, id, status, createdAt, date, time, estimatedPrice } = props

  if (type !== 'moving') return null

  const formatPrice = (price?: number) => {
    if (price === undefined) return '...'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return '...'
    return `${distance.toFixed(1)} km`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="relative mb-4 bg-emerald-100 p-4">
        <h2 className="text-xl font-bold text-emerald-700 relative z-10 flex items-center justify-center gap-2 mb-1">
          <CalculatorIcon className="w-5 h-5 text-emerald-600" />
          Votre Projet en Un Coup d'Œil
        </h2>
        <div className="w-16 h-0.5 bg-emerald-500/50 mx-auto rounded-full"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Informations générales */}
        <div className="space-y-2">
          <h3 className="inline-flex items-center gap-1.5 text-base font-semibold text-emerald-800">
            <InformationCircleIcon className="w-4 h-4 text-emerald-600" />
            L'Essentiel à Savoir
          </h3>
          <div className="bg-emerald-50 rounded-lg p-2 divide-y divide-emerald-200/50 text-sm">
            {date && (
              <div className="flex justify-between items-center py-1 first:pt-0 last:pb-0">
                <span className="text-emerald-800 flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  Date prévue
                </span>
                <span className="font-medium text-emerald-900">
                  {new Date(date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {time && (
              <div className="flex justify-between items-center py-1 first:pt-0 last:pb-0">
                <span className="text-emerald-800">Heure</span>
                <span className="font-medium text-emerald-900">{time}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 first:pt-0 last:pb-0">
              <span className="text-emerald-800">Statut</span>
              <span className="font-medium text-emerald-900">{getStatusLabel(status)}</span>
            </div>
          </div>
        </div>

        {/* Détails spécifiques au type */}
        <div className="space-y-2">
          <h3 className="inline-flex items-center gap-1.5 text-base font-semibold text-emerald-800">
            <HomeIcon className="w-4 h-4 text-emerald-600" />
            Les Détails Qui Comptent
          </h3>
          <div className="bg-emerald-50 rounded-lg p-2 space-y-2 text-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-emerald-800">
                <MapPinIcon className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Départ:</span>
              </div>
              <p className="text-emerald-900 pl-5 text-xs">{props.formData.pickupAddress}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-emerald-800">
                <MapPinIcon className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Arrivée:</span>
              </div>
              <p className="text-emerald-900 pl-5 text-xs">{props.formData.deliveryAddress}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">Volume</span>
                <span className="font-medium text-emerald-900">{props.formData.volume} m³</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">Distance</span>
                <span className="font-medium text-emerald-900">{formatDistance(props.quoteDetails.distance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services additionnels */}
        <div className="space-y-2">
          <h3 className="inline-flex items-center gap-1.5 text-base font-semibold text-emerald-800">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            Vos Petits Plus
          </h3>
          <div className="bg-emerald-50 rounded-lg p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(props.formData.options).map(([key, value]) => 
              value && (
                <div key={key} className="flex items-center gap-1">
                  <CheckCircleIcon className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-800">{getServiceLabel(key)}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Détails des coûts */}
        <div className="space-y-2">
          <h3 className="inline-flex items-center gap-1.5 text-base font-semibold text-emerald-800">
            <CalculatorIcon className="w-4 h-4 text-emerald-600" />
            Le Moment des Comptes
          </h3>
          <div className="bg-emerald-50 rounded-lg text-sm">
            {props.isCalculating ? (
              <div className="text-center text-emerald-800 p-3">
                <div className="animate-spin h-5 w-5 mx-auto mb-2 text-emerald-600 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
                <span className="font-medium text-xs">Calcul en cours...</span>
              </div>
            ) : (
              <>
                <div className="p-2 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-800">Coût de base</span>
                    <span className="font-medium text-emerald-900">{formatPrice(props.quoteDetails.baseCost)}</span>
                  </div>
                  {props.quoteDetails.fuelCost !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-800">Frais de carburant</span>
                      <span className="font-medium text-emerald-900">{formatPrice(props.quoteDetails.fuelCost)}</span>
                    </div>
                  )}
                  {props.quoteDetails.tollCost !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-800">Frais de péage</span>
                      <span className="font-medium text-emerald-900">{formatPrice(props.quoteDetails.tollCost)}</span>
                    </div>
                  )}
                  {props.quoteDetails.optionsCost > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-800">Services additionnels</span>
                      <span className="font-medium text-emerald-900">{formatPrice(props.quoteDetails.optionsCost)}</span>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-emerald-600 rounded-b-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">Total TTC</span>
                    <span className="font-bold text-white text-lg">{formatPrice(props.quoteDetails.totalCost)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Note d'information */}
        <div className="bg-emerald-50 rounded-lg p-2">
          <div className="flex gap-2">
            <InformationCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">
              Cette estimation est basée sur les informations fournies. Le prix final peut varier en fonction des conditions spécifiques constatées lors de l'évaluation sur place.
            </p>
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