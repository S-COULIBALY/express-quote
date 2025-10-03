'use client'

import { useState, useEffect } from 'react'
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
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface Template {
  id: string
  name: string
  description: string
  serviceType: string
  basePrice: number
  duration: number
  workers: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateStats {
  overview: {
    totalTemplates: number
    activeTemplates: number
    totalItems: number
    totalRevenue: number
    avgConversionRate: number
    avgUsageRate: number
  }
  performance: {
    topPerforming: Array<{
      id: string
      name: string
      type: string
      itemsCount: number
      revenue: number
      conversionRate: number
    }>
    underPerforming: Array<{
      id: string
      name: string
      type: string
      itemsCount: number
      lastUsed: string | null
      daysInactive: number
    }>
  }
  business: {
    revenueByType: Array<{
      type: string
      revenue: number
      itemsCount: number
      avgPrice: number
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

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<TemplateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // État de pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalTemplates, setTotalTemplates] = useState(0)

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceType: 'MOVING',
    basePrice: 0,
    duration: 1,
    workers: 1,
    isActive: true
  })

  // Types de service disponibles (correspondance avec DDD)
  const serviceTypes = [
    { value: 'MOVING', label: 'Déménagement' },
    { value: 'CLEANING', label: 'Ménage' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'DELIVERY', label: 'Livraison' }
  ]

  // Fonction de rafraîchissement globale
  const handleRefresh = async () => {
    console.log('🔄 Rafraîchissement forcé des données Templates...')
    await Promise.all([
      fetchTemplates(true),
      fetchStats(true)
    ])
    console.log('✅ Toutes les données Templates ont été rafraîchies')
  }

  // Chargement des données
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchTemplates = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      const timestamp = Date.now()
      const cacheBuster = forceRefresh ? `&force=${timestamp}&nocache=true` : `&_t=${timestamp}`
      const limit = itemsPerPage
      const offset = (currentPage - 1) * itemsPerPage
      const search = encodeURIComponent(searchTerm.trim())

      const query = `limit=${limit}&offset=${offset}${search ? `&search=${search}` : ''}`

      const response = await fetch(`/api/admin/templates?refresh=true&${query}${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) throw new Error('Erreur lors du chargement')

      const data = await response.json()

      // Adapter la réponse DDD
      if (data.success && data.data && data.data.templates !== undefined) {
        setTemplates(data.data.templates)
        if (typeof data.data.total === 'number') {
          setTotalTemplates(data.data.total)
        } else if (Array.isArray(data.data.templates)) {
          // fallback: si l'API ne renvoie pas total, utiliser la longueur courante
          setTotalTemplates(data.data.templates.length)
        }
      } else {
        throw new Error('Format de réponse invalide')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setTemplates([])
      setTotalTemplates(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (forceRefresh: boolean = false) => {
    try {
      setStatsLoading(true)
      const timestamp = Date.now()
      const cacheBuster = forceRefresh ? `&force=${timestamp}&nocache=true` : `&_t=${timestamp}`

      const response = await fetch(`/api/admin/templates/stats?refresh=true${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques')

      const data = await response.json()

      // Adapter la réponse DDD pour les stats
      if (data.success && data.data && data.data.data) {
        setStats(data.data.data)
      } else if (data.success && data.data) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Erreur stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  // Rafraîchir les templates quand pagination/recherche changent
  useEffect(() => {
    fetchTemplates()
  }, [currentPage, itemsPerPage, searchTerm])

  // Filtrage des templates (désactivé: géré côté serveur)
  const filteredTemplates = templates

  // Pagination (côté serveur)
  const totalPages = Math.max(1, Math.ceil(totalTemplates / itemsPerPage))
  const paginatedTemplates = templates

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handlePageChange = (page: number) => {
    // Empêcher d'aller hors bornes
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
    const maxPage = Math.max(1, Math.ceil(totalTemplates / itemsPerPage))
    if (currentPage > maxPage) {
      setCurrentPage(maxPage)
    }
  }, [totalTemplates, itemsPerPage, currentPage])

  // Handlers
  const handleCreate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      serviceType: 'MOVING',
      basePrice: 0,
      duration: 1,
      workers: 1,
      isActive: true
    })
    setShowModal(true)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      serviceType: template.serviceType,
      basePrice: template.basePrice,
      duration: template.duration,
      workers: template.workers,
      isActive: template.isActive
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let response;

      if (editingTemplate) {
        // Mise à jour
        response = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })
      } else {
        // Création avec action
        response = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            ...formData
          })
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la sauvegarde')
      }

      await fetchTemplates(true) // Force refresh
      await fetchStats(true) // Refresh stats aussi
      setShowModal(false)
      setEditingTemplate(null)

    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return

    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la suppression')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la suppression')
      }

      await fetchTemplates(true) // Force refresh
      await fetchStats(true) // Force refresh
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      const template = templates.find(t => t.id === id)
      if (!template) return

      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          isActive: !template.isActive
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la mise à jour')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la mise à jour')
      }

      await fetchTemplates(true) // Force refresh
      await fetchStats(true) // Refresh stats aussi

    } catch (err) {
      console.error('Erreur toggle:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  const handleCreateDefaults = async () => {
    if (!confirm('Créer les templates par défaut ? Cela va ajouter les modèles standards.')) return

    try {
      const response = await fetch('/api/admin/templates', {
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

      await fetchTemplates(true) // Force refresh
      await fetchStats(true) // Force refresh
      alert(`${result.data?.count || 0} templates par défaut créés avec succès !`)

    } catch (err) {
      console.error('Erreur création defaults:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la création des templates par défaut')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des templates...</p>
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
            onClick={() => fetchTemplates(true)}
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Templates</h1>
              <p className="mt-2 text-gray-600">Analytics et gestion des modèles de services</p>
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
          {stats && !statsLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Templates</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.overview.totalTemplates}</p>
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
                    <p className="text-lg font-semibold text-gray-900">{stats.overview.avgUsageRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Alertes</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.alerts.count}</p>
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
                {/* Statistiques générales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                        Templates Actifs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.activeTemplates}/{stats.overview.totalTemplates}</div>
                      <p className="text-sm text-gray-600">Taux d'activation: {((stats.overview.activeTemplates / stats.overview.totalTemplates) * 100).toFixed(1)}%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CurrencyEuroIcon className="h-5 w-5 text-green-600" />
                        Items Créés
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalItems}</div>
                      <p className="text-sm text-gray-600">Revenue: {stats.overview.totalRevenue.toLocaleString()}€</p>
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
                      <div className="text-2xl font-bold">{stats.overview.avgConversionRate.toFixed(1)}%</div>
                      <p className="text-sm text-gray-600">Taux moyen</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Évolution usage (derniers 7 jours) */}
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
                            <span className="text-sm font-medium">{day.itemsCreated} items</span>
                            <span className="text-sm text-green-600">{day.revenue.toFixed(2)}€</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Alertes */}
                {stats.alerts.count > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        Alertes ({stats.alerts.count})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.alerts.unused.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Templates inutilisés:</h4>
                            {stats.alerts.unused.map(template => (
                              <div key={template.id} className="flex justify-between items-center py-1">
                                <span className="text-sm">{template.name}</span>
                                <Badge variant="destructive">{template.daysInactive} jours</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                        {stats.alerts.lowPerforming.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Faible performance:</h4>
                            {stats.alerts.lowPerforming.map(template => (
                              <div key={template.id} className="flex justify-between items-center py-1">
                                <span className="text-sm">{template.name}</span>
                                <Badge variant="secondary">{template.conversionRate.toFixed(1)}%</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">Aucune donnée disponible</div>
            )}
          </TabsContent>

          {/* Onglet Performance */}
          <TabsContent value="performance">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Top performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChevronUpIcon className="h-5 w-5 text-green-600" />
                        Top Performers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.performance.topPerforming.map((template, index) => (
                          <div key={template.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">{index + 1}. {template.name}</div>
                              <div className="text-sm text-gray-600">{template.type}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">{template.revenue.toLocaleString()}€</div>
                              <div className="text-sm text-gray-600">{template.itemsCount} items</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChevronDownIcon className="h-5 w-5 text-red-600" />
                        Templates sous-performants
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.performance.underPerforming.length > 0 ? (
                          stats.performance.underPerforming.map((template) => (
                            <div key={template.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-gray-600">{template.type}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-red-600">
                                  {template.daysInactive > 1000 ? 'Jamais utilisé' : `${template.daysInactive} jours`}
                                </div>
                                <div className="text-sm text-gray-600">{template.itemsCount} items</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">Tous les templates performent bien !</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Métriques de performance détaillées */}
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par type de service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.business.revenueByType.map((type) => (
                        <div key={type.type} className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">{type.type}</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Revenue:</span>
                              <span className="font-medium">{type.revenue.toLocaleString()}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Items:</span>
                              <span className="font-medium">{type.itemsCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Prix moyen:</span>
                              <span className="font-medium">{type.avgPrice.toFixed(2)}€</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">Aucune donnée disponible</div>
            )}
          </TabsContent>

          {/* Onglet Business */}
          <TabsContent value="business">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* ROI Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChevronUpIcon className="h-5 w-5 text-green-600" />
                        Templates les plus rentables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.business.profitability.mostProfitable.map((template, index) => (
                          <div key={template.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">{index + 1}. {template.name}</div>
                              <div className="text-sm text-gray-600">Revenue: {template.revenue.toLocaleString()}€</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">ROI: {template.roi.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChevronDownIcon className="h-5 w-5 text-red-600" />
                        Templates moins rentables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.business.profitability.leastProfitable.map((template, index) => (
                          <div key={template.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-gray-600">Revenue: {template.revenue.toLocaleString()}€</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-red-600">ROI: {template.roi.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Analyse du revenue */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse financière détaillée</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.overview.totalRevenue.toLocaleString()}€</div>
                        <div className="text-sm text-gray-600">Revenue Total</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {stats.overview.totalItems > 0 ? (stats.overview.totalRevenue / stats.overview.totalItems).toFixed(2) : 0}€
                        </div>
                        <div className="text-sm text-gray-600">Revenue Moyen par Item</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {stats.overview.totalTemplates > 0 ? (stats.overview.totalRevenue / stats.overview.totalTemplates).toFixed(2) : 0}€
                        </div>
                        <div className="text-sm text-gray-600">Revenue Moyen par Template</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">Aucune donnée disponible</div>
            )}
          </TabsContent>

          {/* Onglet Gestion (CRUD existant) */}
          <TabsContent value="management">
            {/* Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher un template..."
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
                  Templates par défaut
                </button>
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nouveau Template
                </button>
              </div>
            </div>

        {/* Contrôles de pagination */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {totalTemplates} template{totalTemplates > 1 ? 's' : ''} au total
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

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.serviceType === 'MOVING' ? 'bg-blue-100 text-blue-800' :
                      template.serviceType === 'CLEANING' ? 'bg-green-100 text-green-800' :
                      template.serviceType === 'TRANSPORT' ? 'bg-purple-100 text-purple-800' :
                      template.serviceType === 'DELIVERY' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {serviceTypes.find(st => st.value === template.serviceType)?.label || template.serviceType}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleStatus(template.id)}
                    className={`p-1 rounded-full ${
                      template.isActive ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {template.isActive ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <XCircleIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <CurrencyEuroIcon className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Prix de base</p>
                    <p className="font-semibold text-green-600">{template.basePrice}€</p>
                  </div>
                  <div className="text-center">
                    <ClockIcon className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Durée</p>
                    <p className="font-semibold text-blue-600">{template.duration}h</p>
                  </div>
                  <div className="text-center">
                    <UserGroupIcon className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Ouvriers</p>
                    <p className="font-semibold text-purple-600">{template.workers}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
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

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 col-span-full">
            <p className="text-gray-500 text-lg">Aucun template trouvé</p>
            <button
              onClick={handleCreate}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Créer le premier template
            </button>
          </div>
        )}

        {/* Pagination en bas */}
        {paginatedTemplates.length > 0 && (
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
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {serviceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de base (€)</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({...formData, basePrice: Number(e.target.value)})}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (heures)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'ouvriers</label>
                <input
                  type="number"
                  value={formData.workers}
                  onChange={(e) => setFormData({...formData, workers: Number(e.target.value)})}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
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
                  Template actif
                </label>
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
                  {editingTemplate ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 