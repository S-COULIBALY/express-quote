'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteRecap } from '@/components/QuoteRecap'
import { Button } from '@/components/Button'
import type { CleaningQuote, CleaningOptions } from '@/types/quote'
import { getCurrentBooking } from '@/actions/bookingManager'

interface CleaningQuoteData extends Omit<CleaningQuote, 'options'> {
  propertyType: string
  cleaningType: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  frequency: string
  address: string
  options: CleaningOptions
  totalCost: number
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CleaningSummaryContent />
    </Suspense>
  )
}

function CleaningSummaryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [quoteData, setQuoteData] = useState<CleaningQuoteData | null>(null)
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
          
          // Chercher un item de type nettoyage
          const cleaningItem = currentBooking.items.find(item => 
            item.type.toLowerCase().includes('cleaning') || 
            item.type.toLowerCase().includes('nettoyage')
          )
          
          if (cleaningItem) {
            console.log('Item nettoyage trouvé:', cleaningItem)
            const cleaningData = cleaningItem.data as any;
            
            // Convertir les données du booking en format CleaningQuoteData
            const formattedQuote = {
              id: quoteId || '',
              status: 'pending',
              propertyType: cleaningData.propertyType || 'apartment',
              propertySize: parseFloat(cleaningData.propertySize) || 0,
              serviceName: cleaningData.name || 'Nettoyage standard',
              serviceDescription: cleaningData.description || '',
              preferredDate: cleaningData.scheduledDate || new Date().toISOString(),
              preferredTime: cleaningData.scheduledTime || '09:00',
              address: cleaningData.address || '',
              options: cleaningData.options || {
                deepCleaning: false,
                windows: false,
                fridge: false,
                oven: false,
                cabinets: false
              },
              totalCost: currentBooking.totalTTC || 0
            };
            
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

  if (isLoading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  if (error) {
    return <div className="p-8 text-center">{error}</div>
  }

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