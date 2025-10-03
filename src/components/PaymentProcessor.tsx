import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StripeElementsProvider, PaymentForm } from '@/components/StripeElements';
import { logger } from '@/lib/logger';

// Créer un logger sécurisé qui fonctionne même si withContext n'est pas disponible
const paymentLogger = logger.withContext ? 
  logger.withContext('PaymentProcessor') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[PaymentProcessor]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[PaymentProcessor]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[PaymentProcessor]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[PaymentProcessor]', msg, ...args)
  };

interface PaymentData {
  id: string;
  amount: number;
  description?: string;
  redirectUrl?: string;
  metadata?: Record<string, string>;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: Error) => void;
}

interface PaymentProcessorProps {
  paymentData: PaymentData;
  serviceName?: string;
  orderSummary?: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
}

/**
 * Composant unifié pour traiter les paiements Stripe
 * Utilisable dans toutes les sections de l'application
 */
export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  paymentData,
  serviceName = 'Service',
  orderSummary,
  showBackButton = true,
  backUrl = '/catalogue'
}) => {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Initialiser le paiement
  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!paymentData.id || !paymentData.amount) {
        throw new Error('Les données de paiement sont incomplètes (ID ou montant manquant)');
      }

      paymentLogger.info(`Création d'une intention de paiement`, {
        id: paymentData.id,
        amount: paymentData.amount,
        service: serviceName
      });

      // Créer l'intention de paiement via notre nouvelle API
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: paymentData.id,
          amount: paymentData.amount,
          description: paymentData.description || `Paiement pour ${serviceName}`,
          metadata: paymentData.metadata || {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'intention de paiement');
      }

      const result = await response.json();
      paymentLogger.debug('Intention de paiement créée', { clientSecret: 'SECRET' });
      setClientSecret(result.clientSecret);
    } catch (err) {
      paymentLogger.error('Erreur lors de l\'initialisation du paiement', err as Error);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      
      if (paymentData.onError) {
        paymentData.onError(err instanceof Error ? err : new Error('Erreur lors de l\'initialisation du paiement'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialiser automatiquement le paiement si le clientSecret n'est pas défini
  React.useEffect(() => {
    if (!clientSecret && !loading && !error) {
      initializePayment();
    }
  }, [clientSecret, loading, error]);

  // Gestion de succès du paiement
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setProcessing(true);
      
      paymentLogger.info(`Paiement réussi`, { paymentIntentId: paymentIntentId.substring(0, 8) + '...' });
      
      // Vérifier le statut du paiement via notre API
      const verificationResponse = await fetch(`/api/payment/verify/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.message || 'Erreur lors de la vérification du paiement');
      }
      
      if (paymentData.onSuccess) {
        await paymentData.onSuccess(paymentIntentId);
      }
      
      // Rediriger vers l'URL de succès ou l'URL par défaut
      let redirectUrl;
      if (paymentData.redirectUrl) {
        // Si c'est une URL de succès personnalisée, utiliser l'ID de réservation
        if (paymentData.redirectUrl.includes('/success/')) {
          redirectUrl = `${paymentData.redirectUrl}${paymentData.id}`;
        } else {
          redirectUrl = `${paymentData.redirectUrl}${paymentIntentId}`;
        }
      } else {
        redirectUrl = `/success?payment_intent=${paymentIntentId}`;
      }
      
      paymentLogger.debug(`Redirection vers: ${redirectUrl}`);
      router.push(redirectUrl);
    } catch (err) {
      paymentLogger.error('Erreur après paiement réussi', err as Error);
      setError(err instanceof Error ? err.message : 'Erreur lors de la finalisation du paiement');
      
      if (paymentData.onError) {
        paymentData.onError(err instanceof Error ? err : new Error('Erreur après paiement réussi'));
      }
    } finally {
      setProcessing(false);
    }
  };

  // Gestion d'erreur du paiement
  const handlePaymentError = (errorMessage: string) => {
    paymentLogger.error('Erreur de paiement', { message: errorMessage });
    setError(`Erreur de paiement: ${errorMessage}`);
    setProcessing(false);
    
    if (paymentData.onError) {
      paymentData.onError(new Error(errorMessage));
    }
  };

  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Afficher l'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Une erreur est survenue</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              onClick={initializePayment}
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le formulaire de paiement
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        {orderSummary && (
          <div className="mb-6 border-b border-gray-200 pb-4">
            {orderSummary}
          </div>
        )}
        
        <div className="bg-emerald-50 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-emerald-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-emerald-800">
              <span className="font-medium">Paiement sécurisé</span>: Vos données bancaires sont protégées
            </p>
          </div>
        </div>

        {clientSecret ? (
          <StripeElementsProvider clientSecret={clientSecret}>
            <PaymentForm 
              amount={paymentData.amount} 
              clientSecret={clientSecret}
              onSuccess={(paymentIntentId: string) => handlePaymentSuccess(paymentIntentId)}
              onError={handlePaymentError}
            />
          </StripeElementsProvider>
        ) : (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        )}
      </div>
      
      {showBackButton && (
        <div className="mt-4">
          <button
            onClick={() => router.push(backUrl)}
            className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center"
          >
            <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Retour
          </button>
        </div>
      )}
    </div>
  );
}; 