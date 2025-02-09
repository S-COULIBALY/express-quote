'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput } from '@/components/Form'
import { Button } from '@/components/Button'
import { priceUtils } from '@/utils/priceUtils'
import clsx from 'clsx'

interface CleaningFormData {
  cleaningDate: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  propertyType: string
  address: string
  options: {
    windows: boolean
    deepCleaning: boolean
    carpets: boolean
    furniture: boolean
    appliances: boolean
  }
}

interface AdditionalService {
  cost: number
  type: 'fixed' | 'percent'
}

// Tarifs de base selon le type de propriété
const RATES: Record<string, { perM2: number }> = {
  apartment: { perM2: 30 },
  house: { perM2: 35 },
  office: { perM2: 40 }
}

const ADDITIONAL_SERVICES: Record<string, AdditionalService> = {
  windows: { cost: 50, type: 'fixed' },
  deepCleaning: { cost: 0.2, type: 'percent' },
  carpets: { cost: 100, type: 'fixed' },
  furniture: { cost: 75, type: 'fixed' },
  appliances: { cost: 60, type: 'fixed' }
}

export default function NewCleaningQuote() {
  const router = useRouter()
  const [formData, setFormData] = useState<CleaningFormData>({
    cleaningDate: '',
    squareMeters: '',
    numberOfRooms: '',
    numberOfBathrooms: '',
    propertyType: 'apartment',
    address: '',
    options: {
      windows: false,
      deepCleaning: false,
      carpets: false,
      furniture: false,
      appliances: false
    }
  })

  const [showQuote, setShowQuote] = useState(false)
  const [quoteDetails, setQuoteDetails] = useState({
    baseCost: 0,
    optionsCost: 0,
    totalCost: 0
  })

  useEffect(() => {
    const hasValue = Object.entries(formData).some(([key, value]) => {
      if (key === 'options' || key === 'propertyType') return false
      return value.toString().trim() !== ''
    })
    setShowQuote(hasValue)
  }, [formData])

  useEffect(() => {
    if (!formData.squareMeters) return

    const area = parseFloat(formData.squareMeters)
    const rate = RATES[formData.propertyType]
    const baseCost = area * rate.perM2
    
    let optionsCost = 0
    Object.entries(formData.options).forEach(([key, isSelected]) => {
      if (isSelected) {
        const service = ADDITIONAL_SERVICES[key]
        optionsCost += service.type === 'fixed' 
          ? service.cost 
          : baseCost * service.cost
      }
    })

    const totalCost = baseCost + optionsCost

    setQuoteDetails({
      baseCost,
      optionsCost,
      totalCost
    })
  }, [formData.squareMeters, formData.propertyType, formData.options])

  const handleInputBlur = (field: keyof CleaningFormData, value: string) => {
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
      localStorage.setItem('cleaningQuote', JSON.stringify(quoteData))
      router.push(`/cleaning/summary?id=${quoteData.id}`)
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Devis de Nettoyage</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Date de nettoyage">
                <TextInput
                  type="date"
                  defaultValue={formData.cleaningDate}
                  onBlur={(e) => handleInputBlur('cleaningDate', e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Surface (m²)">
                <TextInput
                  type="number"
                  defaultValue={formData.squareMeters}
                  onBlur={(e) => handleInputBlur('squareMeters', e.target.value)}
                  min="1"
                  required
                />
              </FormField>

              <FormField label="Nombre de pièces">
                <TextInput
                  type="number"
                  defaultValue={formData.numberOfRooms}
                  onBlur={(e) => handleInputBlur('numberOfRooms', e.target.value)}
                  min="1"
                  required
                />
              </FormField>

              <FormField label="Nombre de salles de bain">
                <TextInput
                  type="number"
                  defaultValue={formData.numberOfBathrooms}
                  onBlur={(e) => handleInputBlur('numberOfBathrooms', e.target.value)}
                  min="1"
                  required
                />
              </FormField>

              <FormField label="Type de propriété">
                <select
                  defaultValue={formData.propertyType}
                  onBlur={(e) => handleInputBlur('propertyType', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="apartment">Appartement</option>
                  <option value="house">Maison</option>
                  <option value="office">Bureau</option>
                </select>
              </FormField>

              <FormField label="Adresse">
                <TextInput
                  type="text"
                  defaultValue={formData.address}
                  onBlur={(e) => handleInputBlur('address', e.target.value)}
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
                      <span>{key === 'deepCleaning' ? 'Nettoyage en profondeur' : 
                             key === 'windows' ? 'Nettoyage des vitres' :
                             key === 'carpets' ? 'Nettoyage des tapis' :
                             key === 'furniture' ? 'Nettoyage des meubles' :
                             'Nettoyage des électroménagers'}</span>
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
                  {formData.cleaningDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date prévue</span>
                      <span className="font-medium">
                        {new Date(formData.cleaningDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {formData.propertyType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de bien</span>
                      <span className="font-medium">
                        {formData.propertyType === 'apartment' ? 'Appartement' :
                         formData.propertyType === 'house' ? 'Maison' : 'Bureau'}
                      </span>
                    </div>
                  )}

                  {formData.squareMeters && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Surface</span>
                      <span className="font-medium">{formData.squareMeters} m²</span>
                    </div>
                  )}

                  {formData.numberOfRooms && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre de pièces</span>
                      <span className="font-medium">{formData.numberOfRooms}</span>
                    </div>
                  )}

                  {formData.numberOfBathrooms && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre de salles de bain</span>
                      <span className="font-medium">{formData.numberOfBathrooms}</span>
                    </div>
                  )}

                  {formData.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adresse</span>
                      <span className="font-medium text-right">{formData.address}</span>
                    </div>
                  )}

                  {/* Services supplémentaires sélectionnés */}
                  {Object.entries(formData.options).some(([_, value]) => value) && (
                    <div className="pt-4 border-t">
                      <h3 className="text-gray-600 mb-2">Services supplémentaires</h3>
                      <div className="space-y-2">
                        {Object.entries(formData.options).map(([key, value]) => value && (
                          <div key={key} className="flex justify-between text-sm">
                            <span>{key === 'deepCleaning' ? 'Nettoyage en profondeur' : 
                                   key === 'windows' ? 'Nettoyage des vitres' :
                                   key === 'carpets' ? 'Nettoyage des tapis' :
                                   key === 'furniture' ? 'Nettoyage des meubles' :
                                   'Nettoyage des électroménagers'}</span>
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
                        <span className="text-gray-600">Nettoyage de base</span>
                        <span className="font-medium">{priceUtils.format(quoteDetails.baseCost)}</span>
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