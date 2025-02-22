'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput } from '@/components/Form'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { calculateMovingQuote } from '@/actions/calculateMovingQuote'
import type { MovingFormData } from '@/types/quote'

export default function NewMovingQuote() {
  const router = useRouter()
  const [formData, setFormData] = useState<MovingFormData>({
    pickupAddress: '',
    deliveryAddress: '',
    volume: '',
    movingDate: '',
    propertyType: 'apartment',
    surface: '',
    floor: '',
    carryDistance: '',
    occupants: '',
    pickupFloor: '',
    pickupElevator: '',
    pickupCarryDistance: '',
    deliveryFloor: '',
    deliveryElevator: '',
    deliveryCarryDistance: '',
    rooms: '',
    options: {
      packing: false,
      assembly: false,
      disassembly: false,
      insurance: false,
      storage: false,
      heavyLifting: false,
      basement: false,
      cleaning: false
    }
  })

  const [quoteDetails, setQuoteDetails] = useState<{
    distance: number;
    tollCost: number;
    fuelCost: number;
    baseCost: number;
    optionsCost: number;
    totalCost: number;
  } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCalculating(true)

    try {
      const quote = await calculateMovingQuote(formData)
      if (quote) {
        setQuoteDetails(quote)
        router.push(`/moving/summary?quote=${encodeURIComponent(JSON.stringify(quote))}`)
      }
    } catch (error) {
      console.error('Error calculating quote:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      volume: e.target.value
    }))
  }

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [name]: checked
      }
    }))
  }

  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Nouveau devis de déménagement</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Le composant AddressAutocomplete gère maintenant les deux champs d'adresse */}
              <AddressAutocomplete />

              {/* Volume */}
              <FormField label="Volume approximatif (m³)">
                <TextInput
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleVolumeChange}
                  placeholder="Entrez le volume"
                  required
                />
              </FormField>

              {/* Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Services additionnels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.options).map(([option, checked]) => (
                    <label key={option} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name={option}
                        checked={checked}
                        onChange={handleOptionChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalculating}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isCalculating ? 'Calcul en cours...' : 'Calculer le devis'}
              </button>
            </form>
          </div>

          {quoteDetails && (
            <div className="lg:col-span-1">
              {/* Affichage du résumé du devis */}
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 