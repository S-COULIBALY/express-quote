import { ConsentType } from '../enums/ConsentType';
import { ConsentProof } from '../valueObjects/ConsentProof';

/**
 * Entité représentant un consentement utilisateur.
 * Stocke les informations sur le consentement, y compris les preuves et les métadonnées.
 */
export class Consent {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly userIdentifier: string, // email, phone ou autre identifiant
    public readonly type: ConsentType,
    public readonly granted: boolean,
    public readonly timestamp: Date,
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly proof: ConsentProof,
    public readonly version: string, // version du formulaire/politique
    public readonly expiresAt?: Date | null
  ) {}

  /**
   * Vérifie si le consentement est actuellement valide.
   * Un consentement est valide s'il a été accordé et n'est pas expiré.
   */
  public isValid(): boolean {
    if (!this.granted) return false;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    return true;
  }

  /**
   * Vérifie si le consentement est expiré.
   */
  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
  }

  /**
   * Convertit l'entité en un objet JSON pour la sérialisation.
   */
  public toJSON(): object {
    return {
      id: this.id,
      userId: this.userId,
      userIdentifier: this.userIdentifier,
      type: this.type,
      granted: this.granted,
      timestamp: this.timestamp,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      proof: this.proof.toJSON(),
      version: this.version,
      expiresAt: this.expiresAt
    };
  }
} 