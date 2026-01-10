'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  CalculatorIcon,
  CheckCircleIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

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

/**
 * Composant de formulaire de paiement Stripe unifié
 * Collecte les infos client ET le paiement dans un seul formulaire
 */
function CheckoutForm({
  sessionId,
  depositAmount,
  onSuccess,
  onError,
  acceptTerms,
  acceptPrivacy
}: {
  sessionId: string;
  depositAmount: number;
  onSuccess: (sessionId: string) => void;
  onError: (error: string) => void;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  // Masquer le formulaire Link Stripe s'il apparaît malgré la désactivation
  useEffect(() => {
    const hideLinkForm = () => {
      // Sélecteurs pour le formulaire Link Stripe
      const linkSelectors = [
        '[data-testid*="link"]',
        '[id*="link"]',
        'form[action*="link"]',
        '*:has-text("Paiement rapide et sécurisé avec Link")',
        '*:has-text("Enregistrer mes informations pour un paiement plus rapide")',
        '*:has-text("link. En fournissant votre numéro")'
      ];

      linkSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent || '';
            if (text.includes('Link') || text.includes('link') || text.includes('paiement plus rapide')) {
              // Masquer l'élément et ses parents pertinents
              let parent = el as HTMLElement;
              for (let i = 0; i < 5 && parent; i++) {
                if (parent.classList.toString().includes('Stripe') || 
                    parent.getAttribute('data-testid')?.includes('payment') ||
                    parent.tagName === 'FORM' ||
                    (parent.tagName === 'DIV' && parent.querySelector('input[type="email"]'))) {
                  parent.style.display = 'none';
                  break;
                }
                parent = parent.parentElement as HTMLElement;
              }
            }
          });
        } catch (e) {
          // Ignorer les erreurs de sélecteur
        }
      });

      // Masquer spécifiquement les sections contenant du texte Link
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        const text = el.textContent || '';
        if ((text.includes('Paiement rapide et sécurisé avec Link') || 
             text.includes('Enregistrer mes informations pour un paiement plus rapide') ||
             text.includes('link. En fournissant votre numéro')) &&
            el instanceof HTMLElement) {
          let parent = el.parentElement;
          while (parent && parent !== document.body) {
            if (parent.classList.toString().includes('Stripe') || 
                parent.getAttribute('data-testid')?.includes('payment') ||
                parent.tagName === 'FORM' ||
                (parent.tagName === 'DIV' && parent.querySelector('input[type="email"]'))) {
              (parent as HTMLElement).style.display = 'none';
              break;
            }
            parent = parent.parentElement;
          }
        }
      });
    };

    // Exécuter immédiatement et après un délai
    hideLinkForm();
    const timeout = setTimeout(hideLinkForm, 1000);
    const interval = setInterval(hideLinkForm, 2000);

    // Observer les changements dans le DOM
    const observer = new MutationObserver(() => {
      hideLinkForm();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // ✅ États pour les données client (OBLIGATOIRES)
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [addressError, setAddressError] = useState(false);
  const [billingAddressComponents, setBillingAddressComponents] = useState({
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'FR',
  });

  const extractAddressComponents = useCallback((place?: google.maps.places.PlaceResult) => {
    const result = {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'FR',
    };

    if (!place) {
      return result;
    }

    const components = place.address_components ?? [];
    let streetNumber = '';
    let route = '';

    components.forEach((component) => {
      if (component.types.includes('street_number')) {
        streetNumber = component.long_name;
      }
      if (component.types.includes('route')) {
        route = component.long_name;
      }
      if (component.types.includes('locality')) {
        result.city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        result.postal_code = component.long_name;
      }
      if (component.types.includes('country')) {
        result.country = component.short_name || component.long_name;
      }
    });

    result.line1 = [streetNumber, route].filter(Boolean).join(' ').trim();
    if (!result.line1) {
      result.line1 = place.formatted_address || '';
    }

    return result;
  }, []);

  const handleAddressChange = useCallback(
    (value: string, placeDetails?: google.maps.places.PlaceResult) => {
      setCustomerAddress(value);
      setAddressError(false);
      const parsed = extractAddressComponents(placeDetails);
      setBillingAddressComponents(parsed);
    },
    [extractAddressComponents]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validation des CGV
    if (!acceptTerms || !acceptPrivacy) {
      onError('Vous devez accepter les conditions générales de vente et la politique de confidentialité');
      return;
    }

    // ✅ Validation des champs obligatoires
    if (!customerEmail || !customerName || !customerPhone || !customerAddress) {
      if (!customerAddress) {
        setAddressError(true);
      }
      onError('Veuillez remplir tous les champs obligatoires (email, nom, téléphone, adresse de facturation).');
      return;
    }

    setIsProcessing(true);

    try {
      const billingAddress = {
        line1: billingAddressComponents.line1 || customerAddress,
        city: billingAddressComponents.city || '',
        state: billingAddressComponents.state || '',
        country: billingAddressComponents.country || 'FR',
        postal_code: billingAddressComponents.postal_code || '',
      };

      // ✅ Envoyer les billing_details manuellement avec les champs custom
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success?payment_intent=${sessionId}`,
          payment_method_data: {
            billing_details: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
              address: billingAddress,
            }
          }
        },
        redirect: 'if_required', // Ne redirige que si nécessaire (3D Secure, etc.)
      });

      if (error) {
        onError(error.message || 'Erreur de paiement');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Paiement réussi sans redirection
        onSuccess(paymentIntent.id);
        // Rediriger manuellement vers la page de succès
        window.location.href = `/success?payment_intent=${paymentIntent.id}`;
      }
    } catch (err) {
      console.error('Erreur traitement paiement:', err);
      onError(err instanceof Error ? err.message : 'Erreur lors du traitement du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ✅ SECTION: Informations client (OBLIGATOIRE) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📋 Vos informations <span className="text-red-500">*</span>
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="customerEmail"
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="jean.dupont@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              id="customerPhone"
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse de facturation <span className="text-red-500">*</span>
            </label>
            <AddressAutocomplete
              id="customerAddress"
              label=""
              value={customerAddress}
              onChange={handleAddressChange}
              required
              placeholder="10 Rue de la Paix, Paris"
              hideLabel
            />
            {addressError && (
              <p className="mt-1 text-sm text-red-600">
                Veuillez sélectionner votre adresse de facturation dans la liste des suggestions.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ SECTION: Informations bancaires Stripe */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          💳 Informations bancaires
        </h3>

        <PaymentElement
          options={{
            fields: {
              billingDetails: 'never'
            },
            paymentMethodOrder: ['card'],
            terms: {
              card: 'auto'
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never',
              link: 'never'
            },
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
              radios: false,
              spacedAccordionItems: false
            }
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !acceptTerms || !acceptPrivacy}
        variant="ghost"
        className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
            Payer {depositAmount.toFixed(2)} €
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
 * Page de réservation avec formulaire Stripe unifié
 */
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const temporaryId = params.temporaryId as string;
  const canceled = searchParams.get('canceled') === 'true';

  // États
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequestData | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ✅ CORRECTION: Prix recalculé côté serveur (utilisé pour l'affichage)
  const [recalculatedPrice, setRecalculatedPrice] = useState<{ total: number; deposit: number; currency: string } | null>(null);

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
          console.log('📊 [BOOKING PAGE] QuoteRequest récupéré depuis GET /api/quotesRequest:', {
            temporaryId,
            hasCalculatedPrice: !!data.data.calculatedPrice,
            calculatedPriceType: typeof data.data.calculatedPrice,
            calculatedPriceValue: data.data.calculatedPrice,
            quoteDataHasCalculatedPrice: !!data.data.quoteData?.calculatedPrice,
            quoteDataCalculatedPriceType: typeof data.data.quoteData?.calculatedPrice,
            quoteDataCalculatedPriceValue: data.data.quoteData?.calculatedPrice
          });

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

  // Création de la session Stripe au chargement
  useEffect(() => {
    const createStripeSession = async () => {
      if (!quoteRequest || !quoteRequest.calculatedPrice) return;
      if (clientSecret) return; // Ne créer qu'une seule fois

      try {
        console.log('💳 [BOOKING PAGE] Création de la session Stripe...');

        // ✅ CORRECTION: Envoyer le prix TOTAL, le serveur calculera l'acompte
        // Le serveur recalcule toujours le prix pour sécurité, donc on envoie juste
        // le prix total actuel pour comparaison et logging
        const totalPrice = quoteRequest.calculatedPrice.totalPrice;
        const depositAmount = totalPrice * 0.3; // Pour affichage uniquement

        console.log('💳 [BOOKING PAGE] Prix envoyé à create-session:', {
          temporaryId,
          totalPrice,
          depositAmount,
          calculatedPriceObject: quoteRequest.calculatedPrice,
          source: 'quoteRequest.calculatedPrice.totalPrice'
        });

        const response = await fetch('/api/payment/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temporaryId,
            customerData: {
              firstName: '', // Sera collecté par Stripe
              lastName: '',
              email: '',
              phone: ''
            },
            amount: depositAmount, // Envoie l'acompte (sera comparé au serveur)
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
          // ✅ CORRECTION: Mettre à jour le prix recalculé pour l'affichage
          if (data.recalculatedPrice) {
            setRecalculatedPrice(data.recalculatedPrice);
          }
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
  }, [quoteRequest, temporaryId, clientSecret]);

  const handlePaymentSuccess = (sessionId: string) => {
    // Le webhook Stripe créera le Booking
    // Redirection gérée vers /success?payment_intent={id}
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const handleBackToCatalog = () => {
    router.push('/catalogue');
  };

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
      <div className="container mx-auto px-4 max-w-4xl">
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
            Complétez le formulaire ci-dessous pour finaliser votre paiement
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche: Récapitulatif (plus petit) */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalculatorIcon className="w-5 h-5" />
                  Récapitulatif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="text-slate-600 mb-1">Service</div>
                    <div className="font-medium">
                      {quoteRequest.catalogSelection?.marketingTitle ||
                       quoteRequest.catalogSelection?.item?.name ||
                       quoteRequest.type}
                    </div>
                  </div>

                  {/* ✅ CORRECTION: Utiliser le prix recalculé côté serveur si disponible, sinon le prix de la QuoteRequest */}
                  {(recalculatedPrice || quoteRequest.calculatedPrice) && (
                    <>
                      <Separator />

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Prix TTC</span>
                        <span className="font-medium">
                          {(() => {
                            const displayedPrice = (recalculatedPrice?.total ?? quoteRequest.calculatedPrice?.totalPrice ?? 0);
                            console.log('💰 [BOOKING PAGE] Affichage Prix TTC:', {
                              displayedPrice,
                              hasRecalculatedPrice: !!recalculatedPrice,
                              recalculatedTotal: recalculatedPrice?.total,
                              hasCalculatedPrice: !!quoteRequest.calculatedPrice,
                              calculatedPriceTotalPrice: quoteRequest.calculatedPrice?.totalPrice,
                              source: recalculatedPrice ? 'recalculatedPrice (serveur)' : 'quoteRequest.calculatedPrice (stocké)'
                            });
                            return displayedPrice.toFixed(2);
                          })()} €
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Acompte (30%)</span>
                        <span className="font-semibold text-blue-600">
                          {(() => {
                            const displayedDeposit = (recalculatedPrice?.deposit ?? (quoteRequest.calculatedPrice?.totalPrice ?? 0) * 0.3);
                            console.log('💰 [BOOKING PAGE] Affichage Acompte (30%):', {
                              displayedDeposit,
                              hasRecalculatedPrice: !!recalculatedPrice,
                              recalculatedDeposit: recalculatedPrice?.deposit,
                              hasCalculatedPrice: !!quoteRequest.calculatedPrice,
                              calculatedPriceTotalPrice: quoteRequest.calculatedPrice?.totalPrice,
                              calculatedDeposit: (quoteRequest.calculatedPrice?.totalPrice ?? 0) * 0.3,
                              source: recalculatedPrice ? 'recalculatedPrice (serveur)' : 'quoteRequest.calculatedPrice * 0.3 (calculé client)'
                            });
                            return displayedDeposit.toFixed(2);
                          })()} €
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Reste (jour J)</span>
                        <span className="text-slate-500">
                          {(() => {
                            // ✅ CORRECTION: Calcul cohérent du reste
                            const total = recalculatedPrice?.total ?? quoteRequest.calculatedPrice?.totalPrice ?? 0;
                            const deposit = recalculatedPrice?.deposit ?? (total * 0.3);
                            const reste = total - deposit;
                            return reste.toFixed(2);
                          })()} €
                        </span>
                      </div>

                      <Separator />

                      <div className="flex justify-between font-bold text-base">
                        <span>À payer</span>
                        <span className="text-blue-600">
                          {(recalculatedPrice?.deposit ?? (quoteRequest.calculatedPrice?.totalPrice ?? 0) * 0.3).toFixed(2)} €
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite: Formulaire Stripe unifié (plus large) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5" />
                  Informations et paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Checkboxes CGV AVANT le formulaire Stripe */}
                <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer flex-1">
                      J'accepte les <a href="/cgv" target="_blank" className="text-blue-600 hover:underline font-medium">conditions générales de vente</a> *
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacy"
                      checked={acceptPrivacy}
                      onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                    />
                    <label htmlFor="privacy" className="text-sm text-slate-700 cursor-pointer flex-1">
                      J'accepte la <a href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">politique de confidentialité</a> *
                    </label>
                  </div>
                </div>

                {!acceptTerms || !acceptPrivacy ? (
                  <Alert>
                    <AlertDescription>
                      ⚠️ Veuillez accepter les conditions générales de vente et la politique de confidentialité pour continuer.
                    </AlertDescription>
                  </Alert>
                ) : !clientSecret ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600">Préparation du paiement sécurisé...</p>
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      sessionId={sessionId || ''}
                      depositAmount={recalculatedPrice?.deposit ?? (quoteRequest.calculatedPrice ? quoteRequest.calculatedPrice.totalPrice * 0.3 : 0)}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      acceptTerms={acceptTerms}
                      acceptPrivacy={acceptPrivacy}
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
