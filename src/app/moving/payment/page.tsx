'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createPaymentIntent } from '@/actions/paymentManager'
import { StripeElementsProvider, PaymentForm } from '@/components/StripeElements'
import { getCurrentBooking } from '@/actions/bookingManager'

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
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [bookingId, setBookingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<PaymentFormData>({
    fullName: '',
    email: '',
    phone: '',
    terms: false
  })

  useEffect(() => {
    const fetchQuoteData = async () => {
      try {
        // Récupérer les données via getCurrentBooking
        console.log('Récupération des données via getCurrentBooking');
        const currentBooking = await getCurrentBooking();
        
        if (currentBooking && currentBooking.items && currentBooking.items.length > 0) {
          console.log('Booking trouvé:', currentBooking);
          
          // Chercher un item de type déménagement
          const movingItem = currentBooking.items.find(item => 
            typeof item.type === 'string' && (
              item.type.toLowerCase().includes('moving') || 
              item.type.toLowerCase().includes('demenagement') || 
              item.type.toLowerCase().includes('déménagement')
            )
          );
          
          if (movingItem) {
            console.log('Item déménagement trouvé:', movingItem);
            const movingData = movingItem.data as any;
            
            // Convertir les données du booking en format QuoteData
            const formattedQuote: QuoteData = {
              id: quoteId || '',
              status: 'pending',
              pickupAddress: movingData.pickupAddress || '',
              deliveryAddress: movingData.deliveryAddress || '',
              preferredDate: movingData.moveDate || movingData.scheduledDate || new Date().toISOString(),
              preferredTime: movingData.scheduledTime || '09:00',
              volume: (movingData.volume || '0').toString(),
              distance: movingData.distance || 0,
              options: {
                packing: movingData.options?.packing || false,
                assembly: movingData.options?.assembly || false,
                disassembly: movingData.options?.disassembly || false,
                insurance: movingData.options?.insurance || false,
                storage: movingData.options?.storage || false,
                cleaning: movingData.options?.cleaning || false
              },
              totalCost: currentBooking.totalTTC || 0,
              baseCost: movingData.baseCost || currentBooking.totalTTC || 0
            };
            
            console.log('Données formatées:', formattedQuote);
            setQuoteData(formattedQuote);
            setTotalAmount(formattedQuote.totalCost);
            return;
          }
        }
        
        console.warn('Impossible de récupérer les données du devis');
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };
    
    fetchQuoteData();
  }, [quoteId]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const validateForm = (): boolean => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.terms) {
      setError('Veuillez remplir tous les champs et accepter les conditions générales')
      return false
    }
    return true
  }

  const initializePayment = async () => {
    if (!quoteData) {
      setError('Données du devis non trouvées')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setProcessing(true)
      setError(null)
      
      console.log('Préparation du paiement avec les données:', {
        quoteData,
        customerData: formData
      })

      // Créer directement l'intention de paiement
      const paymentDescription = `Déménagement: ${quoteData.pickupAddress.substring(0, 20)}... → ${quoteData.deliveryAddress.substring(0, 20)}...`
      
      // Créer l'intention de paiement
      const { clientSecret } = await createPaymentIntent(
        quoteId || 'MOVING-' + Date.now(), 
        quoteData.totalCost, 
        paymentDescription
      )
      
      if (!clientSecret) {
        throw new Error("Erreur lors de la création de l'intention de paiement")
      }
      
      // Utiliser quoteId comme bookingId
      setBookingId(quoteId || 'MOVING-' + Date.now())
      setClientSecret(clientSecret)
      
    } catch (error) {
      console.error('Erreur lors du processus de préparation du paiement:', error)
      setError('Une erreur est survenue lors de la préparation de votre paiement. Veuillez réessayer.')
      setProcessing(false)
    }
  }
  
  const handlePaymentSuccess = () => {
    router.push(`/moving/success?id=${bookingId}`)
  }
  
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setProcessing(false)
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
          
          <div className="space-y-1 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Prix de base</span>
              <span>{quoteData.baseCost?.toFixed(2)} €</span>
            </div>
            {quoteData.volumeCost && (
              <div className="flex justify-between">
                <span className="text-gray-600">Supplément volume</span>
                <span>{quoteData.volumeCost.toFixed(2)} €</span>
              </div>
            )}
            {quoteData.distancePrice && (
              <div className="flex justify-between">
                <span className="text-gray-600">Supplément distance</span>
                <span>{quoteData.distancePrice.toFixed(2)} €</span>
              </div>
            )}
            {quoteData.optionsCost && quoteData.optionsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Options</span>
                <span>{quoteData.optionsCost.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t mt-2">
              <span>Total</span>
              <span>{quoteData.totalCost.toFixed(2)} €</span>
            </div>
          </div>
        </div>
        
        {!clientSecret ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Vos informations</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="terms"
                  id="terms"
                  checked={formData.terms}
                  onChange={handleFormChange}
                  className="mt-1 mr-2"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  J'accepte les <a href="/conditions" className="text-blue-600 hover:underline">conditions générales</a> et la <a href="/privacy" className="text-blue-600 hover:underline">politique de confidentialité</a>.
                </label>
              </div>
            </div>
            
            <button
              onClick={initializePayment}
              disabled={processing}
              className="w-full bg-blue-600 text-white p-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Préparation...' : 'Procéder au paiement'}
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Paiement sécurisé</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <StripeElementsProvider clientSecret={clientSecret}>
              <PaymentForm 
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                amount={totalAmount}
                returnUrl={`${window.location.origin}/moving/success?id=${bookingId}`}
              />
            </StripeElementsProvider>
          </div>
        )}
      </div>
    </main>
  )
} 