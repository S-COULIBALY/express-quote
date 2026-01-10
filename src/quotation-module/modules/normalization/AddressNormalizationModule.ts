import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * AddressNormalizationModule - Normalise les adresses de départ et d'arrivée
 *
 * PHASE 1 (priority: 12) - CRITIQUE
 * - Normalise les adresses pour recherche/comparaison
 * - Extrait et normalise les codes postaux
 * - Prépare les adresses pour géocodage
 */
export class AddressNormalizationModule implements QuoteModule {
  readonly id = 'address-normalization';
  readonly description = "Normalise les adresses de départ et d'arrivée";
  readonly priority = 12;
  readonly executionPhase = 'QUOTE';

  apply(ctx: QuoteContext): QuoteContext {
    // Initialiser computed si absent (garde-fou)
    const computed = ctx.computed || createEmptyComputedContext();

    // Normalisation des adresses de départ et d'arrivée
    const normalizedDepartureAddress = this.normalizeAddress(ctx.departureAddress || '');
    const normalizedArrivalAddress = this.normalizeAddress(ctx.arrivalAddress || '');

    // Normalisation des codes postaux (s'assurer qu'ils sont bien formatés)
    const normalizedDeparturePostalCode = this.normalizePostalCode(ctx.departurePostalCode);
    const normalizedArrivalPostalCode = this.normalizePostalCode(ctx.arrivalPostalCode);

    // Normalisation des villes
    const normalizedDepartureCity = this.normalizeCity(ctx.departureCity);
    const normalizedArrivalCity = this.normalizeCity(ctx.arrivalCity);

    return {
      ...ctx,
      // Adresses normalisées (on garde les originales aussi)
      departureAddress: normalizedDepartureAddress || ctx.departureAddress,
      departurePostalCode: normalizedDeparturePostalCode || ctx.departurePostalCode,
      departureCity: normalizedDepartureCity || ctx.departureCity,
      arrivalAddress: normalizedArrivalAddress || ctx.arrivalAddress,
      arrivalPostalCode: normalizedArrivalPostalCode || ctx.arrivalPostalCode,
      arrivalCity: normalizedArrivalCity || ctx.arrivalCity,
      computed: {
        ...computed,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          addressNormalizationApplied: true,
          normalizedDepartureAddress,
          normalizedArrivalAddress,
          addressNormalizationTimestamp: new Date().toISOString(),
        }
      }
    };
  }

  /**
   * Normalise une adresse pour recherche/comparaison
   * - Convertit en majuscules
   * - Supprime les caractères spéciaux (sauf espaces et tirets)
   * - Normalise les espaces multiples
   * - Supprime les accents (optionnel, pour comparaison)
   */
  private normalizeAddress(address: string): string {
    if (!address || typeof address !== 'string') {
      return '';
    }

    return address
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalise les espaces multiples
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^\w\s-]/g, '') // Garde uniquement lettres, chiffres, espaces et tirets
      .trim();
  }

  /**
   * Normalise un code postal (extrait les 5 chiffres)
   */
  private normalizePostalCode(postalCode?: string): string | undefined {
    if (!postalCode || typeof postalCode !== 'string') {
      return undefined;
    }
    const cleaned = postalCode.replace(/\D/g, '');
    return /^\d{5}$/.test(cleaned) ? cleaned : undefined;
  }

  /**
   * Normalise une ville (majuscules, supprime accents)
   */
  private normalizeCity(city?: string): string | undefined {
    if (!city || typeof city !== 'string') {
      return undefined;
    }
    return city
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim();
  }
}