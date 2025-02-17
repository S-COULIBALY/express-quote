'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput, Select } from '@/components/Form'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { calculateMovingQuote } from '@/actions/calculateMovingQuote'
import type { MovingFormData } from '@/types/quote'
import type { PlaceResult } from '@/types/google-maps'
import { QuoteSummary } from '@/components/QuoteSummary'
import { apiConfig } from '@/config/api'

interface QuoteDetails {
  distance: number
  tollCost: number
  fuelCost: number
  baseCost: number
  optionsCost: number
  totalCost: number
}

const initialFormData: MovingFormData = {
  movingDate: '',
  volume: '',
  pickupAddress: '',
  deliveryAddress: '',
  propertyType: 'apartment',
  surface: '',
  floor: '',
  carryDistance: '',
  occupants: '',
  options: {
    packing: false,
    assembly: false,
    disassembly: false,
    insurance: false,
    storage: false,
    heavyLifting: false,
    basement: false,
    cleaning: false
  },
  pickupFloor: '',
  pickupElevator: 'no',
  deliveryFloor: '',
  deliveryElevator: 'no',
  pickupCarryDistance: '',
  deliveryCarryDistance: '',
  rooms: ''
}

const isFormComplete = (data: MovingFormData): boolean => {
  return !!(data.volume && data.pickupAddress && data.deliveryAddress)
}

const _getServiceLabel = (key: string): string => {
  const labels: Record<string, string> = {
    packing: 'Emballage professionnel',
    assembly: 'Montage meubles',
    disassembly: 'Démontage meubles',
    insurance: 'Assurance premium',
    storage: 'Stockage 1 mois',
    heavyLifting: 'Manutention lourde',
    basement: 'Cave',
    cleaning: 'Nettoyage'
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

  useEffect(() => {
    setMounted(true)
    setShowQuote(Object.entries(formData).some(([key, value]) => 
      key !== 'options' && value.toString().trim() !== ''
    ))
  }, [formData])

  const updateQuote = async (newFormData: MovingFormData) => {
    if (!isFormComplete(newFormData)) return
    
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressSelect = async (type: 'pickup' | 'delivery', place: PlaceResult) => {
    const newFormData = {
      ...formData,
      [`${type}Address`]: place.formatted_address || '',
      [`${type}CarryDistance`]: place.distance ? place.distance.text : ''
    }
    setFormData(newFormData)

    // Calculer la distance si les deux adresses sont renseignées
    if (type === 'delivery' && newFormData.pickupAddress && newFormData.deliveryAddress) {
      const distance = await calculateDistance(newFormData.pickupAddress, newFormData.deliveryAddress)
      setQuoteDetails(prev => ({ ...prev, distance }))
      await updateQuote(newFormData)
    }
  }

  const handleOptionChange = async (option: keyof MovingFormData['options'], checked: boolean) => {
    const newFormData = {
      ...formData,
      options: { ...formData.options, [option]: checked }
    }
    setFormData(newFormData)
    await updateQuote(newFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const quoteData = { id: Date.now().toString(), ...formData, ...quoteDetails }
    localStorage.setItem('movingQuote', JSON.stringify(quoteData))
    router.push(`/moving/summary?id=${quoteData.id}`)
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

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <main className="max-w-3xl mx-auto p-3 sm:p-6 text-sm">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        <h1 className="text-lg sm:text-xl font-bold text-center text-blue-600 mb-6">
          Devis Express
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Section Date et Volume */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormField label="Date de déménagement">
                  <TextInput
                    type="date"
                    value={formData.movingDate}
                    onChange={(e) => handleInputChange('movingDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </FormField>
              </div>

              <div>
                <FormField label="Volume (m³)">
                  <TextInput
                    type="number"
                    value={formData.volume}
                    onChange={(e) => handleInputChange('volume', e.target.value)}
                    min="1"
                    required
                    placeholder="30"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Section Adresses */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <h2 className="text-base font-semibold mb-3 sm:mb-4">Adresses</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Adresse de départ */}
              <div className="space-y-4">
                <FormField label="Adresse de départ">
                  <AddressAutocomplete
                    id="pickup-address"
                    value={formData.pickupAddress}
                    onChange={(value) => handleInputChange('pickupAddress', value)}
                    onSelect={(place) => handleAddressSelect('pickup', place)}
                    placeholder="Entrez l'adresse de départ"
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Étage">
                    <TextInput
                      type="number"
                      value={formData.pickupFloor}
                      onChange={(e) => handleInputChange('pickupFloor', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Ascenseur">
                    <Select
                      value={formData.pickupElevator}
                      onChange={(e) => handleInputChange('pickupElevator', e.target.value)}
                      options={[
                        { value: 'yes', label: 'Oui' },
                        { value: 'no', label: 'Non' }
                      ]}
                    />
                  </FormField>
                </div>
                <FormField label="Distance de portage (m)">
                  <TextInput
                    type="number"
                    value={formData.pickupCarryDistance}
                    onChange={(e) => handleInputChange('pickupCarryDistance', e.target.value)}
                    placeholder="Distance en mètres"
                  />
                </FormField>
              </div>

              {/* Adresse d'arrivée */}
              <div className="space-y-4">
                <FormField label="Adresse d'arrivée">
                  <AddressAutocomplete
                    id="delivery-address"
                    value={formData.deliveryAddress}
                    onChange={(value) => handleInputChange('deliveryAddress', value)}
                    onSelect={(place) => handleAddressSelect('delivery', place)}
                    placeholder="Entrez l'adresse d'arrivée"
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Étage">
                    <TextInput
                      type="number"
                      value={formData.deliveryFloor}
                      onChange={(e) => handleInputChange('deliveryFloor', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Ascenseur">
                    <Select
                      value={formData.deliveryElevator}
                      onChange={(e) => handleInputChange('deliveryElevator', e.target.value)}
                      options={[
                        { value: 'yes', label: 'Oui' },
                        { value: 'no', label: 'Non' }
                      ]}
                    />
                  </FormField>
                </div>
                <FormField label="Distance de portage (m)">
                  <TextInput
                    type="number"
                    value={formData.deliveryCarryDistance}
                    onChange={(e) => handleInputChange('deliveryCarryDistance', e.target.value)}
                    placeholder="Distance en mètres"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Section Caractéristiques du logement */}
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-base font-semibold mb-3 sm:mb-4">Caractéristiques du logement</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Type de propriété">
                <Select
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  options={[
                    { value: 'apartment', label: 'Appartement' },
                    { value: 'house', label: 'Maison' },
                    { value: 'office', label: 'Bureau' }
                  ]}
                  required
                />
              </FormField>

              <FormField label="Surface (m²)">
                <TextInput
                  type="number"
                  value={formData.surface}
                  onChange={(e) => handleInputChange('surface', e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Nombre de pièces">
                <TextInput
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => handleInputChange('rooms', e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Nombre d'occupants">
                <TextInput
                  type="number"
                  value={formData.occupants}
                  onChange={(e) => handleInputChange('occupants', e.target.value)}
                  required
                />
              </FormField>
            </div>
          </div>

          {/* Section Services supplémentaires */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <h2 className="text-base font-semibold mb-3 sm:mb-4">Services supplémentaires</h2>
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {/* Première colonne */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.packing}
                      onChange={(e) => handleOptionChange('packing', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Emballage</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.assembly}
                      onChange={(e) => handleOptionChange('assembly', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Montage meubles</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.disassembly}
                      onChange={(e) => handleOptionChange('disassembly', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Démontage meubles</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.heavyLifting}
                      onChange={(e) => handleOptionChange('heavyLifting', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Objets lourds</span>
                  </label>
                </div>

                {/* Deuxième colonne */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.basement}
                      onChange={(e) => handleOptionChange('basement', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Cave/Grenier</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.insurance}
                      onChange={(e) => handleOptionChange('insurance', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Assurance</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.storage}
                      onChange={(e) => handleOptionChange('storage', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Stockage</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.cleaning}
                      onChange={(e) => handleOptionChange('cleaning', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Nettoyage</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section Chat */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">💬</span>
              <p className="text-xs text-gray-500">
                Questions sur le volume ?
              </p>
            </div>

            <div className="bg-white rounded-lg border h-32 overflow-y-auto mb-2 p-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`text-xs mb-1 ${
                    message.sender === 'user' ? 'text-right text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Votre message..."
                className="flex-1 text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Envoyer
              </button>
            </form>
          </div>
        </form>
      </div>

      {/* Résumé du devis */}
      {showQuote && (
        <QuoteSummary 
          type="moving"
          id=""
          status="pending"
          createdAt={new Date().toISOString()}
          date={formData.movingDate}
          time=""
          estimatedPrice={quoteDetails.totalCost}
          formData={formData}
          quoteDetails={quoteDetails}
          isCalculating={isCalculating}
        />
      )}
    </main>
  )
} 