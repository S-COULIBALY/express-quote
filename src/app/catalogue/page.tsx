'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormStylesSimplified } from '@/components/form-generator/styles/FormStylesSimplified'
import { globalFormPreset } from '@/components/form-generator/presets/_shared/globalPreset'
import { 
  ArrowRightIcon, 
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { 
  TruckIcon,
  HomeIcon,
  UsersIcon,
  SparklesIcon,
  CubeIcon,
  StarIcon,
  ShieldCheckIcon,
  CurrencyEuroIcon,
  ClockIcon as ClockIconSolid,
  CheckIcon,
  FireIcon,
  BoltIcon
} from '@heroicons/react/24/solid'
import CatalogueSchema from './schema'

// Types pour les données du catalogue - Interface optimisée
interface CatalogItem {
  id: string
  catalogId?: string
  title: string
  subtitle: string
  description: string
  price: number
  originalPrice?: number
  duration: number
  workers: number
  features: string[]
  includedDistance: number
  distanceUnit: string
  isFeatured: boolean
  isNewOffer: boolean
  badgeText?: string
  badgeColor?: string
  promotionText?: string
  category: string
  subcategory: string
  targetAudience: string
  type: 'pack' | 'service'
}

// Mapping des icônes par catégorie (SOLID pour plus moderne)
const getCategoryIcon = (category: string, subcategory: string) => {
  switch (category) {
    case 'DEMENAGEMENT':
      if (subcategory === 'studio') return HomeIcon
      if (subcategory === 'famille') return UsersIcon
      if (subcategory === 'premium') return SparklesIcon
      return TruckIcon
    case 'MENAGE':
      return SparklesIcon // Plus attractif que WrenchScrewdriverIcon
    case 'TRANSPORT':
      return TruckIcon
    case 'LIVRAISON':
      return CubeIcon
    default:
      return HomeIcon
  }
}

// Mapping des couleurs par catégorie
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'DEMENAGEMENT':
      return 'text-emerald-600' // Vert
    case 'MENAGE':
      return 'text-blue-600' // Bleu
    case 'TRANSPORT':
      return 'text-orange-600' // Orange
    case 'LIVRAISON':
      return 'text-purple-600' // Violet
    default:
      return 'text-emerald-600'
  }
}

export default function CataloguePage() {
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [randomizedItems, setRandomizedItems] = useState<CatalogItem[]>([])
  const router = useRouter()

  // Données de fallback pour le carrousel
  const fallbackItems: CatalogItem[] = [
    {
      id: 'fallback-1',
      catalogId: 'catalog-demenagement-sur-mesure',
      title: 'Déménagement Économique',
      subtitle: 'Payez uniquement la main d\'œuvre dont vous avez besoin',
      description: 'Tarification horaire flexible à 19€/h - Équipe professionnelle',
      price: 0,
      duration: 1,
      workers: 3,
      category: 'DEMENAGEMENT',
      subcategory: 'sur-mesure',
      type: 'service',
      features: ['Tarification horaire flexible', 'Équipe adaptée', 'Prix transparents'],
      includedDistance: 30,
      distanceUnit: 'km',
      isFeatured: true,
      targetAudience: 'particuliers',
      isNewOffer: false,
      badgeText: 'Économique',
      badgeColor: '#E67E22'
    },
    {
      id: 'fallback-2', 
      catalogId: 'catalog-menage-sur-mesure',
      title: 'Ménage Flexible',
      subtitle: 'Service modulaire sans forfait rigide',
      description: 'À partir de 21€/h - Service personnalisé selon vos besoins',
      price: 0,
      duration: 1,
      workers: 2,
      category: 'MENAGE',
      subcategory: 'sur-mesure', 
      type: 'service',
      features: ['Service modulaire', 'Prix transparents', 'Personnalisation'],
      includedDistance: 0,
      distanceUnit: 'km',
      isFeatured: true,
      targetAudience: 'particuliers',
      isNewOffer: true,
      badgeText: 'Flexible',
      badgeColor: '#27AE60'
    }
  ]

  // Récupération des données du catalogue - Optimisée
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Récupération de tous les éléments du catalogue
        const response = await fetch('/api/catalogue/featured?limit=20')
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Vérification que les données sont un tableau
        if (!Array.isArray(data)) {
          throw new Error('Format de données invalide')
        }
        
        console.log(`Catalogue chargé: ${data.length} éléments`)
        setCatalogItems(data)
        
        // Mélanger les éléments de manière aléatoire pour le carrousel
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        setRandomizedItems(shuffled)
        
      } catch (err) {
        console.error('Erreur catalogue:', err)
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du catalogue')
        
        // En cas d'erreur, utiliser les données de fallback
        console.log('🎠 Utilisation des données de fallback pour le carrousel')
        setRandomizedItems(fallbackItems)
      } finally {
        setLoading(false)
      }
    }

    fetchCatalogData()
  }, [])

  // Carrousel automatique avec contrôles
  useEffect(() => {
    if (randomizedItems.length === 0) return

    const interval = setInterval(() => {
      setCurrentCarouselIndex((prevIndex) => 
        (prevIndex + 1) % randomizedItems.length
      )
    }, 5000) // Change toutes les 5 secondes

    return () => clearInterval(interval)
  }, [randomizedItems.length])

  // Contrôles manuels du carrousel
  const nextSlide = () => {
    const itemsToUse = randomizedItems.length > 0 ? randomizedItems : fallbackItems
    setCurrentCarouselIndex((prevIndex) => 
      (prevIndex + 1) % itemsToUse.length
    )
  }

  const prevSlide = () => {
    const itemsToUse = randomizedItems.length > 0 ? randomizedItems : fallbackItems
    setCurrentCarouselIndex((prevIndex) => 
      prevIndex === 0 ? itemsToUse.length - 1 : prevIndex - 1
    )
  }

  const goToSlide = (index: number) => {
    setCurrentCarouselIndex(index)
  }

  // Gestion de la sélection d'un élément - Optimisée avec traçabilité
  const handleItemSelect = (item: CatalogItem) => {
    setSelectedPack(item.id)
    setTimeout(() => {
      // ✅ Redirection vers les nouvelles pages de détail du catalogue
      const catalogId = item.catalogId || item.id
      const redirectPath = `/catalogue/${catalogId}`
      
      console.log(`🎯 Redirection vers la page de détail: ${redirectPath}`)
      router.push(redirectPath)
    }, 300)
  }

  const handleCarouselItemClick = () => {
    if (currentItem) {
      handleItemSelect(currentItem)
    }
  }

  // Retry function pour les erreurs
  const handleRetry = () => {
    window.location.reload()
  }

  // Grouper les éléments par catégorie (exclure les services sur mesure)
  const groupedItems = catalogItems.reduce((acc, item) => {
    // Exclure les services sur mesure
    if (item.subcategory === 'sur-mesure') {
      return acc
    }
    
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CatalogItem[]>)

  // Définir l'ordre des catégories
  const categoryOrder = ['DEMENAGEMENT', 'MENAGE', 'TRANSPORT', 'LIVRAISON']
  const orderedCategories = categoryOrder.filter(cat => groupedItems[cat] && groupedItems[cat].length > 0)

  // Fonction pour obtenir le titre de la catégorie
  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'DEMENAGEMENT': return 'Déménagement'
      case 'MENAGE': return 'Ménage & Nettoyage'
      case 'TRANSPORT': return 'Transport'
      case 'LIVRAISON': return 'Livraison'
      default: return category
    }
  }

  // Fonction pour scroller vers une catégorie
  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`category-${category}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Fonction pour obtenir la couleur appropriée selon le type de badge
  const getBadgeColor = (badgeText: string): string => {
    switch (badgeText.toLowerCase()) {
      case 'promo':
        return '#fbbf24' // Jaune
      case 'populaire':
        return '#f97316' // Orange
      case 'week-end':
        return '#3b82f6' // Bleu
      case 'garantie':
        return '#22c55e' // Vert
      case 'nouveau':
        return '#10b981' // Vert émeraude
      default:
        return '#f97316' // Orange par défaut
    }
  }

  // Élément actuel du carrousel avec fallback de sécurité
  const displayItems = randomizedItems.length > 0 ? randomizedItems : fallbackItems
  const safeIndex = Math.min(currentCarouselIndex, displayItems.length - 1)
  const currentItem = displayItems[safeIndex]
  const IconComponent = currentItem ? getCategoryIcon(currentItem.category, currentItem.subcategory) : TruckIcon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 form-generator font-ios">
      {/* 🎨 Styles iOS 18 simplifiés */}
      <FormStylesSimplified globalConfig={globalFormPreset} />
      
      {/* Intégration du schema JSON-LD */}
      <CatalogueSchema />
      
      {/* Section Hero Élargie */}
      <div className="py-12" style={{ background: 'var(--gradient-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Hero Content - Gauche */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-2 rounded-full text-sm font-medium mb-4">
                <CurrencyEuroIcon className="w-4 h-4 text-emerald-600" />
                Prix Justes, Service Sur Mesure
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight font-ios-bold">
                Payez uniquement ce dont vous avez besoin
              </h1>
              <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 mb-6 font-ios leading-relaxed">
                Évitez les forfaits rigides ! Nos services <span className="font-bold text-emerald-600">modulaires et flexibles</span> vous permettent de contrôler votre budget et d'optimiser vos dépenses
              </p>
          
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                <button
                  onClick={() => router.push('/catalogue/catalog-demenagement-sur-mesure')}
                  className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 font-ios-semibold text-base"
                >
                  <TruckIcon className="w-4 h-4" />
                  Déménagement à 19€/h
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => router.push('/catalogue/catalog-menage-sur-mesure')}
                  className="group w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 font-ios-semibold text-base"
                >
                  <SparklesIcon className="w-4 h-4" />
                  Ménage à 21€/h
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {/* Stats rapides */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-4 text-gray-600 font-ios text-sm">
                <div className="flex items-center gap-2">
                  <CurrencyEuroIcon className="w-4 h-4 text-emerald-600" />
                  <span>Économisez jusqu'à 40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIconSolid className="w-4 h-4 text-blue-600" />
                  <span>Tarification horaire flexible</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>Prix transparents</span>
                </div>
              </div>
            </div>
      
            {/* Carrousel Élargi - Droite */}
            <div className="mt-6 lg:mt-0">
              <div className="relative">
                {/* Contrôles de navigation */}
                {!loading && displayItems.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {/* Carrousel élargi flottant */}
                <div 
                  className="relative overflow-hidden rounded-xl p-8 text-white cursor-pointer transition-all duration-500 hover:scale-[1.02] group border border-white/20 animate-float"
                  style={{ 
                    minHeight: '200px',
                    background: 'var(--gradient-orange)',
                    transform: 'translateY(0px)',
                    animation: 'float 6s ease-in-out infinite'
                  }}
                  onClick={handleCarouselItemClick}
                >
                  {/* Overlay subtil */}
                  <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
                  
                  {/* Contenu du carrousel */}
                  <div className="relative z-20 h-full flex flex-col">
                    {!loading && currentItem ? (
                      <>
                        {/* Header avec icône */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col gap-2">
                              {currentItem.badgeText && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold text-white bg-black/20 border border-white/20">
                                  <FireIcon className="w-3 h-3" />
                                  {currentItem.badgeText}
                                </span>
                              )}
                              {currentItem.isNewOffer && (
                                <span className="inline-flex items-center gap-1 bg-green-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                                  <BoltIcon className="w-3 h-3" />
                                  Nouveau
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      
                        {/* Titre et prix */}
                        <div className="mb-4">
                          <h2 className="text-xl font-bold mb-3 leading-tight text-white">
                            {currentItem.title}
                          </h2>
                          <div className="flex justify-center mb-3">
                            <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                              <div className="text-center">
                                <span className="text-2xl font-bold text-gray-900">
                                  {currentItem.subcategory === 'sur-mesure' ? (
                                    <span className="text-emerald-600">Devis gratuit</span>
                                  ) : (
                                    <>€{currentItem.price}</>
                                  )}
                                </span>
                                {currentItem.originalPrice && currentItem.originalPrice > currentItem.price && (
                                  <div className="mt-1">
                                    <span className="text-sm text-gray-500 line-through">€{currentItem.originalPrice}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-white text-base font-medium text-center">{currentItem.subtitle}</p>
                        </div>
                        
                        {/* Points forts */}
                        <div className="space-y-2 mb-4 flex-1">
                          {currentItem.subcategory === 'sur-mesure' ? (
                            <>
                              <div className="flex items-center gap-3 text-white bg-white/20 rounded-xl p-3">
                                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <CurrencyEuroIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-semibold">Tarification horaire flexible</span>
                              </div>
                              <div className="flex items-center gap-3 text-white bg-white/20 rounded-xl p-3">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <CheckIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-semibold">Payez selon vos besoins réels</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 text-white bg-white/20 rounded-xl p-3">
                                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <CurrencyEuroIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-semibold">Prix transparents</span>
                              </div>
                              <div className="flex items-center gap-3 text-white bg-white/20 rounded-xl p-3">
                                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                  <CheckIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-semibold">Service modulaire</span>
                              </div>
                            </>
                          )}
                        </div>
                      
                        {/* CTA */}
                        <div className="mt-auto">
                          <button className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            <span>Voir les détails</span>
                            <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </>
                    ) : loading ? (
                      // État de chargement
                      <div className="animate-pulse h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                          <div className="space-y-1">
                            <div className="w-12 h-2 bg-white/20 rounded"></div>
                            <div className="w-8 h-1 bg-white/20 rounded"></div>
                          </div>
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="w-3/4 h-4 bg-white/20 rounded-lg"></div>
                          <div className="w-1/2 h-3 bg-white/20 rounded"></div>
                          <div className="space-y-1">
                            <div className="w-full h-6 bg-white/20 rounded-lg"></div>
                            <div className="w-full h-6 bg-white/20 rounded-lg"></div>
                          </div>
                        </div>
                        <div className="w-full h-6 bg-white/20 rounded-lg mt-2"></div>
                      </div>
                    ) : (
                      // Message pour données indisponibles
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <TruckIcon className="w-8 h-8 text-white/50 mb-2" />
                        <h3 className="text-sm font-bold text-white mb-1">Catalogue en cours de chargement</h3>
                        <p className="text-white/70 text-xs">Patientez un moment...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal - Services uniquement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section services avec toute la largeur */}
        <div className="w-full">
          
          {/* Header des services modernisé */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <CurrencyEuroIcon className="w-4 h-4" />
              Services Économiques & Flexibles
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-700 to-blue-700 bg-clip-text text-transparent mb-4">
              Nos Solutions Modulaires
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              <span className="font-semibold text-emerald-600">Composez votre service</span> selon vos besoins et <span className="font-semibold text-blue-600">payez uniquement ce que vous utilisez</span>
            </p>
          </div>
            
            {/* État de chargement */}
            {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
                ))}
              </div>
            )}
            
            {/* État d'erreur amélioré */}
            {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-red-800 mb-2">Erreur de chargement</h3>
                <p className="text-red-600 text-sm mb-3">
                  {error}
                </p>
                <button 
                  onClick={handleRetry}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}
            
          {/* Grille des services organisée par catégorie */}
            {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orderedCategories.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl lg:col-span-2">
                    <p className="text-gray-500">Aucun élément disponible pour le moment</p>
                  </div>
                ) : (
                  orderedCategories.map((category) => (
                  <div key={category} id={`category-${category}`} className="card-ios p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg ${getCategoryColor(category).replace('text-', 'bg-')} flex items-center justify-center shadow-lg`}>
                        {React.createElement(getCategoryIcon(category, ''), { className: 'w-5 h-5 text-white' })}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${getCategoryColor(category)} flex items-center gap-2`}>
                          {getCategoryTitle(category)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Nos meilleures offres</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {groupedItems[category]?.map((item, index) => {
                          const IconComponent = getCategoryIcon(item.category, item.subcategory)
                        const categoryColor = getCategoryColor(item.category)
                          const isPopular = item.badgeText === 'Populaire' || item.isFeatured
                          
                          return (
                            <div
                              key={item.id}
                              className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex-1 min-w-[200px] ${
                                selectedPack === item.id ? 'ring-2 ring-emerald-500 scale-105' : ''
                              }`}
                              onClick={() => handleItemSelect(item)}
                            >
                              {/* Badge */}
                              {(isPopular || item.badgeText) && (
                                <div className="absolute top-0 right-0.5 z-10">
                                  <span 
                                    style={{ 
                                      backgroundColor: getBadgeColor(item.badgeText || 'Populaire'),
                                      color: '#ffffff',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '9999px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                  >
                                    {item.badgeText || 'Populaire'}
                                  </span>
                                </div>
                              )}
                              
                              {/* Badge nouveau */}
                              {item.isNewOffer && (
                                <div className="absolute top-0 left-0.5 z-10">
                                  <span 
                                    style={{ 
                                      backgroundColor: '#10b981',
                                      color: '#ffffff',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '9999px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                  >
                                    Nouveau
                                  </span>
                                </div>
                              )}
                              
                            <div className="card-ios p-4 h-full flex flex-col overflow-hidden">
                                {/* Icône modernisée */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className={`w-10 h-10 rounded-lg ${categoryColor.replace('text-', 'bg-')}/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    <IconComponent className={`w-5 h-5 ${categoryColor}`} />
                                  </div>
                                  {item.isFeatured && (
                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-1 rounded-full">
                                      <StarIcon className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Contenu modernisé */}
                                <div className="flex-1 flex flex-col">
                                  <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-300">{item.title}</h4>
                                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1 leading-relaxed">{item.subtitle}</p>
                                  <div className="flex items-center justify-between mt-auto mb-3">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        {item.originalPrice && item.originalPrice > item.price && (
                                          <span className="text-xs text-gray-400 line-through">€{item.originalPrice}</span>
                                        )}
                                        <span className={`text-xl font-bold ${item.originalPrice && item.originalPrice > item.price ? 'text-red-600' : 'text-gray-900'}`}>
                                          €{item.price}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className={`text-xs font-medium text-white ${categoryColor.replace('text-', 'bg-')} px-1.5 py-0.5 rounded-full`}>
                                        {item.duration} Heure{item.duration > 1 ? 's' : ''}
                                      </span>
                                      {item.workers && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <UsersIcon className="w-3 h-3" />
                                          {item.workers}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                
                                  {/* CTA modernisé */}
                                  <div className="mt-auto pt-3 border-t border-gray-100">
                                    <button 
                                      className={`w-full ${categoryColor.replace('text-', 'bg-')}/10 hover:${categoryColor.replace('text-', 'bg-')}/20 ${categoryColor} font-semibold py-2 px-3 rounded-lg transition-all duration-300 group-hover:scale-105 flex items-center justify-center gap-2 text-sm`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleItemSelect(item)
                                      }}
                                    >
                                      Commencer
                                      <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
        </div>
      </div>

      {/* Section Actions Rapides Modernisée */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 py-16 border-t border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <BoltIcon className="w-4 h-4" />
              Services à la Carte
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-4">
              Tarification Flexible
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              <span className="font-semibold text-blue-600">Pas de forfait rigide</span> - <span className="font-semibold text-emerald-600">payez selon vos besoins réels</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button onClick={() => router.push('/catalogue/catalog-demenagement-sur-mesure')} className="group text-left">
              <div className="card-ios p-8 hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 relative overflow-hidden">
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl relative z-10 carousel-gradient-green">
                    <TruckIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-3">Déménagement</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">À partir de <span className="font-bold text-emerald-600">19€/h</span> - Équipe professionnelle</p>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 font-bold text-lg group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      Commencer <ArrowRightIcon className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                      <CurrencyEuroIcon className="w-3 h-3" />
                      Économique
                    </div>
                  </div>
                </div>
              </div>
            </button>
            
            <button onClick={() => router.push('/catalogue/catalog-menage-sur-mesure')} className="group text-left">
              <div className="card-ios p-8 hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 relative overflow-hidden">
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl relative z-10 carousel-gradient-blue">
                    <SparklesIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-700 mb-3">Ménage</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">À partir de <span className="font-bold text-blue-600">21€/h</span> - Service personnalisé</p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-bold text-lg group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      Commencer <ArrowRightIcon className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 rounded-full shadow-lg border border-blue-500">
                      <BoltIcon className="w-3 h-3" />
                      Flexible
                    </div>
                  </div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                const transportItems = catalogItems.filter(item => item.category === 'TRANSPORT')
                if (transportItems.length > 0) {
                  handleItemSelect(transportItems[0])
                } else {
                  scrollToCategory('TRANSPORT')
                }
              }}
              className="group w-full text-left"
            >
              <div className="card-ios p-8 hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 relative overflow-hidden">
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl relative z-10 carousel-gradient-orange">
                    <TruckIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-orange-700 mb-3">Transport</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">Transport sécurisé à <span className="font-bold text-orange-600">prix transparents</span></p>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-bold text-lg group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      Découvrir <ArrowRightIcon className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      <ShieldCheckIcon className="w-3 h-3" />
                      Sécurisé
                    </div>
                  </div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                const livraisonItems = catalogItems.filter(item => item.category === 'LIVRAISON')
                if (livraisonItems.length > 0) {
                  handleItemSelect(livraisonItems[0])
                } else {
                  scrollToCategory('LIVRAISON')
                }
              }}
              className="group w-full text-left"
            >
              <div className="card-ios p-8 hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 relative overflow-hidden">
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl relative z-10 carousel-gradient-purple">
                    <CubeIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-700 mb-3">Livraison</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">Livraison express à <span className="font-bold text-purple-600">prix attractifs</span></p>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 font-bold text-lg group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      Découvrir <ArrowRightIcon className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1.5 rounded-full shadow-lg border border-green-500">
                      <BoltIcon className="w-3 h-3" />
                      Express
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 