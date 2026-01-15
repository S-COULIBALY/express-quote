import { BookingService } from '../services/BookingService';
import { BookingSearchRequestDTO, BookingSearchResponseDTO } from '../dtos/BookingSearchDTO';
import { BookingSearchCriteria } from '../../domain/valueObjects/BookingSearchCriteria';
import { logger } from '@/lib/logger';

export class SearchBookingsUseCase {
    constructor(
        private readonly bookingService: BookingService
    ) {}

    async execute(request: BookingSearchRequestDTO): Promise<BookingSearchResponseDTO> {
        logger.info('🔍 Exécution du cas d\'usage SearchBookings', request);

        // Validation des paramètres d'entrée
        this.validateRequest(request);

        // Conversion du DTO en critères de recherche
        const searchCriteria = this.convertToSearchCriteria(request);

        // Exécution de la recherche
        const result = await this.bookingService.searchBookings(searchCriteria);

        // Conversion du résultat en DTO de réponse
        const response: BookingSearchResponseDTO = {
            bookings: result.bookings.map(booking => ({
                id: booking.getId(),
                type: booking.getType() as any,
                status: booking.getStatus(),
                customerId: booking.getCustomer().getId(),
                professionalId: booking.getProfessional()?.getId(),
                totalAmount: booking.getTotalAmount().getAmount(),
                currency: booking.getTotalAmount().getCurrency() || 'EUR',
                paymentMethod: undefined, // TODO: Ajouter getPaymentMethod() à Booking
                createdAt: booking.getCreatedAt().toISOString(),
                updatedAt: booking.getUpdatedAt().toISOString(),
                scheduledDate: booking.getScheduledDate()?.toISOString(),
                location: booking.getLocation(),
                quoteRequestId: booking.getQuoteRequestId(),
                
                // Relations
                customer: {
                    id: booking.getCustomer().getId(),
                    firstName: booking.getCustomer().getContactInfo().getFirstName(),
                    lastName: booking.getCustomer().getContactInfo().getLastName(),
                    email: booking.getCustomer().getContactInfo().getEmail(),
                    phone: booking.getCustomer().getContactInfo().getPhone(),
                },
                
                professional: booking.getProfessional() ? {
                    id: booking.getProfessional()!.getId(),
                    companyName: booking.getProfessional()!.getCompanyName(),
                    email: booking.getProfessional()!.getEmail(),
                    phone: booking.getProfessional()!.getPhone(),
                    rating: booking.getProfessional()!.getRating(),
                } : undefined,
                
                // Méta-données
                canBeModified: true, // À implémenter selon la logique métier
                canBeCancelled: true, // À implémenter selon la logique métier
                canBeDeleted: true, // À implémenter selon la logique métier
            })),
            totalCount: result.totalCount,
            hasMore: result.hasMore,
            offset: result.offset,
            limit: result.limit,
            searchCriteria: request
        };

        logger.info(`✅ Recherche terminée: ${result.bookings.length} résultats sur ${result.totalCount} total`);
        return response;
    }

    private validateRequest(request: BookingSearchRequestDTO): void {
        if (request.limit && request.limit <= 0) {
            throw new Error('Limit must be positive');
        }
        
        if (request.offset && request.offset < 0) {
            throw new Error('Offset must be non-negative');
        }

        if (request.dateFrom && request.dateTo) {
            const dateFrom = new Date(request.dateFrom);
            const dateTo = new Date(request.dateTo);
            if (dateFrom > dateTo) {
                throw new Error('dateFrom must be before dateTo');
            }
        }

        if (request.scheduledDateFrom && request.scheduledDateTo) {
            const scheduledDateFrom = new Date(request.scheduledDateFrom);
            const scheduledDateTo = new Date(request.scheduledDateTo);
            if (scheduledDateFrom > scheduledDateTo) {
                throw new Error('scheduledDateFrom must be before scheduledDateTo');
            }
        }

        if (request.minAmount && request.maxAmount && request.minAmount > request.maxAmount) {
            throw new Error('minAmount must be less than maxAmount');
        }
    }

    private convertToSearchCriteria(request: BookingSearchRequestDTO): BookingSearchCriteria {
        return {
            customerId: request.customerId,
            professionalId: request.professionalId,
            status: request.status,
            type: request.type,
            dateFrom: request.dateFrom ? new Date(request.dateFrom) : undefined,
            dateTo: request.dateTo ? new Date(request.dateTo) : undefined,
            minAmount: request.minAmount,
            maxAmount: request.maxAmount,
            scheduledDateFrom: request.scheduledDateFrom ? new Date(request.scheduledDateFrom) : undefined,
            scheduledDateTo: request.scheduledDateTo ? new Date(request.scheduledDateTo) : undefined,
            paymentMethod: request.paymentMethod,
            locationSearch: request.locationSearch,
            limit: request.limit,
            offset: request.offset,
            sortBy: request.sortBy,
            sortOrder: request.sortOrder
        };
    }
} 