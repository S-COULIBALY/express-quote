import { NextRequest, NextResponse } from 'next/server';
import { PriceService } from '../../../application/services/PriceService';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { devLog } from '@/lib/conditional-logger';
import { BaseApiController } from './BaseApiController';

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
        return this.handleRequest(request, async (data) => {
            logger.info('💰 POST /api/price/calculate - Calcul prix complet');

            // ✅ LOG DÉTAILLÉ: FormData complet du frontend
            logger.info('📥 ═══ DONNÉES FRONTEND (formData) ═══');
            logger.info(`🎯 Service: ${data.serviceType}`);
            logger.info(`📍 Adresses:`);
            logger.info(`   🏠 Départ: ${data.pickupAddress || 'Non spécifié'}`);
            logger.info(`   📦 Arrivée: ${data.deliveryAddress || 'Non spécifié'}`);

            // Récupérer les noms lisibles des contraintes et services (au lieu des UUID)
            const pickupConstraintNames = await this.getConstraintNames(data.pickupLogisticsConstraints);
            const deliveryConstraintNames = await this.getConstraintNames(data.deliveryLogisticsConstraints);
            const serviceNames = await this.getServiceNames(data.additionalServices);

            if (pickupConstraintNames.length > 0) {
                logger.info(`   🚧 Contraintes logistiques DÉPART (${pickupConstraintNames.length}):`);
                pickupConstraintNames.forEach(name => logger.info(`      • ${name}`));
            } else {
                logger.info(`   🚧 Contraintes logistiques DÉPART: Aucune`);
            }

            if (deliveryConstraintNames.length > 0) {
                logger.info(`   🚧 Contraintes logistiques ARRIVÉE (${deliveryConstraintNames.length}):`);
                deliveryConstraintNames.forEach(name => logger.info(`      • ${name}`));
            } else {
                logger.info(`   🚧 Contraintes logistiques ARRIVÉE: Aucune`);
            }

            if (serviceNames.length > 0) {
                logger.info(`   ➕ Services additionnels (${serviceNames.length}):`);
                serviceNames.forEach(name => logger.info(`      • ${name}`));
            }

            logger.info(`📊 Paramètres calcul:`);
            logger.info(`   📦 Volume: ${data.volume || 'N/A'} m³`);
            logger.info(`   👷 Déménageurs: ${data.workers || 'N/A'}`);
            logger.info(`   ⏱️ Durée estimée: ${data.duration || 'N/A'} h`);
            logger.info(`   📏 Distance: ${data.distance || 'N/A'} km`);
            logger.info('═══════════════════════════════════════════════\n');

            // Validation des données d'entrée
            if (!data || Object.keys(data).length === 0) {
                throw new ValidationError('Données de calcul requises');
            }

            // Vérifier le type de service
            if (!data.serviceType) {
                throw new ValidationError('Type de service requis');
            }

            // Calculer le prix via le service
            const result = await this.priceService.calculatePrice(data);

            // ✅ CORRECTION: Retourner directement le résultat (handleRequest va wrapper dans { success: true, data: result })
            return result;
        });
    }

    /**
     * Récupérer les noms lisibles des contraintes depuis leurs UUID
     */
    private async getConstraintNames(uuids: string[] | undefined): Promise<string[]> {
        if (!uuids || uuids.length === 0) return [];

        try {
            const prisma = await import('@/lib/prisma').then(m => m.default);

            const rules = await prisma.rule.findMany({
                where: { id: { in: uuids }, isActive: true },
                select: { name: true }
            });

            return rules.map(r => r.name);
        } catch (error) {
            logger.error('Erreur récupération noms contraintes:', error);
            return uuids; // Fallback vers UUID si erreur
        }
    }

    /**
     * Récupérer les noms lisibles des services depuis leurs UUID
     */
    private async getServiceNames(uuids: string[] | undefined): Promise<string[]> {
        if (!uuids || uuids.length === 0) return [];

        try {
            const prisma = await import('@/lib/prisma').then(m => m.default);

            const rules = await prisma.rule.findMany({
                where: { id: { in: uuids }, isActive: true },
                select: { name: true }
            });

            return rules.map(r => r.name);
        } catch (error) {
            logger.error('Erreur récupération noms services:', error);
            return uuids; // Fallback vers UUID si erreur
        }
    }
} 