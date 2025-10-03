'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckBadgeIcon, 
  DocumentTextIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalculatorIcon,
  CogIcon,
  CurrencyEuroIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { PaymentProcessor } from '@/components/PaymentProcessor';

// Types
interface QuoteRequestData {
  id: string;
  temporaryId: string;
  type: string;
  status: string;
  quoteData: any;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  catalogSelection?: {
    id: string;
    marketingTitle: string;
    marketingDescription: string;
    marketingPrice: number;
    item: {
      id: string;
      name: string;
      description: string;
      basePrice: number;
    };
  };
  calculatedPrice?: {
    basePrice: number;
    totalPrice: number;
    currency: string;
    breakdown: Record<string, number>;
  };
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  wantsInsurance: boolean;
  additionalInfo?: string;
}

interface ParameterComparison {
  current: any;
  default: any;
  hasChanged: boolean;
  paramName: string;
  displayLabel: string;
  unit?: string;
  icon?: React.ComponentType<any>;
}

// Composant de comparaison pour un paramètre
const ParameterComparison: React.FC<{ comparison: ParameterComparison }> = ({ comparison }) => {
  const { current, default: defaultValue, hasChanged, displayLabel, unit = '', icon: Icon } = comparison;

  if (!hasChanged && defaultValue === undefined) return null;

  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-600" />}
        <span className="font-medium text-slate-800">{displayLabel}</span>
      </div>
      <div className="flex items-center gap-2 text-right">
        {hasChanged && defaultValue !== undefined && (
          <span className="text-slate-400 line-through text-sm">
            {defaultValue} {unit}
          </span>
        )}
        <span className={`font-semibold text-sm ${hasChanged ? 'text-blue-700' : 'text-slate-700'}`}>
          {current} {unit}
        </span>
        {hasChanged && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0.5">
            Modifié
          </Badge>
        )}
      </div>
    </div>
  );
};

// Composant option assurance simplifiée
const InsuranceOption: React.FC<{ 
  hasInsurance: boolean;
  onInsuranceChange: (checked: boolean) => void;
}> = ({ hasInsurance, onInsuranceChange }) => {
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="wantsInsurance"
            checked={hasInsurance}
            onCheckedChange={(checked) => onInsuranceChange(checked as boolean)}
          />
          <div>
            <Label htmlFor="wantsInsurance" className="text-sm font-semibold cursor-pointer text-slate-800">
              Assurance supplémentaire recommandée
            </Label>
            <p className="text-xs text-slate-600 mt-1">
              Protection renforcée pendant le transport
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-blue-700">+ 15,00 €</div>
          {hasInsurance && (
            <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
              Activée
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default function QuoteRequestSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const temporaryId = params.temporaryId as string;

  // États
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequestData | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    acceptTerms: false,
    acceptPrivacy: false,
    wantsInsurance: false,
    additionalInfo: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false); // New state for modal

  // Chargement des données (identique à l'original)
  useEffect(() => {
    const fetchQuoteRequest = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/quotesRequest/${temporaryId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Devis non trouvé ou expiré');
            return;
          }
          throw new Error('Erreur lors du chargement du devis');
        }

        const data = await response.json();
        
        if (data.success) {
          setQuoteRequest(data.data);
          
          // Vérifier l'expiration
          const expiresAt = new Date(data.data.expiresAt);
          const now = new Date();
          
          if (now > expiresAt) {
            setIsExpired(true);
          }
        } else {
          setError(data.message || 'Erreur lors du chargement du devis');
        }
      } catch (err) {
        console.error('Erreur chargement devis:', err);
        setError('Erreur lors du chargement du devis');
      } finally {
        setIsLoading(false);
      }
    };

    if (temporaryId) {
      fetchQuoteRequest();
    }
  }, [temporaryId]);

  // Mise à jour du temps restant (identique à l'original)
  useEffect(() => {
    if (!quoteRequest || isExpired) return;

    const updateTimeLeft = () => {
      const expiresAt = new Date(quoteRequest.expiresAt);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();

      if (diffMs <= 0) {
        setIsExpired(true);
        setTimeLeft('Expiré');
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        if (hours > 0) {
          setTimeLeft(`${days} jour${days > 1 ? 's' : ''} et ${hours} heure${hours > 1 ? 's' : ''}`);
        } else {
          setTimeLeft(`${days} jour${days > 1 ? 's' : ''}`);
        }
      } else if (hours > 0) {
        setTimeLeft(`${hours} heure${hours > 1 ? 's' : ''}`);
      } else {
        setTimeLeft('Moins d\'une heure');
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [quoteRequest, isExpired]);

  // Calcul des comparaisons de paramètres
  const parameterComparisons = useMemo(() => {
    if (!quoteRequest?.quoteData) return [];

    const { quoteData, catalogSelection } = quoteRequest;
    const presetSnapshot = quoteData.__presetSnapshot || {};
    
    const comparisons: ParameterComparison[] = [];

    // Nombre de déménageurs
    if (quoteData.workers !== undefined) {
      comparisons.push({
        current: quoteData.workers,
        default: presetSnapshot.workers,
        hasChanged: quoteData.workers !== presetSnapshot.workers,
        paramName: 'workers',
        displayLabel: 'Nombre de déménageurs',
        unit: 'personnes',
        icon: UserGroupIcon
      });
    }

    // Volume
    if (quoteData.volume !== undefined) {
      comparisons.push({
        current: quoteData.volume,
        default: presetSnapshot.volume,
        hasChanged: quoteData.volume !== presetSnapshot.volume,
        paramName: 'volume',
        displayLabel: 'Volume à déménager',
        unit: 'm³',
        icon: DocumentTextIcon
      });
    }

    // Durée
    if (quoteData.duration !== undefined) {
      comparisons.push({
        current: quoteData.duration,
        default: presetSnapshot.duration,
        hasChanged: quoteData.duration !== presetSnapshot.duration,
        paramName: 'duration',
        displayLabel: 'Durée estimée',
        unit: 'jour(s)',
        icon: ClockIcon
      });
    }

    // Distance
    if (quoteData.distance !== undefined) {
      comparisons.push({
        current: quoteData.distance,
        default: presetSnapshot.distance || 0,
        hasChanged: quoteData.distance !== (presetSnapshot.distance || 0),
        paramName: 'distance',
        displayLabel: 'Distance totale',
        unit: 'km',
        icon: MapPinIcon
      });
    }

    return comparisons;
  }, [quoteRequest]);

  // Prix de comparaison
  const priceComparison = useMemo(() => {
    if (!quoteRequest?.calculatedPrice || !quoteRequest?.catalogSelection) {
      return { current: 0, default: 0 };
    }

    return {
      current: quoteRequest.calculatedPrice.totalPrice,
      default: quoteRequest.catalogSelection.marketingPrice
    };
  }, [quoteRequest]);

  // Gestion de la confirmation (identique à l'original)
  const handleConfirmBooking = async () => {
    if (!quoteRequest) return;

    // Validation
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim() || 
        !customerInfo.email.trim() || !customerInfo.phone.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!customerInfo.acceptTerms || !customerInfo.acceptPrivacy) {
      setError('Veuillez accepter les conditions générales et la politique de confidentialité');
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);

      // Créer la réservation
      const bookingResponse = await fetch('/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temporaryId: temporaryId,
          customerData: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            additionalInfo: customerInfo.additionalInfo,
            wantsInsurance: customerInfo.wantsInsurance
          }
        })
      });

      if (!bookingResponse.ok) {
        throw new Error('Erreur lors de la création de la réservation');
      }

      const bookingData = await bookingResponse.json();
      
      if (bookingData.success) {
        // Créer la réservation et afficher le modal de paiement
        setBookingId(bookingData.data.id);
        setShowPayment(true);
        setShowPaymentModal(true); // Afficher le modal
        setIsConfirming(false);
      } else {
        setError(bookingData.message || 'Erreur lors de la création de la réservation');
      }
    } catch (err) {
      console.error('Erreur confirmation:', err);
      setError('Erreur lors de la confirmation du devis');
    } finally {
      setIsConfirming(false);
    }
  };

  // Gestion du succès de paiement
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      if (!bookingId) return;
      
      // Le paiement est déjà enregistré via le webhook Stripe
      // On peut directement rediriger vers la page de succès
      router.push(`/success/${bookingId}`);
      
    } catch (error) {
      throw new Error('Erreur lors de la finalisation du paiement');
    }
  };

  const handlePaymentError = (error: Error) => {
    setError(`Erreur de paiement: ${error.message}`);
    setShowPayment(false); // Permettre de revenir au formulaire
  };

  const handleBackToCatalog = () => {
    router.push('/catalogue');
  };

  const handleRenewQuote = () => {
    router.push('/catalogue');
  };

  // Fonctions utilitaires (identiques à l'original)
  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'MOVING':
        return 'Déménagement';
      case 'CLEANING':
        return 'Nettoyage';
      case 'DELIVERY':
        return 'Livraison';
      case 'TRANSPORT':
        return 'Transport';
      case 'PACKING':
        return 'Emballage';
      default:
        return type;
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'MOVING':
        return <TruckIcon className="h-5 w-5" />;
      case 'CLEANING':
        return <ShieldCheckIcon className="h-5 w-5" />;
      case 'PACKING':
        return <DocumentTextIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // États de chargement et d'erreur (identiques à l'original)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-[90vw] max-w-md mx-auto text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleBackToCatalog}>
            Retour au catalogue
          </Button>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-[90vw] max-w-none mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <ClockIcon className="h-5 w-5" />
                Devis expiré
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Ce devis a expiré. Vous pouvez créer un nouveau devis avec les mêmes paramètres.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleRenewQuote} className="flex-1">
                  Renouveler le devis
                </Button>
                <Button variant="outline" onClick={handleBackToCatalog} className="flex-1">
                  Retour au catalogue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!quoteRequest) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête avec countdown */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBackToCatalog}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Button>
            <div className="text-center">
              <p className="text-sm text-slate-600">Devis expire dans</p>
              <p className="text-lg font-bold text-red-600">{timeLeft}</p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4">
            {showPayment && bookingId && (
              <Card className="border-2 border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <CreditCardIcon className="h-5 w-5" />
                    Paiement sécurisé
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <PaymentProcessor
                    paymentData={{
                      id: bookingId,
                      amount: quoteRequest?.calculatedPrice ? 
                        Math.ceil((quoteRequest.calculatedPrice.totalPrice + (customerInfo.wantsInsurance ? 15 : 0)) * 0.3) : 0,
                      description: `Acompte ${getServiceTypeLabel(quoteRequest?.type || '')} - Réservation #${bookingId.slice(-8)}`,
                      onSuccess: handlePaymentSuccess,
                      onError: handlePaymentError
                    }}
                    serviceName={getServiceTypeLabel(quoteRequest?.type || '')}
                    showBackButton={false}
                  />
                </CardContent>
              </Card>
            )}
            {/* Récapitulatif du service avec comparaison */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  {getServiceIcon(quoteRequest.type)}
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Récapitulatif de votre devis</h1>
                    <p className="text-sm text-slate-600 mt-1">
                      {quoteRequest.quoteData.serviceName || quoteRequest.catalogSelection?.marketingTitle || getServiceTypeLabel(quoteRequest.type)}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quoteRequest.catalogSelection && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                      <CheckBadgeIcon className="h-4 w-4" />
                      Pack de base : {quoteRequest.catalogSelection.marketingTitle}
                    </h4>
                    <p className="text-sm text-blue-800">
                      {quoteRequest.catalogSelection.marketingDescription}
                    </p>
                  </div>
                )}

                {/* Configuration personnalisée avec comparaison */}
                {parameterComparisons.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-800">
                      <SparklesIcon className="h-4 w-4 text-blue-600" />
                      Personnalisations apportées
                    </h4>
                    <div className="space-y-1">
                      {parameterComparisons.map((comparison, index) => (
                        <ParameterComparison key={index} comparison={comparison} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Adresses */}
                {(quoteRequest.quoteData.pickupAddress || quoteRequest.quoteData.deliveryAddress || quoteRequest.quoteData.location) && (
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      Adresses
                    </h5>
                    
                    {quoteRequest.quoteData.pickupAddress && quoteRequest.quoteData.deliveryAddress ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="font-medium text-sm text-slate-700">Départ</div>
                          <div className="text-sm text-slate-600">{quoteRequest.quoteData.pickupAddress}</div>
                          {(quoteRequest.quoteData.pickupFloor !== undefined || quoteRequest.quoteData.pickupElevator !== undefined) && (
                            <div className="text-xs text-slate-500 space-x-3">
                              {quoteRequest.quoteData.pickupFloor !== undefined && (
                                <span>
                                  Étage: {quoteRequest.quoteData.pickupFloor === 0 ? 'RDC' : 
                                   quoteRequest.quoteData.pickupFloor === 1 ? '1er' :
                                   `${quoteRequest.quoteData.pickupFloor}ème`}
                                </span>
                              )}
                              {quoteRequest.quoteData.pickupElevator !== undefined && (
                                <span>Ascenseur: {quoteRequest.quoteData.pickupElevator ? 'Oui' : 'Non'}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-medium text-sm text-slate-700">Arrivée</div>
                          <div className="text-sm text-slate-600">{quoteRequest.quoteData.deliveryAddress}</div>
                          {(quoteRequest.quoteData.deliveryFloor !== undefined || quoteRequest.quoteData.deliveryElevator !== undefined) && (
                            <div className="text-xs text-slate-500 space-x-3">
                              {quoteRequest.quoteData.deliveryFloor !== undefined && (
                                <span>
                                  Étage: {quoteRequest.quoteData.deliveryFloor === 0 ? 'RDC' : 
                                   quoteRequest.quoteData.deliveryFloor === 1 ? '1er' :
                                   `${quoteRequest.quoteData.deliveryFloor}ème`}
                                </span>
                              )}
                              {quoteRequest.quoteData.deliveryElevator !== undefined && (
                                <span>Ascenseur: {quoteRequest.quoteData.deliveryElevator ? 'Oui' : 'Non'}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-slate-600">
                          {quoteRequest.quoteData.pickupAddress || quoteRequest.quoteData.deliveryAddress || quoteRequest.quoteData.location}
                        </div>
                        {(quoteRequest.quoteData.floorNumber !== undefined || quoteRequest.quoteData.hasElevator !== undefined) && (
                          <div className="text-xs text-slate-500 space-x-3">
                            {quoteRequest.quoteData.floorNumber !== undefined && (
                              <span>
                                Étage: {quoteRequest.quoteData.floorNumber === 0 ? 'RDC' : 
                                 quoteRequest.quoteData.floorNumber === 1 ? '1er' :
                                 `${quoteRequest.quoteData.floorNumber}ème`}
                              </span>
                            )}
                            {quoteRequest.quoteData.hasElevator !== undefined && (
                              <span>Ascenseur: {quoteRequest.quoteData.hasElevator ? 'Oui' : 'Non'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Date et planification */}
                {(quoteRequest.quoteData.scheduledDate || quoteRequest.quoteData.moveDate) && (
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Planification
                    </h5>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Date prévue</span>
                        <span className="font-semibold text-slate-900">
                          {format(new Date(quoteRequest.quoteData.scheduledDate || quoteRequest.quoteData.moveDate), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                      
                      {quoteRequest.quoteData.scheduledTime && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Créneau</span>
                          <span className="font-semibold text-slate-900">
                            {quoteRequest.quoteData.scheduledTime === 'morning' ? 'Matin' :
                             quoteRequest.quoteData.scheduledTime === 'afternoon' ? 'Après-midi' :
                             quoteRequest.quoteData.scheduledTime === 'evening' ? 'Soirée' :
                             quoteRequest.quoteData.scheduledTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informations du logement */}
                {(quoteRequest.quoteData.propertyType || quoteRequest.quoteData.surface || quoteRequest.quoteData.rooms || quoteRequest.quoteData.occupants || quoteRequest.quoteData.squareMeters) && (
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <HomeIcon className="h-4 w-4" />
                      Logement
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {quoteRequest.quoteData.propertyType && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Type</span>
                          <span className="font-medium text-slate-900">
                            {quoteRequest.quoteData.propertyType === 'apartment' ? 'Appartement' :
                             quoteRequest.quoteData.propertyType === 'house' ? 'Maison' :
                             quoteRequest.quoteData.propertyType === 'office' ? 'Bureau' :
                             quoteRequest.quoteData.propertyType}
                          </span>
                        </div>
                      )}
                      
                      {(quoteRequest.quoteData.surface || quoteRequest.quoteData.squareMeters) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Surface</span>
                          <span className="font-medium text-slate-900">{quoteRequest.quoteData.surface || quoteRequest.quoteData.squareMeters}m²</span>
                        </div>
                      )}
                      
                      {(quoteRequest.quoteData.rooms || quoteRequest.quoteData.numberOfRooms) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Pièces</span>
                          <span className="font-medium text-slate-900">{quoteRequest.quoteData.rooms || quoteRequest.quoteData.numberOfRooms}</span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.occupants && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Occupants</span>
                          <span className="font-medium text-slate-900">{quoteRequest.quoteData.occupants}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Options de service */}
                {(quoteRequest.quoteData.packagingOption || quoteRequest.quoteData.furnitureOption || quoteRequest.quoteData.fragileOption || 
                  quoteRequest.quoteData.storageOption || quoteRequest.quoteData.disassemblyOption || quoteRequest.quoteData.unpackingOption || 
                  quoteRequest.quoteData.suppliesOption || quoteRequest.quoteData.fragileItemsOption || quoteRequest.quoteData.hasBalcony || 
                  quoteRequest.quoteData.hasPets || quoteRequest.quoteData.frequency) && (
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <CogIcon className="h-4 w-4" />
                      Options incluses
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4">
                      {quoteRequest.quoteData.packagingOption && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">Emballage inclus</span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.furnitureOption && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">Démontage meubles</span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.fragileOption && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">Objets fragiles</span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.storageOption && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">Stockage temporaire</span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.disassemblyOption && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">Démontage complet</span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.unpackingOption && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">Déballage inclus</span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.hasBalcony !== undefined && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">
                            Balcon {quoteRequest.quoteData.hasBalcony ? 'inclus' : 'non concerné'}
                          </span>
                        </div>
                      )}
                      
                      {quoteRequest.quoteData.frequency && (
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-slate-700">
                            {quoteRequest.quoteData.frequency === 'ONCE' ? 'Ponctuel' :
                             quoteRequest.quoteData.frequency === 'WEEKLY' ? 'Hebdomadaire' :
                             quoteRequest.quoteData.frequency === 'BIWEEKLY' ? 'Bi-hebdomadaire' :
                             quoteRequest.quoteData.frequency === 'MONTHLY' ? 'Mensuel' :
                             quoteRequest.quoteData.frequency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Remarques du client */}
                {quoteRequest.quoteData.additionalInfo && (
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      Remarques
                    </h5>
                    <p className="text-sm text-slate-700 italic">
                      "{quoteRequest.quoteData.additionalInfo}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Option assurance */}
            <InsuranceOption
              hasInsurance={customerInfo.wantsInsurance}
              onInsuranceChange={(checked) => 
                setCustomerInfo(prev => ({ ...prev, wantsInsurance: checked }))
              }
            />

                        {/* Formulaire informations client */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <UserIcon className="h-5 w-5" />
                  Vos informations
                  <Badge className="bg-red-100 text-red-800 ml-2">
                    Obligatoires
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                      Prénom *
                    </Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Votre prénom"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                      Nom *
                    </Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Votre nom"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <EnvelopeIcon className="h-4 w-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="votre@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <PhoneIcon className="h-4 w-4" />
                      Téléphone *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="06 12 34 56 78"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalInfo" className="text-sm font-medium text-slate-700">Informations complémentaires</Label>
                  <textarea
                    id="additionalInfo"
                    value={customerInfo.additionalInfo}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Précisions sur l'intervention, accès particulier, etc."
                    className="mt-1 w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={customerInfo.acceptTerms}
                      onCheckedChange={(checked) => 
                        setCustomerInfo(prev => ({ ...prev, acceptTerms: checked as boolean }))
                      }
                      className="mt-1"
                    />
                    <Label htmlFor="acceptTerms" className="text-sm text-slate-700">
                      J'accepte les <a href="/legal/terms" className="text-blue-600 hover:underline font-medium">conditions générales</a> *
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptPrivacy"
                      checked={customerInfo.acceptPrivacy}
                      onCheckedChange={(checked) => 
                        setCustomerInfo(prev => ({ ...prev, acceptPrivacy: checked as boolean }))
                      }
                      className="mt-1"
                    />
                    <Label htmlFor="acceptPrivacy" className="text-sm text-slate-700">
                      J'accepte la <a href="/legal/privacy" className="text-blue-600 hover:underline font-medium">politique de confidentialité</a> *
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {/* Prix final détaillé */}
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <CalculatorIcon className="h-5 w-5" />
                  Votre devis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {quoteRequest.calculatedPrice && (
                  <>
                    {/* Prix de base vs personnalisé */}
                    {quoteRequest.catalogSelection && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <span className="text-sm text-slate-600">Pack de base</span>
                        <span className="text-slate-400 line-through">
                          {formatPrice(quoteRequest.catalogSelection.marketingPrice)}
                        </span>
                      </div>
                    )}

                    {/* Breakdown simplifié */}
                    {quoteRequest.calculatedPrice.breakdown && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-700 mb-2">Votre service personnalisé</div>
                        {Object.entries(quoteRequest.calculatedPrice.breakdown).map(([key, value], index) => {
                          const isPositive = Number(value) >= 0;
                          const isPromotion = key.toLowerCase().includes('promotion') || key.toLowerCase().includes('réduction');
                          
                          if (Math.abs(Number(value)) < 1) return null; // Masquer les petites valeurs
                          
                          return (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className={`${isPromotion ? 'text-green-700 font-medium' : 'text-slate-600'}`}>
                                {key}
                              </span>
                              <span className={`font-medium ${
                                isPositive 
                                  ? isPromotion ? 'text-green-600' : 'text-slate-900'
                                  : 'text-red-600'
                              }`}>
                                {isPositive && !isPromotion ? '+' : ''}{formatPrice(Number(value))}
                              </span>
                            </div>
                          );
                        })}
                        
                        <Separator className="my-3" />
                        
                        {/* Sous-total */}
                        <div className="flex items-center justify-between py-2 bg-slate-100 px-3 rounded-lg">
                          <span className="font-semibold text-slate-800">Sous-total service</span>
                          <span className="font-bold text-slate-900 text-lg">
                            {formatPrice(quoteRequest.calculatedPrice.totalPrice)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Option assurance */}
                    {customerInfo.wantsInsurance && (
                      <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-blue-50 border border-blue-200">
                        <span className="flex items-center gap-2 text-blue-700 font-medium">
                          <ShieldCheckIcon className="h-4 w-4" />
                          Assurance
                        </span>
                        <span className="font-semibold text-blue-900">+15,00 €</span>
                      </div>
                    )}

                    {/* Prix final */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-lg text-white">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-bold text-lg">Total TTC</p>
                          <p className="text-blue-100 text-sm">Acompte 30% requis</p>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-2xl">
                            {formatPrice(quoteRequest.calculatedPrice.totalPrice + (customerInfo.wantsInsurance ? 15 : 0))}
                          </div>
                        </div>
                      </div>
                      <div className="text-center pt-2 border-t border-blue-400">
                        <span className="text-blue-100 text-sm">Acompte à régler : </span>
                        <span className="font-bold text-lg">
                          {formatPrice((quoteRequest.calculatedPrice.totalPrice + (customerInfo.wantsInsurance ? 15 : 0)) * 0.3)}
                        </span>
                      </div>
                    </div>

                    {!showPayment ? (
                      <Button 
                        onClick={handleConfirmBooking}
                        disabled={isConfirming}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                        size="lg"
                      >
                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Confirmation...
                          </div>
                        ) : (
                          'Confirmer et payer l\'acompte'
                        )}
                      </Button>
                    ) : (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-blue-800 font-medium">✅ Réservation confirmée</p>
                        <p className="text-blue-600 text-sm mt-1">Procédez au paiement dans le modal</p>
                      </div>
                    )}

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Informations importantes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <InformationCircleIcon className="h-5 w-5" />
                  À retenir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm">
                <div className="flex items-start gap-3">
                  <ClockIcon className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">Validité 24h</p>
                    <p className="text-slate-600 text-xs">Ce devis expire automatiquement</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCardIcon className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">Acompte 30%</p>
                    <p className="text-slate-600 text-xs">Solde payable le jour J</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">Assurance de base</p>
                    <p className="text-slate-600 text-xs">Protection standard incluse</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de paiement Stripe */}
      {showPaymentModal && bookingId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowPaymentModal(false)}
          />
          
          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CreditCardIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Paiement sécurisé</h2>
                    <p className="text-blue-100 text-sm">Finalisez votre réservation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-5 rounded-xl border border-emerald-200 mb-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-emerald-800 font-medium">
                          Paiement sécurisé par Stripe
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          Vos données bancaires sont protégées et ne sont jamais stockées sur nos serveurs
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Résumé de la commande */}
                  <div className="bg-slate-50 p-6 rounded-lg mb-8">
                    <h3 className="font-semibold text-slate-800 mb-4 text-lg">Résumé de votre commande</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Service</span>
                        <span className="font-semibold text-slate-800">
                          {getServiceTypeLabel(quoteRequest?.type || '')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Acompte (30%)</span>
                        <span className="font-bold text-blue-600 text-lg">
                          {formatPrice((quoteRequest?.calculatedPrice ? 
                            (quoteRequest.calculatedPrice.totalPrice + (customerInfo.wantsInsurance ? 15 : 0)) * 0.3 : 0))}
                        </span>
                      </div>
                      {customerInfo.wantsInsurance && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-200">
                          <span className="text-slate-600 font-medium">Assurance</span>
                          <span className="font-semibold text-slate-800">+15,00 €</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Composant de paiement Stripe */}
                  <PaymentProcessor
                    paymentData={{
                      id: bookingId,
                      amount: quoteRequest?.calculatedPrice ? 
                        Math.ceil((quoteRequest.calculatedPrice.totalPrice + (customerInfo.wantsInsurance ? 15 : 0)) * 0.3) : 0,
                      description: `Acompte ${getServiceTypeLabel(quoteRequest?.type || '')} - Réservation #${bookingId.slice(-8)}`,
                      redirectUrl: `/success/`,  // ← Redirige vers /success/${bookingId} après paiement
                      onSuccess: handlePaymentSuccess,
                      onError: handlePaymentError
                    }}
                    serviceName={getServiceTypeLabel(quoteRequest?.type || '')}
                    showBackButton={false}
                  />
                </div>
              </div>

              {/* Pied du modal */}
              <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="text-center text-sm text-slate-600">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-slate-700">Paiement sécurisé par Stripe</span>
                  </div>
                  <p className="text-slate-500">Vos données de carte ne sont jamais stockées sur nos serveurs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}