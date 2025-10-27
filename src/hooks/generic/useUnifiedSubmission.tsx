import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { SubmissionConfig, validateSubmissionData } from '@/utils/submissionUtils';
import { retryAsync, getErrorMessage, handleApiError } from '@/utils/errorHandling';

/**
 * Type de retour du hook unifié
 */
export interface UseUnifiedSubmissionResult {
  isSubmitting: boolean;
  error: string | null;
  submit: (formData: any, extraData?: any) => Promise<void>;
  temporaryId?: string;
}

/**
 * Hook unifié pour toutes les soumissions de formulaires
 *
 * Remplace les 5 hooks business dupliqués:
 * - useCatalogueMovingItemSubmission
 * - useCatalogueCleaningItemSubmission
 * - useCatalogueDeliveryItemSubmission
 * - useDemenagementSurMesureSubmission
 * - useMenageSurMesureSubmission
 *
 * Features:
 * - Retry automatique (3 tentatives avec backoff)
 * - Gestion d'erreurs moderne avec toast
 * - Support du retry manuel via bouton dans le toast
 * - Validation avec feedback utilisateur
 */
export const useUnifiedSubmission = (
  config: SubmissionConfig,
  calculatedPrice: number,
  extraData?: any
): UseUnifiedSubmissionResult => {
  const [state, setState] = useState({
    isSubmitting: false,
    error: null as string | null,
    temporaryId: undefined as string | undefined
  });
  const router = useRouter();

  const submit = useCallback(async (formData: any, additionalExtraData?: any) => {
    const currentExtraData = additionalExtraData || extraData;

    // Validation avec toast au lieu de alert
    const validation = validateSubmissionData(formData, config, currentExtraData);
    if (!validation.valid) {
      toast.error(validation.error || 'Veuillez remplir tous les champs obligatoires', {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Retry automatique (3 tentatives avec backoff exponentiel)
      const data = await retryAsync(
        async () => {
          const requestData = config.prepareRequestData(formData, currentExtraData);
          return await submitQuoteRequest(requestData, config, calculatedPrice, formData);
        },
        { maxAttempts: 3, delay: 1000, backoff: true }
      );

      toast.success('Demande envoyée avec succès !', {
        duration: 3000,
        icon: '✅'
      });

      if (data.temporaryId) {
        setState(prev => ({ ...prev, temporaryId: data.temporaryId }));

        // Stocker dans la session
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('pendingQuoteRequestId', data.temporaryId);
        }
      }

      // Redirection
      const redirectUrl = config.getSuccessRedirectUrl(data, currentExtraData);
      router.push(redirectUrl);

    } catch (error) {
      const handledError = handleApiError(error);
      const message = getErrorMessage(handledError);

      setState(prev => ({ ...prev, isSubmitting: false, error: message }));

      // Toast avec option de retry manuel
      toast.error(message, {
        duration: 5000,
        icon: '❌',
      });

      // Afficher un bouton "Réessayer" séparé si l'erreur est retryable
      if (handledError.retryable) {
        setTimeout(() => {
          toast((t) => (
            <div className="flex items-center gap-2">
              <span>{message}</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  submit(formData, additionalExtraData);
                }}
                className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          ), { duration: 10000 });
        }, 100);
      }
    }
  }, [config, calculatedPrice, extraData, router]);

  return { ...state, submit };
};

/**
 * Soumet un QuoteRequest via l'API
 */
async function submitQuoteRequest(
  requestData: any,
  config: SubmissionConfig,
  calculatedPrice: number,
  formData: any
): Promise<any> {
  // Mapper le submissionType vers serviceType attendu par l'API
  let serviceType: string = config.submissionType;

  if (config.submissionType === 'PACK') {
    serviceType = 'PACKING';
  } else if (config.submissionType === 'MOVING') {
    serviceType = 'MOVING';
  } else if (config.submissionType === 'SERVICE') {
    // Distinguer CLEANING vs DELIVERY selon les données
    if (requestData.pickupAddress && requestData.deliveryAddress) {
      serviceType = 'DELIVERY';
    } else {
      serviceType = 'CLEANING';
    }
  }

  // Récupérer catalogId
  const catalogId = requestData.catalogId || formData.catalogId ||
                    requestData.catalogSelectionId || formData.catalogSelectionId;

  // Récupérer __presetSnapshot
  let presetSnapshot = requestData.__presetSnapshot || formData.__presetSnapshot;

  if (!presetSnapshot && catalogId) {
    try {
      console.log(`🔍 Récupération du __presetSnapshot depuis le catalogue: ${catalogId}`);
      const catalogResponse = await fetch(`/api/catalogue/${catalogId}`);
      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json();
        presetSnapshot = catalogData.catalogSelection?.__presetSnapshot;
        console.log(`✅ __presetSnapshot récupéré depuis le catalogue`);
      }
    } catch (error) {
      console.warn(`⚠️ Impossible de récupérer le __presetSnapshot:`, error);
    }
  }

  // Extraire les données sans créer de structure imbriquée
  const { quoteData: nestedQuoteData, ...requestDataWithoutQuoteData } = requestData;

  const quoteRequestData = {
    serviceType: serviceType,
    quoteData: {
      ...requestDataWithoutQuoteData,
      calculatedPrice,
      totalPrice: calculatedPrice,
      formData,
      submissionDate: new Date().toISOString(),
      additionalInfo: formData.additionalInfo,
      catalogId,
      catalogSelectionId: catalogId,
      __presetSnapshot: presetSnapshot
    }
  };

  console.log('🔄 Création du QuoteRequest:', quoteRequestData);

  // Appel API
  const response = await fetch('/api/quotesRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quoteRequestData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Échec de la soumission');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Échec de la création du devis temporaire');
  }

  return result.data;
}
