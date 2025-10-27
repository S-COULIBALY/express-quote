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

  // Service de déménagement
  demenagement: {
    typeService: 'demenagement',
    datePrevue: '2024-02-20',
    horaire: 'matin-6h',
    adresseDepart: '123 Rue de la Paix, Paris 75001',
    adresseArrivee: '456 Avenue des Champs, Paris 75008',
    volume: 25,
    distance: 5.2,
    etageDepart: 2,
    etageArrivee: 1,
    ascenseurDepart: false,
    ascenseurArrivee: true,
    prix: 350,
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

// Données de test pour les webhooks Stripe
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
          bookingId: 'booking_123',
          customerId: 'customer_456'
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
        }
      }
    }
  }
};

// Données de test pour les états de réservation
export const donneesEtatReservationTest = {
  etapes: [
    'DRAFT',
    'CONFIRMED', 
    'AWAITING_PAYMENT',
    'PAYMENT_PROCESSING',
    'PAYMENT_COMPLETED',
    'COMPLETED'
  ],

  transitions: {
    'DRAFT': ['CONFIRMED,
    'CONFIRMED': ['AWAITING_PAYMENT'],
    'AWAITING_PAYMENT': ['PAYMENT_PROCESSING', 'CANCELED'],
    'PAYMENT_PROCESSING': ['PAYMENT_COMPLETED', 'PAYMENT_FAILED'],
    'PAYMENT_COMPLETED': ['COMPLETED'],
    'PAYMENT_FAILED': ['AWAITING_PAYMENT', 'CANCELED']
  }
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
  prix: (min = 50, max = 500) => Math.floor(Math.random() * (max - min + 1)) + min
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
