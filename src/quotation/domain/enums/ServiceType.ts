/**
 * Types de services proposés
 */
export enum ServiceType {
  MOVING = 'MOVING',        // Déménagements standards (compatibilité avec MovingRules)
  PACKING = 'PACKING',      // Déménagements du catalogue (packs prédéfinis)
  CLEANING = 'CLEANING',    // Services de nettoyage du catalogue (packs prédéfinis) 
  DELIVERY = 'DELIVERY',    // Services de livraison du catalogue (packs prédéfinis) 
  MOVING_PREMIUM = 'MOVING_PREMIUM',         // Déménagements premium/sur mesure (personnalisés) 
  CLEANING_PREMIUM = 'CLEANING_PREMIUM',     // Services de nettoyage premium/sur mesure (personnalisés)
  SERVICE = 'SERVICE'       // Services génériques (compatibilité avec rules existantes)
} 