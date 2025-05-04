'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentBooking } from '@/actions/bookingManager'
import Link from 'next/link'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { PaymentProcessor } from '@/components/PaymentProcessor'
import { logger } from '@/lib/logger'

// Créer un logger sécurisé qui fonctionne même si withContext n'est pas disponible
const paymentLogger = logger.withContext ? 
  logger.withContext('PackPayment') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[PackPayment]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[PackPayment]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[PackPayment]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[PackPayment]', msg, ...args)
  };

interface PackBookingData {
  id: string
  status: string
  pack: {
    id: string
    name: string
    description: string
    price: number
    image?: string
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
  scheduledTime?: string
  pickupAddress?: string
  deliveryAddress?: string
  duration?: number
  workers?: number
  totalPrice: number
}

export default function PackPaymentPage() {
  const router = useRouter()
  
  const [booking, setBooking] = useState<PackBookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setLoading(true);
      paymentLogger.info('Récupération des données de réservation de pack');
      
      // Utiliser le server action getCurrentBooking
      const currentBooking = await getCurrentBooking();
      paymentLogger.debug('Booking récupéré', { id: currentBooking?.id });
      
      if (!currentBooking || !currentBooking.items || currentBooking.items.length === 0) {
        throw new Error('Réservation vide ou introuvable')
      }
      
      // Trouver le premier pack dans la réservation
      const packItem = currentBooking.items.find(item => item.type === 'pack')
      
      if (!packItem) {
        throw new Error('Type de réservation invalide')
      }
      
      // Générer un ID client temporaire si nécessaire
      const customerId = currentBooking.customerId || `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Construire l'objet de données nécessaire pour la page de paiement
      const formattedBooking: PackBookingData = {
        id: currentBooking.id,
        status: currentBooking.status,
        pack: {
          id: packItem.data.id,
          name: packItem.data.name,
          description: packItem.data.description,
          price: packItem.data.price
        },
        customer: {
          id: customerId,
          firstName: currentBooking.customerData?.firstName || 'Client',
          lastName: currentBooking.customerData?.lastName || '',
          email: currentBooking.customerData?.email || 'client@example.com',
          phone: currentBooking.customerData?.phone || ''
        },
        scheduledDate: packItem.data.scheduledDate ? new Date(packItem.data.scheduledDate).toISOString() : new Date().toISOString(),
        scheduledTime: packItem.data.scheduledTime || '',
        pickupAddress: packItem.data.pickupAddress || '',
        deliveryAddress: 'deliveryAddress' in packItem.data ? packItem.data.deliveryAddress : '',
        duration: packItem.data.duration,
        workers: packItem.data.workers,
        totalPrice: currentBooking.totalTTC
      }
      
      paymentLogger.debug('Données de réservation formatées', { packName: formattedBooking.pack.name });
      setBooking(formattedBooking);
      
      // Calculer le montant de l'acompte (30% du prix total)
      const deposit = Math.ceil(formattedBooking.totalPrice * 0.3);
      setDepositAmount(deposit);
      setCustomerInfo({
        firstName: formattedBooking.customer.firstName,
        lastName: formattedBooking.customer.lastName,
        email: formattedBooking.customer.email,
        phone: formattedBooking.customer.phone
      });
    } catch (error) {
      paymentLogger.error('Erreur lors de la récupération de la réservation', error as Error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération de la réservation');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBooking();
  }, []);

  // Gestionnaire de succès pour le paiement
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      paymentLogger.info('Paiement réussi pour le pack', { paymentIntentId });
    
      // Enregistrer le paiement côté serveur
      const response = await fetch('/api/packs/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking?.id,
          paymentIntentId,
          customerInfo
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement du paiement');
      }
      
      // Rediriger vers la page de succès
      router.push(`/packs/success?id=${booking?.id}`);
    } catch (error) {
      paymentLogger.error('Erreur lors de la finalisation du paiement', error as Error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-medium text-lg mb-2">Une erreur est survenue</h2>
          <p className="text-red-700">{error || "Impossible de récupérer les détails de la réservation"}</p>
          <Link href="/packs" className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
            Retour aux packs
            </Link>
          </div>
        </div>
    );
  }

  // Récapitulatif de la commande pour le paiement
  const OrderSummary = () => (
    <div>
      <h3 className="font-medium text-gray-900 mb-2">{booking.pack.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{booking.pack.description}</p>
      
      {booking.scheduledDate && (
        <div className="flex items-center text-sm mb-2">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span>{new Date(booking.scheduledDate).toLocaleDateString('fr-FR', { 
    day: 'numeric',
    month: 'long',
    year: 'numeric'
          })}</span>
        </div>
      )}
      
      {booking.scheduledTime && (
        <div className="flex items-center text-sm mb-2">
          <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span>{booking.scheduledTime}</span>
        </div>
      )}
      
      {booking.pickupAddress && (
        <div className="flex items-start text-sm mb-2">
          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
          <span>{booking.pickupAddress}</span>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-200 mt-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Prix total</span>
          <span className="font-medium">{booking.totalPrice.toFixed(2)} €</span>
          </div>
        
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600">Acompte (30%)</span>
          <span>{depositAmount.toFixed(2)} €</span>
          </div>
        
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Solde restant</span>
          <span>{(booking.totalPrice - depositAmount).toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Paiement de votre pack</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2 order-2 md:order-1">
          <PaymentProcessor 
            paymentData={{
              id: booking.id,
              amount: depositAmount,
              description: `Acompte pour ${booking.pack.name}`,
              onSuccess: handlePaymentSuccess
            }}
            serviceName={booking.pack.name}
            orderSummary={<OrderSummary />}
            backUrl="/packs"
          />
                </div>
        
        <div className="md:w-1/2 bg-gray-50 p-6 rounded-lg md:order-2">
          <h2 className="text-xl font-semibold mb-4">Vos informations</h2>
          
          <div className="space-y-4 mb-6">
                    <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom</label>
                      <input
                        type="text"
                        id="firstName"
                        value={customerInfo.firstName}
                onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
            
                    <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
                      <input
                        type="text"
                        id="lastName"
                        value={customerInfo.lastName}
                onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
            
                  <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
            
                  <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                      type="tel"
                      id="phone"
                      value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800">Pour tester en mode développement</h3>
            <p className="text-blue-600">Utilisez la carte de test suivante :</p>
            <p className="font-mono text-sm mt-1">4242 4242 4242 4242</p>
            <p className="text-xs text-blue-500 mt-1">Date future quelconque, CVC: 3 chiffres quelconques</p>
          </div>
        </div>
      </div>
    </div>
  );
} 