import { Rule } from './Rule';
import { Money } from './Money';
import { QuoteContext } from './QuoteContext';
import { Discount, DiscountType } from './Discount';

/**
 * Règles d'affaires spécifiques aux packs
 */
export const packRules: Rule[] = [
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
  
  // Réduction pour les grands packs personnalisés
  new Rule(
    'custom_large_pack_discount',
    -8, // -8% (réduction)
    undefined,
    (context: QuoteContext) => {
      const basePrice = context.getValue<number>('basePrice') ?? 0;
      const workers = context.getValue<number>('workers') ?? 2;
      const duration = context.getValue<number>('duration') ?? 1;
      
      // Si c'est personnalisé et avec au moins 3 travailleurs pour 2 jours ou plus
      return workers >= 3 && duration >= 2 && basePrice > 0;
    }
  )
]; 