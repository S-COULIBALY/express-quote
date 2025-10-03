import { Rule } from '../valueObjects/Rule';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { ServiceType } from '../enums/ServiceType';
import { Money } from '../valueObjects/Money';
import { DefaultValues } from '../configuration/DefaultValues';

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
      'day === 0 || day === 6', // Dimanche ou Samedi
      true
    ),
    
    // Réduction pour réservation anticipée (-10%)
    new Rule(
      'Réduction réservation anticipée',
      ServiceType.MOVING.toString(),
      -10, // -10%
      'diffDays > 30', // Plus de 30 jours à l'avance
      true
    ),
    
    // Majoration pour objets fragiles (+8%)
    new Rule(
      'Majoration objets fragiles',
      ServiceType.MOVING.toString(),
      8, // +8%
      'hasFragileItems === true',
      true
    ),
    
    // Supplément pour monte-meuble (montant fixe)
    // ✅ REFACTORISÉ: Utilise DefaultValues.FURNITURE_LIFT_SURCHARGE
    new Rule(
      'Supplément monte-meuble',
      'PACKING',
      DefaultValues.FURNITURE_LIFT_SURCHARGE, // Depuis DefaultValues (200€)
      'furniture_lift_required',
      true
    ),
    
    // Tarif minimum pour un déménagement
    new Rule(
      'Tarif minimum',
      ServiceType.MOVING.toString(),
      0, // Valeur à 0, sera calculée dynamiquement
      'true', // Toujours applicable
      true
    ),
    
    // Supplément pour étages sans ascenseur
    new Rule(
      'Supplément étages sans ascenseur',
      ServiceType.MOVING.toString(),
      50, // +50€
      '(pickupFloor > 1 && !pickupElevator) || (deliveryFloor > 1 && !deliveryElevator)',
      true
    ),
    
    // Réduction pour petit volume
    new Rule(
      'Réduction pour petit volume',
      ServiceType.MOVING.toString(),
      -10, // -10%
      'volume < 10',
      true
    ),
    
    // Réduction pour grand volume
    new Rule(
      'Réduction pour grand volume',
      ServiceType.MOVING.toString(),
      -5, // -5%
      'volume > 50',
      true
    ),
    
    // Majoration haute saison
    new Rule(
      'Majoration haute saison',
      ServiceType.MOVING.toString(),
      30, // +30%
      'month >= 5 && month <= 8', // Juin à Septembre (month est 0-indexed)
      true
    ),

    // ✅ Majoration pour contrainte de distance de portage longue (>30m)
    new Rule(
      'Majoration distance de portage > 30m',
      ServiceType.MOVING.toString(),
      DefaultValues.LONG_CARRYING_DISTANCE_SURCHARGE, // Depuis DefaultValues (50€)
      'long_carrying_distance', // Auto-détectée par AutoDetectionService
      true
    ),
    
    // Majoration pour escaliers étroits (départ)
    new Rule(
      'Majoration pour escaliers étroits (départ)',
      ServiceType.MOVING.toString(),
      50, // +50€
      'pickupNarrowStairs && !pickupElevator && pickupFloor <= 3',
      true
    ),
    
    // Majoration pour escaliers étroits (arrivée)
    new Rule(
      'Majoration pour escaliers étroits (arrivée)',
      ServiceType.MOVING.toString(),
      50, // +50€
      'deliveryNarrowStairs && !deliveryElevator && deliveryFloor <= 3',
      true
    ),
    
    // Majoration horaire (nuit ou soirée)
    new Rule(
      'Majoration horaire (nuit ou soirée)',
      ServiceType.MOVING.toString(),
      15, // +15%
      'hour < 8 || hour >= 20', // Nuit ou soirée
      true
    )
  ];
} 