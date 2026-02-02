import { validateQuoteRequest } from '../../interfaces/http/dtos/QuoteRequestDto';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { normalizeQuoteData } from '@/utils/quoteDataNormalizer';

/**
 * Service spécialisé pour la validation des données de devis
 * Centralise toute la logique de validation
 */
export class QuoteValidationService {
    
    /**
     * Valide les données d'une demande de devis
     */
    validateQuoteRequestData(data: Record<string, any>): Record<string, any> {
        logger.info(`🔍 Validation des données de demande de devis`);
        
        try {
            // ✅ NORMALISATION : Normaliser les données avant validation
            const normalizedData = normalizeQuoteData(data);
            
            const validatedData = validateQuoteRequest(normalizedData);
            logger.info(`✅ Données validées avec succès`);
            return validatedData;
        } catch (error) {
            logger.error(`❌ Erreur de validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Valide les données de mise à jour d'une demande de devis
     */
    validateQuoteRequestUpdate(currentData: Record<string, any>, updateData: Partial<Record<string, any>>): Record<string, any> {
        logger.info(`🔍 Validation des données de mise à jour`);
        
        try {
            const mergedData = { ...currentData, ...updateData };
            const validatedData = validateQuoteRequest(mergedData);
            logger.info(`✅ Données de mise à jour validées avec succès`);
            return validatedData;
        } catch (error) {
            logger.error(`❌ Erreur de validation de mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Valide les données de calcul de prix
     */
    validateCalculationData(data: Record<string, any>): void {
        logger.info(`🔍 Validation des données de calcul`);
        
        try {
            // Validation basique des données de calcul
            if (!data) {
                throw new ValidationError('Les données de calcul sont requises');
            }

            // Validation des champs critiques selon le type de service
            if (data.serviceType) {
                this.validateServiceSpecificData(data.serviceType, data);
            }

            logger.info(`✅ Données de calcul validées avec succès`);
        } catch (error) {
            logger.error(`❌ Erreur de validation des données de calcul: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Valide les données spécifiques au type de service
     */
    private validateServiceSpecificData(serviceType: string, data: Record<string, any>): void {
        // Seul le déménagement est actif ; anciens types validés comme MOVING pour compatibilité
        switch (serviceType) {
            case 'MOVING':
            case 'MOVING_PREMIUM':
            case 'PACKING':
            case 'CLEANING':
            case 'DELIVERY':
                this.validateMovingData(data);
                break;
            default:
                logger.warn(`⚠️ Type de service non reconnu pour validation: ${serviceType}, utilisation validation déménagement`);
                this.validateMovingData(data);
        }
    }

    /**
     * Valide les données pour les services de déménagement (seul type actif ; anciens types validés comme MOVING)
     */
    private validateMovingData(data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        
        if (quoteData.volume !== undefined && quoteData.volume < 0) {
            throw new ValidationError('Le volume ne peut pas être négatif');
        }

        if (quoteData.distance !== undefined && quoteData.distance < 0) {
            throw new ValidationError('La distance ne peut pas être négative');
        }

        if (quoteData.workers !== undefined && (quoteData.workers < 1 || quoteData.workers > 10)) {
            throw new ValidationError('Le nombre de travailleurs pour un déménagement doit être entre 1 et 10');
        }
    }
}
