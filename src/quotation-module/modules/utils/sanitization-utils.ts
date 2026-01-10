/**
 * Utilitaires de sanitization pour les données d'entrée
 */

/**
 * Nettoie une chaîne de caractères des caractères dangereux
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Supprime les scripts
    .replace(/<[^>]+>/g, '') // Supprime les tags HTML
    .replace(/[<>]/g, '') // Supprime < et >
    .trim();
}

/**
 * Valide une adresse email
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Regex simplifiée pour validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalise un numéro de téléphone français
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Supprime tous les caractères non numériques et le +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Si commence par 00, remplace par +
  let normalized = cleaned.replace(/^00/, '+');

  // Si commence par 0 (français), ajoute +33
  if (normalized.startsWith('0') && !normalized.startsWith('00')) {
    normalized = '+33' + normalized.substring(1);
  }

  // Si ne commence pas par +, assume +33
  if (!normalized.startsWith('+')) {
    normalized = '+33' + normalized;
  }

  return normalized;
}

/**
 * Nettoie et capitalise un nom
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return sanitizeString(name)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-ZÀ-ÿ\s-]/g, '')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 50);
}

/**
 * Nettoie une adresse
 */
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return '';
  }

  return sanitizeString(address)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

/**
 * Valide et normalise un code postal français
 */
export function normalizePostalCode(postalCode: string): string {
  if (!postalCode || typeof postalCode !== 'string') {
    return '';
  }

  const cleaned = postalCode.replace(/[^0-9]/g, '');
  return cleaned.length === 5 ? cleaned : '';
}
