import { QuoteCalculator } from './QuoteCalculator';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { Quote } from '../../domain/valueObjects/Quote';
import { ServiceType } from '../../domain/enums/ServiceType';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { devLog } from '@/lib/conditional-logger';
import { PrismaClient } from '@prisma/client';

interface PriceCalculationRequest {
    serviceType: ServiceType;
    volume?: number;
    distance?: number;
    duration?: number;
    workers?: number;
    defaultPrice?: number;
    basePrice?: number;
    __presetSnapshot?: {
        volume?: number;
        distance: number;
        workers: number;
        duration: number;
        promotionCode?: string;
        promotionValue?: number;
        promotionType?: string;
        isPromotionActive?: boolean;
    };
    promotionCode?: string;
    promotionValue?: number;
    promotionType?: string;
    isPromotionActive?: boolean;
    scheduledDate?: Date | string;
    pickupFloor?: number;
    deliveryFloor?: number;
    pickupElevator?: boolean | string;
    deliveryElevator?: boolean | string;
    pickupCarryDistance?: number | string;
    deliveryCarryDistance?: number | string;
    baseWorkers?: number;
    baseDuration?: number;
    pickupNeedsLift?: boolean;
    deliveryNeedsLift?: boolean;
    options?: {
        packaging?: boolean;
        fragile?: boolean;
        storage?: boolean;
        disassembly?: boolean;
        unpacking?: boolean;
        supplies?: boolean;
    };
    logisticsConstraints?: Record<string, any>;
    // ✅ CORRECTION: Ajouter les champs de contraintes logistiques par adresse
    // ⚠️ Peut être soit un tableau (format attendu) soit un objet {constraint: true} (format actuel du formulaire)
    pickupLogisticsConstraints?: string[] | Record<string, boolean>;
    deliveryLogisticsConstraints?: string[] | Record<string, boolean>;
    // ✅ NOUVEAU: Services par adresse (monte-meuble, emballage départ, déballage arrivée, etc.)
    pickupServices?: string[] | Record<string, boolean>;
    deliveryServices?: string[] | Record<string, boolean>;
    // ✅ NOUVEAU: Services supplémentaires globaux (piano, stockage, etc.)
    // Format: soit tableau de noms, soit objet {id_ou_nom: true} comme les contraintes
    additionalServices?: string[] | Record<string, boolean>;
    // ✅ CORRECTION: Ajouter les adresses
    pickupAddress?: string;
    deliveryAddress?: string;
    [key: string]: any;
}

/**
 * Service SIMPLIFIÉ pour le calcul de prix en temps réel
 * OBJECTIF : Seulement le calcul de prix, rien d'autre
 */
export class PriceService {
    private readonly prisma: PrismaClient;

    constructor(
        private readonly quoteCalculator: QuoteCalculator = QuoteCalculator.getInstance()
    ) {
        this.prisma = new PrismaClient();
    }

    /**
     * POST /api/price/calculate
     * Calcul de prix complet et précis avec toutes les règles
     */
    async calculatePrice(request: PriceCalculationRequest): Promise<{
        basePrice: number;
        totalPrice: number;
        currency: string;
        breakdown: Record<string, number>;
        appliedRules: Array<{ name: string; impact: number; type: string }>;
        calculationId: string;
        serviceType: ServiceType;
    }> {
        logger.info(`💰 Calcul de prix complet - Service: ${request.serviceType}`);

        devLog.debug('PriceService', '📋 [PriceService] ÉTAPE 2: Request reçu:', {
            pickupLogisticsConstraints: request.pickupLogisticsConstraints,
            deliveryLogisticsConstraints: request.deliveryLogisticsConstraints,
            additionalServices: request.additionalServices,
            pickupAddress: request.pickupAddress?.substring(0, 50),
            deliveryAddress: request.deliveryAddress?.substring(0, 50)
        });

        try {
            // Validation des données d'entrée
            this.validateCalculationRequest(request);

            // Créer le contexte de calcul
            const context = await this.createQuoteContext(request);

            devLog.debug('PriceService', '🎯 [PriceService] ÉTAPE 3: Context créé, données dans le context:', {
                pickupLogisticsConstraints: context.getValue('pickupLogisticsConstraints'),
                deliveryLogisticsConstraints: context.getValue('deliveryLogisticsConstraints'),
                additionalServices: context.getValue('additionalServices')
            });

                    // Calculer le prix avec le QuoteCalculator
            const quote = await this.quoteCalculator.calculateQuote(request.serviceType, context);

            // Générer un ID de calcul unique
            const calculationId = this.generateCalculationId();

            // Construire la réponse détaillée
            const response = {
                basePrice: quote.getBasePrice().getAmount(),
                totalPrice: quote.getTotalPrice().getAmount(),
                currency: quote.getBasePrice().getCurrency(),
                breakdown: this.convertDetailsToBreakdown(quote.getDetails()),
                appliedRules: this.extractAppliedRules(quote),
                details: quote.getDetails(), // ✅ Détails du calcul inclus
                calculationId,
                serviceType: request.serviceType
            };

            logger.info(`✅ Prix calculé avec succès - ID: ${calculationId}, Base: ${response.basePrice}€, Total: ${response.totalPrice}€`);

            return response;

        } catch (error) {
            logger.error(`❌ Erreur lors du calcul de prix: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }




    // === MÉTHODES PRIVÉES ===

    private validateCalculationRequest(request: PriceCalculationRequest): void {
        if (!request.serviceType) {
            throw new ValidationError('Type de service requis');
        }

        if (!Object.values(ServiceType).includes(request.serviceType)) {
            throw new ValidationError('Type de service invalide');
        }

        // Les champs spécifiques (volume, distance, duration, workers) sont optionnels
        // Le calculateur se charge de déterminer les valeurs appropriées selon le type de service
    }

    private async createQuoteContext(request: PriceCalculationRequest): Promise<QuoteContext> {
        devLog.debug('PriceService', '🔍 [PriceService] createQuoteContext - request reçue:', {
            serviceType: request.serviceType,
            hasPickup: !!(request as any).pickup,
            hasDelivery: !!(request as any).delivery,
            hasGlobalServices: !!(request as any).globalServices,
            pickupLogisticsConstraints: request.pickupLogisticsConstraints,
            deliveryLogisticsConstraints: request.deliveryLogisticsConstraints
        });

        // ✅ SUPPORT STRUCTURE GROUPÉE: Détecter et extraire depuis la structure groupée
        if ((request as any).pickup || (request as any).delivery || (request as any).globalServices) {
            devLog.debug('PriceService', '📦 [PriceService] Structure groupée détectée, extraction des données...');

            // Extraire pickup
            if ((request as any).pickup) {
                const pickup = (request as any).pickup;
                request.pickupAddress = pickup.address;
                request.pickupFloor = pickup.floor;
                request.pickupElevator = pickup.elevator;
                request.pickupCarryDistance = pickup.carryDistance;

                // Extraire juste les UUIDs depuis les rules
                if (pickup.rules && Array.isArray(pickup.rules)) {
                    request.pickupLogisticsConstraints = pickup.rules.reduce((acc: Record<string, boolean>, rule: any) => {
                        acc[rule.id] = true;
                        return acc;
                    }, {});
                }
            }

            // Extraire delivery
            if ((request as any).delivery) {
                const delivery = (request as any).delivery;
                request.deliveryAddress = delivery.address;
                request.deliveryFloor = delivery.floor;
                request.deliveryElevator = delivery.elevator;
                request.deliveryCarryDistance = delivery.carryDistance;

                // Extraire juste les UUIDs depuis les rules
                if (delivery.rules && Array.isArray(delivery.rules)) {
                    request.deliveryLogisticsConstraints = delivery.rules.reduce((acc: Record<string, boolean>, rule: any) => {
                        acc[rule.id] = true;
                        return acc;
                    }, {});
                }
            }

            // Extraire global services
            if ((request as any).globalServices && Array.isArray((request as any).globalServices)) {
                request.additionalServices = (request as any).globalServices.reduce((acc: Record<string, boolean>, service: any) => {
                    acc[service.id] = true;
                    return acc;
                }, {});
            }

            devLog.debug('PriceService', '✅ [PriceService] Données extraites de la structure groupée:', {
                pickupAddress: request.pickupAddress,
                deliveryAddress: request.deliveryAddress,
                pickupConstraintsCount: Object.keys(request.pickupLogisticsConstraints || {}).length,
                deliveryConstraintsCount: Object.keys(request.deliveryLogisticsConstraints || {}).length,
                additionalServicesCount: Object.keys(request.additionalServices || {}).length
            });
        }

        const context = new QuoteContext(request.serviceType);

        // Champs communs
        if (request.volume !== undefined) context.setValue('volume', request.volume);
        if (request.distance !== undefined) context.setValue('distance', request.distance);
        if (request.duration !== undefined) context.setValue('duration', request.duration);
        if (request.workers !== undefined) context.setValue('workers', request.workers);
        
        // Prix de base (requis pour PACKING, CLEANING, DELIVERY)
        if (request.defaultPrice !== undefined) context.setValue('defaultPrice', request.defaultPrice);
        if (request.basePrice !== undefined) context.setValue('basePrice', request.basePrice);
        
        // ✅ Ajout du __presetSnapshot pour la comparaison PACKING non modifié
        if (request.__presetSnapshot !== undefined) context.setValue('__presetSnapshot', request.__presetSnapshot);
        
        // ✅ Ajout des données de promotion
        if (request.promotionCode !== undefined) context.setValue('promotionCode', request.promotionCode);
        if (request.promotionValue !== undefined) context.setValue('promotionValue', request.promotionValue);
        if (request.promotionType !== undefined) context.setValue('promotionType', request.promotionType);
        if (request.isPromotionActive !== undefined) context.setValue('isPromotionActive', request.isPromotionActive);

        // Date de service
        if (request.scheduledDate) {
            const date = typeof request.scheduledDate === 'string' 
                ? new Date(request.scheduledDate) 
                : request.scheduledDate;
            context.setValue('scheduledDate', date);
        }

        // Champs spécifiques au déménagement (MOVING)
        if (request.serviceType === ServiceType.MOVING_PREMIUM) {
            if (request.pickupFloor !== undefined) context.setValue('pickupFloor', request.pickupFloor);
            if (request.deliveryFloor !== undefined) context.setValue('deliveryFloor', request.deliveryFloor);
            if (request.pickupElevator !== undefined) context.setValue('pickupElevator', request.pickupElevator);
            if (request.deliveryElevator !== undefined) context.setValue('deliveryElevator', request.deliveryElevator);
            if (request.pickupCarryDistance !== undefined) context.setValue('pickupCarryDistance', request.pickupCarryDistance);
            if (request.deliveryCarryDistance !== undefined) context.setValue('deliveryCarryDistance', request.deliveryCarryDistance);
        }
        
        // Champs spécifiques aux packs (PACKING)
        if (request.serviceType === ServiceType.PACKING) {
            if (request.pickupFloor !== undefined) context.setValue('pickupFloor', request.pickupFloor);
            if (request.deliveryFloor !== undefined) context.setValue('deliveryFloor', request.deliveryFloor);
            if (request.pickupElevator !== undefined) context.setValue('pickupElevator', request.pickupElevator);
            if (request.deliveryElevator !== undefined) context.setValue('deliveryElevator', request.deliveryElevator);
            if (request.pickupCarryDistance !== undefined) context.setValue('pickupCarryDistance', request.pickupCarryDistance);
            if (request.deliveryCarryDistance !== undefined) context.setValue('deliveryCarryDistance', request.deliveryCarryDistance);
            
            // Champs spécifiques aux packs
            if (request.baseWorkers !== undefined) context.setValue('baseWorkers', request.baseWorkers);
            if (request.baseDuration !== undefined) context.setValue('baseDuration', request.baseDuration);
            if (request.pickupNeedsLift !== undefined) context.setValue('pickupNeedsLift', request.pickupNeedsLift);
            if (request.deliveryNeedsLift !== undefined) context.setValue('deliveryNeedsLift', request.deliveryNeedsLift);
        }

        // Options
        if (request.options) {
            Object.keys(request.options).forEach(key => {
                context.setValue(key, request.options![key as keyof typeof request.options]);
            });
        }

        // Contraintes logistiques
        if (request.logisticsConstraints) {
            Object.keys(request.logisticsConstraints).forEach(key => {
                context.setValue(key, request.logisticsConstraints![key]);
            });
        }

        // ✅ CORRECTION CRITIQUE: Ajouter pickupLogisticsConstraints et deliveryLogisticsConstraints
        // Ces champs sont envoyés par le formulaire mais n'étaient pas mappés dans le contexte
        // ⚠️ IMPORTANT: Le formulaire envoie un OBJET {constraint: true, uuid: true}, il faut le convertir en TABLEAU ['constraint']
        // ✅ NOUVELLE VERSION: Mapping asynchrone des UUIDs vers les noms de contraintes
        if (request.pickupLogisticsConstraints !== undefined) {
            const pickupConstraints = await this.normalizeConstraintsAsync(request.pickupLogisticsConstraints, request.serviceType);
            context.setValue('pickupLogisticsConstraints', pickupConstraints);
        }
        if (request.deliveryLogisticsConstraints !== undefined) {
            const deliveryConstraints = await this.normalizeConstraintsAsync(request.deliveryLogisticsConstraints, request.serviceType);
            context.setValue('deliveryLogisticsConstraints', deliveryConstraints);
        }

        // ✅ NOUVEAU: Services par adresse (monte-meuble pickup/delivery, emballage départ, déballage arrivée, etc.)
        if (request.pickupServices !== undefined) {
            const pickupSvcs = await this.normalizeServicesAsync(request.pickupServices, request.serviceType);
            context.setValue('pickupServices', pickupSvcs);
            devLog.debug('PriceService', '✅ [PriceService] Services pickup ajoutés au contexte:', pickupSvcs);
        }
        if (request.deliveryServices !== undefined) {
            const deliverySvcs = await this.normalizeServicesAsync(request.deliveryServices, request.serviceType);
            context.setValue('deliveryServices', deliverySvcs);
            devLog.debug('PriceService', '✅ [PriceService] Services delivery ajoutés au contexte:', deliverySvcs);
        }

        // ✅ NOUVEAU: Services supplémentaires globaux (piano, stockage, etc.)
        // Utilise la même logique de normalisation pour mapper les UUIDs vers les noms de services
        if (request.additionalServices !== undefined) {
            const services = await this.normalizeServicesAsync(request.additionalServices, request.serviceType);
            context.setValue('additionalServices', services);
            devLog.debug('PriceService', '✅ [PriceService] Services globaux ajoutés au contexte:', services);
        }

        // ✅ CORRECTION: Ajouter aussi les autres champs du formulaire qui peuvent être présents
        // Adresses (nécessaires pour certaines règles géographiques)
        if (request.pickupAddress !== undefined) context.setValue('pickupAddress', request.pickupAddress);
        if (request.deliveryAddress !== undefined) context.setValue('deliveryAddress', request.deliveryAddress);

        // ✅ LOG: Vérifier que les contraintes ont bien été ajoutées au contexte
        const contextData = context.getAllData();
        devLog.debug('PriceService', '🔍 [PriceService] Context créé avec:', {
            hasPickupConstraints: !!contextData.pickupLogisticsConstraints,
            pickupConstraintsCount: Array.isArray(contextData.pickupLogisticsConstraints) ? contextData.pickupLogisticsConstraints.length : 0,
            hasDeliveryConstraints: !!contextData.deliveryLogisticsConstraints,
            deliveryConstraintsCount: Array.isArray(contextData.deliveryLogisticsConstraints) ? contextData.deliveryLogisticsConstraints.length : 0,
            pickupFloor: contextData.pickupFloor,
            pickupElevator: contextData.pickupElevator,
            deliveryFloor: contextData.deliveryFloor,
            deliveryElevator: contextData.deliveryElevator
        });

        return context;
    }

    private convertDetailsToBreakdown(details: { label: string; amount: number }[]): Record<string, number> {
        const breakdown: Record<string, number> = {};

        // Convertir les détails en breakdown avec des clés simplifiées
        details.forEach((detail, index) => {
            const key = this.createBreakdownKey(detail.label, index);
            breakdown[key] = detail.amount;
        });

        return breakdown;
    }

    private createBreakdownKey(label: string, index: number): string {
        // Créer une clé simple basée sur le label
        const cleanLabel = label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        return cleanLabel || `item_${index}`;
    }

    private extractAppliedRules(quote: Quote): Array<{ name: string; impact: number; type: string }> {
        const discounts = quote.getDiscounts();
        const basePrice = quote.getBasePrice().getAmount();

        return discounts.map(discount => {
            const value = discount.getValue();
            const type = discount.getType();

            // ✅ CORRECTION: Calculer l'impact réel en euros
            let impact: number;
            if (type === 'PERCENTAGE') {
                // Pour un pourcentage, calculer l'impact en euros sur le prix de base
                impact = (basePrice * value) / 100;
            } else {
                // Pour un montant fixe, utiliser la valeur directement
                impact = value;
            }

            // Appliquer le signe (réduction = négatif, surcharge = positif)
            if (discount.isReduction()) {
                impact = -impact;
            }

            return {
                name: discount.getName(),
                impact: Math.round(impact * 100) / 100, // Arrondir à 2 décimales
                type: type
            };
        });
    }

    private generateCalculationId(): string {
        return `calc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    /**
     * ✅ NOUVELLE VERSION ASYNCHRONE: Normalise les contraintes logistiques ET mappe les UUIDs
     * Le formulaire peut envoyer soit:
     * - Un tableau: ['constraint1', 'constraint2'] ✅ Format attendu
     * - Un objet: {constraint1: true, constraint2: true, uuid: true} ❌ Format actuel du frontend
     *
     * Cette méthode:
     * 1. Extrait les noms de contraintes (snake_case)
     * 2. Extrait les UUIDs de règles sélectionnées dans le modal
     * 3. Charge les règles depuis la BDD par UUID
     * 4. Extrait le nom de contrainte depuis la condition JSON de chaque règle
     * 5. Retourne la liste complète des noms de contraintes
     */
    private async normalizeConstraintsAsync(constraints: any, serviceType: ServiceType): Promise<string[]> {
        // Si c'est déjà un tableau, le retourner tel quel (déjà des UUIDs)
        if (Array.isArray(constraints)) {
            return constraints;
        }

        // Si c'est un objet, extraire les clés avec valeur true (ce sont des UUIDs)
        if (typeof constraints === 'object' && constraints !== null) {
            const selectedIds = Object.keys(constraints).filter(key => constraints[key] === true);

            devLog.debug('PriceService', '🔧 [PriceService] Normalisation des contraintes (UUIDs directs):', {
                avant: constraints,
                uuidsExtraits: selectedIds
            });

            return selectedIds;
        }

        // Si c'est ni un tableau ni un objet, retourner un tableau vide
        devLog.warn('PriceService', '⚠️ [PriceService] Format de contraintes invalide:', constraints);
        return [];
    }

    /**
     * ✅ NORMALISATION DES SERVICES SUPPLÉMENTAIRES
     * Même logique que normalizeConstraintsAsync, mais pour les services (piano, fragile, etc.)
     * Les services ne sont PAS liés à une adresse spécifique, ils sont globaux
     */
    private async normalizeServicesAsync(services: any, serviceType: ServiceType): Promise<string[]> {
        // Si c'est déjà un tableau, le retourner tel quel (déjà des UUIDs)
        if (Array.isArray(services)) {
            return services;
        }

        // Si c'est un objet, extraire les clés avec valeur true (ce sont des UUIDs)
        if (typeof services === 'object' && services !== null) {
            const selectedIds = Object.keys(services).filter(key => services[key] === true);

            devLog.debug('PriceService', '🔧 [PriceService] Normalisation des services (UUIDs directs):', {
                avant: services,
                uuidsExtraits: selectedIds
            });

            return selectedIds;
        }

        return [];
    }

    /**
     * Mappe les types de services étendus vers les types de base utilisés en BDD
     * MOVING_PREMIUM → MOVING, CLEANING_PREMIUM → CLEANING, etc.
     * Note: Cette méthode est conservée car encore utilisée ailleurs
     */
    private mapToBaseServiceType(serviceType: ServiceType): string {
        if (serviceType === ServiceType.MOVING_PREMIUM || serviceType === ServiceType.PACKING) {
            return 'MOVING';
        }
        if (serviceType === ServiceType.CLEANING_PREMIUM) {
            return 'CLEANING';
        }
        return serviceType; // MOVING, CLEANING, DELIVERY restent inchangés
    }

} 