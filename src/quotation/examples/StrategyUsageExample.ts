import { QuoteCalculator } from "../application/services/QuoteCalculator";
import { QuoteContext } from "../domain/valueObjects/QuoteContext";
import { ServiceType } from "../domain/enums/ServiceType";

/**
 * Exemple d'utilisation du nouveau système de stratégies
 */
export class StrategyUsageExample {
  
  /**
   * Exemple 1: Utilisation directe du QuoteCalculator
   */
  static async exampleDirectUsage() {
    console.log("=== Exemple 1: Utilisation directe du QuoteCalculator ===");
    
    const calculator = QuoteCalculator.getInstance();
    
    // Créer un contexte pour un déménagement
    const movingContext = new QuoteContext(ServiceType.MOVING_PREMIUM);
    movingContext.setValue('volume', 30);
    movingContext.setValue('distance', 50);
    movingContext.setValue('defaultPrice', 500);
    movingContext.setValue('workers', 2);
    
    try {
      const quote = await calculator.calculateQuote(ServiceType.MOVING_PREMIUM, movingContext);
      console.log(`✅ Devis déménagement: ${quote.getTotalPrice().getAmount()}€`);
    } catch (error) {
      console.error("❌ Erreur:", error);
    }
  }

  /**
   * Exemple 2: Utilisation pour différents types de services
   */
  static async exampleMultipleServices() {
    console.log("\n=== Exemple 2: Utilisation pour différents types de services ===");
    
    const calculator = QuoteCalculator.getInstance();
    
    // Créer un contexte pour le nettoyage
    const cleaningContext = new QuoteContext(ServiceType.CLEANING);
    cleaningContext.setValue('surface', 120);
    cleaningContext.setValue('rooms', 4);
    cleaningContext.setValue('defaultPrice', 200);
    
    try {
      const quote = await calculator.calculateQuote(ServiceType.CLEANING, cleaningContext);
      console.log(`✅ Devis nettoyage: ${quote.getTotalPrice().getAmount()}€`);
      
      // Obtenir le prix de base directement depuis la stratégie
      const strategies = calculator.getAllStrategies();
      const cleaningStrategy = strategies.get(ServiceType.CLEANING);
      if (cleaningStrategy) {
        const basePrice = cleaningStrategy.getBasePrice(cleaningContext);
        console.log(`💰 Prix de base: ${basePrice}€`);
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
    }
  }

  /**
   * Exemple 3: Utilisation pour la livraison
   */
  static async exampleDeliveryService() {
    console.log("\n=== Exemple 3: Utilisation pour la livraison ===");
    
    const calculator = QuoteCalculator.getInstance();
    
    // Créer un contexte pour la livraison
    const deliveryContext = new QuoteContext(ServiceType.DELIVERY);
    deliveryContext.setValue('distance', 25);
    deliveryContext.setValue('weight', 50);
    deliveryContext.setValue('urgency', 'express');
    deliveryContext.setValue('defaultPrice', 100);
    
    try {
      const quote = await calculator.calculateQuote(ServiceType.DELIVERY, deliveryContext);
      console.log(`✅ Devis livraison: ${quote.getTotalPrice().getAmount()}€`);
      
      // Obtenir le prix de base directement depuis la stratégie
      const strategies = calculator.getAllStrategies();
      const deliveryStrategy = strategies.get(ServiceType.DELIVERY);
      if (deliveryStrategy) {
        const basePrice = deliveryStrategy.getBasePrice(deliveryContext);
        console.log(`💰 Prix de base: ${basePrice}€`);
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
    }
  }

  /**
   * Exemple 4: Lister toutes les stratégies disponibles
   */
  static exampleListStrategies() {
    console.log("\n=== Exemple 4: Lister toutes les stratégies disponibles ===");
    
    const calculator = QuoteCalculator.getInstance();
    const strategies = calculator.getAllStrategies();
    
    console.log("📋 Stratégies disponibles:");
    strategies.forEach((strategy, serviceType) => {
      console.log(`  - ${serviceType}: ${strategy.constructor.name}`);
    });
    
    console.log("\n🎯 Types de services supportés:");
    strategies.forEach((strategy, serviceType) => {
      console.log(`  - ${serviceType}`);
    });
  }

  /**
   * Exemple 5: Hot-reload en développement
   */
  static async exampleHotReload() {
    console.log("\n=== Exemple 5: Hot-reload en développement ===");
    
    const calculator = QuoteCalculator.getInstance();
    
    // Forcer le rechargement des stratégies
    await calculator.refreshStrategies();
    
    console.log("🔄 Stratégies rechargées avec succès");
    
    // Vérifier que les stratégies sont toujours disponibles
    const strategies = calculator.getAllStrategies();
    console.log(`📊 Nombre de stratégies chargées: ${strategies.size}`);
  }

  /**
   * Exécute tous les exemples
   */
  static async runAllExamples() {
    console.log("🚀 Démarrage des exemples d'utilisation du pattern Stratégie\n");
    
    try {
      await this.exampleDirectUsage();
      await this.exampleMultipleServices();
      await this.exampleDeliveryService();
      this.exampleListStrategies();
      await this.exampleHotReload();
      
      console.log("\n✅ Tous les exemples ont été exécutés avec succès !");
    } catch (error) {
      console.error("\n❌ Erreur lors de l'exécution des exemples:", error);
    }
  }
}

// Exporter pour utilisation
export default StrategyUsageExample;
