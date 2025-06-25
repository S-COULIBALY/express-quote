import { useSubmission } from '../../generic/useSubmission';
import { createPackSubmissionConfig, PackSubmissionExtraData } from './packSubmissionConfig';
import { Pack } from '@/types/booking';

export const usePackSubmission = (pack: Pack, calculatedPrice: number, distance: number) => {
  // Configuration pour la submission générique
  const config = createPackSubmissionConfig(pack, distance);
  
  // Données extra pour la submission
  const extraData: PackSubmissionExtraData = {
    pack,
    distance
  };
  
  // Utiliser le hook générique
  const { isSubmitting, submit: submitPack } = useSubmission(config, calculatedPrice, extraData);

  return {
    isSubmitting,
    submitPack
  };
}; 