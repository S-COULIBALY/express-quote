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
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
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

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'whatsapp' | 'call'
  category: 'form_recovery' | 'quote_recovery' | 'payment_recovery' | 'incentive_offer' | 'assistance'
  subject: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  enabled: boolean
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
  }
  createdAt: string
  updatedAt: string
}

interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'whatsapp' | 'call'
  enabled: boolean
  provider: string
  configuration: Record<string, any>
  metrics: {
    totalSent: number
    successRate: number
    averageDeliveryTime: number
    cost: number
  }
  lastUsed: string
}

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // État pour nouveau template
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as const,
    category: 'form_recovery' as const,
    subject: '',
    content: '',
    priority: 'medium' as const,
    enabled: true
  })

  // État pour nouveau canal
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'email' as const,
    enabled: true,
    provider: '',
    configuration: {}
  })

  useEffect(() => {
    loadTemplates()
    loadChannels()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      // Simuler le chargement des templates
      const mockTemplates: NotificationTemplate[] = [
        {
          id: 'template1',
          name: 'Rappel Formulaire Doux',
          type: 'email',
          category: 'form_recovery',
          subject: 'Votre demande est en attente',
          content: 'Bonjour {{firstName}},\n\nVous avez commencé une demande de devis sur notre site. Souhaitez-vous la finaliser ?\n\nCette demande expire dans {{timeLeft}}.\n\nFinaliser ma demande: {{actionUrl}}',
          priority: 'medium',
          enabled: true,
          metrics: {
            sent: 1847,
            delivered: 1823,
            opened: 456,
            clicked: 78,
            converted: 23
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:22:00Z'
        },
        {
          id: 'template2',
          name: 'Urgence Paiement',
          type: 'sms',
          category: 'payment_recovery',
          subject: 'Finalisation paiement',
          content: '🚨 Votre paiement de {{amount}}€ est en attente. Finalisez maintenant: {{actionUrl}}',
          priority: 'urgent',
          enabled: true,
          metrics: {
            sent: 234,
            delivered: 230,
            opened: 205,
            clicked: 89,
            converted: 45
          },
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-22T11:45:00Z'
        },
        {
          id: 'template3',
          name: 'Offre Incentive',
          type: 'email',
          category: 'incentive_offer',
          subject: '🎁 Offre spéciale pour vous',
          content: 'Bonjour {{firstName}},\n\nPour vous remercier de votre intérêt, nous vous offrons {{incentiveText}}.\n\nCette offre est valable jusqu\'au {{expiryDate}}.\n\nProfiter de l\'offre: {{actionUrl}}',
          priority: 'high',
          enabled: true,
          metrics: {
            sent: 456,
            delivered: 451,
            opened: 312,
            clicked: 156,
            converted: 89
          },
          createdAt: '2024-01-08T16:20:00Z',
          updatedAt: '2024-01-18T13:10:00Z'
        },
        {
          id: 'template4',
          name: 'Assistance Disponible',
          type: 'whatsapp',
          category: 'assistance',
          subject: 'Besoin d\'aide ?',
          content: 'Bonjour {{firstName}} 👋\n\nJ\'ai vu que vous aviez des difficultés avec votre demande.\n\nJe suis là pour vous aider ! Répondez à ce message pour discuter.\n\nÀ bientôt !',
          priority: 'medium',
          enabled: false,
          metrics: {
            sent: 67,
            delivered: 65,
            opened: 61,
            clicked: 34,
            converted: 18
          },
          createdAt: '2024-01-12T14:30:00Z',
          updatedAt: '2024-01-19T09:25:00Z'
        }
      ]
      
      setTemplates(mockTemplates)
      
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les templates de notification",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadChannels = async () => {
    try {
      // Simuler le chargement des canaux
      const mockChannels: NotificationChannel[] = [
        {
          id: 'channel1',
          name: 'Email Principal',
          type: 'email',
          enabled: true,
          provider: 'SendGrid',
          configuration: {
            apiKey: 'sg_****',
            fromEmail: 'noreply@example.com',
            fromName: 'Express Quote'
          },
          metrics: {
            totalSent: 15430,
            successRate: 98.7,
            averageDeliveryTime: 2.3,
            cost: 234.56
          },
          lastUsed: '2024-01-22T15:30:00Z'
        },
        {
          id: 'channel2',
          name: 'SMS France',
          type: 'sms',
          enabled: true,
          provider: 'Twilio',
          configuration: {
            accountSid: 'AC****',
            authToken: '****',
            fromNumber: '+33123456789'
          },
          metrics: {
            totalSent: 2456,
            successRate: 94.2,
            averageDeliveryTime: 1.1,
            cost: 147.36
          },
          lastUsed: '2024-01-22T14:15:00Z'
        },
        {
          id: 'channel3',
          name: 'Push Notifications',
          type: 'push',
          enabled: true,
          provider: 'Firebase',
          configuration: {
            projectId: 'express-quote-*****',
            serviceAccount: '****'
          },
          metrics: {
            totalSent: 8943,
            successRate: 89.3,
            averageDeliveryTime: 0.5,
            cost: 0
          },
          lastUsed: '2024-01-22T16:45:00Z'
        },
        {
          id: 'channel4',
          name: 'WhatsApp Business',
          type: 'whatsapp',
          enabled: false,
          provider: 'Twilio',
          configuration: {
            accountSid: 'AC****',
            authToken: '****',
            fromNumber: '+33987654321'
          },
          metrics: {
            totalSent: 156,
            successRate: 96.8,
            averageDeliveryTime: 3.2,
            cost: 23.40
          },
          lastUsed: '2024-01-20T10:20:00Z'
        }
      ]
      
      setChannels(mockChannels)
      
    } catch (error) {
      console.error('Erreur lors du chargement des canaux:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les canaux de notification",
        variant: "destructive",
      })
    }
  }

  const handleTemplateToggle = async (templateId: string, enabled: boolean) => {
    try {
      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId 
            ? { ...template, enabled }
            : template
        )
      )
      
      toast({
        title: enabled ? "Template activé" : "Template désactivé",
        description: `Le template a été ${enabled ? 'activé' : 'désactivé'}`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le template",
        variant: "destructive",
      })
    }
  }

  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    try {
      setChannels(prev => 
        prev.map(channel => 
          channel.id === channelId 
            ? { ...channel, enabled }
            : channel
        )
      )
      
      toast({
        title: enabled ? "Canal activé" : "Canal désactivé",
        description: `Le canal a été ${enabled ? 'activé' : 'désactivé'}`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le canal",
        variant: "destructive",
      })
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const template: NotificationTemplate = {
        id: `template_${Date.now()}`,
        ...newTemplate,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setTemplates(prev => [...prev, template])
      setShowTemplateModal(false)
      setNewTemplate({
        name: '',
        type: 'email',
        category: 'form_recovery',
        subject: '',
        content: '',
        priority: 'medium',
        enabled: true
      })
      
      toast({
        title: "Template créé",
        description: "Le nouveau template a été créé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le template",
        variant: "destructive",
      })
    }
  }

  const handleTestTemplate = async (templateId: string) => {
    try {
      // Simuler l'envoi de test
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Test envoyé",
        description: "Le template de test a été envoyé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le test",
        variant: "destructive",
      })
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <EnvelopeIcon className="h-5 w-5 text-blue-500" />
      case 'sms':
        return <DevicePhoneMobileIcon className="h-5 w-5 text-green-500" />
      case 'push':
        return <BellIcon className="h-5 w-5 text-purple-500" />
      case 'whatsapp':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
      case 'call':
        return <PhoneIcon className="h-5 w-5 text-orange-500" />
      default:
        return <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <BellIcon className="h-8 w-8 text-white" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Gestion des Notifications</h1>
              </div>
              <p className="text-pink-100">Configuration des templates et canaux de notification</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                {previewMode ? 'Mode Édition' : 'Mode Aperçu'}
              </Button>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Envoyés</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {templates.reduce((sum, t) => sum + t.metrics.sent, 0).toLocaleString()}
                  </p>
                </div>
                <SpeakerWaveIcon className="h-12 w-12 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-blue-500">↑ 12%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux d'Ouverture</p>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round(
                      (templates.reduce((sum, t) => sum + t.metrics.opened, 0) /
                       templates.reduce((sum, t) => sum + t.metrics.delivered, 0)) * 100
                    )}%
                  </p>
                </div>
                <EyeIcon className="h-12 w-12 text-green-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500">↑ 8%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de Clic</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {Math.round(
                      (templates.reduce((sum, t) => sum + t.metrics.clicked, 0) /
                       templates.reduce((sum, t) => sum + t.metrics.delivered, 0)) * 100
                    )}%
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-orange-500">↑ 15%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversions</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {templates.reduce((sum, t) => sum + t.metrics.converted, 0)}
                  </p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-purple-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-purple-500">↑ 22%</span>
                <span className="text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <SpeakerWaveIcon className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              Canaux
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tab Templates */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Templates de Notification</h2>
              <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nouveau Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau template</DialogTitle>
                    <DialogDescription>
                      Configurez un nouveau template de notification
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="template-name">Nom du template</Label>
                        <Input
                          id="template-name"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nom du template"
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-type">Type</Label>
                        <Select value={newTemplate.type} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="push">Push</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="call">Appel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="template-category">Catégorie</Label>
                        <Select value={newTemplate.category} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="form_recovery">Récupération formulaire</SelectItem>
                            <SelectItem value="quote_recovery">Récupération devis</SelectItem>
                            <SelectItem value="payment_recovery">Récupération paiement</SelectItem>
                            <SelectItem value="incentive_offer">Offre incentive</SelectItem>
                            <SelectItem value="assistance">Assistance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="template-priority">Priorité</Label>
                        <Select value={newTemplate.priority} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, priority: value }))}>
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
                    
                    <div>
                      <Label htmlFor="template-subject">Sujet</Label>
                      <Input
                        id="template-subject"
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Sujet du message"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template-content">Contenu</Label>
                      <Textarea
                        id="template-content"
                        value={newTemplate.content}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Contenu du message (utilisez {{variable}} pour les variables)"
                        rows={6}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateTemplate}>
                        Créer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="bg-white shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(template.type)}
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{template.category}</Badge>
                            <Badge className={getPriorityColor(template.priority)}>
                              {template.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={(enabled) => handleTemplateToggle(template.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-sm text-gray-700">Sujet:</p>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm text-gray-700">Contenu:</p>
                        <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Envoyés:</p>
                          <p className="font-semibold">{template.metrics.sent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Ouverture:</p>
                          <p className="font-semibold text-green-600">
                            {Math.round((template.metrics.opened / template.metrics.delivered) * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Clics:</p>
                          <p className="font-semibold text-blue-600">
                            {Math.round((template.metrics.clicked / template.metrics.delivered) * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversions:</p>
                          <p className="font-semibold text-purple-600">{template.metrics.converted}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Aperçu
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleTestTemplate(template.id)}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Canaux */}
          <TabsContent value="channels" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Canaux de Notification</h2>
              <Button onClick={() => setShowChannelModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau Canal
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {channels.map((channel) => (
                <Card key={channel.id} className="bg-white shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel.type)}
                        <div>
                          <CardTitle className="text-lg">{channel.name}</CardTitle>
                          <p className="text-sm text-gray-600">{channel.provider}</p>
                        </div>
                      </div>
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={(enabled) => handleChannelToggle(channel.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total envoyés:</p>
                          <p className="font-semibold">{channel.metrics.totalSent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Taux de succès:</p>
                          <p className="font-semibold text-green-600">{channel.metrics.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Temps moyen:</p>
                          <p className="font-semibold">{channel.metrics.averageDeliveryTime}s</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Coût total:</p>
                          <p className="font-semibold">{channel.metrics.cost.toFixed(2)}€</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">Dernière utilisation:</p>
                        <p className="text-sm font-medium">
                          {new Date(channel.lastUsed).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Cog6ToothIcon className="h-4 w-4 mr-2" />
                          Configurer
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <ChartBarIcon className="h-4 w-4 mr-2" />
                          Statistiques
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
            <h2 className="text-2xl font-bold">Analytics des Notifications</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {channels.map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getChannelIcon(channel.type)}
                          <div>
                            <p className="font-medium">{channel.name}</p>
                            <p className="text-sm text-gray-500">{channel.metrics.totalSent} envoyés</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{channel.metrics.successRate}%</p>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${channel.metrics.successRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top des templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5" />
                    Top des Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates
                      .sort((a, b) => b.metrics.converted - a.metrics.converted)
                      .slice(0, 5)
                      .map((template, index) => (
                        <div key={template.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-gray-500">{template.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{template.metrics.converted}</p>
                            <p className="text-sm text-gray-500">conversions</p>
                          </div>
                        </div>
                      ))}
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