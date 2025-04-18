'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Service } from '@/types/booking'
import { CheckBadgeIcon, ArrowLeftIcon, MapPinIcon, UserGroupIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getCurrentBooking } from '@/actions/bookingManager'

export default function ServiceSummaryPage() {
  const router = useRouter()
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [itemDetails, setItemDetails] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null)
  const [totalPriceHT, setTotalPriceHT] = useState(0)
  const [totalPriceTTC, setTotalPriceTTC] = useState(0)
  const [extraCosts, setExtraCosts] = useState({
    workersCost: 0,
    durationCost: 0
  })
  const [hasInsurance, setHasInsurance] = useState(false)
  
  // Récupérer les données de la réservation au chargement
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer la réservation en cours via l'API
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/bookings/current?t=${timestamp}`, {
          method: 'GET',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
        
        if (!response.ok) {
          console.error('Erreur lors de la récupération de la réservation:', response.status)
          router.push('/services')
          return
        }
        
        const bookingData = await response.json()
        
        if (!bookingData || !bookingData.details) {
          console.error('Réservation invalide ou sans détails')
          router.push('/services')
          return
        }
        
        console.log('Données de réservation récupérées:', bookingData)
        
        // Déterminer si c'est un service ou un pack et extraire les détails
        const serviceDetails = bookingData.details
        
        if (!serviceDetails) {
          console.error('Aucun détail de service trouvé dans la réservation')
          router.push('/services')
          return
        }
        
        setBookingDetails(serviceDetails)
        setItemDetails(serviceDetails)
        
        // Mise à jour avec les totaux de la réservation
        setTotalPriceHT(bookingData.totalAmount || 0)
        setTotalPriceTTC((bookingData.totalAmount || 0) * 1.2) // Estimation TTC (20% TVA)
        setHasInsurance(bookingData.hasInsurance || false)
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        router.push('/services')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBookingData()
  }, [router])
  
  const handleEditBooking = () => {
    // Retourner à la page du service pour modifications
    if (itemDetails) {
      router.push(`/services/${itemDetails.id}`)
    }
  }
  
  const handleInsuranceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    setHasInsurance(isChecked)
    
    // Mettre à jour le prix total avec ou sans assurance
    setSaveStatus('saving')
    
    try {
      // Récupérer l'ID de la réservation actuelle
      const currentResponse = await fetch('/api/bookings/current')
      if (!currentResponse.ok) {
        throw new Error('Impossible de récupérer la réservation en cours')
      }
      
      const currentBookingData = await currentResponse.json()
      const bookingId = currentBookingData.id
      
      if (!bookingId) {
        throw new Error('ID de réservation non trouvé')
      }
      
      // Mise à jour de l'option d'assurance via l'API
      const updateResponse = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasInsurance: isChecked
        })
      })
      
      if (!updateResponse.ok) {
        throw new Error('Échec de la mise à jour de l\'assurance')
      }
      
      const updatedBooking = await updateResponse.json()
      
      // Mettre à jour les prix avec les nouvelles valeurs
      setTotalPriceHT(updatedBooking.totalAmount || 0)
      setTotalPriceTTC((updatedBooking.totalAmount || 0) * 1.2) // Estimation TTC (20% TVA)
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'assurance:', error)
      setSaveStatus('error')
      // Réinitialiser l'état du checkbox
      setHasInsurance(!isChecked)
    }
  }
  
  const handleContinue = async () => {
    // Rediriger vers la page de paiement
    try {
      // Ajouter un état de chargement
      setSaveStatus('saving')
      
      // Récupérer l'ID de la réservation actuelle
      const currentResponse = await fetch('/api/bookings/current')
      if (!currentResponse.ok) {
        throw new Error('Impossible de récupérer la réservation en cours')
      }
      
      const currentBookingData = await currentResponse.json()
      const bookingId = currentBookingData.id
      
      if (!bookingId) {
        throw new Error('ID de réservation non trouvé')
      }
      
      // Mettre à jour le statut de la réservation pour la finaliser
      const finalizeResponse = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'AWAITING_PAYMENT'
        })
      })
      
      if (!finalizeResponse.ok) {
        throw new Error('Échec de la finalisation de la réservation')
      }
      
      // Laisser un court délai pour s'assurer que les mises à jour sont propagées
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Rediriger vers la page de paiement
      window.location.href = '/services/payment'
      
    } catch (error) {
      console.error('Erreur lors de la finalisation de la réservation:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 2000)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
  
  if (!bookingDetails || !itemDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Aucune réservation en cours</h1>
            <p className="text-gray-600 mb-6">Vous n'avez pas de service sélectionné ou vos données ont expiré.</p>
            <Link
              href="/services"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Voir les services disponibles
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  const isPack = false
  const firstItem = { itemId: itemDetails.id }
  const insuranceConstants = { INSURANCE_PRICE_HT: 30, INSURANCE_PRICE_TTC: 36 }
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/services/${itemDetails.id}`} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Retour</span>
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Récapitulatif de votre commande</h1>
          
          {saveStatus === 'saving' && (
            <div className="text-gray-500 text-sm flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="mr-2">Enregistrement</span>
              <div className="animate-spin h-4 w-4 border-2 border-t-emerald-500 border-emerald-200 rounded-full"></div>
            </div>
          )}
          
          {saveStatus === 'saved' && (
            <div className="text-emerald-700 text-sm flex items-center bg-emerald-50 px-3 py-1 rounded-full">
              <CheckBadgeIcon className="h-4 w-4 mr-1" />
              <span>Modifications enregistrées</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="text-red-700 text-sm flex items-center bg-red-50 px-3 py-1 rounded-full">
              <span>Erreur</span>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Votre service */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">1</div>
                <h2 className="text-base font-medium text-gray-900">Votre service</h2>
                <button
                  onClick={handleEditBooking}
                  className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  <span>Modifier</span>
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row mb-4">
                <div className="sm:ml-6 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{itemDetails.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{itemDetails.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                      <span>
                        {bookingDetails.workers} professionnel{bookingDetails.workers > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                      <span>
                        {bookingDetails.duration} heure{bookingDetails.duration > 1 ? 's' : ''}
                      </span>
                    </div>
                    {bookingDetails.scheduledDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                        <span>
                          {format(new Date(bookingDetails.scheduledDate), 'd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Lieu d'intervention :</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-1.5 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">{bookingDetails.location}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {bookingDetails.additionalInfo && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Informations supplémentaires :</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{bookingDetails.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Options supplémentaires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">2</div>
                <h2 className="text-base font-medium text-gray-900">Options supplémentaires</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    id="insurance"
                    name="insurance"
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={handleInsuranceChange}
                    className="h-4 w-4 mt-1 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <label htmlFor="insurance" className="text-sm font-medium text-gray-900">
                      Assurance complémentaire
                    </label>
                    <p className="text-sm text-gray-500">
                      Protection étendue pour vos biens durant la prestation.
                      <span className="block text-emerald-600 font-medium mt-0.5">
                        +{insuranceConstants.INSURANCE_PRICE_HT}€ HT ({insuranceConstants.INSURANCE_PRICE_TTC}€ TTC)
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex pt-3 pb-2">
                  <svg className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <p>Notre assurance de base couvre les prestations standard. L'assurance complémentaire offre une couverture étendue pour vos biens de valeur.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Récapitulatif des coûts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-sky-50">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 mr-3">3</div>
                <h2 className="text-base font-medium text-gray-900">Récapitulatif des coûts</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-medium text-gray-900">Prix total</span>
                    <span className="block text-sm text-gray-500">TVA incluse</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-emerald-700">{totalPriceTTC.toFixed(2)}€ TTC</span>
                    <span className="block text-sm text-gray-600">soit {totalPriceHT}€ HT</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{itemDetails.name}</span>
                  <span className="text-sm font-medium">{itemDetails.price}€</span>
                </div>
                
                {extraCosts.workersCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Professionnels supplémentaires</span>
                    <span className="font-medium">+{extraCosts.workersCost}€</span>
                  </div>
                )}
                
                {extraCosts.durationCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Heures supplémentaires</span>
                    <span className="font-medium">+{extraCosts.durationCost}€</span>
                  </div>
                )}
                
                {hasInsurance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assurance complémentaire</span>
                    <span className="font-medium">+{insuranceConstants.INSURANCE_PRICE_HT}€</span>
                  </div>
                )}
                
                <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-900">Sous-total HT</span>
                  <span className="font-medium">{totalPriceHT}€</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA (20%)</span>
                  <span className="text-gray-600">{(totalPriceHT * 0.2).toFixed(2)}€</span>
                </div>
                
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-900">Total TTC</span>
                  <span className="font-bold text-emerald-600">{totalPriceTTC.toFixed(2)}€</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mt-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Ce qui est inclus :</h3>
                <ul className="space-y-1.5">
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">
                      {itemDetails.name} avec {bookingDetails.workers} professionnel{bookingDetails.workers > 1 ? 's' : ''}
                    </span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">
                      {bookingDetails.duration} heure{bookingDetails.duration > 1 ? 's' : ''} de prestation
                    </span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">Professionnels qualifiés et assurés</span>
                  </li>
                  <li className="flex items-start text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-700">Service client 7j/7</span>
                  </li>
                  {hasInsurance && (
                    <li className="flex items-start text-sm">
                      <CheckBadgeIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-blue-700">Assurance complémentaire</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Boutons de navigation */}
          <div className="flex items-center justify-between mt-6">
            <Link
              href={`/services/${firstItem.itemId}`}
              className="px-5 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg"
            >
              Retour
            </Link>
            
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Continuer vers le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 