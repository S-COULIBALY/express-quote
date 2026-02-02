/**
 * 🎯 Service de données unifié - Accès centralisé à la table Configuration
 *
 * Ce service centralise l'accès aux configurations (table Configuration).
 * Le calcul de prix utilise quotation-module (MODULES_CONFIG).
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../../../lib/logger";

/** Seul le service MOVING (déménagement sur mesure) est actif. Autres valeurs conservées pour compatibilité anciennes données. */
export enum ServiceType {
  MOVING = "MOVING",
  /** @deprecated Service abandonné */
  CLEANING = "CLEANING",
  /** @deprecated Service abandonné */
  PACKING = "PACKING",
  /** @deprecated Service abandonné */
  DELIVERY = "DELIVERY",
  SERVICE = "SERVICE",
}

export enum RuleType {
  CONSTRAINT = "CONSTRAINT",
  BUSINESS = "BUSINESS",
  PRICING = "PRICING",
  TEMPORAL = "TEMPORAL",
  GEOGRAPHIC = "GEOGRAPHIC",
  VOLUME = "VOLUME",
  CUSTOM = "CUSTOM",
}

export enum RuleCategory {
  REDUCTION = "REDUCTION",
  SURCHARGE = "SURCHARGE",
  MINIMUM = "MINIMUM",
  MAXIMUM = "MAXIMUM",
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
}

export enum ConfigurationCategory {
  PRICING = "PRICING",
  EMAIL_CONFIG = "EMAIL_CONFIG",
  SERVICE_PARAMS = "SERVICE_PARAMS",
  TECHNICAL_LIMITS = "TECHNICAL_LIMITS",
  TIME_CONFIG = "TIME_CONFIG",
  TRANSPORT_CONFIG = "TRANSPORT_CONFIG",
  GEOGRAPHIC_CONFIG = "GEOGRAPHIC_CONFIG",
  INSURANCE_CONFIG = "INSURANCE_CONFIG",
  BUSINESS_RULES = "BUSINESS_RULES",
  LIMITS = "LIMITS",
  PRICING_FACTORS = "PRICING_FACTORS",
  THRESHOLDS = "THRESHOLDS",
  SYSTEM_METRICS = "SYSTEM_METRICS",
}

export interface UnifiedRule {
  id: string;
  name: string;
  description?: string;
  serviceType: ServiceType;
  ruleType: RuleType;
  category: RuleCategory;
  value: number;
  percentBased: boolean;
  priority: number;
  validFrom: Date;
  validTo?: Date;
  tags: string[];
  configKey?: string;
  metadata?: any;
  condition?: any;
  isActive: boolean;
  scope?: 'GLOBAL' | 'PICKUP' | 'DELIVERY' | 'BOTH';
}

export interface UnifiedConfiguration {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleQuery {
  serviceType?: ServiceType;
  ruleType?: RuleType;
  category?: RuleCategory;
  tags?: string[];
  onlyActive?: boolean;
  scope?: 'GLOBAL' | 'PICKUP' | 'DELIVERY' | 'BOTH';
  addressType?: 'pickup' | 'delivery' | 'both';
}

export interface ConfigurationQuery {
  category?: ConfigurationCategory;
  key?: string;
  onlyActive?: boolean;
}

/**
 * Service unifié pour la gestion des configurations
 * Les méthodes getRules* retournent [] pour compatibilité (calcul dans quotation-module).
 */
export class UnifiedDataService {
  private static instance: UnifiedDataService;
  private prisma: PrismaClient;

  // Cache pour configurations
  private configCache: Map<string, UnifiedConfiguration[]> = new Map();
  private configTimestamp: Map<string, number> = new Map();

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  // ========================================
  // RÈGLES (obsolète - retourne [] pour compatibilité)
  // ========================================

  /**
   * @deprecated Utilisez quotation-module. Retourne [] pour compatibilité.
   */
  async getRules(_query: RuleQuery = {}): Promise<UnifiedRule[]> {
    return [];
  }

  /** @deprecated */
  async getConstraintRules(_serviceType: ServiceType): Promise<UnifiedRule[]> {
    return [];
  }

  /** @deprecated */
  async getBusinessRules(
    _serviceType?: ServiceType,
    _options?: { addressType?: 'pickup' | 'delivery' | 'both' }
  ): Promise<UnifiedRule[]> {
    return [];
  }

  /** @deprecated */
  async getTemporalRules(_serviceType?: ServiceType): Promise<UnifiedRule[]> {
    return [];
  }

  // ========================================
  // GESTION DES CONFIGURATIONS (Table Configuration)
  // ========================================

  /**
   * Récupère les configurations depuis la table Configuration
   */
  async getConfigurations(
    query: ConfigurationQuery = {},
  ): Promise<UnifiedConfiguration[]> {
    const cacheKey = `config_${JSON.stringify(query)}`;

    // Vérifier le cache
    if (this.isCacheValid(cacheKey, this.configTimestamp)) {
      const cachedConfigs = this.configCache.get(cacheKey);
      if (cachedConfigs) {
        logger.debug(`📦 Cache hit pour les configurations: ${cacheKey}`);
        return cachedConfigs;
      }
    }

    try {
      const where: any = {};

      if (query.category) where.category = query.category;
      if (query.key) where.key = query.key;
      if (query.onlyActive !== false) where.isActive = true;

      const configurations = await this.prisma.configuration.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const unifiedConfigs: UnifiedConfiguration[] = configurations.map(
        (config) => ({
          id: config.id,
          key: config.key,
          value: config.value,
          description: config.description || undefined,
          category: config.category,
          isActive: config.isActive,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        }),
      );

      // Mettre en cache
      this.configCache.set(cacheKey, unifiedConfigs);
      this.configTimestamp.set(cacheKey, Date.now());

      logger.info(`⚙️ [UnifiedDataService] ${unifiedConfigs.length} config chargée (${query.key || query.category || 'ALL'})`);
      return unifiedConfigs;
    } catch (error) {
      logger.error(
        error as Error,
        `❌ Erreur lors du chargement des configurations: ${cacheKey}`,
      );
      return [];
    }
  }

  /**
   * Récupère une configuration spécifique par clé
   */
  async getConfigurationValue<T>(
    category: ConfigurationCategory,
    key: string,
    defaultValue: T,
  ): Promise<T> {
    try {
      const configurations = await this.getConfigurations({
        category,
        key,
        onlyActive: true,
      });

      if (configurations.length > 0) {
        return configurations[0].value as T;
      }

      logger.warn(
        `⚠️ Configuration non trouvée: ${category}.${key}, utilisation de la valeur par défaut`,
      );
      return defaultValue;
    } catch (error) {
      logger.error(
        error as Error,
        `❌ Erreur lors de la récupération de ${category}.${key}`,
      );
      return defaultValue;
    }
  }

  /**
   * Évalue une règle avec des conditions
   * @deprecated Utilisez le système modulaire quotation-module à la place
   */
  evaluateRule(
    rule: UnifiedRule,
    context: Record<string, any>,
  ): { applies: boolean; value: number } {
    if (!rule.condition) {
      return { applies: true, value: rule.value };
    }

    try {
      const condition = rule.condition;

      if (condition.when?.dayOfWeek) {
        const currentDay = new Date()
          .toLocaleDateString("en", { weekday: "long" })
          .toLowerCase();
        if (!condition.when.dayOfWeek.includes(currentDay)) {
          return { applies: false, value: 0 };
        }
      }

      if (condition.when?.volumeGreaterThan && context.volume) {
        if (context.volume <= condition.when.volumeGreaterThan) {
          return { applies: false, value: 0 };
        }
      }

      return { applies: true, value: rule.value };
    } catch (error) {
      logger.error(
        error as Error,
        `❌ Erreur lors de l'évaluation de la règle ${rule.id}`,
      );
      return { applies: false, value: 0 };
    }
  }

  // ========================================
  // GESTION DU CACHE
  // ========================================

  /**
   * Vide tous les caches
   */
  clearAllCaches(): void {
    this.configCache.clear();
    this.configTimestamp.clear();
    logger.info("🗑️ Tous les caches vidés");
  }

  /**
   * Invalide le cache
   */
  invalidateCache(serviceType?: ServiceType): void {
    this.clearAllCaches();
  }

  // ========================================
  // MISE À JOUR DES CONFIGURATIONS
  // ========================================

  /**
   * Met à jour une configuration et invalide le cache
   */
  async updateConfiguration(
    category: ConfigurationCategory,
    key: string,
    value: any,
    description?: string,
  ): Promise<void> {
    try {
      logger.info(`🔧 Mise à jour configuration ${category}.${key} = ${value}`);

      await this.prisma.configuration.upsert({
        where: {
          category_key: {
            category: category as string,
            key,
          },
        },
        create: {
          id: `${category}_${key}_${Date.now()}`,
          key,
          category: category as string,
          value,
          description: description || `Configuration ${key}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          value,
          description: description || undefined,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      this.configCache.clear();
      this.configTimestamp.clear();

      logger.info(
        `✅ Configuration ${category}.${key} mise à jour avec succès`,
      );
    } catch (error) {
      logger.error(
        error as Error,
        `❌ Erreur mise à jour configuration ${category}.${key}`,
      );
      throw error;
    }
  }

  // ========================================
  // MÉTHODES PRIVÉES
  // ========================================

  private isCacheValid(
    cacheKey: string,
    timestampMap: Map<string, number>,
  ): boolean {
    const timestamp = timestampMap.get(cacheKey);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_TTL;
  }
}
