import { BookingType } from '../../../domain/entities/Booking';
import { 
  BookingRequestDTO, 
  MovingDTO, 
  PackDTO, 
  ServiceDTO 
} from '../dtos/BookingDTO';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valide une requête de réservation
 */
export function validate(data: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Vérifier les champs obligatoires communs
  if (!data.type) {
    errors.push({ field: 'type', message: 'Le type de réservation est requis' });
  } else {
    // Vérifier si le type est valide en normalisant la casse
    const normalizedType = data.type.toUpperCase();
    if (!Object.values(BookingType).includes(normalizedType)) {
      errors.push({ field: 'type', message: `Type de réservation invalide: ${data.type}` });
    } else {
      // Normaliser le type pour la suite du traitement
      data.type = normalizedType;
    }
  }
  
  // Vérifier les informations client (OPTIONNEL)
  // Les informations client ne sont plus obligatoires
  if (data.customer) {
    // Mais si elles sont présentes, elles doivent être valides
    if (data.customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer.email)) {
      errors.push({ field: 'customer.email', message: 'Format d\'email invalide' });
    }
  }
  
  // Validation spécifique selon le type de réservation
  // ✅ SERVICES ACTIFS (2026-01-15): Seul MOVING_QUOTE est actif
  // ❌ SERVICES ABANDONNÉS: PACK, PACKING, SERVICE (supprimés)
  if (data.type === BookingType.MOVING_QUOTE || data.type === 'MOVING_QUOTE') {
    errors.push(...validateMoving(data));
  }
  // Les types PACK et SERVICE sont obsolètes et ne sont plus supportés
  
  return errors;
}

/**
 * Valide une requête de déménagement
 */
function validateMoving(data: Partial<MovingDTO>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.moveDate) {
    errors.push({ field: 'moveDate', message: 'La date de déménagement est requise' });
  }
  
  if (!data.pickupAddress) {
    errors.push({ field: 'pickupAddress', message: 'L\'adresse de départ est requise' });
  }
  
  if (!data.deliveryAddress) {
    errors.push({ field: 'deliveryAddress', message: 'L\'adresse d\'arrivée est requise' });
  }
  
  if (data.distance === undefined || data.distance === null) {
    errors.push({ field: 'distance', message: 'La distance est requise' });
  } else if (data.distance < 0) {
    errors.push({ field: 'distance', message: 'La distance ne peut pas être négative' });
  }
  
  if (data.volume === undefined || data.volume === null) {
    errors.push({ field: 'volume', message: 'Le volume est requis' });
  } else if (data.volume <= 0) {
    errors.push({ field: 'volume', message: 'Le volume doit être supérieur à 0' });
  }
  
  return errors;
}

/**
 * Valide une requête de pack
 */
function validatePack(data: Partial<PackDTO>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.name) {
    errors.push({ field: 'name', message: 'Le nom du pack est requis' });
  }
  
  if (!data.description) {
    errors.push({ field: 'description', message: 'La description du pack est requise' });
  }
  
  if (data.price === undefined || data.price === null) {
    errors.push({ field: 'price', message: 'Le prix est requis' });
  } else if (data.price < 0) {
    errors.push({ field: 'price', message: 'Le prix ne peut pas être négatif' });
  }
  
  if (!data.scheduledDate) {
    errors.push({ field: 'scheduledDate', message: 'La date planifiée est requise' });
  }
  
  if (!data.pickupAddress) {
    errors.push({ field: 'pickupAddress', message: 'L\'adresse de départ est requise' });
  }
  
  if (!data.deliveryAddress) {
    errors.push({ field: 'deliveryAddress', message: 'L\'adresse d\'arrivée est requise' });
  }
  
  return errors;
}

/**
 * Valide une requête de service
 */
function validateService(data: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Si serviceId est présent, c'est une réservation pour un service existant via le site web
  if (data.serviceId) {
    // Dans ce cas, on ne vérifie que les champs obligatoires pour la réservation
    
    if (!data.scheduledDate) {
      errors.push({ field: 'scheduledDate', message: 'La date planifiée est requise' });
    }
    
    if (!data.location) {
      errors.push({ field: 'location', message: 'L\'adresse du service est requise' });
    }
    
    // Les champs durée et travailleurs sont optionnels mais doivent être valides
    if (data.duration !== undefined && data.duration < 1) {
      errors.push({ field: 'duration', message: 'La durée doit être d\'au moins 1 heure' });
    }
    
    if (data.workers !== undefined && data.workers < 1) {
      errors.push({ field: 'workers', message: 'Le nombre de professionnels doit être d\'au moins 1' });
    }
    
    // Le prix calculé peut être absent, il sera recalculé côté serveur
    // si besoin pour des raisons de sécurité
    
    return errors;
  }
  
  // Validation pour la création d'un nouveau service
  if (!data.name) {
    errors.push({ field: 'name', message: 'Le nom du service est requis' });
  }
  
  if (!data.description) {
    errors.push({ field: 'description', message: 'La description du service est requise' });
  }
  
  if (data.price === undefined || data.price === null) {
    errors.push({ field: 'price', message: 'Le prix est requis' });
  } else if (data.price < 0) {
    errors.push({ field: 'price', message: 'Le prix ne peut pas être négatif' });
  }
  
  if (!data.scheduledDate) {
    errors.push({ field: 'scheduledDate', message: 'La date planifiée est requise' });
  }
  
  if (!data.location) {
    errors.push({ field: 'location', message: 'L\'adresse du service est requise' });
  }
  
  return errors;
} 