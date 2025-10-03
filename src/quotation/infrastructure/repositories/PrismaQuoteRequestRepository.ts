import { PrismaClient } from '@prisma/client';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';
import { QuoteRequest, QuoteRequestStatus } from '../../domain/entities/QuoteRequest';
import { ServiceType } from '../../domain/enums/ServiceType';
import { Database } from '../config/database';
import { logger } from '@/lib/logger';

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
            const quoteData = quoteRequest.getQuoteData();
            
            const quoteRequestData = {
                type: quoteRequest.getType(),
                status: quoteRequest.getStatus(),
                quoteData: quoteData,
                temporaryId: quoteRequest.getTemporaryId(),
                expiresAt: quoteRequest.getExpiresAt(),
                updatedAt: new Date()
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
     * Recherche une demande de devis par son ID temporaire
     */
    async findByTemporaryId(temporaryId: string): Promise<QuoteRequest | null> {
        try {
            const quoteRequest = await this.prisma.quoteRequest.findUnique({
                where: { temporaryId }
            });

            return quoteRequest ? this.mapDbToQuoteRequest(quoteRequest) : null;
        } catch (error) {
            console.error('Erreur lors de la recherche de la demande de devis par ID temporaire:', error);
            throw new Error(`Erreur lors de la recherche de la demande: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Recherche une demande de devis par son ID
     */
    async findById(id: string): Promise<QuoteRequest | null> {
        try {
            const quoteRequest = await this.prisma.quoteRequest.findUnique({
                where: { id }
            });

            return quoteRequest ? this.mapDbToQuoteRequest(quoteRequest) : null;
        } catch (error) {
            console.error('Erreur lors de la recherche de la demande de devis par ID:', error);
            throw new Error(`Erreur lors de la recherche de la demande: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Met à jour le statut d'une demande de devis
     */
    async updateStatus(id: string, status: QuoteRequestStatus): Promise<void> {
        try {
            await this.prisma.quoteRequest.update({
                where: { id },
                data: { 
                    status,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            throw new Error(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Recherche les demandes de devis expirées
     */
    async findExpired(): Promise<QuoteRequest[]> {
        try {
            const expiredQuoteRequests = await this.prisma.quoteRequest.findMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    },
                    status: {
                        not: QuoteRequestStatus.EXPIRED
                    }
                }
            });

            return expiredQuoteRequests.map(qr => this.mapDbToQuoteRequest(qr));
        } catch (error) {
            console.error('Erreur lors de la recherche des demandes expirées:', error);
            throw new Error(`Erreur lors de la recherche des demandes expirées: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Recherche toutes les demandes de devis
     */
    async findAll(): Promise<QuoteRequest[]> {
        try {
            const quoteRequests = await this.prisma.quoteRequest.findMany({
                orderBy: { createdAt: 'desc' }
            });

            return quoteRequests.map(qr => this.mapDbToQuoteRequest(qr));
        } catch (error) {
            console.error('Erreur lors de la recherche de toutes les demandes de devis:', error);
            throw new Error(`Erreur lors de la recherche des demandes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Supprime une demande de devis
     */
    async delete(id: string): Promise<void> {
        try {
            await this.prisma.quoteRequest.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de la demande de devis:', error);
            throw new Error(`Erreur lors de la suppression de la demande: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Convertit un enregistrement de la base de données en entité QuoteRequest
     * Utilise maintenant le constructeur fromDatabase pour éviter les (entity as any)
     */
    private mapDbToQuoteRequest(dbQuoteRequest: any): QuoteRequest {
        // Validation des types enum
        const type = dbQuoteRequest.type as ServiceType;
        const status = dbQuoteRequest.status as QuoteRequestStatus;
        const quoteData = dbQuoteRequest.quoteData as Record<string, any>;
        

        
        // Utilisation du constructeur fromDatabase sécurisé
        return QuoteRequest.fromDatabase(
            type,
            quoteData,
            dbQuoteRequest.id,
            status,
            dbQuoteRequest.createdAt,
            dbQuoteRequest.updatedAt,
            dbQuoteRequest.expiresAt,
            dbQuoteRequest.temporaryId
        );
    }
} 