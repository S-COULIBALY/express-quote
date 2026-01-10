import { loadStrategies, getStrategy } from "../container";
import { QuoteStrategy } from "../../domain/interfaces/QuoteStrategy";
import { QuoteContext } from "../../domain/valueObjects/QuoteContext";
import { Quote } from "../../domain/valueObjects/Quote";
import { logger } from "../../../lib/logger";
import { devLog } from "../../../lib/conditional-logger";

let strategiesLoaded = false;

/**
 * Service centralisé pour la gestion des stratégies de calcul de devis
 * Utilise le pattern Stratégie avec injection de dépendances
 */
export class QuoteCalculator {
  private static instance: QuoteCalculator;

  private constructor() {}

  /**
   * Obtient l'instance unique du service (pattern Singleton)
   */
  public static getInstance(): QuoteCalculator {
    if (!QuoteCalculator.instance) {
      QuoteCalculator.instance = new QuoteCalculator();
    }
    return QuoteCalculator.instance;
  }

  /**
   * Calcule un devis en utilisant la stratégie appropriée
   * @param serviceType Le type de service
   * @param context Le contexte de calcul
   * @returns Le devis calculé
   */
  public async calculateQuote(serviceType: string, context: QuoteContext): Promise<Quote> {
    // ✅ LOG STRATÉGIQUE: Tracer le début du calcul
    try {
      if (typeof devLog !== 'undefined') {
        devLog.debug('QuoteCalculator', `🧮 [calculateQuote] Recherche stratégie pour ${serviceType}`);
      }
    } catch (e) {
      logger.debug(`📁 [QuoteCalculator] Recherche stratégie pour ${serviceType}`);
    }
    
    try {
      // En mode développement, recharger les stratégies à chaque appel
      if (process.env.NODE_ENV === "development") {
        strategiesLoaded = false;
      }

      // Charger les stratégies si nécessaire
      if (!strategiesLoaded) {
        logger.info("📁 [QuoteCalculator.ts] 🔄 Chargement des stratégies...");
        try {
          await loadStrategies(process.env.NODE_ENV === "development");
          strategiesLoaded = true;
          logger.info("📁 [QuoteCalculator.ts] ✅ Stratégies chargées avec succès");
        } catch (loadError: any) {
          logger.error(`📁 [QuoteCalculator.ts] ❌ Échec du chargement des stratégies:`, loadError.message);
          throw new Error(`Impossible de charger les stratégies: ${loadError.message}`);
        }
      }

      // Obtenir la stratégie appropriée
      logger.info(`📁 [QuoteCalculator.ts] 🔍 Recherche de stratégie pour: ${serviceType}`);
      const strategy = getStrategy(serviceType);
      
      if (!strategy) {
        throw new Error(`Aucune stratégie trouvée pour le service: ${serviceType}`);
      }
      
      // Vérifier que la stratégie peut gérer ce type de service
      if (!strategy.canHandle(serviceType)) {
        logger.error(`❌ Stratégie ${strategy.serviceType} ne peut pas gérer ${serviceType} \n\n`);
        throw new Error(`La stratégie ${strategy.serviceType} ne peut pas gérer le service ${serviceType}`);
      }

      logger.info(`📁 [QuoteCalculator.ts] 📊 Calcul du devis avec la stratégie: ${strategy.constructor.name}`);
      
      // Calculer le devis
      const quote = await strategy.calculate(context);
      
      if (!quote) {
        throw new Error("La stratégie a retourné un devis vide");
      }
      
      // ✅ LOG STRATÉGIQUE: Tracer le résultat
      try {
        if (typeof devLog !== 'undefined') {
          devLog.debug('QuoteCalculator', `✅ [calculateQuote] Devis calculé: ${quote.getTotalPrice().getAmount()}€`);
        }
      } catch (e) {
        logger.debug(`📁 [QuoteCalculator] ✅ Devis calculé: ${quote.getTotalPrice().getAmount()}€`);
      }
      
      return quote;
    } catch (error: any) {
      logger.error(`❌ [QuoteCalculator] Erreur calcul devis "${serviceType}":`, error.message);
      logger.error(`📁 [QuoteCalculator.ts] ❌ Stack trace:`, error.stack?.substring(0, 500));
      throw new Error(`Impossible de calculer le devis pour "${serviceType}": ${error.message}`);
    }
  }

  /**
   * Obtient toutes les stratégies disponibles
   * @returns Map des stratégies par type de service
   */
  public getAllStrategies(): Map<string, QuoteStrategy> {
    const strategies = new Map<string, QuoteStrategy>();
    
    try {
      // Utiliser une approche différente pour récupérer toutes les stratégies
      const serviceTypes = ['MOVING_PREMIUM', 'CLEANING', 'DELIVERY'];
      serviceTypes.forEach(serviceType => {
        try {
          const strategy = getStrategy(serviceType);
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
   * Vérifie si une stratégie existe pour un type de service
   * @param serviceType Le type de service
   * @returns true si une stratégie existe
   */
  public hasStrategy(serviceType: string): boolean {
    try {
      getStrategy(serviceType);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Force le rechargement des stratégies
   * Utile après une mise à jour des stratégies
   */
  public async refreshStrategies(): Promise<void> {
    strategiesLoaded = false;
    await loadStrategies(true);
    logger.info("🔄 Stratégies rechargées avec succès");
  }
}

/**
 * Fonction d'export pour compatibilité
 */
export async function calculateQuote(serviceType: string, context: QuoteContext): Promise<Quote> {
  return QuoteCalculator.getInstance().calculateQuote(serviceType, context);
}
