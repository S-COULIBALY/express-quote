'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteRecap } from '@/components/QuoteRecap'
import { Button } from '@/components/Button'
import type { MovingQuote } from '@/types/quote'

interface MovingQuoteData extends MovingQuote {
  volume: string
  distance: number
  pickupAddress: string
  deliveryAddress: string
  options: {
    packing: boolean
    assembly: boolean
    disassembly: boolean
    insurance: boolean
    storage: boolean
  }
  totalCost: number
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MovingSummaryContent />
    </Suspense>
  )
}

function MovingSummaryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [quoteData, setQuoteData] = useState<MovingQuoteData | null>(null)

  useEffect(() => {
    // Récupérer les données du localStorage
    const savedQuote = localStorage.getItem('movingQuote')
    if (savedQuote) {
      const parsedQuote = JSON.parse(savedQuote) as MovingQuoteData
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

  return (
    <main className="p-8">
      <div className="max-w-3xl mx-auto">
        <QuoteRecap
          title="Devis de déménagement"
          date={quoteData.preferredDate}
          address={{
            pickup: quoteData.pickupAddress,
            delivery: quoteData.deliveryAddress
          }}
          pricing={{
            baseCost: quoteData.totalCost,
            additionalCosts: [],
            totalCost: quoteData.totalCost
          }}
          selectedOptions={selectedOptions}
          additionalDetails={{
            'Volume estimé': `${quoteData.volume} m³`,
            'Distance estimée': `${quoteData.distance} km`
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
            onClick={() => router.push(`/moving/payment?id=${quoteId}`)}
          >
            Procéder au paiement
          </Button>
        </div>
      </div>
    </main>
  )
}

function getOptionLabel(key: string): string {
  const labels: Record<string, string> = {
    packing: 'Emballage',
    assembly: 'Montage des meubles',
    disassembly: 'Démontage des meubles',
    insurance: 'Assurance',
    storage: 'Stockage temporaire'
  }
  return labels[key] || key
} 