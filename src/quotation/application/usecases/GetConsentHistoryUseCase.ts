import { ConsentRepository } from '../../domain/repositories/ConsentRepository';
import { Consent } from '../../domain/entities/Consent';
import { ConsentType } from '../../domain/enums/ConsentType';

/**
 * Cas d'utilisation pour récupérer l'historique complet des consentements d'un utilisateur.
 */
export class GetConsentHistoryUseCase {
  constructor(private consentRepository: ConsentRepository) {}

  /**
   * Récupère l'historique des consentements pour un utilisateur et un type donnés.
   * @param userIdentifier Identifiant de l'utilisateur
   * @param type Type de consentement
   * @returns Liste des consentements triés du plus récent au plus ancien
   */
  async execute(userIdentifier: string, type: ConsentType): Promise<Consent[]> {
    return this.consentRepository.findAllByUserAndType(userIdentifier, type);
  }
} 