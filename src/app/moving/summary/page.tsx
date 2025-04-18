'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteRecap } from '@/components/QuoteRecap'
import { Button } from '@/components/Button'
import type { MovingQuote } from '@/types/quote'
import { getCurrentBooking } from '@/actions/bookingManager'
import { ServiceType } from '@/quotation/domain/enums/ServiceType'

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
        // Récupérer les données depuis les bookings actifs
        console.log('Récupération des données via getCurrentBooking')
        const currentBooking = await getCurrentBooking()
        
        if (currentBooking && currentBooking.items && currentBooking.items.length > 0) {
          console.log('Booking trouvé:', currentBooking)
          
          // Chercher un item de type déménagement
          const movingItem = currentBooking.items.find(item => 
            item.type.toLowerCase().includes('moving') || 
            item.type.toLowerCase().includes('demenagement') || 
            item.type.toLowerCase().includes('déménagement')
          )
          
          if (movingItem) {
            console.log('Item déménagement trouvé:', movingItem)
            const movingData = movingItem.data as any; // Utiliser any pour éviter les erreurs TypeScript
            
            // Convertir les données du booking en format MovingQuoteData
            const formattedQuote = {
              id: quoteId || '',
              preferredDate: movingData.moveDate || movingData.scheduledDate || new Date().toISOString(),
              preferredTime: '09:00', // Valeur par défaut
              status: 'pending',
              serviceType: movingData.serviceType || ServiceType.MOVING,
              estimatedPrice: currentBooking.totalTTC || 0,
              createdAt: movingData.createdAt || new Date().toISOString(),
              volume: (movingData.volume || '0').toString(),
              distance: movingData.distance || 0,
              pickupAddress: movingData.pickupAddress || '',
              deliveryAddress: movingData.deliveryAddress || '',
              options: {
                packing: movingData.options?.packing || false,
                assembly: movingData.options?.assembly || false,
                disassembly: movingData.options?.disassembly || false,
                insurance: movingData.options?.insurance || false,
                storage: movingData.options?.storage || false
              },
              totalCost: currentBooking.totalTTC || 0
            } as MovingQuoteData;
            
            setQuoteData(formattedQuote)
            setIsLoading(false)
            return
          }
        }
        
        // Si aucune donnée n'est trouvée, afficher une erreur
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
    // Essayer de rediriger vers la page de paiement après 3 secondes
    setTimeout(() => {
      if (quoteId) {
        console.log('Redirection automatique vers la page de paiement...');
        router.push(`/moving/payment?id=${quoteId}`);
      }
    }, 3000);

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="mb-2">{error || "Données du devis non disponibles"}</p>
          <p className="mb-6 text-sm text-gray-500">Redirection vers la page de paiement dans quelques secondes...</p>
          <Button onClick={() => router.push(`/moving/payment?id=${quoteId || ''}`)} color="primary">
            Continuer vers le paiement
          </Button>
          <div className="mt-4">
            <Button onClick={() => router.push('/moving/new')} color="secondary" variant="outline">
              Créer un nouveau devis
            </Button>
          </div>
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