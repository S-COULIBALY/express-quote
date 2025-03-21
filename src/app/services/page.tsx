'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description: string
  price: number
  serviceType: string
  durationDays?: number
  peopleCount?: number
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services')
        if (!response.ok) throw new Error('Erreur lors du chargement des services')
        const data = await response.json()
        setServices(data)
        
        // Extraire les types de service uniques
        const types = [...new Set(data.map((service: Service) => service.serviceType))]
        setServiceTypes(types)
        if (types.length > 0) setSelectedType(types[0])
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [])

  const filteredServices = selectedType 
    ? services.filter(service => service.serviceType === selectedType)
    : services

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nos Services</h1>
      <p className="text-lg text-gray-600 mb-8">
        Découvrez nos services à la carte pour répondre à vos besoins spécifiques.
      </p>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {serviceTypes.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {serviceTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedType === type
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedType('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedType === ''
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Tous les services
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h2>
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
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-600">{service.price} €</span>
                    <button
                      onClick={() => router.push(`/services/new?serviceId=${service.id}`)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
} 