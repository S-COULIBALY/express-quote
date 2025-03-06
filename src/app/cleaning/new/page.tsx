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

interface IconProps {
  className?: string
}

// Icônes SVG personnalisées
const CalendarIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const SparklesIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
)

const HomeIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const ArrowPathIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
)

const MapPinIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
)

const CheckCircleIcon = ({ className = "w-4 h-4 text-emerald-600" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

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
  floorTypes: {
    parquet: false,
    carpet: false,
    tile: false,
    vinyl: false,
    marble: false
  },
  propertyState: 'normal',
  hasBalcony: false,
  balconySize: '',
  hasPets: false,
  options: {
    windows: false,
    deepCleaning: false,
    carpets: false,
    furniture: false,
    appliances: false,
    ironing: false,
    dishes: false,
    bedding: false,
    garbage: false,
    sanitizing: false
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

const getPropertyStateLabel = (state: string): string => {
  const labels: Record<string, string> = {
    normal: 'État normal',
    dirty: 'Très sale',
    construction: 'Après travaux',
    moving: 'Fin de bail'
  }
  return labels[state] || state
}

const getFloorTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    parquet: 'Parquet',
    carpet: 'Moquette',
    tile: 'Carrelage',
    vinyl: 'Vinyle/Lino',
    marble: 'Marbre'
  }
  return labels[type] || type
}

const getOptionLabel = (key: string): string => {
  const labels: Record<string, string> = {
    windows: 'Nettoyage des vitres',
    deepCleaning: 'Nettoyage en profondeur',
    carpets: 'Nettoyage des tapis',
    furniture: 'Nettoyage des meubles',
    appliances: 'Nettoyage des électroménagers',
    ironing: 'Repassage du linge',
    dishes: 'Vaisselle',
    bedding: 'Changement des draps',
    garbage: 'Sortie des poubelles',
    sanitizing: 'Désinfection approfondie'
  }
  return labels[key] || key
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
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulaire */}
          <div className="w-full lg:w-[55%]">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* En-tête avec gradient */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-600 rounded-lg"></div>
                <div className="relative p-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    Devis Express Nettoyage
                  </h2>
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
                <div className="h-0.5 w-20 bg-white rounded-full mx-4"></div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date et Type de nettoyage */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField 
                    label="Date de nettoyage" 
                    icon={<CalendarIcon />}
                  >
                    <input 
                      type="date" 
                      value={formData.cleaningDate}
                      onChange={e => handleInputChange('cleaningDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                      required 
                    />
                  </FormField>

                  <FormField 
                    label="Type de nettoyage"
                    icon={<SparklesIcon />}
                  >
                    <select 
                      value={formData.cleaningType}
                      onChange={e => handleInputChange('cleaningType', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                    >
                      {['standard', 'deep', 'movingOut', 'postConstruction'].map(type => (
                        <option key={type} value={type}>
                          {getCleaningTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {/* Caractéristiques du logement */}
                <div className="bg-emerald-50 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2">
                    <HomeIcon />
                    Caractéristiques du logement
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField label="Surface (m²)">
                      <input 
                        type="number" 
                        value={formData.squareMeters}
                        onChange={e => handleInputChange('squareMeters', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                        min="1" 
                        required 
                      />
                    </FormField>

                    <FormField label="Nombre de pièces">
                      <input 
                        type="number" 
                        value={formData.numberOfRooms}
                        onChange={e => handleInputChange('numberOfRooms', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                        min="1" 
                        required 
                      />
                    </FormField>

                    <FormField label="Nombre de SDB">
                      <input 
                        type="number" 
                        value={formData.numberOfBathrooms}
                        onChange={e => handleInputChange('numberOfBathrooms', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                        min="1" 
                        required 
                      />
                    </FormField>
                  </div>

                  {/* État du logement */}
                  <FormField label="État du logement">
                    <select 
                      value={formData.propertyState}
                      onChange={e => handleInputChange('propertyState', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                    >
                      {['normal', 'dirty', 'construction', 'moving'].map(state => (
                        <option key={state} value={state}>
                          {getPropertyStateLabel(state)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* Types de sols */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Types de sols présents
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(Object.keys(formData.floorTypes) as Array<keyof typeof formData.floorTypes>).map(type => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.floorTypes[type]}
                            onChange={e => {
                              const newFormData = {
                                ...formData,
                                floorTypes: {
                                  ...formData.floorTypes,
                                  [type]: e.target.checked
                                }
                              }
                              setFormData(newFormData)
                              updateQuote(newFormData)
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
                          />
                          <span className="text-xs text-gray-600">{getFloorTypeLabel(type)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Balcon */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.hasBalcony}
                        onChange={e => {
                          const newFormData = {
                            ...formData,
                            hasBalcony: e.target.checked,
                            balconySize: e.target.checked ? formData.balconySize : ''
                          }
                          setFormData(newFormData)
                          updateQuote(newFormData)
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
                      />
                      <span className="text-xs font-medium text-gray-700">Balcon ou terrasse</span>
                    </div>
                    {formData.hasBalcony && (
                      <FormField label="Surface du balcon (m²)">
                        <input
                          type="number"
                          value={formData.balconySize}
                          onChange={e => handleInputChange('balconySize', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                          min="1"
                        />
                      </FormField>
                    )}
                  </div>

                  {/* Animaux */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hasPets}
                      onChange={e => {
                        const newFormData = {
                          ...formData,
                          hasPets: e.target.checked
                        }
                        setFormData(newFormData)
                        updateQuote(newFormData)
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
                    />
                    <span className="text-xs font-medium text-gray-700">Présence d'animaux domestiques</span>
                  </div>
                </div>

                {/* Services supplémentaires */}
                <div className="bg-emerald-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircleIcon />
                    Services supplémentaires
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(Object.keys(formData.options) as Array<keyof typeof formData.options>).map(option => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.options[option]}
                          onChange={e => {
                            const newFormData = {
                              ...formData,
                              options: {
                                ...formData.options,
                                [option]: e.target.checked
                              }
                            }
                            setFormData(newFormData)
                            updateQuote(newFormData)
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
                        />
                        <span className="text-xs text-gray-600">{getOptionLabel(option)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fréquence et Adresse */}
                <div className="space-y-4">
                  <FormField 
                    label="Fréquence" 
                    icon={<ArrowPathIcon />}
                  >
                    <select 
                      value={formData.frequency}
                      onChange={e => handleInputChange('frequency', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                    >
                      {['oneTime', 'weekly', 'biweekly', 'monthly'].map(freq => (
                        <option key={freq} value={freq}>
                          {getFrequencyLabel(freq)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField 
                    label="Adresse" 
                    icon={<MapPinIcon />}
                  >
                    <AddressAutocomplete
                      id="cleaning-address"
                      value={formData.address}
                      onChange={value => handleInputChange('address', value)}
                      onSelect={handleAddressSelect}
                      placeholder="Entrez une adresse"
                      required
                    />
                  </FormField>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Valider le devis
                </Button>
              </form>
            </div>
          </div>

          {/* Résumé du devis */}
          <div className="w-full lg:w-[45%]">
            <div className="lg:sticky lg:top-8">
              {showQuote && (
                <CleaningQuoteSummary 
                  formData={formData} 
                  quoteDetails={quoteDetails}
                  isCalculating={isCalculating}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 