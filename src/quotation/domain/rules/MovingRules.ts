import { Rule } from '../valueObjects/Rule';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { ServiceType } from '../enums/ServiceType';
import { Money } from '../valueObjects/Money';

/**
 * Crée les règles métier pour les devis de déménagement
 * @returns Tableau de règles pour les déménagements
 */
export function createMovingRules(): Rule[] {
  return [
    // Majoration pour week-end (+15%)
    new Rule(
      'Majoration week-end',
      ServiceType.MOVING.toString(),
      15, // +15%
      (context: QuoteContext) => {
        const movingDate = context.getValue<Date>('movingDate');
        if (!movingDate) return false;
        
        const day = movingDate.getDay();
        return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
      },
      true
    ),
    
    // Réduction pour réservation anticipée (-10%)
    new Rule(
      'Réduction réservation anticipée',
      ServiceType.MOVING.toString(),
      -10, // -10%
      (context: QuoteContext) => {
        const movingDate = context.getValue<Date>('movingDate');
        if (!movingDate) return false;
        
        const now = new Date();
        const daysUntilMoving = Math.ceil((movingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilMoving > 30; // Plus de 30 jours à l'avance
      },
      true
    ),
    
    // Majoration pour objets fragiles (+8%)
    new Rule(
      'Majoration objets fragiles',
      ServiceType.MOVING.toString(),
      8, // +8%
      (context: QuoteContext) => {
        const fragileItems = context.getValue<boolean>('hasFragileItems');
        return fragileItems === true;
      },
      true
    ),
    
    // Supplément pour monte-meuble (montant fixe)
    new Rule(
      'Supplément monte-meuble',
      ServiceType.MOVING.toString(),
      200, // +200€
      (context: QuoteContext) => {
        const needsLift = context.getValue<boolean>('needsLift');
        return needsLift === true;
      },
      true
    ),
    
    // Tarif minimum pour un déménagement
    new Rule(
      'Tarif minimum',
      ServiceType.MOVING.toString(),
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
    
    // Supplément pour étages sans ascenseur
    new Rule(
      'Supplément étages sans ascenseur',
      ServiceType.MOVING.toString(),
      50, // +50€
      (context: QuoteContext) => {
        const pickupFloor = context.getValue<number>('pickupFloor') || 0;
        const deliveryFloor = context.getValue<number>('deliveryFloor') || 0;
        const pickupElevator = context.getValue<boolean>('pickupElevator') || false;
        const deliveryElevator = context.getValue<boolean>('deliveryElevator') || false;
        
        // Appliquer le supplément si:
        // - Étage de départ > 1 sans ascenseur, OU
        // - Étage d'arrivée > 1 sans ascenseur
        return (pickupFloor > 1 && !pickupElevator) || (deliveryFloor > 1 && !deliveryElevator);
      },
      true
    ),
    
    // Règles additionnelles de l'ancien fichier
    
    // Réduction pour petit volume
    new Rule(
      'Réduction pour petit volume',
      ServiceType.MOVING.toString(),
      -10, // -10%
      (context: QuoteContext) => {
        const volume = context.getValue<number>('volume') || 0;
        return volume < 10;
      },
      true
    ),
    
    // Réduction pour grand volume
    new Rule(
      'Réduction pour grand volume',
      ServiceType.MOVING.toString(),
      -5, // -5%
      (context: QuoteContext) => {
        const volume = context.getValue<number>('volume') || 0;
        return volume > 50;
      },
      true
    ),
    
    // Majoration haute saison
    new Rule(
      'Majoration haute saison',
      ServiceType.MOVING.toString(),
      30, // +30%
      (context: QuoteContext) => {
        const movingDate = context.getValue<Date>('movingDate');
        if (!movingDate) return false;
        
        const month = movingDate.getMonth() + 1; // getMonth() retourne 0-11
        return month >= 6 && month <= 9; // Juin à Septembre
      },
      true
    ),
    
    // Majoration pour distance de portage (départ)
    new Rule(
      'Majoration pour distance de portage (départ)',
      ServiceType.MOVING.toString(),
      30, // +30€
      (context: QuoteContext) => {
        const pickupCarryDistance = context.getValue<number>('pickupCarryDistance') || 0;
        return pickupCarryDistance > 100;
      },
      true
    ),
    
    // Majoration pour distance de portage (arrivée)
    new Rule(
      'Majoration pour distance de portage (arrivée)',
      ServiceType.MOVING.toString(),
      30, // +30€
      (context: QuoteContext) => {
        const deliveryCarryDistance = context.getValue<number>('deliveryCarryDistance') || 0;
        return deliveryCarryDistance > 100;
      },
      true
    ),
    
    // Majoration pour escaliers étroits (départ)
    new Rule(
      'Majoration pour escaliers étroits (départ)',
      ServiceType.MOVING.toString(),
      50, // +50€
      (context: QuoteContext) => {
        const pickupNarrowStairs = context.getValue<boolean>('pickupNarrowStairs') || false;
        const pickupElevator = context.getValue<boolean>('pickupElevator') || false;
        const pickupFloor = context.getValue<number>('pickupFloor') || 0;
        
        return pickupNarrowStairs && !pickupElevator && pickupFloor <= 3;
      },
      true
    ),
    
    // Majoration pour escaliers étroits (arrivée)
    new Rule(
      'Majoration pour escaliers étroits (arrivée)',
      ServiceType.MOVING.toString(),
      50, // +50€
      (context: QuoteContext) => {
        const deliveryNarrowStairs = context.getValue<boolean>('deliveryNarrowStairs') || false;
        const deliveryElevator = context.getValue<boolean>('deliveryElevator') || false;
        const deliveryFloor = context.getValue<number>('deliveryFloor') || 0;
        
        return deliveryNarrowStairs && !deliveryElevator && deliveryFloor <= 3;
      },
      true
    ),
    
    // Majoration horaire (nuit ou soirée)
    new Rule(
      'Majoration horaire (nuit ou soirée)',
      ServiceType.MOVING.toString(),
      15, // +15%
      (context: QuoteContext) => {
        const movingDate = context.getValue<Date>('movingDate');
        if (!movingDate) return false;
        
        const hour = movingDate.getHours();
        return hour < 8 || hour >= 20;
      },
      true
    )
  ];
} 