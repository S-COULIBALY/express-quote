import { useSubmission } from '../../generic/useSubmission';
import { createMovingSubmissionConfig, MovingSubmissionExtraData } from './movingSubmissionConfig';

export const useMovingSubmission = (calculatedPrice: number, quoteDetails: any, addressDetails: any) => {
  // Configuration pour la submission générique
  const config = createMovingSubmissionConfig();
  
  // Données extra pour la submission
  const extraData: MovingSubmissionExtraData = {
    quoteDetails,
    addressDetails
  };
  
  // Utiliser le hook générique
  const { isSubmitting, submit: submitMoving } = useSubmission(config, calculatedPrice, extraData);

  return {
    isSubmitting,
    submitMoving
  };
};

// Fonctions utilitaires réutilisées (gardées pour compatibilité)
const getElevatorLabel = (value: string): string => {
  const labels: Record<string, string> = {
    no: 'Aucun',
    small: 'Petit (1-3 pers)',
    medium: 'Moyen (3-6 pers)',
    large: 'Grand (+6 pers)',
    yes: 'Présent'
  }
  return labels[value] || 'Aucun'
}

const extractEmailFromForm = (additionalInfo?: string): string | null => {
  if (additionalInfo) {
    const emailMatch = additionalInfo.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) return emailMatch[0];
  }
  return null;
}

const extractNameFromForm = (additionalInfo?: string): string | null => {
  if (additionalInfo) {
    const nameMatch = additionalInfo.match(/[Nn]om\s*[:=]?\s*([A-Za-z\s]+)/);
    if (nameMatch && nameMatch[1]) return nameMatch[1].trim();
  }
  return null;
}

const extractPhoneFromForm = (additionalInfo?: string): string | undefined => {
  if (additionalInfo) {
    const phoneMatch = additionalInfo.match(/(\+?\d{10,15})/);
    if (phoneMatch) return phoneMatch[0];
  }
  return undefined;
} 