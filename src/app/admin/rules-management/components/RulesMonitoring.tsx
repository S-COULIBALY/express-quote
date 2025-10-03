"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  UsersIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline"

// ✅ RÉUTILISATION - Hook existant
import { useCentralizedPricing } from "@/hooks/shared/useCentralizedPricing"

interface DashboardStats {
  totalRules: number
  activeRules: number
  rulesByCategory: Record<string, number>
  rulesByService: Record<string, number>
  recentChanges: number
  healthScore: number
  // Nouvelles métriques business
  totalRevenue?: number
  conversionRate?: number
  totalBookings?: number
  avgResponseTime?: number
}

interface QuickAccess {
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  action: () => void
  count?: number
}

export function RulesMonitoring() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { getRules, isLoading } = useCentralizedPricing()

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      console.log('📊 Dashboard: Début du chargement des statistiques...')

      // ✅ NOUVELLES APIS - Chargement parallèle des données
      const [rulesResponse, statsResponse, attributionResponse] = await Promise.allSettled([
        // API existante pour les règles
        getRules(),
        // API statistiques globales
        fetch('/api/admin/stats?quick=true').then(r => r.ok ? r.json() : null),
        // API attribution pour métriques temps réel
        fetch('/api/admin/attribution/stats').then(r => r.ok ? r.json() : null)
      ])

      // Traitement des résultats avec fallback
      const rulesData = rulesResponse.status === 'fulfilled' ? rulesResponse.value : null
      const globalStats = statsResponse.status === 'fulfilled' ? statsResponse.value?.data : null
      const attributionStats = attributionResponse.status === 'fulfilled' ? attributionResponse.value?.stats : null

      console.log('📊 Données récupérées:', { rulesData, globalStats, attributionStats })

      // Statistiques règles (existant + amélioré)
      const totalRules = rulesData?.rules?.length || rulesData?.data?.length || 0
      const activeRules = rulesData?.rules?.filter((r: any) => r.isActive)?.length ||
                         rulesData?.data?.filter((r: any) => r.isActive)?.length || 0

      const rulesByCategory = rulesData?.stats?.rulesByCategory || {}
      const rulesByService = rulesData?.stats?.rulesByService || {}

      // Score de santé amélioré avec métriques business
      let healthScore = totalRules > 0 ? Math.round((activeRules / totalRules) * 100) : 0
      if (attributionStats?.systemHealthScore) {
        healthScore = Math.round((healthScore + attributionStats.systemHealthScore) / 2)
      }

      setStats({
        totalRules,
        activeRules,
        rulesByCategory,
        rulesByService,
        recentChanges: globalStats?.pendingRequests || 0,
        healthScore,
        // Nouvelles métriques business
        totalRevenue: globalStats?.monthlyRevenue,
        conversionRate: globalStats?.conversionRate,
        totalBookings: globalStats?.totalBookings,
        avgResponseTime: attributionStats?.averageResponseTime
      })

      console.log('📊 Dashboard: Statistiques chargées avec succès')

    } catch (error) {
      console.error('📊 Dashboard: Erreur lors du chargement des statistiques:', error)
      // Fallback avec données par défaut
      setStats({
        totalRules: 0,
        activeRules: 0,
        rulesByCategory: {},
        rulesByService: {},
        recentChanges: 0,
        healthScore: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAccess[] = [
    {
      title: "Prix de Base",
      description: "Modifier les tarifs fondamentaux",
      icon: CurrencyDollarIcon,
      color: "blue",
      count: stats?.rulesByCategory?.FIXED || 0,
      action: () => {
        // Navigation vers l'onglet pricing
        const event = new CustomEvent('navigate-to-tab', { detail: 'pricing' })
        window.dispatchEvent(event)
      }
    },
    {
      title: "Règles Métier",
      description: "Gérer les règles temporelles",
      icon: ClipboardDocumentCheckIcon,
      color: "green",
      count: stats?.rulesByCategory?.SURCHARGE || 0,
      action: () => {
        const event = new CustomEvent('navigate-to-tab', { detail: 'business-rules' })
        window.dispatchEvent(event)
      }
    },
    {
      title: "Contraintes métiers",
      description: "Configurer les contraintes terrain",
      icon: ShieldCheckIcon,
      color: "orange",
      count: 45, // Nombre de contraintes du modal
      action: () => {
        const event = new CustomEvent('navigate-to-tab', { detail: 'logistics' })
        window.dispatchEvent(event)
      }
    },
    {
      title: "Tests & Simulation",
      description: "Valider avant production",
      icon: CheckCircleIcon,
      color: "emerald",
      action: () => {
        const event = new CustomEvent('navigate-to-tab', { detail: 'testing' })
        window.dispatchEvent(event)
      }
    }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-2 text-blue-600">
          <ChartBarIcon className="h-10 w-10 animate-pulse" />
          <p className="text-blue-900 font-medium">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales avec design premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Règles */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Total Règles</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {stats?.totalRules || 0}
                    </p>
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-xs px-2 py-0">
                        {stats?.activeRules || 0} actives
                      </Badge>
                      <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 text-xs px-2 py-0">
                        {(stats?.totalRules || 0) - (stats?.activeRules || 0)} inactives
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <TagIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score Santé Système */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Score Santé</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {stats?.healthScore || 0}%
                    </p>
                    <Badge
                      className={`border-0 text-xs px-2 py-1 ${
                        (stats?.healthScore || 0) > 80
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                          : (stats?.healthScore || 0) > 60
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                      }`}
                    >
                      {(stats?.healthScore || 0) > 80 ? "Excellent" : (stats?.healthScore || 0) > 60 ? "Correct" : "Critique"}
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  {(stats?.healthScore || 0) > 80 ? (
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chiffre d'Affaires */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">CA Mensuel</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {stats?.totalRevenue ? `${(stats.totalRevenue / 1000).toFixed(0)}k€` : '0€'}
                    </p>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-2 py-1">
                      +{stats?.conversionRate?.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <BanknotesIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Temps Réel */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Demandes Actives</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stats?.recentChanges || 0}
                    </p>
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-xs px-2 py-0">
                        {stats?.totalBookings || 0} total
                      </Badge>
                      {stats?.avgResponseTime && (
                        <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 text-xs px-2 py-0">
                          {stats.avgResponseTime}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
          <CardDescription>
            Accédez rapidement aux sections les plus utilisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              const colorClasses = {
                blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                green: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
                orange: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
                emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={action.action}
                  className={`h-auto p-4 flex flex-col items-start gap-2 text-left transition-all ${colorClasses[action.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="h-5 w-5" />
                    {action.count !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs opacity-75">{action.description}</p>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Répartition par service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Règles par Service</CardTitle>
            <CardDescription>Répartition des règles selon le type de service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.rulesByService || {}).map(([service, count]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{service}</span>
                  <Badge variant="outline">{count} règles</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Règles par Catégorie</CardTitle>
            <CardDescription>Organisation par type de règle métier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.rulesByCategory || {}).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <Badge variant="outline">{count} règles</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Gestionnaire d'événements pour la navigation entre onglets
if (typeof window !== 'undefined') {
  window.addEventListener('navigate-to-tab', (event: any) => {
    const tabValue = event.detail
    // Déclencher le changement d'onglet dans le composant parent
    const tabs = document.querySelector('[role="tablist"]')
    if (tabs) {
      const targetTab = tabs.querySelector(`[value="${tabValue}"]`) as HTMLElement
      if (targetTab) {
        targetTab.click()
      }
    }
  })
}