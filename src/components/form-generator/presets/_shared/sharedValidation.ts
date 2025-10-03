import { z } from 'zod';

// 🔒 Règles de validation partagées
// Centralise la logique de validation pour éviter la duplication

// 📞 Validation téléphone français
export const phoneValidation = z.string()
  .min(10, 'Le numéro de téléphone doit contenir au moins 10 chiffres')
  .regex(
    /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    'Format de téléphone invalide (ex: 06 12 34 56 78)'
  );

// 📧 Validation email
export const emailValidation = z.string()
  .email('Format d\'email invalide')
  .min(5, 'L\'email doit contenir au moins 5 caractères')
  .max(100, 'L\'email ne peut pas dépasser 100 caractères');

// 📅 Validation date (pas dans le passé)
export const futureDateValidation = z.string()
  .refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    return selectedDate >= today;
  }, 'La date ne peut pas être dans le passé');

// 🕐 Validation heure (heures ouvrables)
export const businessHoursValidation = z.string()
  .refine((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    // Entre 8h00 (480 min) et 18h00 (1080 min)
    return totalMinutes >= 480 && totalMinutes <= 1080;
  }, 'L\'heure doit être entre 8h00 et 18h00');

// 📍 Validation adresse (minimum requis)
export const addressValidation = z.object({
  address: z.string().min(10, 'L\'adresse doit contenir au moins 10 caractères'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres')
    .refine((code) => {
      // Codes postaux français valides (01000-95999, plus DOM-TOM)
      const num = parseInt(code);
      return (num >= 1000 && num <= 95999) || 
             (num >= 97100 && num <= 98999); // DOM-TOM
    }, 'Code postal français invalide')
});

// 📝 Validation commentaires
export const commentsValidation = z.string()
  .max(500, 'Les commentaires ne peuvent pas dépasser 500 caractères')
  .optional();

// 🏠 Validations spécifiques logement
export const floorValidation = z.enum(['0', '1', '2', '3', '4+']);
export const elevatorValidation = z.enum(['yes', 'no']);
export const accessDifficultyValidation = z.enum(['easy', 'moderate', 'difficult']);

// 📏 Validation taille (générique)
export const sizeValidation = z.enum(['small', 'medium', 'large', 'extra-large']);

// 🎯 Schémas composés pour différents types de services
export const movingServiceValidation = z.object({
  origin_address: addressValidation,
  destination_address: addressValidation,
  date: futureDateValidation,
  time: businessHoursValidation,
  phone: phoneValidation,
  size: sizeValidation,
  floor: floorValidation.optional(),
  elevator: elevatorValidation.optional(),
  comments: commentsValidation
});

export const cleaningServiceValidation = z.object({
  address: addressValidation,
  date: futureDateValidation,
  time: businessHoursValidation,
  phone: phoneValidation,
  size: sizeValidation,
  floor: floorValidation.optional(),
  elevator: elevatorValidation.optional(),
  access_difficulty: accessDifficultyValidation.optional(),
  comments: commentsValidation
});

export const deliveryServiceValidation = z.object({
  origin_address: addressValidation,
  destination_address: addressValidation,
  date: futureDateValidation,
  time: businessHoursValidation,
  phone: phoneValidation,
  size: sizeValidation,
  comments: commentsValidation
});

// 🛠️ Factory function pour créer des validations personnalisées
export const createServiceValidation = (
  serviceType: 'moving' | 'cleaning' | 'delivery',
  additionalFields?: Record<string, z.ZodType>
) => {
  const baseSchemas = {
    moving: movingServiceValidation,
    cleaning: cleaningServiceValidation,
    delivery: deliveryServiceValidation
  };

  const baseSchema = baseSchemas[serviceType];
  
  if (additionalFields) {
    return baseSchema.extend(additionalFields);
  }
  
  return baseSchema;
};

// 📋 Messages d'erreur personnalisés en français
export const customErrorMessages = {
  required: 'Ce champ est requis',
  invalid_type: 'Type de données invalide',
  too_small: 'Valeur trop petite',
  too_big: 'Valeur trop grande',
  invalid_email: 'Format d\'email invalide',
  invalid_phone: 'Format de téléphone invalide',
  invalid_date: 'Date invalide',
  invalid_time: 'Heure invalide',
  invalid_address: 'Adresse invalide'
};

// 🎯 Utilitaire pour appliquer les messages personnalisés
export const withCustomMessages = <T extends z.ZodType>(schema: T): z.ZodEffects<T> => {
  return schema.refine(() => true, {
    message: customErrorMessages.required
  });
};