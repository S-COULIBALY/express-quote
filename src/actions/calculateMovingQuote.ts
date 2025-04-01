/**
 * Fonction unifiée pour calculer les devis de déménagement via l'API centralisée
 * Remplace les anciennes fonctions de calcul local
 */

interface FormData {
  // Adresses
  pickupAddress: string;
  deliveryAddress: string;
  
  // Caractéristiques du déménagement
  volume: number | string;
  distance?: number;
  
  // Dates et préférences
  movingDate: string;
  preferredTime?: string;
  
  // Détails de l'adresse de départ
  pickupFloor: string | number;
  pickupElevator: string;
  pickupCarryDistance: string | number;
  
  // Détails de l'adresse d'arrivée
  deliveryFloor: string | number;
  deliveryElevator: string;
  deliveryCarryDistance: string | number;
  
  // Informations du logement
  propertyType: string;
  surface: string;
  rooms: string;
  occupants: string;
  
  // Options additionnelles
  options?: {
    packaging?: boolean;
    furniture?: boolean;
    fragile?: boolean;
    storage?: boolean;
    disassembly?: boolean;
    unpacking?: boolean;
    supplies?: boolean;
    fragileItems?: boolean;
  };
}

interface QuoteDetails {
  baseCost: number;
  volumeCost?: number;
  distancePrice?: number;
  tollCost?: number;
  fuelCost?: number;
  optionsCost?: number;
  packingCost?: number;
  storageCost?: number;
  cleaningCost?: number;
  totalCost: number;
  signature?: string; // Signature HMAC pour vérifier l'intégrité du résultat
  [key: string]: any;
}

/**
 * Calcule un devis localement en cas d'erreur de l'API
 */
function calculateLocalQuote(data: FormData): QuoteDetails {
  const volume = typeof data.volume === 'string' ? parseFloat(data.volume) || 0 : data.volume || 0;
  const distance = data.distance || 0;
  
  // Prix de base
  const baseCost = volume * 10; // 10€/m³
  const distancePrice = distance * 2; // 2€/km
  const tollCost = distance * 0.15; // 0.15€/km de péage
  const fuelCost = (distance * 25 * 1.8) / 100; // 25L/100km, 1.8€/L
  
  // Calcul des options
  let optionsCost = 0;
  if (data.options) {
    if (data.options.packaging) optionsCost += 150;
    if (data.options.furniture) optionsCost += 100;
    if (data.options.fragile) optionsCost += 80;
    if (data.options.storage) optionsCost += 200;
    if (data.options.disassembly) optionsCost += 120;
    if (data.options.unpacking) optionsCost += 100;
    if (data.options.supplies) optionsCost += 50;
    if (data.options.fragileItems) optionsCost += 80;
  }
  
  const totalCost = baseCost + distancePrice + tollCost + fuelCost + optionsCost;
  
  return {
    baseCost,
    volumeCost: baseCost,
    distancePrice,
    tollCost,
    fuelCost,
    optionsCost,
    totalCost
  };
}

/**
 * Calcule un devis de déménagement en utilisant l'API centralisée
 * @param data Les données du formulaire
 * @returns Les détails du devis calculé
 */
export async function calculateMovingQuote(data: FormData): Promise<QuoteDetails> {
  try {
    // Préparation des données pour l'API
    const payload = {
      // Adresses
      pickupAddress: data.pickupAddress,
      deliveryAddress: data.deliveryAddress,
      
      // Caractéristiques du déménagement
      volume: typeof data.volume === 'string' ? parseFloat(data.volume) || 0 : data.volume || 0,
      distance: data.distance || 0,
      
      // Dates et préférences
      preferredDate: data.movingDate,
      preferredTime: data.preferredTime || 'morning',
      
      // Détails de l'adresse de départ
      pickupFloor: typeof data.pickupFloor === 'string' 
        ? parseInt(data.pickupFloor) || 0 
        : data.pickupFloor || 0,
      pickupElevator: data.pickupElevator,
      pickupCarryDistance: typeof data.pickupCarryDistance === 'string'
        ? parseInt(data.pickupCarryDistance) || 0
        : data.pickupCarryDistance || 0,
      
      // Détails de l'adresse d'arrivée
      deliveryFloor: typeof data.deliveryFloor === 'string' 
        ? parseInt(data.deliveryFloor) || 0 
        : data.deliveryFloor || 0,
      deliveryElevator: data.deliveryElevator,
      deliveryCarryDistance: typeof data.deliveryCarryDistance === 'string'
        ? parseInt(data.deliveryCarryDistance) || 0
        : data.deliveryCarryDistance || 0,
      
      // Informations du logement
      propertyType: data.propertyType,
      surface: data.surface,
      rooms: data.rooms,
      occupants: data.occupants,
      
      // Options additionnelles
      options: {
        packaging: data.options?.packaging || false,
        furniture: data.options?.furniture || false,
        fragile: data.options?.fragile || false,
        storage: data.options?.storage || false,
        disassembly: data.options?.disassembly || false,
        unpacking: data.options?.unpacking || false,
        supplies: data.options?.supplies || false,
        fragileItems: data.options?.fragileItems || false
      }
    };

    // Log structuré pour le débogage dans le terminal
    console.log('\n===== DONNÉES ENVOYÉES AU CALCULATEUR =====');
    console.log('ADRESSE DE DÉPART:', payload.pickupAddress);
    console.log('ADRESSE D\'ARRIVÉE:', payload.deliveryAddress);
    console.log('VOLUME:', payload.volume, 'm³');
    console.log('DISTANCE:', payload.distance, 'km');
    console.log('DATE PRÉFÉRÉE:', payload.preferredDate);
    console.log('HEURE PRÉFÉRÉE:', payload.preferredTime);
    console.log('\nDÉTAILS DÉPART:');
    console.log(' - Étage:', payload.pickupFloor);
    console.log(' - Ascenseur:', payload.pickupElevator);
    console.log(' - Distance de portage:', payload.pickupCarryDistance, 'm');
    console.log('\nDÉTAILS ARRIVÉE:');
    console.log(' - Étage:', payload.deliveryFloor);
    console.log(' - Ascenseur:', payload.deliveryElevator);
    console.log(' - Distance de portage:', payload.deliveryCarryDistance, 'm');
    console.log('\nINFORMATIONS LOGEMENT:');
    console.log(' - Type:', payload.propertyType);
    console.log(' - Surface:', payload.surface, 'm²');
    console.log(' - Pièces:', payload.rooms);
    console.log(' - Occupants:', payload.occupants);
    console.log('\nOPTIONS:');
    Object.entries(payload.options).forEach(([key, value]) => {
      console.log(` - ${key}:`, value);
    });
    console.log('\nPAYLOAD COMPLET:', JSON.stringify(payload, null, 2));
    console.log('============================================\n');

    // Appel à l'API de calcul centralisée
    const response = await fetch('/api/bookings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur lors du calcul du devis:', response.status, errorData);
      
      // Gestion spécifique des erreurs HTTP
      switch (response.status) {
        case 400:
          throw new Error('Données de formulaire invalides');
        case 401:
          throw new Error('Non autorisé');
        case 403:
          throw new Error('Accès refusé');
        case 404:
          throw new Error('Service non trouvé');
        case 500:
          throw new Error('Erreur serveur');
        default:
          throw new Error(`Erreur ${response.status}: ${errorData.message || 'Erreur inconnue'}`);
      }
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('Réponse de calcul invalide:', result);
      throw new Error(result.message || 'Réponse de calcul invalide');
    }

    // Convertir la réponse de l'API au format attendu par le frontend
    const apiData = result.data;
    return {
      // Mapper les données retournées au format attendu par le frontend
      baseCost: apiData.baseCost || apiData.basePrice || 0,
      volumeCost: apiData.volumeCost || apiData.volumePrice || 0,
      distancePrice: apiData.distancePrice || apiData.distanceCost || 0,
      tollCost: apiData.tollCost || 0,
      fuelCost: apiData.fuelCost || 0,
      optionsCost: apiData.optionsCost || apiData.additionalCost || 0,
      totalCost: apiData.totalCost || apiData.totalPrice || 0,
      // Stocker la signature pour la vérification ultérieure
      signature: result.signature,
      // Inclure tous les autres champs retournés
      ...apiData
    };
  } catch (error) {
    console.error('Erreur lors du calcul du devis de déménagement:', error);
    // Utiliser le calcul local en cas d'erreur
    return calculateLocalQuote(data);
  }
}

/**
 * Extrait la ville d'une chaîne d'adresse
 */
function extractCity(address?: string): string {
  if (!address) return '';
  
  // Format supposé: "123 Rue Example, 75001 Paris"
  const parts = address.split(',');
  if (parts.length < 2) return '';
  
  const cityPart = parts[1].trim();
  // Retirer le code postal pour garder que la ville
  return cityPart.replace(/^\d{5}\s*/, '');
}

/**
 * Extrait le code postal d'une chaîne d'adresse
 */
function extractPostalCode(address?: string): string {
  if (!address) return '';
  
  // Recherche d'un code postal dans la chaîne (format français: 5 chiffres)
  const match = address.match(/\b\d{5}\b/);
  return match ? match[0] : '';
}