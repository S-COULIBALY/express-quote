import { ConsentRepository } from '../../domain/repositories/ConsentRepository';
import { ConsentType } from '../../domain/enums/ConsentType';

/**
 * Cas d'utilisation pour vérifier si un utilisateur a donné un consentement valide pour un type spécifique.
 */
export class VerifyConsentUseCase {
  constructor(private consentRepository: ConsentRepository) {}

  /**
   * Vérifie si un utilisateur a donné un consentement valide.
   * @param userIdentifier Identifiant de l'utilisateur (email, téléphone, etc.)
   * @param type Type de consentement à vérifier
   * @returns true si un consentement valide existe, false sinon
   */
  async execute(userIdentifier: string, type: ConsentType): Promise<boolean> {
    const consent = await this.consentRepository.findLatestByUserAndType(userIdentifier, type);
    
    if (!consent) return false;
    return consent.isValid();
  }
} 