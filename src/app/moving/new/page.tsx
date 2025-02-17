'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput, Select } from '@/components/Form'
import { Button } from '@/components/Button'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { calculateMovingQuote } from '@/actions/calculateMovingQuote'
import type { MovingFormData } from '@/types/quote'
import type { PlaceResult } from '@/types/google-maps'
import { QuoteSummary } from '@/components/QuoteSummary'

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

const getServiceLabel = (key: string): string => {
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

export default function NewMovingQuote() {
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
    setFormData(prev => ({
      ...prev,
      [`${type}Address`]: place.formatted_address || '',
      [`${type}CarryDistance`]: place.distance ? place.distance.text : ''
    }))
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

  return (
    <main className="max-w-3xl mx-auto p-3 sm:p-6 text-sm">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        <h1 className="text-lg sm:text-xl font-bold text-center text-blue-600 mb-6">
          Devis Express
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Section Date et Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-blue-50 p-4 sm:p-6 rounded-lg">
            <FormField label="Date de déménagement">
              <TextInput
                type="date"
                value={formData.movingDate}
                onChange={(e) => handleInputChange('movingDate', e.target.value)}
                className="w-full"
                required
              />
            </FormField>

            <FormField label="Volume (m³)">
              <TextInput
                type="number"
                value={formData.volume}
                onChange={(e) => handleInputChange('volume', e.target.value)}
                className="w-full"
                required
              />
            </FormField>
          </div>

          {/* Section Adresses */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-base font-semibold mb-3 sm:mb-4">Adresses</h2>
            <div className="grid grid-cols-1 gap-6">
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
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-base font-semibold mb-3 sm:mb-4">Caractéristiques du logement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField label="Type">
                <Select
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  options={[
                    { value: 'apartment', label: 'Appartement' },
                    { value: 'house', label: 'Maison' },
                    { value: 'studio', label: 'Studio' }
                  ]}
                />
              </FormField>

              <FormField label="Surface (m²)">
                <TextInput
                  type="number"
                  value={formData.surface}
                  onChange={(e) => handleInputChange('surface', e.target.value)}
                />
              </FormField>

              <FormField label="Nombre de pièces">
                <TextInput
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => handleInputChange('rooms', e.target.value)}
                />
              </FormField>

              <FormField label="Nombre d'occupants">
                <TextInput
                  type="number"
                  value={formData.occupants}
                  onChange={(e) => handleInputChange('occupants', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Section Services supplémentaires */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-base font-semibold mb-3 sm:mb-4">Services supplémentaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3">
              {Object.entries(formData.options).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleOptionChange(
                      key as keyof MovingFormData['options'],
                      e.target.checked
                    )}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">{getServiceLabel(key)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section Chat */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h2 className="text-sm font-medium text-gray-600">💬</h2>
              <p className="text-xs text-gray-500">
                Discutons ici du remplissage de votre logement pour mieux ajuster le volume
              </p>
            </div>
            
            <div className="bg-white rounded-lg border h-48 sm:h-64 mb-3 sm:mb-4 overflow-y-auto p-3 sm:p-4">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`mb-2 ${
                    message.sender === 'user' 
                      ? 'text-right' 
                      : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
              />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-2"
              >
                Envoyer
              </Button>
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