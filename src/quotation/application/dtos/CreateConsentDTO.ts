import { ConsentType } from '../../domain/enums/ConsentType';

/**
 * DTO pour la création d'un nouveau consentement.
 * Contient toutes les informations nécessaires pour enregistrer un consentement utilisateur.
 */
export interface CreateConsentDTO {
  userId?: string | null;
  userIdentifier: string;
  type: ConsentType;
  granted: boolean;
  ipAddress: string;
  userAgent: string;
  formPath: string;
  formText: string;
  checkboxText: string;
  sessionId: string;
  formData: object;
  version: string;
  expiresAt?: Date | null;
} 