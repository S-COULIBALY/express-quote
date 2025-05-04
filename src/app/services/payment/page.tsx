'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentProcessor } from '@/components/PaymentProcessor'
import { Service } from '@/types/booking'
import { dateUtils } from '@/utils/dateUtils'
import { priceUtils } from '@/utils/priceUtils'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

// Créer un logger sécurisé qui fonctionne même si withContext n'est pas disponible
const paymentLogger = logger.withContext ? 
  logger.withContext('ServicePayment') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[ServicePayment]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[ServicePayment]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[ServicePayment]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[ServicePayment]', msg, ...args)
  };

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ServicePaymentContent />
    </Suspense>
  )
}

// Composant de chargement amélioré
function LoadingScreen() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-16 h-16 mb-4 relative">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-white"></div>
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-1">Préparation du paiement</h3>
      <p className="text-gray-500 text-sm text-center">Nous préparons votre commande, merci de patienter...</p>
    </div>
  )
}

function ServicePaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quoteId')
  
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState(0)
  
  useEffect(() => {
    const fetchServiceDetails = async () => {
    try {
      setLoading(true)
        paymentLogger.info('Récupération des données du service');
      
      if (!quoteId) {
          throw new Error('ID de service manquant')
      }
      
        // Simuler la récupération des données pour la démonstration
        // En production, remplacer par un appel API réel
        setTimeout(() => {
          // Données fictives pour la démonstration
          const mockService: Service = {
            id: quoteId,
            bookingId: 'booking-' + quoteId,
            name: 'Service de consultation',
            description: 'Service de consultation à domicile par un expert',
            price: 150,
            categoryId: 'cat-1',
            duration: 2,
            workers: 1,
            includes: ['Consultation', 'Évaluation', 'Rapport'],
            scheduledDate: new Date(),
            scheduledTime: '14:00',
            location: '123 Rue Principale, Paris',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          paymentLogger.debug('Données du service récupérées', { 
            id: mockService.id,
            name: mockService.name 
          });
          
          setService(mockService)
          
          // Calculer l'acompte (30% du prix)
          const deposit = Math.ceil(mockService.price * 0.3)
      setDepositAmount(deposit)
      
          setLoading(false)
        }, 1000)
      
    } catch (error) {
        paymentLogger.error('Erreur lors de la récupération du service', error as Error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

    fetchServiceDetails()
  }, [quoteId])
  
  // Gestionnaire de succès pour le paiement
  const handlePaymentSuccess = (paymentIntentId: string) => {
    paymentLogger.info('Paiement réussi pour le service', { paymentIntentId });
    router.push(`/services/success?id=${quoteId}&payment_intent=${paymentIntentId}`)
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-red-800 font-medium text-lg mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Une erreur est survenue
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/services')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
              Retour aux services
          </button>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-yellow-800 font-medium text-lg mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Service non trouvé
          </h2>
          <p className="text-yellow-700 mb-4">Nous n'avons pas pu trouver le service demandé.</p>
          <button 
            onClick={() => router.push('/services')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
              Retour aux services
          </button>
        </div>
      </div>
    )
  }

  // Récapitulatif de la commande pour le paiement amélioré
  const OrderSummary = () => {
    const total = service.price
    const deposit = depositAmount

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 text-lg mb-3 pb-2 border-b border-gray-100">{service.name}</h3>
        <p className="text-gray-600 mb-4">{service.description}</p>
        
        <div className="space-y-3 mb-5">
          <div className="flex items-center text-gray-700">
            <CalendarIcon className="h-5 w-5 text-emerald-500 mr-3" />
            <span>{dateUtils.format(service.scheduledDate.toString(), 'long')}</span>
          </div>
          
          {service.scheduledTime && (
            <div className="flex items-center text-gray-700">
              <ClockIcon className="h-5 w-5 text-emerald-500 mr-3" />
              <span>{service.scheduledTime}</span>
            </div>
          )}
                  
          {service.location && (
            <div className="flex items-start text-gray-700">
              <MapPinIcon className="h-5 w-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>{service.location}</span>
            </div>
          )}
                  
          <div className="flex items-center text-gray-700">
            <UserGroupIcon className="h-5 w-5 text-emerald-500 mr-3" />
            <span>{service.workers} professionnel(s) • {service.duration}h</span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Prix total</span>
            <span className="font-medium">{priceUtils.format(total)}</span>
          </div>
                
          <div className="flex justify-between text-sm py-2 border-t border-dashed border-gray-200 mt-2">
            <span className="text-gray-600">Acompte (30%)</span>
            <span className="font-medium text-emerald-600">{priceUtils.format(deposit)}</span>
          </div>
                
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Solde restant</span>
            <span>{priceUtils.format(total - deposit)}</span>
          </div>
        </div>
            
        <div className="mt-4 text-xs text-gray-500 flex items-start">
          <LockClosedIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0 mt-0.5" />
          <span>Les informations de paiement sont sécurisées et chiffrées</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalisation de votre commande</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Vous êtes à quelques instants de confirmer votre réservation de service</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-7/12 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-gray-100 flex items-center">
                <LockClosedIcon className="h-5 w-5 mr-2 text-emerald-500" />
                Paiement sécurisé
              </h2>
              
              <PaymentProcessor 
                paymentData={{
                  id: quoteId || 'SERVICE-' + Date.now(),
                  amount: depositAmount,
                  description: `Acompte pour ${service.name}`,
                  onSuccess: handlePaymentSuccess
                }}
                serviceName={service.name}
                orderSummary={<OrderSummary />}
                backUrl="/services"
              />
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                    <span>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center">
                    <LockClosedIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                    <span>Données chiffrées</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                    <span>Service garanti</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
              
          <div className="lg:w-5/12 lg:order-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-emerald-600 text-white px-6 py-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Résumé de votre commande
                </h2>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Détails du service</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <p>
                        <span className="font-medium text-gray-700">Service :</span>{' '}
                        <span className="text-gray-800">{service.name}</span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Date :</span>{' '}
                        <span className="text-gray-800">{dateUtils.format(service.scheduledDate.toString(), 'long')}</span>
                      </p>
                      {service.scheduledTime && (
                        <p>
                          <span className="font-medium text-gray-700">Heure :</span>{' '}
                          <span className="text-gray-800">{service.scheduledTime}</span>
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-gray-700">Prix total :</span>{' '}
                        <span className="text-gray-800">{priceUtils.format(service.price)}</span>
                      </p>
                      <p>
                        <span className="font-medium text-emerald-600">Acompte à payer maintenant :</span>{' '}
                        <span className="font-medium text-emerald-600">{priceUtils.format(depositAmount)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Informations importantes</h3>
                  <div className="prose prose-sm text-gray-600">
                    <p>Vous allez effectuer le paiement d'un acompte de 30% du montant total. Le solde sera réglé le jour du service.</p>
                    <p className="mt-2">Une confirmation par email vous sera envoyée dès réception de votre paiement.</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mode test
                  </h3>
                  <p className="text-blue-700 text-sm mb-2">Utilisez la carte de test suivante :</p>
                  <div className="bg-white rounded p-2 font-mono text-sm mb-2 text-center">4242 4242 4242 4242</div>
                  <p className="text-xs text-blue-600">Date future quelconque, CVC: 3 chiffres quelconques</p>
                </div>
                
                {/* Bouton pour aller directement à la page de succès (mode test uniquement) */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Mode démonstration
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Accédez directement à la page de succès sans paiement</p>
                  <button 
                    onClick={() => router.push(`/services/success?id=${quoteId}&payment_intent=pi_demo_${Date.now()}`)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Simuler un paiement réussi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 