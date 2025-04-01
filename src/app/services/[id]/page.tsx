'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Service } from '@/types/booking'
import { mockServices } from '@/data/mockData'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, MapPinIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

// Fonction pour calculer le prix en fonction des paramètres
function calculateServicePrice(basePrice: number, duration: number, workers: number, defaultDuration: number = 1, defaultWorkers: number = 1): number {
  // Si c'est la configuration par défaut
  if (duration === defaultDuration && workers === defaultWorkers) {
    return basePrice;
  }
  
  // Coût de base des travailleurs (pour les services, calculé en heures)
  const workerPricePerDay = 120;
  
  // Calculer le coût des travailleurs (la durée des services est en heures)
  const workerCost = workers * workerPricePerDay * (duration / 8);
  
  // Ajuster le prix de base en fonction du rapport durée/travailleurs
  const adjustedBasePrice = (basePrice * 0.4) + workerCost;
  
  return Math.round(adjustedBasePrice);
}

export default function ServiceFormPage({ params }: { params: { id: string } }) {
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    scheduledDate: '',
    location: '',
    duration: '1',
    workers: '1',
    additionalInfo: ''
  })
  const [locationDetails, setLocationDetails] = useState<google.maps.places.PlaceResult | null>(null)
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [defaultDuration, setDefaultDuration] = useState(1)
  const [defaultWorkers, setDefaultWorkers] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const fetchService = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        const foundService = mockServices.find(s => s.id === params.id)
        setService(foundService || null)
        if (foundService) {
          // Initialiser le prix calculé avec le prix de base du service
          setCalculatedPrice(foundService.price)
          
          // Initialiser les valeurs par défaut (simulées, dans un vrai cas ces valeurs viendraient de l'API)
          const defaultDur = foundService.duration || 1
          const defaultWork = foundService.workers || 1
          setDefaultDuration(defaultDur)
          setDefaultWorkers(defaultWork)
          setFormData(prev => ({
            ...prev,
            duration: String(defaultDur),
            workers: String(defaultWork)
          }))
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchService()
  }, [params.id])

  // Recalculer le prix quand la durée ou le nombre de travailleurs change
  useEffect(() => {
    if (service) {
      const duration = parseInt(formData.duration, 10)
      const workers = parseInt(formData.workers, 10)
      const newPrice = calculateServicePrice(service.price, duration, workers, defaultDuration, defaultWorkers)
      setCalculatedPrice(newPrice)
    }
  }, [formData.duration, formData.workers, service, defaultDuration, defaultWorkers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!formData.scheduledDate || !formData.location) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }
    
    // Création de l'objet de données à envoyer à l'API
    const bookingData = {
      type: 'SERVICE',
      itemId: service?.id,
      scheduledDate: formData.scheduledDate,
      location: formData.location,
      duration: parseInt(formData.duration, 10),
      workers: parseInt(formData.workers, 10),
      additionalInfo: formData.additionalInfo,
      price: service?.price || 0,
      totalAmount: calculatedPrice || service?.price || 0,
      defaultDuration,
      defaultWorkers,
      timestamp: Date.now()
    }
    
    try {
      // Sauvegarder les données dans le localStorage
      localStorage.setItem('bookingData', JSON.stringify(bookingData))
      localStorage.setItem('bookingType', 'SERVICE')
      localStorage.setItem('bookingItemId', service?.id || '')
      localStorage.setItem('bookingTimestamp', Date.now().toString())
      
      console.log('Données de réservation sauvegardées:', bookingData)
      console.log('Détails de la localisation:', locationDetails)
      
      // Rediriger vers la page de récapitulatif
      router.push('/checkout/summary')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error)
      alert('Une erreur est survenue lors de la sauvegarde de votre réservation. Veuillez réessayer.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-red-600">Service non trouvé</h1>
        <p className="mt-4">Le service que vous recherchez n'existe pas.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec les informations du service */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-4 transform transition-all hover:shadow-lg border border-[#067857]">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{service.name}</h1>
              <p className="text-sm text-gray-600">{service.description}</p>
            </div>
            <div className="relative">
              {/* Prix original barré si le prix calculé est différent */}
              {calculatedPrice !== service.price && (
                <p className="text-sm text-gray-400 line-through absolute -top-4 right-0">
                  {service.price}€
                </p>
              )}
              <div className="bg-emerald-50 px-3 py-1.5 rounded-xl">
                <p className="text-lg font-bold text-emerald-600">{calculatedPrice}€</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-[#067857] flex-1">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Détails de la réservation</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div className="relative">
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                  Date souhaitée
                </div>
              </label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                min={format(new Date(), 'yyyy-MM-dd')}
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                required
              />
            </div>

            {/* Lieu d'intervention */}
            <div className="relative">
              <AddressAutocomplete
                id="location"
                label={
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                    Lieu d'intervention
                  </div>
                }
                value={formData.location}
                onChange={(value, place) => {
                  setFormData({ ...formData, location: value })
                  setLocationDetails(place || null)
                }}
                required
                placeholder="Entrez l'adresse d'intervention"
              />
            </div>

            {/* Durée et Nombre de travailleurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                    Durée (en heures)
                  </div>
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                  required
                />
                {parseInt(formData.duration) !== defaultDuration && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {parseInt(formData.duration) > defaultDuration ? 
                      `+${parseInt(formData.duration) - defaultDuration}h supplémentaires` : 
                      `Durée réduite: ${formData.duration}h (standard: ${defaultDuration}h)`}
                  </p>
                )}
              </div>

              <div className="relative">
                <label htmlFor="workers" className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-emerald-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Nombre de travailleurs
                  </div>
                </label>
                <input
                  type="number"
                  id="workers"
                  name="workers"
                  min="1"
                  value={formData.workers}
                  onChange={(e) => setFormData({ ...formData, workers: e.target.value })}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                  required
                />
                {parseInt(formData.workers) !== defaultWorkers && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {parseInt(formData.workers) > defaultWorkers ? 
                      `+${parseInt(formData.workers) - defaultWorkers} travailleurs supplémentaires` : 
                      `Équipe réduite: ${formData.workers} travailleur`}
                  </p>
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="relative">
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                  Informations supplémentaires
                </div>
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={3}
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400 resize-none"
                placeholder="Précisez vos besoins spécifiques, les contraintes particulières, etc."
              />
            </div>

            {/* Résumé du prix */}
            <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Récapitulatif de la commande</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service {service.name}</span>
                  <span className="font-medium text-gray-700">{service.price}€</span>
                </div>
                {(parseInt(formData.duration) !== defaultDuration || parseInt(formData.workers) !== defaultWorkers) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Ajustement ({formData.duration}h, {formData.workers} travailleur{parseInt(formData.workers) > 1 ? 's' : ''})
                    </span>
                    <span className={`font-medium ${calculatedPrice! > service.price ? 'text-red-600' : 'text-emerald-600'}`}>
                      {calculatedPrice! > service.price ? '+' : ''}{calculatedPrice! - service.price}€
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-gray-700 font-semibold">Total</span>
                  <span className="font-bold text-emerald-600">{calculatedPrice}€</span>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#067857] transition-all duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 border-2 border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#067857] hover:bg-[#067857]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#067857] transition-all duration-200"
              >
                Réserver
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 