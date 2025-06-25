import { NotificationService } from '@/utils/notificationService';

export interface SubmissionConfig {
  submissionType: 'MOVING' | 'PACK' | 'SERVICE';
  validateFormData: (formData: any, extraData?: any) => boolean | string;
  prepareRequestData: (formData: any, extraData?: any) => any;
  getSuccessRedirectUrl: (responseData: any, extraData?: any) => string;
  getNotificationData?: (formData: any, responseData: any, extraData?: any) => any;
}

// Appel API standardisé pour la soumission
export const callSubmissionAPI = async (type: string, data: any) => {
  const response = await fetch('/api/quotes/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      [type.toLowerCase()]: data // moving, pack, ou service
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Échec de la création de la demande de devis ${type}`);
  }

  return response.json();
};

// Extraction d'informations de contact depuis additionalInfo
export const extractContactInfo = (additionalInfo?: string) => {
  if (!additionalInfo) return { email: null, name: null, phone: null };

  // Extraction d'email
  const emailMatch = additionalInfo.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : null;

  // Extraction de nom
  let name = 'Client';
  const nameMatch = additionalInfo.match(/[Nn]om\s*[:=]?\s*([A-Za-z\s]+)/);
  if (nameMatch && nameMatch[1]) {
    name = nameMatch[1].trim();
  }

  // Extraction de téléphone
  const phoneMatch = additionalInfo.match(/(\+?\d{10,15})/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  return { email, name, phone };
};

// Envoi de notification standardisé
export const sendSubmissionNotification = async (
  formData: any,
  responseData: any,
  calculatedPrice: number,
  config: SubmissionConfig,
  extraData?: any
) => {
  try {
    if (!config.getNotificationData) return;

    const notificationData = config.getNotificationData(formData, responseData, extraData);
    const { email, name, phone } = extractContactInfo(formData.additionalInfo);

    if (email && notificationData) {
      console.log(`📧 Envoi d'une notification de confirmation de devis ${config.submissionType}`);
      
      await NotificationService.sendQuoteConfirmation({
        email,
        phone,
        clientName: name,
        quoteId: responseData.id,
        serviceDate: notificationData.serviceDate,
        serviceAddress: notificationData.serviceAddress,
        amount: calculatedPrice,
        whatsappOptIn: formData.whatsappOptIn,
        additionalDetails: notificationData.additionalDetails
      });
    }
  } catch (notificationError) {
    console.error(`⚠️ Erreur lors de l'envoi de la notification de devis ${config.submissionType}:`, notificationError);
    // Ne pas bloquer le flux principal
  }
};

// Gestion du stockage session et redirection
export const handleSuccessRedirect = async (
  responseData: any,
  config: SubmissionConfig,
  router: any,
  startTime: number,
  extraData?: any
) => {
  // Stocker l'ID du devis dans la session
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('pendingQuoteRequestId', responseData.id);
  }

  // Délai UX minimal
  const elapsedTime = Date.now() - startTime;
  const minDelay = 1000; // 1 seconde minimum

  if (elapsedTime < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - elapsedTime));
  }

  // Redirection
  const redirectUrl = config.getSuccessRedirectUrl(responseData, extraData);
  router.push(redirectUrl);
};

// Validation standardisée avec gestion d'erreur
export const validateSubmissionData = (
  formData: any,
  config: SubmissionConfig,
  extraData?: any
): boolean => {
  const validationResult = config.validateFormData(formData, extraData);
  
  if (typeof validationResult === 'string') {
    alert(validationResult);
    return false;
  }
  
  if (!validationResult) {
    alert('Veuillez remplir tous les champs obligatoires.');
    return false;
  }
  
  return true;
};

// Logging standardisé pour la submission
export const logSubmission = {
  start: (submissionType: string, data: any) => {
    console.log(`📤 ${submissionType} - Données envoyées pour la soumission:`, data);
  },
  success: (submissionType: string, responseData: any) => {
    console.log(`✅ ${submissionType} - Réponse de création de devis:`, responseData);
  },
  error: (submissionType: string, error: any) => {
    console.error(`❌ ${submissionType} - Erreur lors de la soumission:`, error);
  }
}; 