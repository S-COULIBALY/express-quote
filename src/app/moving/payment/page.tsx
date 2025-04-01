'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createCheckoutSession } from '@/services/stripe'

interface PaymentFormData {
  fullName: string
  email: string
  phone: string
  terms: boolean
}

interface QuoteData {
  id: string
  status: string
  pickupAddress: string
  deliveryAddress: string
  preferredDate: string
  preferredTime?: string
  volume: string
  distance?: number
  movingDate?: string
  options: {
    packing: boolean
    assembly: boolean
    disassembly: boolean
    insurance: boolean
    storage: boolean
    cleaning?: boolean
  }
  totalCost: number
  baseCost?: number
  volumeCost?: number
  distancePrice?: number
  optionsCost?: number
  signature?: string
  persistedId?: string
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MovingPaymentContent />
    </Suspense>
  )
}

function MovingPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<PaymentFormData>({
    fullName: '',
    email: '',
    phone: '',
    terms: false
  })

  useEffect(() => {
    // Récupérer les données du devis depuis le localStorage
    const savedQuote = localStorage.getItem('movingQuote')
    if (savedQuote && quoteId) {
      const parsedQuote = JSON.parse(savedQuote) as QuoteData
      if (parsedQuote.id === quoteId) {
        setQuoteData(parsedQuote)
      }
    }
  }, [quoteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quoteData) {
      setError('Données du devis non trouvées')
      return
    }

    if (!formData.terms) {
      setError('Vous devez accepter les conditions générales')
      return
    }

    try {
      setProcessing(true)
      setError(null)
      
      // Afficher les données avant la création de la réservation
      console.log('Données avant création de la réservation:', {
        quoteData,
        customerData: formData,
        persistedId: quoteData.persistedId || 'Non persisté'
      })

      // 1. Créer le client
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!customerResponse.ok) {
        throw new Error('Erreur lors de la création du client')
      }
      
      const customerResult = await customerResponse.json()
      const customerId = customerResult.data.id
      
      // 2. Si le devis n'est pas déjà persisté, le créer via l'API
      let quoteId = quoteData.persistedId
      
      if (!quoteId) {
        // Récupérer l'ID du devis depuis les données localStorage (ID temporaire)
        const tempQuoteId = quoteData.id
        
        // Calculer une dernière fois le devis pour s'assurer des valeurs correctes
        // et utiliser le calcul centralisé pour le déménagement
        const quotePayload = {
          customerId,
          origin: quoteData.pickupAddress,
          destination: quoteData.deliveryAddress,
          movingDate: quoteData.preferredDate || quoteData.movingDate,
          needPacking: quoteData.options?.packing || false,
          needStorage: quoteData.options?.storage || false,
          needCleaning: quoteData.options?.cleaning || false,
          
          // Inclure les détails de calcul et la signature pour vérification
          baseCost: quoteData.baseCost,
          volumeCost: quoteData.volumeCost,
          distancePrice: quoteData.distancePrice,
          optionsCost: quoteData.optionsCost,
          signature: quoteData.signature,
          
          // ... autres champs
          ...quoteData  // Inclure toutes les données originales
        }
        
        // Créer le devis dans la base de données
        const quoteResponse = await fetch('/api/quotation', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quotePayload)
        })
        
        if (!quoteResponse.ok) {
          throw new Error('Erreur lors de la création du devis permanent')
        }
        
        const quoteResult = await quoteResponse.json()
        quoteId = quoteResult.data.id
        
        // Mettre à jour le localStorage avec l'ID persisté
        quoteData.persistedId = quoteId
        localStorage.setItem('movingQuote', JSON.stringify(quoteData))
      }
      
      // 3. Créer la réservation
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          customerId,
          type: 'MOVING_QUOTE',
          totalAmount: quoteData.totalCost,
          moveDate: quoteData.movingDate,
          pickupAddress: quoteData.pickupAddress,
          deliveryAddress: quoteData.deliveryAddress,
          volume: parseFloat(quoteData.volume) || 0,
          distance: quoteData.distance || 0,
          options: quoteData.options || {},
          source: 'web'
        })
      })
      
      if (!bookingResponse.ok) {
        throw new Error('Erreur lors de la création de la réservation')
      }
      
      const bookingResult = await bookingResponse.json()
      
      // Rediriger vers Stripe pour le paiement
      const stripeResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingResult.data.id,
          customerId,
          amount: quoteData.totalCost
        })
      })
      
      if (!stripeResponse.ok) {
        throw new Error('Erreur lors de la création de la session Stripe')
      }
      
      const stripeResult = await stripeResponse.json()
      router.push(`/success?id=${bookingResult.data.id}`)
    } catch (error) {
      console.error('Erreur lors du processus de paiement:', error)
      setError('Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.')
      setProcessing(false)
    }
  }

  if (!quoteData) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 text-red-500">
            <h1 className="text-2xl font-bold mb-2">Devis non trouvé</h1>
            <p>Impossible de trouver les informations du devis</p>
          </div>
          <button
            onClick={() => router.push('/moving/new')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Créer un nouveau devis
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
          <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">Date du déménagement</p>
              <p className="font-medium">{new Date(quoteData.preferredDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-gray-600">Volume estimé</p>
              <p className="font-medium">{quoteData.volume} m³</p>
            </div>
            <div>
              <p className="text-gray-600">Adresse de départ</p>
              <p className="font-medium">{quoteData.pickupAddress}</p>
            </div>
            <div>
              <p className="text-gray-600">Adresse d'arrivée</p>
              <p className="font-medium">{quoteData.deliveryAddress}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>Montant total</span>
              <span className="font-semibold">{quoteData.totalCost.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between mb-2 text-emerald-700">
              <span>Acompte à verser maintenant (30%)</span>
              <span className="font-semibold">{(quoteData.totalCost * 0.3).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Solde à régler le jour du déménagement</span>
              <span>{(quoteData.totalCost * 0.7).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Vos coordonnées</h2>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2">Nom complet</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="flex items-start mt-4">
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.checked})}
                className="mt-1 mr-2"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                J'accepte les <a href="/terms" className="text-blue-600 hover:underline">conditions générales</a> et la <a href="/privacy" className="text-blue-600 hover:underline">politique de confidentialité</a>
              </label>
            </div>

            <button
              type="submit"
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
          </form>
        </div>
      </div>
    </main>
  )
} 