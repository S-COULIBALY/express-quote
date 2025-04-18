'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react'
import { CheckIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/Button'
import { 
  CheckCircleIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ReceiptPercentIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [calendarUrl, setCalendarUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  // Fonction pour générer l'URL du calendrier
  const generateCalendarUrl = (data: any) => {
    if (!data || !data.scheduledDate) return ''
    
    const title = `Réservation ${data.type === 'PACK' ? 'Pack' : 'Service'} - ${data.orderNumber}`
    const startDate = new Date(data.scheduledDate)
    const endDate = new Date(startDate)
    
    // Ajuster la fin en fonction de la durée
    if (data.type === 'PACK') {
      // Pour un pack, ajouter la durée en jours
      endDate.setDate(endDate.getDate() + data.duration)
    } else {
      // Pour un service, ajouter la durée en heures
      endDate.setHours(endDate.getHours() + data.duration)
    }
    
    // Formatage des dates pour Google Calendar
    const formatForGCal = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '')
    }
    
    // Préparer le lien Google Calendar
    const details = `Réservation confirmée: ${data.orderNumber}\nMontant: ${data.totalAmount}€`
    const location = data.type === 'PACK' 
      ? `De: ${data.pickupAddress || 'N/A'} à: ${data.deliveryAddress || 'N/A'}`
      : data.location || 'N/A'
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatForGCal(startDate)}/${formatForGCal(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
  }
  
  // Récupérer les informations de la réservation via l'API
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setIsLoading(true)
        
        const response = await fetch('/api/bookings/current', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Aucune réservation trouvée")
            setIsLoading(false)
            return
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const apiBooking = await response.json()
        
        if (!apiBooking || !apiBooking.details || !apiBooking.details.items || apiBooking.details.items.length === 0) {
          setError("Aucune donnée de réservation valide trouvée")
          setIsLoading(false)
          return
        }
        
        // Récupérer le premier élément pour les détails
        const firstItem = apiBooking.details.items[0]
        const itemType = firstItem.type.toLowerCase()
        
        // Créer un objet avec toutes les données nécessaires en une seule fois
        const parsedData = {
          id: apiBooking.id,
          orderNumber: apiBooking.id.substring(0, 8),
          type: itemType,
          status: apiBooking.status,
          items: apiBooking.details.items,
          itemDetails: firstItem,
          customer: apiBooking.details.customer || apiBooking.customer || {},
          totalAmount: apiBooking.details.totalAmount || apiBooking.totalAmount || 0,
          createdAt: apiBooking.details.createdAt || apiBooking.createdAt || new Date().toISOString(),
          scheduledDate: apiBooking.details.scheduledDate || new Date().toISOString(),
          workers: (apiBooking.details && typeof apiBooking.details.workers !== 'undefined') 
            ? apiBooking.details.workers 
            : 2,
          duration: (apiBooking.details && typeof apiBooking.details.duration !== 'undefined') 
            ? apiBooking.details.duration 
            : 3,
          pickupAddress: (apiBooking.details && apiBooking.details.pickupAddress) || '',
          deliveryAddress: (apiBooking.details && apiBooking.details.deliveryAddress) || '',
          location: (apiBooking.details && apiBooking.details.location) || ''
        }
        
        // Mettre à jour l'état en une seule fois
        setOrderData(parsedData)
        
        // Générer l'URL du calendrier pour le QR code
        const url = generateCalendarUrl(parsedData)
        setCalendarUrl(url)
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error)
        setError(error instanceof Error ? error.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBookingData()
    
    // Animation de confettis
    const animateConfetti = async () => {
      try {
        // Importation dynamique de la bibliothèque de confettis
        const { default: confetti } = await import('canvas-confetti')
        
        // Premier tir
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
        })
        
        // Deuxième tir après un délai
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 70,
            origin: { x: 0 },
            colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
          })
        }, 250)
        
        // Troisième tir
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 70,
            origin: { x: 1 },
            colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
          })
        }, 400)
      } catch (error) {
        console.error('Erreur lors de l\'animation de confettis:', error)
      }
    }
    
    animateConfetti()
  }, [router])
  
  const handleAddToCalendar = () => {
    if (calendarUrl) {
      // Ouvrir dans un nouvel onglet
      window.open(calendarUrl, '_blank')
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
  
  if (!orderData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Aucune commande trouvée</h1>
          <p className="text-gray-600 mb-8">Nous n'avons pas pu trouver les détails de votre commande.</p>
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
  
  const isPack = orderData.type === 'PACK'
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-5 lg:px-6">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4 shadow-md">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Réservation confirmée !</h1>
          <p className="text-base text-gray-600">
            Merci pour votre commande. Un récapitulatif a été envoyé par email.
          </p>
          
          <div className="mt-3 bg-emerald-50 inline-block py-1 px-3 rounded-full">
            <p className="text-sm font-medium text-emerald-700">Commande #{orderData.orderNumber}</p>
          </div>
        </div>
        
        {/* Carte principale avec les détails de la commande */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-6 transition-all hover:shadow-lg">
          {/* Header avec statut et prix total */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
                  {isPack ? (
                    <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{isPack ? 'Pack' : 'Service'} {orderData.itemDetails?.name || ''}</h2>
                  <div className="flex items-center mt-0.5">
                    <CheckBadgeIcon className="h-4 w-4 text-emerald-600 mr-1" />
                    <span className="text-xs font-medium text-emerald-600">Commande validée</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                <p className="text-xs text-gray-500">Montant total</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-xl font-bold text-emerald-700">{orderData.totalAmount}€</span>
                  <span className="ml-1 text-xs text-emerald-600">HT</span>
                </div>
                <p className="text-xs text-emerald-600">soit {(orderData.totalAmount * 1.2).toFixed(2)}€ TTC</p>
              </div>
            </div>
          </div>
          
          {/* Date et équipe */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-emerald-100 p-1.5 rounded-full">
                    <CalendarIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-900">Date prévue</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {orderData.scheduledDate ? 
                        format(new Date(orderData.scheduledDate), 'EEEE d MMMM yyyy', { locale: fr }) : 
                        'Non spécifiée'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-emerald-100 p-1.5 rounded-full">
                    <UserGroupIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-900">Équipe</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {(orderData.workers || 2)} professionnel{(orderData.workers || 2) > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      Durée: {orderData.duration} {isPack ? 'jour' : 'heure'}{orderData.duration > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Adresses */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-emerald-100 p-1.5 rounded-full">
                <HomeIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="ml-3 w-full">
                <p className="text-xs font-medium text-gray-900 mb-2">
                  {isPack ? 'Adresses' : 'Lieu d\'intervention'}
                </p>
                {isPack ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-1">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">A</div>
                        <span className="ml-2 text-xs font-medium text-gray-700">Adresse de départ</span>
                      </div>
                      <p className="text-xs text-gray-800">{orderData.pickupAddress || 'Non spécifiée'}</p>
                      {orderData.pickupFloor !== undefined && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {orderData.pickupFloor === 0 ? 'RDC' : `${orderData.pickupFloor}ème étage`}
                          {orderData.pickupHasElevator ? ' • Avec ascenseur' : ' • Sans ascenseur'}
                          {orderData.pickupNeedsLift ? ' • Avec monte-meuble' : ''}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-1">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">B</div>
                        <span className="ml-2 text-xs font-medium text-gray-700">Adresse d'arrivée</span>
                      </div>
                      <p className="text-xs text-gray-800">{orderData.deliveryAddress || 'Non spécifiée'}</p>
                      {orderData.deliveryFloor !== undefined && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {orderData.deliveryFloor === 0 ? 'RDC' : `${orderData.deliveryFloor}ème étage`}
                          {orderData.deliveryHasElevator ? ' • Avec ascenseur' : ' • Sans ascenseur'}
                          {orderData.deliveryNeedsLift ? ' • Avec monte-meuble' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-800">{orderData.location || 'Non spécifié'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Informations client */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 bg-blue-100 p-1.5 rounded-full">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Informations client</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {orderData.customer?.firstName || ''} {orderData.customer?.lastName || ''}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="flex items-center bg-white p-2.5 rounded-lg border border-gray-200">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-2 text-xs text-gray-800">{orderData.customer?.email || 'Non spécifié'}</span>
              </div>
              
              <div className="flex items-center bg-white p-2.5 rounded-lg border border-gray-200">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-2 text-xs text-gray-800">{orderData.customer?.phone || 'Non spécifié'}</span>
              </div>
            </div>
          </div>
          
          {/* Récapitulatif du paiement */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Récapitulatif du paiement</h2>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">
                    {isPack ? 'Pack' : 'Service'} {orderData.itemDetails?.name || ''}
                  </span>
                  <span className="text-xs font-medium">{orderData.totalAmount}€ HT</span>
                </div>
                
                {orderData.liftCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">
                      Monte-meuble
                      {(orderData.pickupNeedsLift && orderData.deliveryNeedsLift) ? ' (départ et arrivée)' : 
                      orderData.pickupNeedsLift ? ' (départ)' : ' (arrivée)'}
                    </span>
                    <span className="text-xs font-medium text-red-600">
                      +{orderData.liftCost}€
                    </span>
                  </div>
                )}
                
                {orderData.hasInsurance && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">
                      Assurance complémentaire
                    </span>
                    <span className="text-xs font-medium text-red-600">
                      +12.50€
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between pt-1.5 border-t border-gray-100">
                  <span className="text-xs font-medium">Total HT</span>
                  <span className="text-xs font-medium">{orderData.totalAmount}€</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">TVA (20%)</span>
                  <span className="text-xs text-gray-500">{(orderData.totalAmount * 0.2).toFixed(2)}€</span>
                </div>
                
                <div className="flex justify-between pt-1.5 border-t border-gray-100">
                  <span className="text-xs font-medium">Total TTC</span>
                  <span className="text-sm font-bold text-emerald-600">{(orderData.totalAmount * 1.2).toFixed(2)}€</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 w-full">
                <ReceiptPercentIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">
                    Paiement effectué via {orderData.payment?.method === 'card' ? 'carte bancaire' : 
                                          orderData.payment?.method === 'paypal' ? 'PayPal' : 
                                          'virement bancaire'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Date: {orderData.payment?.timestamp ? 
                      format(new Date(orderData.payment.timestamp), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 
                      'Non spécifiée'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* QR Code et ajouter au calendrier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* QR Code */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 text-center p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Ajouter à votre calendrier</h3>
            <div className="bg-gray-50 inline-block p-2 rounded-lg border border-gray-200 mb-2 mx-auto flex flex-col items-center justify-center">
              {calendarUrl ? (
                <>
                  <p className="text-xs text-gray-600 mb-2">Scanner ce QR code</p>
                  <QRCodeSVG 
                    value={calendarUrl}
                    size={96}
                    bgColor="#f9fafb"
                    fgColor="#10b981"
                    level="M"
                    includeMargin={true}
                  />
                </>
              ) : (
                <div className="h-24 w-24 bg-gray-200 mx-auto rounded relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleAddToCalendar}
              disabled={!calendarUrl}
              className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white ${calendarUrl ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full`}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Ajouter au calendrier
            </button>
          </div>
          
          {/* Prochaines étapes */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Prochaines étapes</h3>
            
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-100 rounded-full p-0.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">1</span>
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">Confirmation par email</p>
                  <p className="text-xs text-gray-500">
                    Email de confirmation avec tous les détails.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-100 rounded-full p-0.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">2</span>
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">Préparation de votre {isPack ? 'pack' : 'service'}</p>
                  <p className="text-xs text-gray-500">
                    Notre équipe va planifier votre intervention.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-100 rounded-full p-0.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">3</span>
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">Jour J</p>
                  <p className="text-xs text-gray-500">
                    Intervention à la date convenue.
                  </p>
                </div>
              </div>
              
              {orderData.hasInsurance && (
                <div className="flex items-start pt-2 mt-1 border-t border-gray-100">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-0.5">
                    <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-blue-800">Protection supplémentaire active</p>
                    <p className="text-xs text-blue-600">
                      Votre réservation bénéficie d'une assurance complémentaire contre les dommages accidentels.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                // Simuler le téléchargement d'une facture
                alert('La facture a été téléchargée (simulation).')
              }}
              className="inline-flex items-center justify-center px-3 py-1.5 mt-3 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full"
            >
              <DocumentTextIcon className="h-4 w-4 mr-1 text-emerald-500" />
              Télécharger la facture
            </button>
          </div>
        </div>
        
        {/* Actions */}
        <div className="text-center mb-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Retour à l'accueil
          </Link>
        </div>
        
        {/* Assistance */}
        <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100 text-xs">
          <p className="text-blue-800 mb-1 font-medium">Besoin d'aide avec votre réservation ?</p>
          <div className="flex justify-center space-x-3">
            <a href="tel:+33123456789" className="inline-flex items-center text-blue-700 hover:text-blue-500">
              <PhoneIcon className="h-3 w-3 mr-1" />
              +33 1 23 45 67 89
            </a>
            <a href="mailto:support@express-quote.com" className="inline-flex items-center text-blue-700 hover:text-blue-500">
              <EnvelopeIcon className="h-3 w-3 mr-1" />
              support@express-quote.com
            </a>
          </div>
        </div>
        
        {/* Note légale discrète */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            En utilisant nos services, vous acceptez nos{' '}
            <Link href="/legal/terms" className="text-emerald-600 hover:underline">conditions générales</Link>,{' '}
            <Link href="/legal/privacy" className="text-emerald-600 hover:underline">politique de confidentialité</Link> et{' '}
            <Link href="/legal/cookies" className="text-emerald-600 hover:underline">politique des cookies</Link>.
          </p>
        </div>
      </div>
      
      {/* Styles spécifiques */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
} 