/**
 * 🎯 Service de données unifié - Accès centralisé aux tables Rule + Configuration
 *
 * Ce service remplace ConfigurationCacheService et centralise l'accès à TOUTES les données :
 * - Table Rule : 106 règles (58 CONSTRAINT + 47 BUSINESS + autres)
 * - Table Configuration : 100 configurations (PRICING, EMAIL_CONFIG, etc.)
 *
 * Features:
 * - Cache intelligent avec TTL
 * - Fallback vers DefaultValues
 * - Feature flags pour migration progressive
 * - API unifiée pour calculateurs et formulaires
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../../../lib/logger";
import { DefaultValues } from "../../domain/configuration/DefaultValues";

export enum ServiceType {
  MOVING = "MOVING",
  CLEANING = "CLEANING",
  PACKING = "PACKING",
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
  BUSINESS_RULES = "BUSINESS_RULES", // Ajouté pour compatibilité avec adminRules.ts
  LIMITS = "LIMITS", // Ajouté pour compatibilité avec adminRules.ts

  // NOUVELLES CATÉGORIES - Migration des données hardcodées
  PRICING_FACTORS = "PRICING_FACTORS", // Facteurs et multiplicateurs de pricing
  THRESHOLDS = "THRESHOLDS", // Seuils et conditions métier
  SYSTEM_METRICS = "SYSTEM_METRICS", // Coordonnées et métriques système
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
}

export interface ConfigurationQuery {
  category?: ConfigurationCategory;
  key?: string;
  onlyActive?: boolean;
}

/**
 * Service unifié pour la gestion des règles ET configurations
 */
export class UnifiedDataService {
  private static instance: UnifiedDataService;
  private prisma: PrismaClient;

  // Caches séparés
  private ruleCache: Map<string, UnifiedRule[]> = new Map();
  private configCache: Map<string, UnifiedConfiguration[]> = new Map();
  private ruleTimestamp: Map<string, number> = new Map();
  private configTimestamp: Map<string, number> = new Map();

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private useUnifiedSystem = true; // Feature flag

  private constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  /**
   * Active/désactive le système unifié (feature flag)
   */
  setUnifiedSystemEnabled(enabled: boolean): void {
    this.useUnifiedSystem = enabled;
    this.clearAllCaches();
    logger.info(`🎛️ Système unifié ${enabled ? "activé" : "désactivé"}`);
  }

  // ========================================
  // GESTION DES RÈGLES (Table Rule)
  // ========================================

  /**
   * Récupère les règles depuis la table Rule
   */
  async getRules(query: RuleQuery = {}): Promise<UnifiedRule[]> {
    if (!this.useUnifiedSystem) {
      return this.getFallbackRules(query);
    }

    const cacheKey = `rules_${JSON.stringify(query)}`;

    // Vérifier le cache
    if (this.isCacheValid(cacheKey, this.ruleTimestamp)) {
      const cachedRules = this.ruleCache.get(cacheKey);
      if (cachedRules) {
        logger.debug(`📦 Cache hit pour les règles: ${cacheKey}`);
        return cachedRules;
      }
    }

    try {
      logger.debug(`🔍 Recherche des règles: ${JSON.stringify(query)}`);

      const where: any = {};

      if (query.serviceType) where.serviceType = query.serviceType;
      if (query.ruleType) where.ruleType = query.ruleType;
      if (query.category) where.category = query.category;
      if (query.onlyActive !== false) where.isActive = true;

      // Filtrage par validité temporelle
      where.validFrom = { lte: new Date() };
      where.OR = [{ validTo: null }, { validTo: { gte: new Date() } }];

      // Filtrage par tags si spécifié
      if (query.tags && query.tags.length > 0) {
        where.tags = { hasSome: query.tags };
      }

      const rules = await this.prisma.rule.findMany({
        where,
        orderBy: { priority: "asc" },
      });

      const unifiedRules: UnifiedRule[] = rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || undefined,
        serviceType: rule.serviceType as ServiceType,
        ruleType: rule.ruleType as RuleType,
        category: rule.category as RuleCategory,
        value: rule.value,
        percentBased: rule.percentBased,
        priority: rule.priority,
        validFrom: rule.validFrom,
        validTo: rule.validTo || undefined,
        tags: rule.tags,
        configKey: rule.configKey || undefined,
        metadata: rule.metadata || undefined,
        condition: rule.condition || undefined,
        isActive: rule.isActive,
      }));

      // Mettre en cache
      this.ruleCache.set(cacheKey, unifiedRules);
      this.ruleTimestamp.set(cacheKey, Date.now());

      logger.info(`✅ ${unifiedRules.length} règles chargées pour ${cacheKey}`);
      return unifiedRules;
    } catch (error) {
      logger.error(
        error as Error,
        `❌ Erreur lors du chargement des règles: ${cacheKey}`,
      );
      return this.getFallbackRules(query);
    }
  }

  /**
   * Récupère les règles de contraintes pour les modaux
   */
  async getConstraintRules(serviceType: ServiceType): Promise<UnifiedRule[]> {
    return this.getRules({
      serviceType,
      ruleType: RuleType.CONSTRAINT,
      onlyActive: true,
    });
  }

  /**
   * Récupère les règles métier pour les calculateurs
   */
  async getBusinessRules(serviceType?: ServiceType): Promise<UnifiedRule[]> {
    return this.getRules({
      serviceType,
      ruleType: RuleType.BUSINESS,
      onlyActive: true,
    });
  }

  /**
   * Convertit les règles unifiées en objets Rule pour le RuleEngine
   */
  async getBusinessRulesForEngine(
    serviceType?: ServiceType,
  ): Promise<import("../../domain/valueObjects/Rule").Rule[]> {
    try {
      const unifiedRules = await this.getBusinessRules(serviceType);
      const { Rule } = await import("../../domain/valueObjects/Rule");

      return unifiedRules.map(
        (unifiedRule) =>
          new Rule(
            unifiedRule.name,
            unifiedRule.serviceType,
            unifiedRule.value,
            unifiedRule.condition ? JSON.stringify(unifiedRule.condition) : "",
            unifiedRule.isActive,
            unifiedRule.id,
            unifiedRule.percentBased,
          ),
      );
    } catch (error) {
      logger.error(
        error as Error,
        `❌ Erreur lors de la conversion des règles pour ${serviceType}`,
      );
      return [];
    }
  }

  /**
   * Récupère les règles temporelles (week-end, saisonnalité, etc.)
   */
  async getTemporalRules(serviceType?: ServiceType): Promise<UnifiedRule[]> {
    return this.getRules({
      serviceType,
      ruleType: RuleType.TEMPORAL,
      onlyActive: true,
    });
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
      logger.debug(`🔍 Recherche des configurations: ${JSON.stringify(query)}`);

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

      logger.info(
        `✅ ${unifiedConfigs.length} configurations chargées pour ${cacheKey}`,
      );
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

  // ========================================
  // API UNIFIÉE POUR CALCULATEURS
  // ========================================

  /**
   * Récupère toutes les constantes de pricing (Rule + Configuration)
   */
  async getAllPricingConstants(
    serviceType?: ServiceType,
  ): Promise<Record<string, number>> {
    try {
      const constants: Record<string, number> = {};

      // 1. Récupérer les règles de pricing depuis Rule
      const pricingRules = await this.getRules({
        serviceType,
        ruleType: RuleType.PRICING,
        onlyActive: true,
      });

      for (const rule of pricingRules) {
        if (rule.configKey) {
          constants[rule.configKey] = rule.value;
        }
      }

      // 2. Récupérer les configurations de pricing depuis Configuration
      const pricingConfigs = await this.getConfigurations({
        category: ConfigurationCategory.PRICING,
        onlyActive: true,
      });

      for (const config of pricingConfigs) {
        constants[config.key] =
          typeof config.value === "number"
            ? config.value
            : parseFloat(config.value) || 0;
      }

      // 3. Fallback vers DefaultValues si nécessaire
      if (Object.keys(constants).length === 0) {
        logger.warn(
          `⚠️ Aucune constante de pricing trouvée, utilisation du fallback`,
        );
        return this.getFallbackPricingConstants(serviceType);
      }

      logger.info(
        `💰 ${Object.keys(constants).length} constantes de pricing chargées`,
      );
      return constants;
    } catch (error) {
      logger.error(
        error as Error,
        `❌ Erreur lors du chargement des constantes de pricing`,
      );
      return this.getFallbackPricingConstants(serviceType);
    }
  }

  /**
   * Évalue une règle avec des conditions
   */
  evaluateRule(
    rule: UnifiedRule,
    context: Record<string, any>,
  ): { applies: boolean; value: number } {
    // Si pas de condition, la règle s'applique toujours
    if (!rule.condition) {
      return { applies: true, value: rule.value };
    }

    try {
      const condition = rule.condition;

      // Conditions temporelles
      if (condition.when?.dayOfWeek) {
        const currentDay = new Date()
          .toLocaleDateString("en", { weekday: "long" })
          .toLowerCase();
        if (!condition.when.dayOfWeek.includes(currentDay)) {
          return { applies: false, value: 0 };
        }
      }

      // Conditions de volume
      if (condition.when?.volumeGreaterThan && context.volume) {
        if (context.volume <= condition.when.volumeGreaterThan) {
          return { applies: false, value: 0 };
        }
      }

      // Autres conditions métier...

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
    this.ruleCache.clear();
    this.configCache.clear();
    this.ruleTimestamp.clear();
    this.configTimestamp.clear();
    logger.info("🗑️ Tous les caches vidés");
  }

  /**
   * Invalide le cache pour un service spécifique
   */
  invalidateCache(serviceType?: ServiceType): void {
    if (serviceType) {
      const keysToDelete = Array.from(this.ruleCache.keys()).filter((key) =>
        key.includes(serviceType),
      );
      keysToDelete.forEach((key) => {
        this.ruleCache.delete(key);
        this.ruleTimestamp.delete(key);
      });
      logger.info(`🗑️ Cache invalidé pour ${serviceType}`);
    } else {
      this.clearAllCaches();
    }
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

      // Mettre à jour en base de données
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

      // Invalider le cache des configurations
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

  private getFallbackRules(query: RuleQuery): UnifiedRule[] {
    logger.warn(
      `🔄 Utilisation des règles de fallback depuis DefaultValues pour ${query.serviceType || "ALL"}`,
    );

    const fallbackRules: UnifiedRule[] = [];
    const now = new Date();

    // 🎯 RÈGLES SPÉCIFIQUES PAR SERVICE TYPE
    if (query.serviceType) {
      const serviceKey = query.serviceType as
        | "MOVING"
        | "CLEANING"
        | "DELIVERY";
      const defaultRules = DefaultValues.getDefaultRulesForService(serviceKey);

      // Convertir les contraintes en UnifiedRule
      if (!query.category || query.category === RuleCategory.SURCHARGE) {
        defaultRules.constraints.forEach((rule, index) => {
          fallbackRules.push({
            id: `fallback-${serviceKey.toLowerCase()}-constraint-${rule.id}`,
            name: rule.name,
            description: rule.description,
            serviceType: query.serviceType!,
            ruleType: RuleType.BUSINESS,
            category:
              rule.category === "FIXED"
                ? RuleCategory.FIXED
                : RuleCategory.SURCHARGE,
            value: rule.value,
            percentBased: rule.category !== "FIXED",
            priority: 900 + index,
            validFrom: now,
            tags: ["fallback", "constraint"],
            isActive: true,
          });
        });
      }

      // Convertir les services en UnifiedRule
      if (!query.category || query.category === RuleCategory.FIXED) {
        defaultRules.services.forEach((rule, index) => {
          fallbackRules.push({
            id: `fallback-${serviceKey.toLowerCase()}-service-${rule.id}`,
            name: rule.name,
            description: rule.description,
            serviceType: query.serviceType!,
            ruleType: RuleType.BUSINESS,
            category: RuleCategory.FIXED,
            value: rule.value,
            percentBased: false,
            priority: 950 + index,
            validFrom: now,
            tags: ["fallback", "service"],
            isActive: true,
          });
        });
      }
    } else {
      // 🌐 RÈGLES GLOBALES POUR TOUS LES SERVICES
      const allDefaultRules = DefaultValues.getAllDefaultRules();
      let ruleIndex = 0;

      Object.entries(allDefaultRules).forEach(([serviceKey, rules]) => {
        const serviceType = serviceKey as ServiceType;

        // Contraintes
        rules.constraints.forEach((rule) => {
          fallbackRules.push({
            id: `fallback-${serviceKey.toLowerCase()}-constraint-${rule.id}`,
            name: rule.name,
            description: rule.description,
            serviceType,
            ruleType: RuleType.BUSINESS,
            category:
              rule.category === "FIXED"
                ? RuleCategory.FIXED
                : RuleCategory.SURCHARGE,
            value: rule.value,
            percentBased: rule.category !== "FIXED",
            priority: 900 + ruleIndex++,
            validFrom: now,
            tags: ["fallback", "constraint"],
            isActive: true,
          });
        });

        // Services
        rules.services.forEach((rule) => {
          fallbackRules.push({
            id: `fallback-${serviceKey.toLowerCase()}-service-${rule.id}`,
            name: rule.name,
            description: rule.description,
            serviceType,
            ruleType: RuleType.BUSINESS,
            category: RuleCategory.FIXED,
            value: rule.value,
            percentBased: false,
            priority: 950 + ruleIndex++,
            validFrom: now,
            tags: ["fallback", "service"],
            isActive: true,
          });
        });
      });
    }

    // 🔽 FILTRAGE SELON LA QUERY
    let filteredRules = fallbackRules;

    if (query.ruleType) {
      filteredRules = filteredRules.filter(
        (rule) => rule.ruleType === query.ruleType,
      );
    }

    if (query.category) {
      filteredRules = filteredRules.filter(
        (rule) => rule.category === query.category,
      );
    }

    if (query.tags && query.tags.length > 0) {
      filteredRules = filteredRules.filter((rule) =>
        query.tags!.some((tag) => rule.tags.includes(tag)),
      );
    }

    logger.info(
      `✅ ${filteredRules.length} règles de fallback générées pour ${query.serviceType || "ALL"}`,
    );
    return filteredRules;
  }

  private getFallbackPricingConstants(
    serviceType?: ServiceType,
  ): Record<string, number> {
    switch (serviceType) {
      case ServiceType.MOVING:
        return {
          MOVING_BASE_PRICE_PER_M3: DefaultValues.MOVING_BASE_PRICE_PER_M3,
          MOVING_DISTANCE_PRICE_PER_KM:
            DefaultValues.MOVING_DISTANCE_PRICE_PER_KM, // ✅ Corrigé
          MOVING_TRUCK_PRICE: DefaultValues.MOVING_TRUCK_PRICE, // ✅ Corrigé
          SERVICE_WORKER_PRICE_PER_HOUR:
            DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR, // ✅ Corrigé
          FUEL_PRICE_PER_LITER: DefaultValues.FUEL_PRICE_PER_LITER,
          TOLL_COST_PER_KM: DefaultValues.TOLL_COST_PER_KM,
          MOVING_FREE_DISTANCE_KM: DefaultValues.MOVING_FREE_DISTANCE_KM, // ✅ Corrigé
        };
      case ServiceType.PACKING:
        return {
          PACK_WORKER_PRICE: DefaultValues.PACKING_WORKER_PRICE,
          PACK_INCLUDED_DISTANCE: DefaultValues.INCLUDED_DISTANCE,
          PACK_EXTRA_KM_PRICE: DefaultValues.UNIT_PRICE_PER_KM, // ✅ Corrigé (utiliser UNIT_PRICE_PER_KM qui existe)
          SERVICE_WORKER_PRICE_PER_HOUR:
            DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR, // ✅ Corrigé
        };
      case ServiceType.CLEANING:
        return {
          CLEANING_PRICE_PER_M2: DefaultValues.CLEANING_PRICE_PER_M2,
          CLEANING_WORKER_PRICE: DefaultValues.CLEANING_WORKER_PRICE,
          CLEANING_WORKER_HOUR_RATE: DefaultValues.CLEANING_WORKER_HOUR_RATE,
          CLEANING_MINIMUM_PRICE: DefaultValues.CLEANING_MINIMUM_PRICE,
        };
      case ServiceType.DELIVERY:
        return {
          DELIVERY_BASE_PRICE: DefaultValues.DELIVERY_BASE_PRICE,
          DELIVERY_PRICE_PER_KM: DefaultValues.DELIVERY_PRICE_PER_KM,
          DELIVERY_WORKER_HOUR_RATE: DefaultValues.DELIVERY_WORKER_HOUR_RATE,
          DELIVERY_WEIGHT_SURCHARGE: DefaultValues.DELIVERY_WEIGHT_SURCHARGE,
        };
      case ServiceType.SERVICE:
        return {
          SERVICE_WORKER_PRICE_PER_HOUR:
            DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR, // ✅ Corrigé
        };
      default:
        // ✅ Filtrer pour ne retourner que les valeurs numériques
        const allValues = DefaultValues.getAllValues();
        const numericValues: Record<string, number> = {};
        for (const [key, value] of Object.entries(allValues)) {
          if (typeof value === "number") {
            numericValues[key] = value;
          }
        }
        return numericValues;
    }
  }
}
