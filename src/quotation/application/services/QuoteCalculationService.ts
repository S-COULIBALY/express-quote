import { ServiceType } from '../../domain/enums/ServiceType';
import { QuoteCalculator } from './QuoteCalculator';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { Quote } from '../../domain/valueObjects/Quote';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { normalizeQuoteData, extractPresetSnapshot } from '@/utils/quoteDataNormalizer';
import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { ServiceParamsConfigKey } from '@/quotation/domain/configuration/ConfigurationKey';

/**
 * Service spécialisé pour le calcul des devis
 * ✅ MIGRÉ VERS UNIFIED DATA SERVICE - Valeurs par défaut depuis la configuration
 * Gère la création du QuoteContext et l'orchestration du calcul
 */
export class QuoteCalculationService {
    private readonly unifiedDataService: UnifiedDataService;

    constructor(
        private readonly quoteCalculator: QuoteCalculator = QuoteCalculator.getInstance()
    ) {
        this.unifiedDataService = UnifiedDataService.getInstance();
    }

    /**
     * Calcule le prix pour un type de service avec des données
     */
    async calculateQuotePrice(serviceType: ServiceType, data: Record<string, any>): Promise<Quote> {
        logger.info(`🧮 Calcul du prix - serviceType: ${serviceType}`);
        
        try {
            const context = await this.createQuoteContext(serviceType, data);
            const quote = await this.quoteCalculator.calculateQuote(serviceType, context);
            
            logger.info(`✅ Prix calculé - serviceType: ${serviceType}, basePrice: ${quote.getBasePrice().getAmount()}, totalPrice: ${quote.getTotalPrice().getAmount()}`);
            
            return quote;
        } catch (error) {
            logger.error(`❌ Erreur lors du calcul du prix: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Crée un QuoteContext à partir des données
     * Version refactorisée avec une meilleure gestion des données
     */
    private async createQuoteContext(serviceType: ServiceType, data: Record<string, any>): Promise<QuoteContext> {
        logger.debug(`🔧 Création du contexte de calcul - serviceType: ${serviceType}`);
        logger.debug(`📊 Données reçues: ${JSON.stringify(data, null, 2)}`);
        
        const context = new QuoteContext(serviceType);

        try {
            // 1. ✅ STANDARDISATION : Normaliser la structure des données
            const normalizedData = normalizeQuoteData(data);
            logger.debug(`📊 Données normalisées: ${JSON.stringify(normalizedData, null, 2)}`);

            // 2. Récupération du __presetSnapshot depuis les données normalisées
            const presetSnapshot = normalizedData.__presetSnapshot;
            
            if (presetSnapshot) {
                context.setValue('__presetSnapshot', presetSnapshot);
                logger.debug(`✅ __presetSnapshot récupéré et normalisé: ${JSON.stringify(presetSnapshot)}`);
            } else {
                logger.warn(`⚠️ __presetSnapshot manquant dans les données normalisées`);
            }

            // 3. Mapping des prix avec priorité claire
            this.mapPricingData(context, normalizedData);

            // 4. Mapping des champs de base
            this.mapBasicFields(context, normalizedData);

            // 5. Mapping des champs spécifiques au service
            this.mapServiceSpecificFields(context, serviceType, normalizedData);

            // 6. Mapping des options et contraintes
            this.mapOptionsAndConstraints(context, normalizedData);

            // 7. Mapping des dates
            this.mapDates(context, normalizedData);

            // 8. ✅ MIGRÉ: Définition des valeurs par défaut si nécessaire (depuis configuration)
            await this.setDefaultValues(context, serviceType, normalizedData);

            // 9. ✅ AJOUT : Transmission des données de promotion depuis le __presetSnapshot
            this.transmitPromotionData(context, normalizedData);

            // Validation finale
            context.validate();
            
            logger.debug(`✅ Contexte de calcul créé - serviceType: ${serviceType}, fieldsCount: ${Object.keys(context.getAllData()).length}`);
            
            return context;
        } catch (error) {
            logger.error(`❌ Erreur lors de la création du contexte de calcul: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw new ValidationError(`Erreur de mapping des données pour le calcul: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Mapping des données de prix avec priorité claire
     */
    private mapPricingData(context: QuoteContext, data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        
        // Priorité 1: calculatedPrice (le plus récent)
        if (quoteData.calculatedPrice !== undefined) {
            context.setValue('defaultPrice', quoteData.calculatedPrice);
            context.setValue('basePrice', quoteData.calculatedPrice);
            logger.debug(`✅ Prix mappé depuis calculatedPrice: ${quoteData.calculatedPrice}`);
            return;
        }

        // Priorité 2: totalPrice
        if (quoteData.totalPrice !== undefined) {
            context.setValue('defaultPrice', quoteData.totalPrice);
            context.setValue('basePrice', quoteData.totalPrice);
            logger.debug(`✅ Prix mappé depuis totalPrice: ${quoteData.totalPrice}`);
            return;
        }

        // Priorité 3: defaultPrice
        if (quoteData.defaultPrice !== undefined) {
            context.setValue('defaultPrice', quoteData.defaultPrice);
            logger.debug(`✅ Prix mappé depuis defaultPrice: ${quoteData.defaultPrice}`);
        }

        // Priorité 4: basePrice
        if (quoteData.basePrice !== undefined) {
            context.setValue('basePrice', quoteData.basePrice);
            if (!context.hasValue('defaultPrice')) {
                context.setValue('defaultPrice', quoteData.basePrice);
            }
            logger.debug(`✅ Prix mappé depuis basePrice: ${quoteData.basePrice}`);
        }

        // Priorité 5: price (fallback)
        if (quoteData.price !== undefined) {
            context.setValue('basePrice', quoteData.price);
            if (!context.hasValue('defaultPrice')) {
                context.setValue('defaultPrice', quoteData.price);
            }
            logger.debug(`✅ Prix mappé depuis price: ${quoteData.price}`);
        }

        // Priorité 6: formData.basePrice (fallback)
        if (quoteData.formData?.basePrice !== undefined) {
            context.setValue('basePrice', quoteData.formData.basePrice);
            if (!context.hasValue('defaultPrice')) {
                context.setValue('defaultPrice', quoteData.formData.basePrice);
            }
            logger.debug(`✅ Prix mappé depuis formData.basePrice: ${quoteData.formData.basePrice}`);
        }
    }

    /**
     * Mapping des champs de base
     */
    private mapBasicFields(context: QuoteContext, data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        const basicFields = ['volume', 'distance', 'duration', 'workers', 'numberOfMovers'];
        
        basicFields.forEach(field => {
            if (quoteData[field] !== undefined) {
                context.setValue(field, quoteData[field]);
                logger.debug(`✅ Champ ${field} mappé: ${quoteData[field]}`);
            }
        });
    }

    /**
     * Mapping des champs spécifiques au service
     */
    private mapServiceSpecificFields(context: QuoteContext, serviceType: ServiceType, data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        
        // Champs pour déménagement et packing
        if (serviceType === ServiceType.MOVING_PREMIUM || serviceType === ServiceType.PACKING) {
            const movingFields = [
                'pickupFloor', 'deliveryFloor', 'pickupElevator', 'deliveryElevator',
                'pickupCarryDistance', 'deliveryCarryDistance', 'hasElevator'
            ];
            
            movingFields.forEach(field => {
                if (quoteData[field] !== undefined) {
                    context.setValue(field, quoteData[field]);
                    logger.debug(`✅ Champ déménagement ${field} mappé: ${quoteData[field]}`);
                }
            });
        }

        // Champs pour nettoyage
        if (serviceType === ServiceType.CLEANING) {
            const cleaningFields = ['squareMeters', 'numberOfRooms', 'hasBalcony', 'hasPets', 'frequency'];
            
            cleaningFields.forEach(field => {
                if (quoteData[field] !== undefined) {
                    context.setValue(field, quoteData[field]);
                    logger.debug(`✅ Champ nettoyage ${field} mappé: ${quoteData[field]}`);
                }
            });
        }
    }

    /**
     * Mapping des options et contraintes
     */
    private mapOptionsAndConstraints(context: QuoteContext, data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;

        // Options diverses
        const options = ['packaging', 'fragile', 'storage', 'disassembly', 'unpacking', 'supplies'];
        
        options.forEach(option => {
            if (quoteData[option] !== undefined) {
                context.setValue(option, quoteData[option]);
                logger.debug(`✅ Option ${option} mappée: ${quoteData[option]}`);
            }
        });

        // Contraintes logistiques
        if (quoteData.logisticsConstraints) {
            Object.keys(quoteData.logisticsConstraints).forEach(key => {
                if (quoteData.logisticsConstraints[key]) {
                    context.setValue(key, quoteData.logisticsConstraints[key]);
                    logger.debug(`✅ Contrainte logistique ${key} mappée: ${quoteData.logisticsConstraints[key]}`);
                }
            });
        }
    }

    /**
     * Mapping des dates
     */
    private mapDates(context: QuoteContext, data: Record<string, any>): void {
        // ✅ Utiliser directement les données normalisées
        const quoteData = data;
        
        if (quoteData.scheduledDate) {
            context.setValue('scheduledDate', new Date(quoteData.scheduledDate));
            logger.debug(`✅ Date de service mappée: ${quoteData.scheduledDate}`);
        } else if (quoteData.moveDate) {
            context.setValue('scheduledDate', new Date(quoteData.moveDate));
            logger.debug(`✅ Date de déménagement mappée: ${quoteData.moveDate}`);
        }
    }

    /**
     * ✅ MIGRÉ: Définit les valeurs par défaut selon le type de service (depuis configuration)
     */
    private async setDefaultValues(context: QuoteContext, serviceType: ServiceType, data: Record<string, any>): Promise<void> {
        // ✅ CORRECTION : Utiliser directement les données normalisées
        const quoteData = data;
        logger.debug(`🔧 Définition des valeurs par défaut pour le service - serviceType: ${serviceType}`);
        
        // ✅ NOUVEAU: Récupération des valeurs par défaut depuis la configuration
        const [packingDefaultDuration, packingDefaultWorkers, cleaningDefaultDuration, cleaningDefaultWorkers, deliveryDefaultDuration, deliveryDefaultWorkers] = await Promise.all([
            this.unifiedDataService.getConfigurationValue(
                ConfigurationCategory.SERVICE_PARAMS,
                ServiceParamsConfigKey.PACKING_DEFAULT_DURATION,
                1
            ),
            this.unifiedDataService.getConfigurationValue(
                ConfigurationCategory.SERVICE_PARAMS,
                ServiceParamsConfigKey.PACKING_DEFAULT_WORKERS,
                2
            ),
            this.unifiedDataService.getConfigurationValue(
                ConfigurationCategory.SERVICE_PARAMS,
                ServiceParamsConfigKey.CLEANING_DEFAULT_DURATION,
                2
            ),
            this.unifiedDataService.getConfigurationValue(
                ConfigurationCategory.SERVICE_PARAMS,
                ServiceParamsConfigKey.CLEANING_DEFAULT_WORKERS,
                1
            ),
            this.unifiedDataService.getConfigurationValue(
                ConfigurationCategory.SERVICE_PARAMS,
                ServiceParamsConfigKey.DELIVERY_DEFAULT_DURATION,
                1
            ),
            this.unifiedDataService.getConfigurationValue(
                ConfigurationCategory.SERVICE_PARAMS,
                ServiceParamsConfigKey.DELIVERY_DEFAULT_WORKERS,
                1
            )
        ]);

        logger.info('✅ [QUOTE-CALC] Valeurs par défaut récupérées depuis la configuration');

        switch (serviceType) {
            case ServiceType.PACKING:
                if (!context.hasValue('defaultPrice')) {
                    const defaultPrice = quoteData.calculatedPrice || quoteData.totalPrice || quoteData.price || quoteData.formData?.basePrice || 0;
                    context.setValue('defaultPrice', defaultPrice);
                    logger.debug(`✅ Valeur par défaut définie pour defaultPrice: ${defaultPrice}`);
                }
                if (!context.hasValue('duration')) {
                    const defaultDuration = quoteData.duration || quoteData.formData?.duration || packingDefaultDuration;
                    context.setValue('duration', defaultDuration);
                    logger.debug(`✅ [QUOTE-CALC] Valeur par défaut définie pour duration (depuis config): ${defaultDuration}`);
                }
                if (!context.hasValue('workers')) {
                    const defaultWorkers = quoteData.workers || quoteData.formData?.workers || packingDefaultWorkers;
                    context.setValue('workers', defaultWorkers);
                    logger.debug(`✅ [QUOTE-CALC] Valeur par défaut définie pour workers (depuis config): ${defaultWorkers}`);
                }
                break;
                
            case ServiceType.MOVING:
            case ServiceType.MOVING_PREMIUM:
                if (!context.hasValue('volume')) {
                    const defaultVolume = quoteData.volume || 0;
                    context.setValue('volume', defaultVolume);
                    logger.debug(`✅ Valeur par défaut définie pour volume: ${defaultVolume}`);
                }
                if (!context.hasValue('distance')) {
                    const defaultDistance = quoteData.distance || 0;
                    context.setValue('distance', defaultDistance);
                    logger.debug(`✅ Valeur par défaut définie pour distance: ${defaultDistance}`);
                }
                break;
                
            case ServiceType.CLEANING:
                if (!context.hasValue('defaultPrice')) {
                    const defaultPrice = quoteData.calculatedPrice || quoteData.totalPrice || quoteData.price || quoteData.formData?.basePrice || 0;
                    context.setValue('defaultPrice', defaultPrice);
                    logger.debug(`✅ Valeur par défaut définie pour defaultPrice: ${defaultPrice}`);
                }
                if (!context.hasValue('duration')) {
                    const defaultDuration = quoteData.duration || quoteData.formData?.duration || cleaningDefaultDuration;
                    context.setValue('duration', defaultDuration);
                    logger.debug(`✅ [QUOTE-CALC] Valeur par défaut définie pour duration (depuis config): ${defaultDuration}`);
                }
                if (!context.hasValue('workers')) {
                    const defaultWorkers = quoteData.workers || quoteData.formData?.workers || cleaningDefaultWorkers;
                    context.setValue('workers', defaultWorkers);
                    logger.debug(`✅ [QUOTE-CALC] Valeur par défaut définie pour workers (depuis config): ${defaultWorkers}`);
                }
                break;
                
            case ServiceType.DELIVERY:
                if (!context.hasValue('defaultPrice')) {
                    const defaultPrice = quoteData.calculatedPrice || quoteData.totalPrice || quoteData.price || quoteData.formData?.basePrice || 0;
                    context.setValue('defaultPrice', defaultPrice);
                    logger.debug(`✅ Valeur par défaut définie pour defaultPrice: ${defaultPrice}`);
                }
                if (!context.hasValue('duration')) {
                    const defaultDuration = quoteData.duration || quoteData.formData?.duration || deliveryDefaultDuration;
                    context.setValue('duration', defaultDuration);
                    logger.debug(`✅ [QUOTE-CALC] Valeur par défaut définie pour duration (depuis config): ${defaultDuration}`);
                }
                if (!context.hasValue('workers')) {
                    const defaultWorkers = quoteData.workers || quoteData.formData?.workers || deliveryDefaultWorkers;
                    context.setValue('workers', defaultWorkers);
                    logger.debug(`✅ [QUOTE-CALC] Valeur par défaut définie pour workers (depuis config): ${defaultWorkers}`);
                }
                break;
                
            default:
                logger.warn(`⚠️ Type de service non reconnu pour les valeurs par défaut: ${serviceType}`);
                break;
        }
    }

    /**
     * Transmet les données de promotion depuis le __presetSnapshot au contexte
     */
    private transmitPromotionData(context: QuoteContext, data: Record<string, any>): void {
        const presetSnapshot = context.getValue('__presetSnapshot') as any;
        
        if (presetSnapshot && presetSnapshot.isPromotionActive) {
            // Transmettre les données de promotion au contexte
            context.setValue('promotionCode', presetSnapshot.promotionCode);
            context.setValue('promotionValue', presetSnapshot.promotionValue);
            context.setValue('promotionType', presetSnapshot.promotionType);
            context.setValue('isPromotionActive', presetSnapshot.isPromotionActive);
            
            logger.debug(`✅ Données de promotion transmises au contexte: ${JSON.stringify({
                promotionCode: presetSnapshot.promotionCode,
                promotionValue: presetSnapshot.promotionValue,
                promotionType: presetSnapshot.promotionType,
                isPromotionActive: presetSnapshot.isPromotionActive
            })}`);
        } else {
            logger.debug(`ℹ️ Aucune promotion active à transmettre`);
        }
    }
}
