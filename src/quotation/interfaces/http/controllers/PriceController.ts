import { NextRequest, NextResponse } from 'next/server';
import { PriceService } from '../../../application/services/PriceService';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { devLog } from '@/lib/conditional-logger';
import { BaseApiController } from './BaseApiController';
import { prisma } from '@/lib/prisma';

/**
 * Contrôleur HTTP SIMPLIFIÉ pour l'API prix
 * OBJECTIF : Seulement le calcul de prix en temps réel
 */
export class PriceController extends BaseApiController {
    private readonly priceService: PriceService;

    constructor() {
        super();
        this.priceService = new PriceService();
    }

    /**
     * POST /api/price/calculate
     * Calcul de prix complet et précis avec toutes les règles
     */
    async calculatePrice(request: NextRequest): Promise<NextResponse> {
        logger.info('\n\n\n═══ DEBUT PriceController.calculatePrice ═══');
        logger.info('📁 [PriceController.ts] ▶️ Début calcul prix');
        const response = await this.handleRequest(request, async (data) => {
            // Résumé visuel une ligne
            logger.info(`\n🎯 CALCUL PRIX: ${data.serviceType} | ${data.volume || 'N/A'}m³, ${data.distance || 'N/A'}km, ${data.workers || 'N/A'} workers, ${data.duration || 'N/A'}h\n`);

            logger.info('📁 [PriceController.ts] 💰 POST /api/price/calculate - Calcul prix complet \n');

            // ✅ LOG DÉTAILLÉ (DEV UNIQUEMENT): FormData complet du frontend
            devLog.info('📥 ═══ DONNÉES REÇUES DU FRONTEND (formData) ═══');
            devLog.info(JSON.stringify(data, null, 2));
            devLog.info('📥 ═══ FIN DONNÉES REÇUES DU FRONTEND ═══\n');

            // Récupérer les noms lisibles des contraintes et services (au lieu des UUID)
            const pickupConstraintNames = await this.getConstraintNames(data.pickupLogisticsConstraints);
            const deliveryConstraintNames = await this.getConstraintNames(data.deliveryLogisticsConstraints);
            const serviceNames = await this.getServiceNames(data.additionalServices);
            const pickupServiceNames = await this.getServiceNames(
                data.pickupAdditionalServices || data.additionalServices
            );
            const deliveryServiceNames = await this.getServiceNames(
                data.deliveryAdditionalServices || data.additionalServices
            );

            // Affichage détaillé des données reçues
            logger.info('\n📁 [PriceController.ts] ═════════════════ DONNÉES REÇUES PAR LE CONTROLLER ═════════════════');
            logger.info(`📁 [PriceController.ts] 🎯 SERVICE: ${data.serviceType}`);

            logger.info('\n📁 [PriceController.ts] 📊 DONNÉES GÉNÉRALES:');
            logger.info(`   📏 Distance: ${data.distance || 'N/A'} km`);
            logger.info(`   📦 Volume: ${data.volume || 'N/A'} m³`);
            logger.info(`   👷 Déménageurs: ${data.workers || 'N/A'}`);
            logger.info(`   ⏱️  Durée estimée: ${data.duration || 'N/A'}h`);
            if (serviceNames.length > 0) {
                logger.info(`   🌐 Services globaux (${serviceNames.length}):`);
                serviceNames.forEach(name => logger.info(`      • ${name}`));
            }

            logger.info('\n📁 [PriceController.ts] 📍 ADRESSES ET DÉTAILS:');
            logger.info(`   📤 Adresse de Départ: ${data.pickupAddress || 'N/A'}`);
            logger.info(`      🏠 Étage: ${data.pickupFloor !== undefined ? data.pickupFloor : 'N/A'}`);
            logger.info(`      🚧 Contraintes (${pickupConstraintNames.length}):`);
            if (pickupConstraintNames.length > 0) {
                pickupConstraintNames.forEach(name => logger.info(`         • ${name}`));
            } else {
                logger.info('         Aucune');
            }
            logger.info(`      ➕ Services (${pickupServiceNames.length}):`);
            if (pickupServiceNames.length > 0) {
                pickupServiceNames.forEach(name => logger.info(`         • ${name}`));
            } else {
                logger.info('         Aucun');
            }

            logger.info(`\n   📥 Adresse d'Arrivée: ${data.deliveryAddress || 'N/A'}`);
            logger.info(`      🏠 Étage: ${data.deliveryFloor !== undefined ? data.deliveryFloor : 'N/A'}`);
            logger.info(`      🚧 Contraintes (${deliveryConstraintNames.length}):`);
            if (deliveryConstraintNames.length > 0) {
                deliveryConstraintNames.forEach(name => logger.info(`         • ${name}`));
            } else {
                logger.info('         Aucune');
            }
            logger.info(`      ➕ Services (${deliveryServiceNames.length}):`);
            if (deliveryServiceNames.length > 0) {
                deliveryServiceNames.forEach(name => logger.info(`         • ${name}`));
            } else {
                logger.info('         Aucun');
            }

            logger.info('📁 [PriceController.ts] ═══════════════════════════════════════\n');

            // Validation des données d'entrée
            if (!data || Object.keys(data).length === 0) {
                throw new ValidationError('Données de calcul requises');
            }

            // Vérifier le type de service
            if (!data.serviceType) {
                throw new ValidationError('Type de service requis');
            }

            // 🔧 NORMALISATION: Convertir les objets imbriqués en arrays d'UUIDs
            data.pickupLogisticsConstraints = this.normalizeIds(data.pickupLogisticsConstraints);
            data.deliveryLogisticsConstraints = this.normalizeIds(data.deliveryLogisticsConstraints);
            data.pickupServices = this.normalizeIds(data.pickupServices);
            data.deliveryServices = this.normalizeIds(data.deliveryServices);
            data.additionalServices = this.normalizeIds(data.additionalServices);

            // Calculer le prix via le service
            const result = await this.priceService.calculatePrice(data);

            // ✅ LOG DU RÉSULTAT JSON
            try {
                logger.info('\n' + '═'.repeat(60));
                logger.info('📦 RÉPONSE API - DONNÉES COMPLÈTES POUR LE FRONTEND');
                logger.info('═'.repeat(60));
                // ✅ NOUVELLE STRUCTURE: Utiliser summary au lieu de basePrice/totalPrice
                const basePrice = result.summary?.base || result.basePrice || 0;
                const totalPrice = result.summary?.total || result.totalPrice || 0;
                const calculationId = result.context?.calculationId || result.calculationId || 'N/A';
                const appliedRulesCount = result.appliedRules?.length || 0;
                
                logger.info(`💰 Prix: ${basePrice.toFixed(2)}€ → ${totalPrice.toFixed(2)}€`);
                logger.info(`📋 Règles appliquées: ${appliedRulesCount}`);
                logger.info(`🆔 Calculation ID: ${calculationId}`);
                logger.info('─'.repeat(60));
                devLog.info(JSON.stringify(result, null, 2));
                logger.info('═'.repeat(60) + '\n');
            } catch (error) {
                logger.error('❌ Erreur lors du log de la réponse:', error);
            }

            // ✅ CORRECTION: Retourner directement le résultat (handleRequest va wrapper dans { success: true, data: result })
            return result;
        });
        logger.info('📁 [PriceController.ts] ⏹ Fin PriceController.calculatePrice');
        logger.info('═══⏹ FIN PriceController.calculatePrice ═══\n\n\n');
        return response;
    }

    /**
     * Récupérer les noms lisibles des contraintes depuis leurs UUID
     */
    private async getConstraintNames(uuids: string[] | undefined): Promise<string[]> {
        const ids = this.normalizeIds(uuids as any);
        if (ids.length === 0) return [];

        try {
            const rules = await prisma.rules.findMany({
                where: { id: { in: ids }, isActive: true },
                select: { name: true }
            });

            return rules.map(r => r.name);
        } catch (error) {
            logger.error('Erreur récupération noms contraintes:', error);
            return ids; // Fallback vers UUID si erreur
        }
    }

    /**
     * Récupérer les noms lisibles des services depuis leurs UUID
     */
    private async getServiceNames(uuids: string[] | undefined): Promise<string[]> {
        const ids = this.normalizeIds(uuids as any);
        if (ids.length === 0) return [];

        try {
            const rules = await prisma.rules.findMany({
                where: { id: { in: ids }, isActive: true },
                select: { name: true }
            });

            return rules.map(r => r.name);
        } catch (error) {
            logger.error('Erreur récupération noms services:', error);
            return ids; // Fallback vers UUID si erreur
        }
    }

    /**
     * Normalise différents formats d'IDs en un tableau de chaînes:
     * - string[] -> identique
     * - Record<string, boolean> -> clés avec valeur truthy
     * - { groupA: Record<string, boolean>, groupB: Record<string, boolean>, ... } -> concat de toutes les clés truthy
     */
    private normalizeIds(input: unknown): string[] {
        if (!input) return [];
        if (Array.isArray(input)) {
            return input.filter((v): v is string => typeof v === 'string' && v.length > 0);
        }

        if (typeof input === 'object') {
            const obj = input as Record<string, any>;

            // Cas d'un dictionnaire simple UUID -> boolean
            const directKeys = Object.keys(obj).filter(k => typeof obj[k] === 'boolean' && !!obj[k]);

            // Cas d'objets imbriqués (ex: addressConstraints, addressServices, globalServices)
            const nestedKeys = Object.keys(obj)
                .filter(k => obj[k] && typeof obj[k] === 'object')
                .flatMap(k => {
                    const child = obj[k] as Record<string, any>;
                    return Object.keys(child).filter(id => !!child[id]);
                });

            const all = [...directKeys, ...nestedKeys];
            // Nettoyage doublons et valeurs vides
            return Array.from(new Set(all.filter(id => typeof id === 'string' && id.length > 0)));
        }

        return [];
    }
}
