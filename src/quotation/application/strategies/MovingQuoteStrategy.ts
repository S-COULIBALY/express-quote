import { injectable, inject } from "inversify";
import { QuoteStrategy } from "../../domain/interfaces/QuoteStrategy";
import { QuoteContext } from "../../domain/valueObjects/QuoteContext";
import { Quote } from "../../domain/valueObjects/Quote";
import { Money } from "../../domain/valueObjects/Money";
import { ServiceType } from "../../domain/enums/ServiceType";
import { ConfigurationService } from "../services/ConfigurationService";
import { RuleEngine } from "../../domain/services/RuleEngine";
import { calculationDebugLogger } from "../../../lib/calculation-debug-logger";
import {
  ConfigurationCategory,
  PricingConfigKey,
  BusinessTypePricingConfigKey,
} from "../../domain/configuration/ConfigurationKey";
import { configAccessService } from "../services/ConfigurationAccessService";
import {
  UnifiedDataService,
  ServiceType as UnifiedServiceType,
} from "../../infrastructure/services/UnifiedDataService";
import { devLog } from "../../../lib/conditional-logger";

@injectable()
export class MovingQuoteStrategy implements QuoteStrategy {
  serviceType = ServiceType.MOVING;
  private readonly configService: ConfigurationService;
  private readonly rules: any[];
  private ruleEngine: RuleEngine; // Retiré readonly pour permettre la réinitialisation
  private readonly unifiedDataService: UnifiedDataService;

  constructor(
    @inject("ConfigurationService") configService?: ConfigurationService,
    @inject("MovingRuleEngine") ruleEngine?: RuleEngine,
  ) {
    // Injection de dépendances avec fallback pour compatibilité
    this.configService = configService || new ConfigurationService(null as any);
    this.ruleEngine = ruleEngine || new RuleEngine([]);
    this.rules = this.ruleEngine.getRules();

    // ✅ NOUVEAU: Service unifié pour accès aux données
    this.unifiedDataService = UnifiedDataService.getInstance();

    // ✅ NOUVEAU: Charger les règles métier au démarrage
    this.initializeRules();
  }

  /**
   * ✅ NOUVEAU: Initialise les règles métier depuis le système unifié
   */
  private async initializeRules(): Promise<void> {
    try {
      const businessRules =
        await this.unifiedDataService.getBusinessRulesForEngine(
          UnifiedServiceType.MOVING,
        );
      if (businessRules.length > 0) {
        devLog.debug('MovingStrategy',
          `✅ ${businessRules.length} règles métier chargées depuis UnifiedDataService`
        );
        // Remplacer le RuleEngine avec les nouvelles règles
        this.ruleEngine = new RuleEngine(businessRules);
      } else {
        devLog.debug('MovingStrategy',
          "⚠️ Aucune règle métier trouvée, utilisation des règles par défaut"
        );
      }
    } catch (error) {
      devLog.warn('MovingStrategy',
        "⚠️ Erreur lors du chargement des règles métier:", error
      );
      // Garder le RuleEngine existant en cas d'erreur
    }
  }

  canHandle(serviceType: string): boolean {
    return (
      serviceType === ServiceType.MOVING ||
      serviceType === ServiceType.MOVING_PREMIUM ||
      serviceType === ServiceType.PACKING ||
      serviceType === "MOVING" ||
      serviceType === "MOVING_PREMIUM" ||
      serviceType === "PACKING"
    );
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    const startTime = Date.now();
    const data = context.getAllData();
    const serviceType = context.getServiceType();

    devLog.debug('MovingStrategy', "\n🎯 DÉBUT CALCUL | " + serviceType + " | MovingQuoteStrategy");

    calculationDebugLogger.startPriceCalculation(this.serviceType, data);

    try {
      // ✅ Cas 1 : PACKING non modifié → shortcut avec defaultPrice SANS promotions
      if (
        this.isPackingUnchanged(context) &&
        (data.defaultPrice || data.calculatedPrice || data.totalPrice)
      ) {
        const defaultPrice =
          data.defaultPrice || data.calculatedPrice || data.totalPrice;

        devLog.debug('MovingStrategy', "🎯 PACKING inchangé - Prix par défaut: " + defaultPrice.toFixed(2) + "€");

        const defaultQuote = new Quote(
          new Money(defaultPrice),
          new Money(defaultPrice),
          [],
          serviceType,
          [
            {
              label: "Prix par défaut (PACKING non modifié)",
              amount: defaultPrice,
            },
          ],
        );

        calculationDebugLogger.logFinalCalculation(
          defaultQuote,
          Date.now() - startTime,
          { shortcut: "PACKING_DEFAULT_PRICE" },
        );

        return defaultQuote;
      }

      // Calculer le prix de base SANS les règles métier (inclut les promotions)
      const { baseTotal, details: baseDetails } =
        await this.calculateBasePriceOnly(context);

      // Utiliser la méthode centralisée pour le calcul avec règles métier
      const {
        total,
        details: ruleDetails,
        discounts,
      } = this.calculatePriceWithDetails(context, baseTotal);

      // Combiner les détails de base (incluant promotions) avec les détails des règles
      const allDetails = [...baseDetails, ...ruleDetails];

      const finalQuote = new Quote(
        new Money(baseTotal), // ✅ Prix de base SANS règles métier
        new Money(total), // ✅ Prix total AVEC règles métier
        discounts, // ✅ Règles métier appliquées
        serviceType,
        allDetails, // ✅ Détails du calcul inclus (promotions + règles)
      );

      calculationDebugLogger.logFinalCalculation(
        finalQuote,
        Date.now() - startTime,
      );

      devLog.debug('MovingStrategy', "\n✅ FIN CALCUL: Base=" + finalQuote.getBasePrice().getAmount().toFixed(2) + "€ | Final=" + finalQuote.getTotalPrice().getAmount().toFixed(2) + "€ | Règles=" + finalQuote.getDiscounts().length + " | " + (Date.now() - startTime) + "ms\n");

      return finalQuote;
    } catch (error) {
      devLog.debug('MovingStrategy', "\n❌ ERREUR CALCUL PRIX | " + serviceType + " | " + (error as Error).message + " | " + (Date.now() - startTime) + "ms");
      calculationDebugLogger.logCalculationError(
        error,
        "MOVING_STRATEGY",
        data,
      );
      throw error;
    }
  }

  async getBasePrice(context: QuoteContext): Promise<number> {
    // Si PACKING non modifié, retourner le prix par défaut
    const data = context.getAllData();
    if (
      this.isPackingUnchanged(context) &&
      (data.defaultPrice || data.calculatedPrice || data.totalPrice)
    ) {
      return data.defaultPrice || data.calculatedPrice || data.totalPrice;
    }

    // Sinon, calculer le prix de base SANS les règles métier
    const { baseTotal } = await this.calculateBasePriceOnly(context);
    return baseTotal;
  }

  /**
   * Méthode pour calculer le prix de base SANS les règles métier
   * Utilisée par getBasePrice() pour retourner le prix avant règles
   */
  private async calculateBasePriceOnly(context: QuoteContext): Promise<{
    baseTotal: number;
    details: { label: string; amount: number }[];
  }> {
    const data = context.getAllData();
    const serviceType = context.getServiceType();

    // ✅ NOUVEAU: Récupérer les constantes depuis ConfigurationAccessService (BDD → Cache → DefaultValues)
    const baseRate = await configAccessService.get<number>(
      "MOVING_BASE_PRICE_PER_M3",
    );
    const laborRate = await configAccessService.get<number>(
      "MOVING_WORKER_HOUR_RATE",
    ); // ✅ Corrigé (spécifique MOVING)
    const truckRate =
      await configAccessService.get<number>("MOVING_TRUCK_PRICE");
    const distanceRate = await configAccessService.get<number>(
      "MOVING_DISTANCE_PRICE_PER_KM",
    );
    const fuelRate = await configAccessService.get<number>(
      "FUEL_PRICE_PER_LITER",
    );
    const tollRate = await configAccessService.get<number>("TOLL_COST_PER_KM");

    // Données d'entrée
    const volume = data.volume || 0;
    const distance = data.distance || 0;
    let workers = data.workers || 1;
    const duration = data.duration || 1;

    devLog.debug('MovingStrategy', "\n🏗️ CALCUL PRIX DE BASE | " + serviceType + " | Vol:" + volume + "m³, Dist:" + distance + "km, Workers:" + workers + ", Durée:" + duration + "h");
    // 🚚 Application de la règle : km inclus
    const freeDistanceKm = await configAccessService.get<number>(
      "MOVING_FREE_DISTANCE_KM",
    );

    devLog.debug('MovingStrategy', "💰 Tarifs: " + baseRate + "€/m³, " + laborRate + "€/h, camion=" + truckRate + "€, distance=" + distanceRate + "€/km, carburant=" + fuelRate + "€/km, péages=" + tollRate + "€/km, gratuit=" + freeDistanceKm + "km");
    const chargeableKm = Math.max(0, distance - freeDistanceKm);

    let baseTotal = 0;
    let details: { label: string; amount: number }[] = [];

    // ✅ Cas 1 : MOVING sur mesure (VOLUME UNIQUEMENT + transport)
    if (serviceType === ServiceType.MOVING) {
      // ✅ VALIDATION: MOVING requiert un volume
      if (!volume || volume === 0) {
        throw new Error(
          "MOVING (déménagement sur mesure) requiert un volume non nul",
        );
      }

      // ✅ CORRECTION: Le camion se loue par jour (7h = 1 jour par défaut)
      const hoursPerDay =
        await configAccessService.get<number>("HOURS_PER_DAY");
      const numberOfDays = Math.ceil(duration / hoursPerDay);

      // 🧮 Nombre de déménageurs recommandé (INFORMATIF UNIQUEMENT)
      const workersPerM3Threshold = await configAccessService.get<number>(
        "MOVING_WORKERS_PER_M3_THRESHOLD",
      );
      const recommendedWorkers = Math.max(
        1,
        Math.ceil(volume / workersPerM3Threshold),
      );

      const volumeCost = volume * baseRate;
      // ❌ PAS DE LABOR COST pour MOVING sur mesure (volume-based)
      const truckCost = truckRate * numberOfDays; // ✅ Par jour, pas par heure
      const distanceCost = chargeableKm * distanceRate;
      const fuelCost = chargeableKm * fuelRate;
      const tollCost = chargeableKm * tollRate;

      baseTotal = volumeCost + truckCost + distanceCost + fuelCost + tollCost;
      details = [
        { label: `${freeDistanceKm} km inclus (offerts)`, amount: 0 },
        { label: "Volume", amount: volumeCost },
        {
          label: `Camion (${numberOfDays} jour${numberOfDays > 1 ? "s" : ""})`,
          amount: truckCost,
        },
        {
          label: `Distance (au-delà de ${freeDistanceKm} km)`,
          amount: distanceCost,
        },
        {
          label: `Carburant (au-delà de ${freeDistanceKm} km)`,
          amount: fuelCost,
        },
        { label: `Péages (au-delà de ${freeDistanceKm} km)`, amount: tollCost },
        {
          label: "Nb déménageurs recommandés (info)",
          amount: recommendedWorkers,
        },
      ];

      devLog.debug('MovingStrategy', 
        `🏠 [MOVING-STRATEGY] CALCUL MOVING SUR MESURE (PRIX DE BASE - VOLUME UNIQUEMENT):`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Volume: ${volume}m³ × ${baseRate}€ = ${volumeCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Déménageurs recommandés (info): ${recommendedWorkers} (calculé: ${volume}m³ ÷ ${workersPerM3Threshold}m³/worker)`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Camion: ${truckRate}€ × ${numberOfDays} jour${numberOfDays > 1 ? "s" : ""} = ${truckCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Distance: ${chargeableKm}km × ${distanceRate}€ = ${distanceCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Carburant: ${chargeableKm}km × ${fuelRate}€ = ${fuelCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Péages: ${chargeableKm}km × ${tollRate}€ = ${tollCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', `   └─ PRIX DE BASE MOVING: ${baseTotal.toFixed(2)}€`);
    }

    // ✅ Cas 2 : PACKING catalogue (MAIN D'ŒUVRE UNIQUEMENT + transport)
    else if (serviceType === ServiceType.PACKING) {
      // ✅ VALIDATION: PACKING requiert workers ET duration
      if (!workers || workers === 0 || !duration || duration === 0) {
        throw new Error(
          "PACKING (pack catalogue) requiert workers et duration non nuls",
        );
      }

      // ✅ CORRECTION: Le camion se loue par jour (7h = 1 jour par défaut)
      const hoursPerDay =
        await configAccessService.get<number>("HOURS_PER_DAY");
      const numberOfDays = Math.ceil(duration / hoursPerDay);

      const laborCost = workers * duration * laborRate;
      // ❌ PAS DE VOLUME COST pour PACKING catalogue (labor-based)
      const truckCost = truckRate * numberOfDays; // ✅ Par jour, pas par heure
      const distanceCost = chargeableKm * distanceRate;
      const fuelCost = chargeableKm * fuelRate;
      const tollCost = chargeableKm * tollRate;

      baseTotal = laborCost + truckCost + distanceCost + fuelCost + tollCost;
      details = [
        { label: `${freeDistanceKm} km inclus (offerts)`, amount: 0 },
        { label: "Main d'œuvre", amount: laborCost },
        {
          label: `Camion (${numberOfDays} jour${numberOfDays > 1 ? "s" : ""})`,
          amount: truckCost,
        },
        {
          label: `Distance (au-delà de ${freeDistanceKm} km)`,
          amount: distanceCost,
        },
        {
          label: `Carburant (au-delà de ${freeDistanceKm} km)`,
          amount: fuelCost,
        },
        { label: `Péages (au-delà de ${freeDistanceKm} km)`, amount: tollCost },
      ];

      devLog.debug('MovingStrategy', 
        `📦 [MOVING-STRATEGY] CALCUL PACKING CATALOGUE (PRIX DE BASE - MAIN D'ŒUVRE UNIQUEMENT):`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Main d'œuvre: ${workers} × ${duration}h × ${laborRate}€ = ${laborCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Camion: ${truckRate}€ × ${numberOfDays} jour${numberOfDays > 1 ? "s" : ""} = ${truckCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Distance: ${chargeableKm}km × ${distanceRate}€ = ${distanceCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Carburant: ${chargeableKm}km × ${fuelRate}€ = ${fuelCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Péages: ${chargeableKm}km × ${tollRate}€ = ${tollCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', `   └─ PRIX DE BASE PACKING: ${baseTotal.toFixed(2)}€`);
    }

    // ✅ Cas 3 : MOVING-PREMIUM (volume + cartons + fournitures + taux horaire premium, workers auto-calculés à titre informatif)
    else if (serviceType === ServiceType.MOVING_PREMIUM) {
      // ✅ CORRECTION: Le camion se loue par jour (7h = 1 jour par défaut)
      const hoursPerDay =
        await configAccessService.get<number>("HOURS_PER_DAY");
      const numberOfDays = Math.ceil(duration / hoursPerDay);

      // 🧮 Nombre de cartons et coût
      const boxesPerM3 = await configAccessService.get<number>(
        "MOVING_BOXES_PER_M3",
      );
      const boxPrice =
        await configAccessService.get<number>("MOVING_BOX_PRICE");
      const numberOfBoxes = volume * boxesPerM3;
      const boxesCost = numberOfBoxes * boxPrice;

      // 🎁 Fournitures premium = cartons × 2.5 (emballage, protection, etc.)
      const suppliesMultiplier = await configAccessService.get<number>(
        "MOVING_PREMIUM_SUPPLIES_MULTIPLIER",
      );
      const suppliesCost = boxesCost * suppliesMultiplier;

      // 🧮 Nombre de déménageurs recalculé automatiquement (INFORMATIF UNIQUEMENT)
      const workersPerM3Threshold = await configAccessService.get<number>(
        "MOVING_WORKERS_PER_M3_THRESHOLD",
      );
      workers = Math.max(1, Math.ceil(volume / workersPerM3Threshold));

      // 💼 Taux horaire premium (40€ au lieu de 35€)
      const premiumLaborRate = await configAccessService.get<number>(
        "MOVING_PREMIUM_WORKER_PRICE_PER_HOUR",
      );
      const laborCost = workers * duration * premiumLaborRate;

      const volumeCost = volume * baseRate;
      const truckCost = truckRate * numberOfDays; // ✅ Par jour, pas par heure
      const distanceCost = chargeableKm * distanceRate;
      const fuelCost = chargeableKm * fuelRate;
      const tollCost = chargeableKm * tollRate;

      baseTotal =
        volumeCost +
        boxesCost +
        suppliesCost +
        laborCost +
        truckCost +
        distanceCost +
        fuelCost +
        tollCost;

      details = [
        { label: `${freeDistanceKm} km inclus (offerts)`, amount: 0 },
        { label: "Volume", amount: volumeCost },
        { label: "Cartons d'emballage", amount: boxesCost },
        {
          label: "Fournitures premium (emballage, protection)",
          amount: suppliesCost,
        },
        {
          label: `Main d'œuvre premium (${workers} déménageurs × ${duration}h × ${premiumLaborRate}€)`,
          amount: laborCost,
        },
        {
          label: `Camion (${numberOfDays} jour${numberOfDays > 1 ? "s" : ""})`,
          amount: truckCost,
        },
        {
          label: `Distance (au-delà de ${freeDistanceKm} km)`,
          amount: distanceCost,
        },
        {
          label: `Carburant (au-delà de ${freeDistanceKm} km)`,
          amount: fuelCost,
        },
        { label: `Péages (au-delà de ${freeDistanceKm} km)`, amount: tollCost },
        { label: "Nb cartons (info)", amount: numberOfBoxes },
        { label: "Nb déménageurs (info)", amount: workers },
      ];

      devLog.debug('MovingStrategy', 
        `🏠 [MOVING-STRATEGY] CALCUL MOVING_PREMIUM (PRIX DE BASE - TOUT INCLUS):`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Volume: ${volume}m³ × ${baseRate}€ = ${volumeCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Cartons: ${numberOfBoxes.toFixed(1)} × ${boxPrice}€ = ${boxesCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Fournitures premium: ${boxesCost.toFixed(2)}€ × ${suppliesMultiplier} = ${suppliesCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Main d'œuvre premium: ${workers} déménageurs × ${duration}h × ${premiumLaborRate}€ = ${laborCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Camion: ${truckRate}€ × ${numberOfDays} jour${numberOfDays > 1 ? "s" : ""} (${duration}h ÷ ${hoursPerDay}h/jour) = ${truckCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Distance: ${chargeableKm}km × ${distanceRate}€ = ${distanceCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Carburant: ${chargeableKm}km × ${fuelRate}€ = ${fuelCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ Péages: ${chargeableKm}km × ${tollRate}€ = ${tollCost.toFixed(2)}€`,
      );
      devLog.debug('MovingStrategy', 
        `   └─ PRIX DE BASE MOVING_PREMIUM: ${baseTotal.toFixed(2)}€`,
      );
    }

    // ✅ APPLICATION DES PROMOTIONS SUR LE PRIX DE BASE
    const promotionResult = this.applyPromotionCodes(context, baseTotal);
    baseTotal = promotionResult.finalPrice;
    details.push(...promotionResult.details);

    devLog.debug('MovingStrategy', 
      `💰 [MOVING-STRATEGY] Prix de base après promotions: ${baseTotal.toFixed(2)}€`,
    );

    return { baseTotal, details };
  }

  /**
   * Applique les codes promotion sur le prix de base
   * Cette méthode est appelée AVANT l'application des règles métier
   */
  private applyPromotionCodes(
    context: QuoteContext,
    basePrice: number,
  ): { finalPrice: number; details: { label: string; amount: number }[] } {
    const data = context.getAllData();

    // ✅ CORRECTION : Extraire les données de promotion depuis le __presetSnapshot si pas disponibles
    let promotionCode = data.promotionCode;
    let promotionValue = data.promotionValue;
    let promotionType = data.promotionType;
    let isPromotionActive = data.isPromotionActive;

    // ✅ CORRECTION : Toujours extraire les données du __presetSnapshot si disponible
    if (data.__presetSnapshot) {
      promotionCode = data.__presetSnapshot.promotionCode || promotionCode;
      promotionValue = data.__presetSnapshot.promotionValue || promotionValue;
      promotionType = data.__presetSnapshot.promotionType || promotionType;
      // ✅ CORRECTION CRITIQUE : Ne pas utiliser || pour les booléens car false || false = false
      isPromotionActive =
        data.__presetSnapshot.isPromotionActive !== undefined
          ? data.__presetSnapshot.isPromotionActive
          : isPromotionActive;
    }

    let finalPrice = basePrice;
    const details: { label: string; amount: number }[] = [];

    // Vérifier si une promotion est active
    if (
      !isPromotionActive ||
      !promotionCode ||
      !promotionValue ||
      !promotionType
    ) {
      devLog.debug('MovingStrategy', "💰 Prix base: " + basePrice.toFixed(2) + "€ (aucune promotion)");
      return { finalPrice, details };
    }

    // Appliquer la promotion selon le type
    if (promotionType === "PERCENT") {
      const discountAmount = (basePrice * promotionValue) / 100;
      finalPrice = basePrice - discountAmount;
      details.push({
        label: `Promotion ${promotionCode} (-${promotionValue}%)`,
        amount: -discountAmount,
      });
      devLog.debug('MovingStrategy', "💰 Promotion: " + promotionCode + " -" + promotionValue + "% = -" + discountAmount.toFixed(2) + "€ → " + finalPrice.toFixed(2) + "€");
    } else if (promotionType === "FIXED") {
      finalPrice = Math.max(0, basePrice - promotionValue); // Éviter les prix négatifs
      details.push({
        label: `Promotion ${promotionCode} (-${promotionValue}€)`,
        amount: -promotionValue,
      });
      devLog.debug('MovingStrategy', "💰 Promotion: " + promotionCode + " -" + promotionValue + "€ → " + finalPrice.toFixed(2) + "€");
    } else {
      devLog.debug('MovingStrategy', "⚠️ Type de promotion non reconnu: " + promotionType);
    }
    return { finalPrice, details };
  }

  /**
   * Méthode centralisée pour calculer le prix avec détails et application des règles métier
   * Utilise le prix de base fourni (qui inclut déjà les promotions)
   */
  private calculatePriceWithDetails(
    context: QuoteContext,
    baseTotal: number,
  ): {
    total: number;
    details: { label: string; amount: number }[];
    discounts: any[];
  } {
    // Utiliser le prix de base fourni (qui inclut déjà les promotions)
    const details: { label: string; amount: number }[] = [];

    // Vérifier les règles disponibles dans le RuleEngine
    const availableRules = this.ruleEngine.getRules();
    devLog.debug('MovingStrategy', "\n🔧 RÈGLES: " + availableRules.length + " disponibles | Prix base: " + baseTotal.toFixed(2) + "€");

    // Créer l'objet Money pour le RuleEngine
    const baseMoneyAmount = new Money(baseTotal);

    // Appliquer les règles métier via le RuleEngine
    const ruleResult = this.ruleEngine.execute(context, baseMoneyAmount);
    const finalTotal = ruleResult.finalPrice.getAmount();

    devLog.debug('MovingStrategy', "📊 RÉSULTAT: Base=" + ruleResult.basePrice.getAmount().toFixed(2) + "€ | " +
      "Réductions=" + ruleResult.totalReductions.getAmount().toFixed(2) + "€ | " +
      "Surcharges=" + ruleResult.totalSurcharges.getAmount().toFixed(2) + "€ (Contraintes=" +
      ruleResult.totalConstraints.getAmount().toFixed(2) + "€, Services=" +
      ruleResult.totalAdditionalServices.getAmount().toFixed(2) + "€) | " +
      "Final=" + finalTotal.toFixed(2) + "€");
    devLog.debug('MovingStrategy', 
      `   └─ Nombre total de règles: ${ruleResult.appliedRules.length}`,
    );
    devLog.debug('MovingStrategy', `   └─ Contraintes: ${ruleResult.constraints.length}`);
    devLog.debug('MovingStrategy', 
      `   └─ Services additionnels: ${ruleResult.additionalServices.length}`,
    );
    devLog.debug('MovingStrategy', `   └─ Équipements: ${ruleResult.equipment.length}`);

    // Ajouter les détails des règles appliquées (par catégorie)
    if (ruleResult.appliedRules.length > 0) {
      devLog.debug('MovingStrategy', "\n📋 [MOVING-STRATEGY] RÈGLES APPLIQUÉES EN DÉTAIL:");

      // Réductions
      if (ruleResult.reductions.length > 0) {
        devLog.debug('MovingStrategy', "\n  📉 RÉDUCTIONS:");
        ruleResult.reductions.forEach((rule, index) => {
          details.push({
            label: `Réduction: ${rule.description}`,
            amount: -rule.impact.getAmount(),
          });
          devLog.debug('MovingStrategy', `   ${index + 1}. ${rule.description}`);
          devLog.debug('MovingStrategy', 
            `      └─ Montant: -${rule.impact.getAmount().toFixed(2)}€`,
          );
        });
      }

      // Surcharges (contraintes + services supplémentaires)
      const allSurcharges = [...(ruleResult.constraints || []), ...(ruleResult.additionalServices || [])];
      if (allSurcharges.length > 0) {
        devLog.debug('MovingStrategy', "\n  📈 SURCHARGES:");
        allSurcharges.forEach((rule, index) => {
          details.push({
            label: `Surcharge: ${rule.description}`,
            amount: rule.impact.getAmount(),
          });
          devLog.debug('MovingStrategy', `   ${index + 1}. ${rule.description}`);
          devLog.debug('MovingStrategy', 
            `      └─ Montant: +${rule.impact.getAmount().toFixed(2)}€`,
          );
        });
      }

      // Contraintes
      if (ruleResult.constraints.length > 0) {
        devLog.debug('MovingStrategy', "\n  🚧 CONTRAINTES LOGISTIQUES:");
        ruleResult.constraints.forEach((rule, index) => {
          if (!rule.isConsumed) {
            details.push({
              label: `Contrainte: ${rule.description}`,
              amount: rule.impact.getAmount(),
            });
          }
          devLog.debug('MovingStrategy', `   ${index + 1}. ${rule.description}`);
          devLog.debug('MovingStrategy', 
            `      └─ Montant: ${rule.impact.getAmount().toFixed(2)}€`,
          );
          devLog.debug('MovingStrategy', `      └─ Adresse: ${rule.address || "global"}`);
          devLog.debug('MovingStrategy', `      └─ Consommée: ${rule.isConsumed ? "Oui" : "Non"}`);
        });
      }

      // Services additionnels
      if (ruleResult.additionalServices.length > 0) {
        devLog.debug('MovingStrategy', "\n  ➕ SERVICES ADDITIONNELS:");
        ruleResult.additionalServices.forEach((rule, index) => {
          details.push({
            label: `Service: ${rule.description}`,
            amount: rule.impact.getAmount(),
          });
          devLog.debug('MovingStrategy', `   ${index + 1}. ${rule.description}`);
          devLog.debug('MovingStrategy', 
            `      └─ Montant: ${rule.impact.getAmount().toFixed(2)}€`,
          );
        });
      }

      // Équipements
      if (ruleResult.equipment.length > 0) {
        devLog.debug('MovingStrategy', "\n  🔧 ÉQUIPEMENTS SPÉCIAUX:");
        ruleResult.equipment.forEach((rule, index) => {
          details.push({
            label: `Équipement: ${rule.description}`,
            amount: rule.impact.getAmount(),
          });
          devLog.debug('MovingStrategy', `   ${index + 1}. ${rule.description}`);
          devLog.debug('MovingStrategy', 
            `      └─ Montant: ${rule.impact.getAmount().toFixed(2)}€`,
          );
        });
      }

      // Règles temporelles
      if (ruleResult.temporalRules.length > 0) {
        devLog.debug('MovingStrategy', "\n  📅 RÈGLES TEMPORELLES:");
        ruleResult.temporalRules.forEach((rule, index) => {
          details.push({
            label: `Temporel: ${rule.description}`,
            amount: rule.impact.getAmount(),
          });
          devLog.debug('MovingStrategy', `   ${index + 1}. ${rule.description}`);
          devLog.debug('MovingStrategy', 
            `      └─ Montant: ${rule.impact.getAmount().toFixed(2)}€`,
          );
        });
      }
    } else {
      devLog.debug('MovingStrategy', "\n📋 [MOVING-STRATEGY] AUCUNE RÈGLE APPLICABLE");
      devLog.debug('MovingStrategy', "🔍 Raisons possibles:");
      devLog.debug('MovingStrategy', "   - Aucune règle active pour ce service type");
      devLog.debug('MovingStrategy', "   - Conditions des règles non remplies");
      devLog.debug('MovingStrategy', "   - Erreur dans le RuleEngine");
    }

    // Afficher les coûts par adresse
    devLog.debug('MovingStrategy', "\n📍 [MOVING-STRATEGY] COÛTS PAR ADRESSE:");
    devLog.debug('MovingStrategy', 
      `   └─ Départ: ${ruleResult.pickupCosts.total.getAmount().toFixed(2)}€`,
    );
    devLog.debug('MovingStrategy', 
      `   └─ Arrivée: ${ruleResult.deliveryCosts.total.getAmount().toFixed(2)}€`,
    );
    devLog.debug('MovingStrategy', 
      `   └─ Global: ${ruleResult.globalCosts.total.getAmount().toFixed(2)}€`,
    );

    devLog.debug('MovingStrategy', `\n💰 [MOVING-STRATEGY] RÉSUMÉ CALCUL RÈGLES:`);
    devLog.debug('MovingStrategy', `   └─ Prix de base: ${baseTotal.toFixed(2)}€`);
    devLog.debug('MovingStrategy', `   └─ Prix final: ${finalTotal.toFixed(2)}€`);
    devLog.debug('MovingStrategy', `   └─ Différence: ${(finalTotal - baseTotal).toFixed(2)}€`);
    devLog.debug('MovingStrategy', 
      `   └─ Pourcentage de changement: ${(((finalTotal - baseTotal) / baseTotal) * 100).toFixed(2)}%`,
    );

    const discounts = (ruleResult as any).discounts || [];

    return { total: finalTotal, details, discounts };
  }

  /**
   * Vérifie si un PACKING est identique au snapshot preset
   * (donc non modifié par l'utilisateur).
   */
  private isPackingUnchanged(context: QuoteContext): boolean {
    if (context.getServiceType() !== ServiceType.PACKING) return false;

    const data = context.getAllData();
    // ✅ CORRECTION : Récupérer le __presetSnapshot depuis le contexte
    const baseline =
      context.getValue("__presetSnapshot") || data.__presetSnapshot;

    if (!baseline) {
      return false;
    }

    // ✅ CORRECTION : Pour PACKING, on ne compare PAS le volume (pas de volume pour PACKING)
    // ✅ AJOUT : On compare les données de promotion
    const KEYS: (keyof typeof baseline)[] = [
      "distance",
      "workers",
      "duration",
      "promotionCode",
      "promotionValue",
      "promotionType",
      "isPromotionActive",
    ];

    const nearlyEqual = (a?: number | null, b?: number | null, eps = 1e-6) => {
      if (a == null && b == null) return true;
      if (typeof a !== "number" || typeof b !== "number") return a === b;
      return Math.abs(a - b) <= eps;
    };

    for (const k of KEYS) {
      const av = data[k as string];
      const bv = baseline[k];
      const equal =
        typeof av === "number" || typeof bv === "number"
          ? nearlyEqual(av as number, bv as number)
          : av === bv;

      if (!equal) {
        devLog.debug('MovingStrategy', `❌ PACKING modifié: ${String(k)} ${av} ≠ ${bv}`);
        return false;
      }
    }

    devLog.debug('MovingStrategy', "✅ PACKING inchangé → Prix par défaut");
    return true;
  }
}
