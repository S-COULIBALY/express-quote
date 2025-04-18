'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pack, Service } from '@/types/booking'

interface PackBooking {
  id: string
  status: string
  pack: {
    name: string
    description: string
    price: number
  }
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  scheduledDate: string
  scheduledTime: string
  pickupAddress: string
  deliveryAddress: string
  duration: number
  workers: number
  additionalInfo?: string
  totalPrice: number
  distance: number
}

export default function PackSuccessPage() {
  const router = useRouter()
  
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooking() {
      try {
        // Utiliser l'API pour récupérer la réservation
        const response = await fetch('/api/bookings/current')
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }
        
        const currentBooking = await response.json()
        
        console.log('Réservation récupérée:', {
          hasBooking: !!currentBooking,
          id: currentBooking?.id,
          status: currentBooking?.status,
          itemsCount: currentBooking?.details?.items?.length || 0
        });
        
        if (!currentBooking) {
          throw new Error('Réservation introuvable')
        }
        
        if (!currentBooking.details || !currentBooking.details.items || currentBooking.details.items.length === 0) {
          throw new Error('Type de réservation invalide - panier vide')
        }
        
        // Accepter TOUS les types qui contiennent 'pack' quelque part
        const packItem = currentBooking.details.items.find((item: any) => {
          if (typeof item.type !== 'string') return false;
          return item.type.toLowerCase().includes('pack');
        });
        
        if (!packItem) {
          // Prendre le premier élément si aucun pack n'est trouvé
          console.log('Aucun pack trouvé, utilisation du premier élément');
          if (currentBooking.details.items.length > 0) {
            const firstItem = currentBooking.details.items[0];
            const packData = firstItem.data as Pack | Service;
            
            // Formater les données pour l'affichage même si ce n'est pas un pack
            const formattedBooking = {
              id: currentBooking.id,
              status: currentBooking.status,
              pack: {
                name: packData.name || "Pack",
                description: packData.description || "",
                price: packData.price || 0
              },
              customer: {
                firstName: currentBooking.customer?.firstName || '',
                lastName: currentBooking.customer?.lastName || '',
                email: currentBooking.customer?.email || '',
                phone: currentBooking.customer?.phone || ''
              },
              scheduledDate: packData.scheduledDate || new Date().toISOString(),
              scheduledTime: packData.scheduledTime || '',
              pickupAddress: 'pickupAddress' in packData ? packData.pickupAddress : '',
              deliveryAddress: 'deliveryAddress' in packData ? packData.deliveryAddress : '',
              duration: packData.duration || 0,
              workers: packData.workers || 1,
              distance: 'distance' in packData ? packData.distance : 0,
              totalPrice: currentBooking.totalAmount * 1.2 || 0 // Conversion approximative en TTC
            }
            
            setBooking(formattedBooking);
            return;
          } else {
            throw new Error('Type de réservation invalide - aucun élément disponible')
          }
        }

        // Formater les données pour l'affichage
        const packData = packItem.data as Pack | Service;

        const formattedBooking = {
          id: currentBooking.id,
          status: currentBooking.status,
          pack: {
            name: packData.name,
            description: packData.description,
            price: packData.price
          },
          customer: {
            firstName: currentBooking.customer?.firstName || '',
            lastName: currentBooking.customer?.lastName || '',
            email: currentBooking.customer?.email || '',
            phone: currentBooking.customer?.phone || ''
          },
          scheduledDate: packData.scheduledDate || new Date().toISOString(),
          scheduledTime: packData.scheduledTime || '',
          pickupAddress: 'pickupAddress' in packData ? packData.pickupAddress : '',
          deliveryAddress: 'deliveryAddress' in packData ? packData.deliveryAddress : '',
          duration: packData.duration || 0,
          workers: packData.workers || 1,
          distance: 'distance' in packData ? packData.distance : 0,
          totalPrice: currentBooking.totalAmount * 1.2 || 0 // Conversion approximative en TTC
        }
        
        setBooking(formattedBooking)
      } catch (error) {
        console.error('Error fetching booking:', error)
        setError(error instanceof Error ? error.message : 'Erreur lors de la récupération de la réservation')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [])

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
          <Link
            href="/packs"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Retour aux forfaits
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Réservation confirmée !</h1>
          <p className="text-gray-600">
            Votre réservation a été enregistrée avec succès et un e-mail de confirmation vous a été envoyé.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold">Récapitulatif de votre réservation</h2>
          </div>
          
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Numéro de réservation</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.id.slice(0, 8)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Pack</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.pack.name}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Date prévue</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(booking.scheduledDate).toLocaleDateString('fr-FR')}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Heure</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.scheduledTime}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Adresse de départ</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.pickupAddress}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Adresse de livraison</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.deliveryAddress}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Durée (jours)</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.duration}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre de travailleurs</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.workers}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Distance estimée</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.distance} km</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Total TTC</dt>
                <dd className="mt-1 text-sm text-gray-900 font-semibold">{booking.totalPrice.toFixed(2)} €</dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Un de nos conseillers vous contactera prochainement pour confirmer tous les détails de votre réservation.
          </p>
          
          <Link
            href="/packs"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-medium text-sm leading-tight rounded shadow-md hover:bg-emerald-700 hover:shadow-lg focus:bg-emerald-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-emerald-800 active:shadow-lg transition duration-150 ease-in-out"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  )
} 