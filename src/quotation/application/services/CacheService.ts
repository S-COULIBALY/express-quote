import { IRule } from '../../domain/interfaces/IRule';

export class CacheService {
    private static instance: CacheService;
    private cache: Map<string, { data: any; timestamp: number }>;
    private readonly DEFAULT_TTL = 3600000; // 1 heure en millisecondes

    private constructor() {
        this.cache = new Map();
    }

    static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now() + ttl
        });
    }

    get(key: string): any | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.timestamp) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    invalidateAll(): void {
        this.cache.clear();
    }
} 