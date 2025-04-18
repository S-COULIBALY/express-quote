'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentBooking } from '@/actions/bookingManager'
import { 
  ExclamationCircleIcon, 
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function CheckoutErrorPage() {
  const router = useRouter()
  const [bookingData, setBookingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorReason, setErrorReason] = useState<string>('transaction_failed')
  
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        // Récupérer les données de réservation via getCurrentBooking
        const currentBooking = await getCurrentBooking();
        if (currentBooking) {
          setBookingData(currentBooking);
        }
        
        // Récupérer la raison de l'erreur depuis l'URL (simulé ici)
        const randomErrors = [
          'transaction_failed',
          'card_declined',
          'insufficient_funds',
          'connection_error',
          'technical_error'
        ]
        
        // Simuler une raison d'erreur aléatoire
        setErrorReason(randomErrors[Math.floor(Math.random() * randomErrors.length)])
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBookingData()
  }, [])
  
  const getErrorMessage = () => {
    switch (errorReason) {
      case 'card_declined':
        return 'Votre carte a été refusée par la banque. Veuillez vérifier vos informations ou utiliser un autre moyen de paiement.'
      case 'insufficient_funds':
        return 'Il semble que votre carte ne dispose pas de fonds suffisants pour cette transaction.'
      case 'connection_error':
        return 'Nous avons rencontré un problème de connexion lors du traitement de votre paiement. Veuillez réessayer.'
      case 'technical_error':
        return 'Une erreur technique est survenue lors du traitement de votre paiement. Notre équipe a été informée.'
      default:
        return 'Votre transaction n\'a pas pu être complétée pour une raison inconnue. Veuillez réessayer ou contacter notre service client.'
    }
  }
  
  const handleRetry = () => {
    router.push('/checkout/payment')
  }
  
  const handleSaveForLater = () => {
    // Informer l'utilisateur que sa réservation est sauvegardée (simulation)
    alert('Un lien pour reprendre votre réservation a été envoyé à votre adresse email (simulation).')
    
    // Rediriger vers l'accueil
    router.push('/')
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement non complété</h1>
          <p className="text-gray-600 mb-4">
            {getErrorMessage()}
          </p>
          <p className="text-sm text-gray-500">
            Votre carte n'a pas été débitée et votre réservation n'a pas été confirmée.
          </p>
        </div>
        
        {/* Carte principale avec les options */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Que souhaitez-vous faire ?</h2>
            
            <div className="space-y-4">
              <div 
                onClick={handleRetry}
                className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200"
              >
                <div className="flex-shrink-0 bg-emerald-100 p-2 rounded-full">
                  <ArrowPathIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Réessayer le paiement</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Retourner à la page de paiement pour essayer à nouveau ou utiliser un autre moyen de paiement.
                  </p>
                </div>
              </div>
              
              <div 
                onClick={handleSaveForLater}
                className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200"
              >
                <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                  <CreditCardIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Sauvegarder pour plus tard</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Nous vous enverrons un lien par email pour reprendre votre commande quand vous le souhaitez.
                  </p>
                </div>
              </div>
              
              <Link
                href="/"
                className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200"
              >
                <div className="flex-shrink-0 bg-gray-100 p-2 rounded-full">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Retour à l'accueil</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Abandonner la commande et revenir à la page d'accueil.
                  </p>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Besoin d'aide ?</h3>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Chat en direct</span> - 
                    Discutez avec un conseiller en ligne
                  </p>
                  <button className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-500">
                    Démarrer le chat
                  </button>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Service client</span> - 
                    Appelez-nous au
                  </p>
                  <a href="tel:+33123456789" className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-500">
                    +33 1 23 45 67 89
                  </a>
                  <p className="mt-1 text-xs text-gray-500">
                    Lun-Ven, 9h-18h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Questions fréquentes</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Ma carte a-t-elle été débitée ?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Non, votre carte n'est débitée qu'une fois la transaction entièrement finalisée. En cas d'erreur, aucun montant n'est prélevé.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900">Combien de temps ma réservation sera-t-elle sauvegardée ?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Votre panier est automatiquement sauvegardé pendant 24 heures. Vous pouvez également recevoir un lien par email pour y accéder plus tard.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900">Quels moyens de paiement acceptez-vous ?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Nous acceptons les cartes Visa, Mastercard, les paiements via PayPal et les virements bancaires.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message de réassurance */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Vos données sont en sécurité et votre panier est sauvegardé.
            <br />
            Vous pouvez reprendre votre réservation à tout moment dans les prochaines 24 heures.
          </p>
        </div>
      </div>
    </div>
  )
} 