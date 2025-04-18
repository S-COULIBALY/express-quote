import { Pack, Service } from '@/types/booking'

// Fonction utilitaire pour générer les features de base
function generateBaseFeatures(pack: Partial<Pack>): string[] {
  const features = [
    `${pack.workers} déménageur${pack.workers! > 1 ? 's' : ''} professionnel${pack.workers! > 1 ? 's' : ''}`,
    `${pack.duration} jour${pack.duration! > 1 ? 's' : ''} de service`,
    `${pack.includedDistance} ${pack.distanceUnit} inclus`
  ]
  return features
}

// Fonction utilitaire pour générer les features de base des services
function generateServiceFeatures(service: Partial<Service>): string[] {
  const features = [
    `${service.workers} professionnel${service.workers! > 1 ? 's' : ''} qualifié${service.workers! > 1 ? 's' : ''}`,
    service.duration === 1 
      ? '1 heure de service' 
      : service.duration! >= 30 
        ? `${Math.floor(service.duration! / 30)} mois de service`
        : `${service.duration} heures de service`
  ]
  return features
}

export const mockPacks: Pack[] = [
  {
    id: 'pack-1',
    bookingId: '',
    name: 'Pack Déménagement Studio',
    description: 'Idéal pour un studio ou un petit appartement, ce pack inclut tout ce dont vous avez besoin pour un déménagement efficace.',
    price: 299,
    includes: [],
    features: [
      ...generateBaseFeatures({
        workers: 2,
        duration: 1,
        includedDistance: 20,
        distanceUnit: 'km'
      }),
      'Camion de déménagement adapté',
      'Matériel de protection'
    ],
    popular: false,
    scheduledDate: new Date(),
    pickupAddress: '',
    deliveryAddress: '',
    duration: 1,
    workers: 2,
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    includedDistance: 20,
    distanceUnit: 'km'
  },
  {
    id: 'pack-2',
    bookingId: '',
    name: 'Pack Déménagement 2 Pièces',
    description: 'Pack complet pour un appartement de 2 pièces, incluant tous les services nécessaires pour un déménagement sans stress.',
    price: 499,
    includes: [],
    features: [
      ...generateBaseFeatures({
        workers: 3,
        duration: 1,
        includedDistance: 20,
        distanceUnit: 'km'
      }),
      'Camion de déménagement adapté',
      'Matériel de protection',
      'Service d\'emballage basique'
    ],
    popular: true,
    scheduledDate: new Date(),
    pickupAddress: '',
    deliveryAddress: '',
    duration: 1,
    workers: 3,
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    includedDistance: 20,
    distanceUnit: 'km'
  },
  {
    id: 'pack-3',
    bookingId: '',
    name: 'Pack Déménagement 3 Pièces',
    description: 'Solution complète pour un appartement de 3 pièces, avec une équipe expérimentée et tous les services inclus.',
    price: 699,
    includes: [],
    features: [
      '4 déménageurs professionnels',
      '1 jour de service',
      '20 kms inclus',
      'Camion de déménagement grand volume',
      'Matériel de protection premium',
      'Service d\'emballage complet'
    ],
    popular: false,
    scheduledDate: new Date(),
    pickupAddress: '',
    deliveryAddress: '',
    duration: 1,
    workers: 4,
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    includedDistance: 20,
    distanceUnit: 'km'
  },
  {
    id: 'pack-4',
    bookingId: '',
    name: 'Pack Déménagement 4 Pièces',
    description: 'Pack premium pour un appartement de 4 pièces, avec une équipe professionnelle et des services haut de gamme.',
    price: 899,
    includes: [],
    features: [
      '4 déménageurs professionnels',
      '2 jours de service',
      '20 kms inclus',
      'Camion de déménagement grand volume',
      'Matériel de protection premium',
      'Service d\'emballage et déballage',
      'Assurance tous risques'
    ],
    popular: false,
    scheduledDate: new Date(),
    pickupAddress: '',
    deliveryAddress: '',
    duration: 2,
    workers: 4,
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    includedDistance: 20,
    distanceUnit: 'km'
  },
  {
    id: 'pack-5',
    bookingId: '',
    name: 'Pack Déménagement Maison',
    description: 'Solution complète pour une maison, adaptée aux volumes plus importants et aux besoins spécifiques.',
    price: 1299,
    includes: [],
    features: [
      '5 déménageurs professionnels',
      '2 jours de service',
      '20 kms inclus',
      '2 camions de déménagement',
      'Matériel de protection premium',
      'Service d\'emballage et déballage complet',
      'Démontage et remontage des meubles',
      'Assurance tous risques'
    ],
    popular: false,
    scheduledDate: new Date(),
    pickupAddress: '',
    deliveryAddress: '',
    duration: 2,
    workers: 5,
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    includedDistance: 20,
    distanceUnit: 'km'
  },
  {
    id: 'pack-6',
    bookingId: '',
    name: 'Pack Déménagement Luxe',
    description: 'Service premium tout inclus pour un déménagement haut de gamme, avec une attention particulière aux détails.',
    price: 1999,
    includes: [],
    features: [
      '6 déménageurs professionnels',
      '3 jours de service',
      '20 kms inclus',
      '2 camions de déménagement grand volume',
      'Matériel de protection haut de gamme',
      'Service d\'emballage et déballage complet avec inventaire',
      'Démontage et remontage de tous les meubles',
      'Service de nettoyage des deux logements',
      'Assurance tous risques premium'
    ],
    popular: false,
    scheduledDate: new Date(),
    pickupAddress: '',
    deliveryAddress: '',
    duration: 3,
    workers: 6,
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    includedDistance: 20,
    distanceUnit: 'km'
  }
]

export const mockServices: Service[] = [
  {
    id: 'service-1',
    bookingId: '',
    name: 'Service de Démontage',
    description: 'Service professionnel de démontage de meubles, assurant une dépose soigneuse et sécurisée.',
    price: 149,
    duration: 4,
    workers: 2,
    includes: [],
    features: [
      ...generateServiceFeatures({
        workers: 2,
        duration: 4
      }),
      'Outils professionnels fournis',
      'Protection des meubles',
      'Tri et étiquetage des pièces'
    ],
    scheduledDate: new Date(),
    location: '',
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'service-2',
    bookingId: '',
    name: 'Service d\'Emballage',
    description: 'Service complet d\'emballage de vos biens, avec des matériaux professionnels et une expertise garantie.',
    price: 199,
    duration: 8,
    workers: 2,
    includes: [],
    features: [
      ...generateServiceFeatures({
        workers: 2,
        duration: 8
      }),
      'Matériel d\'emballage fourni',
      'Protection spéciale objets fragiles',
      'Inventaire détaillé'
    ],
    scheduledDate: new Date(),
    location: '',
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'service-3',
    bookingId: '',
    name: 'Service de Nettoyage',
    description: 'Service de nettoyage professionnel de votre ancien et nouveau logement.',
    price: 249,
    duration: 6,
    workers: 3,
    includes: [],
    features: [
      ...generateServiceFeatures({
        workers: 3,
        duration: 6
      }),
      'Produits écologiques',
      'Nettoyage en profondeur',
      'Traitement des surfaces spéciales'
    ],
    scheduledDate: new Date(),
    location: '',
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'service-4',
    bookingId: '',
    name: 'Service de Garde-Meuble',
    description: 'Solution de stockage sécurisé pour vos biens, avec accès flexible et surveillance 24/7.',
    price: 99,
    duration: 720, // 30 jours × 24 heures
    workers: 1,
    includes: [],
    features: [
      ...generateServiceFeatures({
        workers: 1,
        duration: 720
      }),
      'Espace sécurisé 24/7',
      'Accès sur rendez-vous',
      'Assurance stockage incluse'
    ],
    scheduledDate: new Date(),
    location: '',
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'service-5',
    bookingId: '',
    name: 'Service de Remontage',
    description: 'Service professionnel de remontage de meubles, assurant une installation parfaite.',
    price: 179,
    duration: 4,
    workers: 2,
    includes: [],
    features: [
      ...generateServiceFeatures({
        workers: 2,
        duration: 4
      }),
      'Outils professionnels fournis',
      'Vérification finale',
      'Nettoyage post-installation'
    ],
    scheduledDate: new Date(),
    location: '',
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'service-6',
    bookingId: '',
    name: 'Service de Conciergerie',
    description: 'Service personnalisé de conciergerie pour gérer tous les aspects de votre déménagement.',
    price: 1299,
    duration: 168, // 7 jours × 24 heures
    workers: 1,
    includes: [],
    features: [
      ...generateServiceFeatures({
        workers: 1,
        duration: 168
      }),
      'Coordination complète',
      'Support prioritaire',
      'Gestion administrative'
    ],
    scheduledDate: new Date(),
    location: '',
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }
] 