/**
 * 🗄️ CACHE REDIS POUR TEMPLATES - Performance Optimisée
 * 
 * Cache Redis pour templates fréquemment utilisés :
 * - Réduction de la latence de rendu des templates
 * - Cache intelligent avec TTL configurable
 * - Invalidation ciblée par template ID
 * - Métriques de hit/miss pour monitoring
 * - Compression automatique pour gros templates
 */

import Redis from 'ioredis';
import { ProductionLogger } from '../logging/logger.production';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  ttl: {
    template: number;      // TTL pour templates (défaut: 1h)
    renderedContent: number; // TTL pour contenu rendu (défaut: 15min)
  };
  compression: {
    enabled: boolean;
    minSize: number;       // Taille minimum pour compression (bytes)
  };
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  totalOperations: number;
}

export class TemplateCache {
  private redis: Redis | null = null;
  private logger: ProductionLogger;
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    totalOperations: 0
  };
  
  constructor(config?: Partial<CacheConfig>) {
    this.logger = new ProductionLogger();
    
    // Configuration par défaut
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_CACHE_DB || '1') // DB séparée pour le cache
      },
      ttl: {
        template: parseInt(process.env.TEMPLATE_CACHE_TTL || '3600'), // 1h
        renderedContent: parseInt(process.env.RENDERED_CACHE_TTL || '900') // 15min
      },
      compression: {
        enabled: process.env.CACHE_COMPRESSION === 'true',
        minSize: parseInt(process.env.COMPRESSION_MIN_SIZE || '1024') // 1KB
      },
      ...config
    };
  }
  
  /**
   * Initialiser le cache Redis
   */
  async initialize(): Promise<void> {
    this.logger.info('🗄️ Initializing template cache...');
    
    try {
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keyPrefix: 'notification:template:' // Préfixe pour éviter les collisions
      });
      
      // Test de connexion
      await this.redis.ping();
      this.logger.info('✅ Template cache initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Template cache initialization failed', { error });
      throw new Error(`Template cache initialization failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Récupérer un template depuis le cache
   */
  async getTemplate(templateId: string): Promise<any | null> {
    if (!this.redis) {
      this.logger.warn('⚠️ Template cache not initialized');
      return null;
    }
    
    try {
      const key = `template:${templateId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        this.metrics.hits++;
        this.updateMetrics();
        
        const template = this.decompress(cached);
        this.logger.debug('✅ Template cache hit', { templateId });
        return JSON.parse(template);
      }
      
      this.metrics.misses++;
      this.updateMetrics();
      this.logger.debug('❌ Template cache miss', { templateId });
      return null;
      
    } catch (error) {
      this.logger.error('❌ Error getting template from cache', { templateId, error });
      return null;
    }
  }
  
  /**
   * Stocker un template dans le cache
   */
  async setTemplate(templateId: string, template: any): Promise<void> {
    if (!this.redis) {
      this.logger.warn('⚠️ Template cache not initialized');
      return;
    }
    
    try {
      const key = `template:${templateId}`;
      const serialized = JSON.stringify(template);
      const compressed = this.compress(serialized);
      
      await this.redis.setex(key, this.config.ttl.template, compressed);
      
      this.metrics.sets++;
      this.updateMetrics();
      
      this.logger.debug('✅ Template cached', { 
        templateId, 
        size: serialized.length,
        compressed: compressed.length,
        ttl: this.config.ttl.template
      });
      
    } catch (error) {
      this.logger.error('❌ Error setting template in cache', { templateId, error });
    }
  }
  
  /**
   * Récupérer du contenu rendu depuis le cache
   */
  async getRenderedContent(templateId: string, variablesHash: string): Promise<string | null> {
    if (!this.redis) {
      return null;
    }
    
    try {
      const key = `rendered:${templateId}:${variablesHash}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        this.metrics.hits++;
        this.updateMetrics();
        
        const content = this.decompress(cached);
        this.logger.debug('✅ Rendered content cache hit', { templateId, variablesHash });
        return content;
      }
      
      this.metrics.misses++;
      this.updateMetrics();
      return null;
      
    } catch (error) {
      this.logger.error('❌ Error getting rendered content from cache', { 
        templateId, 
        variablesHash, 
        error 
      });
      return null;
    }
  }
  
  /**
   * Stocker du contenu rendu dans le cache
   */
  async setRenderedContent(
    templateId: string, 
    variablesHash: string, 
    content: string
  ): Promise<void> {
    if (!this.redis) {
      return;
    }
    
    try {
      const key = `rendered:${templateId}:${variablesHash}`;
      const compressed = this.compress(content);
      
      await this.redis.setex(key, this.config.ttl.renderedContent, compressed);
      
      this.metrics.sets++;
      this.updateMetrics();
      
      this.logger.debug('✅ Rendered content cached', { 
        templateId, 
        variablesHash,
        size: content.length,
        compressed: compressed.length,
        ttl: this.config.ttl.renderedContent
      });
      
    } catch (error) {
      this.logger.error('❌ Error setting rendered content in cache', { 
        templateId, 
        variablesHash, 
        error 
      });
    }
  }
  
  /**
   * Invalider le cache d'un template spécifique
   */
  async invalidateTemplate(templateId: string): Promise<void> {
    if (!this.redis) {
      return;
    }
    
    try {
      // Supprimer le template lui-même
      const templateKey = `template:${templateId}`;
      await this.redis.del(templateKey);
      
      // Supprimer tous les contenus rendus pour ce template
      const pattern = `rendered:${templateId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      this.metrics.deletes += keys.length + 1;
      this.updateMetrics();
      
      this.logger.info('✅ Template cache invalidated', { 
        templateId, 
        deletedKeys: keys.length + 1 
      });
      
    } catch (error) {
      this.logger.error('❌ Error invalidating template cache', { templateId, error });
    }
  }
  
  /**
   * Vider tout le cache
   */
  async clear(): Promise<void> {
    if (!this.redis) {
      return;
    }
    
    try {
      await this.redis.flushdb();
      
      // Reset des métriques
      this.metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
        totalOperations: 0
      };
      
      this.logger.info('✅ Template cache cleared');
      
    } catch (error) {
      this.logger.error('❌ Error clearing template cache', { error });
    }
  }
  
  /**
   * Comprimer du contenu si nécessaire
   */
  private compress(content: string): string {
    if (!this.config.compression.enabled || content.length < this.config.compression.minSize) {
      return content;
    }
    
    // Simple compression basique (en production, utiliser zlib)
    // Pour l'instant, on retourne tel quel - TODO: implémenter vraie compression
    return content;
  }
  
  /**
   * Décomprimer du contenu
   */
  private decompress(content: string): string {
    // Matching avec compress() - pour l'instant pas de compression
    return content;
  }
  
  /**
   * Mettre à jour les métriques
   */
  private updateMetrics(): void {
    this.metrics.totalOperations = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = this.metrics.totalOperations > 0 
      ? (this.metrics.hits / this.metrics.totalOperations) * 100 
      : 0;
  }
  
  /**
   * Obtenir les métriques de performance
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Obtenir les statistiques du cache Redis
   */
  async getCacheStats(): Promise<any> {
    if (!this.redis) {
      return null;
    }
    
    try {
      const info = await this.redis.info('memory');
      const keyspaceInfo = await this.redis.info('keyspace');
      
      // Compter les clés par type
      const templateKeys = await this.redis.keys('template:*');
      const renderedKeys = await this.redis.keys('rendered:*');
      
      return {
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspaceInfo),
        keys: {
          templates: templateKeys.length,
          rendered: renderedKeys.length,
          total: templateKeys.length + renderedKeys.length
        },
        metrics: this.getMetrics()
      };
      
    } catch (error) {
      this.logger.error('❌ Error getting cache stats', { error });
      return null;
    }
  }
  
  /**
   * Parser les infos Redis
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    info.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });
    
    return result;
  }
  
  /**
   * Vérifier l'état de santé du cache
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    latency?: number;
    error?: string;
    stats?: any;
  }> {
    if (!this.redis) {
      return {
        isHealthy: false,
        error: 'Redis connection not established'
      };
    }
    
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const latency = Date.now() - startTime;
      
      const stats = await this.getCacheStats();
      
      return {
        isHealthy: true,
        latency,
        stats
      };
      
    } catch (error) {
      return {
        isHealthy: false,
        error: (error as Error).message
      };
    }
  }
  
  /**
   * Fermer la connexion Redis
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.logger.info('✅ Template cache closed');
    }
  }
}