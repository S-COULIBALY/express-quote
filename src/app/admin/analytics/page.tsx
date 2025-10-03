'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ChartPieIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline"

interface AnalyticsData {
  overview: {
    conversions: number
    revenue: number
    visitors: number
    availability: number
    conversionGrowth: string
    revenueGrowth: string
  }
  revenue: {
    paid: number
    total: number
    pending: number
    breakdown: {
      paidBookings: number
      totalBookings: number
      pendingBookings: number
    }
  }
  funnel: {
    visitors: number
    quoteRequests: number
    bookings: number
    conversionRates: {
      visitorsToQuotes: number
      quotesToBookings: number
    }
  }
  business: {
    globalConversionRate: number
    retentionRate: number
    avgOrderValue: number
  }
  performance: {
    availability: number
    responseTime: number
    errorRate: number
    throughput: number
  }
  behavior: {
    avgSessionDuration: string
    bounceRate: number
    pagesPerSession: number
  }
  recentActivity: Array<{
    id: string
    customer: string
    amount: number
    status: string
    createdAt: string
  }>
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')
  const [periodInfo, setPeriodInfo] = useState<{
    label: string
    start: string
    end: string
    days: number
  } | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics?period=${period}`, {
        credentials: 'include'
      })
      const result = await response.json()

      if (response.status === 401) {
        setError('Authentification requise - veuillez vous reconnecter')
        return
      }

      if (result.success) {
        setAnalytics(result.data)
        setPeriodInfo(result.period)
      } else {
        setError(result.error || 'Erreur lors du chargement des analytics')
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics}>Réessayer</Button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <ChartBarIcon className="h-8 w-8 text-white" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Analytics & Métriques</h1>
              </div>
              <p className="text-blue-100">
                Tableau de bord analytique • {periodInfo?.label || '30 derniers jours'}
                {periodInfo && (
                  <span className="ml-2 text-xs">
                    ({new Date(periodInfo.start).toLocaleDateString('fr-FR')} - {new Date(periodInfo.end).toLocaleDateString('fr-FR')})
                  </span>
                )}
              </p>
            </div>
            <div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2 backdrop-blur-sm focus:bg-white/30 focus:outline-none"
              >
                <option value="7d" className="text-gray-800">7 derniers jours</option>
                <option value="30d" className="text-gray-800">30 derniers jours</option>
                <option value="90d" className="text-gray-800">90 derniers jours</option>
                <option value="1y" className="text-gray-800">1 an</option>
              </select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-4 w-4" />
              Métriques Business
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4" />
              Comportement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                  <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.conversions.toLocaleString()}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronUpIcon className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">{analytics.overview.conversionGrowth}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sur {periodInfo?.days || 30} jour{(periodInfo?.days || 30) > 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                  <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.revenue.toLocaleString()} €</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronUpIcon className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">{analytics.overview.revenueGrowth}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    CA encaissé • {periodInfo?.days || 30} jour{(periodInfo?.days || 30) > 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visiteurs uniques</CardTitle>
                  <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.visitors.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    Visiteurs estimés
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.availability}%</div>
                  <div className="text-xs text-muted-foreground">
                    {analytics.performance.responseTime}ms moyenne
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Période d'analyse : {periodInfo?.label || '30 derniers jours'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-blue-700 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Analytics (CA encaissé)</strong><br/>
                      {analytics.overview.revenue.toLocaleString()}€<br/>
                      <span className="text-xs">Bookings payées uniquement</span>
                    </div>
                    <div>
                      <strong>Admin/Dashboard (CA total)</strong><br/>
                      {analytics.revenue?.total?.toLocaleString() || 'N/A'}€<br/>
                      <span className="text-xs">Toutes les bookings</span>
                    </div>
                    <div>
                      <strong>CA en attente</strong><br/>
                      {analytics.revenue?.pending?.toLocaleString() || 'N/A'}€<br/>
                      <span className="text-xs">Bookings non payées</span>
                    </div>
                  </div>
                  {periodInfo && (
                    <p className="text-xs border-t pt-2 mt-2">
                      📊 Analyse sur {periodInfo.days} jour{periodInfo.days > 1 ? 's' : ''} •
                      Du {new Date(periodInfo.start).toLocaleDateString('fr-FR')} au {new Date(periodInfo.end).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Entonnoir de conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Visiteurs</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{analytics.funnel.visitors.toLocaleString()}</span>
                        <Badge variant="default">100%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-full" />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Demandes de devis</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{analytics.funnel.quoteRequests.toLocaleString()}</span>
                        <Badge variant="default">{analytics.funnel.conversionRates.visitorsToQuotes}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${analytics.funnel.conversionRates.visitorsToQuotes}%` }} />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Réservations</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{analytics.funnel.bookings.toLocaleString()}</span>
                        <Badge variant="default">{analytics.funnel.conversionRates.quotesToBookings}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${analytics.funnel.conversionRates.quotesToBookings}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Métriques Business</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Taux de conversion global</span>
                      <Badge variant="default">{analytics.business.globalConversionRate}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Taux de rétention</span>
                      <Badge variant="default">{analytics.business.retentionRate}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Panier moyen</span>
                      <span className="font-semibold">{analytics.business.avgOrderValue.toLocaleString()} €</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5" />
                    Répartition du CA • {periodInfo?.label || '30 derniers jours'}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Analyse détaillée du chiffre d'affaires sur la période sélectionnée
                    {periodInfo && (
                      <span className="ml-2">
                        ({periodInfo.days} jour{periodInfo.days > 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-700">CA Encaissé</span>
                        <span className="text-xl font-bold text-green-600">{analytics.revenue?.paid?.toLocaleString() || '0'} €</span>
                      </div>
                      <p className="text-sm text-gray-600">{analytics.revenue?.breakdown?.paidBookings || 0} bookings payées</p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-orange-700">CA en Attente</span>
                        <span className="text-xl font-bold text-orange-600">{analytics.revenue?.pending?.toLocaleString() || '0'} €</span>
                      </div>
                      <p className="text-sm text-gray-600">{analytics.revenue?.breakdown?.pendingBookings || 0} bookings non payées</p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">CA Total Période</span>
                        <span className="text-2xl font-bold">{analytics.revenue?.total?.toLocaleString() || '0'} €</span>
                      </div>
                      <p className="text-sm text-gray-600">{analytics.revenue?.breakdown?.totalBookings || 0} bookings au total</p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Taux d'encaissement :</strong> {analytics.revenue?.paid && analytics.revenue?.total ? ((analytics.revenue.paid / analytics.revenue.total) * 100).toFixed(1) : '0'}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.availability}%</div>
                  <p className="text-xs text-muted-foreground">Temps de fonctionnement</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temps de réponse</CardTitle>
                  <ClockIcon className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.responseTime}ms</div>
                  <p className="text-xs text-muted-foreground">Temps moyen</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux d'erreur</CardTitle>
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.errorRate}%</div>
                  <p className="text-xs text-muted-foreground">Erreurs système</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Débit</CardTitle>
                  <ChartBarIcon className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.throughput.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Requêtes/heure</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Comportement utilisateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Durée moyenne des sessions</span>
                    <span className="font-semibold">{analytics.behavior.avgSessionDuration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de rebond</span>
                    <Badge variant="default">{analytics.behavior.bounceRate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pages par session</span>
                    <span className="font-semibold">{analytics.behavior.pagesPerSession}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 