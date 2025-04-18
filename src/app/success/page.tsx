'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookingDetails } from '@/components/BookingDetails'
import { BookingService, type BookingData } from '@/services/bookingService'
import { 
  CheckCircleIcon, 
  CalendarDaysIcon, 
  ArrowDownIcon, 
  PrinterIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/outline'

// Extend the BookingData interface to include optional reference property
interface ExtendedBookingData extends BookingData {
  reference?: string;
}

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('id')
  
  const [booking, setBooking] = useState<ExtendedBookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      setError('Aucun identifiant de réservation fourni')
      setLoading(false)
      return
    }

    async function fetchBooking() {
      try {
        // Use a defined non-null bookingId
        const safeBookingId = bookingId as string;
        const data = await BookingService.getBookingById(safeBookingId)
        if (!data) {
          throw new Error('Réservation introuvable')
        }
        setBooking(data as ExtendedBookingData)
      } catch (error) {
        console.error('Error fetching booking:', error)
        setError(error instanceof Error ? error.message : 'Erreur lors de la récupération de la réservation')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full mb-6"></div>
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
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="w-16 h-16 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Erreur</h1>
            <p className="text-gray-600 mb-8">{error || 'Réservation introuvable'}</p>
            <Link
              href="/"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-block transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'MOVING_QUOTE':
        return 'déménagement'
      case 'PACK':
        return 'pack de services'
      case 'SERVICE':
        return 'service'
      default:
        return 'service'
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header success banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 border-b border-gray-200 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Réservation confirmée !</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Votre réservation de {getServiceTypeLabel(booking.type)} a été confirmée et un e-mail de confirmation vous a été envoyé.
            </p>
            
            {/* Booking reference */}
            <div className="mt-6 inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full">
              <span className="text-sm font-medium">
                Référence commande : {booking.reference || booking.id}
              </span>
            </div>
          </div>

          {/* Main content */}
          <div className="p-6 md:p-8">
            <div className="bg-blue-50 rounded-lg p-5 mb-8 flex items-start">
              <div className="flex-shrink-0 mr-3">
                <EnvelopeIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Confirmation envoyée</h3>
                <p className="text-sm text-blue-700">
                  Un e-mail de confirmation a été envoyé à <span className="font-medium">{booking.customer.email}</span> avec tous les détails de votre réservation.
                </p>
              </div>
            </div>
            
            {/* Booking details panel */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-emerald-600" />
                Détails de votre réservation
              </h2>
              <BookingDetails booking={booking} />
              
              <div className="mt-6 flex flex-wrap gap-3">
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Imprimer
                </button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Link
                href={`/${booking.type.toLowerCase().split('_')[0]}`}
                className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center sm:text-left"
              >
                Nouvelle réservation
              </Link>
              
              <Link
                href="/"
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-center sm:text-left"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
          
          {/* Legal footer */}
          <div className="bg-gray-50 p-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              En utilisant nos services, vous acceptez nos{' '}
              <Link href="/legal/terms" className="text-emerald-600 hover:underline">conditions générales</Link>,{' '}
              <Link href="/legal/privacy" className="text-emerald-600 hover:underline">politique de confidentialité</Link> et{' '}
              <Link href="/legal/cookies" className="text-emerald-600 hover:underline">politique des cookies</Link>.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 