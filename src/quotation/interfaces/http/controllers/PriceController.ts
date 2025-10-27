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

            if (data.pickupLogisticsConstraints && data.pickupLogisticsConstraints.length > 0) {
                logger.info(`   🚧 Contraintes départ (${data.pickupLogisticsConstraints.length}): ${data.pickupLogisticsConstraints.join(', ')}`);
            }
            if (data.deliveryLogisticsConstraints && data.deliveryLogisticsConstraints.length > 0) {
                logger.info(`   🚧 Contraintes arrivée (${data.deliveryLogisticsConstraints.length}): ${data.deliveryLogisticsConstraints.join(', ')}`);
            }

            if (data.additionalServices && data.additionalServices.length > 0) {
                logger.info(`   ➕ Services additionnels (${data.additionalServices.length}): ${data.additionalServices.join(', ')}`);
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





} 