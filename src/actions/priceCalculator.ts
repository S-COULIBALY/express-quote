'use server'

import { 
  getPackConstants,
  getServiceConstants,
  getInsuranceConstants,
  convertToTTC,
  roundPrice
} from '@/actions/pricingConstants';

/**
 * Calcule le prix d'un pack en fonction des paramètres fournis
 */
export async function calculatePackPrice(
  basePrice: number, 
  duration: number, 
  workers: number, 
  baseWorkers: number,
  baseDuration: number,
  distance: number = 0,
  pickupNeedsLift: boolean = false,
  deliveryNeedsLift: boolean = false
): Promise<number> {
  // Récupérer les constantes
  const PACK_CONSTANTS = await getPackConstants();
  
  // Calculer le coût des jours supplémentaires
  let extraDurationCost = 0;
  if (duration > baseDuration) {
    const extraDays = duration - baseDuration;
    const dailyRate = basePrice / baseDuration;
    extraDurationCost = dailyRate * extraDays * PACK_CONSTANTS.EXTRA_DAY_DISCOUNT_RATE;
  }
  
  // On calcule le coût des travailleurs supplémentaires par rapport au pack de base
  let extraWorkerCost = 0;
  if (workers > baseWorkers) {
    const extraWorkers = workers - baseWorkers;
    const extraWorkerBaseCost = extraWorkers * PACK_CONSTANTS.WORKER_PRICE_PER_DAY * duration;
    const reductionRate = duration === 1 ? PACK_CONSTANTS.WORKER_DISCOUNT_RATE_1_DAY : PACK_CONSTANTS.WORKER_DISCOUNT_RATE_MULTI_DAYS;
    extraWorkerCost = extraWorkerBaseCost * (1 - reductionRate);
  }
  
  // Calculer les frais de distance (km au-delà de l'inclus)
  let distanceCost = 0;
  if (distance > PACK_CONSTANTS.INCLUDED_DISTANCE) {
    const extraKm = distance - PACK_CONSTANTS.INCLUDED_DISTANCE;
    distanceCost = extraKm * PACK_CONSTANTS.PRICE_PER_EXTRA_KM;
  }
  
  // Calculer le coût du monte-meuble
  let liftCost = 0;
  if (pickupNeedsLift) liftCost += PACK_CONSTANTS.LIFT_PRICE;
  if (deliveryNeedsLift) liftCost += PACK_CONSTANTS.LIFT_PRICE;
  
  // Prix final = prix de base + coût des jours supplémentaires + coût des travailleurs supplémentaires + frais de distance + coût du monte-meuble
  const finalPrice = basePrice + extraDurationCost + extraWorkerCost + distanceCost + liftCost;
  
  return Math.round(finalPrice);
}

/**
 * Calcule le prix d'un service en fonction des paramètres fournis
 */
export async function calculateServicePrice(
  basePrice: number, 
  duration: number, 
  workers: number, 
  defaultDuration: number = 1, 
  defaultWorkers: number = 1
): Promise<number> {
  // Récupérer les constantes
  const SERVICE_CONSTANTS = await getServiceConstants();
  
  // Si c'est la configuration par défaut
  if (duration === defaultDuration && workers === defaultWorkers) {
    return basePrice;
  }
  
  // 1. Calculer le coût des travailleurs supplémentaires
  let extraWorkerCost = 0;
  if (workers > defaultWorkers) {
    const extraWorkers = workers - defaultWorkers;
    const extraWorkerBaseCost = extraWorkers * SERVICE_CONSTANTS.WORKER_PRICE_PER_HOUR * duration;
    // Réduction en fonction de la durée
    const reductionRate = duration <= 2 ? SERVICE_CONSTANTS.WORKER_DISCOUNT_RATE_SHORT : SERVICE_CONSTANTS.WORKER_DISCOUNT_RATE_LONG;
    extraWorkerCost = extraWorkerBaseCost * (1 - reductionRate);
  }
  
  // 2. Calculer le coût des heures supplémentaires pour les travailleurs par défaut
  let defaultWorkerExtraHoursCost = 0;
  if (duration > defaultDuration) {
    const extraHours = duration - defaultDuration;
    defaultWorkerExtraHoursCost = defaultWorkers * SERVICE_CONSTANTS.WORKER_PRICE_PER_HOUR * extraHours;
  }
  
  // 3. Calculer le prix final
  const finalPrice = basePrice + defaultWorkerExtraHoursCost + extraWorkerCost;
  
  return Math.round(finalPrice);
}

/**
 * Calcule le coût du monte-meuble pour un pack en fonction des paramètres
 */
export async function calculateLiftCost(
  pickupNeedsLift: boolean, 
  deliveryNeedsLift: boolean
): Promise<number> {
  const PACK_CONSTANTS = await getPackConstants();
  let liftCost = 0;
  if (pickupNeedsLift) liftCost += PACK_CONSTANTS.LIFT_PRICE;
  if (deliveryNeedsLift) liftCost += PACK_CONSTANTS.LIFT_PRICE;
  return liftCost;
}

/**
 * Calcule le coût de l'assurance
 */
export async function calculateInsuranceCost(
  hasInsurance: boolean
): Promise<number> {
  const INSURANCE_CONSTANTS = await getInsuranceConstants();
  return hasInsurance ? INSURANCE_CONSTANTS.INSURANCE_PRICE_HT : 0;
}

/**
 * Calcule le prix total avec les options (assurance, etc.)
 */
export async function calculateTotalWithOptions(
  baseAmount: number | { type: 'pack' | 'service', data: any }[],
  hasInsurance: boolean = false,
  liftCost: number = 0
): Promise<{ totalHT: number, totalTTC: number, insuranceCost: number }> {
  const INSURANCE_CONSTANTS = await getInsuranceConstants();
  
  // Calculer le montant de base si un tableau d'éléments est fourni
  let totalBaseAmount: number;
  
  if (Array.isArray(baseAmount)) {
    // Si baseAmount est un tableau d'objets, on calcule la somme des prix
    totalBaseAmount = 0;
    for (const item of baseAmount) {
      if (item.type === 'pack') {
        totalBaseAmount += await calculatePackPrice(
          item.data.price,
          item.data.duration,
          item.data.workers,
          2, // baseWorkers par défaut
          1, // baseDuration par défaut
          item.data.distance || 0,
          item.data.pickupNeedsLift || false,
          item.data.deliveryNeedsLift || false
        );
      } else if (item.type === 'service') {
        totalBaseAmount += await calculateServicePrice(
          item.data.price,
          item.data.duration,
          item.data.workers
        );
      }
    }
  } else {
    // Si baseAmount est un nombre, on l'utilise directement
    totalBaseAmount = baseAmount;
  }
  
  const insuranceCost = hasInsurance ? INSURANCE_CONSTANTS.INSURANCE_PRICE_HT : 0;
  const totalHT = totalBaseAmount + insuranceCost + liftCost;
  const totalTTC = await convertToTTC(totalHT);
  
  return {
    totalHT: await roundPrice(totalHT),
    totalTTC: await roundPrice(totalTTC),
    insuranceCost: await roundPrice(insuranceCost)
  };
}

/**
 * Calcule le coût des heures/jours supplémentaires pour l'affichage dans le panier
 */
export async function calculateExtraDurationCost(
  isPack: boolean,
  duration: number,
  baseDuration: number,
  basePrice: number,
  workers: number
): Promise<number> {
  const PACK_CONSTANTS = await getPackConstants();
  const SERVICE_CONSTANTS = await getServiceConstants();
  
  if (duration <= baseDuration) return 0;
  
  if (isPack) {
    // Pour les packs
    return Math.round((duration - baseDuration) * basePrice * PACK_CONSTANTS.EXTRA_DAY_DISCOUNT_RATE);
  } else {
    // Pour les services
    return Math.round((duration - baseDuration) * workers * SERVICE_CONSTANTS.WORKER_PRICE_PER_HOUR);
  }
}

/**
 * Calcule le coût des travailleurs supplémentaires pour l'affichage dans le panier
 */
export async function calculateExtraWorkersCost(
  isPack: boolean,
  workers: number,
  baseWorkers: number,
  duration: number
): Promise<number> {
  const PACK_CONSTANTS = await getPackConstants();
  const SERVICE_CONSTANTS = await getServiceConstants();
  
  if (workers <= baseWorkers) return 0;
  
  if (isPack) {
    // Pour les packs
    const reductionRate = duration === 1 ? PACK_CONSTANTS.WORKER_DISCOUNT_RATE_1_DAY : PACK_CONSTANTS.WORKER_DISCOUNT_RATE_MULTI_DAYS;
    return Math.round((workers - baseWorkers) * PACK_CONSTANTS.WORKER_PRICE_PER_DAY * duration * (1 - reductionRate));
  } else {
    // Pour les services
    const reductionRate = duration <= 2 ? SERVICE_CONSTANTS.WORKER_DISCOUNT_RATE_SHORT : SERVICE_CONSTANTS.WORKER_DISCOUNT_RATE_LONG;
    return Math.round((workers - baseWorkers) * SERVICE_CONSTANTS.WORKER_PRICE_PER_HOUR * duration * (1 - reductionRate));
  }
}

/**
 * Calcule le coût de la distance supplémentaire pour l'affichage dans le panier
 */
export async function calculateExtraDistanceCost(
  distance: number
): Promise<number> {
  const PACK_CONSTANTS = await getPackConstants();
  
  if (distance <= PACK_CONSTANTS.INCLUDED_DISTANCE) return 0;
  
  const extraKm = distance - PACK_CONSTANTS.INCLUDED_DISTANCE;
  return Math.round(extraKm * PACK_CONSTANTS.PRICE_PER_EXTRA_KM * 10) / 10; // Arrondi à 1 décimale
} 