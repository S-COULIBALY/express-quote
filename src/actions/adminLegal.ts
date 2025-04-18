'use server'

/**
 * Interface pour les informations légales de l'entreprise
 */
export interface LegalInformationConfig {
  // Informations de base
  companyName: string;
  legalForm: string;
  registrationNumber: string;
  vatNumber: string;
  shareCapital: string;
  
  // Coordonnées légales
  registeredAddress: string;
  postalCode: string;
  city: string;
  country: string;
  
  // Représentants légaux
  legalRepresentative: string;
  dataProtectionOfficer: string;
  
  // Informations RGPD / Cookies
  cookiePolicyUrl: string;
  privacyPolicyUrl: string;
  dataRetentionPeriod: string;
  
  // Informations sur l'hébergeur
  hostingProvider: string;
  hostingAddress: string;
  hostingContact: string;
  
  // Mentions légales spécifiques
  additionalMentions: string;
}

/**
 * Récupère les informations légales actuelles
 */
export async function getLegalInformation(): Promise<LegalInformationConfig> {
  // Dans une implémentation réelle, ces valeurs viendraient d'une base de données
  return {
    // Informations de base
    companyName: 'Express Quote SAS',
    legalForm: 'Société par Actions Simplifiée',
    registrationNumber: '123 456 789 RCS Paris',
    vatNumber: 'FR 12 345678901',
    shareCapital: '10 000 €',
    
    // Coordonnées légales
    registeredAddress: '123 Avenue des Champs-Élysées',
    postalCode: '75008',
    city: 'Paris',
    country: 'France',
    
    // Représentants légaux
    legalRepresentative: 'Jean Dupont',
    dataProtectionOfficer: 'Marie Martin',
    
    // Informations RGPD / Cookies
    cookiePolicyUrl: '/legal/cookies',
    privacyPolicyUrl: '/legal/privacy',
    dataRetentionPeriod: '36 mois',
    
    // Informations sur l'hébergeur
    hostingProvider: 'CloudHost SAS',
    hostingAddress: '1 Rue de la Paix, 75002 Paris, France',
    hostingContact: 'contact@cloudhost.fr',
    
    // Mentions légales spécifiques
    additionalMentions: 'Numéro de TVA intracommunautaire : FR12345678901\nImmatriculation ORIAS : 12345678',
  };
}

/**
 * Sauvegarde les informations légales
 */
export async function saveLegalInformation(config: LegalInformationConfig): Promise<{ success: boolean, message: string }> {
  try {
    // Validation des données
    if (!config.companyName) {
      return {
        success: false,
        message: "Le nom de l'entreprise est requis"
      };
    }
    
    if (!config.registrationNumber) {
      return {
        success: false,
        message: "Le numéro d'immatriculation est requis"
      };
    }
    
    // Dans une implémentation réelle, nous sauvegarderions ces données dans une base de données
    // Simulation d'une pause pour l'UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: "Informations légales mises à jour avec succès"
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des informations légales:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des informations légales"
    };
  }
} 