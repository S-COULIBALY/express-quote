'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon, DocumentTextIcon, CurrencyEuroIcon, TruckIcon, HomeIcon } from '@heroicons/react/24/outline';
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

interface QuoteRequest {
  id: string;
  temporaryId: string;
  type: string;
  status: string;
  quoteData: any; // Contient securedPrice, calculatedPrice, totalPrice, etc.
  createdAt: string;
  expiresAt: string;
}

interface Booking {
  id: string;
  status: string;
  type: string;
  totalPrice?: number;
  totalAmount?: number;
  depositAmount?: number;
  scheduledDate: string | null;
  createdAt: string;
  updatedAt?: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: BookingItem[];
  quoteRequest?: QuoteRequest | null;
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
        const responseData = await response.json();
        
        // Structure standardisée : { success: true, data: { id: ..., ... } }
        if (responseData.success && responseData.data && responseData.data.id) {
          setBooking(responseData.data);
        } else {
          throw new Error('Données de réservation invalides');
        }
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
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Si une heure est fournie dans timeString, l'utiliser
    // Sinon, extraire l'heure de la date
    let timeFormatted = '';
    if (timeString) {
      timeFormatted = timeString;
    } else {
      timeFormatted = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return { date: dateFormatted, time: timeFormatted };
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

  if (!booking || !booking.id) {
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
                Réservation #{booking.id.slice(-8).toUpperCase()}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={getStatusColor(booking.status || '')}>
                  {booking.status || 'N/A'}
                </Badge>
                <Badge variant="outline">
                  {booking.type || 'N/A'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(booking.totalAmount || booking.totalPrice || 0)}
              </div>
              <div className="text-sm text-gray-600">
                Total TTC
              </div>
              {booking.depositAmount && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Acompte payé: </span>
                  <span className="font-semibold text-green-600">{formatPrice(booking.depositAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bloc principal compact */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Informations principales en grille compacte */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b">
                {/* Client */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <p className="text-xs font-semibold text-gray-600 uppercase">Client</p>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{booking.customer.email}</p>
                  <p className="text-sm text-gray-600">{booking.customer.phone}</p>
                </div>

                {/* Planification */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <p className="text-xs font-semibold text-gray-600 uppercase">Date prévue</p>
                  </div>
                  {(() => {
                    // Chercher la date dans plusieurs sources possibles
                    const scheduledDate = booking.scheduledDate || 
                                         booking.quoteRequest?.quoteData?.scheduledDate ||
                                         booking.quoteRequest?.quoteData?.serviceDate ||
                                         booking.quoteRequest?.quoteData?.moveDate ||
                                         null;
                    
                    const timeString = booking.quoteRequest?.quoteData?.scheduledTime || 
                                      booking.quoteRequest?.quoteData?.serviceTime ||
                                      booking.quoteRequest?.quoteData?.horaire ||
                                      null;
                    
                    if (scheduledDate) {
                      return (
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(scheduledDate, timeString).date}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            <ClockIcon className="h-3 w-3 inline mr-1" />
                            {formatDateTime(scheduledDate, timeString).time}
                          </p>
                        </div>
                      );
                    }
                    return <p className="font-medium text-gray-400">À définir</p>;
                  })()}
                  <p className="text-xs text-gray-500 mt-2">Créé le {formatDate(booking.createdAt)}</p>
                </div>

                {/* Service */}
                {booking.quoteRequest && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-xs font-semibold text-gray-600 uppercase">Service</p>
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{booking.quoteRequest.type}</p>
                    <Badge className={getStatusColor(booking.quoteRequest.status)}>
                      {booking.quoteRequest.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Adresses */}
              {booking.quoteRequest?.quoteData && (
                <>
                  {booking.quoteRequest.quoteData.pickupAddress && (
                    <div className="pb-4 border-b">
                      <div className="flex items-center space-x-2 mb-3">
                        <MapPinIcon className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-semibold text-gray-900">Adresses</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-2 bg-blue-50 rounded text-sm">
                          <p className="text-xs text-gray-600 mb-1">Départ</p>
                          <p className="font-medium">{booking.quoteRequest.quoteData.pickupAddress}</p>
                          {(booking.quoteRequest.quoteData.pickupFloor || booking.quoteRequest.quoteData.pickupElevator !== undefined) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.quoteRequest.quoteData.pickupFloor && `Étage ${booking.quoteRequest.quoteData.pickupFloor}`}
                              {booking.quoteRequest.quoteData.pickupFloor && booking.quoteRequest.quoteData.pickupElevator !== undefined && ' • '}
                              {booking.quoteRequest.quoteData.pickupElevator !== undefined && `Ascenseur: ${booking.quoteRequest.quoteData.pickupElevator ? 'Oui' : 'Non'}`}
                            </p>
                          )}
                        </div>
                        {booking.quoteRequest.quoteData.deliveryAddress && (
                          <div className="p-2 bg-green-50 rounded text-sm">
                            <p className="text-xs text-gray-600 mb-1">Arrivée</p>
                            <p className="font-medium">{booking.quoteRequest.quoteData.deliveryAddress}</p>
                            {(booking.quoteRequest.quoteData.deliveryFloor || booking.quoteRequest.quoteData.deliveryElevator !== undefined) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {booking.quoteRequest.quoteData.deliveryFloor && `Étage ${booking.quoteRequest.quoteData.deliveryFloor}`}
                                {booking.quoteRequest.quoteData.deliveryFloor && booking.quoteRequest.quoteData.deliveryElevator !== undefined && ' • '}
                                {booking.quoteRequest.quoteData.deliveryElevator !== undefined && `Ascenseur: ${booking.quoteRequest.quoteData.deliveryElevator ? 'Oui' : 'Non'}`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {booking.quoteRequest.quoteData.address && !booking.quoteRequest.quoteData.pickupAddress && (
                    <div className="pb-4 border-b">
                      <div className="flex items-center space-x-2 mb-2">
                        <HomeIcon className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-semibold text-gray-900">Adresse du service</p>
                      </div>
                      <p className="text-sm font-medium">{booking.quoteRequest.quoteData.address}</p>
                    </div>
                  )}

                  {/* Paramètres du service */}
                  {(booking.quoteRequest.quoteData.workers || booking.quoteRequest.quoteData.duration || booking.quoteRequest.quoteData.distance || booking.quoteRequest.quoteData.volume || booking.quoteRequest.quoteData.surface || booking.quoteRequest.quoteData.nombrePieces) && (
                    <div className="pb-4 border-b">
                      <div className="flex items-center space-x-2 mb-3">
                        <TruckIcon className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-semibold text-gray-900">Paramètres</p>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                        {booking.quoteRequest.quoteData.workers && (
                          <div>
                            <p className="text-xs text-gray-600">Travailleurs</p>
                            <p className="font-medium">{booking.quoteRequest.quoteData.workers}</p>
                          </div>
                        )}
                        {booking.quoteRequest.quoteData.duration && (
                          <div>
                            <p className="text-xs text-gray-600">Durée</p>
                            <p className="font-medium">{booking.quoteRequest.quoteData.duration}h</p>
                          </div>
                        )}
                        {booking.quoteRequest.quoteData.distance && (
                          <div>
                            <p className="text-xs text-gray-600">Distance</p>
                            <p className="font-medium">{booking.quoteRequest.quoteData.distance} km</p>
                          </div>
                        )}
                        {booking.quoteRequest.quoteData.volume && (
                          <div>
                            <p className="text-xs text-gray-600">Volume</p>
                            <p className="font-medium">{booking.quoteRequest.quoteData.volume} m³</p>
                          </div>
                        )}
                        {booking.quoteRequest.quoteData.surface && (
                          <div>
                            <p className="text-xs text-gray-600">Surface</p>
                            <p className="font-medium">{booking.quoteRequest.quoteData.surface} m²</p>
                          </div>
                        )}
                        {booking.quoteRequest.quoteData.nombrePieces && (
                          <div>
                            <p className="text-xs text-gray-600">Pièces</p>
                            <p className="font-medium">{booking.quoteRequest.quoteData.nombrePieces}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contraintes et services supplémentaires */}
                  {(booking.quoteRequest.quoteData.constraints || booking.quoteRequest.quoteData.additionalServices) && (
                    <div className="pb-4 border-b">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Options</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.quoteRequest.quoteData.constraints && Array.isArray(booking.quoteRequest.quoteData.constraints) && booking.quoteRequest.quoteData.constraints.map((constraint: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {constraint}
                          </Badge>
                        ))}
                        {booking.quoteRequest.quoteData.additionalServices && Array.isArray(booking.quoteRequest.quoteData.additionalServices) && booking.quoteRequest.quoteData.additionalServices.map((service: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs bg-green-50">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prix */}
                  {(() => {
                    const quoteData = booking.quoteRequest.quoteData || {};
                    const securedPrice = quoteData.securedPrice;
                    const calculatedPrice = quoteData.calculatedPrice;
                    const totalPrice = quoteData.totalPrice;
                    
                    // Extraire le prix depuis securedPrice, calculatedPrice ou totalPrice
                    const basePrice = securedPrice?.basePrice || (typeof calculatedPrice === 'object' ? calculatedPrice?.basePrice : null) || null;
                    const finalTotalPrice = securedPrice?.totalPrice || (typeof calculatedPrice === 'object' ? calculatedPrice?.totalPrice : null) || calculatedPrice || totalPrice || null;
                    
                    if (finalTotalPrice) {
                      return (
                        <div className="pb-4 border-b">
                          <div className="flex items-center space-x-2 mb-2">
                            <CurrencyEuroIcon className="h-4 w-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-900">Prix</p>
                          </div>
                          <div className="flex justify-between items-center">
                            {basePrice && (
                              <div>
                                <p className="text-xs text-gray-600">Prix de base</p>
                                <p className="font-medium">{formatPrice(basePrice)}</p>
                              </div>
                            )}
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Total TTC</p>
                              <p className="font-bold text-lg">{formatPrice(finalTotalPrice)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}

              {/* Services réservés */}
              {booking.items && Array.isArray(booking.items) && booking.items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Services réservés</p>
                  <div className="space-y-3">
                    {booking.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatPrice(item.price)}</p>
                            <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          {item.workers > 0 && (
                            <span>{item.workers} travailleur{item.workers > 1 ? 's' : ''}</span>
                          )}
                          {item.duration > 0 && (
                            <span>{item.duration} min</span>
                          )}
                          <span>Statut: {item.status}</span>
                        </div>
                        {(item.features && item.features.length > 0) || (item.includes && item.includes.length > 0) ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.features && item.features.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {item.includes && item.includes.map((include) => (
                              <Badge key={include} variant="outline" className="text-xs bg-green-50">
                                {include}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 