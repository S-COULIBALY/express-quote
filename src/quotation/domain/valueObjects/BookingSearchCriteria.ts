import { BookingStatus } from '../enums/BookingStatus';
import { BookingType } from '../enums/BookingType';

export interface BookingSearchCriteria {
    customerId?: string;
    professionalId?: string;
    status?: BookingStatus;
    type?: BookingType;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
    scheduledDateFrom?: Date;
    scheduledDateTo?: Date;
    paymentMethod?: string;
    locationSearch?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'scheduledDate' | 'totalAmount';
    sortOrder?: 'asc' | 'desc';
}

export class BookingSearchCriteriaVO {
    private constructor(
        private readonly criteria: BookingSearchCriteria
    ) {}

    static create(criteria: BookingSearchCriteria): BookingSearchCriteriaVO {
        // Validation des critères
        if (criteria.limit && criteria.limit <= 0) {
            throw new Error('Limit must be positive');
        }
        if (criteria.offset && criteria.offset < 0) {
            throw new Error('Offset must be non-negative');
        }
        if (criteria.dateFrom && criteria.dateTo && criteria.dateFrom > criteria.dateTo) {
            throw new Error('DateFrom must be before DateTo');
        }
        if (criteria.scheduledDateFrom && criteria.scheduledDateTo && criteria.scheduledDateFrom > criteria.scheduledDateTo) {
            throw new Error('ScheduledDateFrom must be before ScheduledDateTo');
        }
        if (criteria.minAmount && criteria.maxAmount && criteria.minAmount > criteria.maxAmount) {
            throw new Error('MinAmount must be less than MaxAmount');
        }

        return new BookingSearchCriteriaVO(criteria);
    }

    get customerId(): string | undefined {
        return this.criteria.customerId;
    }

    get professionalId(): string | undefined {
        return this.criteria.professionalId;
    }

    get status(): BookingStatus | undefined {
        return this.criteria.status;
    }

    get type(): BookingType | undefined {
        return this.criteria.type;
    }

    get dateFrom(): Date | undefined {
        return this.criteria.dateFrom;
    }

    get dateTo(): Date | undefined {
        return this.criteria.dateTo;
    }

    get minAmount(): number | undefined {
        return this.criteria.minAmount;
    }

    get maxAmount(): number | undefined {
        return this.criteria.maxAmount;
    }

    get scheduledDateFrom(): Date | undefined {
        return this.criteria.scheduledDateFrom;
    }

    get scheduledDateTo(): Date | undefined {
        return this.criteria.scheduledDateTo;
    }

    get paymentMethod(): string | undefined {
        return this.criteria.paymentMethod;
    }

    get locationSearch(): string | undefined {
        return this.criteria.locationSearch;
    }

    get limit(): number {
        return this.criteria.limit || 50;
    }

    get offset(): number {
        return this.criteria.offset || 0;
    }

    get sortBy(): string {
        return this.criteria.sortBy || 'createdAt';
    }

    get sortOrder(): 'asc' | 'desc' {
        return this.criteria.sortOrder || 'desc';
    }

    get hasPagination(): boolean {
        return this.criteria.limit !== undefined || this.criteria.offset !== undefined;
    }

    get hasDateFilter(): boolean {
        return this.criteria.dateFrom !== undefined || this.criteria.dateTo !== undefined;
    }

    get hasAmountFilter(): boolean {
        return this.criteria.minAmount !== undefined || this.criteria.maxAmount !== undefined;
    }

    get hasScheduledDateFilter(): boolean {
        return this.criteria.scheduledDateFrom !== undefined || this.criteria.scheduledDateTo !== undefined;
    }

    toPlainObject(): BookingSearchCriteria {
        return { ...this.criteria };
    }
} 