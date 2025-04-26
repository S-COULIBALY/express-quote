import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../enums/ServiceType';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';

/**
 * Crée les règles métier pour les devis de services
 * @returns Tableau de règles pour les services
 */
export function createServiceRules(): Rule[] {
  return [
    // Majoration pour les services le week-end (+25%)
    new Rule(
      'Majoration week-end',
      ServiceType.SERVICE.toString(),
      25, // +25%
      (context: QuoteContext) => {
        const scheduledDate = context.getValue<Date>('scheduledDate');
        if (!scheduledDate) return false;
        
        const day = scheduledDate.getDay();
        // 0 = Dimanche, 6 = Samedi
        return day === 0 || day === 6;
      },
      true
    ),
    
    // Réduction pour réservation anticipée (plus de 7 jours à l'avance)
    new Rule(
      'Réduction réservation anticipée',
      ServiceType.SERVICE.toString(),
      -5, // -5%
      (context: QuoteContext) => {
        const scheduledDate = context.getValue<Date>('scheduledDate');
        if (!scheduledDate) return false;
        
        const today = new Date();
        const diffTime = scheduledDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 7;
      },
      true
    ),
    
    // Majoration pour service en dehors des heures de bureau (avant 8h ou après 18h)
    new Rule(
      'Majoration horaires étendus',
      ServiceType.SERVICE.toString(),
      15, // +15%
      (context: QuoteContext) => {
        const scheduledDate = context.getValue<Date>('scheduledDate');
        if (!scheduledDate) return false;
        
        const hour = scheduledDate.getHours();
        return hour < 8 || hour >= 18;
      },
      true
    ),
    
    // Réduction pour les services de longue durée (plus de 4h)
    new Rule(
      'Réduction longue durée',
      ServiceType.SERVICE.toString(),
      -8, // -8%
      (context: QuoteContext) => {
        const duration = context.getValue<number>('duration') || 0;
        return duration > 4;
      },
      true
    ),
    
    // Réduction pour clients fidèles (clients avec un historique)
    new Rule(
      'Réduction client fidèle',
      ServiceType.SERVICE.toString(),
      -10, // -10%
      (context: QuoteContext) => {
        const isReturningCustomer = context.getValue<boolean>('isReturningCustomer') || false;
        return isReturningCustomer;
      },
      true
    ),
    
    // Majoration pour équipement spécial
    new Rule(
      'Majoration équipement spécial',
      ServiceType.SERVICE.toString(),
      50, // +50€ (montant fixe)
      (context: QuoteContext) => {
        const requiresSpecialEquipment = context.getValue<boolean>('requiresSpecialEquipment') || false;
        return requiresSpecialEquipment;
      },
      true
    ),
    
    // Tarif minimum pour un service
    new Rule(
      'Tarif minimum',
      ServiceType.SERVICE.toString(),
      0, // Valeur à 0, sera calculée dynamiquement dans la fonction condition
      (context: QuoteContext) => {
        // Cette règle est toujours vérifiée mais son effet est géré dynamiquement
        // Nous l'utilisons uniquement comme plancher, pas comme réduction
        return true;
      },
      true,
      undefined, // Ajouter explicitement undefined pour le paramètre id
      // Ajouter une fonction spéciale pour calculer le montant minimum
      // Cette fonction sera appelée par le RuleEngine
      (basePrice: Money, context: QuoteContext) => {
        // Le tarif minimum est de 90% du prix de base
        const minimumPrice = basePrice.getAmount() * 0.9;
        // Retourne 0 pour indiquer qu'aucune réduction n'est appliquée par cette règle
        return { isApplied: true, newPrice: basePrice, impact: 0, minimumPrice };
      }
    ),
    
    // Supplément pour réservation urgente (moins de 3 jours)
    new Rule(
      'Supplément réservation urgente',
      ServiceType.SERVICE.toString(),
      15, // +15%
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
      },
      true
    ),
    
    // Réduction pour service avec durée prolongée par rapport à la durée par défaut
    new Rule(
      'Réduction durée prolongée',
      ServiceType.SERVICE.toString(),
      -7, // -7%
      (context: QuoteContext) => {
        const duration = context.getValue<number>('duration') || 0;
        const defaultDuration = context.getValue<number>('defaultDuration') || duration;
        
        // Si la durée est plus longue que la durée par défaut
        return duration > defaultDuration && duration >= 4; // Au moins 4 heures
      },
      true
    )
  ];
} 