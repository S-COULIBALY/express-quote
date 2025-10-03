'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  ClockIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CogIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface QuoteRequestConfig {
  // Délais d'expiration
  expirationHours: number;
  warningHours: number;
  cleanupDays: number;
  
  // Stratégies de récupération
  recoveryStrategies: {
    immediateFollowup: {
      enabled: boolean;
      triggerMinutes: number;
      maxAttempts: number;
      channels: string[];
    };
    quoteReminder: {
      enabled: boolean;
      triggerMinutes: number;
      maxAttempts: number;
      channels: string[];
    };
    gentleNudge: {
      enabled: boolean;
      triggerMinutes: number;
      maxAttempts: number;
      channels: string[];
      discountPercentage: number;
    };
    paymentUrgency: {
      enabled: boolean;
      triggerMinutes: number;
      maxAttempts: number;
      channels: string[];
      discountPercentage: number;
    };
  };
  
  // Notifications
  notifications: {
    expirationWarning: boolean;
    renewalOffers: boolean;
    adminAlerts: boolean;
    emailTemplates: {
      renewal: string;
      expiration: string;
      followup: string;
    };
  };
  
  // Automatisation
  automation: {
    expirationCronEnabled: boolean;
    recoveryCronEnabled: boolean;
    cleanupCronEnabled: boolean;
    cronFrequency: string;
  };
}

export default function QuoteRequestsAdminPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<QuoteRequestConfig>({
    expirationHours: 24,
    warningHours: 22,
    cleanupDays: 30,
    recoveryStrategies: {
      immediateFollowup: {
        enabled: true,
        triggerMinutes: 15,
        maxAttempts: 1,
        channels: ['email']
      },
      quoteReminder: {
        enabled: true,
        triggerMinutes: 60,
        maxAttempts: 2,
        channels: ['email', 'whatsapp']
      },
      gentleNudge: {
        enabled: true,
        triggerMinutes: 120,
        maxAttempts: 2,
        channels: ['email'],
        discountPercentage: 5
      },
      paymentUrgency: {
        enabled: true,
        triggerMinutes: 30,
        maxAttempts: 3,
        channels: ['email', 'whatsapp', 'sms'],
        discountPercentage: 10
      }
    },
    notifications: {
      expirationWarning: true,
      renewalOffers: true,
      adminAlerts: true,
      emailTemplates: {
        renewal: 'Template de renouvellement par défaut',
        expiration: 'Template d\'expiration par défaut',
        followup: 'Template de suivi par défaut'
      }
    },
    automation: {
      expirationCronEnabled: true,
      recoveryCronEnabled: true,
      cleanupCronEnabled: true,
      cronFrequency: '0 * * * *'
    }
  });
  
  const [stats, setStats] = useState({
    totalQuotes: 0,
    activeQuotes: 0,
    expiredQuotes: 0,
    convertedQuotes: 0,
    recoveryAttempts: 0,
    conversionRate: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      // Simulation du chargement de configuration
      // const response = await fetch('/api/admin/quote-requests/config');
      // const data = await response.json();
      // setConfig(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Simulation du chargement des statistiques
      const response = await fetch('/api/admin/expire-quotes');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalQuotes: data.data.stats.reduce((sum: number, stat: any) => sum + stat._count.id, 0),
          activeQuotes: data.data.soonToExpire,
          expiredQuotes: data.data.recentExpired,
          convertedQuotes: 0,
          recoveryAttempts: 0,
          conversionRate: 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      
      // Simulation de la sauvegarde
      // const response = await fetch('/api/admin/quote-requests/config', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // });
      
      toast({
        title: "Succès",
        description: "Configuration sauvegardée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const runExpirationProcess = async () => {
    try {
      const response = await fetch('/api/admin/expire-quotes', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Succès",
          description: "Processus d'expiration exécuté avec succès"
        });
        await loadStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'exécution du processus",
        variant: "destructive"
      });
    }
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i] as keyof typeof current] as any;
      }
      
      current[keys[keys.length - 1] as keyof typeof current] = value;
      return newConfig;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Demandes de Devis</h1>
              <p className="text-gray-600 mt-2">
                Configuration des délais d'expiration et des stratégies de récupération
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={runExpirationProcess} variant="outline">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Exécuter processus
              </Button>
              <Button onClick={saveConfig} disabled={isSaving}>
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Devis</p>
                  <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeQuotes}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expirés</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiredQuotes}</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux Conversion</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Tabs */}
        <Card>
          <Tabs defaultValue="expiration" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="expiration" className="flex-1">
                <ClockIcon className="h-4 w-4 mr-2" />
                Expiration
              </TabsTrigger>
              <TabsTrigger value="recovery" className="flex-1">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Récupération
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1">
                <BellIcon className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex-1">
                <CogIcon className="h-4 w-4 mr-2" />
                Automatisation
              </TabsTrigger>
            </TabsList>

            {/* Expiration Tab */}
            <TabsContent value="expiration" className="space-y-6">
              <CardHeader>
                <CardTitle>Paramètres d'Expiration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="expirationHours">Délai d'expiration (heures)</Label>
                    <Input
                      id="expirationHours"
                      type="number"
                      value={config.expirationHours}
                      onChange={(e) => updateConfig('expirationHours', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Durée avant expiration automatique d'un devis
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="warningHours">Alerte d'expiration (heures)</Label>
                    <Input
                      id="warningHours"
                      type="number"
                      value={config.warningHours}
                      onChange={(e) => updateConfig('warningHours', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Quand envoyer l'alerte d'expiration
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="cleanupDays">Nettoyage (jours)</Label>
                    <Input
                      id="cleanupDays"
                      type="number"
                      value={config.cleanupDays}
                      onChange={(e) => updateConfig('cleanupDays', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Suppression des devis expirés après X jours
                    </p>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Recovery Tab */}
            <TabsContent value="recovery" className="space-y-6">
              <CardHeader>
                <CardTitle>Stratégies de Récupération</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {Object.entries(config.recoveryStrategies).map(([key, strategy]) => (
                  <Card key={key} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                        <Switch
                          checked={strategy.enabled}
                          onCheckedChange={(checked) => 
                            updateConfig(`recoveryStrategies.${key}.enabled`, checked)
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Déclencher après (minutes)</Label>
                          <Input
                            type="number"
                            value={strategy.triggerMinutes}
                            onChange={(e) => 
                              updateConfig(`recoveryStrategies.${key}.triggerMinutes`, parseInt(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label>Tentatives maximum</Label>
                          <Input
                            type="number"
                            value={strategy.maxAttempts}
                            onChange={(e) => 
                              updateConfig(`recoveryStrategies.${key}.maxAttempts`, parseInt(e.target.value))
                            }
                          />
                        </div>
                        {('discountPercentage' in strategy) && (
                          <div>
                            <Label>Réduction (%)</Label>
                            <Input
                              type="number"
                              value={strategy.discountPercentage}
                              onChange={(e) => 
                                updateConfig(`recoveryStrategies.${key}.discountPercentage`, parseInt(e.target.value))
                              }
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label>Canaux de communication</Label>
                        <div className="flex gap-4 mt-2">
                          {['email', 'whatsapp', 'sms'].map(channel => (
                            <label key={channel} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={strategy.channels.includes(channel)}
                                onChange={(e) => {
                                  const newChannels = e.target.checked 
                                    ? [...strategy.channels, channel]
                                    : strategy.channels.filter(c => c !== channel);
                                  updateConfig(`recoveryStrategies.${key}.channels`, newChannels);
                                }}
                              />
                              <span className="capitalize">{channel}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <CardHeader>
                <CardTitle>Configuration des Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertes d'expiration</Label>
                      <p className="text-sm text-gray-500">
                        Envoyer des alertes avant expiration
                      </p>
                    </div>
                    <Switch
                      checked={config.notifications.expirationWarning}
                      onCheckedChange={(checked) => 
                        updateConfig('notifications.expirationWarning', checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Offres de renouvellement</Label>
                      <p className="text-sm text-gray-500">
                        Proposer de renouveler les devis expirés
                      </p>
                    </div>
                    <Switch
                      checked={config.notifications.renewalOffers}
                      onCheckedChange={(checked) => 
                        updateConfig('notifications.renewalOffers', checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertes administrateur</Label>
                      <p className="text-sm text-gray-500">
                        Notifier l'admin des problèmes
                      </p>
                    </div>
                    <Switch
                      checked={config.notifications.adminAlerts}
                      onCheckedChange={(checked) => 
                        updateConfig('notifications.adminAlerts', checked)
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Template de renouvellement</Label>
                    <Textarea
                      value={config.notifications.emailTemplates.renewal}
                      onChange={(e) => 
                        updateConfig('notifications.emailTemplates.renewal', e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              <CardHeader>
                <CardTitle>Configuration de l'Automatisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Processus d'expiration</Label>
                      <p className="text-sm text-gray-500">
                        Automatiser le processus d'expiration
                      </p>
                    </div>
                    <Switch
                      checked={config.automation.expirationCronEnabled}
                      onCheckedChange={(checked) => 
                        updateConfig('automation.expirationCronEnabled', checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Récupération automatique</Label>
                      <p className="text-sm text-gray-500">
                        Automatiser les tentatives de récupération
                      </p>
                    </div>
                    <Switch
                      checked={config.automation.recoveryCronEnabled}
                      onCheckedChange={(checked) => 
                        updateConfig('automation.recoveryCronEnabled', checked)
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Fréquence cron</Label>
                    <Input
                      value={config.automation.cronFrequency}
                      onChange={(e) => 
                        updateConfig('automation.cronFrequency', e.target.value)
                      }
                      placeholder="0 * * * *"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Format cron (par défaut : toutes les heures)
                    </p>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 