/**
 * 📱 SERVICE DE NORMALISATION DES NUMÉROS DE TÉLÉPHONE
 *
 * Centralise la logique de normalisation des numéros de téléphone au format E.164
 * pour garantir la compatibilité avec tous les fournisseurs SMS (Free Mobile, Twilio, etc.)
 *
 * Format E.164 : +[indicatif pays][numéro sans 0 initial]
 * Exemple France : +33751262080
 */

export class PhoneNormalizationService {
  /**
   * Normalise un numéro de téléphone français au format E.164
   *
   * @param phone - Numéro à normaliser
   * @param defaultCountryCode - Code pays par défaut (défaut: '33' pour France)
   * @returns Numéro normalisé au format E.164 ou null si invalide
   *
   * @example
   * normalizeToE164('0751262080') // '+33751262080'
   * normalizeToE164('0033751262080') // '+33751262080'
   * normalizeToE164('+33751262080') // '+33751262080'
   * normalizeToE164('07 51 26 20 80') // '+33751262080'
   * normalizeToE164('06.69.44.47.19') // '+33669444719'
   */
  static normalizeToE164(
    phone: string | null | undefined,
    defaultCountryCode: string = '33'
  ): string | null {
    if (!phone) return null;

    // Nettoyer : garder seulement + et chiffres
    let normalized = phone
      .replace(/[^+\d]/g, '') // Supprimer espaces, points, tirets, parenthèses
      .trim();

    if (!normalized) return null;

    // Déjà en format E.164 avec le bon préfixe
    if (normalized.startsWith(`+${defaultCountryCode}`)) {
      return normalized;
    }

    // Format 00[code pays]XXXXXXXXX → +[code pays]XXXXXXXXX
    if (normalized.startsWith(`00${defaultCountryCode}`)) {
      return `+${defaultCountryCode}` + normalized.substring(4);
    }

    // Format national français : 0XXXXXXXXX (10 chiffres) → +33XXXXXXXXX
    if (normalized.startsWith('0') && normalized.length === 10) {
      return `+${defaultCountryCode}` + normalized.substring(1);
    }

    // Autres cas avec préfixe +
    if (normalized.startsWith('+')) {
      return normalized;
    }

    // Fallback : Si c'est un numéro de 9 chiffres sans 0 initial, ajouter +33
    if (/^[1-9]\d{8}$/.test(normalized)) {
      return `+${defaultCountryCode}` + normalized;
    }

    // Si on ne peut pas normaliser, retourner null
    return null;
  }

  /**
   * Valide si un numéro est au format E.164 français valide
   *
   * @param phone - Numéro à valider
   * @returns true si le numéro est au format E.164 français valide
   *
   * @example
   * isValidFrenchE164('+33751262080') // true
   * isValidFrenchE164('0751262080') // false
   * isValidFrenchE164('+33123456789') // true
   */
  static isValidFrenchE164(phone: string): boolean {
    return /^\+33[1-9]\d{8}$/.test(phone);
  }

  /**
   * Valide si un numéro est au format E.164 international
   *
   * @param phone - Numéro à valider
   * @returns true si le numéro est au format E.164
   *
   * @example
   * isValidE164('+33751262080') // true
   * isValidE164('+1234567890') // true
   * isValidE164('0751262080') // false
   */
  static isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  }

  /**
   * Formatte un numéro E.164 pour l'affichage
   *
   * @param phone - Numéro E.164
   * @param format - Format de sortie ('national' | 'international' | 'masked')
   * @returns Numéro formatté
   *
   * @example
   * formatForDisplay('+33751262080', 'national') // '07 51 26 20 80'
   * formatForDisplay('+33751262080', 'international') // '+33 7 51 26 20 80'
   * formatForDisplay('+33751262080', 'masked') // '+33 7** *** **80'
   */
  static formatForDisplay(
    phone: string,
    format: 'national' | 'international' | 'masked' = 'national'
  ): string {
    if (!this.isValidFrenchE164(phone)) {
      return phone;
    }

    // Extraire les chiffres après +33
    const digits = phone.substring(3);

    switch (format) {
      case 'national':
        // +33751262080 → 07 51 26 20 80
        return `0${digits.substring(0, 1)} ${digits.substring(1, 3)} ${digits.substring(3, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;

      case 'international':
        // +33751262080 → +33 7 51 26 20 80
        return `+33 ${digits.substring(0, 1)} ${digits.substring(1, 3)} ${digits.substring(3, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;

      case 'masked':
        // +33751262080 → +33 7** *** **80
        return `+33 ${digits.substring(0, 1)}** *** **${digits.substring(7, 9)}`;

      default:
        return phone;
    }
  }

  /**
   * Normalise un tableau de numéros
   *
   * @param phones - Tableau de numéros à normaliser
   * @returns Tableau de numéros normalisés (filtre les valeurs null)
   */
  static normalizeMany(phones: (string | null | undefined)[]): string[] {
    return phones
      .map(phone => this.normalizeToE164(phone))
      .filter((phone): phone is string => phone !== null);
  }
}
