'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { CheckIcon } from '@heroicons/react/24/outline'
import { LegalConsent } from '@/components/LegalConsent'
import { createPaymentIntent } from '@/actions/paymentManager'
import { StripeElementsProvider, PaymentForm } from '@/components/StripeElements'
import { Button } from '@/components/Button'

export default function CheckoutPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
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
  const [bookingType, setBookingType] = useState<string | null>(null)
  const [bookingItemId, setBookingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  
  // Fonction de chargement de la réservation en utilisant l'API
  const fetchBookingData = async () => {
    try {
      const response = await fetch('/api/bookings/current', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        setError("Aucune réservation trouvée");
        setIsLoading(false);
        return;
      }
      
      const apiBooking = await response.json();
      
      if (apiBooking && apiBooking.details && apiBooking.details.items && apiBooking.details.items.length > 0) {
        // Trouver le premier élément de la réservation
        const firstItem = apiBooking.details.items[0];
        const itemData = firstItem.data;
        
        // Déterminer le type d'élément (en minuscules pour uniformisation)
        const bookingType = firstItem.type.toLowerCase();
        const itemId = firstItem.itemId || firstItem.id;
        
        // Mettre à jour les états avec les données récupérées
        setBookingData(apiBooking);
        setBookingType(bookingType);
        setBookingItemId(itemId);
        
        // Mettre à jour les informations client si disponibles
        if (apiBooking.details.customer || apiBooking.customer) {
          const customer = apiBooking.details.customer || apiBooking.customer;
          setFormData(prevData => ({
            ...prevData,
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            phone: customer.phone || ''
          }));
        }
        
        setIsLoading(false);
      } else {
        setError("Aucune réservation valide trouvée");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Une erreur est survenue lors de la récupération des données");
      setIsLoading(false);
    }
  };
  
  // Appeler fetchBookingData au chargement du composant
  useEffect(() => {
    fetchBookingData();
  }, []);
  
  // Sauvegarder automatiquement les données du formulaire
  useEffect(() => {
    if (Object.keys(formData).length === 0 || isLoading) {
      return
    }
    
    // Ne pas sauvegarder les données sensibles de carte dans cet exemple
    const safeFormData = { ...formData }
    delete safeFormData.cardNumber
    delete safeFormData.cardExpiry
    delete safeFormData.cardCvc
    
    // Nous ne sauvegardons plus dans localStorage
    // Tout est géré par getCurrentBooking maintenant
  }, [formData, isLoading])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData({
      ...formData,
      [name]: newValue
    })
  }
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Dans handleSubmit, corriger le filtrage des champs obligatoires
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Vérifier que tous les champs obligatoires sont remplis
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'acceptTerms'];
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value === undefined || value === '';
    });
    
    if (missingFields.length > 0) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    if (!formData.acceptTerms) {
      setError("Vous devez accepter les conditions générales");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Récupérer la réservation actuelle via l'API
      const response = await fetch('/api/bookings/current', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Réservation introuvable');
      }
      
      const apiBooking = await response.json();
      
      if (!apiBooking || !apiBooking.details) {
        throw new Error('Données de réservation invalides');
      }
      
      // Mettre à jour les informations client
      const customerUpdateResponse = await fetch(`/api/bookings/${apiBooking.id}/customer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        })
      });
      
      if (!customerUpdateResponse.ok) {
        console.warn('Erreur lors de la mise à jour des informations client');
      }
      
      // Préparer les données pour le paiement
      const { clientSecret } = await createPaymentIntent(
        apiBooking.id,
        apiBooking.details.totalAmount || apiBooking.totalAmount,
        `Paiement pour ${bookingType} - ${apiBooking.id.substring(0, 8)}`
      );
      
      // Stocker le secret client pour l'affichage du formulaire de paiement
      setClientSecret(clientSecret);
      setShowPaymentForm(true);
      
    } catch (error) {
      console.error('Erreur lors de la préparation du paiement:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };
  
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
        
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Finaliser votre commande</h1>
        <p className="text-sm text-gray-600 mb-6">Complétez vos informations et procédez au paiement sécurisé</p>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulaire de paiement */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Information personnelles */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                  <div className="flex items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">1</div>
                    <h2 className="text-base font-medium text-gray-900">Informations personnelles</h2>
                  </div>
                </div>
                
                <div className="p-5">
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
              </div>
              
              {/* Méthode de paiement */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 mr-3">2</div>
                    <h2 className="text-base font-medium text-gray-900">Méthode de paiement</h2>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center p-3 border rounded-lg border-gray-200 hover:bg-gray-50">
                      <input
                        id="card"
                        name="paymentMethod"
                        type="radio"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="card" className="ml-3 flex items-center text-sm font-medium text-gray-700 w-full">
                        <CreditCardIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Carte bancaire
                        <div className="ml-auto flex space-x-2">
                          {/* Logo Visa */}
                          <svg className="h-6" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#00579F" d="M290 12H40c-16.6 0-30 13.4-30 30v416c0 16.6 13.4 30 30 30h250c16.6 0 30-13.4 30-30V42c0-16.6-13.4-30-30-30z" />
                            <path fill="#FAA61A" d="M350 12h250c16.6 0 30 13.4 30 30v416c0 16.6-13.4 30-30 30H350c-16.6 0-30-13.4-30-30V42c0-16.6 13.4-30 30-30z" />
                            <path fill="white" d="M509.5 188.2c-14.8-5.4-24-9-24-14.8 0-5 5.8-10.2 18.2-10.2 10.8 0 19.8 2.2 26.2 4.8l3.6-16.6c-6.4-2.8-16.2-5.4-28.6-5.4-32.4 0-54.8 16.8-54.8 40.8 0 17.8 16 28 28.6 34 12.6 6 16.8 10 16.8 15.6 0 8.2-10 12-19.6 12-11.8 0-23-3-30-6.4l-3.6 17c6.8 3 19.6 6 32.8 6 34.8 0 57.2-16.6 57.2-41.8-0.2-17.2-14.4-27.4-32.8-35z" />
                            <path fill="white" d="M389.6 186.4c-11.8 0-21.8 2.4-30.2 8.2l3.6-17h-25.8l-26 119.8h25.6l10.4-48c4-19 14.4-31 25.8-31 7.4 0 10.2 4.8 10.2 11.8 0 4.2-0.4 9.4-1.6 13.4l-11.8 53.8h25.6l12.2-56.6c1.4-6.2 2.4-13.8 2.4-19 0-16.2-7-35.4-30.4-35.4z" />
                            <path fill="white" d="M222.6 146.4l-3.8 22.4c-6.4-8.4-15.2-13.4-27.6-13.4-26.2 0-49.6 31-49.6 66.8 0 22.8 11.4 41.6 35 41.6 12 0 23.4-6 31.4-16.2l-1.4 13.6h23.8l18.8-114.8h-26.6zm-16.4 79c-13.4 19.2-38.2 16-38.2-7.4 0-20.4 11.8-33.8 26.6-33.8 11.2 0 16.6 7 16.6 17.2 0 7.6-2 16.2-5 24z" />
                          </svg>
                          
                          {/* Logo Mastercard */}
                          <svg className="h-6" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#D9222A" d="M450 250c0 99.4-80.6 180-180 180S90 349.4 90 250 170.6 70 270 70s180 80.6 180 180z" />
                            <path fill="#EE9F2D" d="M510 70c-48 0-91.1 19.4-122.3 50.7-7.9 7.9-15.1 16.5-21.3 25.8h42.7c5.3 7.9 10 16.3 14 25h-70.7c-3.6 8.1-6.6 16.4-9 25h88.7c4.9 15.7 7.6 32.2 8 50 0 8.6-0.6 17-1.7 25H350c1.3 8.3 3.3 16.5 6 24.2h66c-2.7 8.2-6 15.9-10 23.2h-46c4 7.7 8.5 15 13.7 21.9 31.2 31.3 74.3 50.8 122.3 50.8 99.4 0 180-80.6 180-180S609.4 70 510 70z" />
                            <path fill="#D9222A" d="M617.9 335c1.4-5.4 4.8-8.3 9.8-8.3 5.5 0 9 3.4 9 8.3h-18.8zm27.7 7.1c0-13.2-8.2-21.3-21-21.3-13 0-22.5 9-22.5 21.8 0 13 9.8 21.7 23.3 21.7 6.6 0 12.7-1.6 17.9-5.7l-4.6-7.1c-3.7 2.6-8.4 4.2-12.4 4.2-6 0-11.3-2.8-12.5-10.6h31.8v-3z" />
                            <path fill="#D9222A" d="M530 342.3c0-5 3.8-8.8 9.8-8.8 3 0 5.3 0.8 7.4 3l4.8-7.2c-3.6-3.2-8.1-4.7-12.9-4.7-12.8 0-21.7 8.9-21.7 21.7 0 13 8.9 21.8 21.4 21.8 5 0 9.5-1.4 13.1-4.8l-4.6-7.2c-2.2 2.3-4.9 3.3-7.7 3.3-6 0-9.6-3.7-9.6-8.9v-8.2z" />
                            <path fill="#D9222A" d="M590.3 323.1c-2.6-1.5-6.2-2.8-10.1-2.8-6.3 0-10.5 3-10.5 8 0 4.1 3.1 6.4 8.7 7.2l2.6 0.4c3 0.4 4.3 1.2 4.3 2.6 0 2-2 3.1-5.6 3.1-3.7 0-6.3-1.1-8.1-2.6l-4.3 7.8c4.1 2.6 9.3 3.9 12.8 3.9 8.4 0 13.2-4 13.2-8.9 0-1.5-0.2-2.8-0.8-4-1.1-2.4-3.8-4.2-8.3-4.9l-2.6-0.4c-2.4-0.3-4-0.9-4-2.3 0-1.7 1.8-3 4.6-3 3.2 0 6.3 1.2 7.9 2.2l4.2-7.3z" />
                            <path fill="#D9222A" d="M468.2 320.8c-13 0-22.1 9.1-22.1 21.8 0 13.1 9.1 21.7 22.5 21.7 6.5 0 12.5-1.6 17.7-5.8l-4.6-7.7c-3.7 2.7-8.3 4.4-12.3 4.4-6 0-11.5-2.8-12.7-10.6h31.8c0.1-0.9 0.2-1.8 0.2-2.7 0-13-8.1-21.1-20.5-21.1zm-9.9 14.9c1-4.8 4.5-8.3 9.6-8.3 5.2 0 8.6 3.4 8.6 8.3h-18.2z" />
                            <path fill="#D9222A" d="M673.8 321.4h-14.1v-12.1l-12.7 4.1v8h-9.3v10.1h9.3V348c0 10.7 4.1 16.2 15.8 16.2 4.3 0 9.1-1.1 12.2-2.9l-2.8-9.8c-2.1 1.1-4.9 1.8-6.9 1.8-3.9 0-5.6-2.4-5.6-7.2v-14.6h14.1v-10.1z" />
                            <path fill="#D9222A" d="M558.5 320.8c-5.1 0-8.5 2.4-10.8 6.1l-0.7-5.4h-11.3v41.9h12.4v-23.4c2.3-2.9 5.4-4 8.8-4 1.8 0 3.2 0.2 4.8 0.7l2.7-11.7c-1.8-1-3.8-1.6-5.9-1.6v-2.6z" />
                            <path fill="#D9222A" d="M407.4 362.7c-9.9 0-15.9-3.6-15.9-9.3 0-3.7 2.4-6.3 7.6-7.2 3.8-0.6 8.4-0.4 12-1.3-0.3 8.8 4.8 14.4 14.9 14.4 4.9 0 9.8-1.2 13.5-3.6l-4.1-8.4c-2.5 1.4-5.5 2.2-8.3 2.2-4.7 0-7.5-2.1-7.5-5.4 0-1.3 0.3-2.8 0.9-4.3h-1.1c-1.7 0-3.4 0.1-5 0.3-8.7 1.1-14.8 5.7-14.8 14.3 0 8.6 6.8 17.2 25.2 17.2 13.5 0 22.5-6.4 25.5-17.3h-11.7c-2.1 5.4-6.5 8.4-14.2 8.4h-16.5z" />
                            <path fill="#D9222A" d="M421.9 337.7c-5.3 0.8-9.6 0.8-12.8 1.3-5.2 0.8-7.5 3.7-7.5 7.1v0.4c2.5-2.5 6.2-3.5 11.5-4.2 3.1-0.4 6.3-0.6 9.6-1.1h0.9l-0.8-3.5h-0.9z" />
                            <path fill="#D9222A" d="M450.1 341.4h11.7c-1.3-4.7-4-8.9-8.9-11.5-4.9-2.6-11.3-3.6-17.8-2.4-16.9 3-19.9 17.9-12.5 29.2 2.6 4 7.5 7.2 13.5 7.2 7.8 0 12.1-3 14.2-8.4h11.7c-2.9 10.9-12 17.3-25.5 17.3-18.4 0-25.2-8.5-25.2-17.2 0-8.6 6.1-13.1 14.8-14.3 1.6-0.2 3.3-0.3 5-0.3h1.1c-0.6 1.5-0.9 3-0.9 4.3 0 3.3 2.8 5.4 7.5 5.4 2.8 0 5.8-0.8 8.3-2.2l4.1 8.4c-3.7 2.3-8.6 3.6-13.5 3.6-10.1 0-15.2-5.6-14.9-14.4-3.7 0.9-8.3 0.7-12 1.3-5.2 0.9-7.6 3.5-7.6 7.2 0 5.7 6 9.3 15.9 9.3h16.8z" />
                          </svg>
                          
                          {/* Logo Amex */}
                          <svg className="h-6" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#006FCF" d="M40 100c0-33.1 26.9-60 60-60h580c33.1 0 60 26.9 60 60v300c0 33.1-26.9 60-60 60H100c-33.1 0-60-26.9-60-60V100z" />
                            <path fill="white" d="M145.2 219.9h38.7v-17.7h-55.6v69.5h55.6v-17.8h-38.7v-9.5h37.6v-16.6h-37.6v-7.9zm222.6-17.7l-27.2 29.1-26.8-29.1h-20.8v68.6h19v-52.8l22.6 24.5h10.8l22.6-24.5v52.8h18.9v-68.6h-19.1zm-165 0l-31.7 68.6h20.8l5.8-13h32.4l5.7 13h21.5l-31.7-68.6h-22.8zm-2.4 38.5l9.3-22.2 9.3 22.2h-18.6zm264.3-38.5h-21.2l-27.6 68.6h20.9l5.1-14.1h30.2l5.3 14.1h21.4l-28.5-68.6h-5.6zm-16.1 38.5l8.4-23.4 8.9 23.4h-17.3zm64.8-38.5v68.6h19.6v-27.1h5.9l20.4 27.1h23.5l-23.6-29.4c10-3.1 16.6-10.3 16.6-21 0-17.3-13.2-26.2-33.2-26.2h-29.2zm19.6 27.7v-14h2.8c8.5 0 13.3 2.4 13.3 7.1 0 4.8-4.7 6.9-13.3 6.9h-2.8z" />
                            <path fill="#006FCF" d="M584.6 243.3h-30.1l-5.3-14.1h-2.3l21.1 58.9h3.5l28.5-68.6h-9.7l-5.1 14.1-0.6-0.9v10.6z" />
                          </svg>
                        </div>
                      </label>
                    </div>
                    
                    {formData.paymentMethod === 'card' && (
                      <div className="ml-7 mt-3 p-5 rounded-md border border-gray-200 bg-white shadow-sm">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Numéro de carte
                            </label>
                            <div className="relative">
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
                                className="block w-full pl-3 pr-10 py-2 rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <LockClosedIcon className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
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
                              <div className="relative">
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
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <span className="text-xs text-gray-400">3 ou 4 chiffres</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center p-3 border rounded-lg border-gray-200 hover:bg-gray-50">
                      <input
                        id="paypal"
                        name="paymentMethod"
                        type="radio"
                        value="paypal"
                        checked={formData.paymentMethod === 'paypal'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="paypal" className="ml-3 flex items-center text-sm font-medium text-gray-700 w-full">
                        {/* Logo PayPal */}
                        <svg className="h-5 mr-2" viewBox="0 0 124 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.57.57 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="#253B80" />
                          <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" fill="#179BD7" />
                          <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z" fill="#253B80" />
                          <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L8.05 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179BD7" />
                          <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.225 9.045 9.045 0 0 0-.277-.291z" fill="#222D65" />
                          <path d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.313c.365.121.704.264 1.017.425.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z" fill="#253B80" />
                        </svg>
                        PayPal
                        <span className="ml-auto text-xs text-gray-500">Paiement sécurisé via PayPal</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center p-3 border rounded-lg border-gray-200 hover:bg-gray-50">
                      <input
                        id="bank-transfer"
                        name="paymentMethod"
                        type="radio"
                        value="bank-transfer"
                        checked={formData.paymentMethod === 'bank-transfer'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="bank-transfer" className="ml-3 flex items-center text-sm font-medium text-gray-700 w-full">
                        <svg className="h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        Virement bancaire
                        <span className="ml-auto text-xs text-gray-500">Délai de traitement: 2-3 jours</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Conditions générales et validation */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">3</div>
                    <h2 className="text-base font-medium text-gray-900">Validation</h2>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <LegalConsent
                      onAcceptChange={(accepted: boolean) => 
                        setFormData(prev => ({ ...prev, acceptTerms: accepted }))
                      }
                      initialValue={formData.acceptTerms}
                      required={true}
                      color="emerald"
                      dataProtection={true}
                      termsAndConditions={true}
                      cookiesPolicy={true}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex items-center text-sm text-gray-500">
                      <LockClosedIcon className="h-4 w-4 mr-1" />
                      Paiement sécurisé SSL
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={`inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                          Confirmer et payer {bookingData.details.totalTTC ? bookingData.details.totalTTC.toFixed(2) : (bookingData.details.total * 1.2).toFixed(2)}€ TTC
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          {/* Récapitulatif de la commande */}
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 sticky top-8">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-sky-50">
                <h2 className="text-base font-medium text-gray-900 mb-2">Récapitulatif de commande</h2>
                <div className="text-sm text-gray-600">{itemDetails.name}</div>
                
                <div className="mt-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">Prix total</span>
                    <div className="text-right">
                      <span className="block text-xl font-bold text-emerald-700">{bookingData.details.total}€ HT</span>
                      <span className="block text-xs text-emerald-600">soit {bookingData.details.totalTTC ? bookingData.details.totalTTC.toFixed(2) : (bookingData.details.total * 1.2).toFixed(2)}€ TTC</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-b border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{itemDetails.name}</span>
                    <span className="text-sm font-medium">{itemDetails.price}€</span>
                  </div>
                  
                  {(bookingData && bookingData.details && typeof bookingData.details.workers !== 'undefined' && 
                    bookingData.details.workers > (isPack ? 2 : 1)) && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Professionnels supplémentaires</span>
                      <span className="font-medium">+{isPack 
                        ? Math.round(((bookingData.details.workers || 0) - 2) * 120 * (bookingData.details.duration || 1)) 
                        : Math.round(((bookingData.details.workers || 0) - 1) * 25 * (bookingData.details.duration || 1))}€</span>
                    </div>
                  )}
                  
                  {(bookingData && bookingData.details && typeof bookingData.details.duration !== 'undefined' && 
                    bookingData.details.duration > (isPack ? 1 : (itemDetails && itemDetails.duration ? itemDetails.duration : 1))) && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{isPack ? 'Jours' : 'Heures'} supplémentaires</span>
                      <span className="font-medium">+{isPack 
                        ? Math.round(((bookingData.details.duration || 0) - 1) * (itemDetails ? itemDetails.price : 0) * 0.9) 
                        : Math.round(((bookingData.details.duration || 0) - (itemDetails ? itemDetails.duration : 1)) * 25)}€</span>
                    </div>
                  )}
                  
                  {bookingData.details.liftCost > 0 && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        Monte-meuble
                        {(bookingData.details.pickupNeedsLift && bookingData.details.deliveryNeedsLift) ? ' (départ et arrivée)' : 
                        bookingData.details.pickupNeedsLift ? ' (départ)' : ' (arrivée)'}
                      </span>
                      <span className="font-medium">+{bookingData.details.liftCost}€</span>
                    </div>
                  )}

                  {bookingData.details.hasInsurance && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Assurance complémentaire</span>
                      <span className="font-medium">+12.50€</span>
                    </div>
                  )}
                  
                  <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-medium text-sm">Sous-total HT</span>
                    <span className="font-medium">{bookingData.details.total}€</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">TVA (20%)</span>
                    <span className="text-sm font-medium">{(bookingData.details.total * 0.2).toFixed(2)}€</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-medium">Total TTC</span>
                    <span className="font-bold text-emerald-600">{bookingData.details.totalTTC ? bookingData.details.totalTTC.toFixed(2) : (bookingData.details.total * 1.2).toFixed(2)}€</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Ce qui est inclus :</h3>
                <ul className="space-y-2.5">
                  <li className="flex items-start text-sm">
                    <CheckIcon className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                    <span>
                      {isPack ? `Pack complet avec ${bookingData.details.workers} professionnel${bookingData.details.workers > 1 ? 's' : ''} pendant ${bookingData.details.duration} jour${bookingData.details.duration > 1 ? 's' : ''}` :
                              `Service avec ${bookingData.details.workers} professionnel${bookingData.details.workers > 1 ? 's' : ''} pendant ${bookingData.details.duration} heure${bookingData.details.duration > 1 ? 's' : ''}`}
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
                  {bookingData.details.hasInsurance && (
                    <li className="flex items-start text-sm">
                      <CheckIcon className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span>Assurance complémentaire contre les dommages accidentels</span>
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Vous pouvez annuler gratuitement jusqu'à 48h avant le début de la prestation. Au-delà, des frais d'annulation s'appliqueront.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Badges de sécurité */}
        <div className="mt-12 py-4 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center text-gray-500 text-sm">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <LockClosedIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Paiement 100% sécurisé</p>
                <p className="text-xs text-gray-500">Toutes vos données sont protégées</p>
              </div>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <CheckCircleIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Transactions cryptées</p>
                <p className="text-xs text-gray-500">Cryptage SSL de vos paiements</p>
              </div>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M7.5 12.5h9M7.5 15.5h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M9 8.5c-.5 0-1 .5-1 1M12 8.5c-.5 0-1 .5-1 1M15 8.5c-.5 0-1 .5-1 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-700">Protection des données</p>
                <p className="text-xs text-gray-500">Conformité RGPD garantie</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 