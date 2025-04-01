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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuoteData = async () => {
      setIsLoading(true)
      setError(null)
      
      if (!quoteId) {
        setError("Identifiant de devis manquant")
        setIsLoading(false)
        return
      }
      
      try {
        // 1. D'abord essayer de récupérer depuis localStorage
        const storedQuote = localStorage.getItem('movingQuote')
        
        if (storedQuote) {
          try {
            const parsedQuote = JSON.parse(storedQuote)
            
            // Vérifier que c'est bien le devis demandé
            if (parsedQuote.id === quoteId) {
              console.log('Données du devis récupérées du localStorage:', {
                id: quoteId,
                devis: parsedQuote,
                persistedId: parsedQuote.persistedId || 'Non persisté'
              })
              
              setQuoteData(parsedQuote)
              setIsLoading(false)
              return
            }
          } catch (parseError) {
            console.error('Erreur de parsing du localStorage:', parseError)
          }
        }
        
        // 2. Si persistedId est présent ou le localStorage n'a pas fonctionné, essayer l'API
        // Note: Cette partie sera implémentée quand l'API sera prête pour récupérer un devis
        // directement par son ID persisté
        
        // En cas d'échec, afficher une erreur
        setError("Impossible de trouver les informations du devis")
      } catch (error) {
        console.error('Erreur lors de la récupération du devis:', error)
        setError("Une erreur est survenue lors de la récupération du devis")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchQuoteData()
  }, [quoteId])

  const handleProceedToPayment = () => {
    router.push(`/moving/payment?id=${quoteId}`)
  }

  const handleEditQuote = () => {
    router.push('/moving/new')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !quoteData) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="mb-6">{error || "Données du devis non disponibles"}</p>
          <Button onClick={() => router.push('/moving/new')} color="primary">
            Créer un nouveau devis
          </Button>
        </div>
      </div>
    )
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
            onClick={handleEditQuote}
          >
            Modifier
          </Button>
          <Button
            onClick={handleProceedToPayment}
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