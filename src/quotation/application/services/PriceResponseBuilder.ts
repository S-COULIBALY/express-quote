import { Quote } from '../../domain/valueObjects/Quote';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { ServiceType } from '../../domain/enums/ServiceType';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { configAccessService } from './ConfigurationAccessService';

interface PriceCalculationRequest {
    serviceType: ServiceType;
    volume?: number;
    distance?: number;
    duration?: number;
    workers?: number;
    defaultPrice?: number;
    scheduledDate?: Date | string;
    pickupFloor?: number;
    deliveryFloor?: number;
    pickupElevator?: boolean | string;
    deliveryElevator?: boolean | string;
    pickupCarryDistance?: number | string;
    deliveryCarryDistance?: number | string;
    pickupAddress?: string;
    deliveryAddress?: string;
    __presetSnapshot?: {
        workers?: number;
    };
    [key: string]: any;
}

/**
 * Service dédié à la construction de la réponse API structurée
 * Séparé de PriceService pour améliorer la maintenabilité
 */
export class PriceResponseBuilder {
    private readonly prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Helper pour extraire la valeur numérique d'un Money ou d'un nombre
     * Gère les cas où la valeur peut être un objet Money, un nombre, ou undefined
     */
    private getNumericValue(value: any): number {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (value.getAmount && typeof value.getAmount === 'function') {
            const amount = value.getAmount();
            return typeof amount === 'number' ? amount : 0;
        }
        return 0;
    }

    /**
     * Construit la réponse complète de l'API de calcul de prix
     */
    async buildResponse(
        request: PriceCalculationRequest,
        quote: Quote,
        ruleExecutionResult: any,
        context: QuoteContext,
        calculationId: string
    ): Promise<any> {
        return {
            context: await this.buildContext(request, context, calculationId),
            summary: this.buildSummary(quote, ruleExecutionResult, context),
            breakdown: this.buildBreakdown(quote, ruleExecutionResult, context),
            appliedRules: await this.buildAppliedRules(ruleExecutionResult),
            detailsByAddress: this.buildDetailsByAddress(ruleExecutionResult),
            consumedConstraints: await this.buildConsumedConstraints(ruleExecutionResult),
            inferenceMetadata: this.buildInferenceMetadata(ruleExecutionResult),
            totals: this.buildTotals(ruleExecutionResult, quote)
        };
    }

    /**
     * Construit la section context avec toutes les informations de la demande
     */
    private async buildContext(
        request: PriceCalculationRequest,
        context: QuoteContext,
        calculationId: string
    ): Promise<any> {
        const contextData = context.getAllData();
        const distance = contextData.distance || request.distance || 0;
        
        // ✅ CORRECTION: Récupérer freeDistanceKm depuis la configuration selon le serviceType
        // car il n'est pas stocké dans le contexte
        let freeDistanceKm = 0;
        try {
            if (request.serviceType === ServiceType.MOVING || request.serviceType === ServiceType.MOVING_PREMIUM) {
                freeDistanceKm = await configAccessService.get<number>('MOVING_FREE_DISTANCE_KM');
            } else if (request.serviceType === ServiceType.PACKING) {
                freeDistanceKm = await configAccessService.get<number>('PACK_INCLUDED_DISTANCE');
            }
            // Pour DELIVERY et CLEANING, freeDistanceKm reste à 0 (pas de km gratuits)
        } catch (error) {
            logger.warn(`⚠️ [PriceResponseBuilder] Erreur récupération freeDistanceKm: ${error}`);
            freeDistanceKm = 0;
        }
        
        const chargeableKm = Math.max(0, distance - freeDistanceKm);

        return {
            serviceType: this.formatServiceType(request.serviceType),
            calculationId,
            calculatedAt: new Date().toISOString(),
            defaultPrice: request.defaultPrice || 0,
            date: request.scheduledDate ? (typeof request.scheduledDate === 'string' ? request.scheduledDate : request.scheduledDate.toISOString().split('T')[0]) : undefined,
            origin: {
                address: request.pickupAddress || contextData.pickupAddress || undefined,
                floor: request.pickupFloor || contextData.pickupFloor || undefined,
                elevator: this.formatElevator(request.pickupElevator || contextData.pickupElevator),
                carryDistance: request.pickupCarryDistance || contextData.pickupCarryDistance || undefined
            },
            destination: {
                address: request.deliveryAddress || contextData.deliveryAddress || undefined,
                floor: request.deliveryFloor || contextData.deliveryFloor || undefined,
                elevator: this.formatElevator(request.deliveryElevator || contextData.deliveryElevator),
                carryDistance: request.deliveryCarryDistance || contextData.deliveryCarryDistance || undefined
            },
            distance: {
                km: distance,
                chargeableKm: chargeableKm,
                freeKm: freeDistanceKm
            },
            volume: request.volume || contextData.volume || null,
            workers: request.workers || contextData.workers || request.__presetSnapshot?.workers || undefined,
            estimatedDuration: contextData.estimatedDuration ? `${contextData.estimatedDuration}h` : request.duration ? `${request.duration}h` : undefined
        };
    }

    /**
     * Construit la section summary avec les totaux agrégés
     */
    private buildSummary(
        quote: Quote,
        ruleExecutionResult: any,
        context: QuoteContext
    ): any {
        const basePrice = parseFloat(quote.getBasePrice().getAmount().toFixed(2));
        const totalPrice = parseFloat(quote.getTotalPrice().getAmount().toFixed(2));
        const currency = quote.getBasePrice().getCurrency();

        // Extraire les coûts de transport depuis les détails
        const details = quote.getDetails();
        let distanceCost = 0;
        let fuelCost = 0;
        let tollCost = 0;

        details.forEach(detail => {
            const label = detail.label.toLowerCase();
            if (label.includes('distance') && !label.includes('carburant') && !label.includes('péage')) {
                distanceCost += detail.amount;
            } else if (label.includes('carburant') || label.includes('fuel')) {
                fuelCost += detail.amount;
            } else if (label.includes('péage') || label.includes('toll')) {
                tollCost += detail.amount;
            }
        });

        // Extraire depuis le contexte si disponible
        const contextData = context.getAllData();
        if (contextData.fuelCost) fuelCost = contextData.fuelCost;
        if (contextData.tollCost) tollCost = contextData.tollCost;

        const travelCost = distanceCost + fuelCost + tollCost;

        const totalConstraints = this.getNumericValue(ruleExecutionResult?.totalConstraints);
        const totalAdditionalServices = this.getNumericValue(ruleExecutionResult?.totalAdditionalServices);
        const totalEquipment = ruleExecutionResult?.equipment?.reduce((sum: number, eq: any) => {
            const impact = this.getNumericValue(eq.impact);
            return sum + impact;
        }, 0) || 0;
        const totalReductions = this.getNumericValue(ruleExecutionResult?.totalReductions);

        return {
            base: basePrice,
            travelCost: parseFloat(travelCost.toFixed(2)),
            constraints: parseFloat(totalConstraints.toFixed(2)),
            additionalServices: parseFloat(totalAdditionalServices.toFixed(2)),
            equipment: parseFloat(totalEquipment.toFixed(2)),
            reductions: parseFloat(Math.abs(totalReductions).toFixed(2)),
            total: totalPrice,
            currency
        };
    }

    /**
     * Construit la section breakdown organisée par adresse
     */
    private buildBreakdown(
        quote: Quote,
        ruleExecutionResult: any,
        context: QuoteContext
    ): any {
        const details = quote.getDetails();
        const contextData = context.getAllData();

        // Extraire les coûts de base
        const baseBreakdown: any = {};
        let distanceCost = 0;
        let fuelCost = 0;
        let tollCost = 0;

        details.forEach(detail => {
            const label = detail.label.toLowerCase();
            if (label.includes('main') || label.includes('oeuvre')) {
                baseBreakdown.mainOeuvre = parseFloat(detail.amount.toFixed(2));
            } else if (label.includes('camion') || label.includes('truck')) {
                baseBreakdown.truckDay = parseFloat(detail.amount.toFixed(2));
            } else if (label.includes('distance') && !label.includes('carburant') && !label.includes('péage')) {
                distanceCost += detail.amount;
            } else if (label.includes('carburant') || label.includes('fuel')) {
                fuelCost += detail.amount;
            } else if (label.includes('péage') || label.includes('toll')) {
                tollCost += detail.amount;
            }
        });

        if (contextData.fuelCost) fuelCost = contextData.fuelCost;
        if (contextData.tollCost) tollCost = contextData.tollCost;

        // Construire breakdown par adresse depuis ruleExecutionResult
        const pickupCosts = ruleExecutionResult?.pickupCosts || { constraints: [], additionalServices: [], equipment: [] };
        const deliveryCosts = ruleExecutionResult?.deliveryCosts || { constraints: [], additionalServices: [], equipment: [] };

        const formatBreakdown = (rules: any[]) => {
            const breakdown: any = {};
            rules.forEach((rule: any) => {
                if (!rule.isConsumed) {
                    const key = this.createBreakdownKey(rule.name, 0);
                    const amount = parseFloat(this.getNumericValue(rule.impact).toFixed(2));
                    breakdown[key] = amount;
                }
            });
            return breakdown;
        };

        return {
            base: baseBreakdown,
            travelCost: {
                distance: parseFloat(distanceCost.toFixed(2)),
                fuel: parseFloat(fuelCost.toFixed(2)),
                tolls: parseFloat(tollCost.toFixed(2))
            },
            constraints: {
                pickup: formatBreakdown(pickupCosts.constraints || []),
                delivery: formatBreakdown(deliveryCosts.constraints || [])
            },
            additionalServices: {
                pickup: formatBreakdown(pickupCosts.additionalServices || []),
                delivery: formatBreakdown(deliveryCosts.additionalServices || [])
            },
            equipment: {
                pickup: formatBreakdown(pickupCosts.equipment || []),
                delivery: formatBreakdown(deliveryCosts.equipment || [])
            }
        };
    }

    /**
     * Construit appliedRules avec address et traceability
     */
    private async buildAppliedRules(ruleExecutionResult: any): Promise<any[]> {
        if (!ruleExecutionResult?.appliedRules) return [];

        const declaredSet = new Set(ruleExecutionResult.declaredConstraints || []);
        const inferredSet = new Set(ruleExecutionResult.inferredConstraints || []);

        return ruleExecutionResult.appliedRules.map((rule: any) => {
            const impact = this.getNumericValue(rule.impact);
            const ruleId = rule.id || '';
            
            // Déterminer la traceability
            let traceability: 'declared' | 'inferred' = 'declared';
            if (inferredSet.has(ruleId)) {
                traceability = 'inferred';
            } else if (!declaredSet.has(ruleId)) {
                // Si ni déclaré ni inféré, considérer comme déclaré par défaut
                traceability = 'declared';
            }

            return {
                id: ruleId,
                name: rule.name || rule.description || 'Règle inconnue',
                type: rule.isPercentage ? 'PERCENTAGE' : 'FIXED',
                percentage: rule.isPercentage ? rule.value : undefined,
                baseAmount: rule.isPercentage ? undefined : undefined, // Peut être enrichi si nécessaire
                impact: parseFloat(impact.toFixed(2)),
                address: rule.address || 'global',
                traceability
            };
        });
    }

    /**
     * Construit detailsByAddress avec traceability et equipment
     */
    private buildDetailsByAddress(ruleExecutionResult: any): any {
        if (!ruleExecutionResult) {
            return {
                pickup: { constraints: [], additionalServices: [], equipment: [] },
                delivery: { constraints: [], additionalServices: [], equipment: [] }
            };
        }

        const declaredSet = new Set(ruleExecutionResult.declaredConstraints || []);
        const inferredSet = new Set(ruleExecutionResult.inferredConstraints || []);

        const formatRuleWithTraceability = (rule: any) => {
            const impact = this.getNumericValue(rule.impact);
            const ruleId = rule.id || '';
            
            let traceability: 'declared' | 'inferred' = 'declared';
            if (inferredSet.has(ruleId)) {
                traceability = 'inferred';
            } else if (!declaredSet.has(ruleId)) {
                traceability = 'declared';
            }

            return {
                id: ruleId,
                name: rule.name || rule.description || 'Règle inconnue',
                amount: parseFloat(impact.toFixed(2)),
                traceability
            };
        };

        const pickupCosts = ruleExecutionResult.pickupCosts || { constraints: [], additionalServices: [], equipment: [] };
        const deliveryCosts = ruleExecutionResult.deliveryCosts || { constraints: [], additionalServices: [], equipment: [] };

        return {
            pickup: {
                constraints: pickupCosts.constraints
                    .filter((r: any) => !r.isConsumed)
                    .map(formatRuleWithTraceability),
                additionalServices: pickupCosts.additionalServices.map(formatRuleWithTraceability),
                equipment: pickupCosts.equipment.map(formatRuleWithTraceability)
            },
            delivery: {
                constraints: deliveryCosts.constraints
                    .filter((r: any) => !r.isConsumed)
                    .map(formatRuleWithTraceability),
                additionalServices: deliveryCosts.additionalServices.map(formatRuleWithTraceability),
                equipment: deliveryCosts.equipment.map(formatRuleWithTraceability)
            }
        };
    }

    /**
     * Construit consumedConstraints enrichi
     */
    private async buildConsumedConstraints(ruleExecutionResult: any): Promise<any[]> {
        if (!ruleExecutionResult?.consumedConstraints || ruleExecutionResult.consumedConstraints.length === 0) {
            return [];
        }

        const consumedIds = ruleExecutionResult.consumedConstraints || [];
        const consumedNames = await this.getConstraintNames(consumedIds);
        const declaredSet = new Set(ruleExecutionResult.declaredConstraints || []);
        const inferredSet = new Set(ruleExecutionResult.inferredConstraints || []);

        // Trouver quelle règle a consommé (généralement monte-meuble)
        const furnitureLiftRule = ruleExecutionResult.equipment?.find((r: any) => 
            r.name?.toLowerCase().includes('monte') || r.name?.toLowerCase().includes('meuble')
        );

        return consumedIds.map((id: string, index: number) => {
            const name = consumedNames[index] || id;
            const wasDeclared = declaredSet.has(id);
            const wasInferred = inferredSet.has(id);

            // Déterminer l'adresse (simplifié - peut être amélioré)
            let address: 'pickup' | 'delivery' | 'both' = 'both';
            const pickupHas = ruleExecutionResult.pickupCosts?.consumedConstraints?.includes(id);
            const deliveryHas = ruleExecutionResult.deliveryCosts?.consumedConstraints?.includes(id);
            if (pickupHas && !deliveryHas) address = 'pickup';
            if (deliveryHas && !pickupHas) address = 'delivery';

            return {
                id,
                name,
                consumedBy: furnitureLiftRule?.name || 'Monte-meuble',
                address,
                reason: wasInferred 
                    ? 'Résolu par monte-meuble (inféré automatiquement)'
                    : 'Résolu par monte-meuble (déclarée par le client)'
            };
        });
    }

    /**
     * Construit inferenceMetadata
     */
    private buildInferenceMetadata(ruleExecutionResult: any): any {
        if (!ruleExecutionResult?.inferenceMetadata) {
            return {};
        }

        const metadata = ruleExecutionResult.inferenceMetadata;
        const result: any = {};

        if (metadata.pickup) {
            result.pickup = {
                reason: metadata.pickup.reason || 'Inférence automatique activée',
                inferredAt: metadata.pickup.inferredAt 
                    ? (metadata.pickup.inferredAt instanceof Date 
                        ? metadata.pickup.inferredAt.toISOString() 
                        : metadata.pickup.inferredAt)
                    : new Date().toISOString(),
                allowInference: metadata.pickup.allowInference !== false
            };
        }

        if (metadata.delivery) {
            result.delivery = {
                reason: metadata.delivery.reason || 'Inférence automatique activée',
                inferredAt: metadata.delivery.inferredAt 
                    ? (metadata.delivery.inferredAt instanceof Date 
                        ? metadata.delivery.inferredAt.toISOString() 
                        : metadata.delivery.inferredAt)
                    : new Date().toISOString(),
                allowInference: metadata.delivery.allowInference !== false
            };
        }

        return result;
    }

    /**
     * Construit totals avec byAddress
     */
    private buildTotals(ruleExecutionResult: any, quote: Quote): any {
        if (!ruleExecutionResult) {
            return {
                byAddress: {
                    pickup: { constraints: 0, additionalServices: 0, equipment: 0, reductions: 0, subtotal: 0 },
                    delivery: { constraints: 0, additionalServices: 0, equipment: 0, reductions: 0, subtotal: 0 },
                    global: { base: 0, travelCost: 0, constraints: 0, reductions: 0, subtotal: 0 }
                },
                grandTotal: parseFloat(quote.getTotalPrice().getAmount().toFixed(2)),
                currency: quote.getBasePrice().getCurrency()
            };
        }


        const pickupCosts = ruleExecutionResult.pickupCosts || {};
        const deliveryCosts = ruleExecutionResult.deliveryCosts || {};
        const globalCosts = ruleExecutionResult.globalCosts || {};

        const pickupConstraints = this.getNumericValue(pickupCosts.totalSurcharges) - this.getNumericValue(pickupCosts.totalEquipment);
        const pickupAdditionalServices = (pickupCosts.additionalServices || []).reduce((sum: number, s: any) => 
            sum + this.getNumericValue(s.impact), 0);
        const pickupEquipment = this.getNumericValue(pickupCosts.totalEquipment);
        const pickupReductions = this.getNumericValue(pickupCosts.totalReductions);

        const deliveryConstraints = this.getNumericValue(deliveryCosts.totalSurcharges) - this.getNumericValue(deliveryCosts.totalEquipment);
        const deliveryAdditionalServices = (deliveryCosts.additionalServices || []).reduce((sum: number, s: any) => 
            sum + this.getNumericValue(s.impact), 0);
        const deliveryEquipment = this.getNumericValue(deliveryCosts.totalEquipment);
        const deliveryReductions = this.getNumericValue(deliveryCosts.totalReductions);

        // Calculer travelCost depuis les détails du quote
        const details = quote.getDetails();
        let distanceCost = 0;
        let fuelCost = 0;
        let tollCost = 0;
        details.forEach(detail => {
            const label = detail.label.toLowerCase();
            if (label.includes('distance') && !label.includes('carburant') && !label.includes('péage')) {
                distanceCost += detail.amount;
            } else if (label.includes('carburant') || label.includes('fuel')) {
                fuelCost += detail.amount;
            } else if (label.includes('péage') || label.includes('toll')) {
                tollCost += detail.amount;
            }
        });
        const travelCost = distanceCost + fuelCost + tollCost;

        const basePrice = this.getNumericValue(ruleExecutionResult.basePrice);
        const globalConstraints = this.getNumericValue(globalCosts.totalSurcharges);
        const globalReductions = this.getNumericValue(globalCosts.totalReductions);

        return {
            byAddress: {
                pickup: {
                    constraints: parseFloat(pickupConstraints.toFixed(2)),
                    additionalServices: parseFloat(pickupAdditionalServices.toFixed(2)),
                    equipment: parseFloat(pickupEquipment.toFixed(2)),
                    reductions: parseFloat(pickupReductions.toFixed(2)),
                    subtotal: parseFloat((pickupConstraints + pickupAdditionalServices + pickupEquipment - pickupReductions).toFixed(2))
                },
                delivery: {
                    constraints: parseFloat(deliveryConstraints.toFixed(2)),
                    additionalServices: parseFloat(deliveryAdditionalServices.toFixed(2)),
                    equipment: parseFloat(deliveryEquipment.toFixed(2)),
                    reductions: parseFloat(deliveryReductions.toFixed(2)),
                    subtotal: parseFloat((deliveryConstraints + deliveryAdditionalServices + deliveryEquipment - deliveryReductions).toFixed(2))
                },
                global: {
                    base: parseFloat(basePrice.toFixed(2)),
                    travelCost: parseFloat(travelCost.toFixed(2)),
                    constraints: parseFloat(globalConstraints.toFixed(2)),
                    reductions: parseFloat(globalReductions.toFixed(2)),
                    subtotal: parseFloat((basePrice + travelCost + globalConstraints - globalReductions).toFixed(2))
                }
            },
            grandTotal: parseFloat(quote.getTotalPrice().getAmount().toFixed(2)),
            currency: quote.getBasePrice().getCurrency()
        };
    }

    /**
     * Récupère les noms lisibles des contraintes depuis leurs UUID
     */
    private async getConstraintNames(uuids: string[] | undefined): Promise<string[]> {
        if (!uuids || uuids.length === 0) return [];

        try {
            const rules = await this.prisma.rules.findMany({
                where: { 
                    id: { in: uuids }, 
                    isActive: true 
                },
                select: { 
                    id: true,
                    name: true 
                }
            });

            // Créer un map UUID -> name pour préserver l'ordre et gérer les UUIDs non trouvés
            const nameMap = new Map(rules.map(r => [r.id, r.name]));
            
            // Retourner les noms dans l'ordre des UUIDs fournis, avec fallback vers UUID si non trouvé
            return uuids.map(uuid => nameMap.get(uuid) || uuid);
        } catch (error) {
            logger.error('📁 [PriceResponseBuilder.ts] Erreur récupération noms contraintes:', error);
            return uuids; // Fallback vers UUID si erreur
        }
    }

    /**
     * Utilitaires pour formater les données
     */
    private formatServiceType(serviceType: ServiceType): string {
        const mapping: Record<ServiceType, string> = {
            [ServiceType.MOVING]: 'DÉMÉNAGEMENT',
            [ServiceType.MOVING_PREMIUM]: 'DÉMÉNAGEMENT PREMIUM',
            [ServiceType.PACKING]: 'EMBALLAGE',
            [ServiceType.CLEANING]: 'NETTOYAGE',
            [ServiceType.CLEANING_PREMIUM]: 'NETTOYAGE PREMIUM',
            [ServiceType.DELIVERY]: 'LIVRAISON',
            [ServiceType.SERVICE]: 'SERVICE'
        };
        return mapping[serviceType] || serviceType;
    }

    private formatElevator(elevator: any): string | undefined {
        if (!elevator) return undefined;
        if (typeof elevator === 'boolean') return elevator ? 'yes' : 'no';
        if (typeof elevator === 'string') {
            const lower = elevator.toLowerCase();
            if (lower === 'true' || lower === 'yes' || lower === 'oui') return 'yes';
            if (lower === 'false' || lower === 'no' || lower === 'non') return 'no';
            return elevator;
        }
        return undefined;
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
}

