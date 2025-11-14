/**
 * 🧪 **TYPES FIXTURES - Tests de Réservation**
 * 
 * Définitions de types pour les fixtures de test
 */

declare module '../fixtures/donnees-reservation' {
  export const donneesReservationTest: {
    nettoyage: {
      typeService: string;
      datePrevue: string;
      horaire: string;
      adresse: string;
      surface: number;
      duree: number;
      professionnels: number;
      prix: number;
      contraintes: string[];
      informationsSupplementaires: string;
    };
    demenagement: {
      typeService: string;
      datePrevue: string;
      horaire: string;
      adresseDepart: string;
      adresseArrivee: string;
      volume: number;
      distance: number;
      etageDepart: number;
      etageArrivee: number;
      ascenseurDepart: boolean;
      ascenseurArrivee: boolean;
      prix: number;
      options: string[];
    };
    livraison: {
      typeService: string;
      datePrevue: string;
      horaire: string;
      adresseDepart: string;
      adresseArrivee: string;
      poids: number;
      dimensions: string;
      fragile: boolean;
      assurance: boolean;
      prix: number;
    };
  };

  export const donneesClientTest: {
    standard: {
      nom: string;
      prenom: string;
      email: string;
      telephone: string;
      accepteCGU: boolean;
      accepteConfidentialite: boolean;
      optinWhatsApp: boolean;
    };
    premium: {
      nom: string;
      prenom: string;
      email: string;
      telephone: string;
      accepteCGU: boolean;
      accepteConfidentialite: boolean;
      optinWhatsApp: boolean;
    };
    international: {
      nom: string;
      prenom: string;
      email: string;
      telephone: string;
      accepteCGU: boolean;
      accepteConfidentialite: boolean;
      optinWhatsApp: boolean;
    };
  };

  export const donneesWebhookStripeTest: {
    paiementReussi: {
      type: string;
      data: {
        object: {
          id: string;
          amount: number;
          currency: string;
          status: string;
          metadata: {
            temporaryId: string;
            customerFirstName: string;
            customerLastName: string;
            customerEmail: string;
            customerPhone: string;
            quoteType: string;
            amount: string;
          };
        };
      };
    };
    paiementEchoue: {
      type: string;
      data: {
        object: {
          id: string;
          amount: number;
          currency: string;
          status: string;
          last_payment_error: {
            code: string;
            message: string;
          };
          metadata: {
            temporaryId: string;
            customerFirstName: string;
            customerLastName: string;
            customerEmail: string;
            customerPhone: string;
            quoteType: string;
            amount: string;
          };
        };
      };
    };
    checkoutCompleted: {
      type: string;
      data: {
        object: {
          id: string;
          payment_status: string;
          amount_total: number;
          currency: string;
          metadata: {
            temporaryId: string;
            customerFirstName: string;
            customerLastName: string;
            customerEmail: string;
            customerPhone: string;
            quoteType: string;
            amount: string;
          };
        };
      };
    };
  };

  export const generateurDonneesTest: {
    email(): string;
    telephone(): string;
    adresse(): string;
    dateFuture(jours?: number): string;
    prix(min?: number, max?: number): number;
    uuid(): string;
    temporaryId(): string;
    paymentIntentId(): string;
    bookingId(): string;
    customerId(): string;
    customer(): any;
    quoteRequest(): any;
    booking(): any;
    transaction(): any;
  };
}

declare module '../fixtures/cartes-stripe' {
  export const cartesTestStripe: {
    succes: {
      visa: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      mastercard: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      amex: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
    };
    echecs: {
      carteRefusee: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      fondsInsuffisants: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      carteExpiree: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      numeroInvalide: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      cvcInvalide: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
    };
    authentification3DS: {
      authentificationReussie: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      authentificationEchouee: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
      authentificationAnnulee: {
        numero: string;
        expiration: string;
        cvc: string;
        nom: string;
        description: string;
      };
    };
  };
}
