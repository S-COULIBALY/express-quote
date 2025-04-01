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
  } else if (!Object.values(BookingType).includes(data.type)) {
    errors.push({ field: 'type', message: `Type de réservation invalide: ${data.type}` });
  }
  
  // Vérifier les informations client
  if (!data.customer) {
    errors.push({ field: 'customer', message: 'Les informations client sont requises' });
  } else {
    if (!data.customer.email) {
      errors.push({ field: 'customer.email', message: 'L\'email du client est requis' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer.email)) {
      errors.push({ field: 'customer.email', message: 'Format d\'email invalide' });
    }
    
    if (!data.customer.firstName) {
      errors.push({ field: 'customer.firstName', message: 'Le prénom du client est requis' });
    }
    
    if (!data.customer.lastName) {
      errors.push({ field: 'customer.lastName', message: 'Le nom du client est requis' });
    }
  }
  
  // Validation spécifique selon le type de réservation
  if (data.type === BookingType.MOVING_QUOTE) {
    errors.push(...validateMoving(data));
  } else if (data.type === BookingType.PACK) {
    errors.push(...validatePack(data));
  } else if (data.type === BookingType.SERVICE) {
    errors.push(...validateService(data));
  }
  
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
function validateService(data: Partial<ServiceDTO>): ValidationError[] {
  const errors: ValidationError[] = [];
  
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