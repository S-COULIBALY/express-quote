import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../enums/ServiceType';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';

/**
 * Crée les règles métier pour les devis de packs de déménagement
 * @returns Tableau de règles pour les packs
 */
export function createPackRules(): Rule[] {
  return [
    // Majoration pour les prestations le week-end (+20%)
    new Rule(
      'Majoration week-end',
      ServiceType.PACK.toString(),
      20, // +20%
      (context: QuoteContext) => {
        const scheduledDate = context.getValue<Date>('scheduledDate');
        if (!scheduledDate) return false;
        
        const day = scheduledDate.getDay();
        // 0 = Dimanche, 6 = Samedi
        return day === 0 || day === 6;
      },
      true
    ),
    
    // Réduction pour réservation anticipée (plus de 14 jours à l'avance)
    new Rule(
      'Réduction réservation anticipée',
      ServiceType.PACK.toString(),
      -8, // -8%
      (context: QuoteContext) => {
        const scheduledDate = context.getValue<Date>('scheduledDate');
        if (!scheduledDate) return false;
        
        const today = new Date();
        const diffTime = scheduledDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 14;
      },
      true
    ),
    
    // Majoration pour réservation urgente (moins de 48h à l'avance)
    new Rule(
      'Majoration réservation urgente',
      ServiceType.PACK.toString(),
      25, // +25%
      (context: QuoteContext) => {
        const scheduledDate = context.getValue<Date>('scheduledDate');
        if (!scheduledDate) return false;
        
        const today = new Date();
        const diffTime = scheduledDate.getTime() - today.getTime();
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        
        return diffHours <= 48;
      },
      true
    ),
    
    // Réduction pour les packs de longue durée (3 jours ou plus)
    new Rule(
      'Réduction longue durée',
      ServiceType.PACK.toString(),
      -12, // -12%
      (context: QuoteContext) => {
        const duration = context.getValue<number>('duration') || 0;
        return duration >= 3;
      },
      true
    ),
    
    // Majoration pour les distances en dehors de la zone de couverture standard
    new Rule(
      'Majoration zone étendue',
      ServiceType.PACK.toString(),
      15, // +15%
      (context: QuoteContext) => {
        const distance = context.getValue<number>('distance') || 0;
        // Si la distance est supérieure à 50 km, on considère que c'est en dehors de la zone standard
        return distance > 50;
      },
      true
    ),
    
    // Tarif minimum pour un pack
    new Rule(
      'Tarif minimum',
      ServiceType.PACK.toString(),
      0, // Valeur à 0, sera calculée dynamiquement
      (context: QuoteContext) => {
        // Cette règle est toujours vérifiée mais son effet est géré dynamiquement
        // Nous l'utilisons uniquement comme plancher, pas comme réduction
        return true;
      },
      true,
      undefined, // Paramètre id explicite
      // Fonction d'application personnalisée pour calculer le montant minimum
      (basePrice: Money, context: QuoteContext) => {
        // Le tarif minimum est de 90% du prix de base
        const minimumPrice = basePrice.getAmount() * 0.9;
        // Retourne 0 pour indiquer qu'aucune réduction n'est appliquée par cette règle
        return { isApplied: true, newPrice: basePrice, impact: 0, minimumPrice };
      }
    ),
    
    // Réduction pour plus de travailleurs
    new Rule(
      'Réduction plus de travailleurs',
      ServiceType.PACK.toString(),
      -5, // -5%
      (context: QuoteContext) => {
        const workers = context.getValue<number>('workers') || 2;
        return workers > 2;
      },
      true
    ),
    
    // Réduction pour longue distance (économies d'échelle)
    new Rule(
      'Réduction longue distance',
      ServiceType.PACK.toString(), 
      -5, // -5%
      (context: QuoteContext) => {
        const distance = context.getValue<number>('distance') || 0;
        return distance > 100; // Plus de 100 km
      },
      true
    ),
    
    // Réduction pour jour de semaine (lun-jeu)
    new Rule(
      'Réduction jour de semaine',
      ServiceType.PACK.toString(),
      -8, // -8%
      (context: QuoteContext) => {
        const scheduledDate = context.getValue<Date>('scheduledDate') || 
                             context.getValue<Date>('serviceDate');
        if (!scheduledDate) return false;
        
        const dayOfWeek = scheduledDate.getDay(); // 0 = dimanche, 1-4 = lun-jeu, 5-6 = ven-sam
        return dayOfWeek >= 1 && dayOfWeek <= 4;
      },
      true
    )
  ];
} 