'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField } from '@/components/Form'
import { Button } from '@/components/Button'
import { calculateCleaningQuote } from '@/actions/calculateCleaningQuote'
import type { CleaningFormData } from '@/types/quote'
import clsx from 'clsx'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { CleaningQuoteSummary } from '@/components/CleaningQuoteSummary'

interface QuoteDetails {
  basePrice: number
  frequencyDiscount: number
  totalCost: number
}

const initialFormData: CleaningFormData = {
  cleaningDate: '',
  cleaningType: 'standard',
  squareMeters: '',
  numberOfRooms: '',
  numberOfBathrooms: '',
  frequency: 'oneTime',
  address: '',
  options: {
    windows: false,
    deepCleaning: false,
    carpets: false,
    furniture: false,
    appliances: false
  }
}

const isFormComplete = (data: CleaningFormData): boolean => {
  return !!(data.squareMeters && data.numberOfRooms && 
    data.numberOfBathrooms && data.address)
}

const getFrequencyLabel = (frequency: string): string => {
  const labels: Record<string, string> = {
    oneTime: 'Une fois',
    weekly: 'Hebdomadaire',
    biweekly: 'Bi-mensuel',
    monthly: 'Mensuel'
  }
  return labels[frequency] || frequency
}

const getCleaningTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    standard: 'Standard',
    deep: 'Grand nettoyage',
    movingOut: 'Fin de bail',
    postConstruction: 'Après travaux'
  }
  return labels[type] || type
}

export default function NewCleaningQuote() {
  const router = useRouter()
  const [formData, setFormData] = useState<CleaningFormData>(initialFormData)
  const [showQuote, setShowQuote] = useState(false)
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    basePrice: 0,
    frequencyDiscount: 0,
    totalCost: 0
  })
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    setShowQuote(Object.entries(formData).some(([_, value]) => 
      value.toString().trim() !== ''
    ))
  }, [formData])

  const updateQuote = async (newFormData: CleaningFormData) => {
    if (!isFormComplete(newFormData)) return
    setIsCalculating(true)
    try {
      const details = await calculateCleaningQuote(newFormData)
      setQuoteDetails(prev => ({ ...prev, ...details }))
    } catch (error) {
      console.error('Erreur lors du calcul du devis:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleInputChange = async (field: keyof CleaningFormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    await updateQuote(newFormData)
  }

  const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
    if (place.formatted_address) {
      handleInputChange('address', place.formatted_address)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const quoteData = { id: Date.now().toString(), ...formData, ...quoteDetails }
    localStorage.setItem('cleaningQuote', JSON.stringify(quoteData))
    router.push(`/cleaning/summary?id=${quoteData.id}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className={clsx("flex flex-col lg:flex-row gap-8",
          showQuote ? "lg:justify-between" : "items-center justify-center")}>
          
          {/* Formulaire */}
          <div className={clsx("bg-white rounded-lg shadow-md p-6 w-full",
            showQuote ? "lg:w-1/2" : "lg:w-3/4 max-w-3xl mx-auto")}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Devis de Nettoyage</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Date de nettoyage">
                <input type="date" value={formData.cleaningDate}
                  onChange={e => handleInputChange('cleaningDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" required />
              </FormField>

              <FormField label="Type de nettoyage">
                <select value={formData.cleaningType}
                  onChange={e => handleInputChange('cleaningType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md">
                  {['standard', 'deep', 'movingOut', 'postConstruction'].map(type => (
                    <option key={type} value={type}>
                      {getCleaningTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Surface (m²)">
                <input type="number" value={formData.squareMeters}
                  onChange={e => handleInputChange('squareMeters', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" min="1" required />
              </FormField>

              <FormField label="Nombre de pièces">
                <input type="number" value={formData.numberOfRooms}
                  onChange={e => handleInputChange('numberOfRooms', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" min="1" required />
              </FormField>

              <FormField label="Nombre de salles de bain">
                <input type="number" value={formData.numberOfBathrooms}
                  onChange={e => handleInputChange('numberOfBathrooms', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" min="1" required />
              </FormField>

              <FormField label="Fréquence">
                <select value={formData.frequency}
                  onChange={e => handleInputChange('frequency', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md">
                  {['oneTime', 'weekly', 'biweekly', 'monthly'].map(freq => (
                    <option key={freq} value={freq}>
                      {getFrequencyLabel(freq)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Adresse">
                <AddressAutocomplete
                  id="cleaning-address"
                  value={formData.address}
                  onChange={value => handleInputChange('address', value)}
                  onSelect={handleAddressSelect}
                  placeholder="Entrez une adresse"
                  required
                />
              </FormField>

              <Button type="submit" className="w-full">
                Valider le devis
              </Button>
            </form>
          </div>

          {/* Résumé du devis */}
          {showQuote && (
            <CleaningQuoteSummary 
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