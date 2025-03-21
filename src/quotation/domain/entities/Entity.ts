import { v4 as uuidv4 } from 'uuid';

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