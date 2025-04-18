'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Service } from '@/types/booking'
import { PickupAddressAutocomplete } from '@/components/AddressAutocomplete'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, MapPinIcon, ClockIcon, InformationCircleIcon, UsersIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

export default function ServiceFormPage({ params }: { params: { id: string } }) {
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    scheduledDate: '',
    location: '',
    duration: 1,
    workers: 1,
    additionalInfo: ''
  })
  const [locationDetails, setLocationDetails] = useState<google.maps.places.PlaceResult | null>(null)
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [isPriceLoading, setIsPriceLoading] = useState(false)
  const router = useRouter()

  // Charger le service
  useEffect(() => {
    const fetchService = async () => {
      try {
        setIsLoading(true)
        // Utiliser l'API pour récupérer le service par ID
        const response = await fetch(`/api/services/${params.id}`)
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }
        
        const foundService = await response.json()
        setService(foundService || null)
        
        if (foundService) {
          // Initialiser le prix calculé avec le prix de base du service
          setCalculatedPrice(foundService.price)
          // Initialiser la durée et le nombre de travailleurs avec les valeurs du service
          setFormData(prev => ({
            ...prev,
            duration: foundService.duration,
            workers: foundService.workers
          }))
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du service:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchService()
  }, [params.id])

  // Recalculer le prix via l'API quand la durée ou le nombre de travailleurs changent
  useEffect(() => {
    // Log du service avant l'appel de updatePrice
    console.log('🔍 Service avant updatePrice:', service ? {
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      workers: service.workers
    } : 'null');
    
    const updatePrice = async () => {
      console.log('⏱️ DÉBUT updatePrice - État service:', !!service);
      
      if (!service) {
        console.log('❌ Service non défini, calcul abandonné');
        return;
      }
      
      // Vérification des propriétés essentielles
      console.log('📊 Vérification des propriétés du service:', {
        price: typeof service.price, 
        priceValue: service.price,
        duration: typeof service.duration,
        durationValue: service.duration,
        workers: typeof service.workers,
        workersValue: service.workers
      });
      
      if (service.price === undefined || service.duration === undefined || service.workers === undefined) {
        console.error('❌ Propriétés requises manquantes sur le service');
        return;
      }
      
      try {
        setIsPriceLoading(true)
        
        // Préparer les données pour l'API
        const apiData = {
          basePrice: service.price,
          duration: formData.duration,
          workers: formData.workers,
          defaultDuration: service.duration,
          defaultWorkers: service.workers
        };
        
        // Journaliser les données avant de les envoyer
        console.log('📊 Données pour calcul:', apiData);
        
        console.log('🔄 Envoi de la requête à /api/bookings/calculate...');
        
        try {
          // Utiliser la fonction dédiée pour l'appel API
          const response = await callPriceAPI(apiData);
          
          console.log('🔄 Réponse reçue, status:', response.status);
          
          // En cas d'erreur HTTP, afficher les détails
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Réponse brute en cas d\'erreur:', errorText);
            
            let errorDetail;
            try {
              errorDetail = JSON.parse(errorText);
              console.error('❌ Erreur détaillée:', errorDetail);
            } catch (e) {
              console.error('❌ Erreur brute (non-JSON):', errorText);
            }
            throw new Error(`Erreur HTTP: ${response.status} - ${errorDetail?.error || errorDetail?.message || errorText}`);
          }
          
          // Récupérer les données de la réponse
          const data = await response.json();
          console.log('✅ Résultat du calcul API:', data);
          
          // Utiliser le prix calculé par l'API ou le prix du service comme fallback
          setCalculatedPrice(data.price || service.price);
        } catch (error) {
          console.error('❌ Erreur lors du calcul du prix:', error);
          
          // En cas d'erreur API, calculer manuellement comme solution de repli
          try {
            const prixHeureSupp = service.price / service.duration;
            const heuresSupp = Math.max(0, formData.duration - service.duration);
            const prixHeuresSupp = heuresSupp * prixHeureSupp;
            
            const travailleursSupp = Math.max(0, formData.workers - service.workers);
            const prixTravailleursSupp = travailleursSupp * 50 * formData.duration;
            
            const totalManuel = service.price + prixHeuresSupp + prixTravailleursSupp;
            
            console.log('🔄 Utilisation du calcul manuel comme solution de repliiiiii:', totalManuel);
            setCalculatedPrice(totalManuel);
          } catch (e) {
            console.error('❌ Erreur également dans le calcul manuel, utilisation du prix de base:', e);
            setCalculatedPrice(service.price);
          }
        } finally {
          setIsPriceLoading(false)
        }
      } catch (outerError) {
        console.error('❌ ERREUR EXTERNE updatePrice:', outerError);
        setIsPriceLoading(false);
      }
    };
    
    // Ajouter un léger délai pour éviter trop d'appels API rapides
    let isMounted = true;
    
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('⏳ Appel de updatePrice après délai');
        updatePrice();
      }
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      console.log('🧹 Nettoyage de l\'effet updatePrice');
    };
  }, [formData.duration, formData.workers, service]);

  // Fonction dédiée pour effectuer l'appel API
  const callPriceAPI = async (data: any) => {
    console.log('🌐 DÉBUT APPEL FETCH API');
    
    const requestBody = JSON.stringify({
      type: 'SERVICE',
      data: data
    });
    
    console.log('🌐 CORPS DE LA REQUÊTE:', requestBody);
    
    try {
      // Utiliser l'API pour calculer le prix
      const response = await fetch('/api/bookings/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      console.log('🌐 RÉPONSE REÇUE - Status:', response.status);
      console.log('🌐 RÉPONSE REÇUE - OK?', response.ok);
      console.log('🌐 RÉPONSE REÇUE - StatusText:', response.statusText);
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log('🌐 RÉPONSE REÇUE - Headers:', responseHeaders);
      
      return response;
    } catch (fetchError) {
      console.error('🌐 ERREUR FETCH:', fetchError);
      throw fetchError;
    } finally {
      console.log('🌐 FIN APPEL FETCH API');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!formData.scheduledDate || !formData.location) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }
    
    if (!service) {
      alert('Service non disponible.')
      return
    }
    
    try {
      // Ajouter un état de chargement pour éviter les soumissions multiples
      setIsLoading(true)
      
      // Créer l'objet de réservation avec les données du formulaire
      const bookingData = {
        type: 'service',
        serviceId: service.id,
        scheduledDate: formData.scheduledDate,
        location: formData.location,
        duration: formData.duration,
        workers: formData.workers,
        additionalInfo: formData.additionalInfo,
        calculatedPrice: calculatedPrice
      }
      
      // Ajout de logs pour déboguer
      console.log('📤 FRONT - Données envoyées pour la réservation:', JSON.stringify(bookingData, null, 2));
      
      // Utiliser l'API pour ajouter le service à la réservation
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })
      
      // Ajout de log pour la réponse
      console.log('📥 FRONT - Statut de la réponse:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('📥 FRONT - Erreur de réponse:', errorData);
        throw new Error(`Erreur HTTP: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json()
      
      console.log('📥 FRONT - Réponse complète:', result);
      console.log('Détails de l\'adresse:', locationDetails)
      
      // Rediriger vers la page de récapitulatif
      router.push('/services/summary')
    } catch (error) {
      console.error('❌ FRONT - Erreur complète lors de la sauvegarde:', error);
      alert('Une erreur est survenue lors de la sauvegarde de votre réservation. Veuillez réessayer.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Réserver votre service</h1>
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
                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Adresse */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                      Adresse
                    </div>
                  </label>
                  <PickupAddressAutocomplete
                    id="location"
                    label="Adresse"
                    value={formData.location}
                    onChange={(value, place) => {
                      handleInputChange('location', value)
                      setLocationDetails(place || null)
                    }}
                    required
                    placeholder="Entrez une adresse"
                    hideLabel
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
                      min={service.duration}
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum {service.duration} heure{service.duration > 1 ? 's' : ''} pour ce service
                    </p>
                    {formData.duration !== service.duration && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {formData.duration > service.duration ? `+${formData.duration - service.duration} heure(s) supplémentaire(s)` : ''}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label htmlFor="workers" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                        Nombre de professionnels
                      </div>
                    </label>
                    <input
                      type="number"
                      id="workers"
                      name="workers"
                      min={service.workers}
                      value={formData.workers}
                      onChange={(e) => handleInputChange('workers', parseInt(e.target.value))}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum {service.workers} professionnel{service.workers > 1 ? 's' : ''} pour ce service
                    </p>
                    {formData.workers !== service.workers && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {formData.workers > service.workers ? `+${formData.workers - service.workers} professionnel(s) supplémentaire(s)` : ''}
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
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white shadow-sm focus:border-[#067857] focus:ring-2 focus:ring-[#067857]/20 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400 resize-none"
                    placeholder="Précisez vos besoins spécifiques"
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
                    disabled={isLoading || isPriceLoading}
                    className="px-4 py-2 border-2 border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#067857] hover:bg-[#067857]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#067857] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Chargement...' : 'Réserver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* En-tête avec les informations du service - Position sticky */}
          <div className="lg:w-[40%]">
            <div className="sticky top-20 self-start bg-white rounded-2xl shadow-md p-5 border border-[#067857]">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h2>
                <p className="text-gray-600 mb-3 text-sm">{service.description}</p>
                
                {/* Infos incluses dans le service */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <UsersIcon className="h-4 w-4 text-emerald-500 mr-2" />
                    <span>{service.workers} professionnel{service.workers > 1 ? 's' : ''} inclus</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <ClockIcon className="h-4 w-4 text-emerald-500 mr-2" />
                    <span>{service.duration} heure{service.duration > 1 ? 's' : ''} incluse{service.duration > 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                {/* Prix */}
                <div className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-xl mb-4">
                  <span className="text-sm font-medium text-emerald-700">Prix de base</span>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">{service.price}€ <span className="text-xs">HT</span></p>
                    <p className="text-xs text-emerald-600 text-right">soit {(service.price * 1.2).toFixed(2)}€ TTC</p>
                  </div>
                </div>
              </div>
              
              {/* Résumé du prix */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Récapitulatif de la commande</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service {service.name}</span>
                    <span className="font-medium text-gray-700">{service.price}€</span>
                  </div>
                  {formData.duration > service.duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Heures supplémentaires ({formData.duration - service.duration} heure{formData.duration - service.duration > 1 ? 's' : ''})
                      </span>
                      <span className="font-medium text-red-600">
                        +{Math.round((service.price / service.duration) * (formData.duration - service.duration))}€
                      </span>
                    </div>
                  )}
                  {formData.workers > service.workers && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Professionnels supplémentaires ({formData.workers - service.workers})
                      </span>
                      <span className="font-medium text-red-600">
                        +{Math.round((formData.workers - service.workers) * 50 * formData.duration)}€
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total HT</span>
                      {isPriceLoading ? (
                        <span className="font-medium text-gray-700">Calcul...</span>
                      ) : (
                        <span className="font-medium text-gray-700">{calculatedPrice || 0}€</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">TVA (20%)</span>
                      {isPriceLoading ? (
                        <span className="font-medium text-gray-700">Calcul...</span>
                      ) : (
                        <span className="font-medium text-gray-700">{((calculatedPrice || 0) * 0.2).toFixed(2)}€</span>
                      )}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-700 font-semibold">Total TTC</span>
                      {isPriceLoading ? (
                        <div className="flex items-center">
                          <span className="font-bold text-emerald-600 mr-2">Calcul en cours</span>
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600">{((calculatedPrice || 0) * 1.2).toFixed(2)}€</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Détails des accès */}
              <div className="space-y-3 mt-3">
                <div className="bg-blue-50 p-2.5 rounded-lg text-xs text-blue-800">
                  <h4 className="font-medium">Détails des accès</h4>
                  <p className="font-medium text-blue-700 mt-1.5">Adresse :</p>
                  <p className="ml-2 text-blue-600">
                    {formData.location ? formData.location : 'Non spécifiée'}
                  </p>
                </div>
                
                {/* Avertissement important */}
                <div className="bg-yellow-50 p-2.5 rounded-lg">
                  <p className="text-xs text-yellow-800 flex items-start">
                    <InformationCircleIcon className="h-3.5 w-3.5 text-yellow-600 mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">Important :</span> Le prix de ce service est personnalisable. Des frais supplémentaires peuvent s'appliquer selon la durée et le nombre de professionnels requis. La durée minimale est de {service.duration} heure{service.duration > 1 ? 's' : ''} avec {service.workers} professionnel{service.workers > 1 ? 's' : ''}.
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