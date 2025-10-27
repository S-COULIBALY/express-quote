import { HttpRequest, HttpResponse } from '../types';
import { QuoteRequestService } from '../../../application/services/QuoteRequestService';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';

/**
 * Contrôleur HTTP pour la gestion des demandes de devis
 * Endpoints REST pour le cycle de vie complet des QuoteRequest
 */
export class QuoteRequestController {
    constructor(
        private readonly quoteRequestService: QuoteRequestService
    ) {}

    /**
     * POST /api/quotesRequest/
     * Crée une nouvelle demande de devis
     */
    async createQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        logger.info('📬 POST /api/quotesRequest/ - Création demande de devis');

        try {
            // Valider les données d'entrée
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    error: 'Les données de la demande de devis sont requises'
                });
            }

            // ✅ LOG DÉTAILLÉ: Données reçues du frontend (soumission)
            const quoteData = req.body.quoteData || {};
            logger.info('📥 ÉTAPE 1 (SOUMISSION): Données reçues du frontend:', {
                serviceType: req.body.serviceType,
                hasPickupAddress: !!quoteData.pickupAddress,
                hasDeliveryAddress: !!quoteData.deliveryAddress,
                pickupLogisticsConstraints: quoteData.pickupLogisticsConstraints,
                deliveryLogisticsConstraints: quoteData.deliveryLogisticsConstraints,
                additionalServices: quoteData.additionalServices,
                pickupLogisticsConstraintsType: typeof quoteData.pickupLogisticsConstraints,
                deliveryLogisticsConstraintsType: typeof quoteData.deliveryLogisticsConstraints,
                additionalServicesType: typeof quoteData.additionalServices,
                calculatedPrice: quoteData.calculatedPrice,
                totalPrice: quoteData.totalPrice,
                catalogId: quoteData.catalogId,
                hasPresetSnapshot: !!quoteData.__presetSnapshot
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

            logger.info(`✅ Demande de devis créée: ${quoteRequest.getTemporaryId()}`);
            return res.status(201).json(response);

        } catch (error) {
            logger.error('❌ Erreur création demande de devis:', error);
            
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

            // Calculer le prix actuel pour l'affichage
            let calculatedPrice = null;
            try {
                const quote = await this.quoteRequestService.calculateQuotePrice(temporaryId);
                calculatedPrice = {
                    basePrice: quote.getBasePrice().getAmount(),
                    totalPrice: quote.getTotalPrice().getAmount(),
                    currency: quote.getBasePrice().getCurrency(),
                    breakdown: quote.getDiscounts().reduce((acc, discount) => {
                        acc[discount.getDescription()] = discount.getAmount().getAmount();
                        return acc;
                    }, {} as Record<string, number>)
                };
            } catch (error) {
                logger.warn('⚠️ Impossible de calculer le prix pour l\'affichage', { temporaryId, error: error.message });
            }

            // Récupérer les informations du catalogue si disponibles
            let catalogSelection = null;
            const quoteData = quoteRequest.getQuoteData();
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

            logger.info(`✅ Demande trouvée: ${temporaryId}`);
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