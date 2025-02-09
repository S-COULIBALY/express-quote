'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteRecap } from '@/components/QuoteRecap'
import { Button } from '@/components/Button'

export default function MovingQuoteSummary() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [quoteData, setQuoteData] = useState<any>(null)

  useEffect(() => {
    // Récupérer les données du localStorage
    const savedQuote = localStorage.getItem('movingQuote')
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

  const selectedOptions = Object.entries(quoteData.options)
    .filter(([_, isSelected]) => isSelected)
    .map(([key]) => ({
      label: key === 'packing' ? 'Emballage professionnel' :
             key === 'assembly' ? 'Montage des meubles' :
             key === 'disassembly' ? 'Démontage des meubles' :
             key === 'insurance' ? 'Assurance tous risques' :
             'Stockage temporaire',
      price: key === 'insurance' ? '+10%' : 
             key === 'packing' ? '200€' :
             key === 'assembly' ? '150€' :
             key === 'disassembly' ? '100€' : '50€'
    }))

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <QuoteRecap
          title="Devis de Déménagement"
          date={quoteData.movingDate}
          address={{
            pickup: quoteData.pickupAddress,
            delivery: quoteData.deliveryAddress
          }}
          pricing={{
            baseCost: quoteData.baseCost,
            additionalCosts: [
              { label: 'Frais de péage', amount: quoteData.tollCost },
              { label: 'Services supplémentaires', amount: quoteData.optionsCost }
            ],
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