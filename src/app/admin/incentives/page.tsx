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
import { useIncentives } from '@/lib/incentiveSystem'
import { 
  GiftIcon,
  CurrencyDollarIcon,
  PercentBadgeIcon,
  StarIcon,
  TrophyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  CogIcon,
  BellIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface IncentiveConfig {
  id: string
  name: string
  type: 'percentage_discount' | 'fixed_discount' | 'free_service' | 'upgrade' | 'gift' | 'free_consultation'
  trigger: 'form_partial' | 'quote_viewed' | 'payment_abandoned' | 'booking_expired' | 'return_visitor' | 'first_time_customer'
  value: number
  currency?: string
  conditions: {
    minAmount?: number
    maxAmount?: number
    minCompletion?: number
    serviceTypes?: string[]
    customerSegments?: string[]
    timeWindow?: number
    maxUses?: number
    maxUsesPerCustomer?: number
  }
  display: {
    badge?: string
    color?: string
    icon?: string
    urgencyLevel?: 'low' | 'medium' | 'high'
    marketingMessage?: string
  }
  enabled: boolean
  validFrom: Date
  validTo?: Date
  usage: {
    totalCreated: number
    totalUsed: number
    totalConverted: number
    totalRevenue: number
    conversionRate: number
    costToCompany: number
    roi: number
  }
  createdAt: Date
  updatedAt: Date
}

export default function AdminIncentivesPage() {
  const { toast } = useToast()
  const incentives = useIncentives()
  
  const [loading, setLoading] = useState(true)
  const [incentiveConfigs, setIncentiveConfigs] = useState<IncentiveConfig[]>([])
  const [selectedIncentive, setSelectedIncentive] = useState<IncentiveConfig | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [incentiveToDelete, setIncentiveToDelete] = useState<string | null>(null)

  // État pour nouveau/édition incentive
  const [formData, setFormData] = useState<Partial<IncentiveConfig> & {
    name: string;
    type: IncentiveConfig['type'];
    trigger: IncentiveConfig['trigger'];
    value: number;
    currency: string;
    conditions: IncentiveConfig['conditions'];
    display: IncentiveConfig['display'];
    enabled: boolean;
    validFrom: Date;
    validTo?: Date;
  }>({
    name: '',
    type: 'percentage_discount',
    trigger: 'form_partial',
    value: 0,
    currency: 'EUR',
    conditions: {
      minAmount: undefined,
      maxAmount: undefined,
      minCompletion: undefined,
      serviceTypes: [],
      customerSegments: [],
      timeWindow: 24 * 60 * 60 * 1000, // 24 heures
      maxUses: undefined,
      maxUsesPerCustomer: 1
    },
    display: {
      badge: '',
      color: '#4CAF50',
      icon: '🎁',
      urgencyLevel: 'medium' as const,
      marketingMessage: ''
    },
    enabled: true,
    validFrom: new Date(),
    validTo: undefined
  })

  useEffect(() => {
    loadIncentiveConfigs()
  }, [])

  const loadIncentiveConfigs = async () => {
    try {
      setLoading(true)
      
      // Simuler le chargement des incentives
      const mockIncentives: IncentiveConfig[] = [
        {
          id: 'incentive1',
          name: 'Réduction Formulaire 5%',
          type: 'percentage_discount',
          trigger: 'form_partial',
          value: 5,
          conditions: {
            minCompletion: 50,
            timeWindow: 24 * 60 * 60 * 1000,
            maxUsesPerCustomer: 1
          },
          display: {
            badge: '5% OFF',
            color: '#4CAF50',
            icon: '🎁',
            urgencyLevel: 'medium',
            marketingMessage: 'Finalisez maintenant et économisez !'
          },
          enabled: true,
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2024-12-31'),
          usage: {
            totalCreated: 1547,
            totalUsed: 443,
            totalConverted: 126,
            totalRevenue: 8965,
            conversionRate: 28.4,
            costToCompany: 448.25,
            roi: 1900
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-20')
        },
        {
          id: 'incentive2',
          name: 'Réduction Devis 10%',
          type: 'percentage_discount',
          trigger: 'quote_viewed',
          value: 10,
          conditions: {
            minAmount: 100,
            timeWindow: 12 * 60 * 60 * 1000,
            maxUsesPerCustomer: 1
          },
          display: {
            badge: '10% OFF',
            color: '#FF9800',
            icon: '💰',
            urgencyLevel: 'high',
            marketingMessage: 'Offre limitée dans le temps !'
          },
          enabled: true,
          validFrom: new Date('2024-01-15'),
          validTo: new Date('2024-06-30'),
          usage: {
            totalCreated: 892,
            totalUsed: 356,
            totalConverted: 189,
            totalRevenue: 15670,
            conversionRate: 53.1,
            costToCompany: 1567,
            roi: 900
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-22')
        },
        {
          id: 'incentive3',
          name: 'Réduction Paiement 20€',
          type: 'fixed_discount',
          trigger: 'payment_abandoned',
          value: 20,
          currency: 'EUR',
          conditions: {
            minAmount: 150,
            timeWindow: 2 * 60 * 60 * 1000,
            maxUsesPerCustomer: 1
          },
          display: {
            badge: '-20€',
            color: '#F44336',
            icon: '🚨',
            urgencyLevel: 'high',
            marketingMessage: 'Offre d\'urgence valable 2h seulement !'
          },
          enabled: true,
          validFrom: new Date('2024-01-10'),
          validTo: undefined,
          usage: {
            totalCreated: 234,
            totalUsed: 89,
            totalConverted: 53,
            totalRevenue: 7420,
            conversionRate: 59.6,
            costToCompany: 1060,
            roi: 600
          },
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-21')
        },
        {
          id: 'incentive4',
          name: 'Consultation Gratuite',
          type: 'free_consultation',
          trigger: 'first_time_customer',
          value: 0,
          conditions: {
            timeWindow: 7 * 24 * 60 * 60 * 1000,
            maxUsesPerCustomer: 1
          },
          display: {
            badge: 'GRATUIT',
            color: '#2196F3',
            icon: '📞',
            urgencyLevel: 'low',
            marketingMessage: 'Nouvelle offre client : consultation gratuite'
          },
          enabled: true,
          validFrom: new Date('2024-01-05'),
          validTo: undefined,
          usage: {
            totalCreated: 567,
            totalUsed: 234,
            totalConverted: 78,
            totalRevenue: 3456,
            conversionRate: 33.3,
            costToCompany: 0,
            roi: 0
          },
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-18')
        },
        {
          id: 'incentive5',
          name: 'Upgrade Premium',
          type: 'upgrade',
          trigger: 'return_visitor',
          value: 0,
          conditions: {
            minAmount: 500,
            serviceTypes: ['moving', 'cleaning'],
            timeWindow: 48 * 60 * 60 * 1000,
            maxUsesPerCustomer: 1
          },
          display: {
            badge: 'PREMIUM',
            color: '#9C27B0',
            icon: '⭐',
            urgencyLevel: 'medium',
            marketingMessage: 'Upgrade premium offert pour votre commande importante'
          },
          enabled: false,
          validFrom: new Date('2024-01-20'),
          validTo: new Date('2024-03-31'),
          usage: {
            totalCreated: 45,
            totalUsed: 12,
            totalConverted: 8,
            totalRevenue: 2340,
            conversionRate: 66.7,
            costToCompany: 600,
            roi: 290
          },
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-22')
        }
      ]
      
      setIncentiveConfigs(mockIncentives)
      
    } catch (error) {
      console.error('Erreur lors du chargement des incentives:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les incentives",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleIncentive = async (incentiveId: string, enabled: boolean) => {
    try {
      setIncentiveConfigs(prev => 
        prev.map(incentive => 
          incentive.id === incentiveId 
            ? { ...incentive, enabled, updatedAt: new Date() }
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

  const handleCreateIncentive = async () => {
    try {
      const newIncentive: IncentiveConfig = {
        id: `incentive_${Date.now()}`,
        ...formData,
        usage: {
          totalCreated: 0,
          totalUsed: 0,
          totalConverted: 0,
          totalRevenue: 0,
          conversionRate: 0,
          costToCompany: 0,
          roi: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setIncentiveConfigs(prev => [...prev, newIncentive])
      setShowCreateModal(false)
      resetForm()
      
      toast({
        title: "Incentive créé",
        description: "Le nouveau incentive a été créé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'incentive",
        variant: "destructive",
      })
    }
  }

  const handleEditIncentive = async () => {
    try {
      if (!selectedIncentive) return
      
      setIncentiveConfigs(prev => 
        prev.map(incentive => 
          incentive.id === selectedIncentive.id 
            ? { ...incentive, ...formData, updatedAt: new Date() }
            : incentive
        )
      )
      
      setShowEditModal(false)
      setSelectedIncentive(null)
      resetForm()
      
      toast({
        title: "Incentive modifié",
        description: "L'incentive a été modifié avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'incentive",
        variant: "destructive",
      })
    }
  }

  const handleDeleteIncentive = async () => {
    try {
      if (!incentiveToDelete) return
      
      setIncentiveConfigs(prev => 
        prev.filter(incentive => incentive.id !== incentiveToDelete)
      )
      
      setShowDeleteDialog(false)
      setIncentiveToDelete(null)
      
      toast({
        title: "Incentive supprimé",
        description: "L'incentive a été supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'incentive",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'percentage_discount',
      trigger: 'form_partial',
      value: 0,
      currency: 'EUR',
      conditions: {
        minAmount: undefined,
        maxAmount: undefined,
        minCompletion: undefined,
        serviceTypes: [],
        customerSegments: [],
        timeWindow: 24 * 60 * 60 * 1000,
        maxUses: undefined,
        maxUsesPerCustomer: 1
      },
      display: {
        badge: '',
        color: '#4CAF50',
        icon: '🎁',
        urgencyLevel: 'medium',
        marketingMessage: ''
      },
      enabled: true,
      validFrom: new Date(),
      validTo: undefined
    })
  }

  const openEditModal = (incentive: IncentiveConfig) => {
    setSelectedIncentive(incentive)
    setFormData({
      name: incentive.name,
      type: incentive.type,
      trigger: incentive.trigger,
      value: incentive.value,
      currency: incentive.currency || 'EUR',
      conditions: incentive.conditions as any,
      display: incentive.display as any,
      enabled: incentive.enabled,
      validFrom: incentive.validFrom,
      validTo: incentive.validTo as any
    })
    setShowEditModal(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage_discount':
        return <PercentBadgeIcon className="h-5 w-5 text-green-500" />
      case 'fixed_discount':
        return <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />
      case 'free_service':
        return <GiftIcon className="h-5 w-5 text-purple-500" />
      case 'upgrade':
        return <StarIcon className="h-5 w-5 text-yellow-500" />
      case 'free_consultation':
        return <TrophyIcon className="h-5 w-5 text-orange-500" />
      default:
        return <TagIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTotalMetrics = () => {
    return incentiveConfigs.reduce((total, incentive) => ({
      totalCreated: total.totalCreated + incentive.usage.totalCreated,
      totalUsed: total.totalUsed + incentive.usage.totalUsed,
      totalConverted: total.totalConverted + incentive.usage.totalConverted,
      totalRevenue: total.totalRevenue + incentive.usage.totalRevenue,
      costToCompany: total.costToCompany + incentive.usage.costToCompany
    }), {
      totalCreated: 0,
      totalUsed: 0,
      totalConverted: 0,
      totalRevenue: 0,
      costToCompany: 0
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des incentives...</p>
        </div>
      </div>
    )
  }

  const totalMetrics = getTotalMetrics()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <GiftIcon className="h-8 w-8 text-white" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Gestion des Incentives</h1>
              </div>
              <p className="text-yellow-100">Configuration et suivi des offres et réductions</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm opacity-90">ROI Total</p>
                <p className="text-white text-2xl font-bold">
                  {totalMetrics.totalRevenue > 0 ? 
                    Math.round(((totalMetrics.totalRevenue - totalMetrics.costToCompany) / totalMetrics.costToCompany) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Créés</p>
                  <p className="text-3xl font-bold text-blue-600">{totalMetrics.totalCreated.toLocaleString()}</p>
                </div>
                <PlusIcon className="h-12 w-12 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-blue-500">↑ 18%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Utilisés</p>
                  <p className="text-3xl font-bold text-green-600">{totalMetrics.totalUsed.toLocaleString()}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500">↑ 25%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversions</p>
                  <p className="text-3xl font-bold text-purple-600">{totalMetrics.totalConverted.toLocaleString()}</p>
                </div>
                <TrophyIcon className="h-12 w-12 text-purple-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-purple-500">↑ 32%</span>
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
                <span className="text-orange-500">↑ 28%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Coût Total</p>
                  <p className="text-3xl font-bold text-red-600">{totalMetrics.costToCompany.toLocaleString()}€</p>
                </div>
                <ChevronDownIcon className="h-12 w-12 text-red-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-red-500">↑ 15%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4" />
              Actifs
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <XCircleIcon className="h-4 w-4" />
              Inactifs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <CogIcon className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Tab Actifs */}
          <TabsContent value="active" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Incentives Actifs</h2>
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nouvel Incentive
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un nouvel incentive</DialogTitle>
                    <DialogDescription>
                      Configurez un nouveau incentive pour la récupération d'abandons
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Informations de base */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Informations de base</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="incentive-name">Nom de l'incentive</Label>
                          <Input
                            id="incentive-name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nom de l'incentive"
                          />
                        </div>
                        <div>
                          <Label htmlFor="incentive-type">Type</Label>
                          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage_discount">Réduction en %</SelectItem>
                              <SelectItem value="fixed_discount">Réduction fixe</SelectItem>
                              <SelectItem value="free_service">Service gratuit</SelectItem>
                              <SelectItem value="upgrade">Upgrade</SelectItem>
                              <SelectItem value="free_consultation">Consultation gratuite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="incentive-trigger">Déclencheur</Label>
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
                              <SelectItem value="first_time_customer">Premier client</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="incentive-value">Valeur</Label>
                          <Input
                            id="incentive-value"
                            type="number"
                            value={formData.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                            placeholder="Valeur"
                          />
                        </div>
                        <div>
                          <Label htmlFor="incentive-urgency">Urgence</Label>
                          <Select value={formData.display.urgencyLevel} onValueChange={(value: any) => setFormData(prev => ({ ...prev, display: { ...prev.display, urgencyLevel: value } }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Faible</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="high">Élevée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Conditions</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="min-amount">Montant minimum</Label>
                          <Input
                            id="min-amount"
                            type="number"
                            value={formData.conditions.minAmount || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              conditions: { ...prev.conditions, minAmount: e.target.value ? parseFloat(e.target.value) : undefined }
                            }))}
                            placeholder="Montant minimum"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-amount">Montant maximum</Label>
                          <Input
                            id="max-amount"
                            type="number"
                            value={formData.conditions.maxAmount || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              conditions: { ...prev.conditions, maxAmount: e.target.value ? parseFloat(e.target.value) : undefined }
                            }))}
                            placeholder="Montant maximum"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-uses">Utilisations max par client</Label>
                          <Input
                            id="max-uses"
                            type="number"
                            value={formData.conditions.maxUsesPerCustomer || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              conditions: { ...prev.conditions, maxUsesPerCustomer: parseInt(e.target.value) || undefined }
                            }))}
                            placeholder="Utilisations max"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Affichage */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Affichage</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="badge-text">Texte du badge</Label>
                          <Input
                            id="badge-text"
                            value={formData.display.badge || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              display: { ...prev.display, badge: e.target.value }
                            }))}
                            placeholder="Ex: 10% OFF"
                          />
                        </div>
                        <div>
                          <Label htmlFor="icon-text">Icône</Label>
                          <Input
                            id="icon-text"
                            value={formData.display.icon || ''}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              display: { ...prev.display, icon: e.target.value }
                            }))}
                            placeholder="Ex: 🎁"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="marketing-message">Message marketing</Label>
                        <Textarea
                          id="marketing-message"
                          value={formData.display.marketingMessage || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            display: { ...prev.display, marketingMessage: e.target.value }
                          }))}
                          placeholder="Message attractif pour motiver l'utilisateur"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateIncentive}>
                        Créer l'incentive
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {incentiveConfigs.filter(incentive => incentive.enabled).map((incentive) => (
                <Card key={incentive.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(incentive.type)}
                        <div>
                          <CardTitle className="text-lg">{incentive.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{incentive.trigger}</Badge>
                            <Badge className={getUrgencyColor(incentive.display.urgencyLevel || 'medium')}>
                              {incentive.display.urgencyLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={incentive.enabled}
                        onCheckedChange={(enabled) => handleToggleIncentive(incentive.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valeur:</span>
                        <span className="font-semibold text-lg">
                          {incentive.type === 'percentage_discount' ? `${incentive.value}%` : 
                           incentive.type === 'fixed_discount' ? `${incentive.value}€` : 
                           'Gratuit'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {incentive.display.marketingMessage || 'Aucun message marketing'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Créés:</p>
                          <p className="font-semibold">{incentive.usage.totalCreated}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Utilisés:</p>
                          <p className="font-semibold text-green-600">{incentive.usage.totalUsed}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversions:</p>
                          <p className="font-semibold text-purple-600">{incentive.usage.totalConverted}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Taux:</p>
                          <p className="font-semibold text-blue-600">{incentive.usage.conversionRate}%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-gray-600">Revenus:</p>
                          <p className="font-semibold text-green-600">{incentive.usage.totalRevenue}€</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600">ROI:</p>
                          <p className="font-semibold text-orange-600">{incentive.usage.roi}%</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => openEditModal(incentive)}
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
                            setIncentiveToDelete(incentive.id)
                            setShowDeleteDialog(true)
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

          {/* Tab Inactifs */}
          <TabsContent value="inactive" className="space-y-6">
            <h2 className="text-2xl font-bold">Incentives Inactifs</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {incentiveConfigs.filter(incentive => !incentive.enabled).map((incentive) => (
                <Card key={incentive.id} className="bg-gray-50 shadow-lg opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(incentive.type)}
                        <div>
                          <CardTitle className="text-lg text-gray-700">{incentive.name}</CardTitle>
                          <Badge variant="secondary">Inactif</Badge>
                        </div>
                      </div>
                      <Switch
                        checked={incentive.enabled}
                        onCheckedChange={(enabled) => handleToggleIncentive(incentive.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valeur:</span>
                        <span className="font-semibold">
                          {incentive.type === 'percentage_discount' ? `${incentive.value}%` : 
                           incentive.type === 'fixed_discount' ? `${incentive.value}€` : 
                           'Gratuit'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Créés:</p>
                          <p className="font-semibold">{incentive.usage.totalCreated}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Utilisés:</p>
                          <p className="font-semibold">{incentive.usage.totalUsed}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => openEditModal(incentive)}
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setIncentiveToDelete(incentive.id)
                            setShowDeleteDialog(true)
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

          {/* Tab Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics des Incentives</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top des incentives */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5" />
                    Top des Incentives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incentiveConfigs
                      .sort((a, b) => b.usage.totalRevenue - a.usage.totalRevenue)
                      .slice(0, 5)
                      .map((incentive, index) => (
                        <div key={incentive.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{incentive.name}</p>
                              <p className="text-sm text-gray-500">{incentive.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{incentive.usage.totalRevenue}€</p>
                            <p className="text-sm text-gray-500">{incentive.usage.totalConverted} conversions</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance par type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Performance par Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      incentiveConfigs.reduce((acc, incentive) => {
                        if (!acc[incentive.type]) {
                          acc[incentive.type] = { count: 0, revenue: 0, conversions: 0 }
                        }
                        acc[incentive.type].count++
                        acc[incentive.type].revenue += incentive.usage.totalRevenue
                        acc[incentive.type].conversions += incentive.usage.totalConverted
                        return acc
                      }, {} as Record<string, { count: number; revenue: number; conversions: number }>)
                    ).map(([type, stats]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(type)}
                          <div>
                            <p className="font-medium">{type}</p>
                            <p className="text-sm text-gray-500">{stats.count} incentives</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{stats.revenue}€</p>
                          <p className="text-sm text-gray-500">{stats.conversions} conversions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Paramètres Généraux</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CogIcon className="h-5 w-5" />
                    Configuration Globale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Incentives automatiques</p>
                        <p className="text-sm text-gray-500">Activer la création automatique d'incentives</p>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notifications par email</p>
                        <p className="text-sm text-gray-500">Recevoir les notifications de performance</p>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Limite quotidienne</p>
                        <p className="text-sm text-gray-500">Limiter le nombre d'incentives par jour</p>
                      </div>
                      <Switch checked={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellIcon className="h-5 w-5" />
                    Alertes et Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Seuil d'alerte ROI (%)</Label>
                      <Input type="number" placeholder="50" defaultValue="50" />
                    </div>
                    
                    <div>
                      <Label>Limite de coût journalier (€)</Label>
                      <Input type="number" placeholder="1000" defaultValue="1000" />
                    </div>
                    
                    <div>
                      <Label>Email d'alerte</Label>
                      <Input type="email" placeholder="admin@example.com" />
                    </div>
                    
                    <Button className="w-full">
                      Sauvegarder les paramètres
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal d'édition */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'incentive</DialogTitle>
              <DialogDescription>
                Modifiez la configuration de l'incentive
              </DialogDescription>
            </DialogHeader>
            {/* Même contenu que pour la création */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleEditIncentive}>
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de suppression */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cet incentive sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteIncentive}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 