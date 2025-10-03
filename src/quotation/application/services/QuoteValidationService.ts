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
        switch (serviceType) {
            case 'PACKING':
                this.validatePackingData(data);
                break;
            case 'MOVING':
            case 'MOVING_PREMIUM':
                this.validateMovingData(data);
                break;
            case 'CLEANING':
                this.validateCleaningData(data);
                break;
            case 'DELIVERY':
                this.validateDeliveryData(data);
                break;
            default:
                logger.warn(`⚠️ Type de service non reconnu pour validation: ${serviceType}`);
        }
    }

    /**
     * Valide les données pour les services de packing
     */
    private validatePackingData(data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        
        if (quoteData.duration !== undefined && (quoteData.duration < 1 || quoteData.duration > 24)) {
            throw new ValidationError('La durée pour un service de packing doit être entre 1 et 24 heures');
        }

        if (quoteData.workers !== undefined && (quoteData.workers < 1 || quoteData.workers > 10)) {
            throw new ValidationError('Le nombre de travailleurs pour un service de packing doit être entre 1 et 10');
        }
    }

    /**
     * Valide les données pour les services de déménagement
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

    /**
     * Valide les données pour les services de nettoyage
     */
    private validateCleaningData(data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        
        if (quoteData.squareMeters !== undefined && quoteData.squareMeters < 0) {
            throw new ValidationError('La surface ne peut pas être négative');
        }

        if (quoteData.numberOfRooms !== undefined && quoteData.numberOfRooms < 1) {
            throw new ValidationError('Le nombre de pièces doit être au moins 1');
        }
    }

    /**
     * Valide les données pour les services de livraison
     */
    private validateDeliveryData(data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        
        if (quoteData.distance !== undefined && quoteData.distance < 0) {
            throw new ValidationError('La distance ne peut pas être négative');
        }

        if (quoteData.duration !== undefined && (quoteData.duration < 1 || quoteData.duration > 12)) {
            throw new ValidationError('La durée pour un service de livraison doit être entre 1 et 12 heures');
        }
    }
}
