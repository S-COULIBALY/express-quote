'use client'

import { useState, useEffect, useMemo } from 'react'
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
  TagIcon
} from '@heroicons/react/24/outline'

interface Template {
  id: string
  name: string
  serviceType: string
  basePrice: number
  duration: number
  workers: number
}

interface Item {
  id: string
  name: string
  description: string
  price: number
  isPopular: boolean
  templateId: string
  template?: Template  // Optionnel car pas toujours chargé
  isActive: boolean
  createdAt: string
  updatedAt: string
  type: string
  workers: number
  duration: number
}

interface ItemStats {
  overview: {
    totalItems: number
    activeItems: number
    popularItems: number
    totalRevenue: number
    avgConversionRate: number
    avgUsageRate: number
  }
  performance: {
    topPerforming: Array<{
      id: string
      name: string
      type: string
      revenue: number
      isPopular: boolean
      usageCount: number
    }>
    underPerforming: Array<{
      id: string
      name: string
      type: string
      revenue: number
      daysSinceCreation: number
    }>
  }
  business: {
    revenueByType: Array<{
      type: string
      count: number
      itemsCount: number
      avgPrice: number
      totalValue: number
      revenue: number
    }>
    profitability: {
      mostProfitable: Array<{
        id: string
        name: string
        roi: number
        revenue: number
      }>
      leastProfitable: Array<{
        id: string
        name: string
        roi: number
        revenue: number
      }>
    }
  }
  trends: {
    usageEvolution: Array<{
      period: string
      itemsCreated: number
      revenue: number
    }>
  }
  alerts: {
    count: number
    unused: Array<{
      id: string
      name: string
      daysInactive: number
    }>
    lowPerforming: Array<{
      id: string
      name: string
      conversionRate: number
    }>
  }
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<ItemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // État de pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    isPopular: false,
    templateId: '',
    isActive: true
  })

  // Fonction de rafraîchissement globale
  const handleRefresh = async () => {
    console.log('🔄 Rafraîchissement forcé des données Items...')
    await Promise.all([
      fetchItems(true),
      fetchTemplates(true),
      fetchStats(true)
    ])
    console.log('✅ Toutes les données Items ont été rafraîchies')
  }

  // Chargement des données
  useEffect(() => {
    fetchTemplates()
    fetchStats()
  }, [])

  const fetchItems = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      const timestamp = Date.now()

      // Cache busting plus agressif
      const cacheBuster = forceRefresh ? `&force=${timestamp}&nocache=true` : `&_t=${timestamp}`

      const limit = itemsPerPage
      const offset = (currentPage - 1) * itemsPerPage
      const search = encodeURIComponent(searchTerm.trim())
      const query = `limit=${limit}&offset=${offset}${search ? `&search=${search}` : ''}`

      const response = await fetch(`/api/admin/items?refresh=true&${query}${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) throw new Error('Erreur lors du chargement')

      const result = await response.json()
      console.log('🔄 Données items récupérées:', result)

      if (result.success && result.data && result.data.items !== undefined) {
        setItems(result.data.items)
        if (typeof result.data.total === 'number') {
          setTotalItems(result.data.total)
        } else if (Array.isArray(result.data.items)) {
          // fallback si total non fourni
          setTotalItems(result.data.items.length)
        }
        console.log('✅ Items mis à jour:', result.data.items.length)
      } else {
        console.error('Format de données inattendu:', result)
        setItems([])
        setTotalItems(0)
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setItems([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async (forceRefresh: boolean = false) => {
    try {
      const timestamp = Date.now()
      const cacheBuster = forceRefresh ? `&force=${timestamp}&nocache=true` : `&_t=${timestamp}`

      const response = await fetch(`/api/admin/templates?refresh=true${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) throw new Error('Erreur lors du chargement des templates')

      const result = await response.json()
      if (result.success && result.data && result.data.templates) {
        setTemplates(result.data.templates)
      } else {
        console.error('Format de données templates inattendu:', result)
        setTemplates([])
      }
    } catch (err) {
      console.error('Erreur templates:', err)
      setTemplates([])
    }
  }

  const fetchStats = async (forceRefresh: boolean = false) => {
    try {
      setStatsLoading(true)
      const timestamp = Date.now()
      const cacheBuster = forceRefresh ? `&force=${timestamp}&nocache=true` : `&_t=${timestamp}`

      const response = await fetch(`/api/admin/items/stats?refresh=true${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques')

      const result = await response.json()
      if (result.success && result.data && result.data.data) {
        setStats(result.data.data)
      } else {
        console.error('Format de données stats inattendu:', result)
        setStats(null)
      }
    } catch (err) {
      console.error('Erreur stats:', err)
      setStats(null)
      // Ne pas bloquer l'interface pour les stats
    } finally {
      setStatsLoading(false)
    }
  }

  // Rafraîchir quand pagination/recherche changent
  useEffect(() => {
    fetchItems()
  }, [currentPage, itemsPerPage, searchTerm])

  // Enrichissement des items avec les templates
  const itemsWithTemplates = useMemo(() => {
    if (!Array.isArray(items) || !Array.isArray(templates)) {
      return [];
    }

    return items.map(item => {
      const template = templates.find(t => t.id === item.templateId);
      return { ...item, template };
    });
  }, [items, templates]);

  // Filtrage des items (désactivé côté client – déjà géré côté serveur), on le garde pour robustesse locale
  const getFilteredItems = () => {
    try {
      return itemsWithTemplates;
    } catch (error) {
      console.error('Erreur filtrage items:', error);
      return [];
    }
  };

  const filteredItems = getFilteredItems();

  // Pagination côté serveur
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const paginatedItems = filteredItems

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

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
    const maxPage = Math.max(1, Math.ceil(totalItems / itemsPerPage))
    if (currentPage > maxPage) {
      setCurrentPage(maxPage)
    }
  }, [totalItems, itemsPerPage, currentPage])

  // Handlers
  const handleCreate = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      isPopular: false,
      templateId: templates.length > 0 ? templates[0].id : '',
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      isPopular: item.isPopular,
      templateId: item.templateId,
      isActive: item.isActive
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem ? `/api/admin/items/${editingItem.id}` : '/api/admin/items'
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      await fetchItems(true) // Force refresh
      await fetchStats(true) // Refresh stats aussi
      setShowModal(false)
      setEditingItem(null)
      
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) return

    try {
      const response = await fetch(`/api/admin/items/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      await fetchItems(true) // Force refresh
      await fetchStats(true) // Refresh stats aussi
    } catch (err) {
      console.error('Erreur suppression:', err)
      toast.error('Erreur lors de la suppression')
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) return

      const response = await fetch(`/api/admin/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      await fetchItems(true) // Force refresh
      await fetchStats(true) // Refresh stats aussi

    } catch (err) {
      console.error('Erreur toggle:', err)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const togglePopular = async (id: string) => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) return

      const response = await fetch(`/api/admin/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          isPopular: !item.isPopular
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      await fetchItems(true) // Force refresh
      await fetchStats(true) // Refresh stats aussi

    } catch (err) {
      console.error('Erreur toggle popular:', err)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleCreateDefaults = async () => {
    if (!confirm('Créer les items par défaut ? Cela ajoutera des items basés sur les templates existants.')) return

    try {
      const response = await fetch('/api/admin/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_defaults'
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création des items par défaut')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(`${result.data.count || 0} items par défaut créés avec succès !`)
        await fetchItems(true) // Force refresh
        await fetchStats(true) // Force refresh
      } else {
        throw new Error(result.message || 'Erreur lors de la création')
      }

    } catch (err) {
      console.error('Erreur création defaults:', err)
      toast.error('Erreur lors de la création des items par défaut')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des items...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchItems(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Items</h1>
              <p className="mt-2 text-gray-600">Gérez les éléments spécifiques basés sur vos templates avec analytics avancés</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || statsLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {/* Métriques rapides */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Items</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.overview.totalItems}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <CurrencyEuroIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.overview.totalRevenue.toLocaleString()}€</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <ChevronUpIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Taux d'usage</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.overview.avgUsageRate?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Populaires</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.overview.popularItems || 0}</p>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.overview.totalItems || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.overview.activeItems || 0} actifs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
                    <CurrencyEuroIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.overview.totalRevenue?.toFixed(2) || 0}€</div>
                    <p className="text-xs text-muted-foreground">
                      Conversion {stats?.overview.avgConversionRate?.toFixed(1) || 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Items Populaires</CardTitle>
                    <StarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.overview.popularItems || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Taux d'usage {stats?.overview.avgUsageRate?.toFixed(1) || 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alertes</CardTitle>
                    <ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.alerts.count || 0}</div>
                    <p className="text-xs text-muted-foreground">Items nécessitant attention</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section détaillée comme Templates */}
            {!statsLoading && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-blue-600" />
                      Items Actifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.overview.activeItems}/{stats.overview.totalItems}</div>
                    <p className="text-sm text-gray-600">Taux d'activation: {((stats.overview.activeItems / stats.overview.totalItems) * 100).toFixed(1)}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CurrencyEuroIcon className="h-5 w-5 text-green-600" />
                      Revenue Moyen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.overview.totalItems > 0 ? (stats.overview.totalRevenue / stats.overview.totalItems).toFixed(2) : 0}€
                    </div>
                    <p className="text-sm text-gray-600">Par item</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChevronUpIcon className="h-5 w-5 text-purple-600" />
                      Conversion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.overview.avgConversionRate?.toFixed(1) || 0}%</div>
                    <p className="text-sm text-gray-600">Taux moyen</p>
                  </CardContent>
                </Card>
              </div>
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
                      {stats?.performance.topPerforming.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{item.revenue}€</div>
                            <div className="text-sm text-gray-600">{item.usageCount} utilisations</div>
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
                      Items sous-performants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.performance.underPerforming.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-orange-600">{item.revenue}€</div>
                            <div className="text-sm text-gray-600">{item.daysSinceCreation} jours</div>
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
                    <CardTitle>Revenus par Type de Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.business.revenueByType.map((type) => (
                        <div key={type.type} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <div className="font-medium">{type.type}</div>
                            <div className="text-sm text-gray-600">{type.itemsCount} items</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{type.revenue}€</div>
                            <div className="text-sm text-gray-600">Moy: {type.avgPrice.toFixed(2)}€</div>
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
                      <CardTitle>Items les plus rentables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats?.business.profitability.mostProfitable.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span className="font-medium">{item.name}</span>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{item.revenue}€</div>
                              <div className="text-sm text-gray-600">ROI {item.roi}%</div>
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
                      <CardTitle>Items moins rentables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats?.business.profitability.leastProfitable.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span className="font-medium">{item.name}</span>
                            <div className="text-right">
                              <div className="font-bold text-orange-600">{item.revenue}€</div>
                              <div className="text-sm text-gray-600">ROI {item.roi}%</div>
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

          {/* Onglet Gestion (CRUD existant) */}
          <TabsContent value="management">

            {/* Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher un item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateDefaults}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Items par défaut
                </button>
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nouvel Item
                </button>
              </div>
            </div>

            {/* Contrôles de pagination */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {totalItems} item{totalItems > 1 ? 's' : ''} au total
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

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          {item.isPopular && (
                            <StarIcon className="h-5 w-5 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <TagIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{item.template?.name}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => togglePopular(item.id)}
                          className={`p-1 rounded-full ${
                            item.isPopular ? 'text-yellow-500 hover:bg-yellow-100' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <StarIcon className={`h-5 w-5 ${item.isPopular ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => toggleStatus(item.id)}
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
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-center bg-gray-50 rounded-lg py-3">
                        <CurrencyEuroIcon className="h-6 w-6 text-green-600 mr-2" />
                        <span className="text-2xl font-bold text-green-600">{item.price}€</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
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
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 col-span-full">
                <p className="text-gray-500 text-lg">Aucun item trouvé</p>
                <button
                  onClick={handleCreate}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Créer le premier item
                </button>
              </div>
            )}

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
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Modifier l\'item' : 'Nouvel item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({...formData, templateId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-700">
                    Populaire
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Actif
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 