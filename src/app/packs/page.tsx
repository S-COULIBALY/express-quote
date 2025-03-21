'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Pack {
  id: string
  name: string
  description: string
  price: number
  truckSize?: number
  moversCount?: number
  driverIncluded: boolean
}

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await fetch('/api/packs')
        if (!response.ok) throw new Error('Erreur lors du chargement des forfaits')
        const data = await response.json()
        setPacks(data)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPacks()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nos Forfaits</h1>
      <p className="text-lg text-gray-600 mb-8">
        Découvrez nos forfaits préconçus pour un déménagement sans souci. Choisissez celui qui convient le mieux à vos besoins.
      </p>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <div key={pack.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{pack.name}</h2>
                <p className="text-gray-600 mb-4">{pack.description}</p>
                <div className="space-y-2 mb-4">
                  {pack.truckSize && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Camion {pack.truckSize}m³
                    </div>
                  )}
                  {pack.moversCount && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {pack.moversCount} déménageurs
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {pack.driverIncluded ? 'Chauffeur inclus' : 'Chauffeur non inclus'}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-600">{pack.price} €</span>
                  <button
                    onClick={() => router.push(`/packs/new?packId=${pack.id}`)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Réserver
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 