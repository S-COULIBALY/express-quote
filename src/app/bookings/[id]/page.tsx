'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BookingItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  workers: number;
  duration: number;
  type: 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON';
  features: string[];
  includes: string[];
  status: string;
  template?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  status: string;
  type: string;
  totalPrice: number;
  scheduledDate: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: BookingItem[];
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement de la réservation');
        }
        const data = await response.json();
        setBooking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'annule':
        return 'bg-red-100 text-red-800';
      case 'completed':
      case 'termine':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEMENAGEMENT':
        return 'bg-blue-100 text-blue-800';
      case 'MENAGE':
        return 'bg-green-100 text-green-800';
      case 'TRANSPORT':
        return 'bg-yellow-100 text-yellow-800';
      case 'LIVRAISON':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-48 mb-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="mt-8">
            <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p className="mt-2 text-gray-600">{error}</p>
            <Button onClick={() => router.push('/bookings')} className="mt-4">
              Retour aux réservations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Réservation non trouvée</h1>
            <p className="mt-2 text-gray-600">Cette réservation n'existe pas ou a été supprimée.</p>
            <Button onClick={() => router.push('/bookings')} className="mt-4">
              Retour aux réservations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/bookings')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Retour aux réservations</span>
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Réservation #{booking.id.slice(-8)}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
                <Badge variant="outline">
                  {booking.type}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(booking.totalPrice)}
              </div>
              <div className="text-sm text-gray-600">
                Total TTC
              </div>
            </div>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Informations client</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{booking.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{booking.customer.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations de planification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Planification</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Date prévue</p>
                  <p className="font-medium">
                    {booking.scheduledDate 
                      ? formatDate(booking.scheduledDate)
                      : 'À définir'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Créé le</p>
                  <p className="font-medium">{formatDate(booking.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items/Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services réservés</CardTitle>
            <CardDescription>
              Détail des services inclus dans cette réservation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {booking.items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(item.price)}
                      </div>
                      <Badge className={getTypeColor(item.type)}>
                        {item.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {item.workers} travailleur{item.workers > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {item.duration} min
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Statut: {item.status}
                      </span>
                    </div>
                  </div>

                  {item.features.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Caractéristiques
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.includes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Inclus
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.includes.map((include) => (
                          <div key={include} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{include}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.template && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Basé sur le template:</span> {item.template.name}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 