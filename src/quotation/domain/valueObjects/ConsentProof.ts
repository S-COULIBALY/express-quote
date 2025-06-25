/**
 * Value object représentant la preuve d'un consentement donné par un utilisateur.
 * Contient toutes les informations contextuelles nécessaires pour prouver le consentement.
 */
export class ConsentProof {
  constructor(
    public readonly formPath: string,
    public readonly formText: string,
    public readonly checkboxText: string,
    public readonly sessionId: string,
    public readonly formData: object
  ) {}

  public toJSON(): object {
    return {
      formPath: this.formPath,
      formText: this.formText,
      checkboxText: this.checkboxText,
      sessionId: this.sessionId,
      formData: this.formData
    };
  }
} 