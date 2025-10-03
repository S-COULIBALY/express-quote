import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  SubmissionConfig, 
  validateSubmissionData,
  logSubmission
} from '@/utils/submissionUtils';

export interface UseQuoteRequestSubmissionResult {
  isSubmitting: boolean;
  submit: (formData: any, extraData?: any) => Promise<void>;
  temporaryId?: string;
}

export const useQuoteRequestSubmission = (
  config: SubmissionConfig,
  calculatedPrice: number,
  extraData?: any
): UseQuoteRequestSubmissionResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [temporaryId, setTemporaryId] = useState<string>();
  const router = useRouter();

  const submit = useCallback(async (formData: any, additionalExtraData?: any) => {
    const currentExtraData = additionalExtraData || extraData;

    // Validation des données
    if (!validateSubmissionData(formData, config, currentExtraData)) {
      return;
    }

    setIsSubmitting(true);
    const startTime = Date.now();

    try {
      // Préparation des données pour l'API
      const requestData = config.prepareRequestData(formData, currentExtraData);
      
      // Logging du début de la soumission
      logSubmission.start(config.submissionType, requestData);
      
      // Créer le QuoteRequest au lieu d'un Booking
      const quoteRequestData = await createQuoteRequest(requestData, config, calculatedPrice, formData);
      
      // Logging du succès
      logSubmission.success(config.submissionType, quoteRequestData);
      
      if (quoteRequestData.temporaryId) {
        setTemporaryId(quoteRequestData.temporaryId);
        
        // Stocker dans la session
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('pendingQuoteRequestId', quoteRequestData.temporaryId);
        }
        
        // Rediriger vers la page summary
        const redirectUrl = `/summary/quote/${quoteRequestData.temporaryId}`;
        
        console.log(`🎯 Redirection vers: ${redirectUrl}`);
        router.push(redirectUrl);
      } else {
        throw new Error('ID temporaire manquant dans la réponse');
      }
      
    } catch (error) {
      logSubmission.error(config.submissionType, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [config, calculatedPrice, extraData, router]);

  return {
    isSubmitting,
    submit,
    temporaryId
  };
};

/**
 * Crée un QuoteRequest avec les données du formulaire
 */
async function createQuoteRequest(
  requestData: any,
  config: SubmissionConfig,
  calculatedPrice: number,
  formData: any
): Promise<any> {
  // Préparer les données pour le QuoteRequest
  // Note: customerInfo n'est pas inclus à ce stade car les infos utilisateur
  // ne sont pas collectées dans le formulaire catalogue
  
  // ✅ Mapper le submissionType vers serviceType attendu par l'API
  // Pour distinguer les types de SERVICE, on regarde les données de la requête
  let serviceType: string = config.submissionType;
  
  if (config.submissionType === 'PACK') {
    serviceType = 'PACKING';      // Packs du catalogue → ServiceType.PACKING
  } else if (config.submissionType === 'MOVING') {
    serviceType = 'MOVING';       // Déménagements premium → ServiceType.MOVING  
  } else if (config.submissionType === 'SERVICE') {
    // Distinguer CLEANING vs DELIVERY selon les données
    if (requestData.pickupAddress && requestData.deliveryAddress) {
      serviceType = 'DELIVERY';   // Service avec 2 adresses → ServiceType.DELIVERY
    } else {
      serviceType = 'CLEANING';   // Service avec 1 adresse → ServiceType.CLEANING
    }
  }
  
  // ✅ Récupérer catalogId depuis requestData ou formData pour le linking avec le catalogue
  const catalogId = requestData.catalogId || formData.catalogId || requestData.catalogSelectionId || formData.catalogSelectionId;
  
  // ✅ CRITIQUE : Récupérer le __presetSnapshot depuis les données du catalogue
  let presetSnapshot = requestData.__presetSnapshot || formData.__presetSnapshot;
  
  // Si le snapshot n'est pas dans les données, essayer de le récupérer depuis le catalogue
  if (!presetSnapshot && catalogId) {
    try {
      console.log(`🔍 Récupération du __presetSnapshot depuis le catalogue: ${catalogId}`);
      const catalogResponse = await fetch(`/api/catalogue/${catalogId}`);
      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json();
        presetSnapshot = catalogData.catalogSelection?.__presetSnapshot;
        console.log(`✅ __presetSnapshot récupéré depuis le catalogue:`, presetSnapshot);
      }
    } catch (error) {
      console.warn(`⚠️ Impossible de récupérer le __presetSnapshot depuis le catalogue:`, error);
    }
  }
  
  // ✅ CORRECTION : Extraire les données sans créer de structure imbriquée
  const { quoteData: nestedQuoteData, ...requestDataWithoutQuoteData } = requestData;
  
  const quoteRequestData = {
    serviceType: serviceType, // ✅ Utiliser serviceType au lieu de type
    quoteData: {
      ...requestDataWithoutQuoteData, // ✅ Éviter la structure imbriquée
      calculatedPrice,
      totalPrice: calculatedPrice,
      formData,
      submissionDate: new Date().toISOString(),
      additionalInfo: formData.additionalInfo,
      // ✅ Ajouter catalogId pour le linking avec catalogue
      catalogId,
      catalogSelectionId: catalogId, // Alias pour compatibilité
      // ✅ AJOUT CRITIQUE : Stocker le __presetSnapshot pour la comparaison à la soumission
      __presetSnapshot: presetSnapshot
    }
  };

  console.log('🔄 Création du QuoteRequest:', quoteRequestData);

  // Appel API pour créer le QuoteRequest
  const response = await fetch('/api/quotesRequest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(quoteRequestData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Échec de la création du devis temporaire');
  }

  const responseData = await response.json();
  
  if (!responseData.success) {
    throw new Error(responseData.message || 'Échec de la création du devis temporaire');
  }

  return responseData.data;
} 