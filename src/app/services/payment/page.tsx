'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createPaymentIntent } from '@/actions/paymentManager'
import { Service } from '@/types/booking'
import Link from 'next/link'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  CreditCardIcon, 
  ShieldCheckIcon, 
  LockClosedIcon,
  ArrowLeftIcon,
  HomeIcon,
  CheckIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { StripeElementsProvider, PaymentForm } from '@/components/StripeElements'

interface QuoteData {
  id: string
  status: string
  serviceId: string
  serviceName?: string
  description?: string
  scheduledDate?: string
  scheduledTime?: string
  location?: string
  duration?: number
  workers?: number
  additionalInfo?: string
  totalAmount: number
  customer?: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

export default function ServicePaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quoteId')
  
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [serviceDetails, setServiceDetails] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState<number>(0)
  
  // États pour les informations de paiement
  const [paymentMethod, setPaymentMethod] = useState<string>('card')

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true)
      
      if (!quoteId) {
        throw new Error('ID de devis manquant dans l\'URL')
      }
      
      // Récupérer les détails du devis via l'API
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération du devis: ${response.status}`)
      }
      
      const quoteData = await response.json()
      console.log('Données du devis récupérées:', quoteData)
      
      if (!quoteData) {
        throw new Error('Devis invalide ou sans détails')
      }
      
      setQuote(quoteData)
      
      // Récupérer les détails du service si un serviceId est disponible
      if (quoteData.serviceId) {
        const serviceResponse = await fetch(`/api/services/${quoteData.serviceId}`)
        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json()
          setServiceDetails(serviceData)
        }
      }
      
      // Calculer le montant de l'acompte (30% du prix total)
      const deposit = Math.ceil(quoteData.totalAmount * 0.3)
      setDepositAmount(deposit)
      
      // Créer l'intention de paiement
      const result = await createPaymentIntent(
        quoteData.id,
        deposit,
        `Acompte pour ${quoteData.serviceName || serviceDetails?.name || 'votre service'}`
      )
      setClientSecret(result.clientSecret)
      
    } catch (error) {
      console.error('Erreur lors de la récupération du devis:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération du devis')
      setTimeout(() => router.push('/services'), 3000)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuoteDetails()
  }, [quoteId])
  
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method)
  }
  
  const handlePaymentSuccess = async () => {
    try {
      setProcessing(true)
      
      if (!quoteId) {
        throw new Error('ID de devis manquant')
      }
      
      // Accepter le devis et initier le paiement
      const acceptResponse = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quoteId,
          paymentMethod: paymentMethod
        })
      })
      
      if (!acceptResponse.ok) {
        const errorData = await acceptResponse.json()
        throw new Error(`Échec de l'acceptation du devis: ${errorData.error || 'Erreur inconnue'}`)
      }
      
      const acceptResult = await acceptResponse.json()
      console.log('Devis accepté avec succès:', acceptResult)
      
      // Rediriger vers la page de succès
      router.push(`/services/success?quoteId=${quoteId}`)
      
    } catch (error) {
      console.error('Erreur lors de la finalisation du paiement:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de la finalisation du paiement')
    } finally {
      setProcessing(false)
    }
  }
  
  const handlePaymentError = (errorMessage: string) => {
    console.error('Erreur de paiement:', errorMessage)
    setError(`Erreur de paiement: ${errorMessage}`)
    setProcessing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 mb-2">Une erreur est survenue</h1>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center">
            <Link href="/services" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Retour aux services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-xl font-bold text-center text-gray-900 mb-2">Devis introuvable</h1>
          <p className="text-center text-gray-600 mb-6">Nous n'avons pas trouvé le devis correspondant.</p>
          <div className="flex justify-center">
            <Link href="/services" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Retour aux services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Paiement de votre réservation</h1>
          <Link href={`/services/summary?quoteRequestId=${quoteId}`} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Retour au récapitulatif
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulaire de paiement */}
          <div className="lg:w-3/5 bg-white rounded-xl shadow-lg p-6 order-2 lg:order-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Méthode de paiement</h2>
            
            <div className="mb-6">
              <div className="bg-emerald-50 p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 text-emerald-600 mr-2" />
                  <p className="text-sm text-emerald-800">
                    <span className="font-medium">Paiement sécurisé</span>: Toutes vos données sont protégées et chiffrées
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
                  <h3 className="font-medium text-gray-900">Montant à payer</h3>
                  <span className="text-lg font-bold text-emerald-600">{depositAmount}€</span>
                </div>
                <p className="text-sm text-gray-600">
                  Il s'agit d'un acompte de 30% du prix total ({quote.totalAmount}€). Le solde sera réglé directement auprès du professionnel le jour de la prestation.
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <input 
                    id="card" 
                    name="paymentMethod" 
                    type="radio" 
                    className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
                    checked={paymentMethod === 'card'}
                    onChange={() => handlePaymentMethodChange('card')}
                  />
                  <label htmlFor="card" className="ml-3 block text-gray-700">
                    <div className="flex items-center">
                      <CreditCardIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="font-medium">Carte bancaire</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            {clientSecret && (
              <div className="mt-6">
                <StripeElementsProvider clientSecret={clientSecret}>
                  <PaymentForm 
                    amount={depositAmount} 
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </StripeElementsProvider>
              </div>
            )}
          </div>
          
          {/* Récapitulatif de la commande */}
          <div className="lg:w-2/5 bg-white rounded-xl shadow-lg p-6 order-1 lg:order-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Récapitulatif</h2>
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-2">{quote.serviceName || serviceDetails?.name || 'Service'}</h3>
              <p className="text-sm text-gray-600 mb-3">{quote.description || serviceDetails?.description || ''}</p>
              
              <div className="space-y-2">
                {quote.scheduledDate && (
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{new Date(quote.scheduledDate).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                )}
                
                {quote.duration && (
                  <div className="flex items-center text-sm">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{quote.duration} heure{quote.duration > 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {quote.workers && (
                  <div className="flex items-center text-sm">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{quote.workers} professionnel{quote.workers > 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {quote.location && (
                  <div className="flex items-start text-sm">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <span>{quote.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Coordonnées client</h3>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{quote.customer?.firstName} {quote.customer?.lastName}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{quote.customer?.email}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{quote.customer?.phone}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Prix du service</span>
                <span>{quote.totalAmount}€</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Acompte (30%)</span>
                <span className="font-medium">{depositAmount}€</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Reste à payer</span>
                <span>{quote.totalAmount - depositAmount}€</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold text-emerald-600">{quote.totalAmount}€</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">TVA incluse</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 