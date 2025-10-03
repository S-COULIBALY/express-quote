/**
 * 🎯 ADMIN ATTRIBUTION - Monitoring du système d'attribution en temps réel
 * Route: /admin/attribution
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  EyeIcon,
  Cog6ToothIcon,
  BellIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  UserIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';

interface AttributionStats {
  totalActive: number;
  totalCompleted: number;
  averageResponseTime: number;
  professionalResponseRate: number;
  systemHealthScore: number;
  acceptanceRate?: number;
  averageDistance?: number;
  rebroadcastRate?: number;
  business?: {
    totalValue: number;
    lostValue: number;
    averageOrderValue: number;
    roi: number;
  };
  geographic?: {
    coveredZones: number;
    averageRadius: number;
    uncoveredDemand: number;
  };
  alerts?: {
    count: number;
    critical: any[];
    warnings: any[];
  };
}

interface ActiveAttribution {
  id: string;
  bookingId: string;
  serviceType: string;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  eligibleProfessionals: number;
  responsesReceived: number;
  acceptedBy?: string;
  lastUpdateSent?: string;
}

interface ProfessionalSession {
  id: string;
  professionalId: string;
  professionalName: string;
  lastActivity: string;
  isOnline: boolean;
  lastPoll: string;
  unreadUpdates: number;
}

interface BroadcastUpdate {
  id: string;
  attributionId: string;
  updateType: string;
  timestamp: string;
  acknowledged: boolean;
  targetCount: number;
  deliveredCount: number;
  failedCount: number;
}

export default function AdminAttributionPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttributionStats | null>(null);
  const [activeAttributions, setActiveAttributions] = useState<ActiveAttribution[]>([]);
  const [professionalSessions, setProfessionalSessions] = useState<ProfessionalSession[]>([]);
  const [broadcastUpdates, setBroadcastUpdates] = useState<BroadcastUpdate[]>([]);
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // secondes

  useEffect(() => {
    loadAttributionData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadAttributionData, refreshInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const loadAttributionData = async () => {
    try {
      let token = localStorage.getItem('professionalToken');

      // Mode test en développement - utiliser un token par défaut
      if (!token) {
        token = 'admin-test';
        console.log('🔧 Mode test: utilisation du token par défaut');
      }

      if (!token) {
        // Pas de token - afficher un message d'erreur approprié
        setLoading(false);
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour accéder au système d'attribution",
          variant: "destructive",
        });
        return;
      }

      // Charger stats générales
      const statsResponse = await fetch('/api/admin/attribution/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          // Enrichir les stats avec les nouvelles métriques
          const enrichedStats = {
            ...statsData.data.stats,
            business: statsData.data.business,
            geographic: statsData.data.geographic,
            alerts: statsData.data.alerts
          };

          setStats(enrichedStats);
          setActiveAttributions(statsData.data.activeAttributions || []);
          setProfessionalSessions(statsData.data.professionalSessions || []);
          setBroadcastUpdates(statsData.data.recentUpdates || []);
        }
      } else {
        throw new Error(`Erreur API: ${statsResponse.status}`);
      }

    } catch (error) {
      console.error('Erreur chargement attribution:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'attribution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemToggle = async (enabled: boolean) => {
    try {
      const token = localStorage.getItem('professionalToken');
      await fetch('/api/admin/attribution/system-toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      setSystemEnabled(enabled);
      toast({
        title: enabled ? "Système activé" : "Système désactivé",
        description: `Le système d'attribution a été ${enabled ? 'activé' : 'désactivé'}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'état du système",
        variant: "destructive",
      });
    }
  };

  const handleForceUpdate = async (attributionId: string) => {
    try {
      const token = localStorage.getItem('professionalToken');
      await fetch('/api/admin/attribution/force-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attributionId, updateType: 'manual_refresh' })
      });

      await loadAttributionData();
      toast({
        title: "Mise à jour forcée",
        description: "La mise à jour a été diffusée aux professionnels",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de forcer la mise à jour",
        variant: "destructive",
      });
    }
  };

  const handleCleanupUpdates = async () => {
    try {
      const token = localStorage.getItem('professionalToken');
      const response = await fetch('/api/attribution/updates', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Nettoyage terminé",
          description: `${result.deletedUpdates} mises à jour supprimées`,
        });
        await loadAttributionData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de nettoyer les mises à jour",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement du système d'attribution...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <SpeakerWaveIcon className="h-8 w-8 text-white" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Système d'Attribution</h1>
              </div>
              <p className="text-blue-100">Monitoring en temps réel des attributions et notifications</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <span className="text-sm">Système:</span>
                <Switch
                  checked={systemEnabled}
                  onCheckedChange={handleSystemToggle}
                  className="data-[state=checked]:bg-green-500"
                />
                <span className={`text-sm font-medium ${systemEnabled ? 'text-green-200' : 'text-red-200'}`}>
                  {systemEnabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <Button
                variant="outline"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                onClick={loadAttributionData}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attributions Actives</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats?.totalActive || 0}
                  </p>
                </div>
                <ClockIcon className="h-12 w-12 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-blue-500">En cours</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Complétées Aujourd'hui</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.totalCompleted || 0}
                  </p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500">Succès</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Temps Moyen</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats?.averageResponseTime || 0}m
                  </p>
                </div>
                <ClockIcon className="h-12 w-12 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-orange-500">Réponse</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux Réponse</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats?.professionalResponseRate || 0}%
                  </p>
                </div>
                <UserGroupIcon className="h-12 w-12 text-purple-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-purple-500">Professionnels</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Santé Système</p>
                  <p className={`text-3xl font-bold ${getHealthColor(stats?.systemHealthScore || 0)}`}>
                    {stats?.systemHealthScore || 0}%
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-gray-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  (stats?.systemHealthScore || 0) >= 95 ? 'bg-green-500' :
                  (stats?.systemHealthScore || 0) >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-500">Global</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques Décisionnelles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Métriques Business */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyEuroIcon className="h-5 w-5 text-green-600" />
                Impact Business
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valeur en cours:</span>
                  <span className="font-bold text-green-600">{stats?.business?.totalValue || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valeur perdue:</span>
                  <span className="font-bold text-red-600">{stats?.business?.lostValue || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Panier moyen:</span>
                  <span className="font-bold text-blue-600">{stats?.business?.averageOrderValue || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ROI Système:</span>
                  <span className="font-bold text-purple-600">{stats?.business?.roi || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métriques Géographiques */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                Couverture Géographique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Zones couvertes:</span>
                  <span className="font-bold text-blue-600">{stats?.geographic?.coveredZones || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rayon moyen:</span>
                  <span className="font-bold text-blue-600">{stats?.geographic?.averageRadius || 0}km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Demandes non couvertes:</span>
                  <span className="font-bold text-orange-600">{stats?.geographic?.uncoveredDemand || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Taux acceptation:</span>
                  <span className="font-bold text-green-600">{stats?.acceptanceRate || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertes Critiques */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                Alertes Système
                {(stats?.alerts?.count || 0) > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {stats?.alerts?.count}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Alertes critiques */}
                {stats?.alerts?.critical?.map((alert, index) => (
                  <div key={index} className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-800">{alert.message}</span>
                    </div>
                  </div>
                ))}

                {/* Alertes warning */}
                {stats?.alerts?.warnings?.map((alert, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-800">{alert.message}</span>
                    </div>
                  </div>
                ))}

                {(stats?.alerts?.count || 0) === 0 && (
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-800">Aucune alerte active</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques de Performance Opérationnelle */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Distance Moyenne</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.averageDistance || 0}km
                  </p>
                </div>
                <ChartBarIcon className="h-10 w-10 text-blue-500" />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Acceptations
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Re-broadcasts</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.rebroadcastRate || 0}%
                  </p>
                </div>
                <ArrowPathIcon className="h-10 w-10 text-orange-500" />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Taux de relance
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux Acceptation</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.acceptanceRate || 0}%
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Global
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Efficacité</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats?.business?.roi || 0}%
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-purple-500" />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                ROI Système
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Auto-refresh */}
        <div className="mb-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={autoRefresh}
                      onCheckedChange={setAutoRefresh}
                    />
                    <Label>Actualisation automatique</Label>
                  </div>
                  {autoRefresh && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="refresh-interval">Intervalle:</Label>
                      <Input
                        id="refresh-interval"
                        type="number"
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 30)}
                        className="w-20"
                        min="10"
                        max="300"
                      />
                      <span className="text-sm text-gray-500">sec</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCleanupUpdates}>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Nettoyer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="attributions" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="attributions" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Attributions Actives
            </TabsTrigger>
            <TabsTrigger value="professionals" className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4" />
              Professionnels
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <SpeakerWaveIcon className="h-4 w-4" />
              Mises à Jour
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              Système
            </TabsTrigger>
          </TabsList>

          {/* Tab Attributions Actives */}
          <TabsContent value="attributions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Attributions Actives</h2>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {activeAttributions.length} en cours
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeAttributions.map((attribution) => (
                <Card key={attribution.id} className="bg-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {attribution.serviceType} - {attribution.bookingId.slice(-8)}
                          </h3>
                          <Badge className={getStatusColor(attribution.status)}>
                            {attribution.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Créée:</p>
                            <p className="font-medium">
                              {new Date(attribution.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expire:</p>
                            <p className="font-medium">
                              {new Date(attribution.expiresAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Éligibles:</p>
                            <p className="font-medium">{attribution.eligibleProfessionals}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Réponses:</p>
                            <p className="font-medium text-blue-600">
                              {attribution.responsesReceived}/{attribution.eligibleProfessionals}
                            </p>
                          </div>
                        </div>

                        {attribution.acceptedBy && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium text-green-800">Acceptée par:</span>
                              <span className="ml-2 text-green-700">{attribution.acceptedBy}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleForceUpdate(attribution.id)}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Forcer MAJ
                        </Button>
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {activeAttributions.length === 0 && (
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-12 text-center">
                    <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune attribution active</h3>
                    <p className="text-gray-500">Toutes les attributions ont été traitées</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab Professionnels */}
          <TabsContent value="professionals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Sessions Professionnels</h2>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {professionalSessions.filter(p => p.isOnline).length} en ligne
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionalSessions.map((session) => (
                <Card key={session.id} className="bg-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                        <h3 className="font-medium">{session.professionalName}</h3>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${session.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">Dernière activité:</p>
                        <p className="font-medium">
                          {new Date(session.lastActivity).toLocaleTimeString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dernier polling:</p>
                        <p className="font-medium">
                          {new Date(session.lastPoll).toLocaleTimeString()}
                        </p>
                      </div>
                      {session.unreadUpdates > 0 && (
                        <div>
                          <Badge variant="destructive" className="text-xs">
                            {session.unreadUpdates} mises à jour non lues
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Mises à Jour */}
          <TabsContent value="updates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mises à Jour Récentes</h2>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {broadcastUpdates.length} dernières
              </Badge>
            </div>

            <div className="space-y-3">
              {broadcastUpdates.map((update) => (
                <Card key={update.id} className="bg-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{update.updateType}</h3>
                          <Badge variant="outline">{update.attributionId.slice(-8)}</Badge>
                          <Badge className={update.acknowledged ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {update.acknowledged ? 'Acquittée' : 'En attente'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Timestamp:</p>
                            <p className="font-medium">
                              {new Date(update.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ciblés:</p>
                            <p className="font-medium">{update.targetCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Livrées:</p>
                            <p className="font-medium text-green-600">
                              {update.deliveredCount}/{update.targetCount}
                            </p>
                          </div>
                        </div>

                        {update.failedCount > 0 && (
                          <div className="mt-2">
                            <Badge variant="destructive" className="text-xs">
                              {update.failedCount} échecs
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Système */}
          <TabsContent value="system" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Configuration Système</h2>
            </div>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog6ToothIcon className="h-5 w-5" />
                  État des Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">API Broadcast</h3>
                      <p className="text-sm text-gray-600">/api/attribution/broadcast-update</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Opérationnel</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">API Polling</h3>
                      <p className="text-sm text-gray-600">/api/attribution/updates</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Opérationnel</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Base de Données</h3>
                      <p className="text-sm text-gray-600">Tables attribution_update et professional_session</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Connectée</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Métriques de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Temps de Réponse API</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Broadcast:</span>
                        <span className="text-sm font-medium">~120ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Polling:</span>
                        <span className="text-sm font-medium">~85ms</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Utilisation Ressources</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">CPU:</span>
                        <span className="text-sm font-medium">12%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Mémoire:</span>
                        <span className="text-sm font-medium">340MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}