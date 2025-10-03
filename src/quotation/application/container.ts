import "reflect-metadata";
import { Container } from "inversify";
import { QuoteStrategy } from "../domain/interfaces/QuoteStrategy";
import { ConfigurationService } from "../domain/services/ConfigurationService";
import { RuleEngine } from "../domain/services/RuleEngine";
import { logger } from "../../lib/logger";
import { createMovingRules } from "../domain/rules/MovingRules";
import { createTemplateRules } from "../domain/rules/TemplateRules";
import { ConfigurationLoaderService } from "../infrastructure/services/ConfigurationLoaderService";
import { prisma } from "../../lib/prisma";

export const container = new Container({ defaultScope: "Singleton" });

// Registry pour les stratégies chargées dynamiquement
interface StrategyModule {
  path: string;
  importPromise: () => Promise<any>;
  aliases: string[];
}

// Configuration des stratégies avec imports dynamiques Next.js
const STRATEGY_MODULES: StrategyModule[] = [
  {
    path: './strategies/MovingQuoteStrategy',
    importPromise: () => import('./strategies/MovingQuoteStrategy'),
    aliases: ['MOVING', 'MOVING_PREMIUM', 'PACKING']
  },
  {
    path: './strategies/CleaningQuoteStrategy', 
    importPromise: () => import('./strategies/CleaningQuoteStrategy'),
    aliases: ['CLEANING', 'CLEANING_PREMIUM']
  },
  {
    path: './strategies/DeliveryQuoteStrategy',
    importPromise: () => import('./strategies/DeliveryQuoteStrategy'),
    aliases: ['DELIVERY']
  }
];

const loadedStrategies = new Set<string>();
let isLoaded = false;

/**
 * Charge toutes les stratégies avec imports dynamiques Next.js compatibles
 * @param forceReload Force le rechargement (utile en dev)
 */
export async function loadStrategies(forceReload = false) {
  logger.info("🔄 Chargement automatique des stratégies (Next.js compatible)...");

  try {
    // Vérifier si déjà chargé et pas de rechargement forcé
    if (!forceReload && isLoaded && loadedStrategies.size > 0) {
      logger.info("✅ Stratégies déjà chargées");
      return;
    }

    // Vider le conteneur si rechargement forcé
    if (forceReload || !isLoaded) {
      try {
        container.unbindAll();
        loadedStrategies.clear();
        isLoaded = false;
      } catch {
        // Ignorer les erreurs de nettoyage
      }
    }

    // Configurer les services de base
    await setupBaseServices();
    
    // Charger toutes les stratégies via imports dynamiques
    await loadAllStrategiesWithDynamicImports();

    isLoaded = true;
    logger.info(`✅ ${loadedStrategies.size} stratégies chargées avec succès`);
    logger.info(`📋 Stratégies disponibles: [${Array.from(loadedStrategies).join(', ')}]`);

  } catch (err: any) {
    logger.error(`❌ Erreur lors du chargement des stratégies:`, err.message);
    logger.error(`❌ Stack:`, err.stack?.substring(0, 500));
    throw err;
  }
}

/**
 * Configure les services de base nécessaires aux stratégies
 */
async function setupBaseServices() {
  try {
    logger.info("🔄 Configuration des services de base...");
    
    // Charger les configurations depuis la base de données
    const configLoader = new ConfigurationLoaderService(prisma);
    
    // S'assurer que les configurations par défaut existent
    await configLoader.ensureDefaultConfigurations();
    
    // Charger le service de configuration avec les données de la BD
    const configService = await configLoader.getConfigurationService();
    
    // Créer les moteurs de règles
    const movingRules = createMovingRules();
    const templateRules = createTemplateRules();
    const movingRuleEngine = new RuleEngine(movingRules);
    const templateRuleEngine = new RuleEngine(templateRules);

    // Services de base à enregistrer
    const services = [
      { key: "ConfigurationService", value: configService },
      { key: "MovingRuleEngine", value: movingRuleEngine },
      { key: "TemplateRuleEngine", value: templateRuleEngine }
    ];

    // Enregistrer chaque service (avec nettoyage si nécessaire)
    services.forEach(({ key, value }) => {
      try {
        if (container.isBound(key)) container.unbind(key);
      } catch { /* ignorer */ }
      container.bind(key).toConstantValue(value);
    });
    
    logger.info("✅ Services de base configurés avec succès");
    logger.info(`📊 ConfigurationService initialisé avec ${configService ? 'configurations chargées' : 'configurations par défaut'}`);
    
  } catch (error) {
    logger.error("❌ Erreur lors de la configuration des services de base:", error);
    
    // Fallback avec configurations par défaut
    logger.info("🔄 Utilisation du fallback avec configurations par défaut...");
    const configService = new ConfigurationService([]);
    const movingRules = createMovingRules();
    const templateRules = createTemplateRules();
    const movingRuleEngine = new RuleEngine(movingRules);
    const templateRuleEngine = new RuleEngine(templateRules);

    const services = [
      { key: "ConfigurationService", value: configService },
      { key: "MovingRuleEngine", value: movingRuleEngine },
      { key: "TemplateRuleEngine", value: templateRuleEngine }
    ];

    services.forEach(({ key, value }) => {
      try {
        if (container.isBound(key)) container.unbind(key);
      } catch { /* ignorer */ }
      container.bind(key).toConstantValue(value);
    });
    
    logger.info("✅ Services de base configurés avec fallback");
  }
}

/**
 * Charge toutes les stratégies via les imports dynamiques Next.js
 */
async function loadAllStrategiesWithDynamicImports() {
  logger.info(`📁 Chargement de ${STRATEGY_MODULES.length} module(s) de stratégies`);

  const loadPromises = STRATEGY_MODULES.map(async (strategyModule) => {
    try {
      await loadStrategyModule(strategyModule);
    } catch (err: any) {
      logger.error(`❌ Erreur lors du chargement de ${strategyModule.path}:`, err.message);
    }
  });

  // Charger toutes les stratégies en parallèle
  await Promise.allSettled(loadPromises);
}

/**
 * Charge un module de stratégie via import dynamique
 */
async function loadStrategyModule(strategyModule: StrategyModule) {
  const { path, importPromise, aliases } = strategyModule;
  
  try {
    // Import dynamique du module
    const module = await importPromise();
    
    // Parcourir tous les exports du module
    for (const [exportName, StrategyClass] of Object.entries(module)) {
      if (isValidStrategyClass(StrategyClass)) {
        await loadStrategyClass(StrategyClass as any, exportName, aliases, path);
      }
    }
  } catch (err: any) {
    logger.error(`❌ Import échoué pour ${path}:`, err.message);
    throw err;
  }
}

/**
 * Vérifie si une classe est une stratégie valide
 */
function isValidStrategyClass(StrategyClass: any): boolean {
  try {
    // Vérifier si c'est une classe avec les méthodes requises
    const prototype = StrategyClass?.prototype;
    return prototype && 
           typeof prototype.calculate === "function" &&
           typeof prototype.canHandle === "function" &&
           typeof StrategyClass === "function";
  } catch {
    return false;
  }
}

/**
 * Charge une classe de stratégie dans le conteneur InversifyJS
 */
async function loadStrategyClass(
  StrategyClass: new (...args: any[]) => QuoteStrategy, 
  exportName: string, 
  aliases: string[], 
  modulePath: string
) {
  try {
    // Enregistrer la classe dans le conteneur
    const classBindingKey = `${exportName}Class`;
    
    // Nettoyage si nécessaire
    try {
      if (container.isBound(classBindingKey)) container.unbind(classBindingKey);
    } catch { /* ignorer */ }
    
    // Enregistrement de la classe
    container.bind<QuoteStrategy>(classBindingKey).to(StrategyClass);
    
    // Créer une instance pour récupérer les informations
    const instance = container.get<QuoteStrategy>(classBindingKey);
    
    if (!instance) {
      logger.warn(`⚠️ Impossible de créer une instance de ${exportName}`);
      return;
    }

    // Récupérer le serviceType principal depuis l'instance
    const primaryServiceType = instance.serviceType?.toString();
    if (!primaryServiceType) {
      logger.warn(`⚠️ Stratégie ${exportName} n'a pas de serviceType défini`);
      return;
    }

    // Enregistrer pour le type principal ET tous les alias
    const allServiceTypes = [primaryServiceType, ...aliases];
    
    allServiceTypes.forEach(serviceType => {
      try {
        if (container.isBound(serviceType)) {
          logger.debug(`🔄 Unbinding existing strategy: ${serviceType}`);
          container.unbind(serviceType);
        }
      } catch { /* ignorer */ }

      logger.debug(`🎯 Binding strategy ${exportName} to serviceType: ${serviceType}`);
      container.bind<QuoteStrategy>(serviceType).toConstantValue(instance);
      loadedStrategies.add(serviceType);
      logger.debug(`✅ Successfully bound ${serviceType} to ${exportName}`);
    });

    logger.info(
      `✅ Stratégie chargée : ${exportName} pour [${allServiceTypes.join(', ')}] (${modulePath})`
    );
    
  } catch (err: any) {
    logger.error(`❌ Erreur lors du chargement de la classe ${exportName}:`, err.message);
    throw err;
  }
}

/**
 * Ajoute dynamiquement une nouvelle stratégie au runtime
 * @param importPromise Fonction qui retourne la promesse d'import
 * @param aliases Alias pour cette stratégie
 * @param path Chemin pour les logs
 */
export async function addStrategy(
  importPromise: () => Promise<any>,
  aliases: string[],
  path: string
) {
  const newModule: StrategyModule = { path, importPromise, aliases };
  STRATEGY_MODULES.push(newModule);
  
  // Charger immédiatement la nouvelle stratégie
  try {
    await loadStrategyModule(newModule);
    logger.info(`➕ Nouvelle stratégie ajoutée dynamiquement: ${path}`);
  } catch (err: any) {
    logger.error(`❌ Erreur lors de l'ajout de la stratégie ${path}:`, err.message);
  }
}

/**
 * Obtient une stratégie par son type de service
 * @param serviceType Le type de service
 * @returns La stratégie correspondante
 */
export function getStrategy(serviceType: string): QuoteStrategy {
  try {
    // Log pour debug
    logger.info(`🔍 Recherche de stratégie pour: ${serviceType}`);

    // Vérifier que le conteneur est initialisé
    if (!container) {
      logger.error(`❌ Conteneur InversifyJS non initialisé pour ${serviceType}`);
      throw new Error("Conteneur InversifyJS non initialisé");
    }

    // Log des stratégies disponibles dans le container
    try {
      const availableBindings = container.getAllNamed ?
        `Bindings disponibles dans le container (si getAll supporté)` :
        `Container initialisé mais getAll non disponible`;
      logger.info(`📋 Container état: ${availableBindings}`);

      // Vérifier si le binding existe
      const isBound = container.isBound(serviceType);
      logger.info(`🔍 Binding existe pour ${serviceType}: ${isBound}`);
    } catch (bindingCheckError) {
      logger.warn(`⚠️ Impossible de vérifier les bindings: ${bindingCheckError}`);
    }

    // Essayer de récupérer la stratégie
    logger.info(`🎯 Tentative de récupération de la stratégie: ${serviceType}`);
    const strategy = container.get<QuoteStrategy>(serviceType);
    
    if (!strategy) {
      throw new Error(`Stratégie trouvée mais nulle pour: ${serviceType}`);
    }

    logger.info(`✅ Stratégie trouvée: ${strategy.constructor.name}`);
    return strategy;
  } catch (error: any) {
    logger.error(`❌ Erreur getStrategy pour "${serviceType}":`, error.message);
    
    // Lister les stratégies disponibles pour debug
    try {
      const available = Array.from(loadedStrategies);
      logger.info(`📋 Stratégies disponibles: [${available.join(', ')}]`);
    } catch (listError) {
      logger.error(`❌ Impossible de lister les stratégies disponibles`);
    }
    
    throw new Error(`Stratégie non trouvée pour le service : ${serviceType}`);
  }
}

/**
 * Obtient toutes les stratégies disponibles
 * @returns Map des stratégies par type de service
 */
export function getAllStrategies(): Map<string, QuoteStrategy> {
  const strategies = new Map<string, QuoteStrategy>();
  
  try {
    // Utiliser les stratégies chargées dynamiquement
    Array.from(loadedStrategies).forEach(serviceType => {
      try {
        const strategy = container.get<QuoteStrategy>(serviceType);
        strategies.set(serviceType, strategy);
      } catch (error) {
        logger.warn(`Stratégie non trouvée pour ${serviceType}`);
      }
    });
  } catch (error) {
    logger.warn("Erreur lors de la récupération des stratégies");
  }
  
  return strategies;
}

/**
 * Recharge les stratégies (utile en développement)
 */
export async function reloadStrategies() {
  logger.info("🔄 Rechargement des stratégies en cours...");
  await loadStrategies(true);
}

/**
 * Obtient la liste des types de services chargés
 */
export function getLoadedServiceTypes(): string[] {
  return Array.from(loadedStrategies);
}
