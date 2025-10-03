'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  WrenchScrewdriverIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  Cog8ToothIcon,
  RectangleStackIcon,
  BellIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface QuickStats {
  totalUsers: number
  totalBookings: number
  monthlyRevenue: number
  pendingRequests: number
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadStats()
  }, [])

  const checkAuthAndLoadStats = async () => {
    try {
      // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
      setIsAuthenticated(true)
      await loadQuickStats('bypass-token')
    } catch (err) {
      console.error('Auth check error:', err)
      // 🔓 REDIRECTION DÉSACTIVÉE - Rester sur la page admin
      setIsAuthenticated(true)
    }
  }

  const loadQuickStats = async (token: string) => {
    try {

      // Appel simplifié pour stats rapides seulement
      const response = await fetch('/api/admin/stats?quick=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem('professionalToken')
        setTimeout(() => {
          router.push('/professional/login')
        }, 100)
        return
      }

      const result = await response.json()

      if (result.success) {
        setStats({
          totalUsers: result.data.totalCustomers,
          totalBookings: result.data.totalBookings,
          monthlyRevenue: result.data.monthlyRevenue,
          pendingRequests: result.data.pendingRequests
        })
      }
    } catch (err) {
      console.error('Error loading quick stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Dashboard Central",
      description: "Hub opérationnel avec statistiques détaillées",
      href: "/admin/dashboard",
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: "bg-blue-600 hover:bg-blue-700",
      primary: true
    },
    {
      title: "Configuration",
      description: "Paramètres et règles métier",
      href: "/admin/rules-management",
      icon: <Cog8ToothIcon className="h-6 w-6" />,
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Gestion Catalogue",
      description: "Templates et items",
      href: "/admin/catalogue",
      icon: <RectangleStackIcon className="h-6 w-6" />,
      color: "bg-orange-600 hover:bg-orange-700"
    },
    {
      title: "Notifications",
      description: "Système de notifications",
      href: "/admin/notifications",
      icon: <BellIcon className="h-6 w-6" />,
      color: "bg-pink-600 hover:bg-pink-700"
    }
  ]

  const systemStatus = [
    { name: "Notifications", status: "97.8%", color: "text-green-600" },
    { name: "Documents", status: "97.4%", color: "text-green-600" },
    { name: "Automations", status: "97.9%", color: "text-green-600" }
  ]

  // Garde d'authentification - éviter le flash
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Administration Express Quote
                </h1>
                <p className="text-gray-600 mt-1">
                  Centre de contrôle et de gestion
                </p>
              </div>
            </div>

            <Link href="/admin/dashboard">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                Accéder au Dashboard
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Stats Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Vue d'ensemble</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <QuickStatCard
              title="Clients"
              value={loading ? "..." : stats?.totalUsers?.toString() || "0"}
              icon={<UserGroupIcon className="h-5 w-5" />}
              color="bg-blue-500"
              loading={loading}
            />
            <QuickStatCard
              title="Réservations"
              value={loading ? "..." : stats?.totalBookings?.toString() || "0"}
              icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
              color="bg-purple-500"
              loading={loading}
            />
            <QuickStatCard
              title="Chiffre d'affaires"
              value={loading ? "..." : `${stats?.monthlyRevenue || 0}€`}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
              color="bg-emerald-500"
              loading={loading}
            />
            <QuickStatCard
              title="Demandes en attente"
              value={loading ? "..." : stats?.pendingRequests?.toString() || "0"}
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              color="bg-amber-500"
              loading={loading}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className={`hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0 shadow-lg ${action.primary ? 'ring-2 ring-blue-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${action.color} text-white`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {action.title}
                          {action.primary && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Principal
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 text-sm">{action.description}</p>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">État du système</h2>
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {systemStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className={`font-semibold ${item.color}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Sections */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Toutes les sections</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: "Analytics", href: "/admin/analytics", icon: "📊" },
              { name: "Attribution", href: "/admin/attribution", icon: "🎯" },
              { name: "Abandons", href: "/admin/abandons", icon: "⚠️" },
              { name: "Documents", href: "/admin/documents", icon: "📄" },
              { name: "Incentives", href: "/admin/incentives", icon: "🎁" },
              { name: "Intégrations", href: "/admin/integrations", icon: "🔗" },
              { name: "Items", href: "/admin/items", icon: "📦" },
              { name: "Quote Requests", href: "/admin/quote-requests", icon: "📋" },
              { name: "Recovery", href: "/admin/recovery", icon: "🔄" },
              { name: "Templates", href: "/admin/templates", icon: "📝" }
            ].map((section, index) => (
              <Link key={index} href={section.href}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{section.icon}</div>
                    <p className="text-sm font-medium text-gray-700">{section.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface QuickStatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  loading: boolean
}

function QuickStatCard({ title, value, icon, color, loading }: QuickStatCardProps) {
  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <div className={`${color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          {icon}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className={`text-2xl font-bold text-gray-900 ${loading ? 'animate-pulse' : ''}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}