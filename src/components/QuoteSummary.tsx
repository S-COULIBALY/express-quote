'use client'

import { priceUtils } from '@/utils/priceUtils'
import type { MovingFormData, QuoteDetails } from '@/types/quote'

interface BaseProps {
  type: 'cleaning' | 'moving'
  id: string
  status: string
  createdAt: string
  date: string
  time: string
  estimatedPrice: number
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
  isCalculating: boolean
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

  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Informations communes */}
        <div className="pb-4 border-b">
          <h3 className="font-medium mb-3">Informations générales</h3>
          {date && (
            <div className="flex justify-between">
              <span className="text-gray-600">Date prévue</span>
              <span className="font-medium">
                {new Date(date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          {time && (
            <div className="flex justify-between">
              <span className="text-gray-600">Heure</span>
              <span className="font-medium">{time}</span>
            </div>
          )}
        </div>

        {/* Informations spécifiques au type */}
        {type === 'cleaning' && (
          <div className="pb-4 border-b">
            <h3 className="font-medium mb-3">Détails du service</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Type de propriété</span>
                <p className="font-medium">{props.propertyType}</p>
              </div>
              <div>
                <span className="text-gray-600">Type de nettoyage</span>
                <p className="font-medium">{props.cleaningType}</p>
              </div>
            </div>
          </div>
        )}

        {type === 'moving' && (
          <div className="pb-4 border-b">
            <h3 className="font-medium mb-3">Détails du déménagement</h3>
            {/* Ajouter les détails spécifiques au déménagement */}
          </div>
        )}

        {/* Prix */}
        <div className="pb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Estimation du prix</span>
            <span className="font-medium">{priceUtils.format(estimatedPrice)}</span>
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