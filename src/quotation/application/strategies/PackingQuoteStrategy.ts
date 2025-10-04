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
  UnifiedDataService,
  ServiceType as UnifiedServiceType,
} from "../../infrastructure/services/UnifiedDataService";
import { configAccessService } from "../services/ConfigurationAccessService";

@injectable()
export class PackingQuoteStrategy implements QuoteStrategy {
  serviceType = ServiceType.PACKING;
  private readonly configService: ConfigurationService;
  private readonly rules: any[];
  private ruleEngine: RuleEngine; // Retiré readonly pour permettre la réinitialisation
  private readonly unifiedDataService: UnifiedDataService;

  constructor(
    @inject("ConfigurationService") configService?: ConfigurationService,
    @inject("PackingRuleEngine") ruleEngine?: RuleEngine,
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
          UnifiedServiceType.PACKING,
        );
      if (businessRules.length > 0) {
        console.log(
          `✅ [PACKING-STRATEGY] ${businessRules.length} règles métier chargées depuis UnifiedDataService`,
        );
        // Remplacer le RuleEngine avec les nouvelles règles
        this.ruleEngine = new RuleEngine(businessRules);
      } else {
        console.log(
          "⚠️ [PACKING-STRATEGY] Aucune règle métier trouvée, utilisation des règles par défaut",
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ [PACKING-STRATEGY] Erreur lors du chargement des règles métier:",
        error,
      );
      // Garder le RuleEngine existant en cas d'erreur
    }
  }

  canHandle(serviceType: string): boolean {
    return serviceType === ServiceType.PACKING || serviceType === "PACKING";
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    const startTime = Date.now();
    const data = context.getAllData();
    const serviceType = context.getServiceType();

    calculationDebugLogger.startPriceCalculation(this.serviceType, data);

    try {
      // ✅ Cas 1 : PACKING non modifié → shortcut avec defaultPrice SANS promotions
      if (
        this.isPackingUnchanged(context) &&
        (data.defaultPrice || data.calculatedPrice || data.totalPrice)
      ) {
        const defaultPrice =
          data.defaultPrice || data.calculatedPrice || data.totalPrice;

        console.log(
          `🎯 [PACKING-STRATEGY] PACKING inchangé détecté - Prix par défaut SANS promotions: ${defaultPrice}€`,
        );

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
        new Money(total), // ✅ Prix final AVEC règles métier
        discounts, // ✅ Règles métier appliquées
        serviceType,
        allDetails, // ✅ Détails du calcul inclus (promotions + règles)
      );

      calculationDebugLogger.logFinalCalculation(
        finalQuote,
        Date.now() - startTime,
      );

      return finalQuote;
    } catch (error) {
      calculationDebugLogger.logCalculationError(
        error,
        "PACKING_STRATEGY",
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
  private async calculateBasePriceOnly(
    context: QuoteContext,
  ): Promise<{
    baseTotal: number;
    details: { label: string; amount: number }[];
  }> {
    const data = context.getAllData();

    console.log(
      "\n📦 [PACKING-STRATEGY] ═══════════════════════════════════════════════════",
    );
    console.log(
      "📦 [PACKING-STRATEGY] ═══ DÉBUT CALCUL PRIX DE BASE PACKING ═══",
    );
    console.log(
      "📦 [PACKING-STRATEGY] ═══════════════════════════════════════════════════",
    );
    console.log(
      "📊 [PACKING-STRATEGY] Type de service:",
      context.getServiceType(),
    );

    // ✅ NOUVEAU: Récupérer les constantes depuis ConfigurationAccessService (BDD → Cache → DefaultValues)
    const volumeRate = await configAccessService.get<number>(
      "PACKING_PRICE_PER_M3",
    );
    const laborRate = await configAccessService.get<number>(
      "PACKING_WORKER_HOUR_RATE",
    );
    const materialCostRate = await configAccessService.get<number>(
      "PACKING_MATERIAL_COST",
    );
    const distanceRate = await configAccessService.get<number>(
      "DELIVERY_PRICE_PER_KM",
    );

    // Données d'entrée
    const volume = data.volume || 0;
    const distance = data.distance || 0;
    const workers = data.workers || 1;
    const duration = data.duration || 1;

    console.log("📋 [PACKING-STRATEGY] Données d'entrée:", {
      volume,
      distance,
      workers,
      duration,
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 🚚 Application de la règle : km inclus
    const freeDistanceKm = await configAccessService.get<number>(
      "PACK_INCLUDED_DISTANCE",
    );
    const chargeableKm = Math.max(0, distance - freeDistanceKm);

    let baseTotal = 0;
    const details: { label: string; amount: number }[] = [];

    // ✅ AMÉLIORATION: Détails volume
    console.log("\n📏 [PACKING-STRATEGY] ─── Calcul Volume d'emballage ───");
    const volumeCost = volume * volumeRate;
    if (volume > 0) {
      console.log(`   📦 Volume à emballer: ${volume}m³`);
      console.log(`   💶 Tarif par m³: ${volumeRate.toFixed(2)}€/m³`);
      console.log(
        `   └─ Coût volume: ${volume}m³ × ${volumeRate.toFixed(2)}€ = ${volumeCost.toFixed(2)}€`,
      );
      baseTotal += volumeCost;
      console.log(`   ✅ Sous-total après volume: ${baseTotal.toFixed(2)}€`);
    } else {
      console.log("   ℹ️  Aucun volume spécifié");
    }
    details.push({ label: "Volume d'emballage", amount: volumeCost });

    // ✅ AMÉLIORATION: Détails matériel
    console.log("\n📦 [PACKING-STRATEGY] ─── Calcul Matériel d'emballage ───");
    const materialCost = volume * materialCostRate;
    if (volume > 0) {
      console.log(`   📦 Volume nécessitant du matériel: ${volume}m³`);
      console.log(
        `   💶 Coût matériel par m³: ${materialCostRate.toFixed(2)}€/m³`,
      );
      console.log(
        `   └─ Coût matériel: ${volume}m³ × ${materialCostRate.toFixed(2)}€ = ${materialCost.toFixed(2)}€`,
      );
      baseTotal += materialCost;
      console.log(`   ✅ Sous-total après matériel: ${baseTotal.toFixed(2)}€`);
    } else {
      console.log("   ℹ️  Aucun matériel nécessaire");
    }
    details.push({ label: "Matériel d'emballage", amount: materialCost });

    // ✅ AMÉLIORATION: Détails main d'œuvre
    console.log("\n👥 [PACKING-STRATEGY] ─── Calcul Main d'œuvre ───");
    const laborCost = workers * duration * laborRate;
    console.log(`   👤 Nombre de travailleurs: ${workers}`);
    console.log(`   🕐 Durée de la prestation: ${duration}h`);
    console.log(`   💶 Taux horaire: ${laborRate.toFixed(2)}€/h`);
    console.log(
      `   └─ Coût main d'œuvre: ${workers} × ${duration}h × ${laborRate.toFixed(2)}€ = ${laborCost.toFixed(2)}€`,
    );
    baseTotal += laborCost;
    console.log(
      `   ✅ Sous-total après main d'œuvre: ${baseTotal.toFixed(2)}€`,
    );
    details.push({ label: "Main d'œuvre", amount: laborCost });

    // ✅ AMÉLIORATION: Détails distance
    console.log("\n🚚 [PACKING-STRATEGY] ─── Calcul Distance ───");
    console.log(`   🛣️  Distance totale: ${distance}km`);
    console.log(`   🎁 Distance incluse (offerte): ${freeDistanceKm}km`);
    console.log(`   💶 Distance facturable: ${chargeableKm}km`);
    details.push({ label: `${freeDistanceKm} km inclus (offerts)`, amount: 0 });

    const distanceCost = chargeableKm * distanceRate;
    if (chargeableKm > 0) {
      console.log(
        `   💶 Tarif par km supplémentaire: ${distanceRate.toFixed(2)}€/km`,
      );
      console.log(
        `   └─ Coût distance: ${chargeableKm}km × ${distanceRate.toFixed(2)}€ = ${distanceCost.toFixed(2)}€`,
      );
      baseTotal += distanceCost;
      console.log(`   ✅ Sous-total après distance: ${baseTotal.toFixed(2)}€`);
    } else {
      console.log("   ℹ️  Pas de supplément distance (dans les km inclus)");
    }
    details.push({
      label: `Distance (au-delà de ${freeDistanceKm} km)`,
      amount: distanceCost,
    });

    // ✅ AMÉLIORATION: Résumé avant promotions
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💰 [PACKING-STRATEGY] ═══ PRIX DE BASE AVANT PROMOTIONS ═══");
    console.log(`   📊 Prix total: ${baseTotal.toFixed(2)}€`);
    console.log("\n   📝 Détail:");
    console.log(`      • Volume: ${volumeCost.toFixed(2)}€ (${volume}m³)`);
    console.log(`      • Matériel: ${materialCost.toFixed(2)}€ (${volume}m³)`);
    console.log(
      `      • Main d'œuvre: ${laborCost.toFixed(2)}€ (${workers} × ${duration}h)`,
    );
    console.log(
      `      • Distance: ${distanceCost.toFixed(2)}€ (${chargeableKm}km au-delà de ${freeDistanceKm}km)`,
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ✅ APPLICATION DES PROMOTIONS SUR LE PRIX DE BASE
    const promotionResult = this.applyPromotionCodes(context, baseTotal);
    baseTotal = promotionResult.finalPrice;
    details.push(...promotionResult.details);

    console.log(
      `\n💰 [PACKING-STRATEGY] ═══ PRIX DE BASE FINAL (après promotions): ${baseTotal.toFixed(2)}€ ═══`,
    );
    console.log(
      "📦 [PACKING-STRATEGY] ═══════════════════════════════════════════════════\n",
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

    console.log("🎯 [PACKING-STRATEGY] ═══ APPLICATION DES PROMOTIONS ═══");
    console.log(`📊 [PACKING-STRATEGY] Promotion active: ${isPromotionActive}`);
    console.log(`📊 [PACKING-STRATEGY] Code promo: ${promotionCode}`);
    console.log(
      `📊 [PACKING-STRATEGY] Type: ${promotionType}, Valeur: ${promotionValue}`,
    );
    console.log(
      `💰 [PACKING-STRATEGY] Prix de base avant promotion: ${basePrice.toFixed(2)}€`,
    );

    let finalPrice = basePrice;
    const details: { label: string; amount: number }[] = [];

    // Vérifier si une promotion est active
    if (
      !isPromotionActive ||
      !promotionCode ||
      !promotionValue ||
      !promotionType
    ) {
      console.log("❌ [PACKING-STRATEGY] Aucune promotion active");
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
      console.log(
        `✅ [PACKING-STRATEGY] Promotion pourcentage appliquée: -${promotionValue}% = -${discountAmount.toFixed(2)}€`,
      );
    } else if (promotionType === "FIXED") {
      finalPrice = Math.max(0, basePrice - promotionValue); // Éviter les prix négatifs
      details.push({
        label: `Promotion ${promotionCode} (-${promotionValue}€)`,
        amount: -promotionValue,
      });
      console.log(
        `✅ [PACKING-STRATEGY] Promotion fixe appliquée: -${promotionValue}€`,
      );
    } else {
      console.log(
        `⚠️ [PACKING-STRATEGY] Type de promotion non reconnu: ${promotionType}`,
      );
    }

    console.log(
      `💰 [PACKING-STRATEGY] Prix final après promotion: ${finalPrice.toFixed(2)}€`,
    );
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

    console.log("🏗️ [PACKING-STRATEGY] ═══ CALCUL AVEC RÈGLES MÉTIER ═══");
    console.log(
      `💰 [PACKING-STRATEGY] Prix de base calculé: ${baseTotal.toFixed(2)}€`,
    );

    // ✅ APPLICATION DES RÈGLES MÉTIER
    console.log("🔧 [PACKING-STRATEGY] ═══ APPLICATION DES RÈGLES MÉTIER ═══");
    console.log(
      `💰 [PACKING-STRATEGY] Prix de base avant règles: ${baseTotal.toFixed(2)}€`,
    );

    // Appliquer les règles métier via le RuleEngine
    const ruleResult = this.ruleEngine.execute(context, new Money(baseTotal));
    const finalTotal = ruleResult.finalPrice.getAmount();

    // Ajouter les détails des règles appliquées
    if (ruleResult.discounts.length > 0) {
      console.log("📋 [PACKING-STRATEGY] Règles appliquées:");
      ruleResult.discounts.forEach((discount: any) => {
        const ruleAmount = discount.getAmount().getAmount();
        const ruleType = discount.getType();
        const ruleDescription = discount.getDescription();

        details.push({
          label: `${ruleType === "discount" ? "Réduction" : "Majoration"}: ${ruleDescription}`,
          amount: ruleAmount,
        });

        console.log(
          `   └─ ${ruleDescription}: ${ruleAmount > 0 ? "+" : ""}${ruleAmount.toFixed(2)}€`,
        );
      });
    } else {
      console.log("📋 [PACKING-STRATEGY] Aucune règle applicable");
    }

    console.log(
      `💰 [PACKING-STRATEGY] Prix final après règles: ${finalTotal.toFixed(2)}€`,
    );
    console.log(
      `📊 [PACKING-STRATEGY] Différence: ${(finalTotal - baseTotal).toFixed(2)}€`,
    );

    return { total: finalTotal, details, discounts: ruleResult.discounts };
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

    console.log(
      "🔍 [PACKING-STRATEGY] ═══ VÉRIFICATION isPackingUnchanged ═══",
    );
    console.log("📊 [PACKING-STRATEGY] ServiceType:", context.getServiceType());
    console.log("📋 [PACKING-STRATEGY] Données actuelles:", {
      distance: data.distance,
      workers: data.workers,
      duration: data.duration,
      volume: data.volume,
      promotionCode: data.promotionCode,
      promotionValue: data.promotionValue,
      promotionType: data.promotionType,
      isPromotionActive: data.isPromotionActive,
    });
    console.log("📋 [PACKING-STRATEGY] Baseline (__presetSnapshot):", baseline);

    if (!baseline) {
      console.log(
        "❌ [PACKING-STRATEGY] Pas de baseline trouvé, PACKING considéré comme modifié",
      );
      console.log(
        "🔍 [PACKING-STRATEGY] Raison: __presetSnapshot est undefined/null",
      );
      return false;
    }

    // ✅ Pour PACKING, on compare volume, distance, workers, duration et promotions
    const KEYS: (keyof typeof baseline)[] = [
      "volume",
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

    console.log("🔍 [PACKING-STRATEGY] Comparaison détaillée des valeurs:");
    for (const k of KEYS) {
      const av = data[k as string];
      const bv = baseline[k];
      const equal =
        typeof av === "number" || typeof bv === "number"
          ? nearlyEqual(av as number, bv as number)
          : av === bv;

      console.log(
        `  ${String(k)}: ${av} (${typeof av}) vs ${bv} (${typeof bv}) = ${equal ? "✅ Égal" : "❌ Différent"}`,
      );

      if (!equal) {
        console.log(
          `❌ [PACKING-STRATEGY] Différence détectée sur ${String(k)}, PACKING modifié`,
        );
        console.log(`   └─ Valeur actuelle: ${av} (${typeof av})`);
        console.log(`   └─ Valeur baseline: ${bv} (${typeof bv})`);
        return false; // une différence = PACKING modifié
      }
    }

    console.log(
      "✅ [PACKING-STRATEGY] Aucune différence détectée, PACKING inchangé",
    );
    console.log("✅ [PACKING-STRATEGY] Le prix par défaut sera utilisé");
    return true; // tout identique au preset
  }
}
