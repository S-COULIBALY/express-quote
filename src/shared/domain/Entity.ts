/**
 * Classe abstraite représentant une entité avec un identifiant unique
 */
export abstract class Entity {
    protected readonly id: string;
    private readonly createdAt: Date;
    
    constructor(id: string) {
        this.id = id;
        this.createdAt = new Date();
    }
    
    /**
     * Obtient l'identifiant unique de l'entité
     */
    public getId(): string {
        return this.id;
    }
    
    /**
     * Obtient la date de création de l'entité
     */
    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }
    
    /**
     * Compare si deux entités sont égales en comparant leurs identifiants
     * @param entity L'entité avec laquelle comparer
     */
    public equals(entity: Entity): boolean {
        if (entity === null || entity === undefined) {
            return false;
        }
        
        if (this === entity) {
            return true;
        }
        
        return this.id === entity.id;
    }
} 