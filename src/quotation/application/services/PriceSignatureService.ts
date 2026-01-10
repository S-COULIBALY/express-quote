import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * Structure de données pour un prix sécurisé avec signature cryptographique
 */
export interface SecuredPrice {
  // Prix calculé
  totalPrice: number;
  basePrice: number;
  currency: string;

  // Métadonnées de calcul
  calculatedAt: Date;
  calculationId: string;

  // Sécurité cryptographique
  signature: string; // HMAC-SHA256
  signatureVersion: 'v1';

  // Empreinte des données (pour détecter modifications)
  dataFingerprint: {
    serviceType: string;
    workers: number;
    duration: number;
    distance: number;
    constraintsCount: number;
    servicesCount: number;
  };
}

/**
 * Résultat de la vérification d'une signature
 */
export interface SignatureVerificationResult {
  valid: boolean;
  reason?: string;
  details?: {
    signatureMatch: boolean;
    ageValid: boolean;
    ageHours?: number;
  };
}

/**
 * Service de signature cryptographique pour sécuriser les prix calculés
 * Utilise HMAC-SHA256 pour garantir l'intégrité des prix
 *
 * Principe:
 * - 1 seul calcul lors de la soumission
 * - Signature cryptographique pour détecter toute modification
 * - Vérification rapide (µs) au lieu de recalcul (ms)
 * - Défense en profondeur: recalcul si signature invalide
 */
export class PriceSignatureService {
  private readonly SECRET_KEY: string;
  private readonly SIGNATURE_MAX_AGE_HOURS = 24;

  constructor() {
    this.SECRET_KEY = process.env.PRICE_SIGNATURE_SECRET || this.generateFallbackSecret();

    if (!process.env.PRICE_SIGNATURE_SECRET) {
      logger.warn('⚠️ PRICE_SIGNATURE_SECRET non définie - Utilisation d\'une clé temporaire (NON SÉCURISÉ EN PRODUCTION)');
    }
  }

  /**
   * Génère une clé secrète de fallback (pour développement uniquement)
   */
  private generateFallbackSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Génère une signature HMAC-SHA256 pour un prix calculé
   */
  generateSignature(
    priceData: { total: number; base: number; calculationId: string; calculatedAt: Date },
    quoteData: any
  ): string {
    // 1. Créer le payload à signer (données immuables)
    const payload = {
      // Prix
      totalPrice: priceData.total,
      basePrice: priceData.base,
      calculatedAt: priceData.calculatedAt.toISOString(),
      calculationId: priceData.calculationId,

      // Empreinte des données (pour détecter modifications)
      serviceType: quoteData.serviceType || 'UNKNOWN',
      workers: quoteData.workers || 0,
      duration: quoteData.duration || 0,
      distance: quoteData.distance || 0,
      constraintsCount: this.countConstraints(quoteData),
      servicesCount: this.countServices(quoteData),
    };

    // 2. Sérialiser de manière déterministe (ordre des clés important)
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());

    // 3. Générer HMAC-SHA256
    const hmac = crypto.createHmac('sha256', this.SECRET_KEY);
    hmac.update(canonical);

    const signature = hmac.digest('hex');

    logger.debug('🔐 Signature générée', {
      calculationId: priceData.calculationId,
      signature: signature.substring(0, 16) + '...',
      payloadKeys: Object.keys(payload)
    });

    return signature;
  }

  /**
   * Crée un objet SecuredPrice complet avec signature
   */
  createSecuredPrice(
    priceData: { total: number; base: number; calculationId: string },
    quoteData: any
  ): SecuredPrice {
    const calculatedAt = new Date();

    const signature = this.generateSignature(
      {
        total: priceData.total,
        base: priceData.base,
        calculationId: priceData.calculationId,
        calculatedAt
      },
      quoteData
    );

    return {
      totalPrice: priceData.total,
      basePrice: priceData.base,
      currency: 'EUR',
      calculatedAt,
      calculationId: priceData.calculationId,
      signature,
      signatureVersion: 'v1',
      dataFingerprint: {
        serviceType: quoteData.serviceType || 'UNKNOWN',
        workers: quoteData.workers || 0,
        duration: quoteData.duration || 0,
        distance: quoteData.distance || 0,
        constraintsCount: this.countConstraints(quoteData),
        servicesCount: this.countServices(quoteData),
      }
    };
  }

  /**
   * Vérifie qu'une signature est valide
   * Utilise une comparaison temporelle constante pour éviter les timing attacks
   */
  verifySignature(
    securedPrice: SecuredPrice,
    quoteData: any
  ): SignatureVerificationResult {
    try {
      // 1. Vérifier que la signature existe
      if (!securedPrice || !securedPrice.signature) {
        return {
          valid: false,
          reason: 'Signature manquante',
          details: { signatureMatch: false, ageValid: false }
        };
      }

      // 2. Recalculer la signature attendue avec les données stockées
      const expectedSignature = this.generateSignature(
        {
          total: securedPrice.totalPrice,
          base: securedPrice.basePrice,
          calculationId: securedPrice.calculationId,
          calculatedAt: new Date(securedPrice.calculatedAt)
        },
        quoteData
      );

      // 3. Comparaison temporelle constante (évite timing attacks)
      let signatureMatch = false;
      try {
        signatureMatch = crypto.timingSafeEqual(
          Buffer.from(securedPrice.signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        );
      } catch (error) {
        return {
          valid: false,
          reason: 'Format de signature invalide',
          details: { signatureMatch: false, ageValid: false }
        };
      }

      if (!signatureMatch) {
        logger.warn('⚠️ Signature invalide - Données potentiellement modifiées', {
          calculationId: securedPrice.calculationId,
          expected: expectedSignature.substring(0, 16) + '...',
          received: securedPrice.signature.substring(0, 16) + '...'
        });

        return {
          valid: false,
          reason: 'Signature ne correspond pas - Données modifiées',
          details: { signatureMatch: false, ageValid: true }
        };
      }

      // 4. Vérifier l'âge de la signature (max 24h)
      const ageMs = Date.now() - new Date(securedPrice.calculatedAt).getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      const ageValid = ageHours <= this.SIGNATURE_MAX_AGE_HOURS;

      if (!ageValid) {
        logger.warn('⚠️ Signature expirée', {
          calculationId: securedPrice.calculationId,
          ageHours: ageHours.toFixed(2),
          maxAge: this.SIGNATURE_MAX_AGE_HOURS
        });

        return {
          valid: false,
          reason: `Signature expirée (${ageHours.toFixed(1)}h > ${this.SIGNATURE_MAX_AGE_HOURS}h)`,
          details: { signatureMatch: true, ageValid: false, ageHours }
        };
      }

      // ✅ Signature valide et récente
      logger.debug('✅ Signature valide', {
        calculationId: securedPrice.calculationId,
        ageHours: ageHours.toFixed(2)
      });

      return {
        valid: true,
        details: { signatureMatch: true, ageValid: true, ageHours }
      };

    } catch (error) {
      logger.error('❌ Erreur lors de la vérification de signature', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        calculationId: securedPrice?.calculationId
      });

      return {
        valid: false,
        reason: `Erreur de vérification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        details: { signatureMatch: false, ageValid: false }
      };
    }
  }

  /**
   * Compte le nombre total de contraintes logistiques
   */
  private countConstraints(data: any): number {
    let count = 0;

    if (data.pickupLogisticsConstraints?.addressConstraints) {
      count += Object.keys(data.pickupLogisticsConstraints.addressConstraints).length;
    }

    if (data.deliveryLogisticsConstraints?.addressConstraints) {
      count += Object.keys(data.deliveryLogisticsConstraints.addressConstraints).length;
    }

    return count;
  }

  /**
   * Compte le nombre total de services additionnels
   */
  private countServices(data: any): number {
    let count = 0;

    if (data.pickupLogisticsConstraints?.addressServices) {
      count += Object.keys(data.pickupLogisticsConstraints.addressServices).length;
    }

    if (data.deliveryLogisticsConstraints?.addressServices) {
      count += Object.keys(data.deliveryLogisticsConstraints.addressServices).length;
    }

    if (data.pickupLogisticsConstraints?.globalServices) {
      count += Object.keys(data.pickupLogisticsConstraints.globalServices).length;
    }

    if (data.deliveryLogisticsConstraints?.globalServices) {
      count += Object.keys(data.deliveryLogisticsConstraints.globalServices).length;
    }

    return count;
  }
}

// Export singleton
export const priceSignatureService = new PriceSignatureService();
