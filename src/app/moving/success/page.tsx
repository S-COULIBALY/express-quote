'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface MovingQuote {
  id: string
  status: string
  moveDate: string
  pickupAddress: string
  deliveryAddress: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  items: Array<{
    name: string
    quantity: number
  }>
  totalPrice: number
  distance: number
  volume: number
}

export default function MovingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('id')
  
  const [quote, setQuote] = useState<MovingQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      setError('Aucun identifiant de réservation fourni')
      setLoading(false)
      return
    }

    async function fetchQuote() {
      try {
        const response = await fetch(`/api/quotes/${bookingId}`)
        
        if (!response.ok) {
          throw new Error('Devis introuvable')
        }
        
        const data = await response.json()
        setQuote(data)
      } catch (error) {
        console.error('Error fetching quote:', error)
        setError(error instanceof Error ? error.message : 'Erreur lors de la récupération du devis')
      } finally {
        setLoading(false)
      }
    }

    fetchQuote()
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

  if (error || !quote) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 text-red-500">
            <h1 className="text-2xl font-bold mb-2">Erreur</h1>
            <p>{error || 'Devis introuvable'}</p>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Devis confirmé !</h1>
          <p className="text-gray-600">
            Votre réservation de déménagement a été confirmée et un e-mail de confirmation vous a été envoyé.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold">Récapitulatif de votre déménagement</h2>
          </div>
          
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Numéro de réservation</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.id.slice(0, 8)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Date de déménagement</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(quote.moveDate)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Adresse de départ</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.pickupAddress}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Adresse de destination</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.deliveryAddress}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Client</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.customer.firstName} {quote.customer.lastName}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Confirmé
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Distance</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.distance} km</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Volume</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.volume} m³</dd>
              </div>
              
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Articles</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <ul className="list-disc pl-5 space-y-1">
                    {quote.items.map((item, index) => (
                      <li key={index}>{item.name} (x{item.quantity})</li>
                    ))}
                  </ul>
                </dd>
              </div>
              
              <div className="md:col-span-2 border-t pt-4">
                <dt className="text-base font-medium text-gray-900">Montant total</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">{quote.totalPrice.toFixed(2)} €</dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Un e-mail de confirmation a été envoyé à {quote.customer.email} avec tous les détails de votre déménagement.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Link
            href="/moving"
            className="px-6 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Nouveau devis
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