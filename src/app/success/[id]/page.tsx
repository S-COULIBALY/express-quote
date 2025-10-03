'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircleIcon,
  CalendarIcon, 
  MapPinIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  PhoneIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BookingData {
  id: string;
  serviceType?: string;  // ← Peut être undefined
  status: string;
  totalPrice: number;
  currency: string;
  priceDetails?: any;
  createdAt: string;
  updatedAt: string;
  movingData?: {
    movingDate: string;
    volume: number;
    pickupAddress: string;
    deliveryAddress: string;
    pickupFloor: string;
    deliveryFloor: string;
    pickupElevator: string;
    deliveryElevator: string;
    pickupCarryDistance: string;
    deliveryCarryDistance: string;
    pickupLogisticsConstraints: string[];
    deliveryLogisticsConstraints: string[];
    propertyType: string;
    surface: number;
    rooms: number;
    occupants: number;
  };
  cleaningData?: {
    cleaningType: string;
    squareMeters: number;
    duration: number;
    frequency: string;
    numberOfRooms: number;
    propertyState: string;
    hasBalcony: boolean;
    balconySize: number;
    hasPets: boolean;
    serviceConstraints: string[];
  };
  serviceData?: any;
  contactInfo?: any;
  additionalInfo?: string;
  whatsappOptIn?: boolean;
}

export default function UnifiedSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError('ID de réservation manquant');
      setIsLoading(false);
      return;
    }

    fetchBookingData();
    
    // Animation de confettis au chargement
    animateConfetti();
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🎉 Récupération des données de succès pour:', bookingId);

      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Réservation non trouvée');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Données récupérées pour le succès:', data);

      setBooking(data);

    } catch (err) {
      console.error('❌ Erreur lors de la récupération:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const animateConfetti = async () => {
    try {
      const { default: confetti } = await import('canvas-confetti');
      
      // Animation en plusieurs vagues
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
        });
      }, 250);
      
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
        });
      }, 400);
    } catch (error) {
      console.log('Animation de confettis non disponible');
    }
  };

  const getServiceTypeLabel = (type: string | undefined | null) => {
    if (!type) return 'Service';
    
    switch (type.toUpperCase()) {
      case 'MOVING':
        return 'Déménagement';
      case 'CLEANING':
        return 'Nettoyage';
      case 'TRANSPORT':
        return 'Transport';
      case 'DELIVERY':
        return 'Livraison';
      case 'PACK':
        return 'Pack de services';
      case 'SERVICE':
        return 'Service';
      default:
        return type;
    }
  };

  const getServiceIcon = (type: string | undefined | null) => {
    if (!type) return <DocumentTextIcon className="h-6 w-6" />;
    
    switch (type.toUpperCase()) {
      case 'MOVING':
        return <TruckIcon className="h-6 w-6" />;
      case 'CLEANING':
        return <div className="h-6 w-6 flex items-center justify-center">🧹</div>;
      default:
        return <DocumentTextIcon className="h-6 w-6" />;
    }
  };

  const generatePDF = async () => {
    if (!booking) return;

    try {
      setIsGeneratingPDF(true);
      console.log('📄 Génération du PDF en cours...');

      // Simuler la génération de PDF (peut être remplacé par une vraie API)
      const response = await fetch(`/api/bookings/${booking.id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invoice' })
      });

      if (response.ok) {
        // Télécharger le PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devis-${booking.id.substring(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ PDF téléchargé avec succès');
      } else {
        // Fallback : générer un PDF côté client avec une bibliothèque comme jsPDF
        await generateClientPDF();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      
      // Fallback : générer un PDF côté client
      await generateClientPDF();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateClientPDF = async () => {
    // Pour l'instant, utiliser l'impression de la page comme alternative
    console.log('📄 Génération de PDF via impression...');
    
    // Ouvrir la boîte de dialogue d'impression
    window.print();
    
    console.log('✅ Impression déclenchée');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-center text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-md mx-auto text-center">
          <Card className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Erreur</h2>
            <p className="mb-6 text-gray-600">{error || 'Impossible de récupérer les données'}</p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Réessayer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/catalogue')} 
                className="w-full"
              >
                Retour au catalogue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* En-tête de succès */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6 shadow-lg">
            <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Réservation confirmée !
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Votre {getServiceTypeLabel(booking.serviceType).toLowerCase()} a été réservé avec succès
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full">
            <span className="text-sm font-medium">
              Commande #{booking.id.substring(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Notification email */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <EnvelopeIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    Confirmation envoyée
                  </h3>
                  <p className="text-sm text-gray-600">
                    Un email de confirmation avec tous les détails a été envoyé. 
                    Vous recevrez également un SMS de rappel avant la prestation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Détails de la réservation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getServiceIcon(booking.serviceType)}
                  <span className="ml-2">Détails de votre {getServiceTypeLabel(booking.serviceType)?.toLowerCase() || 'service'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type de service</p>
                    <p className="font-medium">{getServiceTypeLabel(booking.serviceType) || 'Service'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de réservation</p>
                    <p className="font-medium">
                      {format(new Date(booking.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                      Confirmé
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prix total</p>
                    <p className="font-medium text-emerald-600">{formatPrice(booking.totalPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détails spécifiques */}
            {booking.serviceType && booking.serviceType === 'MOVING' && booking.movingData && (
              <Card>
                <CardHeader>
                  <CardTitle>Détails du déménagement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date prévue</p>
                      <p className="font-medium">
                        {booking.movingData.movingDate 
                          ? format(new Date(booking.movingData.movingDate), 'dd MMMM yyyy', { locale: fr })
                          : 'À planifier'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Volume estimé</p>
                      <p className="font-medium">{booking.movingData.volume} m³</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Adresses</p>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Départ</p>
                          <p className="text-sm text-gray-600">{booking.movingData.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Arrivée</p>
                          <p className="text-sm text-gray-600">{booking.movingData.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {booking.serviceType && booking.serviceType === 'CLEANING' && booking.cleaningData && (
              <Card>
                <CardHeader>
                  <CardTitle>Détails du nettoyage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Type de nettoyage</p>
                      <p className="font-medium">{booking.cleaningData.cleaningType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Surface</p>
                      <p className="font-medium">{booking.cleaningData.squareMeters} m²</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Durée estimée</p>
                      <p className="font-medium">{booking.cleaningData.duration} heures</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fréquence</p>
                      <p className="font-medium">{booking.cleaningData.frequency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prochaines étapes */}
            <Card>
              <CardHeader>
                <CardTitle>Prochaines étapes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckBadgeIcon className="h-5 w-5 text-emerald-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Confirmation reçue</p>
                      <p className="text-xs text-gray-600">Votre réservation est enregistrée dans notre système</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-5 w-5 border-2 border-emerald-600 rounded-full mr-3 mt-0.5 flex items-center justify-center">
                      <span className="text-xs text-emerald-600 font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Planification</p>
                      <p className="text-xs text-gray-600">Notre équipe va vous contacter pour finaliser les détails</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full mr-3 mt-0.5 flex items-center justify-center">
                      <span className="text-xs text-gray-400 font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prestation</p>
                      <p className="text-xs text-gray-600">Intervention à la date convenue</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar avec actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Documents et actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    className="w-full"
                    variant="outline"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    {isGeneratingPDF ? 'Génération...' : 'Télécharger le devis (PDF)'}
                  </Button>
                  
                  <Button 
                    onClick={() => window.print()}
                    className="w-full"
                    variant="outline"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Imprimer cette page
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/catalogue')}
                    className="w-full"
                  >
                    Nouvelle réservation
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/')}
                    className="w-full"
                    variant="outline"
                  >
                    Retour à l'accueil
                  </Button>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Besoin d'aide ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-emerald-600 mr-2" />
                    <span className="text-sm">01 23 45 67 89</span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-emerald-600 mr-2" />
                    <span className="text-sm">contact@express-quote.com</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Notre équipe est disponible du lundi au vendredi de 9h à 18h
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer légal */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            En confirmant votre réservation, vous acceptez nos{' '}
            <a href="/legal/terms" className="text-emerald-600 hover:underline">conditions générales</a>,{' '}
            <a href="/legal/privacy" className="text-emerald-600 hover:underline">politique de confidentialité</a> et{' '}
            <a href="/legal/cookies" className="text-emerald-600 hover:underline">politique des cookies</a>.
          </p>
        </div>
      </div>
    </div>
  );
} 