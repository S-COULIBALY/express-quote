'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput } from '@/components/Form'
import { Button } from '@/components/Button'
import { priceUtils } from '@/utils/priceUtils'
import clsx from 'clsx'

interface MovingFormData {
  movingDate: string
  volume: string
  pickupAddress: string
  deliveryAddress: string
  options: {
    packing: boolean
    assembly: boolean
    disassembly: boolean
    insurance: boolean
    storage: boolean
  }
}

interface AdditionalService {
  cost: number
  type: 'fixed' | 'percent'
}

// Ajout de types pour les constantes
const RATES: Record<string, { perKm: number; perM3: number }> = {
  small: { perKm: 1.5, perM3: 40 },
  medium: { perKm: 2.0, perM3: 50 },
  large: { perKm: 2.5, perM3: 60 }
}

const ADDITIONAL_SERVICES: Record<string, AdditionalService> = {
  packing: { cost: 200, type: 'fixed' },
  assembly: { cost: 150, type: 'fixed' },
  disassembly: { cost: 100, type: 'fixed' },
  insurance: { cost: 0.1, type: 'percent' },
  storage: { cost: 50, type: 'fixed' }
}

export default function NewMovingQuote() {
  const router = useRouter()
  const [formData, setFormData] = useState<MovingFormData>({
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
  })

  const [showQuote, setShowQuote] = useState(false)
  const [quoteDetails, setQuoteDetails] = useState({
    distance: 120,
    tollCost: 25,
    baseCost: 0,
    optionsCost: 0,
    totalCost: 0
  })

  useEffect(() => {
    const hasValue = Object.entries(formData).some(([key, value]) => {
      if (key === 'options') return false
      return value.toString().trim() !== ''
    })
    setShowQuote(hasValue)
  }, [formData])

  useEffect(() => {
    if (!formData.volume) return

    const volume = parseFloat(formData.volume)
    const rate = RATES.medium
    const baseCost = (volume * rate.perM3) + (quoteDetails.distance * rate.perKm)
    
    let optionsCost = 0
    Object.entries(formData.options).forEach(([key, isSelected]) => {
      if (isSelected) {
        const service = ADDITIONAL_SERVICES[key]
        optionsCost += service.type === 'fixed' 
          ? service.cost 
          : baseCost * service.cost
      }
    })

    const totalCost = baseCost + quoteDetails.tollCost + optionsCost

    setQuoteDetails(prev => ({
      ...prev,
      baseCost,
      optionsCost,
      totalCost
    }))
  }, [formData.volume, formData.options])

  const handleInputBlur = (field: keyof MovingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Stocker les données dans le localStorage
      const quoteData = {
        id: Date.now().toString(),
        ...formData,
        ...quoteDetails
      }
      localStorage.setItem('movingQuote', JSON.stringify(quoteData))
      router.push(`/moving/summary?id=${quoteData.id}`)
    } catch (error) {
      console.error('Error saving quote:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className={clsx(
          "flex flex-col lg:flex-row gap-8",
          showQuote ? "lg:justify-between" : "items-center justify-center"
        )}>
          {/* Formulaire */}
          <div className={clsx(
            "bg-white rounded-lg shadow-md p-6 w-full",
            showQuote ? "lg:w-1/2" : "lg:w-3/4 max-w-3xl mx-auto"
          )}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Devis de Déménagement</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Date de déménagement">
                <TextInput
                  type="date"
                  defaultValue={formData.movingDate}
                  onBlur={(e) => handleInputBlur('movingDate', e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Volume estimé (m³)">
                <TextInput
                  type="number"
                  defaultValue={formData.volume}
                  onBlur={(e) => handleInputBlur('volume', e.target.value)}
                  min="1"
                  required
                />
              </FormField>

              <FormField label="Adresse de départ">
                <TextInput
                  type="text"
                  defaultValue={formData.pickupAddress}
                  onBlur={(e) => handleInputBlur('pickupAddress', e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Adresse d'arrivée">
                <TextInput
                  type="text"
                  defaultValue={formData.deliveryAddress}
                  onBlur={(e) => handleInputBlur('deliveryAddress', e.target.value)}
                  required
                />
              </FormField>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Services supplémentaires</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(ADDITIONAL_SERVICES).map(([key, service]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.options[key as keyof typeof formData.options]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          options: {
                            ...prev.options,
                            [key]: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{key === 'packing' ? 'Emballage professionnel' : 
                             key === 'assembly' ? 'Montage des meubles' :
                             key === 'disassembly' ? 'Démontage des meubles' :
                             key === 'insurance' ? 'Assurance tous risques' :
                             'Stockage temporaire'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Résumé du devis */}
          {showQuote && (
            <div className="w-full lg:w-1/2 transition-all duration-500 ease-in-out animate-fade-in">
              <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Détails du Devis</h2>
                
                <div className="space-y-4">
                  {/* Informations de base */}
                  {formData.movingDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date prévue</span>
                      <span className="font-medium">
                        {new Date(formData.movingDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {formData.volume && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-medium">{formData.volume} m³</span>
                    </div>
                  )}

                  {formData.pickupAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adresse de départ</span>
                      <span className="font-medium text-right">{formData.pickupAddress}</span>
                    </div>
                  )}

                  {formData.deliveryAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adresse d'arrivée</span>
                      <span className="font-medium text-right">{formData.deliveryAddress}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance estimée</span>
                    <span className="font-medium">{quoteDetails.distance} km</span>
                  </div>

                  {/* Services supplémentaires sélectionnés */}
                  {Object.entries(formData.options).some(([_, value]) => value) && (
                    <div className="pt-4 border-t">
                      <h3 className="text-gray-600 mb-2">Services supplémentaires</h3>
                      <div className="space-y-2">
                        {Object.entries(formData.options).map(([key, value]) => value && (
                          <div key={key} className="flex justify-between text-sm">
                            <span>{key === 'packing' ? 'Emballage professionnel' : 
                                   key === 'assembly' ? 'Montage des meubles' :
                                   key === 'disassembly' ? 'Démontage des meubles' :
                                   key === 'insurance' ? 'Assurance tous risques' :
                                   'Stockage temporaire'}</span>
                            <span className="font-medium">
                              {ADDITIONAL_SERVICES[key].type === 'fixed' 
                                ? priceUtils.format(ADDITIONAL_SERVICES[key].cost)
                                : `+${ADDITIONAL_SERVICES[key].cost * 100}%`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coûts */}
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coût de base</span>
                        <span className="font-medium">{priceUtils.format(quoteDetails.baseCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais de péage</span>
                        <span className="font-medium">{priceUtils.format(quoteDetails.tollCost)}</span>
                      </div>
                      {quoteDetails.optionsCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Services supplémentaires</span>
                          <span className="font-medium">{priceUtils.format(quoteDetails.optionsCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-lg font-bold">Total TTC</span>
                        <span className="text-lg font-bold text-blue-600">
                          {priceUtils.format(quoteDetails.totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full mt-6"
                >
                  Continuer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 