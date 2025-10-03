import { HttpRequest, HttpResponse } from '../types';
import { CustomerService } from '../../../application/services/CustomerService';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';

/**
 * Contrôleur HTTP pour la gestion des clients
 * Endpoints REST pour le cycle de vie complet des Customer
 */
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService
    ) {}

    /**
     * POST /api/customers/
     * Crée un nouveau client
     */
    async createCustomer(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        logger.info('👤 POST /api/customers/ - Création client');
        
        try {
            // Valider les données d'entrée
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    error: 'Les données du client sont requises'
                });
            }

            // Vérifier les champs obligatoires
            const { email, firstName, lastName, phone } = req.body;
            if (!email || !firstName || !lastName) {
                return res.status(400).json({
                    error: 'Email, prénom et nom sont requis'
                });
            }

            // Créer le client via le service
            const customerData = { email, firstName, lastName, phone };
            const customer = await this.customerService.createCustomer(customerData);

            // Réponse avec les informations du client créé
            const response = {
                success: true,
                message: 'Client créé avec succès',
                data: this.customerService.createCustomerDTO(customer)
            };

            return res.status(201).json(response);

        } catch (error) {
            logger.error('❌ Erreur création client:', error);
            
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
     * GET /api/customers/
     * Récupère tous les clients avec pagination
     */
    async getAllCustomers(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        logger.info('📋 GET /api/customers/ - Récupération clients');

        try {
            // Paramètres de pagination
            const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

            // Récupérer les clients via le service
            const result = await this.customerService.getAllCustomers(limit, offset);

            // Construire la réponse avec DTOs
            const response = {
                success: true,
                data: {
                    customers: result.customers.map(customer => 
                        this.customerService.createCustomerDTO(customer)
                    ),
                    total: result.total,
                    limit: limit || result.total,
                    offset: offset || 0
                }
            };

            return res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Erreur récupération clients:', error);
            
            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }

    /**
     * GET /api/customers/[id]
     * Récupère un client par son ID
     */
    async getCustomerById(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const customerId = req.params.id;
        logger.info(`🔍 GET /api/customers/${customerId} - Récupération client`);

        try {
            // Valider le paramètre
            if (!customerId) {
                return res.status(400).json({
                    error: 'ID client requis'
                });
            }

            // Récupérer le client via le service
            const customer = await this.customerService.findCustomerById(customerId);

            if (!customer) {
                return res.status(404).json({
                    error: 'Client non trouvé',
                    message: 'Aucun client trouvé avec cet ID'
                });
            }

            // Réponse avec les données du client
            const response = {
                success: true,
                data: this.customerService.createCustomerDTO(customer)
            };

            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur récupération client ${customerId}:`, error);
            
            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }

    /**
     * PUT /api/customers/[id]
     * Met à jour un client existant
     */
    async updateCustomer(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const customerId = req.params.id;
        logger.info(`📝 PUT /api/customers/${customerId} - Mise à jour client`);

        try {
            // Valider le paramètre
            if (!customerId) {
                return res.status(400).json({
                    error: 'ID client requis'
                });
            }

            // Valider les données de mise à jour
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    error: 'Données de mise à jour requises'
                });
            }

            // Extraire les données à mettre à jour
            const { email, firstName, lastName, phone } = req.body;
            const updateData: any = {};

            if (email !== undefined) updateData.email = email;
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (phone !== undefined) updateData.phone = phone;

            // Mettre à jour via le service
            const updatedCustomer = await this.customerService.updateCustomer(customerId, updateData);

            // Réponse avec les données mises à jour
            const response = {
                success: true,
                message: 'Client mis à jour avec succès',
                data: this.customerService.createCustomerDTO(updatedCustomer)
            };

            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur mise à jour client ${customerId}:`, error);
            
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
     * DELETE /api/customers/[id]
     * Supprime un client (seulement si aucune réservation active)
     */
    async deleteCustomer(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const customerId = req.params.id;
        logger.info(`🗑️ DELETE /api/customers/${customerId} - Suppression client`);

        try {
            // Valider le paramètre
            if (!customerId) {
                return res.status(400).json({
                    error: 'ID client requis'
                });
            }

            // Supprimer via le service
            const deleted = await this.customerService.deleteCustomer(customerId);

            if (!deleted) {
                return res.status(404).json({
                    error: 'Client non trouvé',
                    message: 'Aucun client trouvé avec cet ID'
                });
            }

            // Réponse de confirmation
            const response = {
                success: true,
                message: 'Client supprimé avec succès'
            };

            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur suppression client ${customerId}:`, error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    error: 'Suppression impossible',
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
     * GET /api/customers/[id]/bookings
     * Récupère les réservations d'un client
     */
    async getCustomerBookings(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        const customerId = req.params.id;
        logger.info(`📅 GET /api/customers/${customerId}/bookings - Récupération réservations`);

        try {
            // Valider le paramètre
            if (!customerId) {
                return res.status(400).json({
                    error: 'ID client requis'
                });
            }

            // Récupérer les réservations via le service
            const bookings = await this.customerService.getCustomerBookings(customerId);

            // Réponse avec les réservations
            const response = {
                success: true,
                data: {
                    customerId,
                    bookings,
                    count: bookings.length
                }
            };

            return res.status(200).json(response);

        } catch (error) {
            logger.error(`❌ Erreur récupération réservations ${customerId}:`, error);
            
            if (error instanceof ValidationError) {
                return res.status(404).json({
                    error: 'Client non trouvé',
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
     * GET /api/customers/search
     * Recherche des clients selon des critères
     */
    async searchCustomers(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
        logger.info('🔍 GET /api/customers/search - Recherche clients');

        try {
            // Extraire les paramètres de recherche
            const searchParams = {
                email: req.query.email as string,
                firstName: req.query.firstName as string,
                lastName: req.query.lastName as string,
                phone: req.query.phone as string,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            // Filtrer les paramètres undefined
            const filteredParams = Object.fromEntries(
                Object.entries(searchParams).filter(([_, value]) => value !== undefined)
            );

            // Vérifier qu'au moins un critère de recherche est fourni
            if (Object.keys(filteredParams).length === 0) {
                return res.status(400).json({
                    error: 'Au moins un critère de recherche est requis',
                    availableParams: ['email', 'firstName', 'lastName', 'phone', 'limit', 'offset']
                });
            }

            // Rechercher via le service
            const customers = await this.customerService.searchCustomers(filteredParams);

            // Réponse avec les résultats
            const response = {
                success: true,
                data: {
                    customers: customers.map(customer => 
                        this.customerService.createCustomerDTO(customer)
                    ),
                    count: customers.length,
                    searchParams: filteredParams
                }
            };

            return res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Erreur recherche clients:', error);
            
            return res.status(500).json({
                error: 'Erreur interne du serveur',
                message: 'Une erreur inattendue s\'est produite'
            });
        }
    }
} 