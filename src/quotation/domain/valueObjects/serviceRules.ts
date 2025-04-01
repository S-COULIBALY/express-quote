import { Rule } from './Rule';
import { Money } from './Money';
import { QuoteContext } from './QuoteContext';
import { Discount, DiscountType } from './Discount';

/**
 * Règles d'affaires spécifiques aux services
 */
export const serviceRules: Rule[] = [
  // Réduction pour réservation à l'avance
  new Rule(
    'early_booking_discount',
    -5, // -5% (réduction)
    undefined,
    (context: QuoteContext) => {
      const bookingDate = context.getValue<Date>('bookingDate');
      const serviceDate = context.getValue<Date>('serviceDate');
      
      if (!bookingDate || !serviceDate) {
        return false;
      }
      
      const daysDifference = Math.floor(
        (serviceDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysDifference >= 14; // Réduction si réservé au moins 14 jours à l'avance
    }
  ),
  
  // Supplément pour réservation urgente (moins de 3 jours)
  new Rule(
    'urgent_booking_surcharge',
    15, // 15% (supplément)
    undefined,
    (context: QuoteContext) => {
      const bookingDate = context.getValue<Date>('bookingDate');
      const serviceDate = context.getValue<Date>('serviceDate');
      
      if (!bookingDate || !serviceDate) {
        return false;
      }
      
      const daysDifference = Math.floor(
        (serviceDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysDifference < 3; // Supplément si réservé moins de 3 jours à l'avance
    }
  ),
  
  // Réduction pour service avec durée prolongée
  new Rule(
    'extended_duration_discount',
    -7, // -7% (réduction)
    undefined,
    (context: QuoteContext) => {
      const duration = context.getValue<number>('duration') ?? 0;
      const defaultDuration = context.getValue<number>('defaultDuration') ?? duration;
      
      // Si la durée est plus longue que la durée par défaut
      return duration > defaultDuration && duration >= 4; // Au moins 4 heures
    }
  )
]; 