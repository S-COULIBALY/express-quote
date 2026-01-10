import { HttpRequest, HttpResponse } from '../types';
import { QuoteRequestService } from '../../../application/services/QuoteRequestService';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { priceSignatureService } from '../../../application/services/PriceSignatureService';
import { PriceService } from '../../../application/services/PriceService';

/**
 * Contrôleur HTTP pour la gestion des demandes de devis
 * Endpoints REST pour le cycle de vie complet des QuoteRequest
 */
export class QuoteRequestController {
    private readonly priceService: PriceService;

    constructor(
        private readonly quoteRequestService: QuoteRequestService
    ) {
        this.priceService = new PriceService();
    }

    /**
     * POST /api/quotesRequest/
     * Crée une nouvelle demande de devis
     */
    async createQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        logger.info('\n\n\n═══ DEBUT QuoteRequestController.createQuoteRequest ═══');
        logger.info('📁 [QuoteRequestController.ts] ▶️ Début création demande de devis');

        try {
            // Valider les données d'entrée
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    error: 'Les données de la demande de devis sont requises'
                });
            }

            // ✅ LOG DÉTAILLÉ: Données reçues du frontend (soumission)
            const quoteData = req.body.quoteData || {};
            const clientCalculatedPrice = quoteData.calculatedPrice || quoteData.totalPrice || 0;

            logger.info('📁 [QuoteRequestController.ts] 📥 Données reçues du frontend:', {
                'req.body.serviceType': req.body.serviceType,
                'quoteData.serviceType': quoteData.serviceType,
                clientCalculatedPrice,
                hasPickupAddress: !!quoteData.pickupAddress,
                hasDeliveryAddress: !!quoteData.deliveryAddress,
                constraintsCount: (quoteData.pickupLogisticsConstraints?.addressConstraints ? Object.keys(quoteData.pickupLogisticsConstraints.addressConstraints).length : 0) +
                                  (quoteData.deliveryLogisticsConstraints?.addressConstraints ? Object.keys(quoteData.deliveryLogisticsConstraints.addressConstraints).length : 0),
                'quoteData.pickupLogisticsConstraints.globalServices': quoteData.pickupLogisticsConstraints?.globalServices,
                'quoteData.deliveryLogisticsConstraints.globalServices': quoteData.deliveryLogisticsConstraints?.globalServices
            });

            // 🔒 SÉCURITÉ: Recalculer le prix côté serveur pour validation
            logger.info('🔒 Recalcul et signature du prix côté serveur');

            // Le serviceType peut être dans req.body OU dans quoteData - on prend le premier disponible
            const serviceType = req.body.serviceType || quoteData.serviceType;
            if (!serviceType) {
                throw new ValidationError('ServiceType manquant dans la requête');
            }

            // 🔧 EXTRACTION DES GLOBAL SERVICES: Fusionner les globalServices de pickup et delivery
            let additionalServices: Record<string, boolean> = {};

            if (quoteData.pickupLogisticsConstraints?.globalServices) {
                additionalServices = { ...additionalServices, ...quoteData.pickupLogisticsConstraints.globalServices };
            }

            if (quoteData.deliveryLogisticsConstraints?.globalServices) {
                additionalServices = { ...additionalServices, ...quoteData.deliveryLogisticsConstraints.globalServices };
            }

            logger.info('🔧 [QuoteRequestController.ts] Services globaux extraits:', {
                pickupGlobalServices: quoteData.pickupLogisticsConstraints?.globalServices,
                deliveryGlobalServices: quoteData.deliveryLogisticsConstraints?.globalServices,
                mergedAdditionalServices: additionalServices,
                count: Object.keys(additionalServices).length
            });

            // Créer un objet avec toutes les données nécessaires pour le calcul
            const priceCalculationRequest = {
                ...quoteData,
                serviceType,
                // ✅ CORRECTION CRITIQUE: Ajouter les globalServices extraits comme additionalServices
                additionalServices: Object.keys(additionalServices).length > 0 ? additionalServices : undefined
            };

            const serverPrice = await this.priceService.calculatePrice(priceCalculationRequest);

            // Comparer prix client vs serveur
            const priceDifference = Math.abs(clientCalculatedPrice - serverPrice.summary.total);
            if (priceDifference > 0.01) {
                logger.warn('⚠️ Prix client différent du prix serveur lors de la soumission', {
                    clientPrice: clientCalculatedPrice,
                    serverPrice: serverPrice.summary.total,
                    difference: priceDifference.toFixed(2),
                    differencePercent: ((priceDifference / serverPrice.summary.total) * 100).toFixed(2) + '%'
                });
            }

            // Générer la signature cryptographique
            const securedPrice = priceSignatureService.createSecuredPrice(
                {
                    total: serverPrice.summary.total,
                    base: serverPrice.summary.base,
                    calculationId: serverPrice.context.calculationId
                },
                priceCalculationRequest  // Utiliser l'objet complet avec serviceType
            );

            // Stocker le prix sécurisé dans quoteData
            req.body.quoteData.securedPrice = securedPrice;
            // Garder aussi l'ancien champ pour compatibilité
            req.body.quoteData.calculatedPrice = serverPrice.summary.total;
            req.body.quoteData.totalPrice = serverPrice.summary.total;

            logger.info('✅ Prix calculé et signé:', {
                totalPrice: securedPrice.totalPrice,
                basePrice: securedPrice.basePrice,
                calculationId: securedPrice.calculationId,
                signature: securedPrice.signature.substring(0, 16) + '...',
                constraintsCount: securedPrice.dataFingerprint.constraintsCount,
                servicesCount: securedPrice.dataFingerprint.servicesCount
            });

            // Créer la demande via le service
            const quoteRequest = await this.quoteRequestService.createQuoteRequest(req.body);

            // Réponse avec les informations essentielles
            const response = {
                success: true,
                message: 'Demande de devis créée avec succès',
                data: {
                    id: quoteRequest.getId(),
                    temporaryId: quoteRequest.getTemporaryId(),
                    type: quoteRequest.getType(),
                    status: quoteRequest.getStatus(),
                    expiresAt: quoteRequest.getExpiresAt(),
                    createdAt: quoteRequest.getCreatedAt()
                }
            };

            logger.info(`📁 [QuoteRequestController.ts] ✅ Demande de devis créée: ${quoteRequest.getTemporaryId()}`);
            logger.info('📁 [QuoteRequestController.ts] ⏹ Fin QuoteRequestController.createQuoteRequest');
            logger.info('═══⏹ FIN QuoteRequestController.createQuoteRequest ═══\n\n\n');
            return res.status(201).json(response);

        } catch (error) {
            logger.error('📁 [QuoteRequestController.ts] ❌ Erreur création demande de devis:', error);
            
            if (error instanceof ValidationError) {
                logger.info('📁 [QuoteRequestController.ts] ⏹ Fin QuoteRequestController.createQuoteRequest (validation échouée)');
                logger.info('═══⏹ FIN QuoteRequestController.createQuoteRequest ═══\n\n\n');
                return res.status(400).json({
                    error: 'Données invalides',
                    message: error.message
                });
            }

            logger.info('📁 [QuoteRequestController.ts] ⏹ Fin QuoteRequestController.createQuoteRequest (erreur)');
            logger.info('═══⏹ FIN QuoteRequestController.createQuoteRequest ═══\n\n\n');
            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }

    /**
     * GET /api/quotesRequest/[temporaryId]
     * Récupère une demande de devis par son ID temporaire
     */
    async getQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const temporaryId = req.params.temporaryId;
        logger.info(`🔍 GET /api/quotesRequest/${temporaryId} - Récupération demande`);

        try {
            // Valider le paramètre
            if (!temporaryId) {
                return res.status(400).json({
                    error: 'ID temporaire requis'
                });
            }

            // Récupérer la demande via le service
            const quoteRequest = await this.quoteRequestService.getQuoteRequestByTemporaryId(temporaryId);

            if (!quoteRequest) {
                return res.status(404).json({
                    error: 'Demande de devis non trouvée',
                    message: 'La demande de devis n\'existe pas ou a expiré'
                });
            }

            // 🔒 SÉCURITÉ: Utiliser le prix signé stocké (PAS de recalcul)
            let calculatedPrice = null;
            const quoteData = quoteRequest.getQuoteData();

            if (quoteData.securedPrice) {
                // Vérifier la signature (détection de manipulation)
                const verification = priceSignatureService.verifySignature(
                    quoteData.securedPrice,
                    quoteData
                );

                if (verification.valid) {
                    // ✅ Signature valide - Utiliser le prix sécurisé
                    calculatedPrice = {
                        basePrice: quoteData.securedPrice.basePrice,
                        totalPrice: quoteData.securedPrice.totalPrice,
                        currency: quoteData.securedPrice.currency,
                        calculationId: quoteData.securedPrice.calculationId,
                        calculatedAt: quoteData.securedPrice.calculatedAt
                    };

                    logger.info(`✅ [QuoteRequestController] Prix signé valide - Pas de recalcul nécessaire`, {
                        temporaryId,
                        totalPrice: calculatedPrice.totalPrice,
                        basePrice: calculatedPrice.basePrice,
                        calculationId: calculatedPrice.calculationId,
                        signatureAge: verification.details?.ageHours?.toFixed(2) + 'h'
                    });
                } else {
                    // ⚠️ Signature invalide - Recalcul de sécurité
                    logger.warn(`⚠️ [QuoteRequestController] Signature invalide - Recalcul de sécurité`, {
                        temporaryId,
                        reason: verification.reason
                    });

                    try {
                        const quote = await this.quoteRequestService.calculateQuotePrice(temporaryId);
                        calculatedPrice = {
                            basePrice: quote.getBasePrice().getAmount(),
                            totalPrice: quote.getTotalPrice().getAmount(),
                            currency: quote.getBasePrice().getCurrency()
                        };
                    } catch (error) {
                        logger.error('❌ Impossible de recalculer le prix', { temporaryId, error: error.message });
                    }
                }
            } else {
                // Fallback: ancien système (pas de signature)
                logger.warn(`⚠️ [QuoteRequestController] Pas de signature - Utilisation prix stocké`, { temporaryId });
                calculatedPrice = {
                    basePrice: quoteData.basePrice || 0,
                    totalPrice: quoteData.calculatedPrice || quoteData.totalPrice || 0,
                    currency: 'EUR'
                };
            }

            // Récupérer les informations du catalogue si disponibles
            let catalogSelection = null;
            if (quoteData.catalogId || quoteData.catalogSelectionId) {
                try {
                    // Utiliser l'ID du catalogue depuis les données du devis
                    const catalogId = quoteData.catalogId || quoteData.catalogSelectionId;
                    
                    // Appel à l'API catalogue interne
                    const catalogUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/catalogue/${catalogId}`;
                    const catalogResponse = await fetch(catalogUrl);
                    
                    if (catalogResponse.ok) {
                        const catalogData = await catalogResponse.json();
                        catalogSelection = {
                            id: catalogData.catalogSelection.id,
                            marketingTitle: catalogData.catalogSelection.marketingTitle,
                            marketingDescription: catalogData.catalogSelection.marketingDescription,
                            marketingPrice: catalogData.catalogSelection.marketingPrice,
                            item: {
                                id: catalogData.item.id,
                                name: catalogData.item.name,
                                description: catalogData.item.description,
                                basePrice: catalogData.item.price
                            }
                        };
                    }
                } catch (error) {
                    logger.warn('⚠️ Impossible de récupérer les infos catalogue', { temporaryId, error: error.message });
                }
            }

            // Réponse complète avec toutes les données formatées pour l'UI
            const response = {
                success: true,
                data: {
                    id: quoteRequest.getId(),
                    temporaryId: quoteRequest.getTemporaryId(),
                    type: quoteRequest.getType(),
                    status: quoteRequest.getStatus(),
                    quoteData: quoteRequest.getQuoteData(),
                    createdAt: quoteRequest.getCreatedAt(),
                    updatedAt: quoteRequest.getUpdatedAt(),
                    expiresAt: quoteRequest.getExpiresAt(),
                    isExpired: quoteRequest.isExpired(),
                    // Ajout des données pour l'UI de la page summary
                    calculatedPrice,
                    catalogSelection
                }
            };

            logger.info(`✅ Demande trouvée: ${temporaryId}`, {
                hasCalculatedPrice: !!calculatedPrice,
                totalPrice: calculatedPrice?.totalPrice,
                hasSecuredPrice: !!quoteData.securedPrice
            });
            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur récupération demande ${temporaryId}:`, error);
            
            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }

    /**
     * POST /api/quotesRequest/[temporaryId]/calculate
     * Calcule le prix pour une demande de devis
     */
    async calculateQuotePrice(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const temporaryId = req.params.temporaryId;
        logger.info(`🧮 POST /api/quotesRequest/${temporaryId}/calculate - Calcul prix`);

        try {
            // Valider le paramètre
            if (!temporaryId) {
                return res.status(400).json({
                    error: 'ID temporaire requis'
                });
            }

            // Calculer le prix via le service (avec données optionnelles du body)
            const quote = await this.quoteRequestService.calculateQuotePrice(temporaryId, req.body);

            // Réponse avec les détails du calcul
            const response = {
                success: true,
                message: 'Prix calculé avec succès',
                data: {
                    calculation: {
                        basePrice: {
                            amount: quote.getBasePrice().getAmount(),
                            currency: quote.getBasePrice().getCurrency()
                        },
                        totalPrice: {
                            amount: quote.getTotalPrice().getAmount(),
                            currency: quote.getTotalPrice().getCurrency()
                        },
                        discounts: quote.getDiscounts().map(discount => ({
                            type: discount.getType(),
                            amount: discount.getAmount().getAmount(),
                            description: discount.getDescription()
                        })),
                        serviceType: quote.getServiceType(),
                        calculatedAt: quote.getCalculationDate(),
                        hasDiscounts: quote.hasDiscounts()
                    }
                }
            };

            logger.info(`✅ Prix calculé pour ${temporaryId}: ${quote.getTotalPrice().getAmount()}€`);
            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur calcul prix ${temporaryId}:`, error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    error: 'Données invalides',
                    message: error.message
                });
            }

            return res.status(500).json({
                error: 'Erreur de calcul',
                message: 'Impossible de calculer le prix pour cette demande'
            });
        }
    }

    /**
     * PUT /api/quotesRequest/[temporaryId]
     * Met à jour une demande de devis existante
     */
    async updateQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const temporaryId = req.params.temporaryId;
        logger.info(`📝 PUT /api/quotesRequest/${temporaryId} - Mise à jour demande`);

        try {
            // Valider le paramètre
            if (!temporaryId) {
                return res.status(400).json({
                    error: 'ID temporaire requis'
                });
            }

            // Valider les données de mise à jour
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    error: 'Données de mise à jour requises'
                });
            }

            // Mettre à jour via le service
            const updatedQuoteRequest = await this.quoteRequestService.updateQuoteRequest(temporaryId, req.body);

            // Réponse avec les données mises à jour
            const response = {
                success: true,
                message: 'Demande de devis mise à jour avec succès',
                data: {
                    id: updatedQuoteRequest.getId(),
                    temporaryId: updatedQuoteRequest.getTemporaryId(),
                    type: updatedQuoteRequest.getType(),
                    status: updatedQuoteRequest.getStatus(),
                    quoteData: updatedQuoteRequest.getQuoteData(),
                    updatedAt: updatedQuoteRequest.getUpdatedAt(),
                    expiresAt: updatedQuoteRequest.getExpiresAt()
                }
            };

            logger.info(`✅ Demande mise à jour: ${temporaryId}`);
            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur mise à jour demande ${temporaryId}:`, error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    error: 'Données invalides',
                    message: error.message
                });
            }

            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }

    /**
     * DELETE /api/quotesRequest/[temporaryId]
     * Supprime une demande de devis
     */
    async deleteQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const temporaryId = req.params.temporaryId;
        logger.info(`🗑️ DELETE /api/quotesRequest/${temporaryId} - Suppression demande`);

        try {
            // Valider le paramètre
            if (!temporaryId) {
                return res.status(400).json({
                    error: 'ID temporaire requis'
                });
            }

            // Supprimer via le service
            await this.quoteRequestService.deleteQuoteRequest(temporaryId);

            // Réponse de confirmation
            const response = {
                success: true,
                message: 'Demande de devis supprimée avec succès'
            };

            logger.info(`✅ Demande supprimée: ${temporaryId}`);
            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur suppression demande ${temporaryId}:`, error);
            
            if (error instanceof ValidationError) {
                return res.status(404).json({
                    error: 'Demande non trouvée',
                    message: error.message
                });
            }

            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }

    /**
     * POST /api/quotesRequest/[temporaryId]/confirm
     * Confirme une demande de devis (endpoint bonus)
     */
    async confirmQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const temporaryId = req.params.temporaryId;
        logger.info(`✅ POST /api/quotesRequest/${temporaryId}/confirm - Confirmation demande`);

        try {
            if (!temporaryId) {
                return res.status(400).json({
                    error: 'ID temporaire requis'
                });
            }

            // Confirmer via le service
            const confirmedQuoteRequest = await this.quoteRequestService.confirmQuoteRequest(temporaryId);

            const response = {
                success: true,
                message: 'Demande de devis confirmée avec succès',
                data: {
                    id: confirmedQuoteRequest.getId(),
                    temporaryId: confirmedQuoteRequest.getTemporaryId(),
                    status: confirmedQuoteRequest.getStatus(),
                    updatedAt: confirmedQuoteRequest.getUpdatedAt()
                }
            };

            logger.info(`✅ Demande confirmée: ${temporaryId}`);
            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur confirmation demande ${temporaryId}:`, error);
            
            if (error instanceof ValidationError) {
                return res.status(404).json({
                    error: 'Demande non trouvée',
                    message: error.message
                });
            }

            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }

    /**
     * POST /api/quotesRequest/[temporaryId]/extend
     * Prolonge la durée de validité d'une demande (endpoint bonus)
     */
    async extendQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const temporaryId = req.params.temporaryId;
        const additionalHours = req.body?.hours || 24;
        logger.info(`⏰ POST /api/quotesRequest/${temporaryId}/extend - Prolongation demande`);

        try {
            if (!temporaryId) {
                return res.status(400).json({
                    error: 'ID temporaire requis'
                });
            }

            // Prolonger via le service
            const extendedQuoteRequest = await this.quoteRequestService.extendQuoteRequest(temporaryId, additionalHours);

            const response = {
                success: true,
                message: `Demande de devis prolongée de ${additionalHours}h`,
                data: {
                    temporaryId: extendedQuoteRequest.getTemporaryId(),
                    newExpiresAt: extendedQuoteRequest.getExpiresAt(),
                    updatedAt: extendedQuoteRequest.getUpdatedAt()
                }
            };

            logger.info(`✅ Demande prolongée: ${temporaryId}`);
            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur prolongation demande ${temporaryId}:`, error);
            
            if (error instanceof ValidationError) {
                return res.status(404).json({
                    error: 'Demande non trouvée',
                    message: error.message
                });
            }

            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }
} 