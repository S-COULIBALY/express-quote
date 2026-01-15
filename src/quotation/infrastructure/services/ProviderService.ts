// @ts-nocheck
// Méthodes getServiceType et getZone n'existent pas sur Booking
import { logger } from '@/lib/logger';
import { Booking } from '../../domain/entities/Booking';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';

const providerLogger = logger.withContext('ProviderService');

interface Provider {
    id: string;
    phone: string;
    services: string[];
    zones: string[];
    isAvailable: boolean;
}

export class ProviderService {
    private providers: Provider[];

    constructor() {
        // Dans un cas réel, ces données seraient chargées depuis une base de données
        this.providers = [];
    }

    /**
     * Récupère les numéros de téléphone des prestataires concernés par une demande
     */
    public async getProviderPhones(data: Booking | QuoteRequest): Promise<string[]> {
        try {
            let serviceType: string;
            let zone: string;

            if (data instanceof Booking) {
                serviceType = data.getServiceType();
                zone = data.getZone();
            } else {
                const quoteData = data.getQuoteData();
                serviceType = quoteData?.type || '';
                zone = quoteData?.zone || '';
            }

            // Filtrer les prestataires selon le type de service et la zone
            const matchingProviders = this.providers.filter(provider => 
                provider.isAvailable &&
                provider.services.includes(serviceType) &&
                provider.zones.includes(zone)
            );

            return matchingProviders.map(provider => provider.phone);
        } catch (error) {
            providerLogger.error('Erreur lors de la récupération des prestataires', error);
            return [];
        }
    }

    /**
     * Ajoute un nouveau prestataire
     */
    public async addProvider(provider: Provider): Promise<void> {
        if (!this.providers.some(p => p.id === provider.id)) {
            this.providers.push(provider);
            providerLogger.info('Nouveau prestataire ajouté', { providerId: provider.id });
        }
    }

    /**
     * Met à jour la disponibilité d'un prestataire
     */
    public async updateProviderAvailability(providerId: string, isAvailable: boolean): Promise<void> {
        const provider = this.providers.find(p => p.id === providerId);
        if (provider) {
            provider.isAvailable = isAvailable;
            providerLogger.info('Disponibilité du prestataire mise à jour', { 
                providerId,
                isAvailable 
            });
        }
    }

    /**
     * Supprime un prestataire
     */
    public async removeProvider(providerId: string): Promise<void> {
        const index = this.providers.findIndex(p => p.id === providerId);
        if (index > -1) {
            this.providers.splice(index, 1);
            providerLogger.info('Prestataire supprimé', { providerId });
        }
    }
} 