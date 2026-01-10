/**
 * 🔒 BookingPriceValidationService
 * 
 * Service responsable de la validation du prix sécurisé :
 * - Vérification de la signature HMAC
 * - Validation du prix signé
 * - Fallback vers recalcul si nécessaire
 * 
 * ✅ PHASE 3 - Extraction depuis BookingService
 */

import { logger } from '@/lib/logger';

export interface PriceValidationResult {
  price: number;
  source: string;
  isValid: boolean;
}

/**
 * Service de validation du prix sécurisé
 */
export class BookingPriceValidationService {
  /**
   * Valide le prix sécurisé avec signature HMAC
   * 
   * PRIORITÉ 1: Prix signé avec signature HMAC valide
   * PRIORITÉ 2: Recalcul si signature invalide ou absente
   * 
   * @param quoteData - Les données du devis
   * @param serviceType - Le type de service
   * @param recalculatePrice - Fonction de recalcul (fallback)
   * @returns Le résultat de validation avec le prix validé
   */
  async validateSecuredPrice(
    quoteData: any,
    serviceType: string,
    recalculatePrice: (quoteData: any, serviceType: string) => Promise<number>
  ): Promise<PriceValidationResult> {
    // ✅ OPTION A: Utiliser le prix sécurisé avec signature HMAC (RECOMMANDÉ)
    if (quoteData.securedPrice && quoteData.securedPrice.signature) {
      logger.info('🔐 Vérification de la signature HMAC du prix...');

      // Importer le service de signature
      const { priceSignatureService } = await import(
        '../../PriceSignatureService'
      );

      // Vérifier la signature
      const verification = priceSignatureService.verifySignature(
        quoteData.securedPrice,
        quoteData
      );

      if (verification.valid) {
        // ✅ Signature valide - Utiliser le prix signé
        const price = quoteData.securedPrice.totalPrice;
        const source = `signature HMAC (${verification.details?.ageHours?.toFixed(2)}h)`;

        logger.info('✅ Prix signé validé et utilisé', {
          price,
          calculationId: quoteData.securedPrice.calculationId,
          signatureAge: verification.details?.ageHours?.toFixed(2) + 'h',
          calculatedAt: quoteData.securedPrice.calculatedAt,
        });

        return {
          price,
          source,
          isValid: true,
        };
      } else {
        // ⚠️ Signature invalide - Fallback vers recalcul
        logger.warn('⚠️ Signature invalide - RECALCUL nécessaire (fallback)', {
          reason: verification.reason,
        });
        const price = await recalculatePrice(quoteData, serviceType);
        return {
          price,
          source: 'recalcul (signature invalide)',
          isValid: false,
        };
      }
    } else {
      // ⚠️ OPTION B: Pas de prix sécurisé - Recalcul obligatoire (fallback)
      logger.warn('⚠️ Pas de prix sécurisé - RECALCUL nécessaire (fallback)');
      const price = await recalculatePrice(quoteData, serviceType);
      return {
        price,
        source: 'recalcul (pas de signature)',
        isValid: false,
      };
    }
  }
}

