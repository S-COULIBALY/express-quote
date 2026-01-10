import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';
import { ServiceType } from '../../domain/enums/ServiceType';
import { Quote } from '../../domain/valueObjects/Quote';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import { QuoteCalculationService } from './QuoteCalculationService';
import { QuoteValidationService } from './QuoteValidationService';
import { QuoteStateService } from './QuoteStateService';

/**
 * Service applicatif pour la gestion des demandes de devis
 * Version refactorisée avec services spécialisés
 * Orchestre les opérations entre les différents services spécialisés
 */
export class QuoteRequestService {
    private readonly calculationService: QuoteCalculationService;
    private readonly validationService: QuoteValidationService;
    private readonly stateService: QuoteStateService;

    constructor(
        private readonly quoteRequestRepository: IQuoteRequestRepository
    ) {
        this.calculationService = new QuoteCalculationService();
        this.validationService = new QuoteValidationService();
        this.stateService = new QuoteStateService(quoteRequestRepository);
    }

    /**
     * Crée une nouvelle demande de devis
     */
    async createQuoteRequest(data: Record<string, any>): Promise<QuoteRequest> {
        logger.info('\n\n\n═══ DEBUT QuoteRequestService.createQuoteRequest ═══');
        logger.info(`📁 [QuoteRequestService.ts] ▶️ Début création demande de devis - serviceType: ${data.serviceType}`);
        
        try {
            // Validation des données (inclut la normalisation)
            const validatedData = this.validationService.validateQuoteRequestData(data);
            logger.info('📁 [QuoteRequestService.ts] ✅ Données validées');
            
            // ✅ CORRECTION : Passer seulement quoteData au constructeur, pas tout l'objet validé
            const quoteRequest = new QuoteRequest(validatedData.serviceType, validatedData.quoteData);
            const savedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
            
            logger.info(`📁 [QuoteRequestService.ts] ✅ Demande de devis créée: ${savedQuoteRequest.getId()} (${savedQuoteRequest.getTemporaryId()})`);
            logger.info('📁 [QuoteRequestService.ts] ⏹ Fin QuoteRequestService.createQuoteRequest');
            logger.info('═══⏹ FIN QuoteRequestService.createQuoteRequest ═══\n\n\n');
            return savedQuoteRequest;
        } catch (error) {
            logger.error(`📁 [QuoteRequestService.ts] ❌ Erreur lors de la création de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            logger.info('📁 [QuoteRequestService.ts] ⏹ Fin QuoteRequestService.createQuoteRequest (erreur)');
            logger.info('═══⏹ FIN QuoteRequestService.createQuoteRequest ═══\n\n\n');
            throw error;
        }
    }

    /**
     * Récupère une demande de devis par son ID temporaire
     */
    async getQuoteRequestByTemporaryId(temporaryId: string): Promise<QuoteRequest | null> {
        logger.info(`🔍 Recherche demande de devis par temporaryId: ${temporaryId}`);
        
        try {
            // Vérification de l'expiration via le service d'état
            const quoteRequest = await this.stateService.checkAndHandleExpiration(temporaryId);
            
            if (quoteRequest) {
                logger.info(`✅ Demande de devis trouvée - temporaryId: ${temporaryId}, id: ${quoteRequest.getId()}, status: ${quoteRequest.getStatus()}`);
            } else {
                logger.info(`ℹ️ Aucune demande de devis trouvée ou expirée - temporaryId: ${temporaryId}`);
            }
            
            return quoteRequest;
        } catch (error) {
            logger.error(`❌ Erreur lors de la recherche de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Calcule le prix pour une demande de devis
     */
    async calculateQuotePrice(temporaryId: string, calculationData?: Partial<Record<string, any>>): Promise<Quote> {
        logger.info(`🧮 Calcul du prix pour demande de devis - temporaryId: ${temporaryId}`);
        
        try {
            const quoteRequest = await this.getQuoteRequestByTemporaryId(temporaryId);
            if (!quoteRequest) {
                throw new ValidationError('Demande de devis non trouvée ou expirée');
            }

            const quoteData = quoteRequest.getQuoteData();
            const dataForCalculation = calculationData ? { ...quoteData, ...calculationData } : quoteData;
            
            // Validation des données de calcul
            this.validationService.validateCalculationData(dataForCalculation);
            
            // Calcul via le service spécialisé
            const quote = await this.calculationService.calculateQuotePrice(quoteRequest.getType(), dataForCalculation);
            
            logger.info(`✅ Prix calculé - temporaryId: ${temporaryId}, serviceType: ${quoteRequest.getType()}, basePrice: ${quote.getBasePrice().getAmount()}, totalPrice: ${quote.getTotalPrice().getAmount()}`);
            
            return quote;
        } catch (error) {
            logger.error(`❌ Erreur lors du calcul du prix: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Met à jour une demande de devis existante
     */
    async updateQuoteRequest(temporaryId: string, updateData: Partial<Record<string, any>>): Promise<QuoteRequest> {
        logger.info(`🔄 Mise à jour demande de devis - temporaryId: ${temporaryId}`);
        
        try {
            const existingQuoteRequest = await this.getQuoteRequestByTemporaryId(temporaryId);
            if (!existingQuoteRequest) {
                throw new ValidationError('Demande de devis non trouvée ou expirée');
            }

            const currentData = existingQuoteRequest.getQuoteData();
            
            // Validation des données de mise à jour
            const validatedData = this.validationService.validateQuoteRequestUpdate(currentData, updateData);

            existingQuoteRequest.updateQuoteData(validatedData);
            const updatedQuoteRequest = await this.quoteRequestRepository.save(existingQuoteRequest);
            
            logger.info(`✅ Demande de devis mise à jour - temporaryId: ${temporaryId}, id: ${updatedQuoteRequest.getId()}`);
            
            return updatedQuoteRequest;
        } catch (error) {
            logger.error(`❌ Erreur lors de la mise à jour de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Supprime une demande de devis
     */
    async deleteQuoteRequest(temporaryId: string): Promise<void> {
        logger.info(`🗑️ Suppression demande de devis - temporaryId: ${temporaryId}`);
        
        try {
            const quoteRequest = await this.getQuoteRequestByTemporaryId(temporaryId);
            if (!quoteRequest) {
                throw new ValidationError('Demande de devis non trouvée');
            }

            await this.quoteRequestRepository.delete(quoteRequest.getId());
            logger.info(`✅ Demande de devis supprimée - temporaryId: ${temporaryId}`);
        } catch (error) {
            logger.error(`❌ Erreur lors de la suppression de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Confirme une demande de devis
     */
    async confirmQuoteRequest(temporaryId: string): Promise<QuoteRequest> {
        return this.stateService.confirmQuoteRequest(temporaryId);
    }

    /**
     * Prolonge la durée de validité d'une demande de devis
     */
    async extendQuoteRequest(temporaryId: string, additionalHours: number = 24): Promise<QuoteRequest> {
        return this.stateService.extendQuoteRequest(temporaryId, additionalHours);
    }

    /**
     * Traite les demandes expirées
     */
    async processExpiredQuotes(): Promise<void> {
        return this.stateService.processExpiredQuotes();
    }

    /**
     * Change le statut d'une demande de devis
     */
    async changeQuoteRequestStatus(temporaryId: string, newStatus: any): Promise<QuoteRequest> {
        return this.stateService.changeQuoteRequestStatus(temporaryId, newStatus);
    }
}
