'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteRecap } from '@/components/QuoteRecap'
import { Button } from '@/components/Button'
import type { CleaningQuote } from '@/types/quote'

interface CleaningQuoteData extends CleaningQuote {
  propertyType: string
  cleaningType: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  frequency: string
  options: Record<string, boolean>
  totalCost: number
}

export default function CleaningQuoteSummary() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [quoteData, setQuoteData] = useState<CleaningQuoteData | null>(null)

  useEffect(() => {
    // Récupérer les données du localStorage
    const savedQuote = localStorage.getItem('cleaningQuote')
    if (savedQuote) {
      const parsedQuote = JSON.parse(savedQuote) as CleaningQuoteData
      if (parsedQuote.id === quoteId) {
        setQuoteData(parsedQuote)
      }
    }
  }, [quoteId])

  if (!quoteData) {
    return <div className="p-8 text-center">Devis non trouvé</div>
  }

  const selectedOptions = Object.entries(quoteData.options)
    .filter(([_, isSelected]) => isSelected)
    .map(([key]) => ({
      label: getOptionLabel(key),
      price: `${quoteData.totalCost} €`
    }))

  const propertyTypeLabel = getPropertyTypeLabel(quoteData.propertyType)

  return (
    <main className="p-8">
      <div className="max-w-3xl mx-auto">
        <QuoteRecap
          title="Devis de nettoyage"
          date={quoteData.preferredDate}
          address={quoteData.address}
          pricing={{
            baseCost: quoteData.totalCost,
            additionalCosts: [],
            totalCost: quoteData.totalCost
          }}
          selectedOptions={selectedOptions}
          additionalDetails={{
            'Type de bien': propertyTypeLabel,
            'Surface': `${quoteData.squareMeters} m²`,
            'Nombre de pièces': quoteData.numberOfRooms,
            'Nombre de salles de bain': quoteData.numberOfBathrooms,
            'Fréquence': getFrequencyLabel(quoteData.frequency)
          }}
        />

        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Modifier
          </Button>
          <Button
            onClick={() => router.push(`/cleaning/payment?id=${quoteId}`)}
          >
            Procéder au paiement
          </Button>
        </div>
      </div>
    </main>
  )
}

function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: 'Appartement',
    house: 'Maison',
    office: 'Bureau',
    commercial: 'Local commercial'
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