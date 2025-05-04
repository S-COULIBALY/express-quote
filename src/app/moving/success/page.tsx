'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookingDetails } from '@/components/BookingDetails'
import { getCurrentBooking } from '@/actions/bookingManager'
import { logger } from '@/lib/logger'

interface MovingBookingData {
  id: string;
  type?: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  totalAmount?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  moveDate?: string;
  distance?: number;
  volume?: number;
  moving?: {
    id: string;
    pickupAddress: string;
    deliveryAddress: string;
    moveDate: string;
    distance: number;
    volume: number;
    options?: any;
  };
  totalPrice?: number;
  paymentIntentId?: string;
  paymentStatus?: string;
}

const successLogger = logger.withContext('MovingSuccess');

export default function MovingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
  
  const [booking, setBooking] = useState<MovingBookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Vérifier le paiement si un ID d'intention de paiement est fourni
        if (paymentIntentId) {
          successLogger.info(`Vérification du paiement avec ID: ${paymentIntentId}`);
          
          try {
            const statusResponse = await fetch(`/api/payment/verify/${paymentIntentId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!statusResponse.ok) {
              successLogger.warn('Vérification du paiement échouée');
            } else {
              const paymentData = await statusResponse.json();
              setPaymentStatus(paymentData.status);
              successLogger.info(`Statut du paiement: ${paymentData.status}`);
              
              // Si des informations de réservation sont disponibles dans les données de paiement
              if (paymentData.bookingId) {
                successLogger.info(`ID de réservation trouvé dans les données de paiement: ${paymentData.bookingId}`);
              }
            }
          } catch (error) {
            successLogger.error('Erreur lors de la vérification du paiement', error as Error);
          }
        }
        
        // Continuer à récupérer les informations sur la réservation actuelle
        await fetchBooking();
      } catch (error) {
        successLogger.error('Erreur lors de la récupération des données', error as Error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [paymentIntentId]);

  async function fetchBooking() {
    try {
      // Utiliser getCurrentBooking au lieu de l'API
      const currentBooking = await getCurrentBooking()
      
      console.log('Réservation déménagement récupérée:', {
        hasBooking: !!currentBooking,
        id: currentBooking?.id,
        status: currentBooking?.status,
        itemsCount: currentBooking?.items?.length || 0,
        itemTypes: currentBooking?.items?.map(item => ({ 
          type: item.type, 
          typeLower: item.type?.toLowerCase?.() 
        }))
      });
      
      if (!currentBooking) {
        throw new Error('Réservation introuvable')
      }
      
      if (!currentBooking.items || currentBooking.items.length === 0) {
        throw new Error('Type de réservation invalide - panier vide')
      }
      
      // Accepter TOUS les types qui contiennent 'moving' ou 'demenagement' quelque part
      const movingItem = currentBooking.items.find(item => {
        console.log('Vérification type item déménagement:', item.type, typeof item.type);
        if (typeof item.type !== 'string') return false;
        
        const type = item.type.toLowerCase();
        return type.includes('moving') || type.includes('demenagement') || type.includes('déménagement');
      });
      
      console.log('Item déménagement trouvé:', movingItem ? 'oui' : 'non', movingItem);
      
      if (!movingItem) {
        // Prendre le premier élément si aucun déménagement n'est trouvé
        console.log('Aucun déménagement trouvé, utilisation du premier élément');
        if (currentBooking.items.length > 0) {
          const firstItem = currentBooking.items[0];
          const movingData = firstItem.data as any; // Utiliser 'any' pour éviter les erreurs de type
          
          // Formater les données pour l'affichage même si ce n'est pas un déménagement
          const formattedBooking: MovingBookingData = {
            id: currentBooking.id,
            status: currentBooking.status,
            moving: {
              id: movingData.id || '',
              pickupAddress: movingData.pickupAddress || '',
              deliveryAddress: movingData.deliveryAddress || '',
              moveDate: movingData.moveDate || movingData.scheduledDate || new Date().toISOString(),
              distance: movingData.distance || 0,
              volume: movingData.volume || 0,
              options: movingData.options || {}
            },
            customer: {
              firstName: currentBooking.customerData?.firstName || '',
              lastName: currentBooking.customerData?.lastName || '',
              email: currentBooking.customerData?.email || '',
              phone: currentBooking.customerData?.phone || ''
            },
            totalPrice: currentBooking.totalTTC || 0,
            totalAmount: currentBooking.totalTTC || 0,
            paymentIntentId: paymentIntentId || undefined,
            paymentStatus: paymentStatus || undefined
          }
          
          setBooking(formattedBooking);
          return;
        } else {
          throw new Error('Type de réservation invalide - aucun élément disponible')
        }
      }

      // Formater les données pour l'affichage
      const movingData = movingItem.data as any; // Utiliser 'any' pour éviter les erreurs de type

      const formattedBooking: MovingBookingData = {
        id: currentBooking.id,
        type: 'MOVING_QUOTE',
        status: currentBooking.status,
        customer: {
          firstName: currentBooking.customerData?.firstName || '',
          lastName: currentBooking.customerData?.lastName || '',
          email: currentBooking.customerData?.email || '',
          phone: currentBooking.customerData?.phone || ''
        },
        totalAmount: currentBooking.totalTTC || 0,
        pickupAddress: movingData.pickupAddress || '',
        deliveryAddress: movingData.deliveryAddress || '',
        moveDate: movingData.moveDate || movingData.scheduledDate || new Date().toISOString(),
        distance: movingData.distance || 0,
        volume: movingData.volume || 0,
        paymentIntentId: paymentIntentId || undefined,
        paymentStatus: paymentStatus || undefined
      }
      
      setBooking(formattedBooking)
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération de la réservation')
    }
  }

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
            href="/moving"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Créer un nouveau devis
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Réservation confirmée !</h1>
          <p className="text-gray-600">
            Votre réservation a été confirmée et un e-mail de confirmation vous a été envoyé.
          </p>
          
          {paymentStatus && (
            <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm ${
              paymentStatus === 'succeeded' ? 'bg-green-100 text-green-800' : 
              paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              <span className="mr-1">{
                paymentStatus === 'succeeded' ? '✓ Paiement confirmé' : 
                paymentStatus === 'processing' ? '⋯ Paiement en cours' : 
                'Paiement en attente'
              }</span>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold">Récapitulatif de votre déménagement</h2>
          </div>
          
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Numéro de réservation</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.id.slice(0, 8)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">Déménagement</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Date de déménagement</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {booking.moveDate ? new Date(booking.moveDate).toLocaleDateString('fr-FR') :
                   booking.moving?.moveDate ? new Date(booking.moving.moveDate).toLocaleDateString('fr-FR') : 
                   'Non spécifiée'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Volume</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {booking.volume || booking.moving?.volume || 0} m³
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Adresse de départ</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {booking.pickupAddress || booking.moving?.pickupAddress || ''}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Adresse d'arrivée</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {booking.deliveryAddress || booking.moving?.deliveryAddress || ''}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Distance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {booking.distance || booking.moving?.distance || 0} km
                </dd>
              </div>
              
              {booking.paymentIntentId && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Référence de paiement</dt>
                  <dd className="mt-1 text-sm text-gray-900">{booking.paymentIntentId.substring(0, 8)}...</dd>
                </div>
              )}
              
              <div className="col-span-2 pt-4 border-t border-gray-200">
                <dt className="text-base font-medium text-gray-900">Prix total</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {booking.totalPrice || booking.totalAmount || 0} €
                </dd>
                {booking.paymentStatus && (
                  <dd className="mt-1 text-sm text-gray-500">
                    Statut du paiement: {
                      booking.paymentStatus === 'succeeded' ? 'Payé' : 
                      booking.paymentStatus === 'processing' ? 'En cours de traitement' : 
                      'En attente'
                    }
                  </dd>
                )}
              </div>
            </dl>
          </div>
        </div>
        
        <div className="text-center">
          <Link
            href="/moving"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-medium text-sm leading-tight rounded shadow-md hover:bg-emerald-700 hover:shadow-lg focus:bg-emerald-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-emerald-800 active:shadow-lg transition duration-150 ease-in-out"
          >
            Créer un nouveau devis
          </Link>
        </div>
      </div>
    </main>
  )
} 