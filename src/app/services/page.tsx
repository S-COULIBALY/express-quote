'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Service } from '@/types/booking'
import { mockServices } from '@/data/mockData'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchServices = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setServices(mockServices)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête avec fond dégradé */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-emerald-500">
              Nos Services à la Carte
            </span>
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Des prestations sur mesure pour répondre à tous vos besoins. 
            Sélectionnez les services qui vous conviennent pour un déménagement personnalisé.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-sky-500 animate-ping absolute"></div>
              <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-sky-500 animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="group relative bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300 overflow-hidden"
              >
                {/* Badge de durée estimée */}
                {service.duration && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 text-sky-800">
                      <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration}
                    </span>
                  </div>
                )}

                <div className="p-4">
                  {/* Icône du service */}
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-sky-400 to-emerald-400 p-1.5 mb-3">
                    <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Contenu du service */}
                  <h2 className="text-lg font-bold text-gray-900 mb-1.5">{service.name}</h2>
                  <p className="text-xs text-gray-600 mb-3 min-h-[48px]">{service.description}</p>
                  
                  {/* Prix et caractéristiques */}
                  <div className="mb-4">
                    <div className="flex items-baseline mb-2">
                      <span className="text-2xl font-bold text-gray-900">{service.price}€</span>
                      <span className="ml-1.5 text-xs text-gray-500">{service.priceUnit || '/service'}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {service.features?.map((feature, index) => (
                        <li key={index} className="flex items-center text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-sky-500 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bouton d'action */}
                  <Link 
                    href={`/services/${service.id}`}
                    className="block w-full text-center bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white px-3 py-1.5 rounded-md font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-xs"
                  >
                    Choisir ce service
                  </Link>
                </div>

                {/* Effet de bordure au survol */}
                <div className="absolute inset-0 border border-transparent group-hover:border-sky-500/20 rounded-lg transition-colors duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 