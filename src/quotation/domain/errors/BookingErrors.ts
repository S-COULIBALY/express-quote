export class BookingNotFoundError extends Error {
    constructor(id: string) {
        super(`Booking with ID '${id}' not found`);
        this.name = 'BookingNotFoundError';
    }
}

export class BookingAlreadyCancelledError extends Error {
    constructor(id: string) {
        super(`Booking with ID '${id}' is already cancelled`);
        this.name = 'BookingAlreadyCancelledError';
    }
}

export class BookingCannotBeCancelledError extends Error {
    constructor(id: string, reason: string) {
        super(`Booking with ID '${id}' cannot be cancelled: ${reason}`);
        this.name = 'BookingCannotBeCancelledError';
    }
}

export class BookingAlreadyCompletedError extends Error {
    constructor(id: string) {
        super(`Booking with ID '${id}' is already completed`);
        this.name = 'BookingAlreadyCompletedError';
    }
}

export class BookingInvalidStatusTransitionError extends Error {
    constructor(id: string, currentStatus: string, newStatus: string) {
        super(`Invalid status transition for booking '${id}': from '${currentStatus}' to '${newStatus}'`);
        this.name = 'BookingInvalidStatusTransitionError';
    }
}

export class BookingPaymentRequiredError extends Error {
    constructor(id: string) {
        super(`Payment is required for booking '${id}' before it can be processed`);
        this.name = 'BookingPaymentRequiredError';
    }
}

export class BookingSearchCriteriaError extends Error {
    constructor(message: string) {
        super(`Invalid search criteria: ${message}`);
        this.name = 'BookingSearchCriteriaError';
    }
}

export class BookingUpdateNotAllowedError extends Error {
    constructor(id: string, reason: string) {
        super(`Booking with ID '${id}' cannot be updated: ${reason}`);
        this.name = 'BookingUpdateNotAllowedError';
    }
}

export class BookingDeletionNotAllowedError extends Error {
    constructor(id: string, reason: string) {
        super(`Booking with ID '${id}' cannot be deleted: ${reason}`);
        this.name = 'BookingDeletionNotAllowedError';
    }
}

export class BookingConcurrencyError extends Error {
    constructor(id: string) {
        super(`Booking with ID '${id}' was modified by another process. Please refresh and try again.`);
        this.name = 'BookingConcurrencyError';
    }
} 