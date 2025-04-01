import { z } from 'zod';

/**
 * Options disponibles pour un devis de déménagement
 */
export interface MovingQuoteOptions {
  packaging?: boolean;
  furniture?: boolean;
  fragile?: boolean;
  storage?: boolean;
  disassembly?: boolean;
  unpacking?: boolean;
  supplies?: boolean;
  fragileItems?: boolean;
}

/**
 * Coordonnées géographiques
 */
export interface CoordinatesDto {
  lat: number;
  lng: number;
}

/**
 * DTO pour les requêtes de devis de déménagement
 */
export interface MovingQuoteRequestDto {
  // Adresses
  pickupAddress: string;
  deliveryAddress: string;
  
  // Caractéristiques du déménagement
  volume: number;
  distance: number;
  
  // Dates et préférences
  preferredDate: string;
  preferredTime?: string;
  
  // Détails de l'adresse de départ
  pickupFloor?: string;
  pickupElevator?: string;
  pickupCarryDistance?: string;
  pickupCoordinates?: CoordinatesDto;
  
  // Détails de l'adresse d'arrivée
  deliveryFloor?: string;
  deliveryElevator?: string;
  deliveryCarryDistance?: string;
  deliveryCoordinates?: CoordinatesDto;
  
  // Informations du logement
  propertyType?: string;
  surface?: string;
  rooms?: string;
  occupants?: string;
  
  // Informations de contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // Options additionnelles
  options?: MovingQuoteOptions;
  additionalInfo?: Record<string, any>;
}

/**
 * Schéma de validation pour les requêtes de devis de déménagement
 */
const movingQuoteRequestSchema = z.object({
  // Champs obligatoires
  pickupAddress: z.string().min(5, "L'adresse de départ est requise"),
  deliveryAddress: z.string().min(5, "L'adresse d'arrivée est requise"),
  volume: z.number().positive("Le volume doit être un nombre positif").or(z.string().regex(/^\d+$/).transform(Number)),
  
  // Champs optionnels avec valeurs par défaut ou transformations
  distance: z.number().positive().optional().default(0),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  preferredTime: z.enum(["morning", "afternoon", "evening"]).optional().default("morning"),
  
  // Détails de l'adresse de départ
  pickupFloor: z.string().optional(),
  pickupElevator: z.enum(["yes", "no"]).optional().default("no"),
  pickupCarryDistance: z.string().optional(),
  pickupCoordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  
  // Détails de l'adresse d'arrivée
  deliveryFloor: z.string().optional(),
  deliveryElevator: z.enum(["yes", "no"]).optional().default("no"),
  deliveryCarryDistance: z.string().optional(),
  deliveryCoordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  
  // Informations du logement
  propertyType: z.enum(["apartment", "house", "office"]).optional(),
  surface: z.string().optional(),
  rooms: z.string().optional(),
  occupants: z.string().optional(),
  
  // Informations de contact
  contactName: z.string().optional(),
  contactEmail: z.string().email("Format d'email invalide").optional(),
  contactPhone: z.string().optional(),
  
  // Options additionnelles
  options: z.object({
    packaging: z.boolean().optional().default(false),
    furniture: z.boolean().optional().default(false),
    fragile: z.boolean().optional().default(false),
    storage: z.boolean().optional().default(false),
    disassembly: z.boolean().optional().default(false),
    unpacking: z.boolean().optional().default(false),
    supplies: z.boolean().optional().default(false),
    fragileItems: z.boolean().optional().default(false)
  }).optional().default({}),
  
  additionalInfo: z.record(z.any()).optional().default({})
});

/**
 * Valide et transforme les données brutes en DTO correctement typé
 */
export function validateMovingQuoteRequest(data: Record<string, any>): MovingQuoteRequestDto {
  try {
    // Convertir les champs de type string en nombres si nécessaire
    const parsedData = {
      ...data,
      volume: typeof data.volume === 'string' ? Number(data.volume) : data.volume,
      distance: typeof data.distance === 'string' ? Number(data.distance) : data.distance,
      options: {
        ...data.options
      }
    };
    
    // Valider avec Zod
    return movingQuoteRequestSchema.parse(parsedData);
  } catch (error) {
    // Réorganiser les erreurs pour une meilleure lisibilité
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      const errorObj = new Error('Validation failed');
      (errorObj as any).errors = formattedErrors;
      throw errorObj;
    }
    throw error;
  }
} 