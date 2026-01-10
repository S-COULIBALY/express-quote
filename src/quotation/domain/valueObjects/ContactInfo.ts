/**
 * Objet-valeur représentant les informations de contact d'une personne
 */
export class ContactInfo {
    private readonly firstName: string;
    private readonly lastName: string;
    private readonly email: string;
    private readonly phone: string;
    private readonly preferredLanguage?: string;

    constructor(
        firstName: string,
        lastName: string,
        email: string,
        phone: string,
        preferredLanguage: string = 'fr'
    ) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.preferredLanguage = preferredLanguage;
        this.validate();
    }

    private validate(): void {
        if (!this.firstName) {
            throw new Error('First name is required');
        }
        if (!this.lastName) {
            throw new Error('Last name is required');
        }
        if (!this.email) {
            throw new Error('Email is required');
        }
        if (!this.validateEmail(this.email)) {
            throw new Error('Invalid email format');
        }
        if (!this.phone || this.phone.trim() === '') {
            throw new Error('Phone number is required');
        }
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    public getPreferredLanguage(): string | undefined {
        return this.preferredLanguage;
    }

    public toDTO(): Record<string, any> {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            preferredLanguage: this.preferredLanguage
        };
    }
} 