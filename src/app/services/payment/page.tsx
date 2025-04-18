'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPaymentIntent } from '@/actions/paymentManager'
import { Service, Pack } from '@/types/booking'
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { StripeElementsProvider, PaymentForm } from '@/components/StripeElements'

interface ServiceBookingData {
  id: string
  status: string
  service: {
    id: string
    name: string
    description: string
    price: number
    duration: number
  }
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  professional?: {
    id: string
    firstName: string
    lastName: string
  }
  scheduledDate: string
  scheduledTime: string
  propertySize: number
  propertyType: string
  address: string
  totalPrice: number
}

// Type guard pour différencier Service et Pack
function isService(data: any): boolean {
  return data && 
    typeof data === 'object' && 
    (data.propertySize !== undefined || 
     data.propertyType !== undefined || 
     data.address !== undefined ||
     data.location !== undefined);
}

export default function ServicePaymentPage() {
  const router = useRouter()
  
  const [booking, setBooking] = useState<ServiceBookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState<number>(0)
  
  // États pour les informations client modifiables
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const fetchBooking = async () => {
    try {
      // Appel à l'API
      const response = await fetch('/api/bookings/current', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Réservation introuvable');
      }
      
      const apiBooking = await response.json();
      console.log("Récupération de la réservation par API:", apiBooking);
      
      // Vérifier que l'API a retourné une réservation valide avec des détails
      if (!apiBooking || !apiBooking.details || !apiBooking.details.items || apiBooking.details.items.length === 0) {
        throw new Error('Réservation vide ou introuvable');
      }
      
      // Vérifier le statut (adapter aux différentes conventions de nommage possibles)
      const bookingStatus = apiBooking.status || '';
      if (bookingStatus !== 'awaiting_payment' && 
          bookingStatus !== 'AWAITING_PAYMENT' && 
          bookingStatus !== 'CONFIRMED' && 
          bookingStatus !== 'confirmed') {
        console.warn(`Statut de réservation inattendu: ${bookingStatus}, attendu: awaiting_payment`);
      }
      
      // Trouver le service dans les éléments de la réservation
      const serviceItem = apiBooking.details.items.find((item: any) => 
        item.type.toLowerCase() === 'service');
      
      if (!serviceItem) {
        throw new Error('Service introuvable dans la réservation');
      }
      
      // Extraire les données du service
      const serviceData = serviceItem.data;
      
      // Générer un ID client temporaire si nécessaire
      const customerId = apiBooking.customerId || apiBooking.details.customerId || 
                       `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Extraire les valeurs de manière sécurisée
      const propertySize = serviceData.propertySize || 0;
      const propertyType = serviceData.propertyType || 'Appartement';
      const serviceAddress = serviceData.address || serviceData.location || '';
      
      // Construire l'objet formaté pour l'affichage
      const formattedBooking: ServiceBookingData = {
        id: apiBooking.id,
        status: apiBooking.status,
        service: {
          id: serviceData.id,
          name: serviceData.name,
          description: serviceData.description || '',
          price: serviceData.price || 0,
          duration: serviceData.duration || 60
        },
        customer: {
          id: customerId,
          firstName: (apiBooking.details.customer?.firstName || apiBooking.customer?.firstName || 'Client'),
          lastName: (apiBooking.details.customer?.lastName || apiBooking.customer?.lastName || ''),
          email: (apiBooking.details.customer?.email || apiBooking.customer?.email || 'client@example.com'),
          phone: (apiBooking.details.customer?.phone || apiBooking.customer?.phone || '')
        },
        scheduledDate: serviceData.scheduledDate ? new Date(serviceData.scheduledDate).toISOString() : new Date().toISOString(),
        scheduledTime: serviceData.scheduledTime || '09:00',
        propertySize: propertySize,
        propertyType: propertyType,
        address: serviceAddress,
        totalPrice: apiBooking.details.totalAmount || apiBooking.totalAmount || serviceData.price || 0
      };
      
      console.log('Données de réservation formatées:', formattedBooking);
      setBooking(formattedBooking);
      
      // Calculer le montant de l'acompte (30% du prix total)
      const deposit = Math.ceil(formattedBooking.totalPrice * 0.3);
      setDepositAmount(deposit);
      
      // Utiliser le server action createPaymentIntent
      const result = await createPaymentIntent(
        formattedBooking.id, 
        deposit, 
        `Acompte pour ${formattedBooking.service.name}`
      );
      setClientSecret(result.clientSecret);
      
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération de la réservation');
      setTimeout(() => router.push('/services'), 3000);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [])
  
  // Mettre à jour les informations client chaque fois que booking change
  useEffect(() => {
    if (booking) {
      setCustomerInfo({
        firstName: booking.customer.firstName,
        lastName: booking.customer.lastName,
        email: booking.customer.email,
        phone: booking.customer.phone
      });
    }
  }, [booking]);
  
  // Valider les informations client
  const validateCustomerInfo = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!customerInfo.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }
    
    if (!customerInfo.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }
    
    if (!customerInfo.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = 'Le numéro de téléphone est requis';
    } else if (!/^[0-9+\s()-]{8,15}$/.test(customerInfo.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Effacer l'erreur pour ce champ lorsqu'il est modifié
    if (validationErrors[id]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };
  
  // Mettre à jour les informations client avant paiement
  const updateCustomerInfo = async (): Promise<boolean> => {
    try {
      // Vérifier que les informations sont valides
      if (!validateCustomerInfo()) {
        return false;
      }
      
      // Appeler l'API pour mettre à jour les informations client
      const response = await fetch('/api/bookings/customer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking?.id,
          customerInfo
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour des informations client: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating customer info:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour des informations client');
      return false;
    }
  };
  
  const handlePaymentSuccess = async () => {
    // Mettre à jour les informations client avant de rediriger
    const updated = await updateCustomerInfo();
    if (updated) {
      router.push('/services/success');
    }
  };
  
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setProcessing(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="animate-pulse flex flex-col items-center py-16">
            <div className="h-10 w-64 bg-gray-300 rounded mb-6"></div>
            <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
            <div className="h-6 w-36 bg-gray-300 rounded"></div>
            <div className="mt-8 h-28 w-full max-w-md bg-white rounded-lg shadow-md"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Une erreur est survenue</h1>
            <p className="text-gray-600 mb-8">{error || 'Impossible de récupérer les détails de votre réservation'}</p>
            <Link
              href="/services"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Retour aux services disponibles
            </Link>
          </div>
        </div>
      </main>
    )
  }
  
  if (!clientSecret) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="animate-pulse flex flex-col items-center py-16">
            <div className="h-10 w-64 bg-gray-300 rounded mb-6"></div>
            <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
            <div className="h-6 w-36 bg-gray-300 rounded"></div>
            <div className="mt-8 h-28 w-full max-w-md bg-white rounded-lg shadow-md"></div>
          </div>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-medium text-gray-900">Paiement</h1>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="text-violet-600 font-medium">Paiement</span>
            <span className="mx-2">›</span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Payment */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations de paiement</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    {Object.keys(validationErrors).length > 0 && (
                      <p className="text-xs text-red-600 mt-1">Veuillez vérifier vos informations personnelles.</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Informations client */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Informations client
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Veuillez vérifier et compléter vos informations de contact ci-dessous. Ces informations seront utilisées pour la facturation et la communication.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        id="firstName"
                        className={`w-full p-2 border ${validationErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-violet-500 focus:border-violet-500`}
                        value={customerInfo.firstName}
                        onChange={handleCustomerInfoChange}
                        required
                      />
                      {validationErrors.firstName && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        id="lastName"
                        className={`w-full p-2 border ${validationErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-violet-500 focus:border-violet-500`}
                        value={customerInfo.lastName}
                        onChange={handleCustomerInfoChange}
                        required
                      />
                      {validationErrors.lastName && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      id="email"
                      className={`w-full p-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-violet-500 focus:border-violet-500`}
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      required
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      id="phone"
                      className={`w-full p-2 border ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-violet-500 focus:border-violet-500`}
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      required
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 my-6 pt-6"></div>
              
              {/* Formulaire de paiement Stripe */}
              <div className="payment-form-container">
                <StripeElementsProvider clientSecret={clientSecret}>
                  <PaymentForm 
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    amount={depositAmount}
                    returnUrl={`${window.location.origin}/services/success`}
                  />
                </StripeElementsProvider>
              </div>
              
              <p className="mt-4 text-xs text-center text-gray-500">
                En cliquant sur "Payer maintenant", vous acceptez nos {" "}
                <Link href="/conditions" className="text-violet-600 hover:text-violet-800">
                  conditions générales
                </Link>{" "}
                et notre{" "}
                <Link href="/privacy" className="text-violet-600 hover:text-violet-800">
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
            
            {/* Security badges */}
            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Paiement sécurisé</span>
                    <span className="block text-xs text-gray-500">SSL / TLS Encryption</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Protection client</span>
                    <span className="block text-xs text-gray-500">100% garantie satisfaction</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Remboursement</span>
                    <span className="block text-xs text-gray-500">Annulation sous 48h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 sticky top-24">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Récapitulatif de votre réservation
                </h2>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Service</span>
                      <span className="block text-base text-gray-900">{booking.service.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Date prévue</span>
                      <span className="block text-base text-gray-900">
                        {new Date(booking.scheduledDate).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Heure prévue</span>
                      <span className="block text-base text-gray-900">
                        {booking.scheduledTime || 'Non spécifiée'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <HomeIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Type de logement</span>
                      <span className="block text-base text-gray-900">{booking.propertyType}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Adresse</span>
                      <span className="block text-base text-gray-900">{booking.address}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 my-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Prix du service</span>
                    <span className="text-sm text-gray-900">{(booking.totalPrice).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Acompte (30%)</span>
                    <span className="text-sm text-violet-600 font-medium">{(booking.totalPrice * 0.3).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <span className="text-base font-medium text-gray-900">Reste à payer</span>
                    <span className="text-base font-medium text-gray-900">{(booking.totalPrice * 0.7).toFixed(2)} €</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Le solde sera à régler le jour de la prestation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 