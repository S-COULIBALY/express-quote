import { ConsentRepository } from '../../domain/repositories/ConsentRepository';
import { Consent } from '../../domain/entities/Consent';
import { ConsentProof } from '../../domain/valueObjects/ConsentProof';
import { CreateConsentDTO } from '../dtos/CreateConsentDTO';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cas d'utilisation pour enregistrer un nouveau consentement utilisateur.
 */
export class RecordConsentUseCase {
  constructor(private consentRepository: ConsentRepository) {}

  /**
   * Exécute le cas d'utilisation.
   * @param dto Les données de consentement à enregistrer
   * @returns Le consentement enregistré
   */
  async execute(dto: CreateConsentDTO): Promise<Consent> {
    // Créer l'objet de preuve
    const proof = new ConsentProof(
      dto.formPath,
      dto.formText,
      dto.checkboxText,
      dto.sessionId,
      dto.formData
    );

    // Créer l'entité de consentement
    const consent = new Consent(
      uuidv4(),
      dto.userId || null,
      dto.userIdentifier,
      dto.type,
      dto.granted,
      new Date(),
      dto.ipAddress,
      dto.userAgent,
      proof,
      dto.version,
      dto.expiresAt
    );

    // Enregistrer et retourner le consentement
    return this.consentRepository.save(consent);
  }
} 