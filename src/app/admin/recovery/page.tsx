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
import { 
  ArrowPathIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TrophyIcon,
  FireIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarIcon,
  MapPinIcon
} from "@heroicons/react/24/outline"

interface RecoveryStrategy {
  id: string
  name: string
  description: string
  trigger: 'form_partial' | 'quote_viewed' | 'payment_abandoned' | 'booking_expired' | 'return_visitor'
  enabled: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  conditions: {
    minAmount?: number
    maxAmount?: number
    minCompletion?: number
    customerSegments?: string[]
    timeWindow?: number
    maxAttempts?: number
    deviceTypes?: string[]
  }
  steps: RecoveryStep[]
  metrics: {
    triggered: number
    completed: number
    recovered: number
    successRate: number
    averageCost: number
    totalRevenue: number
    roi: number
    averageRecoveryTime: number
  }
  createdAt: Date
  updatedAt: Date
}

interface RecoveryStep {
  id: string
  type: 'email' | 'sms' | 'push' | 'call' | 'whatsapp'
  delay: number // en secondes
  template: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  conditions?: {
    timeRange?: { start: string; end: string }
    dayOfWeek?: number[]
    customerSegment?: string[]
  }
  fallback?: {
    type: 'email' | 'sms' | 'call'
    delay: number
  }
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    responded: number
    converted: number
  }
}

interface CampaignExecution {
  id: string
  strategyId: string
  strategyName: string
  customerId: string
  customerInfo: string
  startedAt: Date
  currentStep: number
  status: 'active' | 'paused' | 'completed' | 'failed' | 'recovered'
  steps: {
    stepId: string
    scheduledAt: Date
    executedAt?: Date
    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed'
    channel: string
    response?: any
  }[]
  metadata: {
    abandonStage: string
    formProgress: number
    estimatedValue: number
    customerSegment: string
    device: string
    location: string
  }
}

interface FormData {
  name: string
  description: string
  trigger: 'form_partial' | 'quote_viewed' | 'payment_abandoned' | 'booking_expired' | 'return_visitor'
  enabled: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  conditions: {
    minAmount?: number
    maxAmount?: number
    minCompletion?: number
    customerSegments?: string[]
    timeWindow?: number
    maxAttempts?: number
    deviceTypes?: string[]
  }
  steps: RecoveryStep[]
}

export default function AdminRecoveryPage() {
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [strategies, setStrategies] = useState<RecoveryStrategy[]>([])
  const [campaigns, setCampaigns] = useState<CampaignExecution[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<RecoveryStrategy | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('strategies')

  // États pour nouveau/édition stratégie
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    trigger: 'form_partial',
    enabled: true,
    priority: 'medium',
    conditions: {
      minAmount: undefined,
      maxAmount: undefined,
      minCompletion: undefined,
      customerSegments: [],
      timeWindow: 24 * 60 * 60 * 1000, // 24 heures
      maxAttempts: 3,
      deviceTypes: []
    },
    steps: []
  })

  useEffect(() => {
    loadStrategies()
    loadCampaigns()
  }, [])

  const loadStrategies = async () => {
    try {
      setLoading(true)
      
      // Simuler le chargement des stratégies
      const mockStrategies: RecoveryStrategy[] = [
        {
          id: 'strategy1',
          name: 'Récupération Formulaire Standard',
          description: 'Stratégie douce pour les abandons de formulaire avec progression > 50%',
          trigger: 'form_partial',
          enabled: true,
          priority: 'medium',
          conditions: {
            minCompletion: 50,
            timeWindow: 24 * 60 * 60 * 1000,
            maxAttempts: 3,
            customerSegments: ['new_customer', 'returning_customer']
          },
          steps: [
            {
              id: 'step1',
              type: 'email',
              delay: 5 * 60, // 5 minutes
              template: 'form_gentle_reminder',
              priority: 'low',
              metrics: {
                sent: 1547,
                delivered: 1523,
                opened: 456,
                clicked: 89,
                responded: 34,
                converted: 23
              }
            },
            {
              id: 'step2',
              type: 'sms',
              delay: 60 * 60, // 1 heure
              template: 'form_urgent_reminder',
              priority: 'medium',
              fallback: {
                type: 'email',
                delay: 30 * 60
              },
              metrics: {
                sent: 234,
                delivered: 230,
                opened: 205,
                clicked: 78,
                responded: 45,
                converted: 28
              }
            },
            {
              id: 'step3',
              type: 'call',
              delay: 4 * 60 * 60, // 4 heures
              template: 'form_personal_assistance',
              priority: 'high',
              conditions: {
                timeRange: { start: '09:00', end: '18:00' },
                dayOfWeek: [1, 2, 3, 4, 5] // Lundi à vendredi
              },
              metrics: {
                sent: 89,
                delivered: 85,
                opened: 85,
                clicked: 0,
                responded: 67,
                converted: 45
              }
            }
          ],
          metrics: {
            triggered: 1870,
            completed: 1654,
            recovered: 596,
            successRate: 36.0,
            averageCost: 2.50,
            totalRevenue: 47580,
            roi: 1804,
            averageRecoveryTime: 4.2
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-22')
        },
        {
          id: 'strategy2',
          name: 'Récupération Paiement Urgente',
          description: 'Stratégie agressive pour les abandons de paiement avec intervention rapide',
          trigger: 'payment_abandoned',
          enabled: true,
          priority: 'urgent',
          conditions: {
            minAmount: 100,
            timeWindow: 2 * 60 * 60 * 1000, // 2 heures
            maxAttempts: 4
          },
          steps: [
            {
              id: 'step1',
              type: 'email',
              delay: 60, // 1 minute
              template: 'payment_immediate_help',
              priority: 'urgent',
              metrics: {
                sent: 456,
                delivered: 452,
                opened: 234,
                clicked: 112,
                responded: 67,
                converted: 89
              }
            },
            {
              id: 'step2',
              type: 'sms',
              delay: 5 * 60, // 5 minutes
              template: 'payment_alternative_methods',
              priority: 'urgent',
              metrics: {
                sent: 234,
                delivered: 230,
                opened: 205,
                clicked: 89,
                responded: 56,
                converted: 67
              }
            },
            {
              id: 'step3',
              type: 'call',
              delay: 30 * 60, // 30 minutes
              template: 'payment_human_assistance',
              priority: 'urgent',
              conditions: {
                timeRange: { start: '08:00', end: '20:00' }
              },
              metrics: {
                sent: 89,
                delivered: 85,
                opened: 85,
                clicked: 0,
                responded: 78,
                converted: 56
              }
            }
          ],
          metrics: {
            triggered: 779,
            completed: 743,
            recovered: 512,
            successRate: 68.9,
            averageCost: 5.80,
            totalRevenue: 89340,
            roi: 1441,
            averageRecoveryTime: 1.8
          },
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-21')
        },
        {
          id: 'strategy3',
          name: 'Récupération Devis Premium',
          description: 'Stratégie personnalisée pour les devis haute valeur avec suivi individuel',
          trigger: 'quote_viewed',
          enabled: true,
          priority: 'high',
          conditions: {
            minAmount: 500,
            timeWindow: 48 * 60 * 60 * 1000, // 48 heures
            maxAttempts: 5,
            customerSegments: ['vip_customer', 'high_value_customer']
          },
          steps: [
            {
              id: 'step1',
              type: 'email',
              delay: 2 * 60 * 60, // 2 heures
              template: 'quote_premium_followup',
              priority: 'high',
              metrics: {
                sent: 123,
                delivered: 121,
                opened: 89,
                clicked: 45,
                responded: 23,
                converted: 34
              }
            },
            {
              id: 'step2',
              type: 'call',
              delay: 24 * 60 * 60, // 24 heures
              template: 'quote_premium_consultation',
              priority: 'high',
              conditions: {
                timeRange: { start: '10:00', end: '17:00' },
                dayOfWeek: [1, 2, 3, 4, 5]
              },
              metrics: {
                sent: 67,
                delivered: 65,
                opened: 65,
                clicked: 0,
                responded: 56,
                converted: 43
              }
            }
          ],
          metrics: {
            triggered: 190,
            completed: 186,
            recovered: 124,
            successRate: 66.7,
            averageCost: 12.50,
            totalRevenue: 78450,
            roi: 528,
            averageRecoveryTime: 18.5
          },
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-19')
        },
        {
          id: 'strategy4',
          name: 'Récupération Réservation Expirée',
          description: 'Stratégie de réactivation pour les réservations qui ont expiré',
          trigger: 'booking_expired',
          enabled: false,
          priority: 'low',
          conditions: {
            timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 jours
            maxAttempts: 2
          },
          steps: [
            {
              id: 'step1',
              type: 'email',
              delay: 24 * 60 * 60, // 24 heures
              template: 'booking_reactivation_offer',
              priority: 'low',
              metrics: {
                sent: 45,
                delivered: 44,
                opened: 23,
                clicked: 12,
                responded: 5,
                converted: 8
              }
            }
          ],
          metrics: {
            triggered: 45,
            completed: 44,
            recovered: 8,
            successRate: 18.2,
            averageCost: 1.20,
            totalRevenue: 1560,
            roi: 200,
            averageRecoveryTime: 72.0
          },
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-20')
        }
      ]
      
      setStrategies(mockStrategies)
      
    } catch (error) {
      console.error('Erreur lors du chargement des stratégies:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les stratégies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      // Simuler le chargement des campagnes en cours
      const mockCampaigns: CampaignExecution[] = [
        {
          id: 'campaign1',
          strategyId: 'strategy1',
          strategyName: 'Récupération Formulaire Standard',
          customerId: 'customer123',
          customerInfo: 'Marie Dubois - marie.d@email.com',
          startedAt: new Date(Date.now() - 15 * 60 * 1000),
          currentStep: 1,
          status: 'active',
          steps: [
            {
              stepId: 'step1',
              scheduledAt: new Date(Date.now() - 10 * 60 * 1000),
              executedAt: new Date(Date.now() - 10 * 60 * 1000),
              status: 'delivered',
              channel: 'email',
              response: { opened: true, clicked: false }
            },
            {
              stepId: 'step2',
              scheduledAt: new Date(Date.now() + 45 * 60 * 1000),
              status: 'pending',
              channel: 'sms'
            }
          ],
          metadata: {
            abandonStage: 'form_partial',
            formProgress: 75,
            estimatedValue: 450,
            customerSegment: 'new_customer',
            device: 'desktop',
            location: 'Paris, France'
          }
        },
        {
          id: 'campaign2',
          strategyId: 'strategy2',
          strategyName: 'Récupération Paiement Urgente',
          customerId: 'customer456',
          customerInfo: 'Jean Martin - 06.12.34.56.78',
          startedAt: new Date(Date.now() - 8 * 60 * 1000),
          currentStep: 2,
          status: 'active',
          steps: [
            {
              stepId: 'step1',
              scheduledAt: new Date(Date.now() - 7 * 60 * 1000),
              executedAt: new Date(Date.now() - 7 * 60 * 1000),
              status: 'opened',
              channel: 'email',
              response: { opened: true, clicked: true }
            },
            {
              stepId: 'step2',
              scheduledAt: new Date(Date.now() - 2 * 60 * 1000),
              executedAt: new Date(Date.now() - 2 * 60 * 1000),
              status: 'delivered',
              channel: 'sms'
            },
            {
              stepId: 'step3',
              scheduledAt: new Date(Date.now() + 22 * 60 * 1000),
              status: 'pending',
              channel: 'call'
            }
          ],
          metadata: {
            abandonStage: 'payment_abandoned',
            formProgress: 100,
            estimatedValue: 280,
            customerSegment: 'returning_customer',
            device: 'mobile',
            location: 'Lyon, France'
          }
        }
      ]
      
      setCampaigns(mockCampaigns)
      
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error)
    }
  }

  const handleToggleStrategy = async (strategyId: string, enabled: boolean) => {
    try {
      setStrategies(prev => 
        prev.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, enabled, updatedAt: new Date() }
            : strategy
        )
      )
      
      toast({
        title: enabled ? "Stratégie activée" : "Stratégie désactivée",
        description: `La stratégie a été ${enabled ? 'activée' : 'désactivée'}`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la stratégie",
        variant: "destructive",
      })
    }
  }

  const handleCreateStrategy = async () => {
    try {
      const newStrategy: RecoveryStrategy = {
        id: `strategy_${Date.now()}`,
        ...formData,
        metrics: {
          triggered: 0,
          completed: 0,
          recovered: 0,
          successRate: 0,
          averageCost: 0,
          totalRevenue: 0,
          roi: 0,
          averageRecoveryTime: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setStrategies(prev => [...prev, newStrategy])
      setShowCreateModal(false)
      resetForm()
      
      toast({
        title: "Stratégie créée",
        description: "La nouvelle stratégie a été créée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la stratégie",
        variant: "destructive",
      })
    }
  }

  const handleEditStrategy = async () => {
    try {
      if (!selectedStrategy) return
      
      setStrategies(prev => 
        prev.map(strategy => 
          strategy.id === selectedStrategy.id 
            ? { ...strategy, ...formData, updatedAt: new Date() }
            : strategy
        )
      )
      
      setShowEditModal(false)
      setSelectedStrategy(null)
      resetForm()
      
      toast({
        title: "Stratégie modifiée",
        description: "La stratégie a été modifiée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la stratégie",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStrategy = async () => {
    try {
      if (!strategyToDelete) return
      
      setStrategies(prev => 
        prev.filter(strategy => strategy.id !== strategyToDelete)
      )
      
      setShowDeleteDialog(false)
      setStrategyToDelete(null)
      
      toast({
        title: "Stratégie supprimée",
        description: "La stratégie a été supprimée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la stratégie",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: 'form_partial',
      enabled: true,
      priority: 'medium',
      conditions: {
        minAmount: undefined,
        maxAmount: undefined,
        minCompletion: undefined,
        customerSegments: [],
        timeWindow: 24 * 60 * 60 * 1000,
        maxAttempts: 3,
        deviceTypes: []
      },
      steps: []
    })
  }

  const openEditModal = (strategy: RecoveryStrategy) => {
    setSelectedStrategy(strategy)
    setFormData({
      name: strategy.name,
      description: strategy.description,
      trigger: strategy.trigger,
      enabled: strategy.enabled,
      priority: strategy.priority,
      conditions: strategy.conditions,
      steps: strategy.steps
    })
    setShowEditModal(true)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <EnvelopeIcon className="h-4 w-4 text-blue-500" />
      case 'sms':
        return <DevicePhoneMobileIcon className="h-4 w-4 text-green-500" />
      case 'call':
        return <PhoneIcon className="h-4 w-4 text-orange-500" />
      case 'whatsapp':
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-600" />
      case 'push':
        return <BellIcon className="h-4 w-4 text-purple-500" />
      default:
        return <BellIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'recovered':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTotalMetrics = () => {
    return strategies.reduce((total, strategy) => ({
      triggered: total.triggered + strategy.metrics.triggered,
      recovered: total.recovered + strategy.metrics.recovered,
      totalRevenue: total.totalRevenue + strategy.metrics.totalRevenue,
      totalCost: total.totalCost + (strategy.metrics.triggered * strategy.metrics.averageCost)
    }), {
      triggered: 0,
      recovered: 0,
      totalRevenue: 0,
      totalCost: 0
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des stratégies de récupération...</p>
        </div>
      </div>
    )
  }

  const totalMetrics = getTotalMetrics()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <ArrowPathIcon className="h-8 w-8 text-white" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Stratégies de Récupération</h1>
              </div>
              <p className="text-orange-100">Gestion et monitoring des campagnes de récupération</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm opacity-90">ROI Moyen</p>
                <p className="text-white text-2xl font-bold">
                  {totalMetrics.totalRevenue > 0 ? 
                    Math.round(((totalMetrics.totalRevenue - totalMetrics.totalCost) / totalMetrics.totalCost) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stratégies Actives</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {strategies.filter(s => s.enabled).length}
                  </p>
                </div>
                <Cog6ToothIcon className="h-12 w-12 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-500">sur {strategies.length} total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Campagnes Actives</p>
                  <p className="text-3xl font-bold text-green-600">{campaigns.filter(c => c.status === 'active').length}</p>
                </div>
                <SparklesIcon className="h-12 w-12 text-green-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500">En cours</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Récupéré</p>
                  <p className="text-3xl font-bold text-purple-600">{totalMetrics.recovered}</p>
                </div>
                <TrophyIcon className="h-12 w-12 text-purple-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-purple-500">↑ 15%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenus Générés</p>
                  <p className="text-3xl font-bold text-orange-600">{totalMetrics.totalRevenue.toLocaleString()}€</p>
                </div>
                <CurrencyDollarIcon className="h-12 w-12 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-orange-500">↑ 22%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              Stratégies
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              Campagnes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Tab Stratégies */}
          <TabsContent value="strategies" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Stratégies de Récupération</h2>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle Stratégie
              </Button>
            </div>

            {/* Modal de création simplifié */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4">Créer une nouvelle stratégie</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="strategy-name">Nom de la stratégie</Label>
                      <Input
                        id="strategy-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom de la stratégie"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="strategy-description">Description</Label>
                      <Textarea
                        id="strategy-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description de la stratégie"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="strategy-trigger">Déclencheur</Label>
                        <Select value={formData.trigger} onValueChange={(value: any) => setFormData(prev => ({ ...prev, trigger: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="form_partial">Formulaire partiel</SelectItem>
                            <SelectItem value="quote_viewed">Devis consulté</SelectItem>
                            <SelectItem value="payment_abandoned">Paiement abandonné</SelectItem>
                            <SelectItem value="booking_expired">Réservation expirée</SelectItem>
                            <SelectItem value="return_visitor">Visiteur de retour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="strategy-priority">Priorité</Label>
                        <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateStrategy}>
                      Créer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{strategy.name}</h3>
                          <Badge className={getPriorityColor(strategy.priority)}>
                            {strategy.priority}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={(enabled) => handleToggleStrategy(strategy.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">{strategy.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{strategy.trigger}</Badge>
                        <span className="text-sm text-gray-500">
                          {strategy.steps.length} étapes
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Déclenchées:</p>
                          <p className="font-semibold">{strategy.metrics.triggered}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Récupérées:</p>
                          <p className="font-semibold text-green-600">{strategy.metrics.recovered}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Taux:</p>
                          <p className="font-semibold text-blue-600">{strategy.metrics.successRate}%</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Étapes:</h4>
                        <div className="space-y-2">
                          {strategy.steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-2 text-sm">
                              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                {index + 1}
                              </span>
                              {getChannelIcon(step.type)}
                              <span>
                                {step.type} après {Math.round(step.delay / 60)}min
                              </span>
                              <Badge variant="outline" className="ml-auto">
                                {step.metrics.converted} conv.
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm border-t pt-4">
                        <div>
                          <p className="text-gray-600">Revenus:</p>
                          <p className="font-semibold text-green-600">{strategy.metrics.totalRevenue.toLocaleString()}€</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600">ROI:</p>
                          <p className="font-semibold text-orange-600">{strategy.metrics.roi}%</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => openEditModal(strategy)}
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <ChartBarIcon className="h-4 w-4 mr-2" />
                          Stats
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer cette stratégie ?')) {
                              setStrategyToDelete(strategy.id)
                              handleDeleteStrategy()
                            }
                          }}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Campagnes */}
          <TabsContent value="campaigns" className="space-y-6">
            <h2 className="text-2xl font-bold">Campagnes en Cours</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="bg-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{campaign.customerInfo}</h3>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{campaign.strategyName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Démarrée</p>
                        <p className="font-medium">
                          {Math.round((Date.now() - campaign.startedAt.getTime()) / 1000 / 60)} min
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Étape actuelle</p>
                        <p className="font-semibold">{campaign.currentStep + 1}/{campaign.steps.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Valeur estimée</p>
                        <p className="font-semibold">{campaign.metadata.estimatedValue}€</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Progression</p>
                        <p className="font-semibold">{campaign.metadata.formProgress}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Appareil</p>
                        <p className="font-semibold">{campaign.metadata.device}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Localisation</p>
                        <p className="font-semibold text-sm">{campaign.metadata.location}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Étapes de la campagne:</h4>
                      <div className="space-y-2">
                        {campaign.steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.status === 'delivered' || step.status === 'opened' || step.status === 'clicked' 
                                ? 'bg-green-100 text-green-600' 
                                : step.status === 'failed' 
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getChannelIcon(step.channel)}
                                <span className="font-medium">{step.channel}</span>
                                <Badge variant="outline" className="ml-auto">
                                  {step.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {step.executedAt 
                                  ? `Exécuté: ${step.executedAt.toLocaleTimeString()}`
                                  : `Programmé: ${step.scheduledAt.toLocaleTimeString()}`
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {campaign.metadata.customerSegment}
                        </Badge>
                        <Badge variant="outline">
                          {campaign.metadata.abandonStage}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <PauseIcon className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                        <Button size="sm" variant="outline">
                          <StopIcon className="h-4 w-4 mr-2" />
                          Arrêter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics des Stratégies</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top des stratégies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5" />
                    Top des Stratégies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {strategies
                      .sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue)
                      .slice(0, 5)
                      .map((strategy, index) => (
                        <div key={strategy.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{strategy.name}</p>
                              <p className="text-sm text-gray-500">{strategy.trigger}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{strategy.metrics.totalRevenue.toLocaleString()}€</p>
                            <p className="text-sm text-gray-500">{strategy.metrics.successRate}% succès</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance par canal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Performance par Canal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      strategies.reduce((acc, strategy) => {
                        strategy.steps.forEach(step => {
                          if (!acc[step.type]) {
                            acc[step.type] = { sent: 0, converted: 0, revenue: 0 }
                          }
                          acc[step.type].sent += step.metrics.sent
                          acc[step.type].converted += step.metrics.converted
                          acc[step.type].revenue += step.metrics.converted * (strategy.metrics.totalRevenue / strategy.metrics.recovered || 0)
                        })
                        return acc
                      }, {} as Record<string, { sent: number; converted: number; revenue: number }>)
                    ).map(([channel, stats]) => (
                      <div key={channel} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getChannelIcon(channel)}
                          <div>
                            <p className="font-medium">{channel}</p>
                            <p className="text-sm text-gray-500">{stats.sent} envoyés</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{Math.round((stats.converted / stats.sent) * 100)}%</p>
                          <p className="text-sm text-gray-500">{stats.converted} conversions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <h2 className="text-2xl font-bold">Monitoring en Temps Réel</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activité récente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Campagne démarrée - Marie D.</span>
                      <span className="text-xs text-gray-500 ml-auto">Il y a 2 min</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Email ouvert - Jean M.</span>
                      <span className="text-xs text-gray-500 ml-auto">Il y a 5 min</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-purple-50 rounded">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Conversion réussie - Sophie L.</span>
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
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Tous les services fonctionnent</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Stratégie "Booking Expired" désactivée</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <ChevronUpIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Performance en amélioration (+15%)</span>
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