'use client'

import React, { useState, useEffect, useMemo } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { stripeConfig } from '@/config/stripe';

// Vérifier que la clé publique est présente et non vide
const stripePublicKey = stripeConfig.publicKey || '';

// Log pour le débogage
console.log('Stripe config:', {
  keyPresent: Boolean(stripePublicKey),
  keyLength: stripePublicKey.length,
  isConfigured: stripeConfig.isConfigured(),
  publicKeyPrefix: stripePublicKey.substring(0, 7)
});

// Variable globale pour stocker l'instance Stripe et son statut
let stripeInstance: Promise<Stripe | null> | null = null;
let stripeLoadError: Error | null = null;

// Fonction pour initialiser Stripe de manière sécurisée
const getStripe = () => {
  if (!stripeInstance && stripePublicKey) {
    console.log('Initialisation de l\'instance Stripe avec la clé publique');
    try {
      stripeInstance = loadStripe(stripePublicKey);
      
      // Log pour confirmer que la promesse a été créée
      stripeInstance.then(
        stripe => { 
          console.log('Stripe chargé avec succès');
          stripeLoadError = null;
        },
        error => {
          console.error('Erreur de chargement Stripe:', error);
          stripeLoadError = error instanceof Error ? error : new Error('Erreur inconnue');
          // Réinitialiser pour permettre une nouvelle tentative
          stripeInstance = null;
        }
      );
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Stripe:', error);
      stripeLoadError = error instanceof Error ? error : new Error('Erreur inconnue');
      stripeInstance = Promise.reject(error);
    }
  }
  return stripeInstance;
};

// Initialiser Stripe une seule fois et stocker la promesse
const stripePromise = getStripe();

// Fonction pour vérifier si Stripe est disponible
const isStripeAvailable = async (): Promise<boolean> => {
  try {
    const stripe = await stripePromise;
    return !!stripe;
  } catch (error) {
    return false;
  }
};

// Fonction pour vérifier si une erreur est liée à une clé API invalide
const isInvalidApiKeyError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('Invalid API Key');
  }
  return false;
};

// Nouvelle fonction utilitaire pour déterminer la page de succès
async function getSuccessPageUrl() {
  // Essayer d'obtenir la réservation actuelle
  try {
    const { getCurrentBooking } = await import('@/actions/bookingManager');
    const booking = await getCurrentBooking();
    
    // Si pas de réservation, rediriger vers le catalogue
    if (!booking || !booking.id) {
      return `${window.location.origin}/catalogue`;
    }
    
    // Rediriger vers la page de détail de la réservation
    return `${window.location.origin}/bookings/${booking.id}`;
  } catch (error) {
    console.error('Error getting success page URL:', error);
    // En cas d'erreur, rediriger vers le catalogue
    return `${window.location.origin}/catalogue`;
  }
}

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  returnUrl?: string;
  amount: number;
  currency?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  onSuccess,
  onError,
  returnUrl,
  amount,
  currency = 'eur'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ✅ États pour les données client (OBLIGATOIRES)
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [stripeError, setStripeError] = useState<boolean>(false);
  const [elementReady, setElementReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<boolean>(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Vérifier l'initialisation de Stripe
  useEffect(() => {
    if (!stripe) {
      console.warn('Stripe n\'est pas correctement initialisé dans PaymentForm');
      setStripeError(true);
      
      // Si après un délai, Stripe n'est toujours pas initialisé, considérer qu'il y a une erreur d'authentification
      const id = setTimeout(() => {
        if (stripeLoadError) {
          console.error('Erreur d\'authentification Stripe détectée:', stripeLoadError);
          setAuthError(true);
        }
      }, 5000);
      
      setTimeoutId(id);
    } else {
      console.log('Stripe initialisé avec succès dans PaymentForm');
      setStripeError(false);
      
      // Annuler le timeout si Stripe est initialisé
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
    
    // Nettoyage du timer
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [stripe]);

  // Vérifier si les éléments rencontrent une erreur de chargement
  useEffect(() => {
    // Fonction pour gérer les erreurs de chargement des éléments
    const handleLoaderError = (event: any) => {
      if (event && event.error && event.error.type === 'invalid_request_error') {
        console.error('Erreur d\'authentification Stripe lors du chargement des éléments:', event.error);
        setAuthError(true);
      }
    };

    // Ajouter un écouteur d'événement pour les erreurs de chargement
    window.addEventListener('stripe-elements-loader-error', handleLoaderError);

    // Nettoyage
    return () => {
      window.removeEventListener('stripe-elements-loader-error', handleLoaderError);
    };
  }, []);

  // Vérifier si on revient d'une redirection
  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Vérifier si on revient d'une redirection de paiement
    const handleStatusChange = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentResult = urlParams.get('payment_intent_client_secret');
      
      if (paymentIntentResult) {
        try {
          console.log('Récupération du statut du paiement après redirection');
          const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentResult);
          
          if (paymentIntent?.status === 'succeeded') {
            console.log('Paiement réussi');
            onSuccess(paymentIntent.id);
          } else if (paymentIntent?.status === 'processing') {
            // Le paiement est en cours de traitement
            console.log('Paiement en cours de traitement');
            setErrorMessage('Votre paiement est en cours de traitement.');
          } else {
            console.error('Paiement échoué avec statut:', paymentIntent?.status);
            setErrorMessage(`Le paiement a échoué. Veuillez réessayer.`);
            onError('Le paiement a échoué');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du paiement:', error);
          setErrorMessage('Erreur lors de la vérification du statut de paiement.');
          onError('Erreur technique');
        }
      }
    };

    handleStatusChange();
  }, [stripe, onSuccess, onError]);

  // Gestionnaire d'événement pour la montage complet du PaymentElement
  const handleElementReady = () => {
    console.log('PaymentElement monté et prêt');
    setElementReady(true);
  };

  // Gestionnaire d'erreur pour le PaymentElement
  const handleElementError = (event: any) => {
    console.error('Erreur du PaymentElement:', event);
    if (event && event.error && event.error.type === 'invalid_request_error') {
      setAuthError(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js n'est pas encore chargé
      console.error('Stripe ou Elements non disponible lors de la soumission du formulaire');
      setErrorMessage('Le service de paiement n\'est pas disponible actuellement. Veuillez réessayer dans quelques instants.');
      return;
    }

    if (!elementReady) {
      console.error('Le formulaire de paiement n\'est pas encore prêt');
      setErrorMessage('Le formulaire de paiement est en cours de chargement. Veuillez patienter et réessayer.');
      return;
    }

    // ✅ Validation des champs obligatoires
    if (!customerEmail || !customerName || !customerPhone) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires (email, nom, téléphone).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      setIsLoading(true);

      // ✅ Démarrer le processus de paiement AVEC les billing details
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || await getSuccessPageUrl(),
          payment_method_data: {
            billing_details: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone
            }
          }
        },
        redirect: 'if_required'
      });

      if (result.error) {
        console.error('Erreur lors de la confirmation du paiement:', result.error);
        const errorMessage = result.error.message || 'Une erreur est survenue lors du paiement';
        setErrorMessage(errorMessage);
        onError(errorMessage);
      } else if (result.paymentIntent) {
        // Paiement réussi sans redirection
        if (result.paymentIntent.status === 'succeeded') {
          console.log('Paiement réussi sans redirection');
          onSuccess(result.paymentIntent.id);
        } else {
          const statusMessage = `Statut du paiement: ${result.paymentIntent.status}`;
          console.warn(statusMessage);
          setErrorMessage(statusMessage);
          onError(statusMessage);
        }
      }
    } catch (error) {
      console.error('Exception lors de la confirmation du paiement:', error);
      setErrorMessage('Erreur lors de la connexion au service de paiement.');
      onError('Erreur technique');
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher une erreur si Stripe n'est pas correctement initialisé
  if (authError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-700 font-medium mb-2">Erreur d'authentification avec Stripe</h3>
        <p className="text-red-600 text-sm mb-2">
          La connexion avec le service de paiement n'a pas pu être établie. Votre clé API Stripe semble invalide.
        </p>
        <p className="text-red-600 text-sm">
          Veuillez contacter l'administrateur du site pour résoudre ce problème.
        </p>
      </div>
    );
  }

  if (stripeError && !authError) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-yellow-700 font-medium mb-2">Initialisation du service de paiement...</h3>
        <p className="text-yellow-600 text-sm">
          Le service de paiement est en cours d'initialisation. Si rien ne se passe après quelques secondes, veuillez rafraîchir la page.
        </p>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ✅ SECTION: Informations client (OBLIGATOIRE) */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Vos informations <span className="text-red-500 ml-1">*</span>
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm text-gray-700 mb-1">
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
            <label htmlFor="customerEmail" className="block text-sm text-gray-700 mb-1">
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
            <label htmlFor="customerPhone" className="block text-sm text-gray-700 mb-1">
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
        </div>
      </div>

      {/* ✅ SECTION: Paiement par carte */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Informations de paiement
        </h3>

        <div className="mb-4">
          <PaymentElement
            onReady={handleElementReady}
            onLoadError={handleElementError}
            options={{
              fields: {
                billingDetails: {
                  name: 'never',  // On va créer notre propre champ
                  email: 'never', // On va créer notre propre champ
                  phone: 'never', // On va créer notre propre champ
                  address: {
                    country: 'never',
                    postalCode: 'never'
                  }
                }
              },
              // ✅ FORCER la collecte des billing_details (nom, email, téléphone)
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: true
              }
            }}
          />
        </div>
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {errorMessage}
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Montant à payer: {(amount).toFixed(2)} {currency.toUpperCase()}</p>
          <p className="mt-1">Paiement sécurisé par Stripe. Vos données de carte ne sont jamais stockées sur nos serveurs.</p>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isLoading || !elementReady}
        className="w-full rounded-md border border-transparent shadow-lg bg-violet-600 hover:bg-violet-700 py-3 px-4 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement en cours...
          </>
        ) : !elementReady ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement du formulaire...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Payer maintenant
          </>
        )}
      </button>
    </form>
  );
};

interface StripeElementsProps {
  clientSecret: string;
  children: React.ReactNode;
}

export const StripeElementsProvider: React.FC<StripeElementsProps> = ({ clientSecret, children }) => {
  const [stripeLoadError, setStripeLoadError] = useState<boolean>(false);
  const [stripeReady, setStripeReady] = useState<boolean>(false);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [authError, setAuthError] = useState<boolean>(false);
  
  // Utiliser useMemo pour créer les options avec le clientSecret
  // Cela garantit que les options ne changent pas d'identité à chaque rendu
  // sauf si clientSecret change, ce qui évite les re-rendus inutiles
  const options = useMemo(() => {
    console.log(`Initialisation des options Elements avec client secret (longueur: ${clientSecret?.length || 0})`);
    return {
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#8b5cf6', // Couleur violet de TailwindCSS
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          borderRadius: '0.375rem',
        }
      },
      // ✅ FORCER la collecte des billing_details
      defaultValues: {
        billingDetails: {
          name: '',
          email: '',
          phone: '',
          address: {
            country: 'FR'
          }
        }
      }
    };
  }, [clientSecret]);

  // Utiliser une clé unique basée sur clientSecret pour forcer le remontage
  // du composant Elements lorsque clientSecret change
  const elementsKey = `stripe-elements-${clientSecret?.substring(0, 10) || 'uninitialized'}`;
  console.log(`Rendu de StripeElementsProvider avec clé: ${elementsKey}`);

  // Vérifier périodiquement si Stripe est disponible, avec un maximum de tentatives
  useEffect(() => {
    // Si déjà prêt ou erreur, ne pas continuer
    if (stripeReady || stripeLoadError || authError) return;
    
    // Limiter le nombre de vérifications pour éviter une boucle infinie
    if (checkCount >= 5) {
      console.error('Nombre maximum de tentatives atteint pour charger Stripe');
      setStripeLoadError(true);
      return;
    }
    
    const checkStripe = async () => {
      try {
        const available = await isStripeAvailable();
        if (available) {
          console.log('Stripe est disponible après vérification');
          setStripeReady(true);
        } else if (stripeLoadError) {
          console.error('Stripe n\'est pas disponible et a rencontré une erreur');
          setStripeLoadError(true);
          // Vérifier si c'est un problème d'authentification
          if (isInvalidApiKeyError(stripeLoadError)) {
            setAuthError(true);
          }
        } else {
          // Programmer une nouvelle vérification après un délai
          setTimeout(() => {
            setCheckCount(prev => prev + 1);
          }, 1000);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de Stripe:', error);
        setStripeLoadError(true);
      }
    };
    
    checkStripe();
  }, [checkCount, stripeReady, stripeLoadError, authError]);

  // Gérer les erreurs d'initialisation de Stripe
  useEffect(() => {
    // Utiliser une fonction auto-exécutée asynchrone
    (async () => {
      try {
        const stripe = await stripePromise;
        if (stripe) {
          console.log('Stripe chargé avec succès dans StripeElementsProvider');
          setStripeReady(true);
        } else {
          throw new Error('Stripe est null après initialisation');
        }
      } catch (error) {
        console.error('Erreur de chargement Stripe dans StripeElementsProvider:', error);
        setStripeLoadError(true);
        
        // Vérifier si c'est une erreur d'authentification
        if (error instanceof Error && error.message.includes('Invalid API Key')) {
          setAuthError(true);
        }
      }
    })();
    
    // Fonction pour intercepter les erreurs Stripe au niveau global
    const handleStripeError = (event: any) => {
      if (event && event.detail && event.detail.error && 
          event.detail.error.type === 'invalid_request_error') {
        console.error('Erreur d\'authentification Stripe détectée:', event.detail.error);
        setAuthError(true);
      }
    };
    
    // Ajouter un écouteur pour les erreurs Stripe
    window.addEventListener('stripe-error', handleStripeError);
    
    // Nettoyage
    return () => {
      window.removeEventListener('stripe-error', handleStripeError);
    };
  }, []);

  // Si une erreur d'authentification est détectée
  if (authError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-700 font-medium mb-2">Erreur d'authentification avec Stripe</h3>
        <p className="text-red-600 text-sm mb-2">
          La connexion avec le service de paiement n'a pas pu être établie. Votre clé API Stripe semble invalide.
        </p>
        <p className="text-red-600 text-sm">
          Veuillez contacter l'administrateur du site pour résoudre ce problème.
        </p>
      </div>
    );
  }

  // Si une erreur est survenue lors du chargement de Stripe
  if (stripeLoadError && !authError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-700 font-medium mb-2">Erreur de configuration du paiement</h3>
        <p className="text-red-600 text-sm">
          Le service de paiement n'a pas pu être chargé. Veuillez rafraîchir la page ou contacter l'administrateur du site.
        </p>
      </div>
    );
  }

  if (!clientSecret) {
    console.warn('StripeElementsProvider: clientSecret est null ou vide');
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stripeReady) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Chargement du service de paiement...</p>
      </div>
    );
  }

  return (
    <Elements key={elementsKey} stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}; 