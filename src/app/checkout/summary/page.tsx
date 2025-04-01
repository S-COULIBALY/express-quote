'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pack, Service } from '@/types/booking'
import { mockPacks, mockServices } from '@/data/mockData'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckBadgeIcon, 
  DocumentTextIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function CheckoutSummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [bookingData, setBookingData] = useState<any>(null)
  const [itemDetails, setItemDetails] = useState<Pack | Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null)
  
  // Récupérer les données du localStorage au chargement
  useEffect(() => {
    const loadBookingData = () => {
      try {
        // Récupérer l'ID et le type depuis l'URL ou le localStorage
        const type = searchParams.get('type') || localStorage.getItem('bookingType')
        const itemId = searchParams.get('id') || localStorage.getItem('bookingItemId')
        
        if (!type || !itemId) {
          console.error('Type ou ID manquant')
          return
        }
        
        // Récupérer les données sauvegardées
        const savedData = localStorage.getItem('bookingData')
        if (savedData) {
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
        } else {
          router.push(`/${type.toLowerCase()}s/${itemId}`)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBookingData()
    
    // Écouter les événements de stockage pour synchroniser les données entre les onglets
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bookingData' && e.newValue) {
        setBookingData(JSON.parse(e.newValue))
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [router, searchParams])
  
  // Sauvegarder automatiquement les données dans le localStorage
  useEffect(() => {
    if (bookingData) {
      try {
        setSaveStatus('saving')
        localStorage.setItem('bookingData', JSON.stringify(bookingData))
        localStorage.setItem('bookingType', bookingData.type)
        localStorage.setItem('bookingItemId', bookingData.itemId)
        localStorage.setItem('bookingTimestamp', Date.now().toString())
        
        const timer = setTimeout(() => {
          setSaveStatus('saved')
          
          // Réinitialiser le statut après quelques secondes
          setTimeout(() => {
            setSaveStatus(null)
          }, 2000)
        }, 500)
        
        return () => clearTimeout(timer)
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error)
        setSaveStatus('error')
      }
    }
  }, [bookingData])
  
  const handleContinue = () => {
    router.push('/checkout/payment')
  }
  
  const handleEditBooking = () => {
    const type = bookingData?.type.toLowerCase()
    const itemId = bookingData?.itemId
    if (type && itemId) {
      router.push(`/${type}s/${itemId}`)
    }
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
           saveStatus === 'saved' ? 'Panier sauvegardé' : 
           'Erreur de sauvegarde'}
        </div>
      )}
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Étapes de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Retour
            </button>
            
            <div className="hidden sm:flex items-center text-sm font-medium text-gray-500">
              <span className="text-emerald-600">1. Sélection</span>
              <span className="mx-2">→</span>
              <span className="text-emerald-600">2. Personnalisation</span>
              <span className="mx-2">→</span>
              <span className="text-emerald-600 font-bold">3. Récapitulatif</span>
              <span className="mx-2">→</span>
              <span className="text-gray-400">4. Paiement</span>
              <span className="mx-2">→</span>
              <span className="text-gray-400">5. Confirmation</span>
            </div>
            
            {/* Version mobile des étapes */}
            <div className="sm:hidden text-sm font-medium text-gray-500">
              Étape 3/5
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Récapitulatif de votre réservation</h1>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
          {/* En-tête avec les détails du service/pack */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{itemDetails.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{itemDetails.description}</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-100 to-sky-100 px-3 py-1.5 rounded-lg text-center">
                <p className="text-xs text-gray-600">Prix total</p>
                <p className="text-lg font-bold text-emerald-700">{bookingData.totalAmount}€</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Date */}
              <div className="flex items-start sm:w-1/2">
                <CalendarIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date prévue</p>
                  <p className="text-sm text-gray-600">
                    {bookingData.scheduledDate ? 
                      format(new Date(bookingData.scheduledDate), 'EEEE d MMMM yyyy', { locale: fr }) : 
                      'Non spécifiée'}
                  </p>
                </div>
              </div>
              
              {/* Adresse */}
              <div className="flex items-start sm:w-1/2">
                <MapPinIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isPack ? 'Adresses' : 'Lieu d\'intervention'}
                  </p>
                  {isPack ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        De: {bookingData.pickupAddress || 'Non spécifiée'}
                      </p>
                      <p className="text-sm text-gray-600">
                        À: {bookingData.deliveryAddress || 'Non spécifiée'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {bookingData.location || 'Non spécifié'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Détails de la personnalisation */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Détails de votre personnalisation</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Durée */}
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Durée</p>
                  <p className="text-sm text-gray-600">
                    {bookingData.duration} {isPack ? 'jour(s)' : 'heure(s)'}
                    {bookingData.duration !== (isPack ? 1 : itemDetails.duration) && (
                      <span className="ml-1 text-emerald-600">
                        {bookingData.duration > (isPack ? 1 : itemDetails.duration) ? '(augmentée)' : '(réduite)'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Nombre de travailleurs */}
              <div className="flex items-start">
                <UserGroupIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Équipe</p>
                  <p className="text-sm text-gray-600">
                    {bookingData.workers} travailleur{bookingData.workers > 1 ? 's' : ''}
                    {bookingData.workers !== (isPack ? 2 : 1) && (
                      <span className="ml-1 text-emerald-600">
                        {bookingData.workers > (isPack ? 2 : 1) ? '(augmentée)' : '(réduite)'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Informations supplémentaires */}
            {bookingData.additionalInfo && (
              <div className="mt-4">
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Informations supplémentaires</p>
                    <p className="text-sm text-gray-600">{bookingData.additionalInfo}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Détail du prix */}
          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Détail du prix</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Prix de base</span>
                <span className="font-medium">{itemDetails.price}€</span>
              </div>
              
              {bookingData.totalAmount !== itemDetails.price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Ajustements ({bookingData.duration} {isPack ? 'jour(s)' : 'heure(s)'}, {bookingData.workers} travailleur{bookingData.workers > 1 ? 's' : ''})
                  </span>
                  <span className={`font-medium ${bookingData.totalAmount > itemDetails.price ? 'text-red-600' : 'text-emerald-600'}`}>
                    {bookingData.totalAmount > itemDetails.price ? '+' : ''}{bookingData.totalAmount - itemDetails.price}€
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200 flex justify-between">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-bold text-emerald-600">{bookingData.totalAmount}€</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Garanties et assurances */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-6 w-6 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Garanties et protections</h3>
              <p className="text-sm text-gray-600 mt-1">
                Votre réservation est couverte par notre garantie satisfaction. Nos professionnels sont assurés et vérifiés.
              </p>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Ajouter une assurance complémentaire (+ 15€)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            onClick={handleEditBooking}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 order-2 sm:order-1"
          >
            Modifier ma réservation
          </button>
          
          <button
            onClick={handleContinue}
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto order-1 sm:order-2"
          >
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Procéder au paiement
          </button>
        </div>
        
        {/* Reprise du panier */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Votre panier est automatiquement sauvegardé.</p>
          <p>Vous pourrez reprendre votre réservation à tout moment pendant 24h.</p>
        </div>
      </div>
    </div>
  )
} 