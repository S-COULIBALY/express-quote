'use server'

import { 
  getPackConstants,
  getServiceConstants,
  getInsuranceConstants,
  roundPrice
} from '@/actions/pricingConstants';

/**
 * Interface pour les données de tarification admin
 */
export interface AdminPricingConfig {
  // Prix de base
  basePrice: string;
  distancePrice: string;
  workerPrice: string;
  
  // Services additionnels
  packingPrice: string;
  unpackingPrice: string;
  storagePrice: string;
  insurancePrice: string;
  
  // Réductions et majorations
  earlyBookingDiscount: string;
  lastMinuteSurcharge: string;
  weekendSurcharge: string;
  holidaySurcharge: string;
}

/**
 * Récupère les configurations de tarification actuelles depuis les Server Actions
 */
export async function getAdminPricingConfig(): Promise<AdminPricingConfig> {
  const packConstants = await getPackConstants();
  const serviceConstants = await getServiceConstants();
  const insuranceConstants = await getInsuranceConstants();
  
  return {
    // Prix de base
    basePrice: '50', // Prix de base fictif pour le moment
    distancePrice: packConstants.PRICE_PER_EXTRA_KM.toString(),
    workerPrice: packConstants.WORKER_PRICE_PER_DAY.toString(),
    
    // Services additionnels
    packingPrice: '20', // Prix d'emballage fictif
    unpackingPrice: '20', // Prix de déballage fictif
    storagePrice: '5',   // Prix de stockage fictif
    insurancePrice: insuranceConstants.INSURANCE_PRICE_HT.toString(),
    
    // Réductions et majorations
    earlyBookingDiscount: '10', // Valeurs fictives pour les réductions
    lastMinuteSurcharge: '15',  // et majorations
    weekendSurcharge: '20',
    holidaySurcharge: '30',
  };
}

/**
 * Sauvegarde les configurations de tarification
 * Dans un environnement réel, cette fonction mettrait à jour les constantes
 * dans la base de données ou dans un autre système de stockage
 */
export async function saveAdminPricingConfig(config: AdminPricingConfig): Promise<{ success: boolean, message: string }> {
  try {
    // Ici, nous simulons une sauvegarde réussie
    // Dans une implémentation réelle, nous mettrions à jour les constantes
    
    // Simulation d'une pause pour l'UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: "Configuration des prix mise à jour avec succès"
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des configurations de prix:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des prix"
    };
  }
} 