/**
 * Dashboard pour les professionnels externes (prestataires)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardData {
  user: any;
  availableMissions: any[];
  myMissions: any[];
  missionHistory: any[];
  stats: any;
}

export default function ProfessionalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();

    // NOUVEAU: Polling spécialisé pour les mises à jour d'attribution
    startAttributionPolling();

    // Polling général pour les nouvelles missions (moins fréquent)
    const interval = setInterval(loadDashboardData, 60000); // 60 secondes
    return () => {
      clearInterval(interval);
      stopAttributionPolling();
    };
  }, []);

  // État pour le polling d'attribution
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastCheck, setLastCheck] = useState<string>(new Date().toISOString());

  const startAttributionPolling = () => {
    // Polling plus fréquent pour les mises à jour temps réel
    const interval = setInterval(pollAttributionUpdates, 10000); // 10 secondes
    setPollingInterval(interval);
  };

  const stopAttributionPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const pollAttributionUpdates = async () => {
    try {
      const token = localStorage.getItem('professionalToken');
      if (!token || !data?.user?.id) return;

      const response = await fetch(
        `/api/attribution/updates?professionalId=${data.user.id}&lastCheck=${lastCheck}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.totalUpdates > 0) {
          // Traiter les mises à jour
          handleAttributionUpdates(result.updates, result.notifications);

          // Mettre à jour lastCheck
          setLastCheck(result.lastPolled);
        }
      }
    } catch (error) {
      console.warn('Erreur polling attribution (non bloquant):', error);
    }
  };

  const handleAttributionUpdates = (updates: any[], notifications: any[]) => {
    let shouldReload = false;

    // Traiter les mises à jour d'attribution
    updates.forEach(update => {
      switch (update.type) {
        case 'attribution_taken':
          // Supprimer la mission de la liste
          removeMissionFromList(update.data.attributionId);
          showNotification(`Mission ${update.data.attributionId.slice(-8)} attribuée à un autre professionnel`);
          break;

        case 'attribution_expired':
          removeMissionFromList(update.data.attributionId);
          showNotification(`Mission ${update.data.attributionId.slice(-8)} expirée`);
          break;

        case 'attribution_cancelled':
          removeMissionFromList(update.data.attributionId);
          showNotification(`Mission ${update.data.attributionId.slice(-8)} annulée`);
          break;

        default:
          shouldReload = true;
      }
    });

    // Traiter les notifications directes
    notifications.forEach(notification => {
      showNotification(notification.message, notification.type);
    });

    // Recharger si nécessaire
    if (shouldReload) {
      loadDashboardData();
    }
  };

  const removeMissionFromList = (attributionId: string) => {
    if (data) {
      setData(prev => prev ? {
        ...prev,
        availableMissions: prev.availableMissions.filter(
          mission => mission.attributionId !== attributionId
        )
      } : null);
    }
  };

  const showNotification = (message: string, type: string = 'info') => {
    // Notification visuelle simple
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 5000);
  };

  const loadDashboardData = async () => {
    try {
      // Récupérer le token JWT depuis le localStorage
      const token = localStorage.getItem('professionalToken');
      if (!token) {
        router.push('/professional/login');
        return;
      }

      const response = await fetch('/api/professional/dashboard', {
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

  const handleAcceptMission = async (attributionId: string) => {
    try {
      const response = await fetch(`/api/attribution/${attributionId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          professionalId: data?.user.id,
          confirmAccept: true 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Recharger les données
        loadDashboardData();
        toast.success('Mission acceptée avec succès !');
      } else {
        toast.error(result.error || 'Erreur lors de l\'acceptation');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
      console.error('Accept error:', err);
    }
  };

  const handleRefuseMission = async (attributionId: string, reason: string = '') => {
    try {
      const response = await fetch(`/api/attribution/${attributionId}/refuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          professionalId: data?.user.id,
          reason 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        loadDashboardData();
        toast.success('Mission refusée');
      } else {
        toast.error(result.error || 'Erreur lors du refus');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
      console.error('Refuse error:', err);
    }
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !data?.user.isAvailable;
      
      const response = await fetch('/api/professional/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        setData(prev => prev ? {
          ...prev,
          user: { ...prev.user, isAvailable: newStatus }
        } : null);
      } else {
        toast.error(result.error || 'Erreur de mise à jour');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
      console.error('Availability error:', err);
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

  const { user, availableMissions, myMissions, missionHistory, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Professionnel
              </h1>
              <p className="text-sm text-gray-600">
                {user.companyName} • {user.city}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Statut de disponibilité */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Disponible :</span>
                <button
                  onClick={toggleAvailability}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    user.isAvailable ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      user.isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.companyName}</p>
                <p className="text-xs text-gray-500">{user.businessType}</p>
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
            <h3 className="text-sm font-medium text-gray-500">Missions Disponibles</h3>
            <p className="text-2xl font-bold text-blue-600">{availableMissions.length}</p>
            <p className="text-xs text-gray-500 mt-1">À votre portée</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Mes Missions</h3>
            <p className="text-2xl font-bold text-orange-600">{myMissions.length}</p>
            <p className="text-xs text-gray-500 mt-1">En cours</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Taux d'Acceptation</h3>
            <p className="text-2xl font-bold text-green-600">{stats.acceptanceRate || 0}%</p>
            <p className="text-xs text-gray-500 mt-1">Missions acceptées</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Revenus du Mois</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.monthlyEarnings || 0}€</p>
            <p className="text-xs text-gray-500 mt-1">Missions complétées</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Missions Disponibles */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                🎯 Missions Disponibles
                {!user.isAvailable && (
                  <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                    Indisponible
                  </span>
                )}
              </h3>
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
                🔄 Actualiser
              </Button>
            </div>
            
            {!user.isAvailable ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">Vous êtes marqué comme indisponible</p>
                <Button onClick={toggleAvailability} size="sm">
                  Me rendre disponible
                </Button>
              </div>
            ) : availableMissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune mission disponible actuellement</p>
            ) : (
              <div className="space-y-4">
                {availableMissions.map((mission: any) => (
                  <div key={mission.attributionId} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {mission.serviceType} • {mission.amount}€
                        </h4>
                        <p className="text-sm text-gray-600">
                          📍 {mission.location} • {mission.distanceKm}km
                        </p>
                        <p className="text-sm text-gray-600">
                          📅 {mission.scheduledDate}
                        </p>
                        <p className="text-xs text-gray-500">
                          Diffusée il y a {mission.timeAgo}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptMission(mission.attributionId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          ✅ Accepter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Raison du refus (optionnel):');
                            if (reason !== null) {
                              handleRefuseMission(mission.attributionId, reason);
                            }
                          }}
                        >
                          ❌ Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Mes Missions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mes Missions</h3>
              <Button variant="outline" size="sm">
                Voir historique
              </Button>
            </div>
            
            {myMissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune mission en cours</p>
            ) : (
              <div className="space-y-4">
                {myMissions.map((mission: any) => (
                  <div key={mission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {mission.serviceType} • {mission.amount}€
                        </h4>
                        <p className="text-sm text-gray-600">
                          📍 {mission.location}
                        </p>
                        <p className="text-sm text-gray-600">
                          👤 {mission.customerName} • 📞 {mission.customerPhone}
                        </p>
                        <p className="text-xs text-gray-500">
                          Statut: {mission.status} • Acceptée le {mission.acceptedAt}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          📞 Contacter
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          🚫 Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Historique Récent */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique Récent</h3>
          
          {missionHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun historique disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {missionHistory.slice(0, 10).map((mission: any) => (
                    <tr key={mission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mission.serviceType}</div>
                          <div className="text-sm text-gray-500">{mission.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mission.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mission.amount}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          mission.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {mission.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}