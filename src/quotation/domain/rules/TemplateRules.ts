import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../enums/ServiceType';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';

/**
 * Crée les règles métier unifiées pour les devis basés sur le système Template/Item
 * Ces règles remplacent PackRules et ServiceRules et fonctionnent avec tous les types de services
 * @returns Tableau de règles pour les templates/items
 */
export function createTemplateRules(): Rule[] {
  return [
    // === RÈGLES TEMPORELLES ===
    
    // Majoration pour les prestations le week-end
    new Rule(
      'Majoration week-end',
      'ALL', // Applicable à tous les types
      20, // +20% pour déménagement/transport, +25% pour services (moyenne)
      'day === 0 || day === 6', // Weekend condition
      true
    ),
    
    // Réduction pour réservation anticipée
    new Rule(
      'Réduction réservation anticipée',
      'ALL',
      -8, // -8% pour déménagement, -5% pour services (moyenne)
      'diffDays > 10', // Condition simplifiée - plus de 10 jours
      true
    ),
    
    // Majoration pour réservation urgente
    new Rule(
      'Majoration réservation urgente',
      'ALL',
      20, // +25% pour déménagement, +15% pour services (moyenne)
      'diffHours <= 48', // Condition simplifiée - moins de 48h
      true
    ),
    
    // Majoration horaires étendus (services uniquement)
    new Rule(
      'Majoration horaires étendus',
      'SERVICE',
      15, // +15%
      'hour < 8 || hour >= 18', // Horaires étendus
      true
    ),
    
    // === RÈGLES DE DURÉE ===
    
    // Réduction pour longue durée
    new Rule(
      'Réduction longue durée',
      'ALL',
      -10, // -12% pour déménagement, -8% pour services (moyenne)
      'duration > 3', // Plus de 3 heures/jours
      true
    ),
    
    // === RÈGLES DE DISTANCE ===
    
    // Majoration zone étendue
    new Rule(
      'Majoration zone étendue',
      'MOVING',
      15, // +15%
      'distance > 50', // Plus de 50km
      true
    ),
    
    // Réduction longue distance (économies d'échelle)
    new Rule(
      'Réduction longue distance',
      'MOVING',
      -5, // -5%
      'distance > 100', // Plus de 100km
      true
    ),
    
    // === RÈGLES DE TRAVAILLEURS ===
    
    // Réduction pour plus de travailleurs
    new Rule(
      'Réduction plus de travailleurs',
      'ALL',
      -5, // -5%
      'workers > 2', // Plus de 2 travailleurs
      true
    ),
    
    // === RÈGLES CLIENT ===
    
    // Réduction client fidèle (services uniquement)
    new Rule(
      'Réduction client fidèle',
      'SERVICE',
      -10, // -10%
      'isReturningCustomer === true', // Client fidèle
      true
    ),
    
    // === RÈGLES SPÉCIALES ===
    
    // Majoration équipement spécial (services uniquement)
    new Rule(
      'Majoration équipement spécial',
      'SERVICE',
      50, // +50€ (montant fixe)
      'false', // Désactivé temporairement - variable requiresSpecialEquipment non disponible
      true
    ),
    
    // Réduction pour items populaires
    new Rule(
      'Réduction items populaires',
      'ALL',
      -3, // -3%
      'false', // Désactivé temporairement - variables isPopularItem/popular non disponibles
      true
    ),
    
    // Réduction jour de semaine
    new Rule(
      'Réduction jour de semaine',
      'ALL',
      -6, // -8% pour déménagement, -5% pour services (moyenne)
      'day >= 1 && day <= 4', // Lundi à jeudi
      true
    ),
    
    // === RÈGLE DE MINIMUM ===
    
    // Tarif minimum (toujours en dernier)
    new Rule(
      'Tarif minimum',
      'ALL',
      0, // Calculé dynamiquement
      'true', // Toujours applicable
      true
    )
  ];
} 