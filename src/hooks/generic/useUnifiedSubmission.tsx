import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { SubmissionConfig, validateSubmissionData } from '@/utils/submissionUtils';
import { retryAsync, getErrorMessage, handleApiError } from '@/utils/errorHandling';
import { devLog } from '@/lib/conditional-logger';

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
    devLog.info('\n\n\n═══ DEBUT useUnifiedSubmission.submit ═══');
    devLog.info('📁 [useUnifiedSubmission.tsx] ▶️ Début soumission unifiée');
    devLog.info(`📁 [useUnifiedSubmission.tsx] Type: ${config.submissionType}`);
    
    const currentExtraData = additionalExtraData || extraData;

    // Validation avec toast au lieu de alert
    const validation = validateSubmissionData(formData, config, currentExtraData);
    if (!validation.valid) {
      devLog.warn('📁 [useUnifiedSubmission.tsx] ❌ Validation échouée:', validation.error);
      toast.error(validation.error || 'Veuillez remplir tous les champs obligatoires', {
        duration: 4000,
        icon: '⚠️'
      });
      devLog.info('📁 [useUnifiedSubmission.tsx] ⏹ Fin useUnifiedSubmission.submit (validation échouée)');
      devLog.info('═══⏹ FIN useUnifiedSubmission.submit ═══\n\n\n');
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
      devLog.info(`📁 [useUnifiedSubmission.tsx] ✅ Soumission réussie, redirection vers: ${redirectUrl}`);
      router.push(redirectUrl);
      devLog.info('📁 [useUnifiedSubmission.tsx] ⏹ Fin useUnifiedSubmission.submit (succès)');
      devLog.info('═══⏹ FIN useUnifiedSubmission.submit ═══\n\n\n');

    } catch (error) {
      const handledError = handleApiError(error);
      const message = getErrorMessage(handledError);

      devLog.error('📁 [useUnifiedSubmission.tsx] ❌ Erreur lors de la soumission:', error);
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
      devLog.info('📁 [useUnifiedSubmission.tsx] ⏹ Fin useUnifiedSubmission.submit (erreur)');
      devLog.info('═══⏹ FIN useUnifiedSubmission.submit ═══\n\n\n');
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
  devLog.info('\n\n\n═══ DEBUT submitQuoteRequest ═══');
  devLog.info('📁 [useUnifiedSubmission.tsx] ▶️ Début soumission QuoteRequest');
  devLog.info(`📁 [useUnifiedSubmission.tsx] Type: ${config.submissionType}, Prix: ${calculatedPrice}€`);
  
  // Seul le déménagement est actif ; tous les types mappés vers MOVING
  const serviceType: string = 'MOVING';

  devLog.info(`📁 [useUnifiedSubmission.tsx] ServiceType mappé: ${serviceType}`);

  // API catalogue supprimée (2026-02) - catalogId conservé dans payload pour compatibilité
  const catalogId = requestData.catalogId || formData.catalogId ||
                    requestData.catalogSelectionId || formData.catalogSelectionId;
  const presetSnapshot = requestData.__presetSnapshot || formData.__presetSnapshot;

  // Extraire les données sans créer de structure imbriquée
  const { quoteData: nestedQuoteData, ...requestDataWithoutQuoteData } = requestData;

  // ✅ Structure plate normalisée (sans duplication formData)
  // Priorité au prix du scénario sélectionné (dans requestData) sur le prix recommandé (paramètre du hook)
  const submittedPrice = requestDataWithoutQuoteData.calculatedPrice || calculatedPrice;
  const submittedTotalPrice = requestDataWithoutQuoteData.totalPrice || submittedPrice;

  const quoteRequestData = {
    serviceType: serviceType,
    quoteData: {
      ...requestDataWithoutQuoteData,
      calculatedPrice: submittedPrice,
      totalPrice: submittedTotalPrice,
      submissionDate: new Date().toISOString(),
      catalogId,
      catalogSelectionId: catalogId,
      __presetSnapshot: presetSnapshot
    }
  };

  devLog.info('📁 [useUnifiedSubmission.tsx] 🔄 Création du QuoteRequest pour envoi API');

  // Appel API
  devLog.info('📁 [useUnifiedSubmission.tsx] 📤 Envoi POST /api/quotesRequest');
  const response = await fetch('/api/quotesRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quoteRequestData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    devLog.error('📁 [useUnifiedSubmission.tsx] ❌ Erreur API:', errorData);
    devLog.info('📁 [useUnifiedSubmission.tsx] ⏹ Fin submitQuoteRequest (erreur)');
    devLog.info('═══⏹ FIN submitQuoteRequest ═══\n\n\n');
    throw new Error(errorData.error || 'Échec de la soumission');
  }

  const result = await response.json();

  if (!result.success) {
    devLog.error('📁 [useUnifiedSubmission.tsx] ❌ Échec création devis:', result.message);
    devLog.info('📁 [useUnifiedSubmission.tsx] ⏹ Fin submitQuoteRequest (échec)');
    devLog.info('═══⏹ FIN submitQuoteRequest ═══\n\n\n');
    throw new Error(result.message || 'Échec de la création du devis temporaire');
  }

  devLog.info(`📁 [useUnifiedSubmission.tsx] ✅ QuoteRequest créé avec succès: ${result.data?.temporaryId}`);
  devLog.info('📁 [useUnifiedSubmission.tsx] ⏹ Fin submitQuoteRequest (succès)');
  devLog.info('═══⏹ FIN submitQuoteRequest ═══\n\n\n');
  
  return result.data;
}
