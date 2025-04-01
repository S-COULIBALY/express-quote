/**
 * Entité de base avec identifiant unique
 * 
 * Cette classe abstraite fournit les fonctionnalités communes
 * à toutes les entités du système.
 */

// Implémentation locale de uuidv4 pour les tests
// Remplace l'import de uuid qui cause des problèmes avec Jest
function uuidv4(): string {
    // Implémentation simple qui génère un UUID v4 pour les tests
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx où x est hex et y est 8, 9, A, ou B
    const hex = '0123456789abcdef';
    let uuid = '';
    
    for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            uuid += '-';
        } else if (i === 14) {
            uuid += '4'; // Version 4
        } else if (i === 19) {
            uuid += hex[Math.floor(Math.random() * 4) + 8]; // Variante (8, 9, A, ou B)
        } else {
            uuid += hex[Math.floor(Math.random() * 16)];
        }
    }
    
    return uuid;
}

export type UniqueId = string;

export abstract class Entity {
    protected readonly id: UniqueId;

    constructor(id?: UniqueId) {
        this.id = id || uuidv4();
    }

    public getId(): UniqueId {
        return this.id;
    }

    public equals(other: Entity): boolean {
        if (!(other instanceof Entity)) {
            return false;
        }
        return this.id === other.id;
    }
} 