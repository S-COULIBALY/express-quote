import { QuoteRequest, QuoteRequestStatus } from '../../domain/entities/QuoteRequest';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';

/**
 * Service spécialisé pour la gestion des états des demandes de devis
 * Gère les transitions d'état, l'expiration, la confirmation, etc.
 */
export class QuoteStateService {
    constructor(
        private readonly quoteRequestRepository: IQuoteRequestRepository
    ) {}

    /**
     * Confirme une demande de devis
     */
    async confirmQuoteRequest(temporaryId: string): Promise<QuoteRequest> {
        logger.info(`✅ Confirmation demande de devis - temporaryId: ${temporaryId}`);
        
        try {
            const quoteRequest = await this.getQuoteRequestByTemporaryId(temporaryId);
            if (!quoteRequest) {
                throw new ValidationError('Demande de devis non trouvée ou expirée');
            }

            quoteRequest.updateStatus(QuoteRequestStatus.CONFIRMED);
            const confirmedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
            
            logger.info(`✅ Demande de devis confirmée - temporaryId: ${temporaryId}`);
            
            return confirmedQuoteRequest;
        } catch (error) {
            logger.error(`❌ Erreur lors de la confirmation de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Prolonge la durée de validité d'une demande de devis
     */
    async extendQuoteRequest(temporaryId: string, additionalHours: number = 24): Promise<QuoteRequest> {
        logger.info(`⏰ Prolongation demande de devis - temporaryId: ${temporaryId}, additionalHours: ${additionalHours}`);
        
        try {
            const quoteRequest = await this.getQuoteRequestByTemporaryId(temporaryId);
            if (!quoteRequest) {
                throw new ValidationError('Demande de devis non trouvée');
            }

            quoteRequest.setExpirationHours(additionalHours);
            const extendedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
            
            logger.info(`✅ Demande de devis prolongée - temporaryId: ${temporaryId}, newExpiresAt: ${extendedQuoteRequest.getExpiresAt()}`);
            
            return extendedQuoteRequest;
        } catch (error) {
            logger.error(`❌ Erreur lors de la prolongation de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Traite les demandes expirées
     */
    async processExpiredQuotes(): Promise<void> {
        logger.info('🔄 Traitement des demandes expirées');
        
        try {
            const expiredQuotes = await this.quoteRequestRepository.findExpired();
            
            for (const quote of expiredQuotes) {
                await this.markAsExpired(quote.getId());
            }
            
            logger.info(`✅ Demandes expirées traitées - count: ${expiredQuotes.length}`);
        } catch (error) {
            logger.error(`❌ Erreur lors du traitement des demandes expirées: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Vérifie si une demande de devis est expirée et la marque si nécessaire
     */
    async checkAndHandleExpiration(temporaryId: string): Promise<QuoteRequest | null> {
        logger.info(`🔍 Vérification expiration - temporaryId: ${temporaryId}`);
        
        try {
            const quoteRequest = await this.quoteRequestRepository.findByTemporaryId(temporaryId);
            
            if (quoteRequest && quoteRequest.isExpired()) {
                logger.warn(`⚠️ Demande de devis expirée - temporaryId: ${temporaryId}`);
                await this.markAsExpired(quoteRequest.getId());
                return null;
            }
            
            return quoteRequest;
        } catch (error) {
            logger.error(`❌ Erreur lors de la vérification d'expiration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Change le statut d'une demande de devis
     */
    async changeQuoteRequestStatus(temporaryId: string, newStatus: QuoteRequestStatus): Promise<QuoteRequest> {
        logger.info(`🔄 Changement de statut - temporaryId: ${temporaryId}, newStatus: ${newStatus}`);
        
        try {
            const quoteRequest = await this.getQuoteRequestByTemporaryId(temporaryId);
            if (!quoteRequest) {
                throw new ValidationError('Demande de devis non trouvée ou expirée');
            }

            quoteRequest.updateStatus(newStatus);
            const updatedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
            
            logger.info(`✅ Statut changé - temporaryId: ${temporaryId}, newStatus: ${newStatus}`);
            
            return updatedQuoteRequest;
        } catch (error) {
            logger.error(`❌ Erreur lors du changement de statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Valide les transitions d'état autorisées
     */
    validateStatusTransition(currentStatus: QuoteRequestStatus, newStatus: QuoteRequestStatus): boolean {
        const allowedTransitions: Record<QuoteRequestStatus, QuoteRequestStatus[]> = {
            [QuoteRequestStatus.TEMPORARY]: [QuoteRequestStatus.CONFIRMED, QuoteRequestStatus.EXPIRED],
            [QuoteRequestStatus.CONFIRMED]: [QuoteRequestStatus.EXPIRED, QuoteRequestStatus.CONVERTED],
            [QuoteRequestStatus.EXPIRED]: [], // Aucune transition depuis EXPIRED
            [QuoteRequestStatus.CONVERTED]: [] // Aucune transition depuis CONVERTED
        };

        const allowed = allowedTransitions[currentStatus] || [];
        const isValid = allowed.includes(newStatus);

        if (!isValid) {
            logger.warn(`⚠️ Transition d'état invalide: ${currentStatus} -> ${newStatus}`);
        }

        return isValid;
    }

    // === MÉTHODES PRIVÉES ===

    /**
     * Récupère une demande de devis par son ID temporaire
     */
    private async getQuoteRequestByTemporaryId(temporaryId: string): Promise<QuoteRequest | null> {
        logger.info(`🔍 Recherche demande de devis par temporaryId: ${temporaryId}`);
        
        try {
            const quoteRequest = await this.quoteRequestRepository.findByTemporaryId(temporaryId);
            
            if (quoteRequest) {
                logger.info(`✅ Demande de devis trouvée - temporaryId: ${temporaryId}, id: ${quoteRequest.getId()}, status: ${quoteRequest.getStatus()}`);
            } else {
                logger.info(`ℹ️ Aucune demande de devis trouvée - temporaryId: ${temporaryId}`);
            }
            
            return quoteRequest;
        } catch (error) {
            logger.error(`❌ Erreur lors de la recherche de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            throw error;
        }
    }

    /**
     * Marque une demande comme expirée
     */
    private async markAsExpired(quoteRequestId: string): Promise<void> {
        await this.quoteRequestRepository.updateStatus(quoteRequestId, QuoteRequestStatus.EXPIRED);
        logger.info(`⚠️ Demande marquée comme expirée - quoteRequestId: ${quoteRequestId}`);
    }
}
