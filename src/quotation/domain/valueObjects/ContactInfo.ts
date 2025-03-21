export class ContactInfo {
    constructor(
        private readonly firstName: string,
        private readonly lastName: string,
        private readonly email: string,
        private readonly phone: string
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.firstName || this.firstName.trim().length === 0) {
            throw new Error('First name is required');
        }
        if (!this.lastName || this.lastName.trim().length === 0) {
            throw new Error('Last name is required');
        }
        if (!this.isValidEmail(this.email)) {
            throw new Error('Invalid email format');
        }
        if (!this.isValidPhone(this.phone)) {
            throw new Error('Invalid phone format');
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPhone(phone: string): boolean {
        // Format français: +33612345678 ou 0612345678
        const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
        return phoneRegex.test(phone);
    }

    public getFirstName(): string {
        return this.firstName;
    }

    public getLastName(): string {
        return this.lastName;
    }

    public getFullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    public getEmail(): string {
        return this.email;
    }

    public getPhone(): string {
        return this.phone;
    }

    public equals(other: ContactInfo): boolean {
        return this.firstName === other.firstName &&
            this.lastName === other.lastName &&
            this.email === other.email &&
            this.phone === other.phone;
    }
} 