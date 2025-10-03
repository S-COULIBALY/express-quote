'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAbandonAnalytics } from '@/lib/abandonAnalytics'
import { useIncentives } from '@/lib/incentiveSystem'
import { 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  BellIcon,
  GiftIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon
} from "@heroicons/react/24/outline"

interface AbandonDashboardData {
  totalAbandons: number
  abandonRate: number
  recoveryRate: number
  revenueAtRisk: number
  revenueRecovered: number
  topAbandonStages: Array<{ stage: string; count: number; percentage: number }>
  recentAbandons: Array<{
    id: string
    stage: string
    customerInfo: string
    amount: number
    timestamp: Date
    status: 'pending' | 'recovering' | 'recovered' | 'lost'
  }>
  hourlyStats: Array<{ hour: number; abandons: number; recoveries: number }>
}

export default function AdminAbandonsPage() {
  const { toast } = useToast()
  const analytics = useAbandonAnalytics()
  const incentives = useIncentives()
  
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<AbandonDashboardData | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 secondes

  // États pour la gestion des stratégies
  const [recoveryStrategies, setRecoveryStrategies] = useState<any[]>([])
  const [activeStrategy, setActiveStrategy] = useState(null)
  const [showStrategyModal, setShowStrategyModal] = useState(false)

  // États pour les notifications
  const [notificationTemplates, setNotificationTemplates] = useState<any[]>([])
  const [notificationChannels, setNotificationChannels] = useState({
    email: true,
    sms: true,
    push: true,
    call: false,
    whatsapp: false
  })

  // États pour les incentives
  const [incentiveConfigs, setIncentiveConfigs] = useState<any[]>([])
  const [showIncentiveModal, setShowIncentiveModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
    loadRecoveryStrategies()
    loadNotificationTemplates()
    loadIncentiveConfigs()
  }, [selectedTimeRange])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, refreshInterval)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, selectedTimeRange])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Calculer les dates selon la plage sélectionnée
      const endDate = new Date()
      const startDate = new Date()
      
      switch (selectedTimeRange) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1)
          break
        case '24h':
          startDate.setDate(endDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
      }

      // Récupérer les métriques
      const metrics = analytics.getMetrics(startDate, endDate)
      const recoveryMetrics = analytics.getRecoveryMetrics(startDate, endDate)
      
      // Simuler des données de dashboard
      const mockData: AbandonDashboardData = {
        totalAbandons: metrics.totalAbandons,
        abandonRate: 68.5,
        recoveryRate: metrics.recoveryRate,
        revenueAtRisk: metrics.lossRevenue,
        revenueRecovered: metrics.recoveredRevenue,
        topAbandonStages: [
          { stage: 'Formulaire partiel', count: 45, percentage: 32.1 },
          { stage: 'Page paiement', count: 38, percentage: 27.1 },
          { stage: 'Devis consulté', count: 28, percentage: 20.0 },
          { stage: 'Post-confirmation', count: 15, percentage: 10.7 },
          { stage: 'Abandon précoce', count: 14, percentage: 10.1 }
        ],
        recentAbandons: [
          {
            id: 'ab001',
            stage: 'payment_page',
            customerInfo: 'Marie D. - marie.d@email.com',
            amount: 450,
            timestamp: new Date(Date.now() - 300000),
            status: 'recovering'
          },
          {
            id: 'ab002',
            stage: 'form_partial',
            customerInfo: 'Jean P. - 06.12.34.56.78',
            amount: 280,
            timestamp: new Date(Date.now() - 900000),
            status: 'pending'
          },
          {
            id: 'ab003',
            stage: 'quote_with_contact',
            customerInfo: 'Sophie L. - sophie.l@email.com',
            amount: 620,
            timestamp: new Date(Date.now() - 1800000),
            status: 'recovered'
          }
        ],
        hourlyStats: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          abandons: Math.floor(Math.random() * 20) + 5,
          recoveries: Math.floor(Math.random() * 15) + 2
        }))
      }
      
      setDashboardData(mockData)
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRecoveryStrategies = async () => {
    // Simuler le chargement des stratégies
    const mockStrategies = [
      {
        id: 'strategy1',
        name: 'Récupération Formulaire Standard',
        trigger: 'form_partial',
        enabled: true,
        steps: [
          { type: 'email', delay: 300, template: 'form_reminder' },
          { type: 'sms', delay: 3600, template: 'form_urgent' },
          { type: 'call', delay: 7200, template: 'form_personal' }
        ],
        successRate: 35.2,
        averageCost: 2.50
      },
      {
        id: 'strategy2',
        name: 'Récupération Paiement Urgente',
        trigger: 'payment_abandoned',
        enabled: true,
        steps: [
          { type: 'email', delay: 60, template: 'payment_urgent' },
          { type: 'sms', delay: 300, template: 'payment_help' },
          { type: 'call', delay: 900, template: 'payment_assistance' }
        ],
        successRate: 68.7,
        averageCost: 5.80
      }
    ]
    
    setRecoveryStrategies(mockStrategies)
  }

  const loadNotificationTemplates = async () => {
    // Simuler le chargement des templates
    const mockTemplates = [
      {
        id: 'template1',
        name: 'Rappel Formulaire Doux',
        type: 'email',
        subject: 'Votre demande est en attente',
        enabled: true,
        openRate: 24.5,
        clickRate: 8.3
      },
      {
        id: 'template2',
        name: 'Urgence Paiement',
        type: 'sms',
        subject: 'Finalisation paiement',
        enabled: true,
        openRate: 89.2,
        clickRate: 45.6
      }
    ]
    
    setNotificationTemplates(mockTemplates)
  }

  const loadIncentiveConfigs = async () => {
    const stats = incentives.getStats()
    
    // Simuler le chargement des incentives
    const mockIncentives = [
      {
        id: 'incentive1',
        name: 'Réduction Formulaire 5%',
        type: 'percentage_discount',
        value: 5,
        trigger: 'form_partial',
        enabled: true,
        usage: 156,
        conversionRate: 28.5
      },
      {
        id: 'incentive2',
        name: 'Réduction Paiement 20€',
        type: 'fixed_discount',
        value: 20,
        trigger: 'payment_abandoned',
        enabled: true,
        usage: 89,
        conversionRate: 52.8
      }
    ]
    
    setIncentiveConfigs(mockIncentives)
  }

  const handleStrategyToggle = async (strategyId: string, enabled: boolean) => {
    try {
      // Simuler la mise à jour
      setRecoveryStrategies(prev => 
        prev.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, enabled }
            : strategy
        )
      )
      
      toast({
        title: enabled ? "Stratégie activée" : "Stratégie désactivée",
        description: `La stratégie de récupération a été ${enabled ? 'activée' : 'désactivée'}`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la stratégie",
        variant: "destructive",
      })
    }
  }

  const handleIncentiveToggle = async (incentiveId: string, enabled: boolean) => {
    try {
      setIncentiveConfigs(prev => 
        prev.map(incentive => 
          incentive.id === incentiveId 
            ? { ...incentive, enabled }
            : incentive
        )
      )
      
      toast({
        title: enabled ? "Incentive activé" : "Incentive désactivé",
        description: `L'incentive a été ${enabled ? 'activé' : 'désactivé'}`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'incentive",
        variant: "destructive",
      })
    }
  }

  const triggerManualRecovery = async (abandonId: string) => {
    try {
      // Simuler le déclenchement manuel
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Récupération déclenchée",
        description: "La séquence de récupération a été lancée manuellement",
      })
      
      // Recharger les données
      loadDashboardData()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déclencher la récupération",
        variant: "destructive",
      })
    }
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement du dashboard d'abandons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Gestion des Abandons</h1>
              </div>
              <p className="text-red-100">Dashboard de monitoring et gestion des abandons clients</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32 bg-white/20 text-white border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 heure</SelectItem>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoRefresh} 
                  onCheckedChange={setAutoRefresh}
                  className="bg-white/20"
                />
                <span className="text-white text-sm">Auto-refresh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Abandons</p>
                    <p className="text-3xl font-bold text-red-600">{dashboardData.totalAbandons}</p>
                  </div>
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-red-500">↑ {dashboardData.abandonRate}%</span>
                  <span className="text-gray-500 ml-1">taux d'abandon</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux Récupération</p>
                    <p className="text-3xl font-bold text-green-600">{dashboardData.recoveryRate}%</p>
                  </div>
                  <ChevronUpIcon className="h-12 w-12 text-green-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-500">↑ 12%</span>
                  <span className="text-gray-500 ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenus à Risque</p>
                    <p className="text-3xl font-bold text-orange-600">{dashboardData.revenueAtRisk.toLocaleString()}€</p>
                  </div>
                  <CurrencyDollarIcon className="h-12 w-12 text-orange-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-orange-500">↑ 8%</span>
                  <span className="text-gray-500 ml-1">cette semaine</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenus Récupérés</p>
                    <p className="text-3xl font-bold text-blue-600">{dashboardData.revenueRecovered.toLocaleString()}€</p>
                  </div>
                  <ChartBarIcon className="h-12 w-12 text-blue-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-blue-500">↑ 15%</span>
                  <span className="text-gray-500 ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs principales */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              Stratégies
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="incentives" className="flex items-center gap-2">
              <GiftIcon className="h-4 w-4" />
              Incentives
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Temps Réel
            </TabsTrigger>
          </TabsList>

          {/* Tab Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top des stages d'abandon */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Top des Stages d'Abandon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.topAbandonStages.map((stage, index) => (
                      <div key={stage.stage} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{stage.stage}</p>
                            <p className="text-sm text-gray-500">{stage.count} abandons</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{stage.percentage}%</p>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${stage.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Abandons récents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Abandons Récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.recentAbandons.map((abandon) => (
                      <div key={abandon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={abandon.status === 'recovered' ? 'default' : 'destructive'}>
                              {abandon.status === 'recovered' ? 'Récupéré' : 
                               abandon.status === 'recovering' ? 'En cours' : 'En attente'}
                            </Badge>
                            <span className="text-sm text-gray-500">{abandon.stage}</span>
                          </div>
                          <p className="font-medium text-sm">{abandon.customerInfo}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(abandon.timestamp).toLocaleString()} • {abandon.amount}€
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerManualRecovery(abandon.id)}
                            disabled={abandon.status === 'recovered'}
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Stratégies */}
          <TabsContent value="strategies" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Stratégies de Récupération</h2>
              <Button onClick={() => setShowStrategyModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle Stratégie
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recoveryStrategies.map((strategy) => (
                <Card key={strategy.id} className="bg-white shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Cog6ToothIcon className="h-5 w-5" />
                        {strategy.name}
                      </CardTitle>
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={(enabled) => handleStrategyToggle(strategy.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Trigger:</span>
                        <Badge variant="outline">{strategy.trigger}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Taux de succès:</span>
                        <span className="font-semibold text-green-600">{strategy.successRate}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Coût moyen:</span>
                        <span className="font-semibold">{strategy.averageCost}€</span>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Étapes de récupération:</h4>
                        <div className="space-y-2">
                          {strategy.steps.map((step: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {step.type === 'email' && <EnvelopeIcon className="h-4 w-4 text-blue-500" />}
                              {step.type === 'sms' && <DevicePhoneMobileIcon className="h-4 w-4 text-green-500" />}
                              {step.type === 'call' && <PhoneIcon className="h-4 w-4 text-orange-500" />}
                              <span>{step.type} après {Math.round(step.delay / 60)}min</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des Notifications</h2>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau Template
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration des canaux */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellIcon className="h-5 w-5" />
                    Canaux de Notification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-5 w-5 text-blue-500" />
                        <span>Email</span>
                      </div>
                      <Switch
                        checked={notificationChannels.email}
                        onCheckedChange={(checked) => 
                          setNotificationChannels(prev => ({ ...prev, email: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-green-500" />
                        <span>SMS</span>
                      </div>
                      <Switch
                        checked={notificationChannels.sms}
                        onCheckedChange={(checked) => 
                          setNotificationChannels(prev => ({ ...prev, sms: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-5 w-5 text-orange-500" />
                        <span>Appels</span>
                      </div>
                      <Switch
                        checked={notificationChannels.call}
                        onCheckedChange={(checked) => 
                          setNotificationChannels(prev => ({ ...prev, call: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-500" />
                        <span>WhatsApp</span>
                      </div>
                      <Switch
                        checked={notificationChannels.whatsapp}
                        onCheckedChange={(checked) => 
                          setNotificationChannels(prev => ({ ...prev, whatsapp: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Templates de notification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SpeakerWaveIcon className="h-5 w-5" />
                    Templates de Notification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notificationTemplates.map((template) => (
                      <div key={template.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={template.type === 'email' ? 'default' : 'secondary'}>
                              {template.type}
                            </Badge>
                            <span className="font-medium">{template.name}</span>
                          </div>
                          <Switch
                            checked={template.enabled}
                            onCheckedChange={() => {}}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Ouverture: {template.openRate}%</span>
                          <span>Clics: {template.clickRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Incentives */}
          <TabsContent value="incentives" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des Incentives</h2>
              <Button onClick={() => setShowIncentiveModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvel Incentive
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {incentiveConfigs.map((incentive) => (
                <Card key={incentive.id} className="bg-white shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <GiftIcon className="h-5 w-5" />
                        {incentive.name}
                      </CardTitle>
                      <Switch
                        checked={incentive.enabled}
                        onCheckedChange={(enabled) => handleIncentiveToggle(incentive.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <Badge variant="outline">{incentive.type}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valeur:</span>
                        <span className="font-semibold">
                          {incentive.type === 'percentage_discount' ? `${incentive.value}%` : `${incentive.value}€`}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Trigger:</span>
                        <Badge variant="outline">{incentive.trigger}</Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Utilisations:</span>
                        <span className="font-semibold">{incentive.usage}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Conversion:</span>
                        <span className="font-semibold text-green-600">{incentive.conversionRate}%</span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Stats
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Temps Réel */}
          <TabsContent value="realtime" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Monitoring Temps Réel</h2>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Connecté</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activité en temps réel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Activité Temps Réel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Abandon formulaire - Sophie M.</span>
                      <span className="text-xs text-gray-500 ml-auto">Il y a 2 min</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Récupération réussie - Jean P.</span>
                      <span className="text-xs text-gray-500 ml-auto">Il y a 5 min</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-orange-50 rounded">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Échec paiement - Marie L.</span>
                      <span className="text-xs text-gray-500 ml-auto">Il y a 8 min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alertes système */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    Alertes Système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Taux d'abandon élevé (&gt;80%)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                      <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Tous les services fonctionnent</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <ChevronUpIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Amélioration des récupérations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 