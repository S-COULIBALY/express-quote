'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createCheckoutSession } from '@/services/stripe'

interface PackBookingData {
  id: string
  status: string
  pack: {
    id: string
    name: string
    description: string
    price: number
    image?: string
  }
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  professional?: {
    id: string
    firstName: string
    lastName: string
  }
  scheduledDate: string
  scheduledTime: string
  destAddress: string
  totalPrice: number
}

export default function PackPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('id')
  
  const [booking, setBooking] = useState<PackBookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = async () => {
    if (!bookingId) {
      setError('Aucun identifiant de réservation fourni')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      
      if (!response.ok) {
        throw new Error('Réservation introuvable')
      }
      
      const data = await response.json()
      
      if (data.type !== 'pack') {
        throw new Error('Type de réservation invalide')
      }
      
      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération de la réservation')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!booking) {
      setError('Données de réservation manquantes')
      return
    }
    
    try {
      setProcessing(true)
      
      // Calculer le montant de l'acompte (30% du prix total)
      const depositAmount = booking.totalPrice * 0.3
      
      // Créer la session de paiement Stripe
      const { url } = await createCheckoutSession({
        customerId: booking.customer.id,
        customerEmail: booking.customer.email,
        bookingId: booking.id,
        bookingType: 'pack',
        amount: depositAmount,
        description: `Forfait: ${booking.pack.name}`,
        metadata: {
          packId: booking.pack.id,
          scheduledDate: booking.scheduledDate,
          destAddress: booking.destAddress
        }
      })
      
      // Rediriger vers la page de paiement Stripe
      if (url) {
        window.location.href = url
      } else {
        throw new Error('Impossible de créer la session de paiement')
      }
    } catch (error) {
      console.error('Error in payment process:', error)
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors du traitement du paiement')
      setProcessing(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-36 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !booking) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 text-red-500">
            <h1 className="text-2xl font-bold mb-2">Erreur</h1>
            <p>{error || 'Réservation introuvable'}</p>
          </div>
          <button
            onClick={() => router.push('/packs')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retour aux forfaits
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Finalisation de votre réservation</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Récapitulatif de votre réservation</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">Forfait</p>
              <p className="font-medium">{booking.pack.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Date prévue</p>
              <p className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-gray-600">Heure</p>
              <p className="font-medium">{booking.scheduledTime}</p>
            </div>
            <div>
              <p className="text-gray-600">Adresse de destination</p>
              <p className="font-medium">{booking.destAddress}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>Montant total</span>
              <span className="font-semibold">{booking.totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between mb-2 text-emerald-700">
              <span>Acompte à verser maintenant (30%)</span>
              <span className="font-semibold">{(booking.totalPrice * 0.3).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Solde à régler le jour du service</span>
              <span>{(booking.totalPrice * 0.7).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Procéder au paiement</h2>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <p className="mb-6 text-gray-600">
            Pour confirmer votre réservation, un acompte de 30% du montant total est requis. Vous serez redirigé vers une page de paiement sécurisée.
          </p>
          
          <button
            onClick={handlePayment}
            className="w-full py-3 px-4 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            disabled={processing}
          >
            {processing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement en cours...
              </>
            ) : (
              "Procéder au paiement"
            )}
          </button>
        </div>
      </div>
    </main>
  )
} 