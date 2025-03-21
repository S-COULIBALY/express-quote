'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormField, TextInput, Select } from '@/components/Form'
import { DeliveryAddressAutocomplete } from '@/components/AddressAutocomplete'

interface Service {
  id: string
  name: string
  description: string
  price: number
  serviceType: string
  durationDays?: number
  peopleCount?: number
}

interface ServiceFormData {
  serviceId: string
  scheduledDate: string
  serviceAddress: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
}

export default function NewServiceBooking() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get('serviceId')
  
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<ServiceFormData>({
    serviceId: serviceId || '',
    scheduledDate: '',
    serviceAddress: '',
    customerFirstName: '',
    customerLastName: '',
    customerEmail: '',
    customerPhone: ''
  })
  const [addressDetails, setAddressDetails] = useState<google.maps.places.PlaceResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails(serviceId)
    } else {
      setIsLoading(false)
    }
  }, [serviceId])

  const fetchServiceDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/services/${id}`)
      if (!response.ok) throw new Error("Erreur lors du chargement du service")
      const data = await response.json()
      setService(data)
      setFormData(prev => ({ ...prev, serviceId: id }))
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddressSelected = (place: google.maps.places.PlaceResult) => {
    setAddressDetails(place)
    setFormData(prev => ({ ...prev, serviceAddress: place.formatted_address || '' }))
    if (errors.serviceAddress) {
      setErrors(prev => ({ ...prev, serviceAddress: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.scheduledDate) newErrors.scheduledDate = "Veuillez choisir une date"
    if (!formData.serviceAddress) newErrors.serviceAddress = "Veuillez saisir une adresse"
    if (!formData.customerFirstName) newErrors.customerFirstName = "Veuillez saisir un prénom"
    if (!formData.customerLastName) newErrors.customerLastName = "Veuillez saisir un nom"
    if (!formData.customerEmail) newErrors.customerEmail = "Veuillez saisir un email"
    else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) newErrors.customerEmail = "Veuillez saisir un email valide"
    if (!formData.customerPhone) newErrors.customerPhone = "Veuillez saisir un numéro de téléphone"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const payload = {
        type: "service",
        serviceId: formData.serviceId,
        scheduledDate: formData.scheduledDate,
        destAddress: formData.serviceAddress,
        serviceDate: formData.scheduledDate,
        serviceAddress: formData.serviceAddress,
        customer: {
          firstName: formData.customerFirstName,
          lastName: formData.customerLastName,
          email: formData.customerEmail,
          phone: formData.customerPhone
        }
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error("Erreur lors de la création de la réservation")
      
      const data = await response.json()
      router.push(`/services/success?bookingId=${data.id}`)
    } catch (error) {
      console.error("Erreur:", error)
      alert("Une erreur est survenue lors de la création de votre réservation. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!serviceId || !service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Aucun service sélectionné. Veuillez <a href="/services" className="font-medium underline">choisir un service</a> avant de continuer.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Réserver le service {service.name}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {service.serviceType}
          </span>
        </div>
        <p className="text-gray-600 mb-4">{service.description}</p>
        <div className="space-y-2 mb-4">
          {service.durationDays && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Durée: {service.durationDays} {service.durationDays > 1 ? 'jours' : 'jour'}
            </div>
          )}
          {service.peopleCount && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {service.peopleCount} {service.peopleCount > 1 ? 'personnes' : 'personne'}
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Prix du service:</span>
            <span className="text-2xl font-bold text-emerald-600">{service.price} €</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations de réservation</h2>
          
          <div className="space-y-4">
            <FormField 
              label="Date du service" 
              error={errors.scheduledDate}
            >
              <TextInput
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </FormField>
            
            <FormField 
              label="Adresse du service" 
              error={errors.serviceAddress}
            >
              <DeliveryAddressAutocomplete 
                onPlaceSelected={handleAddressSelected}
                initialValue={formData.serviceAddress}
              />
            </FormField>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations client</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Prénom" 
              error={errors.customerFirstName}
            >
              <TextInput
                id="customerFirstName"
                name="customerFirstName"
                value={formData.customerFirstName}
                onChange={handleInputChange}
                required
              />
            </FormField>
            
            <FormField 
              label="Nom" 
              error={errors.customerLastName}
            >
              <TextInput
                id="customerLastName"
                name="customerLastName"
                value={formData.customerLastName}
                onChange={handleInputChange}
                required
              />
            </FormField>
            
            <FormField 
              label="Email" 
              error={errors.customerEmail}
            >
              <TextInput
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
                required
              />
            </FormField>
            
            <FormField 
              label="Téléphone" 
              error={errors.customerPhone}
            >
              <TextInput
                id="customerPhone"
                name="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={handleInputChange}
                required
              />
            </FormField>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/services')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-emerald-500 text-white rounded-md shadow-sm font-medium hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Création en cours...' : 'Confirmer la réservation'}
          </button>
        </div>
      </form>
    </div>
  )
} 