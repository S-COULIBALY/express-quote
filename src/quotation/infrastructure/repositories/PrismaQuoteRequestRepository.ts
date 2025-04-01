import { PrismaClient } from '@prisma/client';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';
import { QuoteRequest, QuoteRequestStatus, QuoteRequestType } from '../../domain/entities/QuoteRequest';
import { Database } from '../config/database';

export class PrismaQuoteRequestRepository implements IQuoteRequestRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = Database.getClient();
    }

    /**
     * Enregistre une demande de devis en base de données
     */
    async save(quoteRequest: QuoteRequest): Promise<QuoteRequest> {
        try {
            const existingQuoteRequest = quoteRequest.getId() 
                ? await this.prisma.quoteRequest.findUnique({ where: { id: quoteRequest.getId() } })
                : null;

            // Données de base pour la demande de devis
            const quoteRequestData = {
                type: quoteRequest.getType(),
                status: quoteRequest.getStatus(),
                quoteData: quoteRequest.getQuoteData(),
                temporaryId: quoteRequest.getTemporaryId(),
                expiresAt: quoteRequest.getExpiresAt()
            };

            if (existingQuoteRequest) {
                // Mise à jour d'une demande existante
                const updated = await this.prisma.quoteRequest.update({
                    where: { id: quoteRequest.getId() },
                    data: quoteRequestData
                });
                return this.mapDbToQuoteRequest(updated);
            } else {
                // Création d'une nouvelle demande
                const id = quoteRequest.getId() || undefined;
                const created = await this.prisma.quoteRequest.create({
                    data: {
                        ...quoteRequestData,
                        id
                    }
                });
                return this.mapDbToQuoteRequest(created);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la demande de devis:', error);
            throw new Error(`Erreur lors de la sauvegarde de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Trouve une demande de devis par son ID temporaire
     */
    async findByTemporaryId(temporaryId: string): Promise<QuoteRequest | null> {
        try {
            const quoteRequest = await this.prisma.quoteRequest.findUnique({
                where: { temporaryId }
            });

            if (!quoteRequest) {
                return null;
            }

            return this.mapDbToQuoteRequest(quoteRequest);
        } catch (error) {
            console.error(`Erreur lors de la recherche de la demande de devis par ID temporaire ${temporaryId}:`, error);
            throw new Error(`Erreur lors de la recherche de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Trouve une demande de devis par son ID
     */
    async findById(id: string): Promise<QuoteRequest | null> {
        try {
            const quoteRequest = await this.prisma.quoteRequest.findUnique({
                where: { id }
            });

            if (!quoteRequest) {
                return null;
            }

            return this.mapDbToQuoteRequest(quoteRequest);
        } catch (error) {
            console.error(`Erreur lors de la recherche de la demande de devis par ID ${id}:`, error);
            throw new Error(`Erreur lors de la recherche de la demande de devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Met à jour le statut d'une demande de devis
     */
    async updateStatus(id: string, status: QuoteRequestStatus): Promise<void> {
        try {
            await this.prisma.quoteRequest.update({
                where: { id },
                data: { status }
            });
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du statut de la demande de devis ${id}:`, error);
            throw new Error(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Trouve les demandes de devis expirées
     */
    async findExpired(): Promise<QuoteRequest[]> {
        try {
            const now = new Date();
            const expiredQuoteRequests = await this.prisma.quoteRequest.findMany({
                where: {
                    expiresAt: { lt: now },
                    status: QuoteRequestStatus.TEMPORARY
                }
            });

            return expiredQuoteRequests.map(this.mapDbToQuoteRequest);
        } catch (error) {
            console.error('Erreur lors de la recherche des demandes de devis expirées:', error);
            throw new Error(`Erreur lors de la recherche des demandes expirées: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Convertit un enregistrement de la base de données en entité QuoteRequest
     */
    private mapDbToQuoteRequest(dbQuoteRequest: any): QuoteRequest {
        // Validation des types enum
        const type = dbQuoteRequest.type as QuoteRequestType;
        const quoteData = dbQuoteRequest.quoteData as Record<string, any>;
        
        // Création de l'entité
        const quoteRequest = new QuoteRequest(
            type,
            quoteData,
            dbQuoteRequest.id
        );
        
        // Configuration des valeurs provenant de la base de données
        // Utiliser des méthodes privées directement n'est pas idéal, mais c'est pour l'exemple
        (quoteRequest as any).status = dbQuoteRequest.status;
        (quoteRequest as any).createdAt = dbQuoteRequest.createdAt;
        (quoteRequest as any).updatedAt = dbQuoteRequest.updatedAt;
        (quoteRequest as any).expiresAt = dbQuoteRequest.expiresAt;
        (quoteRequest as any).temporaryId = dbQuoteRequest.temporaryId;
        
        return quoteRequest;
    }
} 