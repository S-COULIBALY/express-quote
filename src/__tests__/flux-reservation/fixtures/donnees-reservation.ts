/**
 * 🧪 **DONNÉES DE TEST POUR LES RÉSERVATIONS**
 * 
 * Ce fichier contient toutes les données de test nécessaires
 * pour valider le flux complet de réservation.
 */

// Données de base pour les tests de réservation
export const donneesReservationTest = {
  // Service de nettoyage standard
  nettoyage: {
    typeService: 'nettoyage',
    datePrevue: '2024-02-15',
    horaire: 'matin-8h',
    adresse: '123 Rue de la Paix, Paris 75001',
    surface: 50,
    duree: 2,
    professionnels: 1,
    prix: 120,
    contraintes: ['escalier', 'parking-difficile'],
    informationsSupplementaires: 'Appartement au 3ème étage sans ascenseur'
  },

  // Service de déménagement avec contraintes réalistes de la BDD
  demenagement: {
    typeService: 'demenagement',
    datePrevue: '2024-02-20',
    horaire: 'matin-6h',
    adresseDepart: '45 Rue Étroite, Vieil Immeuble, 75003 Paris',
    adresseArrivee: '28 Impasse Difficile, Centre-Ville, 69001 Lyon',
    volume: 45,
    distance: 465.3,
    etageDepart: 4,
    etageArrivee: 6,
    ascenseurDepart: false, // Escaliers au départ
    ascenseurArrivee: false, // Escaliers à l'arrivée
    distancePortageDepart: 35.0, // Longue distance au départ
    distancePortageArrivee: 40.0, // Longue distance à l'arrivée
    prix: 2250,
    // Contraintes GLOBAL (appliquées une fois sur tout le service)
    contraintesGlobales: {
      'd85f44a1-3f5f-4e28-883c-778000a2e23e': true, // Circulation complexe (+6.5%)
      '76d5aa58-d9ad-45c8-8c72-6a03d178d15d': true  // Stationnement difficile (+7.5%)
    },
    // Contraintes PICKUP (spécifiques au départ)
    contraintesDepart: {
      'b2b8f00b-00a2-456c-ad06-1150d25d71a3': true, // Couloirs étroits (+6.5%)
      '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85': true, // Ascenseur trop petit (+7.5%)
      '40acdd70-5c1f-4936-a53c-8f52e6695a4c': true  // Escaliers étroits (+8.5%)
    },
    // Services PICKUP (auto-détection)
    servicesDepart: {
      '5cdd32e3-23d5-413e-a9b4-26a746066ce0': true  // Monte-meuble requis départ (+150€)
    },
    // Contraintes DELIVERY (spécifiques à l'arrivée)
    contraintesArrivee: {
      'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901': true  // Longue distance portage (+9.5%)
      // Note: Ajouter d'autres contraintes DELIVERY réelles de votre BDD ici
    },
    // Services DELIVERY
    servicesArrivee: {
      '5cdd32e3-23d5-413e-a9b4-26a746066ce0': true  // Monte-meuble requis arrivée (+150€)
    },
    options: ['emballage', 'montage-meubles']
  },

  // Service de livraison
  livraison: {
    typeService: 'livraison',
    datePrevue: '2024-02-18',
    horaire: 'apres-midi-13h',
    adresseDepart: 'Entrepôt Logistique, 789 Zone Industrielle',
    adresseArrivee: '123 Rue de la Paix, Paris 75001',
    poids: 15.5,
    dimensions: '60x40x30',
    fragile: true,
    assurance: true,
    prix: 85
  }
};

// Données client pour les tests
export const donneesClientTest = {
  standard: {
    nom: 'Jean Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@email.com',
    telephone: '+33123456789',
    accepteCGU: true,
    accepteConfidentialite: true,
    optinWhatsApp: true
  },

  premium: {
    nom: 'Marie Martin',
    prenom: 'Marie',
    email: 'marie.martin@entreprise.com',
    telephone: '+33987654321',
    accepteCGU: true,
    accepteConfidentialite: true,
    optinWhatsApp: false
  },

  international: {
    nom: 'John Smith',
    prenom: 'John',
    email: 'john.smith@international.com',
    telephone: '+44123456789',
    accepteCGU: true,
    accepteConfidentialite: true,
    optinWhatsApp: true
  }
};

// Données de test pour les calculs de prix
export const donneesCalculPrixTest = {
  nettoyage: {
    surface: [25, 50, 100, 150],
    duree: [1, 2, 4, 6],
    professionnels: [1, 2, 3],
    contraintes: [
      [],
      ['escalier'],
      ['parking-difficile'],
      ['escalier', 'parking-difficile', 'animaux']
    ],
    prixAttendus: {
      '25-1-1': 60,
      '50-2-1': 120,
      '100-4-2': 320,
      '150-6-3': 540
    }
  },

  demenagement: {
    volume: [10, 25, 50, 100],
    distance: [2, 5, 10, 25],
    etages: [
      { depart: 0, arrivee: 0 },
      { depart: 2, arrivee: 1 },
      { depart: 5, arrivee: 3 },
      { depart: 0, arrivee: 4 }
    ],
    options: [
      [],
      ['emballage'],
      ['montage-meubles'],
      ['emballage', 'montage-meubles', 'stockage']
    ]
  }
};

// Données de test pour les notifications
export const donneesNotificationTest = {
  email: {
    sujet: 'Confirmation de votre réservation',
    contenu: 'Votre réservation a été confirmée',
    destinataire: 'jean.dupont@email.com',
    piecesJointes: ['confirmation.pdf', 'conditions.pdf']
  },

  sms: {
    message: 'Votre réservation de nettoyage du 15/02/2024 à 8h a été confirmée !',
    destinataire: '+33123456789'
  },

  whatsapp: {
    message: 'Bonjour Jean, votre réservation de nettoyage du 15/02/2024 à 8h a été confirmée ! 🧹✨',
    destinataire: '+33123456789',
    optin: true
  }
};

// Données de test pour les erreurs
export const donneesErreurTest = {
  validation: {
    datePassee: '2023-01-01',
    emailInvalide: 'email-invalide',
    telephoneInvalide: '123',
    champsManquants: {}
  },

  paiement: {
    carteRefusee: '4000000000000002',
    fondsInsuffisants: '4000000000009995',
    carteExpiree: '4000000000000069',
    authentification3DS: '4000002500003155'
  },

  reseau: {
    timeout: 5000,
    erreurServeur: 500,
    serviceIndisponible: 503
  }
};

// Données de test pour les performances
export const donneesPerformanceTest = {
  tempsReponse: {
    formulaire: 2000, // ms
    calculPrix: 500,  // ms
    soumission: 3000, // ms
    paiement: 5000    // ms
  },

  charges: {
    utilisateursSimultanes: 100,
    requetesParSeconde: 50,
    tailleDonnees: '1MB'
  }
};

// Données de test pour les webhooks Stripe (basées sur le flux actuel)
export const donneesWebhookStripeTest = {
  paiementReussi: {
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_123456789',
        amount: 12000,
        currency: 'eur',
        status: 'succeeded',
        metadata: {
          temporaryId: 'temp_123456789',
          customerFirstName: 'Jean',
          customerLastName: 'Dupont',
          customerEmail: 'jean.dupont@email.com',
          customerPhone: '+33123456789',
          quoteType: 'CLEANING',
          amount: '120.00'
        }
      }
    }
  },

  paiementEchoue: {
    type: 'payment_intent.payment_failed',
    data: {
      object: {
        id: 'pi_test_987654321',
        amount: 12000,
        currency: 'eur',
        status: 'requires_payment_method',
        last_payment_error: {
          code: 'card_declined',
          message: 'Your card was declined.'
        },
        metadata: {
          temporaryId: 'temp_987654321',
          customerFirstName: 'Jean',
          customerLastName: 'Dupont',
          customerEmail: 'jean.dupont@email.com',
          customerPhone: '+33123456789',
          quoteType: 'CLEANING',
          amount: '120.00'
        }
      }
    }
  },

  checkoutCompleted: {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123456789',
        payment_status: 'paid',
        amount_total: 12000,
        currency: 'eur',
        metadata: {
          temporaryId: 'temp_123456789',
          customerFirstName: 'Jean',
          customerLastName: 'Dupont',
          customerEmail: 'jean.dupont@email.com',
          customerPhone: '+33123456789',
          quoteType: 'CLEANING',
          amount: '120.00'
        }
      }
    }
  }
};

// Données de test pour les états de réservation (basées sur le schéma Prisma)
export const donneesEtatReservationTest = {
  etapes: [
    'DRAFT',
    'CONFIRMED', 
    'AWAITING_PAYMENT',
    'PAYMENT_PROCESSING',
    'PAYMENT_FAILED',
    'PAYMENT_COMPLETED',
    'CANCELED',
    'COMPLETED'
  ],

  transitions: {
    'DRAFT': ['CONFIRMED'],
    'CONFIRMED': ['AWAITING_PAYMENT'],
    'AWAITING_PAYMENT': ['PAYMENT_PROCESSING', 'CANCELED'],
    'PAYMENT_PROCESSING': ['PAYMENT_COMPLETED', 'PAYMENT_FAILED'],
    'PAYMENT_COMPLETED': ['COMPLETED'],
    'PAYMENT_FAILED': ['AWAITING_PAYMENT', 'CANCELED']
  },

  // Types de réservation selon le schéma
  typesReservation: [
    'MOVING_QUOTE',
    'PACKING', 
    'SERVICE'
  ],

  // Statuts de transaction
  statutsTransaction: [
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
  ]
};

// Données de test pour les attributions professionnelles
export const donneesAttributionTest = {
  professionnels: [
    {
      id: 'prof_1',
      nom: 'Entreprise Nettoyage Pro',
      type: 'CLEANING_SERVICE',
      note: 4.8,
      distance: 2.5,
      disponible: true
    },
    {
      id: 'prof_2', 
      nom: 'Déménageurs Express',
      type: 'MOVING_COMPANY',
      note: 4.6,
      distance: 5.1,
      disponible: true
    }
  ],

  attributions: {
    automatique: true,
    delaiReponse: 30, // minutes
    nombreProfessionnels: 3,
    rayonRecherche: 50 // km
  }
};

// Données de test pour les rapports et métriques
export const donneesMetriquesTest = {
  tauxConversion: {
    visiteFormulaire: 1000,
    soumissionFormulaire: 850,
    paiementReussi: 800,
    tauxSoumission: 0.85,
    tauxPaiement: 0.94
  },

  performance: {
    tempsChargementMoyen: 1.5, // secondes
    tauxErreur: 0.02,
    disponibilite: 0.999
  }
};

// Helper pour générer des données de test aléatoires
export const generateurDonneesTest = {
  email: () => `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
  telephone: () => `+33${Math.floor(Math.random() * 900000000) + 100000000}`,
  adresse: () => `${Math.floor(Math.random() * 999) + 1} Rue de Test, Paris`,
  dateFuture: (jours = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + jours);
    return date.toISOString().split('T')[0];
  },
  prix: (min = 50, max = 500) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  // Générateurs spécifiques au schéma Prisma
  uuid: () => `test-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
  temporaryId: () => `temp_${Math.random().toString(36).substr(2, 9)}`,
  paymentIntentId: () => `pi_test_${Math.random().toString(36).substr(2, 9)}`,
  bookingId: () => `booking_${Math.random().toString(36).substr(2, 9)}`,
  customerId: () => `customer_${Math.random().toString(36).substr(2, 9)}`,
  
  // Données de test pour les modèles Prisma
  customer: () => ({
    id: generateurDonneesTest.customerId(),
    email: generateurDonneesTest.email(),
    firstName: 'Test',
    lastName: 'User',
    phone: generateurDonneesTest.telephone(),
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  quoteRequest: () => ({
    id: generateurDonneesTest.uuid(),
    type: 'CLEANING',
    status: 'PENDING',
    quoteData: { surface: 50, duration: 2 },
    temporaryId: generateurDonneesTest.temporaryId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    catalogSelectionId: generateurDonneesTest.uuid()
  }),
  
  booking: () => ({
    id: generateurDonneesTest.bookingId(),
    type: 'SERVICE',
    status: 'DRAFT',
    customerId: generateurDonneesTest.customerId(),
    totalAmount: 120.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    quoteRequestId: generateurDonneesTest.uuid()
  }),
  
  transaction: () => ({
    id: generateurDonneesTest.uuid(),
    bookingId: generateurDonneesTest.bookingId(),
    amount: 120.0,
    currency: 'EUR',
    status: 'PENDING',
    paymentIntentId: generateurDonneesTest.paymentIntentId(),
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

// 🎯 **DONNÉES DE TEST SCOPES (GLOBAL, PICKUP, DELIVERY, BOTH)**
// Basées sur les règles réelles de la base de données
export const donneesTestScopes = {
  // Scénario 1: Uniquement GLOBAL (appliqué une seule fois)
  globalUniquement: {
    volume: 35,
    distance: 15.8,
    adresseDepart: '45 Rue des Vieux Quartiers, 75003 Paris',
    adresseArrivee: '12 Impasse du Château, 92100 Boulogne',
    etageDepart: 1,
    etageArrivee: 1,
    ascenseurDepart: true,
    ascenseurArrivee: true,
    contraintesGlobales: {
      'd85f44a1-3f5f-4e28-883c-778000a2e23e': true, // Circulation complexe (GLOBAL, +6.5%)
      '76d5aa58-d9ad-45c8-8c72-6a03d178d15d': true  // Stationnement difficile (GLOBAL, +7.5%)
    },
    scopeExplanation: 'Ces règles GLOBAL affectent l\'ensemble du service (une seule fois)'
  },

  // Scénario 2: Uniquement PICKUP
  pickupUniquement: {
    volume: 45,
    distance: 15.8,
    adresseDepart: '45 Rue Étroite, Vieil Immeuble, 75003 Paris', // Contraintes au DÉPART
    adresseArrivee: '12 Avenue Large, Immeuble Moderne, 92100 Boulogne', // Pas de contraintes
    etageDepart: 5,
    etageArrivee: 1,
    ascenseurDepart: true, // Mais trop petit
    ascenseurArrivee: true, // Normal
    distancePortageDepart: 35.0,
    distancePortageArrivee: 5.0,
    contraintesDepart: {
      'b2b8f00b-00a2-456c-ad06-1150d25d71a3': true, // Couloirs étroits (PICKUP, +6.5%)
      '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85': true, // Ascenseur trop petit (PICKUP, +7.5%)
      '40acdd70-5c1f-4936-a53c-8f52e6695a4c': true  // Escaliers étroits (PICKUP, +8.5%)
    },
    servicesDepart: {
      '5cdd32e3-23d5-413e-a9b4-26a746066ce0': true  // Monte-meuble départ (PICKUP, +150€)
    },
    scopeExplanation: 'Ces règles PICKUP ne s\'appliquent qu\'à l\'adresse de départ'
  },

  // Scénario 3: Uniquement DELIVERY
  deliveryUniquement: {
    volume: 50,
    distance: 465.3,
    adresseDepart: '10 Boulevard Facile, Rez-de-chaussée, 75001 Paris', // Pas de contraintes
    adresseArrivee: '28 Impasse Difficile, Vieil Immeuble, 69001 Lyon', // Contraintes ARRIVÉE
    etageDepart: 0,
    etageArrivee: 6,
    ascenseurDepart: true,
    ascenseurArrivee: false,
    distancePortageDepart: 5.0,
    distancePortageArrivee: 40.0,
    contraintesArrivee: {
      'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901': true  // Longue distance portage (DELIVERY, +9.5%)
      // Note: Ajouter d'autres contraintes DELIVERY réelles de votre BDD ici
    },
    servicesArrivee: {
      '5cdd32e3-23d5-413e-a9b4-26a746066ce0': true  // Monte-meuble arrivée (DELIVERY, +150€)
    },
    scopeExplanation: 'Ces règles DELIVERY ne s\'appliquent qu\'à l\'adresse d\'arrivée'
  },

  // Scénario 4: Règles BOTH (appliquées indépendamment à chaque adresse)
  bothScopes: {
    volume: 40,
    distance: 465.3,
    adresseDepart: '15 Rue des Marches, Vieux Quartier, 75011 Paris', // Multi-niveaux + escaliers
    adresseArrivee: '8 Impasse du Parking, Centre-Ville, 69002 Lyon', // Multi-niveaux + parking
    etageDepart: 4,
    etageArrivee: 3,
    ascenseurDepart: false,
    ascenseurArrivee: false,
    distancePortageDepart: 25.0,
    distancePortageArrivee: 30.0,
    // Règles BOTH au départ
    contraintesBothDepart: {
      '293dc311-6f22-42d8-8b31-b322c0e888f9': true  // Accès multi-niveaux (BOTH, +9.5%)
      // Note: Ajouter d'autres règles BOTH réelles de votre BDD ici
    },
    // Règles BOTH à l'arrivée
    contraintesBothArrivee: {
      '293dc311-6f22-42d8-8b31-b322c0e888f9': true  // Accès multi-niveaux (BOTH, +9.5%) - même règle, appliquée 2x
      // Note: Ajouter d'autres règles BOTH réelles de votre BDD ici
    },
    scopeExplanation: 'Les règles BOTH peuvent s\'appliquer aux DEUX adresses indépendamment. Si condition match aux deux → appliqué 2 fois.'
  },

  // Scénario 5: Mixte (GLOBAL + PICKUP + DELIVERY + BOTH)
  scenarioComplet: {
    volume: 50,
    distance: 465.3,
    adresseDepart: '45 Rue Difficile, Vieux Quartier, 75003 Paris',
    adresseArrivee: '28 Impasse Complexe, Centre-Ville, 69001 Lyon',
    etageDepart: 5,
    etageArrivee: 6,
    ascenseurDepart: false,
    ascenseurArrivee: false,
    distancePortageDepart: 35.0,
    distancePortageArrivee: 40.0,
    // GLOBAL (appliqué 1x)
    contraintesGlobales: {
      'd85f44a1-3f5f-4e28-883c-778000a2e23e': true, // Circulation complexe (GLOBAL, +6.5%)
      '76d5aa58-d9ad-45c8-8c72-6a03d178d15d': true  // Stationnement difficile (GLOBAL, +7.5%)
    },
    // PICKUP
    contraintesDepart: {
      'b2b8f00b-00a2-456c-ad06-1150d25d71a3': true, // Couloirs étroits (PICKUP, +6.5%)
      '40acdd70-5c1f-4936-a53c-8f52e6695a4c': true  // Escaliers étroits (PICKUP, +8.5%)
    },
    servicesDepart: {
      '5cdd32e3-23d5-413e-a9b4-26a746066ce0': true  // Monte-meuble départ (PICKUP, +150€)
    },
    // DELIVERY
    contraintesArrivee: {
      'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901': true  // Longue distance portage (DELIVERY, +9.5%)
      // Note: Ajouter d'autres contraintes DELIVERY réelles de votre BDD ici
    },
    servicesArrivee: {
      '5cdd32e3-23d5-413e-a9b4-26a746066ce0': true  // Monte-meuble arrivée (DELIVERY, +150€)
    },
    // BOTH (appliqué aux 2 adresses)
    contraintesBothDepart: {
      '293dc311-6f22-42d8-8b31-b322c0e888f9': true  // Accès multi-niveaux (BOTH, +9.5%)
    },
    contraintesBothArrivee: {
      '293dc311-6f22-42d8-8b31-b322c0e888f9': true  // Accès multi-niveaux (BOTH, +9.5%)
    },
    scopeExplanation: 'Scénario complet avec tous les scopes: GLOBAL (1x) + PICKUP + DELIVERY + BOTH (2x)'
  }
};

// UUIDs réels des règles de la base de données (pour référence)
export const reglesBDDUUIDs = {
  // Règles GLOBAL
  circulationComplexe: 'd85f44a1-3f5f-4e28-883c-778000a2e23e',
  stationnementDifficile: '76d5aa58-d9ad-45c8-8c72-6a03d178d15d',

  // Règles PICKUP
  couloirsEtroits: 'b2b8f00b-00a2-456c-ad06-1150d25d71a3',
  ascenseurTropPetit: '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85',
  escaliersEtroits: '40acdd70-5c1f-4936-a53c-8f52e6695a4c',
  monteMeubleDepart: '5cdd32e3-23d5-413e-a9b4-26a746066ce0',

  // Règles DELIVERY
  longueDistancePortage: 'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901',
  // Note: Les UUIDs ci-dessous sont des exemples. Remplacer par les vrais UUIDs de votre BDD
  accesEtroitArrivee: 'EXAMPLE-UUID-DELIVERY-ACCESS', // À remplacer par UUID réel
  monteMeubleArrivee: '5cdd32e3-23d5-413e-a9b4-26a746066ce0',

  // Règles BOTH
  accesMultiNiveaux: '293dc311-6f22-42d8-8b31-b322c0e888f9',
  // Note: Les UUIDs ci-dessous sont des exemples. Remplacer par les vrais UUIDs de votre BDD
  escaliersSansAscenseur: 'EXAMPLE-UUID-BOTH-STAIRS', // À remplacer par UUID réel
  parkingRestreint: 'EXAMPLE-UUID-BOTH-PARKING', // À remplacer par UUID réel

  // Règle service (MOVING)
  objetsFragiles: '352eabed-8869-460f-b7f0-99237b003cc1'
};

// Configuration des environnements de test
export const configurationTest = {
  baseDeDonnees: {
    url: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test',
    isolation: true
  },

  stripe: {
    clePublique: process.env.STRIPE_PUBLISHABLE_KEY_TEST,
    cleSecrete: process.env.STRIPE_SECRET_KEY_TEST,
    secretWebhook: process.env.STRIPE_WEBHOOK_SECRET_TEST
  },

  notifications: {
    email: {
      active: false,
      simulation: true
    },
    sms: {
      active: false,
      simulation: true
    },
    whatsapp: {
      active: false,
      simulation: true
    }
  },

  performance: {
    timeout: 30000, // 30 secondes
    retry: 3,
    intervalle: 1000 // 1 seconde
  }
};
