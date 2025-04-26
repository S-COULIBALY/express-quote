'use server'

// Constantes pour le calcul des prix des packs et services
// Définies directement dans ce fichier au lieu d'être importées

// Constants générales
const VAT_RATE = 0.20; // 20% TVA

// Constantes pour les Packs
const PACK_CONSTANTS = {
  INCLUDED_DISTANCE: 20, // 20 km inclus dans le forfait
  PRICE_PER_EXTRA_KM: 1.5, // 1.5€ par km supplémentaire
  LIFT_PRICE: 200, // Prix du monte-meuble (200€)
  WORKER_PRICE_PER_DAY: 120, // 120€ par travailleur par jour
  WORKER_DISCOUNT_RATE_1_DAY: 0.05, // 5% de réduction pour 1 jour
  WORKER_DISCOUNT_RATE_MULTI_DAYS: 0.10, // 10% de réduction pour 2+ jours
  EXTRA_DAY_DISCOUNT_RATE: 0.90, // 90% du prix par jour supplémentaire (10% de réduction)
};

// Constantes pour les Services
const SERVICE_CONSTANTS = {
  WORKER_PRICE_PER_HOUR: 15, // 15€ par travailleur par heure
  WORKER_DISCOUNT_RATE_SHORT: 0.05, // 5% de réduction pour ≤2h
  WORKER_DISCOUNT_RATE_LONG: 0.10, // 10% de réduction pour >2h
};

// Constantes pour l'assurance
const INSURANCE_CONSTANTS = {
  INSURANCE_PRICE_HT: 12.5, // 15€ TTC = 12.5€ HT
  INSURANCE_PRICE_TTC: 15, // 15€ TTC
};

// Fonction utilitaire pour convertir HT en TTC
const calculateTTC = (priceHT: number): number => {
  return priceHT * (1 + VAT_RATE);
};

// Fonction utilitaire pour convertir TTC en HT
const calculateHT = (priceTTC: number): number => {
  return priceTTC / (1 + VAT_RATE);
};

// Fonction utilitaire pour arrondir à 2 décimales
const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

// Fonction pour récupérer le taux de TVA
export async function getVATRate(): Promise<number> {
  return VAT_RATE;
}

// Fonctions pour récupérer les constantes des packs
export async function getPackConstants() {
  return PACK_CONSTANTS;
}

// Fonctions pour récupérer les constantes des services
export async function getServiceConstants() {
  return SERVICE_CONSTANTS;
}

// Fonctions pour récupérer les constantes d'assurance
export async function getInsuranceConstants() {
  return INSURANCE_CONSTANTS;
}

// Fonction pour convertir HT en TTC
export async function convertToTTC(priceHT: number): Promise<number> {
  return calculateTTC(priceHT);
}

// Fonction pour convertir TTC en HT
export async function convertToHT(priceTTC: number): Promise<number> {
  return calculateHT(priceTTC);
}

// Fonction pour arrondir à 2 décimales
export async function roundPrice(value: number): Promise<number> {
  return roundToTwoDecimals(value);
} 