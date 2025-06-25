import { ConsentRepository } from '../../domain/repositories/ConsentRepository';
import { Consent } from '../../domain/entities/Consent';
import { ConsentType } from '../../domain/enums/ConsentType';
import { RecordConsentUseCase } from '../usecases/RecordConsentUseCase';
import { VerifyConsentUseCase } from '../usecases/VerifyConsentUseCase';
import { GetConsentHistoryUseCase } from '../usecases/GetConsentHistoryUseCase';
import { CreateConsentDTO } from '../dtos/CreateConsentDTO';

/**
 * Service qui orchestre les opérations liées aux consentements utilisateur.
 */
export class ConsentService {
  private recordConsentUseCase: RecordConsentUseCase;
  private verifyConsentUseCase: VerifyConsentUseCase;
  private getConsentHistoryUseCase: GetConsentHistoryUseCase;

  constructor(private consentRepository: ConsentRepository) {
    this.recordConsentUseCase = new RecordConsentUseCase(consentRepository);
    this.verifyConsentUseCase = new VerifyConsentUseCase(consentRepository);
    this.getConsentHistoryUseCase = new GetConsentHistoryUseCase(consentRepository);
  }

  /**
   * Enregistre un nouveau consentement utilisateur.
   * @param dto Données du consentement à enregistrer
   * @returns Le consentement enregistré
   */
  async recordConsent(dto: CreateConsentDTO): Promise<Consent> {
    return this.recordConsentUseCase.execute(dto);
  }

  /**
   * Vérifie si un utilisateur a donné un consentement valide pour un type spécifique.
   * @param userIdentifier Identifiant de l'utilisateur
   * @param type Type de consentement à vérifier
   * @returns true si un consentement valide existe, false sinon
   */
  async verifyConsent(userIdentifier: string, type: ConsentType): Promise<boolean> {
    return this.verifyConsentUseCase.execute(userIdentifier, type);
  }

  /**
   * Récupère l'historique des consentements pour un utilisateur et un type donnés.
   * @param userIdentifier Identifiant de l'utilisateur
   * @param type Type de consentement
   * @returns Liste des consentements triés du plus récent au plus ancien
   */
  async getConsentHistory(userIdentifier: string, type: ConsentType): Promise<Consent[]> {
    return this.getConsentHistoryUseCase.execute(userIdentifier, type);
  }
} 