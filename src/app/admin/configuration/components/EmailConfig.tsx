"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowPathIcon, 
  EnvelopeIcon,
  DocumentTextIcon,
  BellIcon,
  ClockIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  QueueListIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline"
import { Switch } from "@/components/ui/switch"
import { RecipientsConfig, RecipientsConfigData } from './RecipientsConfig'

// Types
interface DocumentConfig {
  enabled: boolean;
  filename: string;
  subject: string;
}

type DocumentType = 'quote' | 'booking' | 'payment' | 'reminder';

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  emailFrom: string;
  salesTeamEmails: string[];
  accountingEmails: string[];
  professionalsEmails: string[];
  notificationsEmails: string[];
  externalProviders: Array<{
    id: string;
    name: string;
    email: string;
    category: string;
  }>;
  emailTypes: {
    [key: string]: {
      internal: string[];
      external: string[];
      includeClient: boolean;
    }
  };
  reminderDays: number[];
  templates: {
    [key: string]: string;
  };
  documents: {
    [K in DocumentType]: DocumentConfig;
  };
}

// Mock des données initiales
const initialConfig: EmailConfig = {
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'user@example.com',
  smtpPassword: '********',
  emailFrom: 'noreply@express-quote.com',
  
  salesTeamEmails: ['commercial@express-quote.com'],
  accountingEmails: ['comptabilite@express-quote.com'],
  professionalsEmails: ['demenageurs@express-quote.com'],
  notificationsEmails: ['notifications@express-quote.com'],
  
  externalProviders: [],
  
  emailTypes: {
    quoteRequest: {
      internal: ['salesTeam'],
      external: [],
      includeClient: true,
    },
    quoteConfirmation: {
      internal: ['salesTeam', 'accounting'],
      external: [],
      includeClient: true,
    },
    bookingConfirmation: {
      internal: ['salesTeam', 'professionals'],
      external: [],
      includeClient: true,
    },
    paymentConfirmation: {
      internal: ['salesTeam', 'accounting'],
      external: [],
      includeClient: true,
    },
    cancellationNotification: {
      internal: ['salesTeam', 'professionals', 'accounting'],
      external: [],
      includeClient: true,
    },
    appointmentReminder: {
      internal: ['professionals'],
      external: [],
      includeClient: true,
    }
  },
  
  reminderDays: [7, 3, 1],
  
  templates: {
    quoteConfirmation: '<div>Template de confirmation de devis</div>',
    bookingConfirmation: '<div>Template de confirmation de réservation</div>',
    paymentConfirmation: '<div>Template de confirmation de paiement</div>',
    appointmentReminder: '<div>Template de rappel de rendez-vous</div>',
    cancellationNotification: '<div>Template de notification d\'annulation</div>',
    paymentReceipt: '<div>Template de reçu de paiement</div>',
  },
  
  documents: {
    quote: {
      enabled: true,
      filename: "devis_{reference}.pdf",
      subject: "Votre devis Express Quote"
    },
    booking: {
      enabled: true,
      filename: "reservation_{reference}.pdf",
      subject: "Confirmation de votre réservation"
    },
    payment: {
      enabled: true,
      filename: "facture_{reference}.pdf",
      subject: "Reçu de paiement"
    },
    reminder: {
      enabled: true,
      filename: "rappel_{reference}.pdf",
      subject: "Rappel de votre rendez-vous"
    }
  }
};

// Mapping pour les noms des équipes
const teamMapping: Record<string, string> = {
  'salesTeam': 'Équipe commerciale',
  'accounting': 'Comptabilité',
  'professionals': 'Équipe terrain',
  'notifications': 'Notifications générales'
};

// Mapping pour les types d'emails
const emailTypeMapping: Record<string, string> = {
  'quoteRequest': 'Demande de devis',
  'quoteConfirmation': 'Confirmation de devis',
  'bookingConfirmation': 'Confirmation de réservation',
  'paymentConfirmation': 'Confirmation de paiement',
  'cancellationNotification': 'Notification d\'annulation',
  'appointmentReminder': 'Rappel de rendez-vous'
};

// API Functions
const api = {
  async getEmailConfig(): Promise<EmailConfig> {
    const response = await fetch('/api/admin/email-config', {
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

  async updateEmailConfig(config: EmailConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/admin/email-config', {
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

  async patchEmailConfig(operation: string, data: any): Promise<any> {
    const response = await fetch('/api/admin/email-config', {
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

// Fonction de chargement depuis l'API
const loadEmailConfig = async (): Promise<EmailConfig> => {
  try {
    const data = await api.getEmailConfig();
    return data as EmailConfig;
  } catch (error) {
    console.error("Erreur lors du chargement de la configuration:", error);
    // En cas d'erreur, retourner la configuration par défaut
    return initialConfig;
  }
};

// Fonction de sauvegarde complète via l'API
const saveEmailConfig = async (config: EmailConfig): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await api.updateEmailConfig(config);
    return { 
      success: result.success, 
      message: result.message || "Configuration des emails sauvegardée avec succès" 
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erreur inconnue lors de la sauvegarde" 
    };
  }
};

// Fonction pour ajouter un prestataire externe (utilise PATCH)
const addExternalProvider = async (provider: { name: string; email: string; category: string }): Promise<any> => {
  try {
    const addedProvider = await api.patchEmailConfig('addExternalProvider', { provider });
    return addedProvider;
  } catch (error) {
    console.error("Erreur lors de l'ajout du prestataire:", error);
    throw error;
  }
};

// Fonction pour mettre à jour un prestataire externe (utilise PATCH)
const updateExternalProvider = async (provider: { id: string; name: string; email: string; category: string, isActive?: boolean }): Promise<any> => {
  try {
    const updatedProvider = await api.patchEmailConfig('updateExternalProvider', { provider });
    return updatedProvider;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du prestataire:", error);
    throw error;
  }
};

// Fonction pour supprimer un prestataire externe (utilise PATCH)
const deleteExternalProvider = async (providerId: string): Promise<void> => {
  try {
    await api.patchEmailConfig('deleteExternalProvider', { providerId });
  } catch (error) {
    console.error("Erreur lors de la suppression du prestataire:", error);
    throw error;
  }
};

// Fonction pour mettre à jour un template (utilise PATCH)
const updateEmailTemplate = async (template: { type: string; subject: string; htmlContent: string; textContent: string }): Promise<any> => {
  try {
    const updatedTemplate = await api.patchEmailConfig('updateTemplate', { template });
    return updatedTemplate;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du template:", error);
    throw error;
  }
};

interface TabConfig {
  id: string;
  label: string;
  icon: JSX.Element;
  description: string;
  component: () => React.ReactNode;
}

// Fonction utilitaire pour vérifier si une chaîne est un DocumentType valide
function isDocumentType(type: string): type is DocumentType {
  return ['quote', 'booking', 'payment', 'reminder'].includes(type);
}

interface EmailConfigProps {
  recipientsConfig: RecipientsConfigData;
}

export function EmailConfig({ recipientsConfig }: EmailConfigProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<EmailConfig>(initialConfig)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadConfig()
  }, [])
  
  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await loadEmailConfig()
      setConfig({
        ...data,
        // Synchroniser les emails avec recipientsConfig
        salesTeamEmails: recipientsConfig.internalTeams.salesTeam.emails,
        accountingEmails: recipientsConfig.internalTeams.accounting.emails,
        professionalsEmails: recipientsConfig.internalTeams.professionals.emails,
        notificationsEmails: recipientsConfig.internalTeams.notifications.emails,
        externalProviders: recipientsConfig.externalProviders.map(provider => ({
          id: provider.id,
          name: provider.name,
          email: provider.email,
          category: provider.category
        }))
      })
      setLoading(false)
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration des emails:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration des emails",
        variant: "destructive",
      })
      setLoading(false)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [category, field] = name.split('.')
      setConfig(prev => {
        // Créer une copie profonde de la catégorie spécifique
        const categoryObject = JSON.parse(JSON.stringify(prev[category as keyof EmailConfig]));
        
        // Mettre à jour le champ si la catégorie est un objet
        if (typeof categoryObject === 'object' && categoryObject !== null) {
          // Utiliser type assertion pour informer TypeScript que nous modifions un objet
          (categoryObject as any)[field] = value;
        }
        
        return {
          ...prev,
          [category]: categoryObject
        };
      });
    } else {
      setConfig(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }
  
  const handleNumberChange = (name: string, value: string) => {
    const numberValue = parseInt(value, 10)
    setConfig(prev => ({
      ...prev,
      [name]: isNaN(numberValue) ? 0 : numberValue
    }))
  }
  
  const handleTeamEmailsChange = (team: keyof Pick<EmailConfig, 'salesTeamEmails' | 'accountingEmails' | 'professionalsEmails' | 'notificationsEmails'>, value: string) => {
    // Séparer les emails par virgules, points-virgules ou espaces, puis nettoyer
    const emails = value
      .split(/[,;\s]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    setConfig(prev => ({
      ...prev,
      [team]: emails
    }));
  }
  
  const handleCheckboxChange = (emailType: string, team: string, checked: boolean) => {
    setConfig(prev => {
      const currentTeams = [...prev.emailTypes[emailType].internal]
      const newTeams = checked 
        ? [...currentTeams, team]
        : currentTeams.filter(t => t !== team)
      
      return {
        ...prev,
        emailTypes: {
          ...prev.emailTypes,
          [emailType]: {
            ...prev.emailTypes[emailType],
            internal: newTeams
          }
        }
      }
    })
  }
  
  const handleIncludeClientChange = (emailType: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      emailTypes: {
        ...prev.emailTypes,
        [emailType]: {
          ...prev.emailTypes[emailType],
          includeClient: checked
        }
      }
    }))
  }
  
  const handleReminderDayChange = async (day: number, checked: boolean) => {
    try {
      const currentDays = [...config.reminderDays];
      const newDays = checked 
        ? [...currentDays, day].sort((a, b) => b - a)
        : currentDays.filter(d => d !== day);
      
      const result = await api.patchEmailConfig('updateReminderDays', { days: newDays });
      
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          reminderDays: newDays
        }));
        
        toast({
          title: "Succès",
          description: "Jours de rappel mis à jour",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des jours de rappel:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };
  
  const handleExternalProviderChange = (emailType: string, providerId: string, checked: boolean) => {
    setConfig(prev => {
      const currentProviders = [...prev.emailTypes[emailType].external];
      const newProviders = checked 
        ? [...currentProviders, providerId]
        : currentProviders.filter(id => id !== providerId);
      
      return {
        ...prev,
        emailTypes: {
          ...prev.emailTypes,
          [emailType]: {
            ...prev.emailTypes[emailType],
            external: newProviders
          }
        }
      }
    })
  }
  
  const handleExternalProviderAdd = async () => {
    try {
      const newProvider = {
        name: '',
        email: '',
        category: 'default'
      };
      
      const addedProvider = await addExternalProvider(newProvider);
      
      setConfig(prev => ({
        ...prev,
        externalProviders: [...prev.externalProviders, addedProvider]
      }));
      
      toast({
        title: "Succès",
        description: "Prestataire externe ajouté",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du prestataire:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'ajout du prestataire",
        variant: "destructive",
      });
    }
  };
  
  const handleExternalProviderUpdate = async (index: number, fieldName: string, value: string) => {
    try {
      const provider = {...config.externalProviders[index]};
      provider[fieldName as keyof typeof provider] = value;
      
      const updatedProvider = await updateExternalProvider(provider);
      
      const newProviders = [...config.externalProviders];
      newProviders[index] = updatedProvider;
      
      setConfig(prev => ({
        ...prev,
        externalProviders: newProviders
      }));
    } catch (error) {
      console.error("Erreur lors de la mise à jour du prestataire:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour du prestataire",
        variant: "destructive",
      });
    }
  };
  
  const handleExternalProviderDelete = async (providerId: string) => {
    try {
      await deleteExternalProvider(providerId);
      
      setConfig(prev => ({
        ...prev,
        externalProviders: prev.externalProviders.filter(p => p.id !== providerId)
      }));
      
      toast({
        title: "Succès",
        description: "Prestataire externe supprimé",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du prestataire:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression du prestataire",
        variant: "destructive",
      });
    }
  };
  
  const handleTemplateUpdate = async (type: string, htmlContent: string) => {
    try {
      // Générer un contenu texte à partir du HTML en supprimant les balises
      const textContent = htmlContent.replace(/<[^>]*>/g, '');
      
      await updateEmailTemplate({
        type,
        // Utiliser un sujet par défaut basé sur le type
        subject: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
        htmlContent,
        textContent
      });
      
      // Mettre à jour l'état local
      setConfig(prev => ({
        ...prev,
        templates: {
          ...prev.templates,
          [type]: htmlContent
        }
      }));
      
      toast({
        title: "Succès",
        description: "Template mis à jour",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du template:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour du template",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const result = await api.updateEmailConfig(config);
      
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
  
  const handleDocumentChange = async (type: string, field: keyof DocumentConfig, value: string) => {
    if (!isDocumentType(type)) {
      console.error(`Type de document invalide: ${type}`);
      return;
    }

    try {
      const documentConfig = {
        type,
        [field]: value,
        ...config.documents[type]
      };

      const result = await api.patchEmailConfig('updateDocumentConfig', { document: documentConfig });
      
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [type]: {
              ...prev.documents[type],
              [field]: value
            }
          }
        }));

        toast({
          title: "Succès",
          description: "Configuration du document mise à jour",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la configuration du document:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour de la configuration",
        variant: "destructive",
      });
    }
  };
  
  const testSmtpConnection = async () => {
    try {
      const smtpConfig = {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        password: config.smtpPassword,
        from: config.emailFrom
      };

      const result = await api.patchEmailConfig('testSmtpConnection', { smtpConfig });
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Connexion SMTP testée avec succès",
        });
      } else {
        throw new Error(result.message || "Échec du test de connexion SMTP");
      }
    } catch (error) {
      console.error("Erreur lors du test de la connexion SMTP:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du test de la connexion SMTP",
        variant: "destructive",
      });
    }
  };
  
  const tabs: TabConfig[] = [
    {
      id: 'general',
      label: 'Configuration Générale',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      description: 'Paramètres de connexion au serveur SMTP',
      component: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <Label htmlFor="smtpHost" className="text-sm font-medium text-gray-700">Serveur SMTP (Hôte)</Label>
              <Input 
                id="smtpHost" 
                name="smtpHost" 
                value={config.smtpHost} 
                onChange={handleChange} 
                placeholder="smtp.example.com"
                className="mt-1.5"
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <Label htmlFor="smtpPort" className="text-sm font-medium text-gray-700">Port SMTP</Label>
              <Input 
                id="smtpPort" 
                name="smtpPort" 
                value={config.smtpPort} 
                onChange={(e) => handleNumberChange('smtpPort', e.target.value)} 
                type="number"
                placeholder="25, 465, 587, etc."
                className="mt-1.5"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <Label htmlFor="smtpUser" className="text-sm font-medium text-gray-700">Nom d'utilisateur SMTP</Label>
              <Input 
                id="smtpUser" 
                name="smtpUser" 
                value={config.smtpUser} 
                onChange={handleChange} 
                placeholder="user@example.com"
                className="mt-1.5"
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <Label htmlFor="smtpPassword" className="text-sm font-medium text-gray-700">Mot de passe SMTP</Label>
              <Input 
                id="smtpPassword" 
                name="smtpPassword" 
                value={config.smtpPassword} 
                onChange={handleChange} 
                type="password"
                placeholder="********"
                className="mt-1.5"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <Label htmlFor="emailFrom" className="text-sm font-medium text-gray-700">Adresse d'expédition</Label>
            <Input 
              id="emailFrom" 
              name="emailFrom" 
              value={config.emailFrom} 
              onChange={handleChange} 
              placeholder="noreply@example.com"
              className="mt-1.5"
            />
            <p className="text-xs text-gray-500 mt-2">
              Cette adresse sera utilisée comme expéditeur pour tous les emails
            </p>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              type="button"
              onClick={testSmtpConnection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Tester la connexion SMTP
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'email-types',
      label: 'Types d\'Emails',
      icon: <QueueListIcon className="h-5 w-5" />,
      description: 'Configuration des destinataires par type d\'email',
      component: () => (
        <div className="space-y-6">
              {Object.entries(config.emailTypes).map(([type, settings]) => (
            <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                    {emailTypeMapping[type] || type}
                  </h3>
              </div>
                  
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`include-client-${type}`}
                        checked={settings.includeClient}
                        onCheckedChange={(checked) => 
                          handleIncludeClientChange(type, checked === true)
                        }
                      />
                    <Label htmlFor={`include-client-${type}`} className="font-medium">
                        Envoyer au client
                      </Label>
                    </div>
                  </div>
                  
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Équipes internes en copie :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(teamMapping).map(([teamKey, teamLabel]) => (
                      <div key={teamKey} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <Checkbox 
                            id={`${type}-${teamKey}`}
                            checked={settings.internal.includes(teamKey)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(type, teamKey, checked === true)
                            }
                          />
                          <Label htmlFor={`${type}-${teamKey}`}>
                            {teamLabel}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {config.externalProviders.length > 0 && (
                    <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Prestataires externes en copie :</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {config.externalProviders.map((provider) => (
                        <div key={provider.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            <Checkbox 
                              id={`${type}-external-${provider.id}`}
                              checked={settings.external.includes(provider.id)}
                              onCheckedChange={(checked) => 
                                handleExternalProviderChange(type, provider.id, checked === true)
                              }
                            />
                            <Label htmlFor={`${type}-external-${provider.id}`} className="flex items-center">
                            <span className="font-medium mr-1">{provider.name}</span>
                              <span className="text-xs text-gray-500">({provider.email})</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
                </div>
              ))}
              </div>
      )
    },
    {
      id: 'reminders',
      label: 'Rappels',
      icon: <BellIcon className="h-5 w-5" />,
      description: 'Configuration des rappels automatiques',
      component: () => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Jours d'envoi des rappels</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                Sélectionnez quand envoyer des rappels avant la date du rendez-vous
                </p>
            </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3, 5, 7, 14].map(day => (
                <div key={day} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Checkbox 
                        id={`reminder-day-${day}`}
                        checked={config.reminderDays.includes(day)}
                        onCheckedChange={(checked) => 
                          handleReminderDayChange(day, checked === true)
                        }
                      />
                  <Label htmlFor={`reminder-day-${day}`} className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{day === 1 ? 'La veille' : `${day} jours avant`}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              </div>
      )
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      description: 'Gestion des modèles d\'emails',
      component: () => (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
              Variables disponibles :
              <code className="px-2 py-1 bg-white rounded text-xs font-mono">
                  {"{clientName}"}, {"{reference}"}, {"{date}"}, {"{amount}"}
                </code>
              </p>
          </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(config.templates).map(([type, content]) => (
              <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <Label htmlFor={`templates.${type}`} className="text-sm font-medium text-gray-700 mb-2 block">
                  {emailTypeMapping[type] || type}
                  </Label>
                  <Textarea 
                  id={`templates.${type}`} 
                  value={content} 
                  onChange={(e) => handleTemplateUpdate(type, e.target.value)}
                  className="font-mono text-xs h-36 mt-1.5"
                  />
                </div>
            ))}
                </div>
                </div>
      )
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      description: 'Configuration des documents PDF envoyés par email',
      component: () => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-2 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Documents PDF</h3>
                <p className="text-sm text-gray-500">Configurez les documents envoyés par email</p>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(config.documents as Record<DocumentType, DocumentConfig>).map(([type, settings]) => (
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
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`${type}-filename`} className="text-xs text-gray-600">
                        Format du nom de fichier
                      </Label>
                      <Input
                        id={`${type}-filename`}
                        value={settings.filename}
                        onChange={(e) => handleDocumentChange(type, 'filename', e.target.value)}
                        className="mt-1"
                        placeholder="nom_{reference}.pdf"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Variables disponibles : {"{reference}"}, {"{date}"}, {"{type}"}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor={`${type}-subject`} className="text-xs text-gray-600">
                        Sujet de l'email
                      </Label>
                      <Input
                        id={`${type}-subject`}
                        value={settings.subject}
                        onChange={(e) => handleDocumentChange(type, 'subject', e.target.value)}
                        className="mt-1"
                        placeholder="Entrez le sujet de l'email..."
                      />
                    </div>
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
        <div className="flex flex-col items-center gap-2 text-blue-600">
          <ArrowPathIcon className="h-10 w-10 animate-spin" />
          <p className="text-blue-900 font-medium">Chargement de la configuration...</p>
                </div>
      </div>
    )
  }
                
  return (
    <Card className="w-full border-0 shadow-lg">
      <CardHeader className="pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle className="text-lg font-medium text-gray-900">Configuration des Emails</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Gérez tous les aspects de vos communications par email
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-1 bg-gray-100/80 p-1.5 rounded-lg mb-2 md:mb-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex-1 md:flex-initial flex items-center gap-1.5 px-2.5 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200 min-w-[100px] max-w-[150px] justify-center"
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
                  <div className="flex items-center gap-2 mb-2 bg-gradient-to-r from-blue-50 to-transparent p-3 rounded-lg">
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
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
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