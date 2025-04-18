'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ServicesSchema from './schema'
import { toast } from 'react-hot-toast'

// Interface adaptée au format retourné par l'API
interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  workers: number
  includes: string[]
  features: string[]
  isActive: boolean
  categoryId?: string
  createdAt: string
  updatedAt: string
  imagePath?: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Chargement des services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Force revalidation: ajout d'un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/services?t=${timestamp}`, {
          method: 'GET',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json();
        
        // Vérifier si les données sont un tableau
        if (!Array.isArray(data)) {
          console.warn("Format de réponse inattendu:", data);
          throw new Error("Format de réponse inattendu")
        }
        
        console.log(`Chargés ${data.length} services depuis l'API`);
        if (data.length > 0) {
          console.log("Premier service:", JSON.stringify(data[0]));
        } else {
          console.log("Aucun service trouvé dans la réponse API");
        }
        setServices(data);
        
      } catch (error) {
        console.error("Erreur lors du chargement des services:", error)
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement des services'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-white">
      {/* Intégration du schema JSON-LD */}
      <ServicesSchema />
      
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
            Tous nos prix sont indiqués hors taxes (HT).
          </p>
          <div className="mt-3 bg-yellow-50 p-3 rounded-lg max-w-2xl mx-auto">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Important :</span> Nos services sont personnalisables et peuvent varier selon les caractéristiques spécifiques de votre logement. Des frais supplémentaires peuvent s'appliquer en fonction de l'accès au logement, la présence d'un ascenseur, les conditions de stationnement, la distance de portage, ou la nécessité d'un monte-meuble (200€).
            </p>
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Erreur:</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* État de chargement */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[200px]">
            <div className="relative mb-3">
              <div className="w-8 h-8 rounded-full border-2 border-sky-500 animate-ping absolute"></div>
              <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-sky-500 animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500">Chargement des services...</p>
          </div>
        ) : services.length === 0 ? (
          // Aucun service disponible
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun service disponible</h3>
            <p className="mt-1 text-sm text-gray-500">Aucun service n'a été trouvé dans notre catalogue pour le moment.</p>
          </div>
        ) : (
          // Affichage de la grille de services
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
                      {service.duration} {service.duration === 1 ? 'heure' : 'heures'}
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
                      <span className="ml-0.5 text-xs text-gray-500">HT</span>
                      <span className="ml-1.5 text-xs text-gray-500">
                        /service
                      </span>
                    </div>
                    <div className="mb-2 text-xs text-gray-600">
                      <span className="font-medium">Personnel:</span> {service.workers} {service.workers > 1 ? 'personnes' : 'personne'}
                    </div>
                    
                    {service.features && service.features.length > 0 && (
                      <ul className="space-y-1.5">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-sky-500 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
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