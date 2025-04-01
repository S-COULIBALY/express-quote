'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookingDetails } from '@/components/BookingDetails'
import { BookingService, type BookingData } from '@/services/bookingService'

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('id')
  
  const [booking, setBooking] = useState<BookingData | null>(null)
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
        const data = await BookingService.getBookingById(bookingId)
        if (!data) {
          throw new Error('Réservation introuvable')
        }
        setBooking(data)
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
            href="/"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Retour à l'accueil
          </Link>
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
            Votre réservation de {getServiceTypeLabel(booking.type)} a été confirmée et un e-mail de confirmation vous a été envoyé.
          </p>
        </div>
        
        <BookingDetails booking={booking} />
        
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Un e-mail de confirmation a été envoyé à {booking.customer.email} avec tous les détails de votre réservation.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <Link
            href={`/${booking.type.toLowerCase().split('_')[0]}`}
            className="px-6 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Nouvelle réservation
          </Link>
          
          <Link
            href="/"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  )
} 