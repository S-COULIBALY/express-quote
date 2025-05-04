'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentBooking } from '@/actions/bookingManager'
import { PaymentProcessor } from '@/components/PaymentProcessor'
import { logger } from '@/lib/logger'

// Créer un logger sécurisé qui fonctionne même si withContext n'est pas disponible
const paymentLogger = logger.withContext ? 
  logger.withContext('MovingPayment') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[MovingPayment]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[MovingPayment]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[MovingPayment]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[MovingPayment]', msg, ...args)
  };

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState<number>(0)

  useEffect(() => {
    const fetchQuoteData = async () => {
      try {
        setLoading(true);
        // Récupérer les données via getCurrentBooking
        paymentLogger.info('Récupération des données de déménagement');
        const currentBooking = await getCurrentBooking();
        
        if (currentBooking && currentBooking.items && currentBooking.items.length > 0) {
          paymentLogger.debug('Booking trouvé', { id: currentBooking.id });
          
          // Chercher un item de type déménagement
          const movingItem = currentBooking.items.find(item => 
            typeof item.type === 'string' && (
              item.type.toLowerCase().includes('moving') || 
              item.type.toLowerCase().includes('demenagement') || 
              item.type.toLowerCase().includes('déménagement')
            )
          );
          
          if (movingItem) {
            paymentLogger.debug('Item déménagement trouvé', { itemId: movingItem.id });
            const movingData = movingItem.data as any;
            
            // Convertir les données du booking en format QuoteData
            const formattedQuote: QuoteData = {
              id: quoteId || currentBooking.id || '',
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
            
            paymentLogger.debug('Données formatées pour le paiement', { 
              pickupAddress: formattedQuote.pickupAddress,
              deliveryAddress: formattedQuote.deliveryAddress,
              totalCost: formattedQuote.totalCost
            });
            
            setQuoteData(formattedQuote);
            setTotalAmount(formattedQuote.totalCost);
            setLoading(false);
            return;
          }
        }
        
        paymentLogger.warn('Impossible de récupérer les données du devis de déménagement');
        setError('Impossible de récupérer les données du devis. Veuillez réessayer.');
      } catch (error) {
        paymentLogger.error('Erreur lors de la récupération des données de déménagement', error as Error);
        setError('Une erreur est survenue lors de la récupération des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuoteData();
  }, [quoteId]);

  // Handler de succès pour le paiement
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      paymentLogger.info('Paiement réussi pour le déménagement', { paymentIntentId });
      
      // Enregistrer le paiement dans l'API
      const response = await fetch('/api/moving/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quoteId || 'MOVING-' + Date.now(),
          paymentIntentId
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement du paiement');
      }
      
      // Rediriger vers la page de succès
      router.push(`/moving/success?id=${quoteId || 'MOVING-' + Date.now()}`);
    } catch (error) {
      paymentLogger.error('Erreur lors de la finalisation du paiement', error as Error);
      setError('Une erreur est survenue lors de la finalisation du paiement. Le paiement a été traité, mais nous n\'avons pas pu mettre à jour votre réservation.');
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

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-medium text-lg mb-2">Une erreur est survenue</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => router.push('/moving')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retour au déménagement
          </button>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-medium text-lg mb-2">Données indisponibles</h2>
          <p className="text-yellow-700">Nous n'avons pas pu récupérer les données de votre déménagement.</p>
          <button 
            onClick={() => router.push('/moving')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retour au déménagement
          </button>
        </div>
      </div>
    );
  }

  // Information récapitulative pour le paiement
  const OrderSummary = () => (
    <div>
      <h3 className="font-medium text-gray-900 mb-2">Déménagement</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">De</p>
        <p className="text-gray-700">{quoteData.pickupAddress}</p>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">À</p>
        <p className="text-gray-700">{quoteData.deliveryAddress}</p>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Date souhaitée</p>
        <p className="text-gray-700">
          {new Date(quoteData.preferredDate).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Volume</p>
        <p className="text-gray-700">{quoteData.volume} m³</p>
      </div>
      
      {quoteData.distance && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Distance</p>
          <p className="text-gray-700">{quoteData.distance} km</p>
        </div>
      )}
      
      {Object.entries(quoteData.options).filter(([_, value]) => value).length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Options</p>
          <ul className="text-gray-700 list-disc list-inside">
            {quoteData.options.packing && <li>Emballage</li>}
            {quoteData.options.assembly && <li>Montage</li>}
            {quoteData.options.disassembly && <li>Démontage</li>}
            {quoteData.options.insurance && <li>Assurance</li>}
            {quoteData.options.storage && <li>Stockage</li>}
            {quoteData.options.cleaning && <li>Nettoyage</li>}
          </ul>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between">
          <span className="text-gray-600">Prix total</span>
          <span className="font-medium">{quoteData.totalCost.toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600">Acompte (30%)</span>
          <span>{(quoteData.totalCost * 0.3).toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Solde restant</span>
          <span>{(quoteData.totalCost * 0.7).toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Paiement de votre déménagement</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2 order-2 md:order-1">
          <PaymentProcessor 
            paymentData={{
              id: quoteId || 'MOVING-' + Date.now(),
              amount: Math.ceil(quoteData.totalCost * 0.3),
              description: `Acompte pour déménagement de ${quoteData.pickupAddress.substring(0, 15)}... à ${quoteData.deliveryAddress.substring(0, 15)}...`,
              onSuccess: handlePaymentSuccess
            }}
            serviceName="Déménagement"
            orderSummary={<OrderSummary />}
            backUrl="/moving"
          />
        </div>
        
        <div className="md:w-1/2 bg-gray-50 p-6 rounded-lg md:order-2">
          <h2 className="text-xl font-semibold mb-4">Informations importantes</h2>
          <div className="prose prose-sm">
            <p>Vous allez effectuer le paiement d'un acompte de 30% du montant total de votre déménagement. Le solde sera réglé le jour du déménagement.</p>
            <p className="mt-2">Une confirmation par email vous sera envoyée dès réception de votre paiement.</p>
            <p className="mt-2">Pour toute question concernant votre réservation, n'hésitez pas à nous contacter.</p>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Pour tester en mode développement</h3>
              <p className="text-blue-600">Utilisez la carte de test suivante :</p>
              <p className="font-mono text-sm mt-1">4242 4242 4242 4242</p>
              <p className="text-xs text-blue-500 mt-1">Date future quelconque, CVC: 3 chiffres quelconques</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 