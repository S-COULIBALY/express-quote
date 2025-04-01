'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pack, Service } from '@/types/booking'
import { mockPacks, mockServices } from '@/data/mockData'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  ChevronLeftIcon, 
  LockClosedIcon, 
  CreditCardIcon, 
  CheckCircleIcon, 
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

export default function CheckoutPaymentPage() {
  const router = useRouter()
  
  const [bookingData, setBookingData] = useState<any>(null)
  const [itemDetails, setItemDetails] = useState<Pack | Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    acceptTerms: false,
    createAccount: false
  })
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Récupérer les données du localStorage au chargement
  useEffect(() => {
    const loadBookingData = () => {
      try {
        // Récupérer les données sauvegardées
        const savedData = localStorage.getItem('bookingData')
        const type = localStorage.getItem('bookingType')
        const itemId = localStorage.getItem('bookingItemId')
        
        if (!savedData || !type || !itemId) {
          router.push('/checkout/summary')
          return
        }
        
        const parsedData = JSON.parse(savedData)
        setBookingData(parsedData)
        
        // Récupérer les détails de l'item selon son type
        if (type === 'PACK') {
          const pack = mockPacks.find(p => p.id === itemId)
          setItemDetails(pack || null)
        } else if (type === 'SERVICE') {
          const service = mockServices.find(s => s.id === itemId)
          setItemDetails(service || null)
        }
        
        // Pré-remplir les données du formulaire si disponibles
        const savedFormData = localStorage.getItem('paymentFormData')
        if (savedFormData) {
          const parsedFormData = JSON.parse(savedFormData)
          setFormData(prevData => ({ ...prevData, ...parsedFormData }))
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBookingData()
  }, [router])
  
  // Sauvegarder automatiquement les données du formulaire
  useEffect(() => {
    const saveFormData = () => {
      try {
        setSaveStatus('saving')
        
        // Ne pas sauvegarder les données sensibles comme les infos de carte
        const safeFormData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          paymentMethod: formData.paymentMethod,
          createAccount: formData.createAccount
        }
        
        localStorage.setItem('paymentFormData', JSON.stringify(safeFormData))
        
        const timer = setTimeout(() => {
          setSaveStatus('saved')
          
          // Réinitialiser le statut après quelques secondes
          setTimeout(() => {
            setSaveStatus(null)
          }, 2000)
        }, 500)
        
        return () => clearTimeout(timer)
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des données du formulaire:', error)
        setSaveStatus('error')
      }
    }
    
    // Éviter trop d'appels en ajoutant un debounce
    const debounceSave = setTimeout(saveFormData, 1000)
    return () => clearTimeout(debounceSave)
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, formData.paymentMethod, formData.createAccount])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.acceptTerms) {
      alert('Veuillez accepter les conditions générales pour continuer.')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Simuler un traitement de paiement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simuler une réussite pour ce test
      const success = Math.random() > 0.2 // 80% de chance de réussite
      
      if (success) {
        // Enregistrer les données complètes de la commande
        const finalOrderData = {
          ...bookingData,
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
          },
          payment: {
            method: formData.paymentMethod,
            status: 'completed',
            timestamp: new Date().toISOString()
          },
          orderNumber: `ORD-${Date.now().toString().substring(6)}`,
          status: 'confirmed'
        }
        
        localStorage.setItem('orderData', JSON.stringify(finalOrderData))
        
        // Rediriger vers la page de succès
        router.push('/checkout/success')
      } else {
        // Rediriger vers la page d'erreur
        router.push('/checkout/error')
      }
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error)
      setIsProcessing(false)
      alert('Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.')
    }
  }
  
  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '')
              .replace(/(\d{4})/g, '$1 ')
              .trim()
              .substring(0, 19)
  }
  
  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '')
              .replace(/(\d{2})(\d)/, '$1/$2')
              .substring(0, 5)
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
  
  if (!bookingData || !itemDetails) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Aucune réservation en cours</h1>
          <p className="text-gray-600 mb-8">Vous n'avez pas de réservation en cours ou vos données ont expiré.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }
  
  // Déterminer le type d'élément
  const isPack = bookingData.type === 'PACK'
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Indicateur de sauvegarde */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md text-sm font-medium z-50 transition-all duration-300 ${
          saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
          saveStatus === 'saved' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {saveStatus === 'saving' ? 'Sauvegarde en cours...' : 
           saveStatus === 'saved' ? 'Données sauvegardées' : 
           'Erreur de sauvegarde'}
        </div>
      )}
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Étapes de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <Link 
              href="/checkout/summary"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Retour au récapitulatif
            </Link>
            
            <div className="hidden sm:flex items-center text-sm font-medium text-gray-500">
              <span className="text-emerald-600">1. Sélection</span>
              <span className="mx-2">→</span>
              <span className="text-emerald-600">2. Personnalisation</span>
              <span className="mx-2">→</span>
              <span className="text-emerald-600">3. Récapitulatif</span>
              <span className="mx-2">→</span>
              <span className="text-emerald-600 font-bold">4. Paiement</span>
              <span className="mx-2">→</span>
              <span className="text-gray-400">5. Confirmation</span>
            </div>
            
            {/* Version mobile des étapes */}
            <div className="sm:hidden text-sm font-medium text-gray-500">
              Étape 4/5
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Paiement</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulaire de paiement */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              {/* Information personnelles */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="Jean"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="Dupont"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="jean.dupont@example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="createAccount"
                      checked={formData.createAccount}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Créer un compte pour suivre ma commande et bénéficier d'avantages exclusifs
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Méthode de paiement */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Méthode de paiement</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="card"
                      name="paymentMethod"
                      type="radio"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="card" className="ml-3 flex items-center text-sm font-medium text-gray-700">
                      <CreditCardIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Carte bancaire
                    </label>
                  </div>
                  
                  {formData.paymentMethod === 'card' && (
                    <div className="ml-7 mt-3 bg-gray-50 p-4 rounded-md border border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Numéro de carte
                          </label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={(e) => {
                              const formatted = formatCardNumber(e.target.value)
                              setFormData(prev => ({ ...prev, cardNumber: formatted }))
                            }}
                            required
                            placeholder="4242 4242 4242 4242"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="w-1/2">
                            <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                              Date d'expiration
                            </label>
                            <input
                              type="text"
                              id="cardExpiry"
                              name="cardExpiry"
                              value={formData.cardExpiry}
                              onChange={(e) => {
                                const formatted = formatExpiry(e.target.value)
                                setFormData(prev => ({ ...prev, cardExpiry: formatted }))
                              }}
                              required
                              placeholder="MM/AA"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="w-1/2">
                            <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 mb-1">
                              Code de sécurité (CVC)
                            </label>
                            <input
                              type="text"
                              id="cardCvc"
                              name="cardCvc"
                              value={formData.cardCvc}
                              onChange={(e) => {
                                // Limiter à 3-4 chiffres
                                const value = e.target.value.replace(/\D/g, '').substring(0, 4)
                                setFormData(prev => ({ ...prev, cardCvc: value }))
                              }}
                              required
                              placeholder="123"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      id="paypal"
                      name="paymentMethod"
                      type="radio"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="paypal" className="ml-3 text-sm font-medium text-gray-700">
                      PayPal
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="bank-transfer"
                      name="paymentMethod"
                      type="radio"
                      value="bank-transfer"
                      checked={formData.paymentMethod === 'bank-transfer'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="bank-transfer" className="ml-3 text-sm font-medium text-gray-700">
                      Virement bancaire
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Conditions générales */}
              <div className="p-6">
                <div className="mb-4">
                  <label className="inline-flex items-start">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      required
                      className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500 mt-1"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      J'accepte les <a href="#" className="text-emerald-600 underline">conditions générales de vente</a> et la <a href="#" className="text-emerald-600 underline">politique de confidentialité</a>
                    </span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <LockClosedIcon className="h-4 w-4 mr-1" />
                    Paiement sécurisé
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        Confirmer et payer {bookingData.totalAmount}€
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Récapitulatif de la commande */}
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 sticky top-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{itemDetails.name}</span>
                    <span className="text-sm font-medium">{itemDetails.price}€</span>
                  </div>
                  
                  {bookingData.totalAmount !== itemDetails.price && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Personnalisation
                      </span>
                      <span className={`text-sm font-medium ${bookingData.totalAmount > itemDetails.price ? 'text-red-600' : 'text-emerald-600'}`}>
                        {bookingData.totalAmount > itemDetails.price ? '+' : ''}{bookingData.totalAmount - itemDetails.price}€
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-emerald-600">{bookingData.totalAmount}€</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Ce qui est inclus :</h3>
                
                <ul className="space-y-2">
                  <li className="flex items-start text-sm">
                    <CheckIcon className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span>
                      {isPack ? `Pack complet avec ${bookingData.workers} travailleurs pendant ${bookingData.duration} jour(s)` :
                              `Service avec ${bookingData.workers} travailleurs pendant ${bookingData.duration} heure(s)`}
                    </span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckIcon className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Professionnels qualifiés et assurés</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckIcon className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Garantie satisfaction</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckIcon className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span>Assistance client 7j/7</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-4 bg-emerald-50 flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-emerald-700">
                  Vous pouvez annuler gratuitement jusqu'à 48h avant le début de la prestation. Au-delà, des frais d'annulation s'appliqueront.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Badges de sécurité */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <div className="flex items-center text-gray-500 text-sm">
            <LockClosedIcon className="h-5 w-5 mr-2" />
            Paiement 100% sécurisé
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Transactions cryptées
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M7.5 12.5h9M7.5 15.5h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9 8.5c-.5 0-1 .5-1 1M12 8.5c-.5 0-1 .5-1 1M15 8.5c-.5 0-1 .5-1 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Protection des données
          </div>
        </div>
      </div>
    </div>
  )
} 