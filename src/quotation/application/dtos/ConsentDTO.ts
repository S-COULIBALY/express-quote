import { ConsentType } from '../../domain/enums/ConsentType';

/**
 * DTO pour représenter un consentement dans les réponses d'API.
 */
export interface ConsentDTO {
  id: string;
  userId: string | null;
  userIdentifier: string;
  type: ConsentType;
  granted: boolean;
  timestamp: string;
  version: string;
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: string | null;
} 