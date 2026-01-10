import { QuoteCalculator } from './QuoteCalculator';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { Quote } from '../../domain/valueObjects/Quote';
import { ServiceType } from '../../domain/enums/ServiceType';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { devLog } from '@/lib/conditional-logger';
import { PrismaClient } from '@prisma/client';
import { PriceResponseBuilder } from './PriceResponseBuilder';

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
    private readonly responseBuilder: PriceResponseBuilder;

    constructor(
        private readonly quoteCalculator: QuoteCalculator = QuoteCalculator.getInstance()
    ) {
        this.prisma = new PrismaClient();
        this.responseBuilder = new PriceResponseBuilder();
    }

    /**
     * POST /api/price/calculate
     * Calcul de prix complet et précis avec toutes les règles
     */
    async calculatePrice(request: PriceCalculationRequest): Promise<any> {

        try {
            // Validation des données d'entrée
            this.validateCalculationRequest(request);

            // Créer le contexte de calcul
            const context = await this.createQuoteContext(request);

            // Calculer le prix avec le QuoteCalculator
            const quote = await this.quoteCalculator.calculateQuote(request.serviceType, context);

            // ✅ NOUVEAU: Récupérer le RuleExecutionResult depuis le contexte pour traçabilité
            const ruleExecutionResult = context.getValue('__ruleExecutionResult') as any;

            // Générer un ID de calcul unique
            const calculationId = this.generateCalculationId();

            // ✅ NOUVELLE STRUCTURE: Construire la réponse complète et organisée via PriceResponseBuilder
            const response = await this.responseBuilder.buildResponse(
                request,
                quote,
                ruleExecutionResult,
                context,
                calculationId
            );

            logger.info(`📁 [PriceService.ts] ✅ Prix calculé avec succès - ID: ${calculationId}, Total: ${response.summary.total}€`);

            return response;

        } catch (error) {
            logger.error(`📁 [PriceService.ts] ❌ Erreur lors du calcul de prix: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }




    // === MÉTHODES PRIVÉES ===

    private validateCalculationRequest(request: PriceCalculationRequest): void {
        // 🔒 SÉCURITÉ: Sanitization des données numériques (conversion string → number si nécessaire)
        this.sanitizeNumericFields(request);

        // 🔒 SÉCURITÉ: Validation stricte du type de service
        if (!request.serviceType) {
            throw new ValidationError('Type de service requis');
        }

        if (!Object.values(ServiceType).includes(request.serviceType)) {
            throw new ValidationError('Type de service invalide');
        }

        // 🔒 SÉCURITÉ: Validation stricte des paramètres numériques pour éviter manipulation
        if (request.volume !== undefined) {
            if (typeof request.volume !== 'number' || request.volume < 0 || request.volume > 150) {
                throw new ValidationError(`Volume invalide: doit être entre 0 et 150 m³ (reçu: ${request.volume})`);
            }
        }

        if (request.distance !== undefined) {
            if (typeof request.distance !== 'number' || request.distance < 0 || request.distance > 1000) {
                throw new ValidationError(`Distance invalide: doit être entre 0 et 1000 km (reçu: ${request.distance})`);
            }
        }

        if (request.workers !== undefined) {
            if (typeof request.workers !== 'number' || !Number.isInteger(request.workers) || request.workers < 1 || request.workers > 10) {
                throw new ValidationError(`Nombre de déménageurs invalide: doit être entre 1 et 10 (reçu: ${request.workers})`);
            }
        }

        if (request.duration !== undefined) {
            if (typeof request.duration !== 'number' || request.duration < 0 || request.duration > 48) {
                throw new ValidationError(`Durée invalide: doit être entre 0 et 48 heures (reçu: ${request.duration})`);
            }
        }

        if (request.pickupFloor !== undefined) {
            if (typeof request.pickupFloor !== 'number' || !Number.isInteger(request.pickupFloor) || request.pickupFloor < 0 || request.pickupFloor > 100) {
                throw new ValidationError(`Étage de départ invalide: doit être entre 0 et 100 (reçu: ${request.pickupFloor})`);
            }
        }

        if (request.deliveryFloor !== undefined) {
            if (typeof request.deliveryFloor !== 'number' || !Number.isInteger(request.deliveryFloor) || request.deliveryFloor < 0 || request.deliveryFloor > 100) {
                throw new ValidationError(`Étage d'arrivée invalide: doit être entre 0 et 100 (reçu: ${request.deliveryFloor})`);
            }
        }

        if (request.defaultPrice !== undefined) {
            if (typeof request.defaultPrice !== 'number' || request.defaultPrice < 0 || request.defaultPrice > 100000) {
                throw new ValidationError(`Prix par défaut invalide: doit être entre 0 et 100000€ (reçu: ${request.defaultPrice})`);
            }
        }

        if (request.basePrice !== undefined) {
            if (typeof request.basePrice !== 'number' || request.basePrice < 0 || request.basePrice > 100000) {
                throw new ValidationError(`Prix de base invalide: doit être entre 0 et 100000€ (reçu: ${request.basePrice})`);
            }
        }

        // 🔒 SÉCURITÉ: Valider les UUIDs de contraintes et services (optionnel mais recommandé)
        this.validateConstraintIds(request.pickupLogisticsConstraints, 'pickupLogisticsConstraints');
        this.validateConstraintIds(request.deliveryLogisticsConstraints, 'deliveryLogisticsConstraints');
        this.validateServiceIds(request.pickupServices, 'pickupServices');
        this.validateServiceIds(request.deliveryServices, 'deliveryServices');
        this.validateServiceIds(request.additionalServices, 'additionalServices');
    }

    /**
     * 🔒 SÉCURITÉ: Sanitize les champs numériques qui peuvent arriver en string depuis le formulaire
     * Les formulaires HTML envoient souvent des strings qu'il faut convertir en numbers
     */
    private sanitizeNumericFields(request: PriceCalculationRequest): void {
        const numericFields = [
            'volume', 'distance', 'workers', 'duration',
            'pickupFloor', 'deliveryFloor',
            'pickupCarryDistance', 'deliveryCarryDistance',
            'defaultPrice', 'basePrice', 'baseWorkers', 'baseDuration'
        ];

        numericFields.forEach(field => {
            const value = (request as any)[field];

            if (value !== undefined && value !== null && value !== '') {
                // Si c'est une string, tenter la conversion
                if (typeof value === 'string') {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                        (request as any)[field] = parsed;
                    }
                }
            }
        });

        // Cas spécial pour les booléens qui peuvent arriver en string
        const booleanFields = ['pickupElevator', 'deliveryElevator', 'pickupNeedsLift', 'deliveryNeedsLift'];

        booleanFields.forEach(field => {
            const value = (request as any)[field];

            if (value !== undefined && value !== null && typeof value === 'string') {
                // Convertir "true"/"false" string en boolean
                if (value === 'true') (request as any)[field] = true;
                else if (value === 'false') (request as any)[field] = false;
                else if (value === 'yes') (request as any)[field] = true;
                else if (value === 'no') (request as any)[field] = false;
            }
        });
    }

    /**
     * 🔒 SÉCURITÉ: Valider le format et l'existence des UUIDs de contraintes
     *
     * Supporte deux formats de contraintes:
     * 1. Format plat: {uuid: true, uuid2: true}
     * 2. Format groupé: {addressConstraints: {uuid: true}, addressServices: {uuid2: true}}
     */
    private validateConstraintIds(constraints: string[] | Record<string, boolean | Record<string, boolean>> | undefined, fieldName: string): void {
        if (!constraints) return;

        let ids: string[] = [];

        if (Array.isArray(constraints)) {
            ids = constraints;
        } else if (typeof constraints === 'object') {
            // 🔧 CORRECTION: Gérer le format groupé (addressConstraints, addressServices, globalServices)
            const constraintsObj = constraints as Record<string, boolean | Record<string, boolean>>;

            // Détecter si c'est un format groupé en cherchant les clés spéciales
            const hasGroupedFormat = 'addressConstraints' in constraintsObj ||
                                    'addressServices' in constraintsObj ||
                                    'globalServices' in constraintsObj;

            if (hasGroupedFormat) {
                // Format groupé: extraire les UUIDs de chaque catégorie
                ['addressConstraints', 'addressServices', 'globalServices'].forEach(category => {
                    const categoryData = constraintsObj[category];
                    if (categoryData && typeof categoryData === 'object' && !Array.isArray(categoryData)) {
                        const categoryIds = Object.keys(categoryData).filter(k => (categoryData as Record<string, boolean>)[k]);
                        ids.push(...categoryIds);
                    }
                });
            } else {
                // Format plat: extraire directement les clés avec valeur true
                ids = Object.keys(constraintsObj).filter(k => constraintsObj[k] === true);
            }
        }

        // Vérifier le format UUID (basique)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const id of ids) {
            if (!uuidRegex.test(id)) {
                throw new ValidationError(`${fieldName}: ID de contrainte invalide (${id})`);
            }
        }

        // Limite du nombre de contraintes pour éviter abus
        if (ids.length > 50) {
            throw new ValidationError(`${fieldName}: Trop de contraintes (max: 50, reçu: ${ids.length})`);
        }
    }

    /**
     * 🔒 SÉCURITÉ: Valider le format et l'existence des UUIDs de services
     */
    private validateServiceIds(services: string[] | Record<string, boolean> | undefined, fieldName: string): void {
        if (!services) return;

        let ids: string[] = [];

        if (Array.isArray(services)) {
            ids = services;
        } else if (typeof services === 'object') {
            ids = Object.keys(services).filter(k => services[k]);
        }

        // Vérifier le format UUID (basique)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const id of ids) {
            if (!uuidRegex.test(id)) {
                throw new ValidationError(`${fieldName}: ID de service invalide (${id})`);
            }
        }

        // Limite du nombre de services pour éviter abus
        if (ids.length > 50) {
            throw new ValidationError(`${fieldName}: Trop de services (max: 50, reçu: ${ids.length})`);
        }
    }

    private async createQuoteContext(request: PriceCalculationRequest): Promise<QuoteContext> {
        // ✅ SUPPORT STRUCTURE GROUPÉE: Détecter et extraire depuis la structure groupée
        if ((request as any).pickup || (request as any).delivery || (request as any).globalServices) {

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
        // Le formulaire peut envoyer plusieurs formats:
        // 1. Objet simple: {uuid: true}
        // 2. Objet imbriqué: {addressConstraints: {uuid: true}, addressServices: {uuid: true}}
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
        }
        if (request.deliveryServices !== undefined) {
            const deliverySvcs = await this.normalizeServicesAsync(request.deliveryServices, request.serviceType);
            context.setValue('deliveryServices', deliverySvcs);
        }

        // ✅ NOUVEAU: Services supplémentaires globaux (piano, stockage, etc.)
        if (request.additionalServices !== undefined) {
            const services = await this.normalizeServicesAsync(request.additionalServices, request.serviceType);
            context.setValue('additionalServices', services);
        }

        // ✅ CORRECTION: Ajouter aussi les autres champs du formulaire qui peuvent être présents
        // Adresses (nécessaires pour certaines règles géographiques)
        if (request.pickupAddress !== undefined) context.setValue('pickupAddress', request.pickupAddress);
        if (request.deliveryAddress !== undefined) context.setValue('deliveryAddress', request.deliveryAddress);

        return context;
    }

    private convertDetailsToBreakdown(details: { label: string; amount: number }[]): Record<string, number> {
        const breakdown: Record<string, number> = {};

        // Convertir les détails en breakdown avec des clés simplifiées
        details.forEach((detail, index) => {
            const key = this.createBreakdownKey(detail.label, index);
            breakdown[key] = parseFloat(detail.amount.toFixed(2));
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
                impact: parseFloat(impact.toFixed(2)), // Arrondir à 2 décimales
                type: type
            };
        });
    }

    private generateCalculationId(): string {
        return `calc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }



    /**
     * ✅ NOUVELLE VERSION ASYNCHRONE: Normalise les contraintes logistiques ET mappe les UUIDs
     * Le formulaire peut envoyer plusieurs formats:
     * 1. Un tableau: ['uuid1', 'uuid2'] ✅ Format attendu
     * 2. Un objet simple: {uuid1: true, uuid2: true} ✅ Format PLATE
     * 3. Un objet imbriqué: {addressConstraints: {uuid1: true}, addressServices: {uuid2: true}} ✅ Format MODAL
     *
     * Cette méthode:
     * 1. Détecte le format reçu
     * 2. Extrait tous les UUIDs (contraintes + services d'adresse)
     * 3. Retourne la liste complète des UUIDs
     */
    private async normalizeConstraintsAsync(constraints: any, serviceType: ServiceType): Promise<string[]> {
        // Cas 1: Déjà un tableau (format attendu)
        if (Array.isArray(constraints)) {
            return constraints;
        }

        // Cas 2: Objet simple {uuid: true}
        if (typeof constraints === 'object' && constraints !== null) {
            // ✅ DÉTECTION FORMAT IMBRIQUÉ: {addressConstraints: {...}, addressServices: {...}, globalServices: {...}}
            if ('addressConstraints' in constraints || 'addressServices' in constraints || 'globalServices' in constraints) {
                const allIds: string[] = [];

                // Extraire addressConstraints
                if (constraints.addressConstraints && typeof constraints.addressConstraints === 'object') {
                    const constraintIds = Object.keys(constraints.addressConstraints).filter(key => constraints.addressConstraints[key] === true);
                    allIds.push(...constraintIds);
                }

                // Extraire addressServices (services liés à l'adresse, ex: monte-meuble, emballage)
                if (constraints.addressServices && typeof constraints.addressServices === 'object') {
                    const serviceIds = Object.keys(constraints.addressServices).filter(key => constraints.addressServices[key] === true);
                    allIds.push(...serviceIds);
                }

                // Note: globalServices ne sont pas inclus ici (gérés séparément via additionalServices)

                return allIds;
            }

            // Cas 3: Objet simple {uuid: true, uuid2: true}
            return Object.keys(constraints).filter(key => constraints[key] === true);
        }

        // Format invalide
        return [];
    }

    /**
     * ✅ NORMALISATION DES SERVICES SUPPLÉMENTAIRES
     * Même logique que normalizeConstraintsAsync, mais pour les services (piano, fragile, etc.)
     * Les services peuvent être:
     * 1. Un tableau: ['uuid1', 'uuid2']
     * 2. Un objet simple: {uuid1: true, uuid2: true}
     * 3. Un objet imbriqué: {globalServices: {uuid1: true}}
     */
    private async normalizeServicesAsync(services: any, serviceType: ServiceType): Promise<string[]> {
        // Cas 1: Déjà un tableau
        if (Array.isArray(services)) {
            return services;
        }

        // Cas 2: Objet
        if (typeof services === 'object' && services !== null) {
            // ✅ DÉTECTION FORMAT IMBRIQUÉ: {globalServices: {...}}
            if ('globalServices' in services && typeof services.globalServices === 'object') {
                return Object.keys(services.globalServices).filter(key => services.globalServices[key] === true);
            }

            // Cas 3: Objet simple {uuid: true}
            return Object.keys(services).filter(key => services[key] === true);
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