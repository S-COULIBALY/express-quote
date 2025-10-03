import { BookingStatus } from '../../domain/enums/BookingStatus';
import { BookingType } from '../../domain/enums/BookingType';

export interface BookingSearchRequestDTO {
    customerId?: string;
    professionalId?: string;
    status?: BookingStatus;
    type?: BookingType;
    dateFrom?: string; // ISO string
    dateTo?: string; // ISO string
    minAmount?: number;
    maxAmount?: number;
    scheduledDateFrom?: string; // ISO string
    scheduledDateTo?: string; // ISO string
    paymentMethod?: string;
    locationSearch?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'scheduledDate' | 'totalAmount';
    sortOrder?: 'asc' | 'desc';
}

export interface BookingSearchResponseDTO {
    bookings: BookingResponseDTO[];
    totalCount: number;
    hasMore: boolean;
    offset: number;
    limit: number;
    searchCriteria: BookingSearchRequestDTO;
}

export interface BookingResponseDTO {
    id: string;
    type: BookingType;
    status: BookingStatus;
    customerId: string;
    professionalId?: string;
    totalAmount: number;
    currency: string;
    paymentMethod?: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    scheduledDate?: string; // ISO string
    location?: string;
    quoteRequestId?: string;
    
    // Relations optionnelles
    customer?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    
    professional?: {
        id: string;
        companyName: string;
        email: string;
        phone: string;
        rating?: number;
    };
    
    // Détails spécifiques selon le type
    movingDetails?: {
        pickupAddress: string;
        deliveryAddress: string;
        distance: number;
        volume: number;
        pickupFloor?: number;
        deliveryFloor?: number;
        pickupElevator: boolean;
        deliveryElevator: boolean;
        moveDate: string; // ISO string
    };
    
    // Méta-données
    canBeModified: boolean;
    canBeCancelled: boolean;
    canBeDeleted: boolean;
}

export interface BookingUpdateRequestDTO {
    status?: BookingStatus;
    scheduledDate?: string; // ISO string
    location?: string;
    paymentMethod?: string;
    professionalId?: string;
    notes?: string;
}

export interface BookingStatsResponseDTO {
    total: number;
    byStatus: Record<BookingStatus, number>;
    totalAmount: number;
    currency: string;
    averageAmount: number;
    
    // Statistiques temporelles
    thisMonth: {
        total: number;
        totalAmount: number;
    };
    
    lastMonth: {
        total: number;
        totalAmount: number;
    };
    
    // Tendances
    growth: {
        percentage: number;
        isPositive: boolean;
    };
}

export interface BookingCancelRequestDTO {
    reason?: string;
    refundRequested?: boolean;
    notifyCustomer?: boolean;
    notifyProfessional?: boolean;
} 