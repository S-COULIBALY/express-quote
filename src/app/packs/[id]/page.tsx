'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pack } from '@/types/booking'
import { PickupAddressAutocomplete, DeliveryAddressAutocomplete } from '@/components/AddressAutocomplete'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, MapPinIcon, InformationCircleIcon, ClockIcon, TruckIcon, UsersIcon } from '@heroicons/react/24/outline'
import { calculateDistance } from '@/actions/distanceCalculator'

export default function PackFormPage({ params }: { params: { id: string } }) {
  const [pack, setPack] = useState<Pack | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    scheduledDate: '',
    pickupAddress: '',
    deliveryAddress: '',
    duration: '1',
    workers: '2',
    additionalInfo: '',
    // Nouveaux champs pour l'adresse de départ
    pickupFloor: '0',
    pickupHasElevator: false,
    pickupNeedsLift: false,
    // Nouveaux champs pour l'adresse d'arrivée
    deliveryFloor: '0',
    deliveryHasElevator: false,
    deliveryNeedsLift: false
  })
  const [addressDetails, setAddressDetails] = useState({
    pickup: null as google.maps.places.PlaceResult | null,
    delivery: null as google.maps.places.PlaceResult | null
  })
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [distance, setDistance] = useState<number>(0)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    const fetchPack = async () => {
      try {
        setIsLoading(true)
        // Utiliser l'API pour récupérer le pack par ID
        const response = await fetch(`/api/packs/${params.id}`)
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }
        
        const foundPack = await response.json()
        setPack(foundPack || null)
        
        if (foundPack) {
          // Initialiser le prix calculé avec le prix de base du pack
          setCalculatedPrice(foundPack.price)
          // Initialiser la durée et le nombre de travailleurs avec les valeurs du pack
          setFormData(prev => ({
            ...prev,
            duration: foundPack.duration.toString(),
            workers: foundPack.workers.toString()
          }))
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du pack:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPack()
  }, [params.id])

  // Calculer la distance entre les adresses
  useEffect(() => {
    const calculateDistanceBetweenAddresses = async () => {
      if (formData.pickupAddress && formData.deliveryAddress) {
        try {
          setIsCalculatingDistance(true)
          
          // Utiliser directement la Server Action pour calculer la distance
          const distance = await calculateDistance(formData.pickupAddress, formData.deliveryAddress)
          
          // Mettre à jour la distance calculée
          setDistance(distance || 0)
        } catch (error) {
          console.error('Erreur lors du calcul de distance:', error)
        } finally {
          setIsCalculatingDistance(false)
        }
      }
    }

    calculateDistanceBetweenAddresses()
  }, [formData.pickupAddress, formData.deliveryAddress])

  // Recalculer le prix quand la durée, le nombre de travailleurs, la distance ou les options de monte-meuble changent
  useEffect(() => {
    const updatePrice = async () => {
      if (pack) {
        const duration = parseInt(formData.duration, 10)
        const workers = parseInt(formData.workers, 10)
        try {
          // Utiliser l'API pour calculer le prix
          const response = await fetch('/api/bookings/calculate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'PACK',
              data: {
                basePrice: pack.price,
                duration: duration,
                workers: workers,
                baseWorkers: pack.workers,
                baseDuration: pack.duration,
                distance: distance
              }
            })
          })
          
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
          }
          
          const data = await response.json()
          setCalculatedPrice(data.price || pack.price)
        } catch (error) {
          console.error('Erreur lors du calcul du prix:', error)
        }
      }
    }
    
    updatePrice()
  }, [formData.duration, formData.workers, formData.pickupNeedsLift, formData.deliveryNeedsLift, pack, distance])

  // Gérer la validation des champs d'étage et ascenseur
  useEffect(() => {
    let updatedFormData = { ...formData };
    let hasChanges = false;

    // Adresse de départ
    if (parseInt(formData.pickupFloor) > 3 && !formData.pickupHasElevator && !formData.pickupNeedsLift) {
      // Si étage > 3 et pas d'ascenseur, monte-meuble obligatoire
      updatedFormData.pickupNeedsLift = true;
      hasChanges = true;
    } else if ((parseInt(formData.pickupFloor) <= 3 || formData.pickupHasElevator) && formData.pickupNeedsLift) {
      // Si étage <= 3 OU ascenseur présent, décocher le monte-meuble
      updatedFormData.pickupNeedsLift = false;
      hasChanges = true;
    }
    
    // Adresse d'arrivée
    if (parseInt(formData.deliveryFloor) > 3 && !formData.deliveryHasElevator && !formData.deliveryNeedsLift) {
      // Si étage > 3 et pas d'ascenseur, monte-meuble obligatoire
      updatedFormData.deliveryNeedsLift = true;
      hasChanges = true;
    } else if ((parseInt(formData.deliveryFloor) <= 3 || formData.deliveryHasElevator) && formData.deliveryNeedsLift) {
      // Si étage <= 3 OU ascenseur présent, décocher le monte-meuble
      updatedFormData.deliveryNeedsLift = false;
      hasChanges = true;
    }
    
    // Appliquer les changements seulement si nécessaire
    if (hasChanges) {
      setFormData(updatedFormData);
    }
  }, [formData.pickupFloor, formData.pickupHasElevator, formData.deliveryFloor, formData.deliveryHasElevator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!formData.scheduledDate || !formData.pickupAddress || !formData.deliveryAddress) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }
    
    // Validation pour le monte-meuble uniquement si pas d'ascenseur
    if (parseInt(formData.pickupFloor) > 3 && !formData.pickupHasElevator && !formData.pickupNeedsLift) {
      alert('Un monte-meuble est obligatoire pour le départ si l\'étage est supérieur à 3 sans ascenseur.')
      return
    }
    
    if (parseInt(formData.deliveryFloor) > 3 && !formData.deliveryHasElevator && !formData.deliveryNeedsLift) {
      alert('Un monte-meuble est obligatoire pour l\'arrivée si l\'étage est supérieur à 3 sans ascenseur.')
      return
    }
    
    if (!pack) {
      alert('Pack non disponible.')
      return
    }
    
    try {
      // Ajouter un état de chargement pour éviter les soumissions multiples
      setIsLoading(true)
      
      // Créer l'objet de réservation avec les données du formulaire
      const bookingData = {
        type: 'pack',
        packId: pack.id,
        scheduledDate: formData.scheduledDate,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        duration: parseInt(formData.duration, 10),
        workers: parseInt(formData.workers, 10),
        additionalInfo: formData.additionalInfo,
        pickupFloor: parseInt(formData.pickupFloor),
        pickupHasElevator: formData.pickupHasElevator,
        pickupNeedsLift: formData.pickupNeedsLift,
        deliveryFloor: parseInt(formData.deliveryFloor),
        deliveryHasElevator: formData.deliveryHasElevator,
        deliveryNeedsLift: formData.deliveryNeedsLift,
        distance: distance,
        calculatedPrice: calculatedPrice
      }
      
      // Utiliser l'API pour ajouter le pack à la réservation
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const result = await response.json()
      
      console.log('Pack ajouté avec succès:', result)
      console.log('Détails des adresses:', addressDetails)
      
      // Rediriger vers la page de récapitulatif
      router.push('/packs/summary')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error)
      alert('Une erreur est survenue lors de la sauvegarde de votre réservation. Veuillez réessayer.')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-red-600">Pack non trouvé</h1>
        <p className="mt-4">Le pack que vous recherchez n'existe pas.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Réserver votre pack déménagement</h1>
        <h2 className="text-xl text-gray-600 mt-2">Personnalisez votre réservation selon vos besoins</h2>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulaire - Maintenant à gauche */}
          <div className="lg:w-[60%]">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-[#067857]">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Détails de la réservation</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {/* Adresses */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                        Adresse de départ
                      </div>
                    </label>
                    <PickupAddressAutocomplete
                      id="pickupAddress"
                      label="Adresse de départ"
                      value={formData.pickupAddress}
                      onChange={(value, place) => {
                        setFormData({ ...formData, pickupAddress: value })
                        setAddressDetails({ ...addressDetails, pickup: place || null })
                      }}
                      required
                      placeholder="Entrez l'adresse de départ"
                      hideLabel
                    />
                    
                    {/* Informations supplémentaires adresse de départ */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label htmlFor="pickupFloor" className="block text-xs font-medium text-gray-700 mb-1">
                          Étage
                        </label>
                        <input
                          type="number"
                          id="pickupFloor"
                          name="pickupFloor"
                          min="0"
                          value={formData.pickupFloor}
                          onChange={(e) => setFormData({ ...formData, pickupFloor: e.target.value })}
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400 text-sm"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="pickupHasElevator"
                            name="pickupHasElevator"
                            checked={formData.pickupHasElevator}
                            onChange={(e) => setFormData({ ...formData, pickupHasElevator: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="ml-2 block text-xs text-gray-700">Ascenseur</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className={`flex items-center ${parseInt(formData.pickupFloor) > 3 && !formData.pickupHasElevator ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            id="pickupNeedsLift"
                            name="pickupNeedsLift"
                            checked={formData.pickupNeedsLift}
                            onChange={(e) => setFormData({ ...formData, pickupNeedsLift: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span 
                            className={`ml-2 block text-xs ${parseInt(formData.pickupFloor) > 3 && !formData.pickupHasElevator ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                          >
                            Monte-meuble
                            {parseInt(formData.pickupFloor) > 3 && !formData.pickupHasElevator && (
                              <span className="ml-1 text-red-600">*</span>
                            )}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                        Adresse d'arrivée
                      </div>
                    </label>
                    <DeliveryAddressAutocomplete
                      id="deliveryAddress"
                      label="Adresse d'arrivée"
                      value={formData.deliveryAddress}
                      onChange={(value, place) => {
                        setFormData({ ...formData, deliveryAddress: value })
                        setAddressDetails({ ...addressDetails, delivery: place || null })
                      }}
                      required
                      placeholder="Entrez l'adresse d'arrivée"
                      hideLabel
                    />
                    
                    {/* Informations supplémentaires adresse d'arrivée */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label htmlFor="deliveryFloor" className="block text-xs font-medium text-gray-700 mb-1">
                          Étage
                        </label>
                        <input
                          type="number"
                          id="deliveryFloor"
                          name="deliveryFloor"
                          min="0"
                          value={formData.deliveryFloor}
                          onChange={(e) => setFormData({ ...formData, deliveryFloor: e.target.value })}
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400 text-sm"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="deliveryHasElevator"
                            name="deliveryHasElevator"
                            checked={formData.deliveryHasElevator}
                            onChange={(e) => setFormData({ ...formData, deliveryHasElevator: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="ml-2 block text-xs text-gray-700">Ascenseur</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className={`flex items-center ${parseInt(formData.deliveryFloor) > 3 && !formData.deliveryHasElevator ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            id="deliveryNeedsLift"
                            name="deliveryNeedsLift"
                            checked={formData.deliveryNeedsLift}
                            onChange={(e) => setFormData({ ...formData, deliveryNeedsLift: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span 
                            className={`ml-2 block text-xs ${parseInt(formData.deliveryFloor) > 3 && !formData.deliveryHasElevator ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                          >
                            Monte-meuble
                            {parseInt(formData.deliveryFloor) > 3 && !formData.deliveryHasElevator && (
                              <span className="ml-1 text-red-600">*</span>
                            )}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distance calculée */}
                {distance > 0 && (
                  <div className="bg-sky-50 p-3 rounded-lg">
                    <div className="flex items-center text-sm text-sky-800">
                      <TruckIcon className="h-4 w-4 text-sky-600 mr-1.5" />
                      <span>Distance calculée: <strong>{Math.round(distance * 10) / 10} km</strong></span>
                    </div>
                    {distance > (pack.includedDistance || 20) && (
                      <div className="mt-1 text-xs text-sky-700">
                        <p>
                          Ce pack inclut {pack.includedDistance} {pack.distanceUnit}. Les kilomètres supplémentaires seront facturés à 1,50€/km.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Durée et Nombre de travailleurs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                        Durée (en jours)
                      </div>
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      min={pack.duration}
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum {pack.duration} jour{pack.duration > 1 ? 's' : ''} pour ce pack
                    </p>
                    {formData.duration !== pack.duration.toString() && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {parseInt(formData.duration) > pack.duration ? `+${parseInt(formData.duration) - pack.duration} jour(s) supplémentaire(s)` : ''}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label htmlFor="workers" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                        Nombre de travailleurs
                      </div>
                    </label>
                    <input
                      type="number"
                      id="workers"
                      name="workers"
                      min={pack.workers}
                      value={formData.workers}
                      onChange={(e) => setFormData({ ...formData, workers: e.target.value })}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum {pack.workers} travailleur{pack.workers > 1 ? 's' : ''} pour ce pack
                    </p>
                    {formData.workers !== pack.workers.toString() && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {parseInt(formData.workers) > pack.workers ? `+${parseInt(formData.workers) - pack.workers} travailleur(s) supplémentaire(s)` : ''}
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
                    placeholder="Précisez vos besoins spécifiques, le nombre d'étages, etc."
                  />
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
          
          {/* En-tête avec les informations du pack - Position sticky sans défilement */}
          <div className="lg:w-[40%]">
            <div className="sticky top-20 self-start bg-white rounded-2xl shadow-md p-5 border border-[#067857]">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{pack.name}</h2>
                <p className="text-gray-600 mb-3 text-sm">{pack.description}</p>
                
                {/* Infos incluses dans le pack */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <UsersIcon className="h-4 w-4 text-emerald-500 mr-2" />
                    <span>{pack.workers} déménageurs inclus</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <ClockIcon className="h-4 w-4 text-emerald-500 mr-2" />
                    <span>{pack.duration} jour{pack.duration > 1 ? 's' : ''} inclus</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <TruckIcon className="h-4 w-4 text-emerald-500 mr-2" />
                    <span>{pack.includedDistance} {pack.distanceUnit} inclus</span>
                  </div>
                </div>
                
                {/* Prix */}
                <div className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-xl mb-4">
                  <span className="text-sm font-medium text-emerald-700">Prix de base</span>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">{pack.price}€ <span className="text-xs">HT</span></p>
                    <p className="text-xs text-emerald-600 text-right">soit {(pack.price * 1.2).toFixed(2)}€ TTC</p>
                  </div>
                </div>
              </div>
              
              {/* Résumé du prix */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Récapitulatif de la commande</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pack {pack.name}</span>
                    <span className="font-medium text-gray-700">{pack.price}€</span>
                  </div>
                  {parseInt(formData.duration) > pack.duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Jours supplémentaires ({parseInt(formData.duration) - pack.duration} jour{parseInt(formData.duration) - pack.duration > 1 ? 's' : ''}) <span className="text-red-500 font-medium">(-10%)</span>
                      </span>
                      <span className="font-medium text-red-600">
                        +{Math.round((pack.price / pack.duration) * (parseInt(formData.duration) - pack.duration) * 0.9)}€
                      </span>
                    </div>
                  )}
                  {parseInt(formData.workers) > pack.workers && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Ajustement personnel ({parseInt(formData.workers) - pack.workers} travailleur{parseInt(formData.workers) - pack.workers > 1 ? 's' : ''} supplémentaire{parseInt(formData.workers) - pack.workers > 1 ? 's' : ''}) <span className="text-red-500 font-medium">(-{parseInt(formData.duration) === 1 ? '5' : '10'}%)</span>
                      </span>
                      <span className="font-medium text-red-600">
                        +{Math.round((parseInt(formData.workers) - pack.workers) * 120 * parseInt(formData.duration) * (1 - (parseInt(formData.duration) === 1 ? 0.05 : 0.10)))}€
                      </span>
                    </div>
                  )}
                  {distance > (pack.includedDistance || 20) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Distance supplémentaire ({Math.round((distance - (pack.includedDistance || 20)) * 10) / 10} km × 1,50€)
                      </span>
                      <span className="font-medium text-red-600">
                        +{Math.round((distance - (pack.includedDistance || 20)) * 1.5 * 10) / 10}€
                      </span>
                    </div>
                  )}
                  {(formData.pickupNeedsLift || formData.deliveryNeedsLift) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Monte-meuble 
                        {formData.pickupNeedsLift && formData.deliveryNeedsLift ? ' (départ et arrivée)' : 
                         formData.pickupNeedsLift ? ' (départ)' : ' (arrivée)'}
                      </span>
                      <span className="font-medium text-red-600">
                        +{(formData.pickupNeedsLift && formData.deliveryNeedsLift) ? '400' : '200'}€
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total HT</span>
                      <span className="font-medium text-gray-700">{calculatedPrice || 0}€</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">TVA (20%)</span>
                      <span className="font-medium text-gray-700">{((calculatedPrice || 0) * 0.2).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-700 font-semibold">Total TTC</span>
                      <span className="font-bold text-emerald-600">{((calculatedPrice || 0) * 1.2).toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Détails supplémentaires et avertissements - rendus plus compacts */}
              <div className="space-y-3 mt-3">
                <div className="bg-blue-50 p-2.5 rounded-lg text-xs text-blue-800">
                  <h4 className="font-medium">Détails des accès</h4>
                  <p className="font-medium text-blue-700 mt-1.5">Adresse de départ :</p>
                  <p className="ml-2 text-blue-600">
                    {formData.pickupFloor != '0' ? `Étage ${formData.pickupFloor}` : 'Rez-de-chaussée'} 
                    {formData.pickupHasElevator ? ' • Avec ascenseur' : ' • Sans ascenseur'}
                    {formData.pickupNeedsLift ? ' • Monte-meuble requis' : ''}
                    {parseInt(formData.pickupFloor) > 3 && !formData.pickupHasElevator && !formData.pickupNeedsLift && (
                      <span className="text-red-600"> • Monte-meuble obligatoire</span>
                    )}
                  </p>
                  
                  <p className="font-medium text-blue-700 mt-1.5">Adresse d'arrivée :</p>
                  <p className="ml-2 text-blue-600">
                    {formData.deliveryFloor != '0' ? `Étage ${formData.deliveryFloor}` : 'Rez-de-chaussée'} 
                    {formData.deliveryHasElevator ? ' • Avec ascenseur' : ' • Sans ascenseur'}
                    {formData.deliveryNeedsLift ? ' • Monte-meuble requis' : ''}
                    {parseInt(formData.deliveryFloor) > 3 && !formData.deliveryHasElevator && !formData.deliveryNeedsLift && (
                      <span className="text-red-600"> • Monte-meuble obligatoire</span>
                    )}
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-2.5 rounded-lg">
                  <p className="text-xs text-yellow-800 flex items-start">
                    <InformationCircleIcon className="h-3.5 w-3.5 text-yellow-600 mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">Important :</span> Le prix de ce forfait est personnalisable. Un monte-meuble (200€) est obligatoire pour les étages supérieurs à 3 sans ascenseur. Des frais supplémentaires peuvent s'appliquer selon les conditions d'accès.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}