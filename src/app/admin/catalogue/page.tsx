'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowPathIcon,
  StarIcon,
  SparklesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import {
  StarIcon as StarIconSolid,
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid'

// ===== INTERFACES POUR LE NOUVEAU SYSTÈME =====

interface Template {
  id: string
  name: string
  description: string
  serviceType: string
  basePrice: number
  duration: number
  workers: number
  createdAt: string
  updatedAt: string
}

interface Item {
  id: string
  templateId: string
  name: string
  description: string
  price: number
  isPopular: boolean
  createdAt: string
  updatedAt: string
  template?: Template
}

interface CatalogItem {
  id: string
  itemId?: string
  category: 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON'
  subcategory?: string
  displayOrder: number
  isActive: boolean
  isFeatured: boolean
  isPopular: boolean
  isNewOffer?: boolean
  isVisible?: boolean
  customPrice?: number
  customDescription?: string
  marketingTitle?: string
  marketingSubtitle?: string
  marketingDescription?: string
  marketingPrice?: number
  originalPrice?: number
  badgeText?: string
  badgeColor?: string
  promotionText?: string
  targetAudience?: string
  startDate?: string
  endDate?: string
  tags?: string[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  item?: Item
}

interface CatalogueStats {
  overview: {
    totalCatalogues: number
    activeCatalogues: number
    featuredCatalogues: number
    popularCatalogues: number
    avgVisibility: number
    categoriesCount: number
  }
  performance: {
    topPerforming: Array<{
      id: string
      category: string
      subcategory?: string
      isPopular: boolean
      isFeatured: boolean
      displayOrder: number
      hasCustomPrice: boolean
    }>
    underPerforming: Array<{
      id: string
      category: string
      subcategory?: string
      isActive: boolean
      daysSinceCreation: number
    }>
  }
  business: {
    statsByCategory: Array<{
      category: string
      total: number
      active: number
      featured: number
      popular: number
      withCustomPrice: number
    }>
    distribution: {
      byCategory: Array<{
        category: string
        percentage: string
      }>
      byStatus: Array<{
        status: string
        count: number
        percentage: string
      }>
    }
  }
  trends: {
    usageEvolution: Array<{
      period: string
      cataloguesCreated: number
      totalViews: number
    }>
  }
  alerts: {
    count: number
    inactive: Array<{
      id: string
      category: string
      daysInactive: number
    }>
    duplicateSubcategories: Array<{
      category: string
      subcategory: string
      count: number
    }>
  }
}

// ===== CONSTANTES =====

const CATEGORIES = [
  { value: 'DEMENAGEMENT', label: 'Déménagement', color: 'bg-blue-100 text-blue-800' },
  { value: 'MENAGE', label: 'Ménage', color: 'bg-green-100 text-green-800' },
  { value: 'TRANSPORT', label: 'Transport', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'LIVRAISON', label: 'Livraison', color: 'bg-purple-100 text-purple-800' }
]

const BADGE_COLORS = [
  { value: '#E67E22', label: 'Orange', preview: 'bg-orange-500' },
  { value: '#067857', label: 'Vert', preview: 'bg-green-600' },
  { value: '#3B82F6', label: 'Bleu', preview: 'bg-blue-500' },
  { value: '#EF4444', label: 'Rouge', preview: 'bg-red-500' },
  { value: '#8B5CF6', label: 'Violet', preview: 'bg-purple-500' },
  { value: '#F59E0B', label: 'Jaune', preview: 'bg-yellow-500' }
]

export default function AdminCataloguePage() {
  // ===== ÉTATS =====
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<CatalogueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // État de pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalCatalogItems, setTotalCatalogItems] = useState(0)

  // État du formulaire
  const [formData, setFormData] = useState({
    itemId: '',
    category: 'DEMENAGEMENT' as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON',
    subcategory: '',
    marketingTitle: '',
    marketingSubtitle: '',
    marketingDescription: '',
    marketingPrice: 0,
    originalPrice: 0,
    badgeText: '',
    badgeColor: '#E67E22',
    promotionText: '',
    isFeatured: false,
    isNewOffer: false,
    isVisible: true,
    isActive: true,
    displayOrder: 0,
    targetAudience: 'particuliers',
    startDate: '',
    endDate: ''
  })

  // ===== CHARGEMENT DES DONNÉES =====
  useEffect(() => {
    fetchData()
    fetchStats()
  }, [])

  const fetchData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      const timestamp = Date.now()

      // Cache busting plus agressif
      const cacheBuster = forceRefresh ? `&force=${timestamp}&nocache=true` : `&_t=${timestamp}`

      // Paramètres de pagination/filtre côté serveur
      const limit = itemsPerPage
      const offset = (currentPage - 1) * itemsPerPage
      const qs = new URLSearchParams()
      qs.set('limit', String(limit))
      qs.set('offset', String(offset))
      if (searchTerm.trim()) qs.set('search', searchTerm.trim())
      if (filterCategory) qs.set('category', filterCategory)
      if (filterStatus) qs.set('status', filterStatus)

      // Récupération parallèle des données
      const [catalogResponse, itemsResponse, templatesResponse] = await Promise.all([
        fetch(`/api/admin/catalogue?refresh=true&${qs.toString()}${cacheBuster}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`/api/admin/items?refresh=true${cacheBuster}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }),
        fetch(`/api/templates?refresh=true${cacheBuster}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
      ])

      if (!catalogResponse.ok) throw new Error('Erreur catalogue')

      const catalogData = await catalogResponse.json()
      console.log('🔄 Données catalogue récupérées:', catalogData)

      if (catalogData.success && catalogData.data && catalogData.data.catalogues !== undefined) {
        setCatalogItems(catalogData.data.catalogues)
        // Utilise total de l'API si fourni (compat: data.total ou data.pagination.total)
        if (typeof catalogData.data.total === 'number') {
          setTotalCatalogItems(catalogData.data.total)
        } else if (catalogData.data.pagination && typeof catalogData.data.pagination.total === 'number') {
          setTotalCatalogItems(catalogData.data.pagination.total)
        } else if (Array.isArray(catalogData.data.catalogues)) {
          setTotalCatalogItems(catalogData.data.catalogues.length)
        }
        console.log('✅ Catalogues mis à jour:', catalogData.data.catalogues.length)
      } else {
        console.error('Format de données catalogue inattendu:', catalogData)
        setCatalogItems([])
        setTotalCatalogItems(0)
      }

      // Items (optionnels)
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        if (itemsData?.success && itemsData.data && Array.isArray(itemsData.data.items)) {
          setItems(itemsData.data.items)
        } else if (Array.isArray(itemsData)) {
          // fallback ancien format
          setItems(itemsData)
        } else {
          setItems([])
        }
      }

      // Templates (optionnels)
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setTemplates(templatesData)
      }

      setError(null)
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err)
      setError('Erreur lors du chargement des données')
      setCatalogItems([])
      setTotalCatalogItems(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (forceRefresh: boolean = false) => {
    try {
      setStatsLoading(true)
      const timestamp = Date.now()
      const cacheBuster = forceRefresh ? `?force=${timestamp}&nocache=true` : `?_t=${timestamp}`

      const response = await fetch(`/api/admin/catalogue/stats${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques')

      const result = await response.json()
      console.log('📊 Stats récupérées:', result)

      if (result.success && result.data && result.data.data) {
        setStats(result.data.data)
      } else {
        console.error('Format de données stats inattendu:', result)
        setStats(null)
      }
    } catch (err: any) {
      console.error('Erreur stats:', err)
      // Ne pas bloquer l'interface pour les stats
    } finally {
      setStatsLoading(false)
    }
  }

  // Fonction de rafraîchissement manuel
  const handleRefresh = async () => {
    console.log('🔄 Rafraîchissement manuel déclenché')
    await Promise.all([
      fetchData(true),
      fetchStats(true)
    ])
  }

  // ===== GESTION DES ACTIONS =====
  const handleCreateDefaults = async () => {
    if (!confirm('Créer les catalogues par défaut ? Cela va ajouter les éléments standards au catalogue.')) return

    try {
      const response = await fetch('/api/admin/catalogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_defaults'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la création')
      }

      // Rafraîchir les données avec force
      await Promise.all([
        fetchData(true),
        fetchStats(true)
      ])

      toast.success(`${result.data?.count || 'Plusieurs'} catalogues par défaut créés avec succès !`)
    } catch (err: any) {
      console.error('Erreur lors de la création des catalogues par défaut:', err)
      setError(err.message || 'Erreur lors de la création des catalogues par défaut')
    }
  }

  // ===== GESTION DU FORMULAIRE =====
  const resetForm = () => {
    setFormData({
      itemId: '',
      category: 'DEMENAGEMENT',
      subcategory: '',
      marketingTitle: '',
      marketingSubtitle: '',
      marketingDescription: '',
      marketingPrice: 0,
      originalPrice: 0,
      badgeText: '',
      badgeColor: '#E67E22',
      promotionText: '',
      isFeatured: false,
      isNewOffer: false,
      isVisible: true,
      isActive: true,
      displayOrder: 0,
      targetAudience: 'particuliers',
      startDate: '',
      endDate: ''
    })
  }

  const handleCreate = () => {
    resetForm()
    setEditingItem(null)
    setShowModal(true)
  }

  const handleEdit = (item: CatalogItem) => {
    setFormData({
      itemId: item.itemId || '',
      category: item.category,
      subcategory: item.subcategory || '',
      marketingTitle: item.marketingTitle || '',
      marketingSubtitle: item.marketingSubtitle || '',
      marketingDescription: item.marketingDescription || '',
      marketingPrice: item.marketingPrice || 0,
      originalPrice: item.originalPrice || 0,
      badgeText: item.badgeText || '',
      badgeColor: item.badgeColor || '#E67E22',
      promotionText: item.promotionText || '',
      isFeatured: item.isFeatured,
      isNewOffer: item.isNewOffer || false,
      isVisible: item.isVisible || true,
      isActive: item.isActive,
      displayOrder: item.displayOrder,
      targetAudience: item.targetAudience || 'particuliers',
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : ''
    })
    setEditingItem(item)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem 
        ? `/api/admin/catalogue/${editingItem.id}` 
        : '/api/admin/catalogue'
      
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: editingItem 
          ? JSON.stringify(formData)
          : JSON.stringify({ action: 'create', ...formData })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde')
      }

      await fetchData(true)
      setShowModal(false)
      resetForm()
      setEditingItem(null)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/catalogue/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')

      await fetchData(true)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors de la suppression')
    }
  }

  const toggleStatus = async (id: string, field: 'isActive' | 'isFeatured' | 'isNewOffer') => {
    try {
      if (!Array.isArray(catalogItems)) return
      const item = catalogItems.find(item => item.id === id)
      if (!item) return

      const response = await fetch(`/api/admin/catalogue/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          [field]: !item[field]
        })
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour')

      await fetchData(true)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError('Erreur lors de la mise à jour')
    }
  }

  // ===== FILTRAGE =====
  // Désormais géré côté serveur; on garde une passe locale no-op pour compat
  const filteredItems = Array.isArray(catalogItems) ? catalogItems : []

  // ===== PAGINATION =====
  const totalPages = Math.max(1, Math.ceil(totalCatalogItems / itemsPerPage))
  const paginatedItems = filteredItems

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterStatus])

  // Refetch lorsque pagination/filtre/recherche changent
  useEffect(() => {
    fetchData()
  }, [currentPage, itemsPerPage, searchTerm, filterCategory, filterStatus])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1) // Toujours revenir à la page 1
  }

  // S'assurer que currentPage reste valide
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCatalogItems / itemsPerPage))
    if (currentPage > maxPage) {
      setCurrentPage(maxPage)
    }
  }, [totalCatalogItems, itemsPerPage, currentPage])

  // ===== UTILITAIRES =====
  const getCategoryStyle = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat?.color || 'bg-gray-100 text-gray-800'
  }

  const getDisplayName = (item: CatalogItem) => {
    return item.marketingTitle || item.item?.name || 'Sans nom'
  }

  const getDisplayPrice = (item: CatalogItem) => {
    return item.marketingPrice || item.item?.price || 0
  }

  // ===== RENDU =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion du Catalogue</h1>
              <p className="mt-2 text-gray-600">Gérez les éléments visibles dans votre catalogue avec analytics avancés</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || statsLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <ArrowPathIcon className={`h-5 w-5 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {/* Métriques rapides */}
          {stats && !statsLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <TagIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Catalogues</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.overview.totalCatalogues}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <CurrencyEuroIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-lg font-semibold text-gray-900">{(stats.business as any)?.totalRevenue?.toLocaleString?.() || '0'}€</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Taux d'usage</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.overview?.avgVisibility?.toFixed(1) || '0'}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Alertes</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.alerts?.count || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="management">Gestion</TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Statistiques principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                        Catalogues Actifs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.activeCatalogues}/{stats.overview.totalCatalogues}</div>
                      <p className="text-sm text-gray-600">
                        Taux d'activation: {stats.overview.totalCatalogues > 0 ? ((stats.overview.activeCatalogues / stats.overview.totalCatalogues) * 100).toFixed(1) : 0}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 text-green-600" />
                        En Vedette & Populaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.featuredCatalogues}</div>
                      <p className="text-sm text-gray-600">
                        {stats.overview.popularCatalogues} populaires
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <EyeIcon className="h-5 w-5 text-purple-600" />
                        Visibilité
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.avgVisibility?.toFixed(1) || 0}%</div>
                      <p className="text-sm text-gray-600">
                        {stats.overview.categoriesCount} catégories
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Évolution usage (derniers 7 jours) */}
                {stats.trends?.usageEvolution && stats.trends.usageEvolution.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution de l'usage (7 derniers jours)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.trends.usageEvolution.map((day, index) => (
                          <div key={day.period} className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm">{new Date(day.period).toLocaleDateString('fr-FR')}</span>
                            <div className="flex gap-4">
                              <span className="text-sm font-medium">{day.cataloguesCreated} catalogues</span>
                              <span className="text-sm text-blue-600">{day.totalViews} vues</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Alertes */}
                {stats.alerts && stats.alerts.count > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        Alertes ({stats.alerts.count})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.alerts.inactive && stats.alerts.inactive.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Catalogues inactifs:</h4>
                            {stats.alerts.inactive.map(catalogue => (
                              <div key={catalogue.id} className="flex justify-between items-center py-1">
                                <span className="text-sm">{catalogue.category}</span>
                                <Badge variant="destructive">{catalogue.daysInactive} jours</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                        {stats.alerts.duplicateSubcategories && stats.alerts.duplicateSubcategories.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Sous-catégories dupliquées:</h4>
                            {stats.alerts.duplicateSubcategories.map(duplicate => (
                              <div key={`${duplicate.category}-${duplicate.subcategory}`} className="flex justify-between items-center py-1">
                                <span className="text-sm">{duplicate.category} - {duplicate.subcategory}</span>
                                <Badge variant="secondary">{duplicate.count} doublons</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Message si pas de stats */}
                {!stats.overview && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">Aucune statistique disponible pour le moment</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Performance */}
          <TabsContent value="performance">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChevronUpIcon className="h-5 w-5 text-green-600" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.performance.topPerforming.map((catalogue, index) => (
                        <div key={catalogue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{catalogue.category}</div>
                            <div className="text-sm text-gray-600">{catalogue.subcategory || 'Standard'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">#{catalogue.displayOrder}</div>
                            <div className="text-sm text-gray-600">
                              {catalogue.isPopular && <span className="text-yellow-600">★ </span>}
                              {catalogue.isFeatured && <span className="text-blue-600">⭐ </span>}
                            </div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500">Aucune donnée disponible</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChevronDownIcon className="h-5 w-5 text-red-600" />
                      Éléments sous-performants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.performance.underPerforming.map((catalogue) => (
                        <div key={catalogue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{catalogue.category}</div>
                            <div className="text-sm text-gray-600">{catalogue.subcategory || 'Standard'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-orange-600">
                              {catalogue.isActive ? 'Actif' : 'Inactif'}
                            </div>
                            <div className="text-sm text-gray-600">{catalogue.daysSinceCreation} jours</div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500">Aucune donnée disponible</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Onglet Business */}
          <TabsContent value="business">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques par Catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.business.statsByCategory.map((category) => (
                        <div key={category.category} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <div className="font-medium">{category.category}</div>
                            <div className="text-sm text-gray-600">{category.total} éléments</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{category.active} actifs</div>
                            <div className="text-sm text-gray-600">
                              {category.featured} vedette · {category.popular} populaires
                            </div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500">Aucune donnée disponible</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribution par Catégorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats?.business.distribution.byCategory.map((category) => (
                          <div key={category.category} className="flex justify-between items-center">
                            <span className="font-medium">{category.category}</span>
                            <span className="font-bold text-blue-600">{category.percentage}%</span>
                          </div>
                        )) || (
                          <p className="text-gray-500">Aucune donnée disponible</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribution par Statut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats?.business.distribution.byStatus.map((status) => (
                          <div key={status.status} className="flex justify-between items-center">
                            <span className="font-medium">{status.status}</span>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{status.count}</div>
                              <div className="text-sm text-gray-600">{status.percentage}%</div>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500">Aucune donnée disponible</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Onglet Gestion (Cards comme Templates) */}
          <TabsContent value="management">
            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Actions et Filtres */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1 flex gap-4">
                <input
                  type="text"
                  placeholder="Rechercher un catalogue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes catégories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="featured">En vedette</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateDefaults}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Catalogues par défaut
                </button>
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nouveau Catalogue
                </button>
              </div>
            </div>

            {/* Contrôles de pagination */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {totalCatalogItems} catalogue{totalCatalogItems > 1 ? 's' : ''} au total
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Afficher:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">par page</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = page === 1 || page === totalPages ||
                        Math.abs(page - currentPage) <= 1

                      if (!showPage && page === 2 && currentPage > 4) {
                        return <span key="dots1" className="px-2 text-gray-400">...</span>
                      }
                      if (!showPage && page === totalPages - 1 && currentPage < totalPages - 3) {
                        return <span key="dots2" className="px-2 text-gray-400">...</span>
                      }
                      if (!showPage) return null

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>

            {/* Catalogues Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">Aucun catalogue trouvé</div>
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Créer le premier catalogue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{getDisplayName(item)}</h3>
                            {item.isFeatured && (
                              <StarIconSolid className="h-5 w-5 text-yellow-400" />
                            )}
                            {item.isNewOffer && (
                              <SparklesIconSolid className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {item.marketingSubtitle || item.item?.description || 'Aucune description'}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(item.category)}`}>
                            {CATEGORIES.find(c => c.value === item.category)?.label}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleStatus(item.id, 'isActive')}
                          className={`p-1 rounded-full ${
                            item.isActive ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {item.isActive ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <XCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <CurrencyEuroIcon className="h-5 w-5 text-green-600 mx-auto mb-1" />
                          <p className="text-sm text-gray-600">Prix</p>
                          <p className="font-semibold text-green-600">
                            {getDisplayPrice(item)}€
                            {item.originalPrice && item.originalPrice > getDisplayPrice(item) && (
                              <span className="block text-xs text-gray-500 line-through">
                                {item.originalPrice}€
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-center">
                          <TagIcon className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-sm text-gray-600">Ordre</p>
                          <p className="font-semibold text-blue-600">{item.displayOrder}</p>
                        </div>
                        <div className="text-center">
                          <EyeIcon className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                          <p className="text-sm text-gray-600">Statut</p>
                          <p className={`font-semibold ${item.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                            {item.isActive ? 'Actif' : 'Inactif'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleStatus(item.id, 'isFeatured')}
                          className={`px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-2 ${
                            item.isFeatured
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Mettre en vedette"
                        >
                          <StarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination en bas */}
                {paginatedItems.length > 0 && (
                  <div className="col-span-full mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Précédent
                      </button>

                      <span className="px-4 py-1 text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </span>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de création/édition */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingItem ? 'Modifier l\'élément' : 'Ajouter un élément'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sélection de l'item */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.itemId}
                    onChange={(e) => setFormData({...formData, itemId: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un item</option>
                    {Array.isArray(items) && items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.price}€
                        {item.template && ` (${item.template.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Titre marketing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre Marketing
                  </label>
                  <input
                    type="text"
                    value={formData.marketingTitle}
                    onChange={(e) => setFormData({...formData, marketingTitle: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre affiché dans le catalogue"
                  />
                </div>

                {/* Prix marketing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix Marketing (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.marketingPrice}
                    onChange={(e) => setFormData({...formData, marketingPrice: parseFloat(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Prix affiché dans le catalogue"
                  />
                </div>

                {/* Ordre d'affichage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">En vedette</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isNewOffer}
                      onChange={(e) => setFormData({...formData, isNewOffer: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Nouvelle offre</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({...formData, isVisible: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Visible</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Actif</span>
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingItem ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 