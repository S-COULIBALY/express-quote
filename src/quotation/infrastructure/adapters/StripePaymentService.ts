import { IPaymentService } from '../../domain/interfaces/IPaymentService';
import { Booking } from '../../domain/entities/Booking';
import { Money } from '../../domain/valueObjects/Money';

export class StripePaymentService implements IPaymentService {
    private readonly apiKey: string;
    private readonly apiVersion: string;
    private readonly isTestMode: boolean;

    constructor(apiKey: string, apiVersion: string = '2023-10-16', isTestMode: boolean = false) {
        this.apiKey = apiKey;
        this.apiVersion = apiVersion;
        this.isTestMode = isTestMode;
    }

    public async processPayment(booking: Booking, method: string): Promise<string> {
        try {
            console.log(`[Stripe] Processing payment for booking ${booking.getId()} with method ${method}`);
            
            // Simuler un appel à l'API Stripe
            const amount = booking.getTotalAmount().getAmount();
            const currency = booking.getTotalAmount().getCurrency().toLowerCase();
            const customer = booking.getCustomer();
            const customerEmail = customer.getContactInfo()?.getEmail() || '';
            
            // Simuler un délai pour l'API
            await this.delay(500);
            
            // Générer un identifiant de transaction
            const transactionId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            console.log(`[Stripe] Payment processed successfully. Transaction ID: ${transactionId}`);
            return transactionId;
        } catch (error) {
            console.error('[Stripe] Payment processing failed:', error);
            throw new Error(`Payment processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async refundPayment(transactionId: string, amount: Money): Promise<string> {
        try {
            console.log(`[Stripe] Refunding payment ${transactionId} for amount ${amount.toString()}`);
            
            // Simuler un appel à l'API Stripe pour le remboursement
            await this.delay(300);
            
            // Générer un identifiant de transaction de remboursement
            const refundId = `re_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            console.log(`[Stripe] Refund processed successfully. Refund ID: ${refundId}`);
            return refundId;
        } catch (error) {
            console.error('[Stripe] Refund processing failed:', error);
            throw new Error(`Refund processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async getPaymentStatus(transactionId: string): Promise<'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED'> {
        try {
            console.log(`[Stripe] Checking payment status for transaction ${transactionId}`);
            
            // Simuler un appel à l'API Stripe pour vérifier le statut
            await this.delay(200);
            
            // Pour la démonstration, on retourne un statut aléatoire
            const statuses: ('COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED')[] = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            console.log(`[Stripe] Payment status for transaction ${transactionId}: ${status}`);
            return status;
        } catch (error) {
            console.error('[Stripe] Get payment status failed:', error);
            throw new Error(`Get payment status failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 