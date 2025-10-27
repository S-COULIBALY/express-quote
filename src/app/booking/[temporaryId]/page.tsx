'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalculatorIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Charger Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

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
}

/**
 * Composant de formulaire de paiement Stripe
 */
function CheckoutForm({
  customerInfo,
  onSuccess,
  onError
}: {
  customerInfo: CustomerInfo;
  onSuccess: (sessionId: string) => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
          receipt_email: customerInfo.email,
        },
      });

      if (error) {
        onError(error.message || 'Erreur de paiement');
      }
    } catch (err) {
      onError('Erreur lors du traitement du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Traitement en cours...
          </>
        ) : (
          <>
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Payer maintenant
          </>
        )}
      </Button>

      <p className="text-xs text-center text-slate-500">
        Paiement sécurisé par Stripe. Vos informations bancaires ne sont jamais stockées sur nos serveurs.
      </p>
    </form>
  );
}

/**
 * Page de réservation avec affichage automatique du formulaire Stripe
 */
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const temporaryId = params.temporaryId as string;
  const canceled = searchParams.get('canceled') === 'true';

  // États
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequestData | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    acceptTerms: false,
    acceptPrivacy: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chargement du QuoteRequest
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

  // Création automatique de la session Stripe quand les infos client sont complètes
  useEffect(() => {
    const createStripeSession = async () => {
      if (!quoteRequest || !quoteRequest.calculatedPrice) return;

      // Vérifier que tous les champs sont remplis
      if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim() ||
          !customerInfo.email.trim() || !customerInfo.phone.trim()) {
        return;
      }

      if (!customerInfo.acceptTerms || !customerInfo.acceptPrivacy) {
        return;
      }

      // Ne créer la session qu'une seule fois
      if (clientSecret) return;

      try {
        console.log('💳 Création de la session Stripe...');

        const response = await fetch('/api/payment/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temporaryId,
            customerData: customerInfo,
            amount: quoteRequest.calculatedPrice.totalPrice,
            quoteData: quoteRequest.quoteData
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur création session');
        }

        const data = await response.json();

        if (data.success) {
          setClientSecret(data.clientSecret);
          setSessionId(data.sessionId);
          console.log('✅ Session Stripe créée');
        } else {
          setError(data.error || 'Erreur lors de la création de la session');
        }
      } catch (err) {
        console.error('Erreur création session Stripe:', err);
        setError('Erreur lors de la préparation du paiement');
      }
    };

    createStripeSession();
  }, [quoteRequest, customerInfo, temporaryId, clientSecret]);

  const handlePaymentSuccess = (sessionId: string) => {
    // Le webhook Stripe créera le Booking
    // Redirection gérée par Stripe vers /success/{CHECKOUT_SESSION_ID}
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const handleBackToCatalog = () => {
    router.push('/catalogue');
  };

  // Validation du formulaire
  const isFormValid =
    customerInfo.firstName.trim() &&
    customerInfo.lastName.trim() &&
    customerInfo.email.trim() &&
    customerInfo.phone.trim() &&
    customerInfo.acceptTerms &&
    customerInfo.acceptPrivacy;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !quoteRequest) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || 'Devis non trouvé'}</AlertDescription>
            </Alert>
            <Button onClick={handleBackToCatalog} className="w-full">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour au catalogue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToCatalog}
            className="mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Retour au catalogue
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            Finalisation de votre réservation
          </h1>
          <p className="text-slate-600 mt-2">
            Complétez vos informations et procédez au paiement sécurisé
          </p>
        </div>

        {/* Alert si paiement annulé */}
        {canceled && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche: Infos client */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Vos informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                      placeholder="Jean"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="jean.dupont@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={customerInfo.acceptTerms}
                      onCheckedChange={(checked) =>
                        setCustomerInfo({ ...customerInfo, acceptTerms: checked as boolean })
                      }
                    />
                    <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
                      J'accepte les <a href="/cgv" target="_blank" className="text-blue-600 hover:underline">conditions générales de vente</a>
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="privacy"
                      checked={customerInfo.acceptPrivacy}
                      onCheckedChange={(checked) =>
                        setCustomerInfo({ ...customerInfo, acceptPrivacy: checked as boolean })
                      }
                    />
                    <label htmlFor="privacy" className="text-sm text-slate-700 cursor-pointer">
                      J'accepte la <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">politique de confidentialité</a>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Récapitulatif */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalculatorIcon className="w-5 h-5" />
                  Récapitulatif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Service</span>
                    <span className="font-medium">{quoteRequest.type}</span>
                  </div>
                  {quoteRequest.calculatedPrice && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Prix de base</span>
                        <span>{quoteRequest.calculatedPrice.basePrice.toFixed(2)} €</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-blue-600">
                          {quoteRequest.calculatedPrice.totalPrice.toFixed(2)} €
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite: Paiement Stripe */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Paiement sécurisé</CardTitle>
              </CardHeader>
              <CardContent>
                {!isFormValid ? (
                  <Alert>
                    <AlertDescription>
                      Veuillez remplir tous les champs obligatoires et accepter les conditions pour procéder au paiement.
                    </AlertDescription>
                  </Alert>
                ) : !clientSecret ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600">Préparation du paiement...</p>
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      customerInfo={customerInfo}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
