import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  SubmissionConfig,
  callSubmissionAPI,
  sendSubmissionNotification,
  handleSuccessRedirect,
  validateSubmissionData,
  logSubmission
} from '@/utils/submissionUtils';

export interface UseSubmissionResult {
  isSubmitting: boolean;
  submit: (formData: any, extraData?: any) => Promise<void>;
}

export const useSubmission = (
  config: SubmissionConfig,
  calculatedPrice: number,
  extraData?: any
): UseSubmissionResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      
      // Appel API principal
      const responseData = await callSubmissionAPI(config.submissionType, requestData);
      
      // Logging du succès
      logSubmission.success(config.submissionType, responseData);
      
      if (responseData.id) {
        // Envoi de notification (optionnel)
        await sendSubmissionNotification(
          formData, 
          responseData, 
          calculatedPrice, 
          config, 
          currentExtraData
        );
        
        // Stockage session et redirection
        await handleSuccessRedirect(
          responseData, 
          config, 
          router, 
          startTime, 
          currentExtraData
        );
      } else {
        throw new Error('ID de devis manquant dans la réponse');
      }
      
    } catch (error) {
      logSubmission.error(config.submissionType, error);

      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [config, calculatedPrice, extraData, router]);

  return {
    isSubmitting,
    submit
  };
}; 