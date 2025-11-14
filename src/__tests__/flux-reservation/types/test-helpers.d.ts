/**
 * 🧪 **TYPES HELPERS - Tests de Réservation**
 * 
 * Définitions de types pour les helpers de test
 */

declare module '../utils/helpers-test' {
  export class HelpersFormulaire {
    static remplirFormulaireReservation(
      page: any,
      typeService: 'nettoyage' | 'demenagement' | 'livraison',
      donneesClient?: any
    ): Promise<void>;
    static soumettreFormulaire(page: any, boutonText?: string): Promise<void>;
    static verifierErreursValidation(page: any, champsObligatoires: string[]): Promise<void>;
  }

  export class HelpersPaiement {
    static remplirFormulairePaiement(page: any, carte?: any): Promise<void>;
    static procederPaiement(page: any, timeout?: number): Promise<void>;
    static verifierPaiementReussi(page: any): Promise<void>;
    static verifierPaiementEchoue(page: any): Promise<void>;
  }

  export class HelpersNotification {
    static intercepterNotifications(page: any): Promise<any[]>;
    static verifierNotificationEnvoyee(notifications: any[], type: 'email' | 'sms' | 'whatsapp'): boolean;
    static simulerEchecNotification(page: any, type: string): Promise<void>;
  }

  export class HelpersFlux {
    static executerFluxComplet(
      page: any,
      typeService: 'nettoyage' | 'demenagement' | 'livraison',
      carte?: any
    ): Promise<void>;
    static executerFluxEchecPaiement(
      page: any,
      typeService: 'nettoyage' | 'demenagement' | 'livraison',
      carteEchec?: any
    ): Promise<void>;
  }

  export class HelpersPerformance {
    static mesurerTempsChargement(page: any, url: string): Promise<number>;
    static mesurerTempsCalculPrix(page: any, champ: string, valeur: string): Promise<number>;
    static mesurerTempsSoumission(page: any): Promise<number>;
  }

  export class HelpersNettoyage {
    static nettoyerDonneesTest(): Promise<void>;
    static reinitialiserApplication(page: any): Promise<void>;
  }

  export class HelpersAssertion {
    static verifierTexte(page: any, selector: string, texteAttendu: string): Promise<void>;
    static verifierVisibilite(page: any, selector: string): Promise<void>;
    static verifierInvisibilite(page: any, selector: string): Promise<void>;
    static verifierURL(page: any, pattern: RegExp): Promise<void>;
  }

  export class HelpersGeneration {
    static genererEmailTest(): string;
    static genererTelephoneTest(): string;
    static genererAdresseTest(): string;
    static genererDateFuture(jours?: number): string;
  }
}
