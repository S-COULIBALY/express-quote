'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  CheckCircleIcon, 
  CalendarIcon, 
  ClockIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  HomeIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  UserIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ArrowDownTrayIcon as ArrowDownTrayIconSolid,
} from '@heroicons/react/24/solid'
import { logger } from '@/lib/logger'

// Créer un logger sécurisé qui fonctionne même si withContext n'est pas disponible
const paymentLogger = logger.withContext ? 
  logger.withContext('PaymentSuccess') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[PaymentSuccess]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[PaymentSuccess]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[PaymentSuccess]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[PaymentSuccess]', msg, ...args)
  };

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
  const quoteId = searchParams.get('id')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const fetchBooking = async () => {
    try {
      setLoading(true)
      
      // Récupérer l'ID de l'intention de paiement depuis l'URL
      if (!paymentIntentId) {
        paymentLogger.error('Aucun identifiant de paiement trouvé dans l\'URL');
        throw new Error('Aucun identifiant de paiement trouvé dans l\'URL')
      }
      
      paymentLogger.info(`Vérification du paiement avec ID: ${paymentIntentId}`);

      // Vérifier l'état du paiement via l'API
      try {
        const statusResponse = await fetch(`/api/payment/verify/${paymentIntentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          paymentLogger.error('Erreur de l\'API de vérification', {
            status: statusResponse.status,
            error: errorData.error || 'Erreur inconnue'
          });
          throw new Error('Échec de la vérification du paiement')
        }
        
        const paymentData = await statusResponse.json();
        
        if (paymentData.status !== 'succeeded' && paymentData.status !== 'processing') {
          paymentLogger.warn(`Paiement non réussi: ${paymentData.status}`, paymentData);
          throw new Error(`Paiement non réussi: ${paymentData.status || 'statut inconnu'}`)
        }
        
        paymentLogger.info('Paiement vérifié avec succès', { 
          bookingId: paymentData.bookingId,
          amount: paymentData.amount 
        });
        
        if (paymentData.bookingId) {
          // Récupérer les détails de la réservation avec l'ID extrait
          const bookingResponse = await fetch(`/api/quotes/${paymentData.bookingId}`)
          
          if (!bookingResponse.ok) {
            paymentLogger.warn('Paiement vérifié mais impossible de récupérer les détails de la réservation', {
              status: bookingResponse.status
            });
            
            // Créer un objet booking minimal si on ne peut pas récupérer les détails complets
            setBooking({
              id: paymentData.bookingId,
              amount: paymentData.amount,
              currency: paymentData.currency || 'EUR',
              status: 'confirmed',
              paymentStatus: 'paid',
              createdAt: new Date().toISOString(),
              serviceName: 'Service',
              minimal: true // Indiquer que c'est un objet minimal
            })
          } else {
            const bookingData = await bookingResponse.json()
            setBooking({
              ...bookingData,
              amount: paymentData.amount,
              paymentStatus: 'paid'
            })
            
            paymentLogger.info('Détails de la réservation récupérés avec succès');
          }
        } else {
          // Aucun ID de réservation trouvé dans le résultat
          paymentLogger.warn('Aucun ID de réservation trouvé dans le résultat du paiement');
          
          // Créer un objet booking minimal
          setBooking({
            id: paymentIntentId,
            amount: paymentData.amount,
            currency: paymentData.currency || 'EUR',
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: new Date().toISOString(),
            serviceName: 'Service',
            minimal: true
          })
        }
      } catch (error) {
        paymentLogger.error('Erreur lors de la vérification du paiement', error as Error);
        throw error;
      }
    } catch (error) {
      paymentLogger.error('Erreur lors de la récupération de la réservation', error as Error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
  
  // Nouveau useEffect pour envoyer l'email de confirmation une fois les données chargées
  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (booking && !error && !loading) {
        try {
          // Vérifier si nous avons un email pour le client
          const clientEmail = booking.customer?.email || booking.email;
          if (!clientEmail) {
            paymentLogger.warn('Impossible d\'envoyer l\'email de confirmation: email du client manquant');
            return;
          }

          const clientName = booking.customer 
            ? `${booking.customer.firstName} ${booking.customer.lastName}` 
            : booking.firstName && booking.lastName
              ? `${booking.firstName} ${booking.lastName}`
              : 'Client';

          // Préparer les données pour l'envoi de l'email
          const emailData = {
            type: 'paymentConfirmation',
            email: clientEmail,
            clientName: clientName,
            bookingId: booking.id,
            quoteId: booking.quoteId,
            paymentDetails: {
              transactionId: paymentIntentId || '',
              depositAmount: booking.depositAmount || 0
            },
            serviceDate: booking.scheduledDate ? new Date(booking.scheduledDate).toISOString() : undefined,
            serviceAddress: booking.location
          };

          // Appeler l'API d'envoi d'email
          paymentLogger.info(`Envoi de l'email de confirmation à ${clientEmail}`);
          const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Échec de l\'envoi de l\'email');
          }

          setEmailSent(true);
          paymentLogger.info(`Email de confirmation envoyé avec succès à ${clientEmail}`);
        } catch (error) {
          paymentLogger.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
          // Ne pas bloquer l'interface utilisateur en cas d'erreur d'envoi d'email
        }
      }
    };

    // Appeler la fonction d'envoi d'email une seule fois lorsque les données sont disponibles
    if (booking && !emailSent) {
      sendConfirmationEmail();
    }
  }, [booking, error, loading, emailSent, paymentIntentId]);
  
  // Fonction pour télécharger le devis mis à jour avec l'acompte payé
  const handleDownloadInvoice = async () => {
    try {
      setDownloadLoading(true)
      paymentLogger.info('Tentative de téléchargement du devis', { quoteId: booking?.id });
      
      // L'ID du devis peut être soit dans l'URL, soit dans les données de réservation
      const invoiceId = quoteId || booking?.id;
      
      if (!invoiceId) {
        throw new Error('Identifiant du devis manquant');
      }
      
      // Appel à l'API pour générer et télécharger le PDF du devis
      const response = await fetch(`/api/quotes/${invoiceId}/download?payment_intent=${paymentIntentId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec du téléchargement du devis');
      }
      
      // Récupérer le blob du PDF
      const blob = await response.blob();
      
      // Créer un lien de téléchargement temporaire
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `devis-${invoiceId}-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadSuccess(true);
      paymentLogger.info('Téléchargement du devis réussi');
      
      // Réinitialiser après 3 secondes
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      paymentLogger.error('Erreur lors du téléchargement du devis', error as Error);
      alert('Erreur lors du téléchargement : ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setDownloadLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBooking()
  }, [paymentIntentId])
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
        <div className="w-16 h-16 mb-4 relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white"></div>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">Chargement de votre confirmation</h3>
        <p className="text-gray-500 text-sm text-center">Nous récupérons les détails de votre réservation...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 mb-2">Une erreur est survenue</h1>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center">
            <Link href="/services" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Retour aux services
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Étapes de progression */}
        <div className="hidden sm:block mb-12">
          <div className="flex justify-between items-center">
            <div className="w-1/3 flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center mb-2">
                <CheckCircleIconSolid className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-emerald-800">Devis accepté</span>
            </div>
            <div className="w-1/3 flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center mb-2">
                <CheckCircleIconSolid className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-emerald-800">Acompte payé</span>
            </div>
            <div className="w-1/3 flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <ClockIcon className="h-6 w-6 text-gray-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">Service en attente</span>
            </div>
            
            {/* Lignes de connexion */}
            <div className="absolute left-0 right-0 flex justify-center" style={{ zIndex: -1 }}>
              <div className="w-2/3 h-0.5 bg-emerald-500"></div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircleIconSolid className="h-16 w-16 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Paiement effectué avec succès !</h1>
          <p className="text-xl text-center text-gray-600 mt-2 max-w-2xl">
            Merci pour votre confiance. Votre réservation est confirmée et votre service est désormais en attente d'exécution.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Carte principale avec le récapitulatif */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2" />
                Confirmation de réservation
              </h2>
            </div>
            
            <div className="p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">{booking?.serviceName || booking?.service?.name || 'Service réservé'}</h3>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
                    Confirmé
                  </span>
                </div>
                <p className="text-gray-700">{booking?.description}</p>
              </div>
              
              {!booking?.minimal && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {booking?.scheduledDate && (
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-emerald-500 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium">
                          {new Date(booking.scheduledDate).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {booking?.scheduledTime && (
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-emerald-500 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Heure</p>
                        <p className="font-medium">{booking.scheduledTime}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking?.location && (
                    <div className="flex items-start bg-gray-50 p-3 rounded-lg">
                      <MapPinIcon className="h-5 w-5 text-emerald-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Adresse</p>
                        <p className="font-medium">{booking.location}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking?.customer && (
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                      <UserIcon className="h-5 w-5 text-emerald-500 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <p className="font-medium">{booking.customer.firstName} {booking.customer.lastName}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Détails du paiement</h3>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Payé
                  </span>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <CreditCardIcon className="h-5 w-5 text-emerald-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Méthode de paiement</p>
                      <p className="font-medium">Carte bancaire</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Acompte payé</p>
                      <p className="font-semibold text-emerald-600 text-lg">
                        {booking?.amount || 0} {booking?.currency || 'EUR'}
                      </p>
                    </div>
                    
                    {booking?.totalAmount && booking.totalAmount > booking.amount && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Solde à régler le jour du service</p>
                        <p className="font-medium text-gray-900 text-lg">
                          {(booking.totalAmount - booking.amount).toFixed(2)} €
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-start">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Transaction sécurisée</p>
                        <p className="text-sm text-blue-600">ID: {paymentIntentId ? paymentIntentId.substring(0, 10) + '...' : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Carte latérale avec les actions */}
          <div className="md:col-span-1 space-y-6">
            {/* Téléchargement du devis */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Documents
                </h3>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Télécharger votre devis</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Téléchargez votre devis mis à jour avec l'acompte déjà payé.
                  </p>
                  
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={downloadLoading}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                      downloadSuccess 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {downloadLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Préparation...
                      </>
                    ) : downloadSuccess ? (
                      <>
                        <CheckCircleIconSolid className="h-5 w-5 mr-2" />
                        Téléchargé
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIconSolid className="h-5 w-5 mr-2" />
                        Télécharger le devis
                      </>
                    )}
                  </button>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Besoin d'aide ?</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Un problème avec votre réservation ou une question ?
                  </p>
                  <Link
                    href="/contact"
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Nous contacter
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Prochaines étapes */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Et maintenant ?</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold mr-2 mt-0.5">1</div>
                    <p className="text-sm text-gray-700">
                      Vous recevrez un email de confirmation avec tous les détails.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold mr-2 mt-0.5">2</div>
                    <p className="text-sm text-gray-700">
                      Un professionnel vous contactera avant la date prévue.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold mr-2 mt-0.5">3</div>
                    <p className="text-sm text-gray-700">
                      Le jour du service, vous réglerez le solde restant.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10 flex justify-center space-x-12">
          <Link 
            href="/services" 
            className="flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Retour à l'accueil
          </Link>
          
          <Link 
            href="/account/bookings" 
            className="flex items-center px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-lg shadow border border-gray-200 transition-colors"
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Mes réservations
          </Link>
        </div>

        {/* Ajout des boutons d'action */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>
          
          {booking?.id && (
            <a
              href={`/api/quotes/${booking.id}/download?type=invoice&payment_intent=${paymentIntentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Télécharger la facture</span>
            </a>
          )}
        </div>
        
        {/* Message de confirmation d'envoi d'email */}
        {emailSent && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Une confirmation a été envoyée à votre adresse email
          </div>
        )}
      </div>
    </div>
  )
} 