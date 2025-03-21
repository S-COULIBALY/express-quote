export const cleaningRules = {
  basePrice: 2, // Prix de base par m²
  rules: [
    // Réductions selon la fréquence
    {
      name: "Réduction fréquence hebdomadaire",
      percentage: -20, // -20% (réduction)
      condition: (context: any) => context.frequency === 'WEEKLY'
    },
    {
      name: "Réduction fréquence bi-mensuelle",
      percentage: -15, // -15% (réduction)
      condition: (context: any) => context.frequency === 'BIWEEKLY'
    },
    {
      name: "Réduction fréquence mensuelle",
      percentage: -10, // -10% (réduction)
      condition: (context: any) => context.frequency === 'MONTHLY'
    },
    
    // Réduction grande surface
    {
      name: "Réduction grande surface",
      percentage: -10, // -10% (réduction)
      condition: (context: any) => context.squareMeters > 150
    },

    // Majorations
    {
      name: "Majoration présence d'animaux",
      percentage: 15, // +15%
      condition: (context: any) => context.hasPets === true
    },
    {
      name: "Majoration balcon",
      percentage: 10, // +10%
      condition: (context: any) => context.hasBalcony === true
    },

    // Majorations selon le type de nettoyage
    {
      name: "Majoration nettoyage en profondeur",
      percentage: 50, // +50%
      condition: (context: any) => context.cleaningType === 'DEEP'
    },
    {
      name: "Majoration nettoyage de départ",
      percentage: 33, // +33%
      condition: (context: any) => context.cleaningType === 'MOVING_OUT'
    },
    {
      name: "Majoration nettoyage post-construction",
      percentage: 66, // +66%
      condition: (context: any) => context.cleaningType === 'POST_CONSTRUCTION'
    }
  ]
}; 