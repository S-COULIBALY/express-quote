/**
 * 🧪 **CARTES DE TEST STRIPE**
 * 
 * Ce fichier contient toutes les cartes de test Stripe
 * pour valider les différents scénarios de paiement.
 */

// Cartes de test Stripe pour différents scénarios
export const cartesTestStripe = {
  // ✅ Paiements réussis
  succes: {
    visa: {
      numero: '4242424242424242',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Visa - Paiement réussi'
    },
    
    mastercard: {
      numero: '5555555555554444',
      expiration: '12/25', 
      cvc: '123',
      nom: 'Test User',
      description: 'Mastercard - Paiement réussi'
    },
    
    amex: {
      numero: '378282246310005',
      expiration: '12/25',
      cvc: '1234',
      nom: 'Test User',
      description: 'American Express - Paiement réussi'
    }
  },

  // ❌ Paiements échoués
  echecs: {
    carteRefusee: {
      numero: '4000000000000002',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte refusée - Générique'
    },
    
    fondsInsuffisants: {
      numero: '4000000000009995',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Fonds insuffisants'
    },
    
    carteExpiree: {
      numero: '4000000000000069',
      expiration: '12/20',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte expirée'
    },
    
    numeroInvalide: {
      numero: '4000000000000001',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Numéro de carte invalide'
    },
    
    cvcInvalide: {
      numero: '4242424242424242',
      expiration: '12/25',
      cvc: '99',
      nom: 'Test User',
      description: 'CVC invalide'
    }
  },

  // 🔐 Authentification 3D Secure
  authentification3DS: {
    authentificationReussie: {
      numero: '4000002500003155',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: '3D Secure - Authentification réussie'
    },
    
    authentificationEchouee: {
      numero: '4000002500003155',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: '3D Secure - Authentification échouée'
    },
    
    authentificationAnnulee: {
      numero: '4000002500003155',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: '3D Secure - Authentification annulée'
    }
  },

  // 💳 Cartes avec limitations
  limitations: {
    limiteDepasse: {
      numero: '4000000000000002',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Limite de dépense dépassée'
    },
    
    carteBloquee: {
      numero: '4000000000000002',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte bloquée par la banque'
    },
    
    retraitAutomatique: {
      numero: '4000000000000002',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Retrait automatique refusé'
    }
  },

  // 🌍 Cartes internationales
  internationales: {
    royaumeUni: {
      numero: '4000008260003178',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte UK - Paiement réussi'
    },
    
    allemagne: {
      numero: '4000002760003184',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte Allemande - Paiement réussi'
    },
    
    espagne: {
      numero: '4000007240003167',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte Espagnole - Paiement réussi'
    }
  },

  // 🏦 Cartes de débit
  debit: {
    debitStandard: {
      numero: '4000056655665556',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte de débit standard'
    },
    
    debitPrepaye: {
      numero: '4000000000000002',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Carte de débit prépayée'
    }
  },

  // 💰 Montants de test
  montants: {
    petit: 50,      // 50€
    moyen: 120,     // 120€
    grand: 500,     // 500€
    tresGrand: 2000 // 2000€
  },

  // 🔄 Scénarios de retry
  retry: {
    premierEchec: {
      numero: '4000000000000002',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Premier échec, retry possible'
    },
    
    echecDefinitif: {
      numero: '4000000000000002',
      expiration: '12/25',
      cvc: '123',
      nom: 'Test User',
      description: 'Échec définitif, pas de retry'
    }
  }
};

// Scénarios de test complets
export const scenariosPaiementTest = {
  // ✅ Scénario de succès standard
  succesStandard: {
    carte: cartesTestStripe.succes.visa,
    montant: 120,
    description: 'Paiement standard réussi',
    resultatAttendu: 'succeeded'
  },

  // ❌ Scénario d'échec standard
  echecStandard: {
    carte: cartesTestStripe.echecs.carteRefusee,
    montant: 120,
    description: 'Paiement refusé',
    resultatAttendu: 'requires_payment_method'
  },

  // 🔐 Scénario 3D Secure
  authentification3DS: {
    carte: cartesTestStripe.authentification3DS.authentificationReussie,
    montant: 500,
    description: 'Paiement avec 3D Secure',
    resultatAttendu: 'requires_action'
  },

  // 💰 Scénario de montant élevé
  montantEleve: {
    carte: cartesTestStripe.succes.visa,
    montant: 2000,
    description: 'Paiement de montant élevé',
    resultatAttendu: 'succeeded'
  },

  // 🌍 Scénario international
  paiementInternational: {
    carte: cartesTestStripe.internationales.royaumeUni,
    montant: 120,
    description: 'Paiement international',
    resultatAttendu: 'succeeded'
  }
};

// Données de test pour les webhooks Stripe
export const donneesWebhookTest = {
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
    },
    description: 'Webhook paiement réussi'
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
    },
    description: 'Webhook paiement échoué'
  },

  authentification3DS: {
    type: 'payment_intent.requires_action',
    data: {
      object: {
        id: 'pi_test_111222333',
        amount: 50000,
        currency: 'eur',
        status: 'requires_action',
        next_action: {
          type: 'use_stripe_sdk',
          use_stripe_sdk: {
            type: 'three_d_secure_redirect',
            stripe_js: 'https://js.stripe.com/v3/',
            source: 'src_test_123'
          }
        }
      }
    },
    description: 'Webhook authentification 3D Secure'
  }
};

// Configuration des tests de paiement
export const configurationPaiementTest = {
  stripe: {
    mode: 'test',
    clePublique: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST,
    cleSecrete: process.env.STRIPE_SECRET_KEY_TEST,
    secretWebhook: process.env.STRIPE_WEBHOOK_SECRET_TEST
  },

  timeouts: {
    paiement: 30000,    // 30 secondes
    webhook: 10000,     // 10 secondes
    authentification: 60000 // 1 minute
  },

  retry: {
    maxTentatives: 3,
    delaiEntreTentatives: 1000 // 1 seconde
  }
};

// Helper pour générer des données de test aléatoires
export const generateurPaiementTest = {
  carteAleatoire: () => {
    const cartes = Object.values(cartesTestStripe.succes);
    return cartes[Math.floor(Math.random() * cartes.length)];
  },

  montantAleatoire: (min = 50, max = 500) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  dateExpiration: (annees = 2) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + annees);
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = String(date.getFullYear()).slice(-2);
    return `${mois}/${annee}`;
  },

  cvc: () => {
    return String(Math.floor(Math.random() * 900) + 100);
  }
};
