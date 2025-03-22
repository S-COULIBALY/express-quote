'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput, Select } from '@/components/Form'
import { PickupAddressAutocomplete, DeliveryAddressAutocomplete } from '@/components/AddressAutocomplete'
import { calculateMovingQuote } from '@/actions/calculateMovingQuote'
import type { MovingFormData } from '@/types/quote'
import type { PlaceResult } from '@/types/google-maps'
import { QuoteSummary } from '@/components/QuoteSummary'
import { apiConfig } from '@/config/api'

interface IconProps {
  className?: string
}

// Icônes SVG personnalisées
const CalendarIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const HomeIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const CheckCircleIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const MapPinIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
)

interface QuoteDetails {
  distance: number
  tollCost: number
  fuelCost: number
  baseCost: number
  optionsCost: number
  totalCost: number
}

const initialFormData: MovingFormData = {
  pickupAddress: '',
  deliveryAddress: '',
  movingDate: '',
  volume: '',
  pickupFloor: '',
  deliveryFloor: '',
  propertyType: '',
  surface: '',
  rooms: '',
  occupants: '',
  pickupElevator: 'no',
  deliveryElevator: 'no',
  pickupCarryDistance: '',
  deliveryCarryDistance: '',
  options: {
    packaging: false,
    furniture: false,
    fragile: false,
    storage: false
  }
}

// Vérifier si le formulaire est complet et valide
const isFormComplete = (data: MovingFormData, addresses: { pickup: google.maps.places.PlaceResult | null, delivery: google.maps.places.PlaceResult | null }): boolean => {
  return !!(
    data.volume && 
    data.movingDate && 
    addresses.pickup && 
    addresses.delivery
  );
}

const _getServiceLabel = (key: string): string => {
  const labels: Record<string, string> = {
    packaging: 'Emballage professionnel',
    furniture: 'Montage meubles',
    fragile: 'Assurance premium'
  }
  return labels[key] || key
}

const calculateDistance = async (origin: string, destination: string) => {
  try {
    const response = await fetch(
      `${apiConfig.googleMaps.baseUrl}/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiConfig.googleMaps.apiKey}`
    )
    const data = await response.json()
    return data.rows[0].elements[0].distance.value / 1000 // Convertir en km
  } catch (error) {
    console.error('Erreur lors du calcul de la distance:', error)
    return 0
  }
}

const _getTripCosts = async (origin: string, destination: string) => {
  try {
    const response = await fetch(
      `${apiConfig.toolguru.baseUrl}/trip-costs?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiConfig.toolguru.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    const data = await response.json()
    return {
      distance: data.distance,
      tollCost: data.tollCost,
      fuelCost: data.fuelCost
    }
  } catch (error) {
    console.error('Erreur lors du calcul des coûts:', error)
    return {
      distance: 0,
      tollCost: 0,
      fuelCost: 0
    }
  }
}

// Ajouter une fonction auxiliaire pour convertir les valeurs d'ascenseur
const booleanToElevatorValue = (hasElevator: boolean | string): string => {
  if (typeof hasElevator === 'boolean') {
    return hasElevator ? 'yes' : 'no'
  }
  return hasElevator || 'no'
}

const elevatorValueToBoolean = (value: string): boolean => {
  return value === 'yes'
}

export default function NewMovingQuote() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState<MovingFormData>(initialFormData)
  const [showQuote, setShowQuote] = useState(false)
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    distance: 0, tollCost: 0, fuelCost: 0,
    baseCost: 0, optionsCost: 0, totalCost: 0
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'agent'}>>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [addressDetails, setAddressDetails] = useState({
    pickup: null as google.maps.places.PlaceResult | null,
    delivery: null as google.maps.places.PlaceResult | null
  })
  const [isFormValid, setIsFormValid] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    pickup?: string;
    delivery?: string;
    general?: string;
  }>({});

  useEffect(() => {
    setMounted(true)
    setShowQuote(Object.entries(formData).some(([key, value]) => 
      key !== 'options' && value.toString().trim() !== ''
    ))
    
    // Vérifier la validité des adresses et des champs obligatoires
    const areAddressesValid = Boolean(addressDetails.pickup) && Boolean(addressDetails.delivery)
    const areRequiredFieldsFilled = Boolean(formData.movingDate) && Boolean(formData.volume)
    
    // Mettre à jour les erreurs pour les adresses
    const newErrors: {pickup?: string; delivery?: string} = {};
    if (formData.pickupAddress && !addressDetails.pickup) {
      newErrors.pickup = "Veuillez sélectionner une adresse de départ valide dans les suggestions";
    }
    if (formData.deliveryAddress && !addressDetails.delivery) {
      newErrors.delivery = "Veuillez sélectionner une adresse d'arrivée valide dans les suggestions";
    }
    setFormErrors(prev => ({...prev, ...newErrors}));
    
    setIsFormValid(areAddressesValid && areRequiredFieldsFilled)
  }, [formData, addressDetails])

  const updateQuote = async (newFormData: MovingFormData) => {
    if (!isFormComplete(newFormData, addressDetails)) return
    
    setIsCalculating(true)
    try {
      const details = await calculateMovingQuote(newFormData)
      setQuoteDetails(prev => ({ ...prev, ...details }))
    } catch (error) {
      console.error('Erreur lors du calcul du devis:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleInputChange = (field: keyof MovingFormData, value: string) => {
    console.log(`Modification du champ ${field}:`, value)
    
    // Mettre à jour le formulaire
    const newFormData = {
      ...formData,
      [field]: value
    }

    // Vérifier si c'est un champ d'adresse
    const isAddressField = field === 'pickupAddress' || field === 'deliveryAddress'
    
    setFormData(newFormData)
    
    // Mettre à jour le devis uniquement si ce n'est pas un champ d'adresse
    // et que les deux adresses sont renseignées et valides
    if (!isAddressField && addressDetails.pickup && addressDetails.delivery) {
      updateQuote(newFormData)
    }
  }

  const handlePickupAddressSelect = async (value: string, place?: google.maps.places.PlaceResult) => {
    // Si c'est juste un nombre ou une entrée trop courte, ne pas mettre à jour
    if (/^\d+$/.test(value) || value.length < 5) {
      console.warn("Adresse de départ invalide détectée:", value);
      
      // Mettre à jour l'erreur mais pas l'état
      setFormErrors(prev => ({
        ...prev,
        pickup: "Ce numéro seul n'est pas une adresse valide"
      }));
      
      return;
    }
    
    await handleInputChange('pickupAddress', value)
    
    // Si un lieu valide a été sélectionné
    if (place?.formatted_address) {
      console.log('Adresse de départ valide sélectionnée:', place.formatted_address)
      
      setAddressDetails(prev => ({
        ...prev,
        pickup: place
      }))
      
      // Effacer les erreurs
      setFormErrors(prev => ({
        ...prev,
        pickup: undefined
      }));
      
      // Si les deux adresses sont maintenant valides, mettre à jour le devis
      if (addressDetails.delivery) {
        updateQuote({
          ...formData,
          pickupAddress: place.formatted_address
        })
      }
    }
  }

  const handleDeliveryAddressSelect = async (value: string, place?: google.maps.places.PlaceResult) => {
    // Si c'est juste un nombre ou une entrée trop courte, ne pas mettre à jour
    if (/^\d+$/.test(value) || value.length < 5) {
      console.warn("Adresse de livraison invalide détectée:", value);
      
      // Mettre à jour l'erreur mais pas l'état
      setFormErrors(prev => ({
        ...prev,
        delivery: "Ce numéro seul n'est pas une adresse valide"
      }));
      
      return;
    }
    
    await handleInputChange('deliveryAddress', value)
    
    // Si un lieu valide a été sélectionné
    if (place?.formatted_address) {
      console.log('Adresse de livraison valide sélectionnée:', place.formatted_address)
      
      setAddressDetails(prev => ({
        ...prev,
        delivery: place
      }))
      
      // Effacer les erreurs
      setFormErrors(prev => ({
        ...prev,
        delivery: undefined
      }));
      
      // Si les deux adresses sont maintenant valides, mettre à jour le devis
      if (addressDetails.pickup) {
        updateQuote({
          ...formData,
          deliveryAddress: place.formatted_address
        })
      }
    }
  }

  const handleOptionChange = async (option: keyof MovingFormData['options'], checked: boolean) => {
    // S'assurer que l'option existe dans le type
    if (!formData.options) {
      formData.options = {}
    }
    
    const newOptions = { ...formData.options }
    
    // Vérifier si l'option existe avant de l'assigner
    if (option === 'packaging' || option === 'furniture' || option === 'fragile' || option === 'storage') {
      newOptions[option] = checked
    } else {
      console.warn(`Option inconnue: ${option}`)
      return
    }
    
    const newFormData = {
      ...formData,
      options: newOptions
    }
    
    setFormData(newFormData)
    await updateQuote(newFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier que les adresses sont valides et complètes
    const formIsReady = isFormComplete(formData, addressDetails);
    
    if (!formIsReady) {
      // Afficher un message d'erreur approprié
      console.error('Veuillez remplir tous les champs obligatoires et sélectionner des adresses valides');
      return;
    }
    
    try {
      setIsCalculating(true)
      
      // Extraire les informations géographiques des objets d'adresse pour des calculs plus précis
      const pickupLat = addressDetails.pickup?.geometry?.location?.lat();
      const pickupLng = addressDetails.pickup?.geometry?.location?.lng();
      const deliveryLat = addressDetails.delivery?.geometry?.location?.lat();
      const deliveryLng = addressDetails.delivery?.geometry?.location?.lng();
      
      // Persister le devis dans la base de données avec des informations géographiques précises
      const response = await fetch('/api/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: formData.pickupAddress,
          deliveryAddress: formData.deliveryAddress,
          volume: parseFloat(formData.volume) || 0,
          options: formData.options,
          preferredDate: formData.movingDate,
          preferredTime: 'morning', // Valeur par défaut
          distance: quoteDetails.distance,
          items: [], // À remplir avec les items réels si disponibles
          totalCost: quoteDetails.totalCost,
          // Ajouter les coordonnées géographiques
          pickupCoordinates: pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : undefined,
          deliveryCoordinates: deliveryLat && deliveryLng ? { lat: deliveryLat, lng: deliveryLng } : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du devis')
      }
      
      const result = await response.json()
      
      // Sauvegarder l'ID du devis et les détails dans localStorage pour faciliter la transition
      const quoteData = { 
        id: result.data.id, 
        ...formData, 
        ...quoteDetails,
        persistedId: result.data.id // Important: stocker l'ID de base de données
      }
      
      localStorage.setItem('movingQuote', JSON.stringify(quoteData))
      router.push(`/moving/summary?id=${result.data.id}`)
    } catch (error) {
      console.error('Erreur lors de la soumission du devis:', error)
      // Fallback au comportement précédent en cas d'erreur
      const quoteData = { id: Date.now().toString(), ...formData, ...quoteDetails }
      localStorage.setItem('movingQuote', JSON.stringify(quoteData))
      router.push(`/moving/summary?id=${quoteData.id}`)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMessage.trim()) return

    setMessages(prev => [...prev, { text: currentMessage, sender: 'user' }])
    setCurrentMessage('')

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "Je suis là pour vous aider avec votre devis de déménagement. Avez-vous des questions spécifiques ?",
        sender: 'agent'
      }])
    }, 1000)
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }))
  }

  const handleStorageChange = (value: string | null) => {
    setFormData(prev => ({
      ...prev,
      storage: value === 'yes'
    }))
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-sky-50/50 to-white min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulaire */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-sky-400 via-blue-400 to-sky-400 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 mix-blend-overlay"></div>
              <div className="relative z-10 space-y-3">
                <h1 className="text-4xl font-bold text-white text-center tracking-tight">
                  <span className="inline-block transform hover:scale-105 transition-transform duration-300">
                    Votre Déménagement
                  </span>
                  <br />
                  <span className="relative inline-block mt-1">
                    Sur Mesure
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/50 rounded-full transform origin-left"></div>
                  </span>
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-12 h-0.5 bg-white/30 rounded-full"></div>
                  <div className="text-white/90 text-sm font-medium tracking-wider uppercase">Simple • Rapide • Efficace</div>
                  <div className="w-12 h-0.5 bg-white/30 rounded-full"></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Section Date et Volume */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-3 rounded-xl border border-sky-100/50">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Date de déménagement" labelClass="text-sky-800 font-medium text-sm" icon={<CalendarIcon className="w-3.5 h-3.5" />}>
                    <TextInput
                      type="date"
                      value={formData.movingDate}
                      onChange={(e) => handleInputChange('movingDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full rounded-lg border-sky-200 focus:border-sky-400 focus:ring-sky-400 text-sm py-1.5"
                    />
                  </FormField>

                  <FormField label="Volume (m³)" labelClass="text-sky-800 font-medium text-sm">
                    <TextInput
                      type="number"
                      value={formData.volume}
                      onChange={(e) => handleInputChange('volume', e.target.value)}
                      min="1"
                      required
                      placeholder="30"
                      className="w-full rounded-lg border-sky-200 focus:border-sky-400 focus:ring-sky-400 text-sm py-1.5"
                    />
                  </FormField>
                </div>
              </div>

              {/* Section Adresses */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-3 pt-3 mb-1">
                  <h2 className="inline-flex items-center gap-1.5 text-base font-medium text-emerald-800">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    Point A ➔ Point B
                  </h2>
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  {/* Adresse de départ */}
                  <div className="space-y-3">
                    <FormField label="" labelClass="text-gray-700 text-sm">
                      <PickupAddressAutocomplete
                        id="pickup-address"
                        label="Adresse de départ"
                        value={formData.pickupAddress}
                        onChange={handlePickupAddressSelect}
                        placeholder="Entrez l'adresse de départ"
                        required
                      />
                      {formErrors.pickup && !addressDetails.pickup && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.pickup}</p>
                      )}
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Étage" labelClass="text-gray-700 text-sm">
                        <TextInput
                          type="number"
                          value={formData.pickupFloor}
                          onChange={(e) => handleInputChange('pickupFloor', e.target.value)}
                          min="0"
                          className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                        />
                      </FormField>

                      <FormField label="Ascenseur" labelClass="text-gray-700 text-sm">
                        <Select
                          value={booleanToElevatorValue(formData.pickupElevator)}
                          onChange={(e) => handleInputChange('pickupElevator', e.target.value)}
                          options={[
                            { value: 'yes', label: 'Oui' },
                            { value: 'no', label: 'Non' }
                          ]}
                          className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                        />
                      </FormField>
                    </div>

                    <FormField label="Distance de portage (m)" labelClass="text-gray-700 text-sm">
                      <TextInput
                        type="number"
                        value={formData.pickupCarryDistance}
                        onChange={(e) => handleInputChange('pickupCarryDistance', e.target.value)}
                        placeholder="Distance en mètres"
                        className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                      />
                    </FormField>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="space-y-3">
                    <FormField label="" labelClass="text-gray-700 text-sm">
                      <DeliveryAddressAutocomplete
                        id="delivery-address"
                        label="Adresse d'arrivée"
                        value={formData.deliveryAddress}
                        onChange={handleDeliveryAddressSelect}
                        placeholder="Entrez l'adresse d'arrivée"
                        required
                      />
                      {formErrors.delivery && !addressDetails.delivery && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.delivery}</p>
                      )}
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Étage" labelClass="text-gray-700 text-sm">
                        <TextInput
                          type="number"
                          value={formData.deliveryFloor}
                          onChange={(e) => handleInputChange('deliveryFloor', e.target.value)}
                          min="0"
                          className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                        />
                      </FormField>

                      <FormField label="Ascenseur" labelClass="text-gray-700 text-sm">
                        <Select
                          value={booleanToElevatorValue(formData.deliveryElevator)}
                          onChange={(e) => handleInputChange('deliveryElevator', e.target.value)}
                          options={[
                            { value: 'yes', label: 'Oui' },
                            { value: 'no', label: 'Non' }
                          ]}
                          className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                        />
                      </FormField>
                    </div>

                    <FormField label="Distance de portage (m)" labelClass="text-gray-700 text-sm">
                      <TextInput
                        type="number"
                        value={formData.deliveryCarryDistance}
                        onChange={(e) => handleInputChange('deliveryCarryDistance', e.target.value)}
                        placeholder="Distance en mètres"
                        className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Section Caractéristiques du logement */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-3 rounded-xl border border-sky-100/50">
                <h2 className="inline-flex items-center gap-1.5 text-base font-medium text-emerald-800 mb-2">
                  <HomeIcon className="w-3.5 h-3.5" />
                  Votre Nid Douillet
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Type de propriété" labelClass="text-gray-700 text-sm">
                    <Select
                      value={formData.propertyType}
                      onChange={(e) => handleInputChange('propertyType', e.target.value)}
                      options={[
                        { value: 'apartment', label: 'Appartement' },
                        { value: 'house', label: 'Maison' },
                        { value: 'office', label: 'Bureau' }
                      ]}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                    />
                  </FormField>

                  <FormField label="Surface (m²)" labelClass="text-gray-700 text-sm">
                    <TextInput
                      type="number"
                      value={formData.surface}
                      onChange={(e) => handleInputChange('surface', e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                    />
                  </FormField>

                  <FormField label="Nombre de pièces" labelClass="text-gray-700 text-sm">
                    <TextInput
                      type="number"
                      value={formData.rooms}
                      onChange={(e) => handleInputChange('rooms', e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                    />
                  </FormField>

                  <FormField label="Nombre d'occupants" labelClass="text-gray-700 text-sm">
                    <TextInput
                      type="number"
                      value={formData.occupants}
                      onChange={(e) => handleInputChange('occupants', e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-sm py-1.5"
                    />
                  </FormField>
                </div>
              </div>

              {/* Section Services supplémentaires */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-3 pt-3 mb-1">
                  <h2 className="inline-flex items-center gap-1.5 text-base font-medium text-emerald-800">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    La Cerise sur le Gâteau
                  </h2>
                </div>
                <div className="p-3">
                  <div className="bg-gray-50 border rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {Object.entries(formData.options).map(([key, checked]) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleOptionChange(key as keyof typeof formData.options, e.target.checked)}
                            className="w-3.5 h-3.5 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                          />
                          <span className="text-gray-700 text-sm">{_getServiceLabel(key)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Chat */}
              <div className="relative bg-[#F0F2F5] rounded-xl border border-gray-200 shadow-sm">
                <div className="absolute -top-3 right-3 bg-[#EDFDF5] text-[#0A9669] px-2.5 py-1 rounded-full text-xs font-medium shadow-md ring-[3px] ring-white">
                  En ligne
                </div>
                <div className="px-3 pt-4 pb-2 bg-[#0A9669] rounded-t-xl">
                  <h2 className="inline-flex items-center gap-1.5 text-base font-medium text-white">
                    <div className="relative">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#0A9669] rounded-full"></span>
                    </div>
                    Un Doute ? On Est Là !
                  </h2>
                  <p className="mt-1 text-xs text-white/80">Notre équipe est disponible pour répondre à vos questions</p>
                </div>

                <div className="p-3 pt-1 bg-[#E4DDD6]">
                  <div className="bg-[url('/whatsapp-bg.png')] bg-repeat h-24 overflow-y-auto mb-2 p-2">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`relative mb-2 last:mb-0 ${
                          message.sender === 'user' 
                            ? 'ml-12 text-right' 
                            : 'mr-12'
                        }`}
                      >
                        <div className={`inline-block rounded-lg px-3 py-2 text-sm ${
                          message.sender === 'user'
                            ? 'bg-[#D9FDD3] text-gray-800'
                            : 'bg-white text-gray-800'
                        }`}>
                          {message.text}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${
                          message.sender === 'user'
                            ? 'text-gray-600'
                            : 'text-gray-500'
                        }`}>
                          {message.sender === 'user' ? 'Vous' : 'Assistant'} • Maintenant
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 bg-white p-2 rounded-lg">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                      placeholder="Tapez votre message..."
                      className="flex-1 text-sm border-0 focus:ring-0 placeholder-gray-500 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="p-2 bg-[#0A9669] text-white rounded-full hover:bg-[#098960] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="group relative bg-gradient-to-r from-emerald-400 via-sky-500 to-blue-500 hover:from-emerald-500 hover:via-sky-600 hover:to-blue-600 text-white font-bold py-3 px-12 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                  disabled={!isFormValid}
                >
                  <div className="relative z-10">
                    <span className="block text-base tracking-wide">Valider le devis</span>
                  </div>
                  <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 mix-blend-overlay"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Résumé du devis */}
        {showQuote && (
          <div className="lg:w-1/3">
            <div className="sticky top-8">
              <QuoteSummary
                type="moving"
                id={Date.now().toString()}
                status="pending"
                createdAt={new Date().toISOString()}
                date={formData.movingDate}
                time=""
                estimatedPrice={quoteDetails.totalCost}
                formData={formData}
                quoteDetails={quoteDetails}
                isCalculating={isCalculating}
                addressDetails={addressDetails}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
} 