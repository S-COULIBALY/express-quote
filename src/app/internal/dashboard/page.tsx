/**
 * Dashboard pour le staff interne (responsables métier)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardData {
  user: any;
  pendingMissions: any[];
  assignedMissions: any[];
  recentDocuments: any[];
  stats: any;
}

export default function InternalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();

    // NOUVEAU: Polling pour notifications équipe interne
    startInternalNotificationPolling();

    // Refresh général périodique
    const interval = setInterval(loadDashboardData, 120000); // 2 minutes
    return () => {
      clearInterval(interval);
      stopInternalNotificationPolling();
    };
  }, []);

  // État pour les notifications internes
  const [notificationPolling, setNotificationPolling] = useState<NodeJS.Timeout | null>(null);
  const [lastInternalCheck, setLastInternalCheck] = useState<string>(new Date().toISOString());
  const [notifications, setNotifications] = useState<any[]>([]);

  const startInternalNotificationPolling = () => {
    // Polling pour notifications équipe interne (nouvelles réservations, paiements)
    const interval = setInterval(pollInternalNotifications, 15000); // 15 secondes
    setNotificationPolling(interval);
  };

  const stopInternalNotificationPolling = () => {
    if (notificationPolling) {
      clearInterval(notificationPolling);
      setNotificationPolling(null);
    }
  };

  const pollInternalNotifications = async () => {
    try {
      const token = localStorage.getItem('professionalToken');
      if (!token) return;

      // Appeler l'API des notifications internes
      const response = await fetch(
        `/api/notifications/internal-staff/updates?lastCheck=${lastInternalCheck}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.updates?.length > 0) {
          // Traiter les nouvelles notifications
          handleInternalUpdates(result.updates);

          // Mettre à jour lastCheck
          setLastInternalCheck(result.lastPolled);
        }
      }
    } catch (error) {
      console.warn('Erreur polling notifications internes (non bloquant):', error);
    }
  };

  const handleInternalUpdates = (updates: any[]) => {
    updates.forEach(update => {
      switch (update.type) {
        case 'BOOKING_CONFIRMED':
          showInternalNotification(
            `📅 Nouvelle réservation confirmée`,
            `Réservation ${update.data.bookingReference} - ${update.data.serviceType}`,
            'success'
          );
          break;

        case 'PAYMENT_COMPLETED':
          showInternalNotification(
            `💰 Paiement reçu`,
            `${update.data.amount}€ pour réservation ${update.data.bookingReference}`,
            'success'
          );
          break;

        case 'ATTRIBUTION_COMPLETED':
          showInternalNotification(
            `🎯 Attribution réussie`,
            `Mission attribuée à ${update.data.professionalName}`,
            'info'
          );
          break;

        case 'DOCUMENT_GENERATED':
          showInternalNotification(
            `📄 Document généré`,
            `${update.data.documentType} prêt`,
            'info'
          );
          break;

        default:
          // Notification générale
          showInternalNotification(update.title || 'Notification', update.message || '', 'info');
      }
    });

    // Ajouter aux notifications locales
    setNotifications(prev => [...updates.slice(0, 5), ...prev].slice(0, 10));
  };

  const showInternalNotification = (title: string, message: string, type: string = 'info') => {
    // Toast notification pour équipe interne
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
      type === 'success' ? 'bg-green-600 border-green-500' :
      type === 'error' ? 'bg-red-600 border-red-500' :
      type === 'warning' ? 'bg-yellow-600 border-yellow-500' :
      'bg-blue-600 border-blue-500'
    } text-white border-l-4`;

    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <h4 class="font-medium">${title}</h4>
          <p class="text-sm opacity-90 mt-1">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white/80 hover:text-white">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 8000);
  };

  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('professionalToken');
      await fetch('/api/notifications/internal-staff/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNotifications([]);
    } catch (error) {
      console.warn('Erreur marquage notifications lues:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Récupérer le token JWT depuis le localStorage
      const token = localStorage.getItem('professionalToken');
      if (!token) {
        router.push('/professional/login');
        return;
      }

      const response = await fetch('/api/internal/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        if (response.status === 401) {
          router.push('/professional/login');
          return;
        }
        setError(result.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Supprimer le token du localStorage
      localStorage.removeItem('professionalToken');

      // Appel API logout (optionnel)
      await fetch('/api/professional/auth/logout', { method: 'POST' });

      router.push('/professional/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Même en cas d'erreur, supprimer le token et rediriger
      localStorage.removeItem('professionalToken');
      router.push('/professional/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/professional/login')}>
            Retour à la connexion
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { user, pendingMissions, assignedMissions, recentDocuments, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Responsable
              </h1>
              <p className="text-sm text-gray-600">
                {user.firstName} {user.lastName} • {user.role} • {user.department}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-sm"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Missions en Attente</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">À traiter</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Missions Assignées</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.assignedCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">En cours</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Documents Générés</h3>
            <p className="text-2xl font-bold text-green-600">{stats.documentsCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Ce mois</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Taux de Réussite</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.successRate || 0}%</p>
            <p className="text-xs text-gray-500 mt-1">Missions complétées</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Missions en Attente */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Missions en Attente</h3>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </div>
            
            {pendingMissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune mission en attente</p>
            ) : (
              <div className="space-y-4">
                {pendingMissions.slice(0, 5).map((mission: any) => (
                  <div key={mission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {mission.serviceType} • {mission.amount}€
                        </h4>
                        <p className="text-sm text-gray-600">
                          {mission.location} • {mission.date}
                        </p>
                        <p className="text-xs text-gray-500">
                          Référence: {mission.reference}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Voir
                        </Button>
                        <Button size="sm">
                          Assigner
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Missions Assignées */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Missions Assignées</h3>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </div>
            
            {assignedMissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune mission assignée</p>
            ) : (
              <div className="space-y-4">
                {assignedMissions.slice(0, 5).map((mission: any) => (
                  <div key={mission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {mission.serviceType} • {mission.amount}€
                        </h4>
                        <p className="text-sm text-gray-600">
                          {mission.professionalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Statut: {mission.status} • {mission.date}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Suivre
                        </Button>
                        <Button size="sm">
                          Contacter
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Documents Récents */}
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Documents Récents</h3>
            <Button variant="outline" size="sm">
              Gérer les documents
            </Button>
          </div>
          
          {recentDocuments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun document récent</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentDocuments.slice(0, 6).map((doc: any) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{doc.type}</h4>
                      <p className="text-xs text-gray-500">{doc.filename}</p>
                      <p className="text-xs text-gray-400">{doc.createdAt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}