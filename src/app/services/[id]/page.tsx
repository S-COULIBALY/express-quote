'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Service } from '@/types/booking'
import { PickupAddressAutocomplete } from '@/components/AddressAutocomplete'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, MapPinIcon, ClockIcon, InformationCircleIcon, UsersIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { FallbackCalculatorService } from '@/quotation/application/services/FallbackCalculatorService'
import { ServiceType } from '@/quotation/domain/enums/ServiceType'

export default function ServiceFormPage({ params }: { params: { id: string } }) {
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const [priceDetails, setPriceDetails] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'

  // Charger le service et les données d'édition si en mode édition
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
          
          // Vérifier si nous sommes en mode édition et charger les données stockées
          if (isEditMode && typeof window !== 'undefined') {
            const storedData = window.sessionStorage.getItem('editQuoteData')
            if (storedData) {
              try {
                const parsedData = JSON.parse(storedData)
                // Pré-remplir le formulaire avec les données stockées
                setFormData({
                  scheduledDate: parsedData.scheduledDate || '',
                  location: parsedData.location || '',
                  duration: parsedData.duration || foundService.duration,
                  workers: parsedData.workers || foundService.workers,
                  additionalInfo: parsedData.additionalInfo || ''
                })
                
                // Nettoyer le sessionStorage après utilisation
                window.sessionStorage.removeItem('editQuoteData')
              } catch (error) {
                console.error('Erreur lors du parsing des données stockées:', error)
              }
            }
          } else {
            // Initialiser avec les valeurs par défaut du service
          setFormData(prev => ({
            ...prev,
            duration: foundService.duration,
            workers: foundService.workers
          }))
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du service:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchService()
  }, [params.id, isEditMode])

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
            type: 'SERVICE',
          data: {
            defaultPrice: service.price,
            duration: formData.duration,
            workers: formData.workers,
            defaultDuration: service.duration,
            defaultWorkers: service.workers,
            // Inclure uniquement les données du formulaire
            scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
            location: formData.location,
            additionalInfo: formData.additionalInfo
          }
        };
          
        // Journaliser les données avant de les envoyer
        console.log('📊 Données pour calcul:', {
          type: apiData.type,
          service: {
            defaultPrice: apiData.data.defaultPrice,
            duration: apiData.data.duration,
            workers: apiData.data.workers,
            defaultDuration: apiData.data.defaultDuration,
            defaultWorkers: apiData.data.defaultWorkers
          },
          formulaire: {
            scheduledDate: apiData.data.scheduledDate ? apiData.data.scheduledDate.toISOString() : 'non définie',
            location: apiData.data.location || 'non définie',
            additionalInfo: apiData.data.additionalInfo || 'aucune'
          }
        });
        
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
          console.log('✅ Résultat du calcul API:', JSON.stringify(data, null, 2));
          
          // Vérifier les données de suppléments reçues
          console.log('🧐 Détails API - extraHoursCost:', data.details?.extraHoursCost);
          console.log('🧐 Détails API - extraWorkerCost:', data.details?.extraWorkerCost);
          console.log('🧐 Détails API - discount:', data.details?.discount);
          
          // Calculer les suppléments si absents de la réponse API
          let extraHoursCost = data.details?.extraHoursCost || 0;
          let extraWorkerCost = data.details?.extraWorkerCost || 0;
          const discount = data.details?.discount || 0;
          
          if (formData.duration > service.duration && !extraHoursCost) {
            extraHoursCost = Math.round((formData.duration - service.duration) * 35 * service.workers);
            console.log('🔄 Calcul manuel extraHoursCost:', extraHoursCost);
          }
          
          if (formData.workers > service.workers && !extraWorkerCost) {
            extraWorkerCost = Math.round((formData.workers - service.workers) * 35 * formData.duration);
            console.log('🔄 Calcul manuel extraWorkerCost:', extraWorkerCost);
          }
          
          // Stocker à la fois le prix et les détails de calcul
          setCalculatedPrice(data.price || service.price);
          
          const priceDetailsData = {
            basePrice: data.quote?.basePrice || service.price,
            extraHoursCost: extraHoursCost,
            extraWorkerCost: extraWorkerCost,
            totalPrice: data.price || service.price,
            discount: discount,
            vatAmount: data.vat || Math.round((data.price || service.price) * 0.2),
            totalWithVat: data.totalWithVat || Math.round((data.price || service.price) * 1.2)
          };
          
          console.log('💰 PriceDetails calculés:', priceDetailsData);
          setPriceDetails(priceDetailsData);
        } catch (error) {
          console.error('❌ Erreur lors du calcul du prix:', error);
          
          // Utiliser le FallbackCalculatorService en cas d'erreur API
          try {
            console.log('🔄 SERVICE - Utilisation du service de fallback comme solution de repli');
            
            // Initialiser le service
            const fallbackService = FallbackCalculatorService.getInstance();
            
            // Calcul du prix via le service centralisé
            const fallbackResult = fallbackService.calculateServiceFallback({
              defaultPrice: service.price,
              duration: formData.duration,
              workers: formData.workers,
              defaultDuration: service.duration,
              defaultWorkers: service.workers
            });
            
            console.log('🔄 SERVICE - Résultat du calcul via service de fallback:', fallbackResult.details);
            
            // Créer des détails manuels pour le fallback
            const priceDetailsData = {
              basePrice: fallbackResult.details.defaultPrice,
              extraHoursCost: fallbackResult.details.extraHoursCost,
              extraWorkerCost: fallbackResult.details.extraWorkerCost,
              totalPrice: fallbackResult.details.finalPrice,
              discount: 0,
              vatAmount: fallbackResult.details.vatAmount,
              totalWithVat: fallbackResult.details.totalWithVat
            };
            
            // Stocker le prix et les détails calculés
            setCalculatedPrice(fallbackResult.details.finalPrice);
            console.log('💰 PriceDetails calculés (fallback centralisé):', priceDetailsData);
            setPriceDetails(priceDetailsData);
          } catch (e) {
            console.error('❌ Erreur également dans le service de fallback:', e);
            setCalculatedPrice(service.price);
            setPriceDetails({
              basePrice: service.price,
              extraHoursCost: 0,
              extraWorkerCost: 0,
              totalPrice: service.price,
              discount: 0,
              vatAmount: Math.round(service.price * 0.2),
              totalWithVat: Math.round(service.price * 1.2)
            });
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
    
    const requestBody = JSON.stringify(data);
    
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!formData.scheduledDate || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!service) {
      alert('Service non disponible.');
      return;
    }
    
    // Activer l'overlay de chargement complet
    setIsSubmitting(true);
    
    // Enregistrer le temps de début pour garantir une durée minimale d'affichage
    const startTime = Date.now();
    
    try {
      const bookingData = {
        serviceId: service.id,
        scheduledDate: formData.scheduledDate,
        location: formData.location,
        duration: formData.duration,
        workers: formData.workers,
        additionalInfo: formData.additionalInfo,
        calculatedPrice: calculatedPrice
      };
      
      console.log('📤 FRONT - Données envoyées pour la réservation:', bookingData);
      
      const response = await fetch('/api/quotes/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SERVICE',
          service: bookingData
        }),
      });
      
      console.log('📥 FRONT - Statut de la réponse:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('📥 FRONT - Réponse complète:', responseData);
        
        // Vérifier explicitement que l'ID existe
        if (responseData && responseData.id) {
          // Sauvegarder l'ID dans sessionStorage plutôt que localStorage
          if (typeof window !== 'undefined') {
            console.log('💾 Sauvegarde de l\'ID dans sessionStorage:', responseData.id);
            window.sessionStorage.setItem('pendingQuoteRequestId', responseData.id);
            
            // Créer URL avec paramètre de requête explicite
            const summaryUrl = `/services/summary?quoteRequestId=${encodeURIComponent(responseData.id)}`;
            console.log('🔄 Redirection vers:', summaryUrl);
            
            // Calculer le temps écoulé et attendre si nécessaire pour garantir une durée minimale d'affichage
            const elapsedTime = Date.now() - startTime;
            const minDisplayTime = 1500; // 1,5 secondes minimum
            
            if (elapsedTime < minDisplayTime) {
              console.log(`⏱️ Attente de ${minDisplayTime - elapsedTime}ms pour assurer une transition fluide`);
              await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
            }
            
            // La navigation se fera avec l'indicateur de chargement visible
            router.push(summaryUrl);
            return; // Sortir de la fonction sans désactiver isSubmitting
          } else {
            // Fallback si window n'est pas disponible (côté serveur)
            console.log('⚠️ window non disponible, utilisation de router.push');
            router.push(`/services/summary?quoteRequestId=${responseData.id}`);
            return; // Sortir de la fonction sans désactiver isSubmitting
          }
        } else {
          console.error('❌ Erreur: ID manquant dans la réponse API', responseData);
          alert('Une erreur est survenue: ID de devis manquant dans la réponse');
        }
      } else {
        const errorData = await response.json();
        console.error('Error creating quote request:', errorData);
        alert('Failed to create quote request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    } finally {
      // Calculer le temps écoulé et attendre si nécessaire avant de désactiver l'overlay
      const elapsedTime = Date.now() - startTime;
      const minDisplayTime = 1500; // 1,5 secondes minimum
      
      if (elapsedTime < minDisplayTime) {
        await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
      }
      
      // Ne désactiver l'état de chargement que si la redirection n'a pas été initiée
      // (cas d'erreur ou données manquantes)
      setIsSubmitting(false);
    }
  };

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
      {/* Overlay de chargement lors de la soumission */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-gray-900/70 z-50 flex flex-col items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full flex flex-col items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-500 border-t-transparent mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">Traitement de votre demande</h3>
            <p className="text-gray-600 text-center mt-2">Votre devis est en cours de préparation, veuillez patienter...</p>
            
            {/* Barre de progression pulsante */}
            <div className="w-full mt-5 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            
            <p className="text-gray-500 text-xs mt-3">Calcul du prix en cours...</p>
          </div>
        </div>
      )}
      
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
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Récapitulatif de la commande</h3>
                <div className="space-y-2">
                  {/* Prix de base */}
                  <div className="flex justify-between text-sm font-medium pb-2 border-b border-gray-200">
                    <span className="text-gray-700">Service {service.name}</span>
                    <span className="text-gray-700">{service.price}€</span>
                  </div>
                  
                  {isPriceLoading ? (
                    <div className="py-3">
                      <div className="flex justify-center">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Section Suppléments */}
                      {formData.duration > service.duration || formData.workers > service.workers || priceDetails?.extraHoursCost > 0 || priceDetails?.extraWorkerCost > 0 ? (
                        <div className="py-1">
                          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1.5">Suppléments</div>
                          
                          {/* Heures supplémentaires */}
                          {(formData.duration > service.duration || priceDetails?.extraHoursCost > 0) && (
                            <div className="flex justify-between text-sm py-0.5">
                              <span className="text-gray-600 flex items-center">
                                <ClockIcon className="h-3.5 w-3.5 text-orange-500 mr-1.5" />
                                <span>
                                  {formData.duration - service.duration} heure{formData.duration - service.duration > 1 ? 's' : ''} supp.
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({service.workers} travailleur{service.workers > 1 ? 's' : ''})
                                  </span>
                                </span>
                      </span>
                              <span className="font-medium text-orange-600">
                                +{priceDetails?.extraHoursCost || Math.round((formData.duration - service.duration) * 35 * service.workers)}€
                              </span>
                            </div>
                          )}
                          
                          {/* Travailleurs supplémentaires */}
                          {(formData.workers > service.workers || priceDetails?.extraWorkerCost > 0) && (
                            <div className="flex justify-between text-sm py-0.5">
                              <span className="text-gray-600 flex items-center">
                                <UsersIcon className="h-3.5 w-3.5 text-orange-500 mr-1.5" />
                                <span>
                                  {formData.workers - service.workers} travailleur{formData.workers - service.workers > 1 ? 's' : ''} supp.
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({formData.duration}h)
                                  </span>
                                </span>
                              </span>
                              <span className="font-medium text-orange-600">
                                +{priceDetails?.extraWorkerCost || Math.round((formData.workers - service.workers) * 35 * formData.duration)}€
                      </span>
                    </div>
                  )}
                        </div>
                      ) : null}
                      
                      {/* Section Réductions */}
                      {(priceDetails?.discount && priceDetails?.discount > 0) ? (
                        <div className="py-1">
                          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1.5">Réductions</div>
                          <div className="flex justify-between text-sm py-0.5">
                            <span className="text-gray-600 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                              </svg>
                              <span>Réduction appliquée</span>
                      </span>
                            <span className="font-medium text-green-600">
                              -{priceDetails.discount}€
                      </span>
                            </div>
                        </div>
                      ) : null}
                    </>
                  )}
                  
                  {/* Sous-total, TVA et Total */}
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total HT</span>
                      {isPriceLoading ? (
                        <span className="font-medium text-gray-700">Calcul...</span>
                      ) : (
                      <span className="font-medium text-gray-700">{calculatedPrice || 0}€</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA (20%)</span>
                      {isPriceLoading ? (
                        <span className="font-medium text-gray-700">Calcul...</span>
                      ) : (
                        <span className="font-medium text-gray-700">
                          {priceDetails?.vatAmount || Math.round((calculatedPrice || 0) * 0.2)}€
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-semibold">Total TTC</span>
                      {isPriceLoading ? (
                        <div className="flex items-center">
                          <span className="font-bold text-emerald-600 mr-2">Calcul en cours</span>
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600">
                          {priceDetails?.totalWithVat || Math.round((calculatedPrice || 0) * 1.2)}€
                        </span>
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