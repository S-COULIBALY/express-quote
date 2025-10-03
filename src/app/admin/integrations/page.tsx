'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Mail, 
  MessageSquare, 
  Phone,
  FileText,
  Settings,
  TestTube2,
  Database,
  Clock,
  Workflow,
  TrendingUp,
  AlertCircle,
  Zap,
  Download
} from 'lucide-react';

interface ServiceStatus {
  overall: 'healthy' | 'warning' | 'error';
  details: {
    [key: string]: {
      status: 'healthy' | 'warning' | 'error';
      enabled: boolean;
      provider: string;
      lastTest: string;
      issues?: string[];
      metrics: {
        [key: string]: any;
      };
      features: {
        [key: string]: { enabled: boolean; working: boolean };
      };
    };
  };
}

interface GlobalStats {
  totalServices: number;
  healthyServices: number;
  warningServices: number;
  errorServices: number;
  uptime: string;
  lastIncident: string | null;
  metrics: {
    notifications: {
      total24h: number;
      successful24h: number;
      failed24h: number;
      successRate: number;
    };
    documents: {
      total24h: number;
      successful24h: number;
      failed24h: number;
      successRate: number;
    };
    automation: {
      total24h: number;
      successful24h: number;
      failed24h: number;
      successRate: number;
    };
  };
}

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  service: string;
  title: string;
  description: string;
  action: string;
}

interface IntegrationStatus {
  success: boolean;
  timestamp: string;
  globalStatus: 'healthy' | 'warning' | 'error';
  globalStats: GlobalStats;
  services: {
    notifications: ServiceStatus;
    documents: ServiceStatus;
    automation: ServiceStatus;
    database: ServiceStatus;
  };
  recommendations: Recommendation[];
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Charger le statut des intégrations
  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/automation/status');
      const data = await response.json();
      setStatus(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement du statut:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tester un service
  const testService = async (service: string, feature: string) => {
    setTesting(`${service}.${feature}`);
    try {
      const response = await fetch('/api/automation/status/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, feature })
      });
      const result = await response.json();
      
      if (result.success) {
        // Recharger le statut après le test
        await loadStatus();
      }
    } catch (error) {
      console.error('Erreur lors du test:', error);
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    loadStatus();
    
    // Actualiser automatiquement toutes les 30 secondes
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Chargement des intégrations...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          <XCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="mb-4">Impossible de charger le statut des intégrations</p>
          <Button onClick={loadStatus}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intégrations & Automatisations</h1>
          <p className="text-gray-600 mt-2">
            Gestion et surveillance des services automatisés
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatus}
            disabled={loading}
          >
            {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            Actualiser
          </Button>
          <span className="text-sm text-gray-500">
            Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Statut global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(status.globalStatus)}
            <span>Statut Global</span>
            <Badge className={getStatusColor(status.globalStatus)}>
              {status.globalStatus === 'healthy' ? 'Opérationnel' : 
               status.globalStatus === 'warning' ? 'Attention' : 'Erreur'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {status.globalStats.healthyServices}
              </div>
              <div className="text-sm text-gray-600">Services opérationnels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {status.globalStats.warningServices}
              </div>
              <div className="text-sm text-gray-600">Alertes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {status.globalStats.errorServices}
              </div>
              <div className="text-sm text-gray-600">Erreurs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {status.globalStats.uptime}
              </div>
              <div className="text-sm text-gray-600">Disponibilité</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total 24h</span>
                <span className="font-semibold">{status.globalStats.metrics.notifications.total24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Réussies</span>
                <span className="font-semibold text-green-600">
                  {status.globalStats.metrics.notifications.successful24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Échecs</span>
                <span className="font-semibold text-red-600">
                  {status.globalStats.metrics.notifications.failed24h}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux de réussite</span>
                  <span>{status.globalStats.metrics.notifications.successRate}%</span>
                </div>
                <Progress value={status.globalStats.metrics.notifications.successRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <span>Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total 24h</span>
                <span className="font-semibold">{status.globalStats.metrics.documents.total24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Réussies</span>
                <span className="font-semibold text-green-600">
                  {status.globalStats.metrics.documents.successful24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Échecs</span>
                <span className="font-semibold text-red-600">
                  {status.globalStats.metrics.documents.failed24h}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux de réussite</span>
                  <span>{status.globalStats.metrics.documents.successRate}%</span>
                </div>
                <Progress value={status.globalStats.metrics.documents.successRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Automatisations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total 24h</span>
                <span className="font-semibold">{status.globalStats.metrics.automation.total24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Réussies</span>
                <span className="font-semibold text-green-600">
                  {status.globalStats.metrics.automation.successful24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Échecs</span>
                <span className="font-semibold text-red-600">
                  {status.globalStats.metrics.automation.failed24h}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux de réussite</span>
                  <span>{status.globalStats.metrics.automation.successRate}%</span>
                </div>
                <Progress value={status.globalStats.metrics.automation.successRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services de notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <span>Services de Notifications</span>
            {getStatusIcon(status.services.notifications.overall)}
          </CardTitle>
          <CardDescription>
            Gestion des notifications automatiques par email, SMS et WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.services.notifications.details.email.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testService('notifications', 'email')}
                    disabled={testing === 'notifications.email'}
                  >
                    {testing === 'notifications.email' ? (
                      <Activity className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseur</span>
                  <span>{status.services.notifications.details.email.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envoyés 24h</span>
                  <span>{status.services.notifications.details.email.metrics.sent24h}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de livraison</span>
                  <span>{status.services.notifications.details.email.metrics.deliveryRate}%</span>
                </div>
              </div>
              {status.services.notifications.details.email.issues && status.services.notifications.details.email.issues.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                  {status.services.notifications.details.email.issues.map((issue, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SMS */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">SMS</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.services.notifications.details.sms.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testService('notifications', 'sms')}
                    disabled={testing === 'notifications.sms'}
                  >
                    {testing === 'notifications.sms' ? (
                      <Activity className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseur</span>
                  <span>{status.services.notifications.details.sms.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envoyés 24h</span>
                  <span>{status.services.notifications.details.sms.metrics.sent24h}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de livraison</span>
                  <span>{status.services.notifications.details.sms.metrics.deliveryRate}%</span>
                </div>
              </div>
              {status.services.notifications.details.sms.issues && status.services.notifications.details.sms.issues.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                  {status.services.notifications.details.sms.issues.map((issue, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">WhatsApp</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.services.notifications.details.whatsapp.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testService('notifications', 'whatsapp')}
                    disabled={testing === 'notifications.whatsapp'}
                  >
                    {testing === 'notifications.whatsapp' ? (
                      <Activity className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseur</span>
                  <span>{status.services.notifications.details.whatsapp.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envoyés 24h</span>
                  <span>{status.services.notifications.details.whatsapp.metrics.sent24h}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de livraison</span>
                  <span>{status.services.notifications.details.whatsapp.metrics.deliveryRate}%</span>
                </div>
              </div>
              {status.services.notifications.details.whatsapp.issues && status.services.notifications.details.whatsapp.issues.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                  {status.services.notifications.details.whatsapp.issues.map((issue, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services de documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <span>Services de Documents</span>
            {getStatusIcon(status.services.documents.overall)}
          </CardTitle>
          <CardDescription>
            Génération automatique de documents PDF (confirmations, factures, contrats)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Génération PDF */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Génération PDF</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.services.documents.details.pdf.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testService('documents', 'pdf')}
                    disabled={testing === 'documents.pdf'}
                  >
                    {testing === 'documents.pdf' ? (
                      <Activity className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseur</span>
                  <span>{status.services.documents.details.pdf.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Générés 24h</span>
                  <span>{status.services.documents.details.pdf.metrics.generated24h}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de réussite</span>
                  <span>{status.services.documents.details.pdf.metrics.successRate}%</span>
                </div>
              </div>
            </div>

            {/* Stockage */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Stockage</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.services.documents.details.storage.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testService('documents', 'storage')}
                    disabled={testing === 'documents.storage'}
                  >
                    {testing === 'documents.storage' ? (
                      <Activity className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseur</span>
                  <span>{status.services.documents.details.storage.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Documents</span>
                  <span>{status.services.documents.details.storage.metrics.totalDocuments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taille totale</span>
                  <span>{status.services.documents.details.storage.metrics.totalSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Espace libre</span>
                  <span>{status.services.documents.details.storage.metrics.freeSpace}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services d'automatisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <span>Services d'Automatisation</span>
            {getStatusIcon(status.services.automation.overall)}
          </CardTitle>
          <CardDescription>
            Planification et exécution automatisée des tâches et workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Planificateur */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Planificateur</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.services.automation.details.scheduler.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testService('automation', 'scheduler')}
                    disabled={testing === 'automation.scheduler'}
                  >
                    {testing === 'automation.scheduler' ? (
                      <Activity className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseur</span>
                  <span>{status.services.automation.details.scheduler.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tâches 24h</span>
                  <span>{status.services.automation.details.scheduler.metrics.tasksScheduled24h}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de réussite</span>
                  <span>{status.services.automation.details.scheduler.metrics.successRate}%</span>
                </div>
              </div>
            </div>

            {/* Workflows */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Workflow className="h-4 w-4" />
                  <span className="font-medium">Workflows</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.services.automation.details.workflows.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testService('automation', 'workflows')}
                    disabled={testing === 'automation.workflows'}
                  >
                    {testing === 'automation.workflows' ? (
                      <Activity className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseur</span>
                  <span>{status.services.automation.details.workflows.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Workflows 24h</span>
                  <span>{status.services.automation.details.workflows.metrics.workflowsExecuted24h}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de réussite</span>
                  <span>{status.services.automation.details.workflows.metrics.successRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base de données */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-green-500" />
            <span>Base de Données</span>
            {getStatusIcon(status.services.database.overall)}
          </CardTitle>
          <CardDescription>
            Statut de la base de données et performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Fournisseur</span>
                <span>{status.services.database.details.connection.provider}</span>
              </div>
              <div className="flex justify-between">
                <span>Temps de réponse</span>
                <span>{status.services.database.details.connection.metrics.avgResponseTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Connexions actives</span>
                <span>{status.services.database.details.connection.metrics.connectionsActive}</span>
              </div>
              <div className="flex justify-between">
                <span>Disponibilité</span>
                <span>{status.services.database.details.connection.metrics.uptimeHours}h</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Requêtes/sec</span>
                <span>{status.services.database.details.performance.metrics.queriesPerSecond}</span>
              </div>
              <div className="flex justify-between">
                <span>Requêtes lentes 24h</span>
                <span>{status.services.database.details.performance.metrics.slowQueries24h}</span>
              </div>
              <div className="flex justify-between">
                <span>Taux de cache</span>
                <span>{status.services.database.details.performance.metrics.cacheHitRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Taux d'index</span>
                <span>{status.services.database.details.performance.metrics.indexHitRate}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      {status.recommendations && status.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>Recommandations</span>
            </CardTitle>
            <CardDescription>
              Suggestions d'amélioration pour optimiser les performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{rec.title}</span>
                    </div>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority === 'high' ? 'Haute' : 
                       rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <div className="text-sm">
                    <span className="font-medium">Action recommandée:</span> {rec.action}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 