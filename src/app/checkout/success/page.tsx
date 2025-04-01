'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  CheckCircleIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ReceiptPercentIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadOrderData = () => {
      try {
        const savedOrderData = localStorage.getItem('orderData')
        if (!savedOrderData) {
          // Rediriger si aucune commande n'est trouvée
          router.push('/')
          return
        }
        
        setOrderData(JSON.parse(savedOrderData))
      } catch (error) {
        console.error('Erreur lors du chargement des données de commande:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadOrderData()
    
    // Animation de confettis
    const animateConfetti = async () => {
      try {
        // Importation dynamique de la bibliothèque de confettis
        const { default: confetti } = await import('canvas-confetti')
        
        // Premier tir
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        
        // Deuxième tir après un délai
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          })
        }, 250)
        
        // Troisième tir
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          })
        }, 400)
      } catch (error) {
        console.error('Erreur lors de l\'animation de confettis:', error)
      }
    }
    
    animateConfetti()
  }, [router])
  
  const handleAddToCalendar = () => {
    if (!orderData || !orderData.scheduledDate) return
    
    const title = `Réservation ${orderData.type === 'PACK' ? 'Pack' : 'Service'} - ${orderData.orderNumber}`
    const startDate = new Date(orderData.scheduledDate)
    const endDate = new Date(startDate)
    
    // Ajuster la fin en fonction de la durée
    if (orderData.type === 'PACK') {
      // Pour un pack, ajouter la durée en jours
      endDate.setDate(endDate.getDate() + orderData.duration)
    } else {
      // Pour un service, ajouter la durée en heures
      endDate.setHours(endDate.getHours() + orderData.duration)
    }
    
    // Formatage des dates pour Google Calendar
    const formatForGCal = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '')
    }
    
    // Préparer le lien Google Calendar
    const details = `Réservation confirmée: ${orderData.orderNumber}\nMontant: ${orderData.totalAmount}€`
    const location = orderData.type === 'PACK' 
      ? `De: ${orderData.pickupAddress || 'N/A'} à: ${orderData.deliveryAddress || 'N/A'}`
      : orderData.location || 'N/A'
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatForGCal(startDate)}/${formatForGCal(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
    
    // Ouvrir dans un nouvel onglet
    window.open(calendarUrl, '_blank')
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
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Réservation confirmée !</h1>
          <p className="text-gray-600">
            Merci pour votre commande. Votre réservation a été enregistrée avec succès.
          </p>
        </div>
        
        {/* Carte principale avec les détails de la commande */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
                <p className="text-lg font-bold text-gray-900">{orderData.orderNumber}</p>
              </div>
              <div className="bg-emerald-100 px-3 py-1 rounded-full flex items-center">
                <CheckBadgeIcon className="h-4 w-4 text-emerald-700 mr-1" />
                <span className="text-xs font-medium text-emerald-700">Confirmée</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Détails de la réservation</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 text-emerald-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Date prévue</p>
                  <p className="text-sm text-gray-500">
                    {orderData.scheduledDate ? 
                      format(new Date(orderData.scheduledDate), 'EEEE d MMMM yyyy', { locale: fr }) : 
                      'Non spécifiée'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-5 w-5 text-emerald-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Équipe</p>
                  <p className="text-sm text-gray-500">
                    {orderData.workers} travailleur{orderData.workers > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start sm:col-span-2">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-5 w-5 text-emerald-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {isPack ? 'Adresses' : 'Lieu d\'intervention'}
                  </p>
                  {isPack ? (
                    <div>
                      <p className="text-sm text-gray-500">
                        De: {orderData.pickupAddress || 'Non spécifiée'}
                      </p>
                      <p className="text-sm text-gray-500">
                        À: {orderData.deliveryAddress || 'Non spécifiée'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {orderData.location || 'Non spécifié'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Client</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-5 w-5 text-emerald-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-500">{orderData.customer?.email || 'Non spécifié'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-5 w-5 text-emerald-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Téléphone</p>
                  <p className="text-sm text-gray-500">{orderData.customer?.phone || 'Non spécifié'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif du paiement</h2>
            
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {isPack ? 'Pack' : 'Service'} {orderData.itemDetails?.name || ''}
                </span>
                <span className="text-sm font-medium">{orderData.totalAmount}€</span>
              </div>
              
              <div className="flex justify-between font-medium">
                <span>Total payé</span>
                <span className="text-emerald-600">{orderData.totalAmount}€</span>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ReceiptPercentIcon className="h-5 w-5 text-emerald-500 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Paiement</p>
                <p className="text-sm text-gray-500">
                  Effectué via {orderData.payment?.method === 'card' ? 'carte bancaire' : 
                                orderData.payment?.method === 'paypal' ? 'PayPal' : 
                                'virement bancaire'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Date: {orderData.payment?.timestamp ? 
                    format(new Date(orderData.payment.timestamp), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 
                    'Non spécifiée'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Prochaines étapes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Prochaines étapes</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-100 rounded-full p-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">1</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Confirmation par email</p>
                  <p className="text-sm text-gray-500">
                    Vous allez recevoir un email de confirmation avec tous les détails de votre réservation et votre facture en pièce jointe.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-100 rounded-full p-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">2</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Préparation de votre {isPack ? 'pack' : 'service'}</p>
                  <p className="text-sm text-gray-500">
                    Notre équipe va planifier votre intervention et vous contacter pour confirmer les détails.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-100 rounded-full p-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">3</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Jour J</p>
                  <p className="text-sm text-gray-500">
                    Nos professionnels viendront à l'adresse indiquée à la date convenue pour réaliser la prestation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            onClick={handleAddToCalendar}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <CalendarIcon className="h-5 w-5 mr-2 text-emerald-500" />
            Ajouter à mon calendrier
          </button>
          
          <button
            onClick={() => {
              // Simuler le téléchargement d'une facture
              alert('La facture a été téléchargée (simulation).')
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2 text-emerald-500" />
            Télécharger la facture
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            Retour à l'accueil
          </Link>
        </div>
        
        {/* Assistance */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Besoin d'aide avec votre réservation ?</p>
          <p className="text-sm font-medium">
            <a href="tel:+33123456789" className="text-emerald-600 hover:text-emerald-500">
              +33 1 23 45 67 89
            </a>
            {' '}ou{' '}
            <a href="mailto:support@express-quote.com" className="text-emerald-600 hover:text-emerald-500">
              support@express-quote.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 