"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Cog6ToothIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  ShieldCheckIcon,
  BoltIcon,
  UserGroupIcon,
  QueueListIcon
} from "@heroicons/react/24/outline"
import { RecipientsConfig, RecipientsConfigData } from './RecipientsConfig'

// Types
interface DocumentConfig {
  enabled: boolean;
  caption: string;
}

type DocumentType = 'quote' | 'booking' | 'payment' | 'reminder';
type MessageType = 'quote_request' | 'booking' | 'payment' | 'cancellation' | 'reminder';
type RecipientType = 'client' | 'salesTeam' | 'accounting' | 'professionals' | 'notifications' | 'providers';

interface RecipientConfig {
  enabled: boolean;
  messageTypes: MessageType[];
}

interface Recipients {
  client: RecipientConfig;
  salesTeam: RecipientConfig;
  accounting: RecipientConfig;
  professionals: RecipientConfig;
  notifications: RecipientConfig;
  providers: RecipientConfig;
}

interface WhatsAppConfig {
  apiKey: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  isActive: boolean;
  sessionTimeout: number;
  sessionAutoReply: string;
  outOfSessionMessage: string;
  maxMessagesPerDay: number;
  maxMessagesPerSession: number;
  cooldownPeriod: number;
  templates: {
    welcome: string;
    confirmation: string;
    reminder: string;
    followUp: string;
    support: string;
  };
  notifyOnNewMessage: boolean;
  notifyOnSessionEnd: boolean;
  notificationEmails: string[];
  trackMessageMetrics: boolean;
  trackUserEngagement: boolean;
  generateReports: boolean;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  documents: {
    [K in DocumentType]: DocumentConfig;
  };
  recipients: Recipients;
}

interface TabConfig {
  id: string;
  label: string;
  icon: JSX.Element;
  description: string;
  component: () => React.ReactNode;
}

interface WhatsAppConfigProps {
  recipientsConfig: RecipientsConfigData;
}

// API Functions
const api = {
  async getWhatsAppConfig(): Promise<WhatsAppConfig> {
    const response = await fetch('/api/admin/whatsapp-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async updateWhatsAppConfig(config: WhatsAppConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/admin/whatsapp-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async patchWhatsAppConfig(operation: string, data: any): Promise<any> {
    const response = await fetch('/api/admin/whatsapp-config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation,
        ...data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
};

// Constants
const teamMapping: Record<string, string> = {
  'salesTeam': 'Équipe commerciale',
  'accounting': 'Comptabilité',
  'professionals': 'Professionnels',
  'notifications': 'Notifications générales',
  'providers': 'Prestataires'
};

const messageTypeMapping: Record<string, string> = {
  'quote_request': 'Demande de devis',
  'booking': 'Confirmation de réservation',
  'payment': 'Confirmation de paiement',
  'cancellation': 'Notification d\'annulation',
  'reminder': 'Rappel de rendez-vous'
};

// Initial config
const initialConfig: WhatsAppConfig = {
  apiKey: '',
  phoneNumberId: '',
  businessAccountId: '',
  webhookVerifyToken: '',
  isActive: false,
  
  sessionTimeout: 24,
  sessionAutoReply: 'Merci de votre message. Un agent vous répondra dans les plus brefs délais.',
  outOfSessionMessage: 'Désolé, cette session est terminée. Veuillez démarrer une nouvelle conversation.',
  
  maxMessagesPerDay: 1000,
  maxMessagesPerSession: 50,
  cooldownPeriod: 60,
  
  templates: {
    welcome: 'Bienvenue chez Express Quote ! Comment pouvons-nous vous aider ?',
    confirmation: 'Votre demande a bien été enregistrée. Référence : {reference}',
    reminder: 'Rappel : Vous avez un rendez-vous prévu le {date}',
    followUp: 'Comment s\'est passé votre déménagement ?',
    support: 'Notre équipe support est là pour vous aider.'
  },
  
  notifyOnNewMessage: true,
  notifyOnSessionEnd: false,
  notificationEmails: [],
  
  trackMessageMetrics: true,
  trackUserEngagement: true,
  generateReports: false,
  reportFrequency: 'weekly',
  
  // Initialisation des nouveaux champs
  documents: {
    quote: {
      enabled: true,
      caption: "Votre devis détaillé"
    },
    booking: {
      enabled: true,
      caption: "Votre confirmation de réservation"
    },
    payment: {
      enabled: true,
      caption: "Votre reçu de paiement"
    },
    reminder: {
      enabled: true,
      caption: "Rappel de votre rendez-vous"
    }
  },
  
  recipients: {
    client: {
      enabled: true,
      messageTypes: ["quote_request", "booking", "payment", "reminder"]
    },
    salesTeam: {
      enabled: true,
      messageTypes: ["quote_request", "booking", "payment", "cancellation"]
    },
    accounting: {
      enabled: true,
      messageTypes: ["payment", "cancellation"]
    },
    professionals: {
      enabled: true,
      messageTypes: ["booking", "cancellation"]
    },
    notifications: {
      enabled: true,
      messageTypes: ["quote_request", "booking", "payment", "cancellation", "reminder"]
    },
    providers: {
      enabled: true,
      messageTypes: ["booking", "cancellation"]
    }
  }
};

export function WhatsAppConfig({ recipientsConfig }: WhatsAppConfigProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState('general');

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getWhatsAppConfig();
      setConfig({
        ...data,
        recipients: {
          client: {
            enabled: recipientsConfig.clientConfig.enabled,
            messageTypes: recipientsConfig.clientConfig.messageTypes
          },
          salesTeam: {
            enabled: recipientsConfig.internalTeams.salesTeam.config.enabled,
            messageTypes: recipientsConfig.internalTeams.salesTeam.config.messageTypes
          },
          accounting: {
            enabled: recipientsConfig.internalTeams.accounting.config.enabled,
            messageTypes: recipientsConfig.internalTeams.accounting.config.messageTypes
          },
          professionals: {
            enabled: recipientsConfig.internalTeams.professionals.config.enabled,
            messageTypes: recipientsConfig.internalTeams.professionals.config.messageTypes
          },
          notifications: {
            enabled: recipientsConfig.internalTeams.notifications.config.enabled,
            messageTypes: recipientsConfig.internalTeams.notifications.config.messageTypes
          },
          providers: {
            enabled: true,
            messageTypes: ['booking', 'cancellation']
          }
        }
      });
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration WhatsApp:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration WhatsApp",
        variant: "destructive",
      });
      setConfig(initialConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleNumberChange = (name: string, value: string) => {
    const numberValue = parseInt(value, 10)
    setConfig(prev => ({
      ...prev,
      [name]: isNaN(numberValue) ? 0 : numberValue
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const result = await api.updateWhatsAppConfig(config);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        });
      } else {
        throw new Error(result.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = async (templateName: keyof WhatsAppConfig['templates'], value: string) => {
    try {
      const template = {
        name: templateName,
        content: value
      };

      const result = await api.patchWhatsAppConfig('updateTemplate', { template });
      
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          templates: {
            ...prev.templates,
            [templateName]: value
          }
        }));

        toast({
          title: "Succès",
          description: "Template mis à jour avec succès",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du template:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour du template",
        variant: "destructive",
      });
    }
  };

  const handleSessionConfigUpdate = async (updates: Partial<Pick<WhatsAppConfig, 'sessionTimeout' | 'sessionAutoReply' | 'outOfSessionMessage'>>) => {
    try {
      const result = await api.patchWhatsAppConfig('updateSessionConfig', { session: updates });
      
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          ...updates
        }));

        toast({
          title: "Succès",
          description: "Configuration des sessions mise à jour",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la configuration des sessions:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const handleAnalyticsConfigUpdate = async (updates: Partial<Pick<WhatsAppConfig, 'trackMessageMetrics' | 'trackUserEngagement' | 'generateReports' | 'reportFrequency'>>) => {
    try {
      const result = await api.patchWhatsAppConfig('updateAnalyticsConfig', { analytics: updates });
      
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          ...updates
        }));

        toast({
          title: "Succès",
          description: "Configuration des analytiques mise à jour",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la configuration des analytiques:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const testWhatsAppConnection = async () => {
    try {
      const credentials = {
        apiKey: config.apiKey,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId
      };

      const result = await api.patchWhatsAppConfig('testConnection', { credentials });
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Connexion WhatsApp testée avec succès",
        });
      } else {
        throw new Error(result.message || "Échec du test de connexion WhatsApp");
      }
    } catch (error) {
      console.error("Erreur lors du test de la connexion WhatsApp:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du test de la connexion",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const tabs: TabConfig[] = [
    {
      id: 'general',
      label: 'Configuration Générale',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      description: 'Paramètres de connexion',
      component: () => (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700">Clé API WhatsApp</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  value={config.apiKey}
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••••••••••"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="phoneNumberId" className="text-sm font-medium text-gray-700">ID du numéro de téléphone</Label>
                <Input
                  id="phoneNumberId"
                  name="phoneNumberId"
                  value={config.phoneNumberId}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="businessAccountId" className="text-sm font-medium text-gray-700">ID du compte business</Label>
                <Input
                  id="businessAccountId"
                  name="businessAccountId"
                  value={config.businessAccountId}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="webhookVerifyToken" className="text-sm font-medium text-gray-700">Token de vérification Webhook</Label>
                <Input
                  id="webhookVerifyToken"
                  name="webhookVerifyToken"
                  value={config.webhookVerifyToken}
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••••••••••"
                  className="mt-1.5"
                />
              </div>
            </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              onClick={testWhatsAppConnection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Tester la connexion WhatsApp
            </Button>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5" />
              Vos informations d'identification sont stockées de manière sécurisée et chiffrée.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      description: 'Gestion des modèles de messages',
      component: () => (
        <div className="space-y-6">
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Variables disponibles :
              <code className="px-2 py-1 bg-white rounded text-xs font-mono">
                {"{clientName}"}, {"{reference}"}, {"{date}"}
              </code>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(config.templates).map(([type, content]) => (
              <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <Label htmlFor={`templates.${type}`} className="text-sm font-medium text-gray-700 mb-2 block">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Label>
                <Textarea 
                  id={`templates.${type}`} 
                  value={content} 
                  onChange={(e) => handleTemplateChange(type as keyof WhatsAppConfig['templates'], e.target.value)}
                  className="font-mono text-xs h-36 mt-1.5"
                />
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <ClockIcon className="h-5 w-5" />,
      description: 'Configuration des sessions de discussion',
      component: () => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-50 p-2 rounded-lg">
                <ClockIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Paramètres de session</h3>
                <p className="text-sm text-gray-500">Configurez la durée et les messages automatiques</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="sessionTimeout" className="text-sm font-medium text-gray-700">
                  Durée de session (heures)
                </Label>
                <Input
                  id="sessionTimeout"
                  name="sessionTimeout"
                  type="number"
                  value={config.sessionTimeout}
                  onChange={(e) => handleSessionConfigUpdate({ sessionTimeout: parseInt(e.target.value, 10) })}
                  min={1}
                  max={72}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="sessionAutoReply" className="text-sm font-medium text-gray-700">
                  Message de réponse automatique
                </Label>
                <Textarea
                  id="sessionAutoReply"
                  name="sessionAutoReply"
                  value={config.sessionAutoReply}
                  onChange={(e) => handleSessionConfigUpdate({ sessionAutoReply: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="outOfSessionMessage" className="text-sm font-medium text-gray-700">
                  Message de fin de session
                </Label>
                <Textarea
                  id="outOfSessionMessage"
                  name="outOfSessionMessage"
                  value={config.outOfSessionMessage}
                  onChange={(e) => handleSessionConfigUpdate({ outOfSessionMessage: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'limits',
      label: 'Limites',
      icon: <BoltIcon className="h-5 w-5" />,
      description: 'Gestion des limites et restrictions',
      component: () => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-50 p-2 rounded-lg">
                <BoltIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Limites de messages</h3>
                <p className="text-sm text-gray-500">Définissez les restrictions d'envoi de messages</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="maxMessagesPerDay" className="text-sm font-medium text-gray-700">
                  Messages maximum par jour
                </Label>
                <Input
                  id="maxMessagesPerDay"
                  name="maxMessagesPerDay"
                  type="number"
                  value={config.maxMessagesPerDay}
                  onChange={(e) => handleNumberChange('maxMessagesPerDay', e.target.value)}
                  min={1}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="maxMessagesPerSession" className="text-sm font-medium text-gray-700">
                  Messages maximum par session
                </Label>
                <Input
                  id="maxMessagesPerSession"
                  name="maxMessagesPerSession"
                  type="number"
                  value={config.maxMessagesPerSession}
                  onChange={(e) => handleNumberChange('maxMessagesPerSession', e.target.value)}
                  min={1}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="cooldownPeriod" className="text-sm font-medium text-gray-700">
                  Période de refroidissement (secondes)
                </Label>
                <Input
                  id="cooldownPeriod"
                  name="cooldownPeriod"
                  type="number"
                  value={config.cooldownPeriod}
                  onChange={(e) => handleNumberChange('cooldownPeriod', e.target.value)}
                  min={0}
                  className="mt-1.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Temps minimum entre deux messages
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      label: 'Analytiques',
      icon: <ChartBarIcon className="h-5 w-5" />,
      description: 'Suivi et rapports d\'utilisation',
      component: () => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-50 p-2 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Configuration des analytiques</h3>
                <p className="text-sm text-gray-500">Paramètres de suivi et de reporting</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-gray-700">Suivi des métriques de messages</Label>
                  <p className="text-xs text-gray-500">Collecter des statistiques sur les messages envoyés/reçus</p>
                </div>
                <Switch
                  checked={config.trackMessageMetrics}
                  onCheckedChange={(checked) => handleAnalyticsConfigUpdate({ trackMessageMetrics: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-gray-700">Suivi de l'engagement utilisateur</Label>
                  <p className="text-xs text-gray-500">Analyser les interactions et le comportement des utilisateurs</p>
                </div>
                <Switch
                  checked={config.trackUserEngagement}
                  onCheckedChange={(checked) => handleAnalyticsConfigUpdate({ trackUserEngagement: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-gray-700">Génération de rapports</Label>
                  <p className="text-xs text-gray-500">Créer des rapports automatiques</p>
                </div>
                <Switch
                  checked={config.generateReports}
                  onCheckedChange={(checked) => handleAnalyticsConfigUpdate({ generateReports: checked })}
                />
              </div>
              
              <div className="mt-4">
                <Label htmlFor="reportFrequency" className="text-sm font-medium text-gray-700">
                  Fréquence des rapports
                </Label>
                <Select
                  value={config.reportFrequency}
                  onValueChange={(value) => handleAnalyticsConfigUpdate({ reportFrequency: value as 'daily' | 'weekly' | 'monthly' })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Sélectionner une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      description: 'Configuration des documents envoyés via WhatsApp',
      component: () => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-50 p-2 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Documents PDF</h3>
                <p className="text-sm text-gray-500">Configurez les documents envoyés via WhatsApp</p>
              </div>
            </div>

            <div className="space-y-4">
              {(Object.entries(config.documents) as [DocumentType, DocumentConfig][]).map(([type, settings]) => (
                <div key={type} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-700">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Label>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            [type]: {
                              ...prev.documents[type],
                              enabled: checked
                            }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="mt-2">
                    <Label htmlFor={`${type}-caption`} className="text-xs text-gray-600">
                      Légende du document
                    </Label>
                    <Input
                      id={`${type}-caption`}
                      value={settings.caption}
                      onChange={(e) => 
                        setConfig(prev => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            [type]: {
                              ...prev.documents[type],
                              caption: e.target.value
                            }
                          }
                        }))
                      }
                      className="mt-1"
                      placeholder="Entrez une légende..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-2 text-green-600">
          <ArrowPathIcon className="h-10 w-10 animate-spin" />
          <p className="text-green-900 font-medium">Chargement de la configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full border-0 shadow-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-1 bg-gray-100/80 p-1.5 rounded-lg mb-2 md:mb-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex-1 md:flex-initial flex items-center gap-1.5 px-2.5 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm transition-all duration-200 min-w-[100px] max-w-[150px] justify-center"
                >
                  <div className="w-4 h-4 flex-shrink-0">
                    {tab.icon}
                  </div>
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2 bg-gradient-to-r from-green-50 to-transparent p-3 rounded-lg">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      {tab.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tab.label}</h3>
                      <p className="text-sm text-gray-500">{tab.description}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  {tab.component()}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button type="button" onClick={() => loadConfig()} variant="outline">
              Réinitialiser
            </Button>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? (
                <>
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : 'Enregistrer les paramètres'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 