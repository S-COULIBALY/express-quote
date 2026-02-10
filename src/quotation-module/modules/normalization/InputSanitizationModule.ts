import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * InputSanitizationModule - Sanitise et normalise les données d'entrée du formulaire
 *
 * PHASE 1 (priority: 10) - CRITIQUE
 * - Sanitise les adresses (départ et arrivée)
 * - Valide et normalise les codes postaux
 * - Valide le format de date (ISO 8601)
 * - Protège contre l'injection de caractères dangereux
 * - Nettoie les chaînes de caractères
 */
export class InputSanitizationModule implements QuoteModule {
  readonly id = 'input-sanitization';
  readonly description = "Normalise et sanitise les données d'entrée du formulaire";
  readonly priority = 10;
  readonly executionPhase = 'QUOTE';

  apply(ctx: QuoteContext): QuoteContext {
    // Initialiser computed si absent (garde-fou)
    const computed = ctx.computed || createEmptyComputedContext();

    // Sanitisation des adresses de départ
    const sanitizedDepartureAddress = this.sanitizeAddress(ctx.departureAddress || '');
    const sanitizedDeparturePostalCode = this.sanitizePostalCode(ctx.departurePostalCode);
    const sanitizedDepartureCity = this.sanitizeCity(ctx.departureCity);

    // Sanitisation des adresses d'arrivée
    const sanitizedArrivalAddress = this.sanitizeAddress(ctx.arrivalAddress || '');
    const sanitizedArrivalPostalCode = this.sanitizePostalCode(ctx.arrivalPostalCode);
    const sanitizedArrivalCity = this.sanitizeCity(ctx.arrivalCity);

    // Validation et normalisation de la date
    const sanitizedMovingDate = this.sanitizeDate(ctx.movingDate);

    // Sanitisation des valeurs numériques (protection contre NaN, Infinity)
    const sanitizedEstimatedVolume = this.sanitizeNumber(ctx.estimatedVolume);
    const sanitizedDistance = this.sanitizeNumber(ctx.distance);
    const sanitizedDeclaredValue = this.sanitizeNumber(ctx.declaredValue);

    // Sanitisation des étages (doivent être des entiers)
    const sanitizedPickupFloor = this.sanitizeInteger(ctx.pickupFloor);
    const sanitizedDeliveryFloor = this.sanitizeInteger(ctx.deliveryFloor);

    // Sanitisation des distances de portage
    const sanitizedPickupCarryDistance = this.sanitizeNumber(ctx.pickupCarryDistance);
    const sanitizedDeliveryCarryDistance = this.sanitizeNumber(ctx.deliveryCarryDistance);

    // Statistiques de sanitisation
    const sanitizationStats = this.calculateSanitizationStats(ctx, {
      departureAddress: sanitizedDepartureAddress,
      arrivalAddress: sanitizedArrivalAddress,
      departurePostalCode: sanitizedDeparturePostalCode,
      arrivalPostalCode: sanitizedArrivalPostalCode,
      departureCity: sanitizedDepartureCity,
      arrivalCity: sanitizedArrivalCity,
      movingDate: sanitizedMovingDate,
      estimatedVolume: sanitizedEstimatedVolume,
      distance: sanitizedDistance,
      declaredValue: sanitizedDeclaredValue,
      pickupFloor: sanitizedPickupFloor,
      deliveryFloor: sanitizedDeliveryFloor,
      pickupCarryDistance: sanitizedPickupCarryDistance,
      deliveryCarryDistance: sanitizedDeliveryCarryDistance,
    });

    // Logs détaillés de la sanitisation
    console.log(`   🔧 SANITISATION DES DONNÉES:`);
    
    // Adresses
    if (ctx.departureAddress || ctx.arrivalAddress) {
      console.log(`      Adresses:`);
      if (ctx.departureAddress) {
        const wasModified = ctx.departureAddress !== sanitizedDepartureAddress;
        const modifications = this.detectModifications(ctx.departureAddress, sanitizedDepartureAddress);
        console.log(`         Départ: "${ctx.departureAddress}" → "${sanitizedDepartureAddress}"${modifications ? ` (${modifications})` : ' (valide)'}`);
      }
      if (ctx.arrivalAddress) {
        const wasModified = ctx.arrivalAddress !== sanitizedArrivalAddress;
        const modifications = this.detectModifications(ctx.arrivalAddress, sanitizedArrivalAddress);
        console.log(`         Arrivée: "${ctx.arrivalAddress}" → "${sanitizedArrivalAddress}"${modifications ? ` (${modifications})` : ' (valide)'}`);
      }
    }

    // Codes postaux
    if (ctx.departurePostalCode || ctx.arrivalPostalCode) {
      console.log(`      Codes postaux:`);
      if (ctx.departurePostalCode) {
        const wasModified = ctx.departurePostalCode !== sanitizedDeparturePostalCode;
        console.log(`         Départ: "${ctx.departurePostalCode}" → ${sanitizedDeparturePostalCode || 'invalide'}${wasModified ? ' (normalisé)' : ' (valide)'}`);
      }
      if (ctx.arrivalPostalCode) {
        const wasModified = ctx.arrivalPostalCode !== sanitizedArrivalPostalCode;
        console.log(`         Arrivée: "${ctx.arrivalPostalCode}" → ${sanitizedArrivalPostalCode || 'invalide'}${wasModified ? ' (normalisé)' : ' (valide)'}`);
      }
    }

    // Date
    if (ctx.movingDate) {
      const wasModified = ctx.movingDate !== sanitizedMovingDate;
      console.log(`      Date: "${ctx.movingDate}" → ${sanitizedMovingDate || 'invalide'}${wasModified ? ' (normalisé)' : ' (format ISO 8601 valide)'}`);
    }

    // Valeurs numériques
    const numericFields = [
      { name: 'Volume', original: ctx.estimatedVolume, sanitized: sanitizedEstimatedVolume },
      { name: 'Distance', original: ctx.distance, sanitized: sanitizedDistance },
      { name: 'Valeur déclarée', original: ctx.declaredValue, sanitized: sanitizedDeclaredValue },
    ].filter(f => f.original !== undefined);
    
    if (numericFields.length > 0) {
      console.log(`      Valeurs numériques:`);
      numericFields.forEach(field => {
        const wasModified = field.original !== field.sanitized;
        const status = field.sanitized === undefined ? 'invalide' : (wasModified ? 'normalisé' : 'valide');
        console.log(`         ${field.name}: ${field.original} → ${field.sanitized ?? 'invalide'} (${status})`);
      });
    }

    // Étages
    const floorFields = [
      { name: 'Départ', original: ctx.pickupFloor, sanitized: sanitizedPickupFloor },
      { name: 'Arrivée', original: ctx.deliveryFloor, sanitized: sanitizedDeliveryFloor },
    ].filter(f => f.original !== undefined);
    
    if (floorFields.length > 0) {
      console.log(`      Étages:`);
      floorFields.forEach(field => {
        const wasModified = field.original !== field.sanitized;
        const status = field.sanitized === undefined ? 'invalide' : (wasModified ? 'normalisé (entier)' : 'valide');
        console.log(`         ${field.name}: ${field.original} → ${field.sanitized ?? 'invalide'} (${status})`);
      });
    }

    console.log(`      = Sanitisation terminée: ${sanitizationStats.totalFields} champs traités, ${sanitizationStats.modifiedFields} modifiés, ${sanitizationStats.invalidFields} invalides`);

    return {
      ...ctx,
      // Adresses sanitizées
      departureAddress: sanitizedDepartureAddress,
      departurePostalCode: sanitizedDeparturePostalCode,
      departureCity: sanitizedDepartureCity,
      arrivalAddress: sanitizedArrivalAddress,
      arrivalPostalCode: sanitizedArrivalPostalCode,
      arrivalCity: sanitizedArrivalCity,
      // Date sanitizée
      movingDate: sanitizedMovingDate,
      // Valeurs numériques sanitizées
      estimatedVolume: sanitizedEstimatedVolume,
      distance: sanitizedDistance,
      declaredValue: sanitizedDeclaredValue,
      // Étages sanitizés
      pickupFloor: sanitizedPickupFloor,
      deliveryFloor: sanitizedDeliveryFloor,
      // Distances de portage sanitizées
      pickupCarryDistance: sanitizedPickupCarryDistance,
      deliveryCarryDistance: sanitizedDeliveryCarryDistance,
      // Computed avec traçabilité
      computed: {
        ...computed,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          sanitizationApplied: true,
          sanitizationTimestamp: new Date().toISOString(),
          sanitizationStats,
        }
      }
    };
  }

  /**
   * Détecte les modifications appliquées lors de la sanitisation
   */
  private detectModifications(original: string, sanitized: string): string {
    const modifications: string[] = [];
    
    if (original !== sanitized) {
      // Détecter scripts supprimés
      if (original.match(/<script/i)) {
        modifications.push('scripts supprimés');
      }
      // Détecter tags HTML supprimés
      if (original.match(/<[^>]+>/)) {
        modifications.push('tags HTML supprimés');
      }
      // Détecter espaces normalisés
      if (original.match(/\s{2,}/) && !sanitized.match(/\s{2,}/)) {
        modifications.push('espaces normalisés');
      }
      // Détecter troncature
      if (original.length > sanitized.length && sanitized.length === 200) {
        modifications.push('tronqué à 200 caractères');
      }
    }
    
    return modifications.join(', ') || '';
  }

  /**
   * Calcule les statistiques de sanitisation
   */
  private calculateSanitizationStats(
    original: QuoteContext,
    sanitized: Record<string, any>
  ): {
    totalFields: number;
    modifiedFields: number;
    invalidFields: number;
    fields: Record<string, { modified: boolean; invalid: boolean }>;
  } {
    const fields: Record<string, { modified: boolean; invalid: boolean }> = {};
    let totalFields = 0;
    let modifiedFields = 0;
    let invalidFields = 0;

    const fieldMappings: Array<{ original: keyof QuoteContext; sanitized: string }> = [
      { original: 'departureAddress', sanitized: 'departureAddress' },
      { original: 'arrivalAddress', sanitized: 'arrivalAddress' },
      { original: 'departurePostalCode', sanitized: 'departurePostalCode' },
      { original: 'arrivalPostalCode', sanitized: 'arrivalPostalCode' },
      { original: 'departureCity', sanitized: 'departureCity' },
      { original: 'arrivalCity', sanitized: 'arrivalCity' },
      { original: 'movingDate', sanitized: 'movingDate' },
      { original: 'estimatedVolume', sanitized: 'estimatedVolume' },
      { original: 'distance', sanitized: 'distance' },
      { original: 'declaredValue', sanitized: 'declaredValue' },
      { original: 'pickupFloor', sanitized: 'pickupFloor' },
      { original: 'deliveryFloor', sanitized: 'deliveryFloor' },
      { original: 'pickupCarryDistance', sanitized: 'pickupCarryDistance' },
      { original: 'deliveryCarryDistance', sanitized: 'deliveryCarryDistance' },
    ];

    fieldMappings.forEach(({ original: origKey, sanitized: sanitKey }) => {
      const originalValue = original[origKey];
      const sanitizedValue = sanitized[sanitKey];
      
      if (originalValue !== undefined && originalValue !== null) {
        totalFields++;
        const modified = originalValue !== sanitizedValue;
        const invalid = sanitizedValue === undefined || sanitizedValue === null;
        
        fields[sanitKey] = { modified, invalid };
        
        if (modified) modifiedFields++;
        if (invalid) invalidFields++;
      }
    });

    return { totalFields, modifiedFields, invalidFields, fields };
  }

  /**
   * Sanitise une adresse (supprime caractères dangereux, limite longueur)
   */
  private sanitizeAddress(address: string): string {
    if (!address || typeof address !== 'string') {
      return '';
    }
    // Supprime les caractères dangereux (<, >, scripts)
    return address
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Supprime les scripts
      .replace(/<[^>]+>/g, '') // Supprime les tags HTML
      .replace(/[<>]/g, '') // Supprime < et >
      .trim()
      .replace(/\s+/g, ' ') // Normalise les espaces multiples
      .substring(0, 200); // Limite à 200 caractères
  }

  /**
   * Valide et normalise un code postal français (5 chiffres)
   */
  private sanitizePostalCode(postalCode?: string): string | undefined {
    if (!postalCode || typeof postalCode !== 'string') {
      return undefined;
    }
    const cleaned = postalCode.replace(/\D/g, ''); // Supprime tout sauf chiffres
    return /^\d{5}$/.test(cleaned) ? cleaned : undefined;
  }

  /**
   * Sanitise une ville (supprime caractères spéciaux, limite longueur)
   */
  private sanitizeCity(city?: string): string | undefined {
    if (!city || typeof city !== 'string') {
      return undefined;
    }
    return city
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Supprime les scripts
      .replace(/<[^>]+>/g, '') // Supprime les tags HTML
      .trim()
      .replace(/[<>]/g, '') // Supprime < et > restants
      .replace(/[^\p{L}\s-]/gu, '') // Garde uniquement lettres, espaces et tirets
      .replace(/\s+/g, ' ') // Normalise les espaces
      .substring(0, 50); // Limite à 50 caractères
  }

  /**
   * Valide et normalise une date ISO 8601
   */
  private sanitizeDate(date?: string): string | undefined {
    if (!date || typeof date !== 'string') {
      return undefined;
    }
    // Vérifie le format ISO 8601 basique (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ)
    // Format simple: YYYY-MM-DD
    // Format complet: YYYY-MM-DDTHH:mm:ssZ ou YYYY-MM-DDTHH:mm:ss+HH:mm
    const iso8601SimpleRegex = /^\d{4}-\d{2}-\d{2}$/;
    const iso8601FullRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
    const trimmed = date.trim();
    
    if (!iso8601SimpleRegex.test(trimmed) && !iso8601FullRegex.test(trimmed)) {
      return undefined; // Date invalide
    }
    // Vérifie que c'est une date valide
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
      return undefined; // Date invalide
    }
    return trimmed;
  }

  /**
   * Sanitise un nombre (protection contre NaN, Infinity, valeurs négatives non autorisées)
   */
  private sanitizeNumber(value?: number): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value !== 'number') {
      return undefined;
    }
    if (isNaN(value) || !isFinite(value)) {
      return undefined;
    }
    // Pour les valeurs qui ne peuvent pas être négatives (volume, distance, etc.)
    if (value < 0) {
      return undefined;
    }
    return value;
  }

  /**
   * Sanitise un entier (pour les étages)
   */
  private sanitizeInteger(value?: number): number | undefined {
    const sanitized = this.sanitizeNumber(value);
    if (sanitized === undefined) {
      return undefined;
    }
    return Math.floor(sanitized);
  }
}