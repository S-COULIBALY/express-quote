'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteRecap } from '@/components/QuoteRecap'
import { Button } from '@/components/Button'
import type { CleaningQuote } from '@/types/quote'

export default function CleaningQuoteSummary() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [quoteData, setQuoteData] = useState<CleaningQuote | null>(null)

  useEffect(() => {
    // Récupérer les données du localStorage
    const savedQuote = localStorage.getItem('cleaningQuote')
    if (savedQuote) {
      const parsedQuote = JSON.parse(savedQuote)
      if (parsedQuote.id === quoteId) {
        setQuoteData(parsedQuote)
      }
    }
  }, [quoteId])

  if (!quoteData) {
    return <div className="p-8 text-center">Devis non trouvé</div>
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

  const selectedOptions = Object.entries(quoteData.options)
    .filter(([_, isSelected]) => isSelected)
    .map(([key]) => ({
      label: getOptionLabel(key)
    }))

  const propertyTypeLabel = 
    quoteData.propertyType === 'apartment' ? 'Appartement' :
    quoteData.propertyType === 'house' ? 'Maison' : 'Bureau'

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <QuoteRecap
          title="Devis de Nettoyage"
          date={quoteData.cleaningDate}
          address={quoteData.address}
          pricing={{
            baseCost: quoteData.baseCost,
            additionalCosts: [
              { label: 'Services supplémentaires', amount: quoteData.optionsCost }
            ],
            totalCost: quoteData.totalCost
          }}
          selectedOptions={selectedOptions}
          additionalDetails={{
            'Type de bien': propertyTypeLabel,
            'Surface': `${quoteData.squareMeters} m²`,
            'Nombre de pièces': quoteData.numberOfRooms,
            'Nombre de salles de bain': quoteData.numberOfBathrooms
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