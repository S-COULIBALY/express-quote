import { QuoteRequest } from '../../entities/QuoteRequest';
import { Booking } from '../../entities/Booking';
import { WhatsAppTemplate } from './types';

export interface IWhatsAppDistributionService {
    /**
     * Distribue un message WhatsApp aux différents destinataires selon leur rôle
     */
    distributeMessage(options: {
        // Données principales
        messageType: 'quote_request' | 'booking' | 'payment' | 'cancellation' | 'reminder';
        data: QuoteRequest | Booking;
        
        // Options de distribution
        sendToClient?: boolean;
        sendToTeam?: boolean;
        sendToProviders?: boolean;
        
        // Template personnalisé (optionnel)
        template?: WhatsAppTemplate;
        
        // Métadonnées additionnelles
        metadata?: Record<string, any>;
    }): Promise<{
        clientMessageId?: string;
        teamMessageIds: string[];
        providerMessageIds: string[];
    }>;

    /**
     * Distribue une notification d'urgence à toute l'équipe
     */
    distributeUrgentNotification(message: string, metadata?: Record<string, any>): Promise<string[]>;

    /**
     * Distribue un message de suivi aux prestataires concernés
     */
    distributeProviderFollowUp(booking: Booking, message: string): Promise<string[]>;

    /**
     * Récupère les statistiques de distribution
     */
    getDistributionStats(period: 'day' | 'week' | 'month'): Promise<{
        totalMessages: number;
        messagesByType: Record<string, number>;
        messagesByRecipientType: {
            client: number;
            team: number;
            providers: number;
        };
        deliveryRate: number;
        readRate: number;
    }>;
} 