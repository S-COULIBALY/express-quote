import { QuoteCalculator } from './QuoteCalculator';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { Quote } from '../../domain/valueObjects/Quote';
import { ServiceType } from '../../domain/enums/ServiceType';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';

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
    [key: string]: any;
}

/**
 * Service SIMPLIFIÉ pour le calcul de prix en temps réel
 * OBJECTIF : Seulement le calcul de prix, rien d'autre
 */
export class PriceService {
    constructor(
        private readonly quoteCalculator: QuoteCalculator = QuoteCalculator.getInstance()
    ) {}

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

        try {
            // Validation des données d'entrée
            this.validateCalculationRequest(request);

            // Créer le contexte de calcul
            const context = this.createQuoteContext(request);

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

    private createQuoteContext(request: PriceCalculationRequest): QuoteContext {
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

} 