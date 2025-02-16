'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField } from '@/components/Form'
import { Button } from '@/components/Button'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { calculateMovingQuote } from '@/actions/calculateMovingQuote'
import type { MovingFormData } from '@/types/quote'
import clsx from 'clsx'
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
  options: {
    packing: false,
    assembly: false,
    disassembly: false,
    insurance: false,
    storage: false
  }
}

const isFormComplete = (data: MovingFormData): boolean => {
  return !!(data.volume && data.pickupAddress && data.deliveryAddress)
}

const getServiceLabel = (key: string): string => {
  const labels: Record<string, string> = {
    packing: 'Emballage professionnel',
    assembly: 'Montage des meubles',
    disassembly: 'Démontage des meubles',
    insurance: 'Assurance tous risques',
    storage: 'Stockage temporaire'
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

  const handleInputBlur = async (field: keyof MovingFormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    await updateQuote(newFormData)
  }

  const handleAddressSelect = async (type: 'pickup' | 'delivery', place: google.maps.places.PlaceResult) => {
    if (!place.formatted_address) return

    const newFormData = {
      ...formData,
      [type === 'pickup' ? 'pickupAddress' : 'deliveryAddress']: place.formatted_address
    }

    setFormData(newFormData)

    const hasPickupAddress = type === 'pickup' ? place.formatted_address : formData.pickupAddress
    const hasDeliveryAddress = type === 'delivery' ? place.formatted_address : formData.deliveryAddress

    if (hasPickupAddress && hasDeliveryAddress) {
      setIsCalculating(true)
      try {
        const details = await calculateMovingQuote({
          ...newFormData,
          pickupAddress: hasPickupAddress,
          deliveryAddress: hasDeliveryAddress
        })

        setQuoteDetails({
          distance: details.distance,
          tollCost: details.tollCost,
          fuelCost: details.fuelCost,
          baseCost: details.baseCost,
          optionsCost: details.optionsCost,
          totalCost: details.totalCost
        })
      } catch (error) {
        console.error('Erreur lors du calcul du devis:', error)
      } finally {
        setIsCalculating(false)
      }
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

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className={clsx("flex flex-col lg:flex-row gap-8",
          showQuote ? "lg:justify-between" : "items-center justify-center")}>
          
          {/* Formulaire */}
          <div className={clsx("bg-white rounded-lg shadow-md p-6 w-full",
            showQuote ? "lg:w-1/2" : "lg:w-3/4 max-w-3xl mx-auto")}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Devis de Déménagement</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Date de déménagement">
                <input type="date" value={formData.movingDate}
                  onChange={e => handleInputBlur('movingDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" required />
              </FormField>

              <FormField label="Volume estimé (m³)">
                <input type="number" value={formData.volume} min="1" step="0.5"
                  onChange={e => handleInputBlur('volume', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" required />
              </FormField>

              <FormField label="Adresse de départ">
                <AddressAutocomplete
                  id="pickup-address"
                  value={formData.pickupAddress}
                  onChange={value => handleInputBlur('pickupAddress', value)}
                  onSelect={place => handleAddressSelect('pickup', place)}
                  placeholder="Adresse de départ"
                  required
                />
              </FormField>

              <FormField label="Adresse d'arrivée">
                <AddressAutocomplete
                  id="delivery-address"
                  value={formData.deliveryAddress}
                  onChange={value => handleInputBlur('deliveryAddress', value)}
                  onSelect={place => handleAddressSelect('delivery', place)}
                  placeholder="Adresse d'arrivée"
                  required
                />
              </FormField>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Services supplémentaires</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.options).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input type="checkbox" checked={value}
                        onChange={e => handleOptionChange(
                          key as keyof MovingFormData['options'],
                          e.target.checked
                        )}
                        className="rounded border-gray-300" />
                      <span>{getServiceLabel(key)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                Valider le devis
              </Button>
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
        </div>
      </div>
    </main>
  )
} 