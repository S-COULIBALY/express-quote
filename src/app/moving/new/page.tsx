'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { FormField, TextInput, Select } from '@/components/Form'
import { PickupAddressAutocomplete, DeliveryAddressAutocomplete } from '@/components/AddressAutocomplete'
import { QuoteSummary } from '@/components/QuoteSummary'
import { apiConfig } from '@/config/api'
import { calculateMovingQuote } from '@/actions/calculateMovingQuote'
import type { MovingFormData } from '@/types/quote'
import type { PlaceResult } from '@/types/google-maps'
import { Button } from '@/components/Button'

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
  volumeCost?: number
  distancePrice?: number
  signature?: string
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
    storage: false,
    disassembly: false,
    unpacking: false,
    supplies: false,
    fragileItems: false
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
    fragile: 'Assurance premium',
    storage: 'Stockage',
    disassembly: 'Démontage de meubles',
    unpacking: 'Déballages',
    supplies: 'Fournitures',
    fragileItems: 'Objets fragiles'
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

// Structure enrichie pour les messages
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
  isRead?: boolean;
}

export default function NewMovingQuote() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState<MovingFormData>(initialFormData)
  const [showQuote, setShowQuote] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showQuoteSummary, setShowQuoteSummary] = useState(false)
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    distance: 0, tollCost: 0, fuelCost: 0,
    baseCost: 0, optionsCost: 0, totalCost: 0
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
  const [isAgentTyping, setIsAgentTyping] = useState(false)

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
    // Afficher l'état complet du devis pour inspection
    console.log('État du devis de déménagement:', {
      formData: newFormData,
      quoteDetails,
      addressDetails
    });
    
    if (!isFormComplete(newFormData, addressDetails)) return
    
    setIsCalculating(true)
    try {
      // Utiliser la fonction de calcul pour les devis de déménagement
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
    if (option === 'packaging' || option === 'furniture' || option === 'fragile' || 
        option === 'storage' || option === 'disassembly' || option === 'unpacking' ||
        option === 'supplies' || option === 'fragileItems') {
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
      console.error('Veuillez remplir tous les champs obligatoires et sélectionner des adresses valides');
      return;
    }
    
    try {
      setIsCalculating(true)
      
      // Extraire les informations géographiques des objets d'adresse
      const pickupLat = addressDetails.pickup?.geometry?.location?.lat();
      const pickupLng = addressDetails.pickup?.geometry?.location?.lng();
      const deliveryLat = addressDetails.delivery?.geometry?.location?.lat();
      const deliveryLng = addressDetails.delivery?.geometry?.location?.lng();
      
      // Préparer l'objet de conversation pour l'API
      const conversationData = messages.length > 0 ? {
        messages: messages,
        summary: extractConversationSummary(messages) // Fonction à implémenter pour extraire les points clés
      } : undefined;
      
      // Persister le devis dans la base de données avec les conversations
      const response = await fetch('/api/moving', {
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
          
          // Inclure les détails du calcul
          totalCost: quoteDetails.totalCost,
          baseCost: quoteDetails.baseCost,
          volumeCost: quoteDetails.volumeCost,
          distancePrice: quoteDetails.distancePrice,
          optionsCost: quoteDetails.optionsCost,
          signature: quoteDetails.signature,
          
          // Ajouter les coordonnées géographiques
          pickupCoordinates: pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : undefined,
          deliveryCoordinates: deliveryLat && deliveryLng ? { lat: deliveryLat, lng: deliveryLng } : undefined,
          
          // Ajouter les données de conversation
          conversation: conversationData
        })
      })

      // Gérer les réponses non-OK (erreurs HTTP)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur HTTP lors de la création du devis:', response.status, errorData);
        throw new Error(errorData.error || `Erreur ${response.status} lors de la création du devis`);
      }
      
      // Analyser la réponse JSON
      const result = await response.json();
      
      // Vérifier que la réponse contient des données valides
      if (!result.success || !result.data || !result.data.id) {
        console.error('Réponse invalide de l\'API:', result);
        throw new Error('Réponse invalide de l\'API');
      }
      
      // Sauvegarder l'ID du devis et les détails dans localStorage
      const quoteData = { 
        id: result.data.id, 
        ...formData, 
        ...quoteDetails,
        persistedId: result.data.id,
        conversation: conversationData // Inclure la conversation dans les données stockées
      }
      
      console.log('Devis persisté avec succès, ID:', result.data.id);
      localStorage.setItem('movingQuote', JSON.stringify(quoteData));
      router.push(`/moving/summary?id=${result.data.id}`);
    } catch (error) {
      console.error('Erreur lors de la soumission du devis:', error);
      
      // Créer un ID temporaire basé sur la date actuelle
      const tempId = Date.now().toString();
      
      // Fallback au comportement précédent en cas d'erreur
      const quoteData = { 
        id: tempId, 
        ...formData, 
        ...quoteDetails,
        // Ne pas ajouter de persistedId car le devis n'est pas persisté
      };
      
      console.log('Utilisation du mode fallback avec ID temporaire:', tempId);
      localStorage.setItem('movingQuote', JSON.stringify(quoteData));
      router.push(`/moving/summary?id=${tempId}`);
    } finally {
      setIsCalculating(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMessage.trim()) return

    // Créer un nouveau message avec ID et timestamp
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: currentMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      isRead: true
    }
    
    // Ajouter le message à l'état
    setMessages(prev => [...prev, newMessage])
    setCurrentMessage('')

    // Simuler un état "en train d'écrire"
    setIsAgentTyping(true)
    
    try {
      // Envoyer le message au backend pour traitement (optionnel)
      // Cela permettrait de générer des réponses plus intelligentes
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          context: {
            formData,
            previousMessages: messages
          }
        })
      })

      // Si le backend répond (système avancé)
      if (response.ok) {
        const data = await response.json()
        
        // Ajouter la réponse de l'agent
        const agentMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          text: data.reply || "Je suis là pour vous aider avec votre devis de déménagement. Avez-vous des questions spécifiques ?",
          sender: 'agent',
          timestamp: new Date().toISOString(),
          isRead: false
        }
        
        setMessages(prev => [...prev, agentMessage])
      } else {
        // Réponse par défaut si le backend ne répond pas
        setTimeout(() => {
          const agentMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            text: "Je suis là pour vous aider avec votre devis de déménagement. Avez-vous des questions spécifiques ?",
            sender: 'agent', 
            timestamp: new Date().toISOString(),
            isRead: false
          }
          setMessages(prev => [...prev, agentMessage])
          setIsAgentTyping(false)
        }, 1500)
      }
    } catch (error) {
      console.error('Erreur lors de la communication avec l\'agent:', error)
      
      // Réponse par défaut en cas d'erreur
      setTimeout(() => {
        const agentMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          text: "Je suis là pour vous aider avec votre devis de déménagement. Avez-vous des questions spécifiques ?",
          sender: 'agent',
          timestamp: new Date().toISOString(),
          isRead: false
        }
        setMessages(prev => [...prev, agentMessage])
        setIsAgentTyping(false)
      }, 1500)
    } finally {
      setIsAgentTyping(false)
    }
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

  // Fonction utilitaire pour extraire les points clés de la conversation
  const extractConversationSummary = (messages: ChatMessage[]): string => {
    // Filtrer pour ne garder que les messages de l'utilisateur
    const userMessages = messages.filter(m => m.sender === 'user');
    
    // Si très peu de messages, retourner tout
    if (userMessages.length <= 2) {
      return userMessages.map(m => m.text).join(' | ');
    }
    
    // Sinon, prendre le premier et les deux derniers messages
    return [
      userMessages[0],
      ...userMessages.slice(-2)
    ].map(m => m.text).join(' | ');
  }

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = () => {
    setMessages(messages.map(msg => 
      msg.sender === 'agent' && !msg.isRead 
        ? {...msg, isRead: true} 
        : msg
    ));
  }

  // Gestionnaire de focus pour le champ de texte
  const handleChatFocus = () => {
    markMessagesAsRead();
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-sky-50/50 to-white min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Formulaire */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* En-tête fixe sur mobile */}
            <div className="fixed lg:relative top-[64px] lg:top-0 left-0 right-0 z-40 bg-gradient-to-r from-sky-400 via-blue-400 to-sky-400">
              <div className="container mx-auto p-3 sm:p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10 space-y-1 sm:space-y-2">
                  <h1 className="text-xl sm:text-3xl font-bold text-white text-center tracking-tight">
                    <span className="inline-block transform hover:scale-105 transition-transform duration-300">
                      Votre Déménagement
                    </span>
                    <br />
                    <span className="relative inline-block mt-0.5 sm:mt-1">
                      Sur Mesure
                      <div className="absolute -bottom-0.5 sm:-bottom-1 left-0 right-0 h-0.5 bg-white/50 rounded-full transform origin-left"></div>
                    </span>
                  </h1>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-6 sm:w-8 h-0.5 bg-white/30 rounded-full"></div>
                    <div className="text-white/90 text-[10px] sm:text-xs font-medium tracking-wider uppercase">Simple • Rapide • Efficace</div>
                    <div className="w-6 sm:w-8 h-0.5 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 mt-[76px] lg:mt-0">
              {/* Section Date et Volume */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-3 rounded-xl border border-sky-100/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-2.5 rounded-xl border border-sky-100/50">
                <h2 className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 mb-2">
                  <HomeIcon className="w-3.5 h-3.5" />
                  Votre Nid Douillet
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <FormField label="Type" labelClass="text-gray-700 text-xs">
                    <Select
                      value={formData.propertyType}
                      onChange={(e) => handleInputChange('propertyType', e.target.value)}
                      options={[
                        { value: 'apartment', label: 'Appartement' },
                        { value: 'house', label: 'Maison' },
                        { value: 'office', label: 'Bureau' }
                      ]}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-xs py-1"
                    />
                  </FormField>

                  <FormField label="Surface m²" labelClass="text-gray-700 text-xs">
                    <TextInput
                      type="number"
                      value={formData.surface}
                      onChange={(e) => handleInputChange('surface', e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-xs py-1"
                    />
                  </FormField>

                  <FormField label="Pièces" labelClass="text-gray-700 text-xs">
                    <TextInput
                      type="number"
                      value={formData.rooms}
                      onChange={(e) => handleInputChange('rooms', e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-xs py-1"
                    />
                  </FormField>

                  <FormField label="Occupants" labelClass="text-gray-700 text-xs">
                    <TextInput
                      type="number"
                      value={formData.occupants}
                      onChange={(e) => handleInputChange('occupants', e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-200 focus:border-sky-500 focus:ring-sky-500 text-xs py-1"
                    />
                  </FormField>
                </div>
              </div>

              {/* Section Services supplémentaires */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-2.5 pt-2.5">
                  <h2 className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    La Cerise sur le Gâteau
                  </h2>
                </div>
                <div className="p-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                    {Object.entries(formData.options).map(([key, checked]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => handleOptionChange(key as keyof typeof formData.options, e.target.checked)}
                          className="w-3.5 h-3.5 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <span className="text-gray-700 text-xs">{_getServiceLabel(key)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bouton pour afficher/masquer le chat */}
              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className="w-full bg-white rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="p-1.5 bg-emerald-50 rounded-lg shadow-inner">
                        <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Vos commentaires et questions ?</h3>
                      <p className="text-xs text-gray-500">Notre équipe à besoin de vos commentaires pour bien affiner votre VOLUME et vous faire de meilleurs propositions de prix.</p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${showChat ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Section Chat - Design Modernisé et Discret */}
              {showChat && (
                <div className="relative bg-white rounded-xl shadow-sm overflow-hidden border border-gray-300">
                  {/* Badge en ligne */}
                  <div className="absolute -top-3 right-3 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm ring-[2px] ring-white">
                    <span className="flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                      </span>
                      En ligne
                    </span>
                  </div>
                  
                  {/* En-tête du chat - couleur assortie au bouton d'envoi */}
                  <div className="px-3 pt-2 pb-2 bg-emerald-500 relative">
                    <div className="relative z-10">
                      <h2 className="flex items-center gap-1.5 text-base font-bold text-white">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Un Doute ? On Est Là !
                      </h2>
                      <p className="text-xs text-white/90">
                        Notre équipe est disponible pour répondre à vos questions
                      </p>
                    </div>
                    
                    {/* Ligne de séparation plus subtile sur fond foncé */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20"></div>
                  </div>

                  {/* Corps du chat - TEXTE ALIGNÉ À GAUCHE DANS LES BULLES VERTES */}
                  <div className="bg-gray-50 h-56 overflow-y-auto mb-1 p-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`relative mb-1.5 last:mb-0 ${
                          message.sender === 'user' 
                            ? 'ml-16 text-right' 
                            : 'mr-16'
                        }`}
                      >
                        <div className={`inline-block rounded-lg px-2.5 py-1.5 text-xs max-w-[70%] break-words text-left ${
                          message.sender === 'user'
                            ? 'bg-[#E7FFDB] text-gray-800'
                            : 'bg-white text-gray-800 shadow-sm'
                        }`}>
                          {message.text}
                        </div>
                        <div className={`text-[9px] mt-0.5 ${
                          message.sender === 'user'
                            ? 'text-gray-500'
                            : 'text-gray-400'
                        }`}>
                          {message.sender === 'user' ? 'Vous' : 'Assistant'} • {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {message.sender === 'user' && (
                            <span className="ml-1">
                              {message.isRead ? (
                                <svg className="w-2.5 h-2.5 inline text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-2.5 h-2.5 inline text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Indicateur "en train d'écrire" */}
                    {isAgentTyping && (
                      <div className="mr-16 mb-1.5">
                        <div className="inline-block rounded-lg px-2.5 py-1.5 text-xs bg-gray-100 text-gray-800">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Zone de saisie - AVEC RETOUR À LA LIGNE ET PLUS DE HAUTEUR */}
                  <div className="p-2 bg-white border-t border-gray-200">
                    <div className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2 shadow-inner transition-all">
                      {/* Bouton emoji (optionnel) */}
                      <button type="button" className="text-gray-400 hover:text-emerald-500 transition-colors mt-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                        </svg>
                      </button>
                      
                      {/* Champ de saisie remplacé par textarea */}
                      <textarea
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onFocus={handleChatFocus}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage(e)
                          }
                        }}
                        placeholder="Tapez votre message..."
                        className="flex-1 text-xs border-0 ring-0 focus:ring-0 focus:outline-none placeholder-gray-500 bg-transparent py-1 min-h-[40px] max-h-[80px] resize-none overflow-auto"
                        rows={2}
                      />
                      
                      {/* Bouton d'envoi */}
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className={`p-1.5 rounded-full mt-1 ${
                          currentMessage.trim() 
                            ? 'bg-emerald-500 text-white shadow-sm hover:shadow-md' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        } transition-all`}
                        disabled={!currentMessage.trim()}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

        {/* Bouton pour afficher/masquer le résumé */}
        {showQuote && (
          <button
            type="button"
            onClick={() => setShowQuoteSummary(!showQuoteSummary)}
            className="lg:hidden w-full bg-white rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-all duration-200 mb-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="p-1.5 bg-sky-50 rounded-lg shadow-inner">
                    <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-sky-500 rounded-full ring-2 ring-white"></span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Résumé du devis</h3>
                  <p className="text-xs text-gray-500">Voir les détails de votre devis</p>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${showQuoteSummary ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        )}

        {/* Résumé du devis */}
        {showQuote && (
          <div className={`lg:w-1/3 ${showQuoteSummary ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-8">
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