"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Types pour les destinataires
export type RecipientType = 'client' | 'salesTeam' | 'accounting' | 'professionals' | 'notifications' | 'providers' | 'operations' | 'subcontractors';
export type MessageType = 'quote_request' | 'booking' | 'payment' | 'cancellation' | 'reminder';
export type NotificationChannel = 'email' | 'whatsapp' | 'both';
export type ProfessionalType = 'MOVING' | 'STORAGE' | 'CLEANING' | 'PACKING' | 'INSURANCE';

export interface RecipientConfig {
  enabled: boolean;
  messageTypes: MessageType[];
  channels: NotificationChannel[];
  email?: string;
  phone?: string;
}

export interface ExternalProvider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  channels: NotificationChannel[];
  messageTypes: MessageType[];
}

export interface Professional {
  id: string;
  companyName: string;
  businessType: ProfessionalType;
  email: string;
  phone: string;
  city?: string;
  verified: boolean;
  config: RecipientConfig;
}

export interface RecipientsConfigData {
  internalTeams: {
    [K in Exclude<RecipientType, 'client' | 'providers' | 'subcontractors'>]: {
      emails: string[];
      phones?: string[];
      config: RecipientConfig;
    };
  };
  externalProviders: ExternalProvider[];
  professionals: Professional[];
  clientConfig: RecipientConfig;
}

// Type pour les équipes internes
type InternalTeamType = 'salesTeam' | 'accounting' | 'professionals' | 'notifications' | 'operations';

// Mapping pour les noms des équipes
const teamMapping: Record<InternalTeamType, string> = {
  'salesTeam': 'Équipe commerciale',
  'accounting': 'Comptabilité',
  'professionals': 'Équipe terrain',
  'notifications': 'Notifications générales',
  'operations': 'Responsable d\'exploitation'
};

// Mapping pour les types de messages
const messageTypeMapping: Record<MessageType, string> = {
  'quote_request': 'Demande de devis',
  'booking': 'Confirmation de réservation',
  'payment': 'Confirmation de paiement',
  'cancellation': 'Notification d\'annulation',
  'reminder': 'Rappel de rendez-vous'
};

// Mapping pour les types de professionnels
const professionalTypeMapping: Record<ProfessionalType, string> = {
  'MOVING': 'Déménagement',
  'STORAGE': 'Stockage',
  'CLEANING': 'Nettoyage',
  'PACKING': 'Emballage',
  'INSURANCE': 'Assurance'
};

interface RecipientsConfigProps {
  config: RecipientsConfigData;
  onConfigChange: (newConfig: RecipientsConfigData) => void;
}

const recipientTabs = {
  internal: {
    icon: UsersIcon,
    color: "blue" as const,
    label: "Équipes Internes",
    description: "Configuration des équipes internes"
  },
  external: {
    icon: BuildingOfficeIcon,
    color: "green" as const,
    label: "Prestataires Externes",
    description: "Gestion des prestataires externes"
  },
  professionals: {
    icon: WrenchScrewdriverIcon,
    color: "orange" as const,
    label: "Professionnels",
    description: "Gestion des professionnels sous-traitants"
  }
};

// Ajout des fonctions de gestion des API
const loadRecipientsConfig = async (): Promise<RecipientsConfigData> => {
  try {
    const response = await fetch('/api/admin/recipients-config');
    if (!response.ok) {
      throw new Error('Failed to load recipients configuration');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading recipients config:', error);
    throw error;
  }
};

const updateInternalTeam = async (teamType: InternalTeamType, config: RecipientConfig) => {
  try {
    const response = await fetch('/api/admin/recipients-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateInternalTeam',
        teamType,
        config,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update internal team configuration');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating internal team:', error);
    throw error;
  }
};

const updateExternalProvider = async (provider: ExternalProvider) => {
  try {
    const response = await fetch('/api/admin/recipients-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateExternalProvider',
        provider,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update external provider');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating external provider:', error);
    throw error;
  }
};

const updateProfessional = async (professional: Professional) => {
  try {
    const response = await fetch('/api/admin/recipients-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateProfessional',
        professional,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update professional');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating professional:', error);
    throw error;
  }
};

const deleteExternalProvider = async (providerId: string) => {
  try {
    const response = await fetch('/api/admin/recipients-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteExternalProvider',
        providerId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete external provider');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting external provider:', error);
    throw error;
  }
};

const deleteProfessional = async (professionalId: string) => {
  try {
    const response = await fetch('/api/admin/recipients-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteProfessional',
        professionalId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete professional');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting professional:', error);
    throw error;
  }
};

export function RecipientsConfig() {
  const [config, setConfig] = useState<RecipientsConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<InternalTeamType>('salesTeam');
  const [editingProvider, setEditingProvider] = useState<ExternalProvider | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfessionalModalOpen, setIsProfessionalModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('internal');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const data = await loadRecipientsConfig();
        setConfig(data);
        setError(null);
      } catch (err) {
        setError('Failed to load recipients configuration');
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleConfigChange = (newConfig: RecipientsConfigData) => {
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">
          {error || 'Configuration not available'}
        </div>
      </div>
    );
  }

  // Vérification que l'équipe sélectionnée existe dans la configuration
  if (!config.internalTeams[selectedTeam]) {
    setSelectedTeam('salesTeam');
    return <div>Chargement des équipes...</div>;
  }

  // Vérification de sécurité pour les professionnels
  if (!config.professionals) {
    config.professionals = [];
  }

  // Mise à jour des gestionnaires d'événements existants
  const handleTeamEmailsChange = async (team: InternalTeamType, value: string) => {
    try {
      const emails = value.split(/[,;\s]+/).map(email => email.trim()).filter(email => email.length > 0);
      
      const newConfig = {
        ...config,
        internalTeams: {
          ...config.internalTeams,
          [team]: {
            ...config.internalTeams[team],
            emails
          }
        }
      };
      
      await updateInternalTeam(team, config.internalTeams[team].config);
      handleConfigChange(newConfig);
    } catch (error) {
      // Gérer l'erreur (par exemple, afficher un toast d'erreur)
      console.error('Error updating team emails:', error);
    }
  };

  const handleTeamPhonesChange = async (team: InternalTeamType, value: string) => {
    try {
      const phones = value.split(/[,;\s]+/).map(phone => phone.trim()).filter(phone => phone.length > 0);
      
      const newConfig = {
        ...config,
        internalTeams: {
          ...config.internalTeams,
          [team]: {
            ...config.internalTeams[team],
            phones
          }
        }
      };
      
      await updateInternalTeam(team, config.internalTeams[team].config);
      handleConfigChange(newConfig);
    } catch (error) {
      console.error('Error updating team phones:', error);
    }
  };

  const handleMessageTypeChange = async (team: InternalTeamType, messageType: MessageType, checked: boolean) => {
    try {
      const newConfig = {
        ...config,
        internalTeams: {
          ...config.internalTeams,
          [team]: {
            ...config.internalTeams[team],
            config: {
              ...config.internalTeams[team].config,
              messageTypes: checked
                ? [...config.internalTeams[team].config.messageTypes, messageType]
                : config.internalTeams[team].config.messageTypes.filter(t => t !== messageType)
            }
          }
        }
      };
      
      await updateInternalTeam(team, newConfig.internalTeams[team].config);
      handleConfigChange(newConfig);
    } catch (error) {
      console.error('Error updating message types:', error);
    }
  };

  const handleChannelChange = async (team: InternalTeamType, channel: NotificationChannel, checked: boolean) => {
    try {
      const newConfig = {
        ...config,
        internalTeams: {
          ...config.internalTeams,
          [team]: {
            ...config.internalTeams[team],
            config: {
              ...config.internalTeams[team].config,
              channels: checked
                ? [...config.internalTeams[team].config.channels, channel]
                : config.internalTeams[team].config.channels.filter(c => c !== channel)
            }
          }
        }
      };
      
      await updateInternalTeam(team, newConfig.internalTeams[team].config);
      handleConfigChange(newConfig);
    } catch (error) {
      console.error('Error updating channels:', error);
    }
  };

  const handleProviderAdd = () => {
    const newProvider: ExternalProvider = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      category: 'default',
      channels: ['email'],
      messageTypes: ['booking']
    };
    setEditingProvider(newProvider);
    setIsModalOpen(true);
  };

  const handleProviderEdit = (provider: ExternalProvider) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const handleProviderSave = async () => {
    if (!editingProvider) return;

    try {
      const existingIndex = config.externalProviders.findIndex(p => p.id === editingProvider.id);
      let newProviders;

      if (existingIndex >= 0) {
        await updateExternalProvider(editingProvider);
        newProviders = [...config.externalProviders];
        newProviders[existingIndex] = editingProvider;
      } else {
        const savedProvider = await updateExternalProvider(editingProvider);
        newProviders = [...config.externalProviders, savedProvider];
      }

      handleConfigChange({
        ...config,
        externalProviders: newProviders
      });

      setIsModalOpen(false);
      setEditingProvider(null);
    } catch (error) {
      console.error('Error saving provider:', error);
    }
  };

  const handleProviderDelete = async (providerId: string) => {
    try {
      await deleteExternalProvider(providerId);
      handleConfigChange({
        ...config,
        externalProviders: config.externalProviders.filter(p => p.id !== providerId)
      });
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  const handleProfessionalAdd = () => {
    const newProfessional: Professional = {
      id: Date.now().toString(),
      companyName: '',
      businessType: 'MOVING',
      email: '',
      phone: '',
      verified: false,
      config: {
        enabled: true,
        messageTypes: ['booking'],
        channels: ['email']
      }
    };
    setEditingProfessional(newProfessional);
    setIsProfessionalModalOpen(true);
  };

  const handleProfessionalEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setIsProfessionalModalOpen(true);
  };

  const handleProfessionalSave = async () => {
    if (!editingProfessional) return;

    try {
      const existingIndex = config.professionals.findIndex(p => p.id === editingProfessional.id);
      let newProfessionals;

      if (existingIndex >= 0) {
        await updateProfessional(editingProfessional);
        newProfessionals = [...config.professionals];
        newProfessionals[existingIndex] = editingProfessional;
      } else {
        const savedProfessional = await updateProfessional(editingProfessional);
        newProfessionals = [...config.professionals, savedProfessional];
      }

      handleConfigChange({
        ...config,
        professionals: newProfessionals
      });

      setIsProfessionalModalOpen(false);
      setEditingProfessional(null);
    } catch (error) {
      console.error('Error saving professional:', error);
    }
  };

  const handleProfessionalDelete = async (professionalId: string) => {
    try {
      await deleteProfessional(professionalId);
      handleConfigChange({
        ...config,
        professionals: config.professionals.filter(p => p.id !== professionalId)
      });
    } catch (error) {
      console.error('Error deleting professional:', error);
    }
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex gap-1.5 bg-gray-100/80 p-1.5 rounded-lg shadow-sm mb-6">
          {Object.entries(recipientTabs).map(([key, tab]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <tab.icon className={`h-4 w-4 ${key === 'internal' ? 'text-blue-500' : key === 'external' ? 'text-green-500' : 'text-orange-500'}`} />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="internal" className="mt-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Équipes Internes</h2>
                <p className="text-sm text-gray-500">Configuration des notifications par équipe</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Sélection de l'équipe</h3>
                <Select value={selectedTeam} onValueChange={(value) => setSelectedTeam(value as InternalTeamType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(teamMapping).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Coordonnées</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium uppercase text-gray-600">Adresses email</Label>
                    <Textarea
                      value={config.internalTeams[selectedTeam].emails.join('; ')}
                      onChange={(e) => handleTeamEmailsChange(selectedTeam, e.target.value)}
                      placeholder="email1@example.com; email2@example.com"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium uppercase text-gray-600">Numéros WhatsApp</Label>
                    <Textarea
                      value={config.internalTeams[selectedTeam].phones?.join('; ') || ''}
                      onChange={(e) => handleTeamPhonesChange(selectedTeam, e.target.value)}
                      placeholder="+33612345678; +33687654321"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Types de messages reçus</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(messageTypeMapping).map(([type, label]) => (
                      <div key={type} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <Checkbox
                          checked={config.internalTeams[selectedTeam].config.messageTypes.includes(type as MessageType)}
                          onCheckedChange={(checked) => handleMessageTypeChange(selectedTeam, type as MessageType, checked === true)}
                        />
                        <Label>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Canaux de notification</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={config.internalTeams[selectedTeam].config.channels.includes('email')}
                        onCheckedChange={(checked) => handleChannelChange(selectedTeam, 'email', checked === true)}
                      />
                      <Label>Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={config.internalTeams[selectedTeam].config.channels.includes('whatsapp')}
                        onCheckedChange={(checked) => handleChannelChange(selectedTeam, 'whatsapp', checked === true)}
                      />
                      <Label>WhatsApp</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="external" className="mt-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2 rounded-lg">
                  <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">Prestataires Externes</h3>
                  <p className="text-sm text-gray-500">Gestion des prestataires</p>
                </div>
              </div>
              <Button
                onClick={handleProviderAdd}
                variant="outline"
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter un prestataire
              </Button>
            </div>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Canaux</TableHead>
                    <TableHead>Types de messages</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.externalProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>{provider.name}</TableCell>
                      <TableCell>{provider.email}</TableCell>
                      <TableCell>{provider.phone || '-'}</TableCell>
                      <TableCell>
                        {provider.category === 'default' ? 'Général' :
                         provider.category === 'transport' ? 'Transport' :
                         provider.category === 'storage' ? 'Stockage' :
                         provider.category === 'packing' ? 'Emballage' :
                         provider.category === 'cleaning' ? 'Nettoyage' :
                         provider.category === 'insurance' ? 'Assurance' : provider.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {provider.channels.includes('email') && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">Email</span>
                          )}
                          {provider.channels.includes('whatsapp') && (
                            <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full">WhatsApp</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {provider.messageTypes.map(type => (
                            <span key={type} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                              {messageTypeMapping[type]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleProviderEdit(provider)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleProviderDelete(provider.id)}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="professionals" className="mt-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-lg">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">Professionnels Sous-traitants</h3>
                  <p className="text-sm text-gray-500">Configuration des notifications pour les professionnels</p>
                </div>
              </div>
              <Button
                onClick={handleProfessionalAdd}
                variant="outline"
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter un professionnel
              </Button>
            </div>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Société</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Types de messages</TableHead>
                    <TableHead>Canaux</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.professionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell>{professional.companyName}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded-full">
                          {professionalTypeMapping[professional.businessType]}
                        </span>
                      </TableCell>
                      <TableCell>{professional.email}</TableCell>
                      <TableCell>{professional.phone}</TableCell>
                      <TableCell>{professional.city || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 ${professional.verified ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'} text-xs rounded-full`}>
                          {professional.verified ? 'Vérifié' : 'En attente'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {professional.config.messageTypes.map(type => (
                            <span key={type} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                              {messageTypeMapping[type]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {professional.config.channels.includes('email') && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">Email</span>
                          )}
                          {professional.config.channels.includes('whatsapp') && (
                            <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full">WhatsApp</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleProfessionalEdit(professional)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleProfessionalDelete(professional.id)}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modales existantes */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[600px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProvider?.id ? 'Modifier le prestataire' : 'Nouveau prestataire'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={editingProvider?.name || ''}
                    onChange={(e) => setEditingProvider(prev => prev ? {...prev, name: e.target.value} : null)}
                    placeholder="Nom du prestataire"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editingProvider?.email || ''}
                    onChange={(e) => setEditingProvider(prev => prev ? {...prev, email: e.target.value} : null)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone WhatsApp</Label>
                  <Input
                    value={editingProvider?.phone || ''}
                    onChange={(e) => setEditingProvider(prev => prev ? {...prev, phone: e.target.value} : null)}
                    placeholder="+33612345678"
                  />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select
                    value={editingProvider?.category || 'default'}
                    onValueChange={(value) => setEditingProvider(prev => prev ? {...prev, category: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Général</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="storage">Stockage</SelectItem>
                      <SelectItem value="packing">Emballage</SelectItem>
                      <SelectItem value="cleaning">Nettoyage</SelectItem>
                      <SelectItem value="insurance">Assurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Types de messages reçus</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(messageTypeMapping).map(([type, label]) => (
                    <div key={type} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <Checkbox
                        checked={editingProvider?.messageTypes.includes(type as MessageType)}
                        onCheckedChange={(checked) => {
                          if (!editingProvider) return;
                          const messageTypes: MessageType[] = checked
                            ? [...editingProvider.messageTypes, type as MessageType]
                            : editingProvider.messageTypes.filter(t => t !== type);
                          setEditingProvider({...editingProvider, messageTypes});
                        }}
                      />
                      <Label>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Canaux de notification</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={editingProvider?.channels.includes('email')}
                      onCheckedChange={(checked) => {
                        if (!editingProvider) return;
                        const channels: NotificationChannel[] = checked
                          ? [...editingProvider.channels, 'email']
                          : editingProvider.channels.filter(c => c !== 'email');
                        setEditingProvider({...editingProvider, channels});
                      }}
                    />
                    <Label>Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={editingProvider?.channels.includes('whatsapp')}
                      onCheckedChange={(checked) => {
                        if (!editingProvider) return;
                        const channels: NotificationChannel[] = checked
                          ? [...editingProvider.channels, 'whatsapp']
                          : editingProvider.channels.filter(c => c !== 'whatsapp');
                        setEditingProvider({...editingProvider, channels});
                      }}
                    />
                    <Label>WhatsApp</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleProviderSave}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {isProfessionalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[600px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProfessional?.id ? 'Modifier le professionnel' : 'Nouveau professionnel'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfessionalModalOpen(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6">
              {/* Informations du professionnel */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Informations du professionnel</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nom de la société</Label>
                      <Input
                        value={editingProfessional?.companyName || ''}
                        onChange={(e) => setEditingProfessional(prev => prev ? {...prev, companyName: e.target.value} : null)}
                        placeholder="Nom de la société"
                      />
                    </div>
                    <div>
                      <Label>Type d'activité</Label>
                      <Select
                        value={editingProfessional?.businessType || 'MOVING'}
                        onValueChange={(value) => setEditingProfessional(prev => prev ? {...prev, businessType: value as ProfessionalType} : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(professionalTypeMapping).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editingProfessional?.email || ''}
                        onChange={(e) => setEditingProfessional(prev => prev ? {...prev, email: e.target.value} : null)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        type="tel"
                        value={editingProfessional?.phone || ''}
                        onChange={(e) => setEditingProfessional(prev => prev ? {...prev, phone: e.target.value} : null)}
                        placeholder="+33612345678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ville</Label>
                      <Input
                        value={editingProfessional?.city || ''}
                        onChange={(e) => setEditingProfessional(prev => prev ? {...prev, city: e.target.value} : null)}
                        placeholder="Paris"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        checked={editingProfessional?.verified || false}
                        onCheckedChange={(checked) => setEditingProfessional(prev => prev ? {...prev, verified: checked === true} : null)}
                      />
                      <Label>Professionnel vérifié</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration des notifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Configuration des notifications</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Types de messages reçus</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(messageTypeMapping).map(([type, label]) => (
                        <div key={type} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <Checkbox
                            checked={editingProfessional?.config.messageTypes.includes(type as MessageType)}
                            onCheckedChange={(checked) => {
                              if (!editingProfessional) return;
                              const messageTypes: MessageType[] = checked
                                ? [...editingProfessional.config.messageTypes, type as MessageType]
                                : editingProfessional.config.messageTypes.filter(t => t !== type);
                              setEditingProfessional({
                                ...editingProfessional,
                                config: { ...editingProfessional.config, messageTypes }
                              });
                            }}
                          />
                          <Label>{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Canaux de notification</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={editingProfessional?.config.channels.includes('email')}
                          onCheckedChange={(checked) => {
                            if (!editingProfessional) return;
                            const channels: NotificationChannel[] = checked
                              ? [...editingProfessional.config.channels, 'email']
                              : editingProfessional.config.channels.filter(c => c !== 'email');
                            setEditingProfessional({
                              ...editingProfessional,
                              config: { ...editingProfessional.config, channels }
                            });
                          }}
                        />
                        <Label>Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={editingProfessional?.config.channels.includes('whatsapp')}
                          onCheckedChange={(checked) => {
                            if (!editingProfessional) return;
                            const channels: NotificationChannel[] = checked
                              ? [...editingProfessional.config.channels, 'whatsapp']
                              : editingProfessional.config.channels.filter(c => c !== 'whatsapp');
                            setEditingProfessional({
                              ...editingProfessional,
                              config: { ...editingProfessional.config, channels }
                            });
                          }}
                        />
                        <Label>WhatsApp</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsProfessionalModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleProfessionalSave}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 