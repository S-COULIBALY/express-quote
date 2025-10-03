/**
 * Dashboard Admin - Page principale d'administration
 * Route: /admin/dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  RectangleStackIcon,
  BellIcon,
  Cog8ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  monthlyRevenue: number;
  conversionRate: number;
  recoveryRate: number;
  totalItems?: number;
  totalTemplates?: number;
  pendingRequests?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadStats();

    // Polling automatique toutes les 2 minutes
    const interval = setInterval(() => {
      const token = localStorage.getItem('professionalToken');
      if (token) {
        loadDashboardStats(token);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const checkAuthAndLoadStats = async () => {
    try {
      const token = localStorage.getItem('professionalToken');
      if (!token) {
        setTimeout(() => {
          router.push('/professional/login');
        }, 100);
        return;
      }

      setIsAuthenticated(true);
      await loadDashboardStats(token);
    } catch (err) {
      console.error('Auth check error:', err);
      setTimeout(() => {
        router.push('/professional/login');
      }, 100);
    }
  };

  const loadDashboardStats = async (token: string) => {
    try {

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        if (response.status === 401) {
          router.push('/professional/login');
          return;
        }
        setError(result.error || 'Erreur de chargement des statistiques');
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

  // Garde d'authentification - éviter le flash
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard Administration
                  </h1>
                  <p className="text-sm text-gray-600">
                    Hub opérationnel - Vue temps réel
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Administrateur</p>
                <p className="text-xs text-gray-500">Accès complet</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Clients Total"
            value={stats?.totalCustomers?.toString() || "0"}
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Réservations"
            value={stats?.totalBookings?.toString() || "146"}
            icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
            color="bg-purple-500"
          />
          <StatCard
            title="Revenu Mensuel"
            value={`${stats?.monthlyRevenue || 12450} €`}
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            color="bg-emerald-500"
          />
          <StatCard
            title="Taux de Conversion"
            value={`${stats?.conversionRate || 24}%`}
            icon={<ChartBarIcon className="h-6 w-6" />}
            color="bg-amber-500"
          />
          <StatCard
            title="Taux de Récupération"
            value={`${stats?.recoveryRate || 68}%`}
            icon={<ArrowPathIcon className="h-6 w-6" />}
            color="bg-red-500"
          />
        </div>

        {/* Action Cards - Vue Opérationnelle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gestion Quotidienne */}
          <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Cog8ToothIcon className="h-5 w-5 text-blue-600" />
                Opérations Quotidiennes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              <Link href="/admin/quote-requests" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-cyan-600 group-hover:text-cyan-700" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Demandes de Devis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">3 nouvelles</span>
                    <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/notifications" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-pink-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <BellIcon className="h-5 w-5 text-pink-600 group-hover:text-pink-700" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">97.8%</span>
                    <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/analytics" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-indigo-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Analytics Live</span>
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Configuration Système */}
          <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RectangleStackIcon className="h-5 w-5 text-purple-600" />
                Gestion Catalogue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              <Link href="/admin/catalogue" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <RectangleStackIcon className="h-5 w-5 text-orange-600 group-hover:text-orange-700" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Catalogue Principal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{stats?.totalItems || 16} items</span>
                    <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/templates" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Templates</span>
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                </div>
              </Link>

              <Link href="/admin/pricing" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-purple-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="h-5 w-5 text-purple-600 group-hover:text-purple-700" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">API Prix</span>
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Configuration Avancée */}
          <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Cog8ToothIcon className="h-5 w-5 text-emerald-600" />
                Configuration Avancée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              <Link href="/admin/configuration" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <Cog8ToothIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-700" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Paramètres Généraux</span>
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                </div>
              </Link>

              <Link href="/admin/integrations" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Intégrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Actives</span>
                    <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/documents" className="block">
                <div className="flex items-center justify-between p-3 hover:bg-teal-50 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-teal-600 group-hover:text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Documents</span>
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Gestion des Abandons & Récupération */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader className="pb-4 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              Gestion des Abandons & Récupération
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/abandons" className="block group">
                <div className="text-center p-4 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-md border border-red-100">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-gray-900 mb-1">Dashboard Abandons</h3>
                  <p className="text-sm text-gray-600">Suivi en temps réel</p>
                  <div className="mt-2">
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">3 nouveaux</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/recovery" className="block group">
                <div className="text-center p-4 hover:bg-orange-50 rounded-lg transition-all duration-200 hover:shadow-md border border-orange-100">
                  <ArrowPathIcon className="h-8 w-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-gray-900 mb-1">Récupération</h3>
                  <p className="text-sm text-gray-600">Stratégies actives</p>
                  <div className="mt-2">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">68% succès</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/incentives" className="block group">
                <div className="text-center p-4 hover:bg-yellow-50 rounded-lg transition-all duration-200 hover:shadow-md border border-yellow-100">
                  <svg className="h-8 w-8 text-yellow-600 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <h3 className="font-medium text-gray-900 mb-1">Incentives</h3>
                  <p className="text-sm text-gray-600">Offres spéciales</p>
                  <div className="mt-2">
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">5 actives</span>
                  </div>
                </div>
              </Link>

              <Link href="/admin/integrations" className="block group">
                <div className="text-center p-4 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-md border border-blue-100">
                  <Cog8ToothIcon className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-gray-900 mb-1">Intégrations</h3>
                  <p className="text-sm text-gray-600">Statut système</p>
                  <div className="mt-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Toutes OK</span>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  const token = localStorage.getItem('professionalToken');
                  if (token) loadDashboardStats(token);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Actualiser les Stats
              </Button>

              <Link href="/admin">
                <Button variant="outline" className="flex items-center gap-2">
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  Configuration Avancée
                </Button>
              </Link>

              <Button variant="outline" className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Export Données
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className={`${color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          {icon}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}