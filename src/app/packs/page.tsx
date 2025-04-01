'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pack } from '@/types/booking'
import { mockPacks } from '@/data/mockData'

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPacks(mockPacks)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPacks()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête avec fond dégradé */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-500">
              Nos Packs Déménagement
            </span>
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Des solutions clé en main pour un déménagement sans souci. 
            Choisissez le pack qui correspond à vos besoins et votre budget.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 animate-ping absolute"></div>
              <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-emerald-500 animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((pack) => (
              <div 
                key={pack.id} 
                className="group relative bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300 overflow-hidden"
              >
                {/* Badge de popularité (si applicable) */}
                {pack.popular && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                      <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 1l2.928 6.377 6.072.556-4.5 4.13 1.072 6.937L10 16l-5.572 3-1.072-6.937L0 7.933l6.072-.556L10 1z" clipRule="evenodd"/>
                      </svg>
                      Plus populaire
                    </span>
                  </div>
                )}

                <div className="p-4">
                  {/* Icône du pack */}
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-400 to-sky-400 p-1.5 mb-3">
                    <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>

                  {/* Contenu du pack */}
                  <h2 className="text-lg font-bold text-gray-900 mb-1.5">{pack.name}</h2>
                  <p className="text-xs text-gray-600 mb-3 min-h-[48px]">{pack.description}</p>
                  
                  {/* Prix et caractéristiques */}
                  <div className="mb-4">
                    <div className="flex items-baseline mb-2">
                      <span className="text-2xl font-bold text-gray-900">{pack.price}€</span>
                      <span className="ml-1.5 text-xs text-gray-500">/forfait</span>
                    </div>
                    <ul className="space-y-1.5">
                      {pack.features?.map((feature, index) => (
                        <li key={index} className="flex items-center text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-emerald-500 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bouton d'action */}
                  <Link 
                    href={`/packs/${pack.id}`}
                    className="block w-full text-center bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white px-3 py-1.5 rounded-md font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-xs"
                  >
                    Choisir ce pack
                  </Link>
                </div>

                {/* Effet de bordure au survol */}
                <div className="absolute inset-0 border border-transparent group-hover:border-emerald-500/20 rounded-lg transition-colors duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 