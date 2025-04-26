import { AbstractQuoteCalculator } from './AbstractQuoteCalculator';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../enums/ServiceType';
import { QuoteCalculationError } from '../../interfaces/http/errors';
import { Quote } from '../valueObjects/Quote';
import { Discount, DiscountType } from '../valueObjects/Discount';
import { MovingResourceCalculator } from '../services/MovingResourceCalculator';
import { ConfigurationService } from '../services/ConfigurationService';
import { PricingConfigKey } from '../configuration/ConfigurationKey';
import { RuleEngine } from '../services/RuleEngine';

/**
 * Calculateur de devis pour les services de déménagement, emballage et autres services
 * 
 * Terminologie des prix:
 * - defaultPrice: Prix unitaire de base sans considération des quantités, durées, etc.
 * - basePrice: Prix ajusté après multiplication par les quantités, durées, nombre de travailleurs
 * - finalPrice: Prix final après application des réductions et majorations
 */
export class QuoteCalculator extends AbstractQuoteCalculator {
  private readonly resourceCalculator: MovingResourceCalculator;
  private readonly packRules: Rule[];
  private readonly serviceRules: Rule[];
  private readonly configService: ConfigurationService;

  constructor(
    configService: ConfigurationService,
    movingRules: Rule[] = [], 
    packRules: Rule[] = [], 
    serviceRules: Rule[] = []
  ) {
    super(movingRules);
    this.resourceCalculator = new MovingResourceCalculator();
    this.packRules = packRules;
    this.serviceRules = serviceRules;
    this.configService = configService;
  }

  /**
   * Calcule le prix de base (basePrice) ajusté pour les quantités et durées
   * à partir du prix unitaire (defaultPrice) et des autres paramètres du contexte
   */
  getBasePrice(context: QuoteContext): Money {
    const serviceType = context.getServiceType();
    
    switch(serviceType) {
      case ServiceType.MOVING:
        return this.getMovingBasePrice(context);
      case ServiceType.PACK:
        return this.getPackBasePrice(context);
      case ServiceType.SERVICE:
        return this.getServiceBasePrice(context);
      default:
        throw new QuoteCalculationError(`Invalid service type: ${serviceType}`);
    }
  }

  private getMovingBasePrice(context: QuoteContext): Money {
    console.log("\n🚚 DÉBUT GETMOVINGBASEPRICE - CALCUL DÉTAILLÉ DU PRIX DÉMÉNAGEMENT");
    
    if (context.getServiceType() !== ServiceType.MOVING) {
      console.log("❌ ERREUR: Type de contexte invalide pour un devis de déménagement");
      throw new QuoteCalculationError('Invalid context type for moving quote');
    }

    // 1. Récupérer les valeurs du contexte
    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;
    const workers = context.getValue<number>('workers') ?? 2; // Nombre de déménageurs spécifié
    const defaultWorkers = context.getValue<number>('defaultWorkers') ?? 2; // Nombre de déménageurs par défaut
    // Calculer le nombre de déménageurs basé sur le volume si non spécifié
    const calculatedMovers = context.getValue<number>('numberOfMovers') ?? 
                             this.resourceCalculator.calculateRequiredMovers(volume);
    
    // Utiliser le nombre spécifié de workers s'il existe, sinon utiliser le nombre calculé
    const numberOfMovers = workers > 0 ? workers : calculatedMovers;
    
    console.log("📊 DONNÉES DE BASE DÉMÉNAGEMENT:", {
      volume: `${volume} m³`,
      distance: `${distance} km`,
      nombreDéménageurs: numberOfMovers,
      nombreCalculéSelonVolume: calculatedMovers
    });
    
    // 2. Récupération des frais de carburant et de péage du contexte ou calcul si non fournis
    const fuelCost = context.getValue<number>('fuelCost') ?? this.calculateFuelCost(distance);
    const tollCost = context.getValue<number>('tollCost') ?? this.calculateTollCost(distance);
    
    console.log("⛽ FRAIS DE DÉPLACEMENT:", {
      carburant: `${Math.round(fuelCost)}€`,
      péages: `${Math.round(tollCost)}€`
    });
    
    // 3. Calcul du prix basé sur le volume
    const pricePerM3 = this.configService.getNumberValue(
      PricingConfigKey.MOVING_BASE_PRICE_PER_M3, 
      10 // valeur par défaut
    );
    const volumePrice = volume * pricePerM3;
    
    console.log("📦 CALCUL PRIX AU VOLUME:", {
      tarifParM3: `${pricePerM3}€/m³`,
      calcul: `${volume} m³ × ${pricePerM3}€ = ${volumePrice}€`
    });
    
    // 4. Calcul du prix basé sur la distance (main d'œuvre et usure du véhicule)
    const pricePerKm = this.configService.getNumberValue(
      PricingConfigKey.MOVING_DISTANCE_PRICE_PER_KM, 
      2 // valeur par défaut
    );
    const distancePrice = distance * pricePerKm;
    
    console.log("🚗 CALCUL PRIX À LA DISTANCE:", {
      tarifParKm: `${pricePerKm}€/km`,
      calcul: `${distance} km × ${pricePerKm}€ = ${distancePrice}€`
    });
    
    // 5. Calcul du coût des déménageurs supplémentaires si applicable
    let extraMoversCost = 0;
    if (numberOfMovers > calculatedMovers) {
      const extraMovers = numberOfMovers - calculatedMovers;
      const moverPricePerHour = this.configService.getNumberValue(
        PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR,
        40 // valeur par défaut
      );
      
      // Estimer la durée du déménagement en fonction du volume (environ 1h par 10m³)
      const estimatedHours = Math.max(3, Math.ceil(volume / 10));
      
      console.log("👷 DÉMÉNAGEURS SUPPLÉMENTAIRES:", {
        déménageursSupp: extraMovers,
        tarifHoraire: `${moverPricePerHour}€/h`,
        heuresEstimées: `${estimatedHours}h`
      });
      
      extraMoversCost = (extraMovers * estimatedHours) * moverPricePerHour;
      console.log(`👷 COÛT DÉMÉNAGEURS SUPPLÉMENTAIRES: ${extraMovers} × ${estimatedHours}h × ${moverPricePerHour}€ = ${extraMoversCost}€`);
    } else {
      console.log("👷 PAS DE DÉMÉNAGEURS SUPPLÉMENTAIRES");
    }
    
    // 6. Calculer le prix de base final (basePrice)
    const basePrice = volumePrice + distancePrice + fuelCost + tollCost + extraMoversCost;

    console.log("💰 COMPOSANTES DU PRIX FINAL DÉMÉNAGEMENT:", {
      prixVolume: `${Math.round(volumePrice)}€`,
      prixDistance: `${Math.round(distancePrice)}€`,
      fraisCarburant: `${Math.round(fuelCost)}€`,
      fraisPéages: `${Math.round(tollCost)}€`,
      coutDéménageursSupp: `${Math.round(extraMoversCost)}€`,
      prixTotal: `${Math.round(basePrice)}€`
    });
    
    console.log("🚚 FIN GETMOVINGBASEPRICE\n");
    return new Money(Math.round(basePrice));
  }
  
  private getPackBasePrice(context: QuoteContext): Money {
    console.log("\n📦 DÉBUT GETPACKBASEPRICE - CALCUL DÉTAILLÉ DU PRIX EMBALLAGE");
    
    if (context.getServiceType() !== ServiceType.PACK) {
      console.log("❌ ERREUR: Type de contexte invalide pour un devis d'emballage");
      throw new QuoteCalculationError('Invalid context type for pack quote');
    }
    
    // 1. Récupérer les valeurs du contexte
    const defaultPrice = context.getValue<number>('defaultPrice') ?? 0; // Prix unitaire de base
    const duration = context.getValue<number>('duration') ?? 1;
    const workers = context.getValue<number>('workers') ?? 2;
    const baseWorkers = context.getValue<number>('baseWorkers') ?? 2;
    const baseDuration = context.getValue<number>('baseDuration') ?? 1;
    const distance = context.getValue<number>('distance') ?? 0;
    const pickupNeedsLift = context.getValue<boolean>('pickupNeedsLift') ?? false;
    const deliveryNeedsLift = context.getValue<boolean>('deliveryNeedsLift') ?? false;
    
    console.log("📊 DONNÉES DE BASE EMBALLAGE:", {
      defaultPrice: `${defaultPrice}€`,
      duration: `${duration} jour(s)`,
      workers: workers,
      baseWorkers: baseWorkers,
      baseDuration: `${baseDuration} jour(s)`,
      distance: `${distance} km`,
      monteMeubleEnlèvement: pickupNeedsLift ? "Oui" : "Non",
      monteMeubleLivraison: deliveryNeedsLift ? "Oui" : "Non"
    });
    
    // 2. Calculer le coût des jours supplémentaires
    let extraDurationCost = 0;
    if (duration > baseDuration) {
      const extraDays = duration - baseDuration;
      // Utiliser le taux journalier fixe configuré dans le projet
      const workerPricePerDay = this.configService.getNumberValue(
        PricingConfigKey.PACK_WORKER_PRICE, 
        120 // valeur par défaut
      );
      
      console.log("📅 JOURS SUPPLÉMENTAIRES:", {
        joursSupp: extraDays,
        tarifJournalier: `${workerPricePerDay}€/jour (taux fixe)`,
        travailleurs: workers // Nombre total de travailleurs
      });
      
      const extraDayDiscountRate = this.configService.getNumberValue(
        PricingConfigKey.PACK_EXTRA_DAY_DISCOUNT_RATE, 
        0.8 // valeur par défaut
      );
      console.log(`📅 TAUX DE RÉDUCTION JOURS SUPPLÉMENTAIRES: ${extraDayDiscountRate * 100}%`);
      
      // Multiplier par le nombre total de travailleurs
      extraDurationCost = (extraDays * workers) * workerPricePerDay * extraDayDiscountRate ;
      console.log(`📅 COÛT JOURS SUPPLÉMENTAIRES: ${workerPricePerDay}€ × ${extraDays} jour(s) × ${extraDayDiscountRate} × ${workers} travailleur(s) = ${extraDurationCost.toFixed(2)}€`);
    } else {
      console.log("📅 PAS DE JOURS SUPPLÉMENTAIRES");
    }
    
    // 3. Calculer le coût des travailleurs supplémentaires
    let extraWorkerCost = 0;
    if (workers > baseWorkers) {
      const extraWorkers = workers - baseWorkers;
      const workerPricePerDay = this.configService.getNumberValue(
        PricingConfigKey.PACK_WORKER_PRICE, 
        120 // valeur par défaut
      );
      
      console.log("👷 TRAVAILLEURS SUPPLÉMENTAIRES:", {
        travailleursSupp: extraWorkers,
        tarifJournalier: `${workerPricePerDay}€/jour`,
        duréeTotale: `${duration} jour(s)`
      });
      
      const extraWorkerBaseCost = extraWorkers * workerPricePerDay * duration;
      console.log(`👷 COÛT DE BASE: ${extraWorkers} × ${workerPricePerDay}€ × ${duration} jour(s) = ${extraWorkerBaseCost}€`);
      
      let reductionRate;
      if (duration === 1) {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_1_DAY, 
          0.05 // valeur par défaut
        );
        console.log(`👷 TAUX DE RÉDUCTION (1 JOUR): ${reductionRate * 100}%`);
      } else {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS, 
          0.10 // valeur par défaut
        );
        console.log(`👷 TAUX DE RÉDUCTION (PLUSIEURS JOURS): ${reductionRate * 100}%`);
      }
      
      extraWorkerCost = extraWorkerBaseCost * (1 - reductionRate);
      console.log(`👷 COÛT FINAL APRÈS RÉDUCTION: ${extraWorkerBaseCost}€ × ${(1 - reductionRate).toFixed(2)} = ${extraWorkerCost.toFixed(2)}€`);
    } else {
      console.log("👷 PAS DE TRAVAILLEURS SUPPLÉMENTAIRES");
    }
    
    // 4. Calculer les frais de distance (km au-delà de l'inclus)
    let distanceCost = 0;
    const includedDistance = this.configService.getNumberValue(
      PricingConfigKey.PACK_INCLUDED_DISTANCE, 
      20 // valeur par défaut
    );
    
    console.log("🚗 DISTANCE:", {
      distanceTotale: `${distance} km`,
      distanceIncluse: `${includedDistance} km`
    });
    
    if (distance > includedDistance) {
      const extraKm = distance - includedDistance;
      const pricePerExtraKm = this.configService.getNumberValue(
        PricingConfigKey.PACK_EXTRA_KM_PRICE, 
        1.5 // valeur par défaut
      );
      
      distanceCost = extraKm * pricePerExtraKm;
      console.log(`🚗 COÛT DISTANCE SUPPLÉMENTAIRE: (${distance} - ${includedDistance}) × ${pricePerExtraKm}€ = ${extraKm} km × ${pricePerExtraKm}€ = ${distanceCost.toFixed(2)}€`);
    } else {
      console.log("🚗 PAS DE FRAIS DE DISTANCE SUPPLÉMENTAIRE (distance incluse)");
    }
    
    // 5. Calculer le coût du monte-meuble
    let liftCost = 0;
    const liftPrice = this.configService.getNumberValue(
      PricingConfigKey.PACK_LIFT_PRICE, 
      200 // valeur par défaut
    );
    
    console.log("🏗️ MONTE-MEUBLE:", {
      tarifUnitaire: `${liftPrice}€`,
      enlèvement: pickupNeedsLift ? "Oui" : "Non",
      livraison: deliveryNeedsLift ? "Oui" : "Non"
    });
    
    if (pickupNeedsLift) {
      liftCost += liftPrice;
      console.log(`🏗️ COÛT MONTE-MEUBLE ENLÈVEMENT: ${liftPrice}€`);
    }
    
    if (deliveryNeedsLift) {
      liftCost += liftPrice;
      console.log(`🏗️ COÛT MONTE-MEUBLE LIVRAISON: ${liftPrice}€`);
    }
    
    console.log(`🏗️ COÛT TOTAL MONTE-MEUBLE: ${liftCost}€`);
    
    // 6. Calculer le prix de base final (basePrice)
    const basePrice = defaultPrice + extraDurationCost + extraWorkerCost + distanceCost + liftCost;
    
    console.log("💰 COMPOSANTES DU PRIX FINAL EMBALLAGE:", {
      prixDeBase: `${defaultPrice}€`,
      coutJoursSupp: `${extraDurationCost.toFixed(2)}€`,
      coutTravailleursSupp: `${extraWorkerCost.toFixed(2)}€`,
      fraisDistance: `${distanceCost.toFixed(2)}€`,
      fraisMonteMeuble: `${liftCost}€`,
      prixTotal: `${basePrice.toFixed(2)}€`,
      prixArrondi: `${Math.round(basePrice)}€`
    });
    
    console.log("📦 FIN GETPACKBASEPRICE\n");
    return new Money(Math.round(basePrice));
  }

  private getServiceBasePrice(context: QuoteContext): Money {
    console.log("\n🔢 DÉBUT GETSERVICEBASEPRICE - CALCUL DÉTAILLÉ DU PRIX");
    
    if (context.getServiceType() !== ServiceType.SERVICE) {
      console.log("❌ ERREUR: Type de contexte invalide pour un devis de service");
      throw new QuoteCalculationError('Invalid context type for service quote');
    }
    
    // 1. Récupérer les valeurs du contexte
    const defaultPrice = context.getValue<number>('defaultPrice') ?? 0; // Prix unitaire de base
    const duration = context.getValue<number>('duration') ?? 1;
    const workers = context.getValue<number>('workers') ?? 1;
    const defaultDuration = context.getValue<number>('defaultDuration') ?? 1;
    const defaultWorkers = context.getValue<number>('defaultWorkers') ?? 1;
    
    console.log("📊 DONNÉES DE BASE RÉCUPÉRÉES:", {
      defaultPrice: `${defaultPrice}€`,
      duration: `${duration}h`,
      workers: workers,
      defaultDuration: `${defaultDuration}h`,
      defaultWorkers: defaultWorkers
    });
    
    // 2. Vérifier si c'est la configuration par défaut
    if (duration === defaultDuration && workers === defaultWorkers) {
      console.log("ℹ️ CONFIGURATION PAR DÉFAUT DÉTECTÉE - RETOUR DU PRIX PAR DÉFAUT");
      console.log(`💰 PRIX FINAL: ${defaultPrice}€`);
      return new Money(defaultPrice);
    }
    
    console.log("ℹ️ MODIFICATIONS DÉTECTÉES - CALCUL DU PRIX AJUSTÉ");
    
    // 3. Calculer le coût des travailleurs supplémentaires
    let extraWorkerCost = 0;
    if (workers > defaultWorkers) {
      const extraWorkers = workers - defaultWorkers;
      const workerPricePerHour = this.configService.getNumberValue(
        PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, 
        35 // valeur par défaut
      );
      
      console.log("👷 TRAVAILLEURS SUPPLÉMENTAIRES:", {
        extraWorkers: extraWorkers,
        tarifHoraire: `${workerPricePerHour}€/h`,
        duréeTotale: `${duration}h`
      });
      
      const extraWorkerBaseCost = (extraWorkers * duration) * workerPricePerHour;
      console.log(`👷 COÛT DE BASE: ${extraWorkers} × ${workerPricePerHour}€ × ${duration}h = ${extraWorkerBaseCost}€`);
      
      let reductionRate;
      if (duration <= 2) {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_SHORT, 
          0.1 // valeur par défaut
        );
        console.log(`👷 TAUX DE RÉDUCTION (DURÉE ≤ 2h): ${reductionRate * 100}%`);
      } else {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_LONG, 
          0.15 // valeur par défaut
        );
        console.log(`👷 TAUX DE RÉDUCTION (DURÉE > 2h): ${reductionRate * 100}%`);
      }
      
      extraWorkerCost = extraWorkerBaseCost * (1 - reductionRate);
      console.log(`👷 COÛT FINAL APRÈS RÉDUCTION: ${extraWorkerBaseCost}€ × ${(1 - reductionRate).toFixed(2)} = ${extraWorkerCost.toFixed(2)}€`);
    } else {
      console.log("👷 PAS DE TRAVAILLEURS SUPPLÉMENTAIRES");
    }
    
    // 4. Calculer le coût des heures supplémentaires
    let extraHoursCost = 0;
    if (duration > defaultDuration) {
      const extraHours = duration - defaultDuration;
      // Utiliser le taux horaire fixe configuré dans le projet au lieu de calculer à partir du prix par défaut
      const hourlyRate = this.configService.getNumberValue(
        PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, 
        35 // valeur par défaut
      );
      
      console.log("⏱️ HEURES SUPPLÉMENTAIRES:", {
        extraHours: extraHours,
        tarifHoraire: `${hourlyRate}€/h (taux fixe)`,
        travailleurs: workers // Nombre total de travailleurs, pas seulement les travailleurs par défaut
      });
      
      const extraHourRate = this.configService.getNumberValue(
        PricingConfigKey.SERVICE_EXTRA_HOUR_RATE, 
        0.9 // valeur par défaut: 90% du tarif horaire standard
      );
      console.log(`⏱️ FACTEUR TARIF HEURES SUPPLÉMENTAIRES: ${extraHourRate * 100}% du tarif standard`);
      
      // Multiplier par le nombre TOTAL de travailleurs (workers), pas seulement par le nombre de travailleurs par défaut
      extraHoursCost = hourlyRate * extraHours * extraHourRate * workers;
      console.log(`⏱️ COÛT HEURES SUPPLÉMENTAIRES: ${hourlyRate}€ × ${extraHours}h × ${extraHourRate} × ${workers} travailleur(s) = ${extraHoursCost.toFixed(2)}€`);
    } else {
      console.log("⏱️ PAS D'HEURES SUPPLÉMENTAIRES");
    }
    
    // 5. Calculer le prix de base final (basePrice)
    const basePrice = defaultPrice + extraWorkerCost + extraHoursCost;
    
    console.log("💰 COMPOSANTES DU PRIX FINAL:", {
      prixDeBase: `${defaultPrice}€`,
      coutTravailleursSupp: `${extraWorkerCost.toFixed(2)}€`,
      coutHeuresSupp: `${extraHoursCost.toFixed(2)}€`,
      prixTotal: `${basePrice.toFixed(2)}€`,
      prixArrondi: `${Math.round(basePrice)}€`
    });
    
    console.log("🔢 FIN GETSERVICEBASEPRICE\n");
    return new Money(Math.round(basePrice));
  }
  
  /**
   * Calcule les frais de carburant en fonction de la distance
   * @param distance Distance en km
   * @returns Coût du carburant en euros
   */
  private calculateFuelCost(distance: number): number {
    // Récupérer les valeurs de configuration
    const fuelConsumptionPer100km = this.configService.getNumberValue(
      PricingConfigKey.FUEL_CONSUMPTION_PER_100KM, 
      25 // valeur par défaut
    );
    
    const fuelPricePerLiter = this.configService.getNumberValue(
      PricingConfigKey.FUEL_PRICE_PER_LITER, 
      1.8 // valeur par défaut
    );
    
    // Consommation totale en litres
    const fuelConsumption = (distance * fuelConsumptionPer100km) / 100;
    
    // Coût du carburant
    return fuelConsumption * fuelPricePerLiter;
  }
  
  /**
   * Estime les frais de péage en fonction de la distance
   * @param distance Distance en km
   * @returns Coût estimé des péages en euros
   */
  private calculateTollCost(distance: number): number {
    // Récupérer les valeurs de configuration
    const highwayRatio = this.configService.getNumberValue(
      PricingConfigKey.HIGHWAY_RATIO, 
      0.7 // valeur par défaut
    );
    
    const tollCostPerKm = this.configService.getNumberValue(
      PricingConfigKey.TOLL_COST_PER_KM, 
      0.15 // valeur par défaut
    );
    
    // Estimation de la distance sur autoroute
    const highwayDistance = distance * highwayRatio;
    
    // Coût des péages
    return highwayDistance * tollCostPerKm;
  }

  private enrichContextWithMovingResources(context: QuoteContext): QuoteContext {
    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;
    const numberOfMovers = this.resourceCalculator.calculateRequiredMovers(volume);
    const numberOfBoxes = this.resourceCalculator.calculateEstimatedBoxes(volume);
    
    // Utiliser les frais de carburant et de péage du contexte ou les calculer si non fournis
    const fuelCost = context.getValue<number>('fuelCost') ?? this.calculateFuelCost(distance);
    const tollCost = context.getValue<number>('tollCost') ?? this.calculateTollCost(distance);
    
    // Créer un nouveau contexte avec le même type de service que le contexte d'origine
    const serviceType = context.getServiceType();
    const newContext = new QuoteContext(serviceType);
    
    // Copier toutes les données existantes
    const existingData = context.getAllData();
    Object.keys(existingData).forEach(key => {
      newContext.setValue(key, existingData[key]);
    });
    
    // Ajouter les nouvelles données
    newContext.setValue('numberOfMovers', numberOfMovers);
    newContext.setValue('numberOfBoxes', numberOfBoxes);
    newContext.setValue('fuelCost', fuelCost);
    newContext.setValue('tollCost', tollCost);
    
    return newContext;
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    console.log("\n==== DÉBUT QUOTEACLCULATOR.CALCULATE ====");
    console.log("📋 CONTEXTE REÇU:", {
      serviceType: context.getServiceType(),
      data: context.getAllData()
    });
    
    try {
      const serviceType = context.getServiceType();
      console.log("🔍 TYPE DE SERVICE:", serviceType);
      
      // Vérifier si les valeurs ont été modifiées par rapport aux valeurs par défaut
      const data = context.getAllData();
      const hasModifications = this.hasModifications(context);
      
      console.log("🔍 VÉRIFICATION DES MODIFICATIONS:");
      if (data.defaultDuration && data.duration) {
        console.log(`   - Durée: ${data.duration} (défaut: ${data.defaultDuration}) - ${data.duration !== data.defaultDuration ? 'MODIFIÉE' : 'IDENTIQUE'}`);
      }
      if (data.defaultWorkers && data.workers) {
        console.log(`   - Travailleurs: ${data.workers} (défaut: ${data.defaultWorkers}) - ${data.workers !== data.defaultWorkers ? 'MODIFIÉS' : 'IDENTIQUES'}`);
      }
      console.log(`   - Conclusion: ${hasModifications ? 'MODIFICATIONS DÉTECTÉES' : 'AUCUNE MODIFICATION'}`);
      
      // Si aucune modification, retourner directement le prix par défaut sans appliquer de règles
      if (!hasModifications) {
        console.log(`ℹ️ AUCUNE MODIFICATION - UTILISATION DU PRIX PAR DÉFAUT SANS APPLIQUER DE RÈGLES`);
        return new Quote(
          new Money(data.defaultPrice || 0),
          new Money(data.defaultPrice || 0),
          [],
          serviceType
        );
      }
      
      // Sinon, procéder au calcul normal avec enrichissement et application des règles
      console.log(`ℹ️ MODIFICATIONS DÉTECTÉES - APPLICATION DES RÈGLES`);
      
      let enrichedContext = context;
      let rules: Rule[];
      
      // Choisir les règles appropriées et enrichir le contexte selon le type
      console.log("🔄 SÉLECTION DES RÈGLES en fonction du type de service");
      switch(serviceType) {
        case ServiceType.MOVING:
          console.log("🚚 SERVICE DE TYPE MOVING");
          console.log("🔄 ENRICHISSEMENT DU CONTEXTE MOVING:", {
            avant: context.getAllData()
          });
          enrichedContext = this.enrichContextWithMovingResources(context);
          console.log("✅ CONTEXTE ENRICHI:", {
            après: enrichedContext.getAllData()
          });
          rules = this.rules;         
          console.log(`📋 ${this.rules.length} règles MOVING chargées`);
          console.log("📋 RÈGLES MOVING:", this.rules);
          break;
        case ServiceType.PACK:
          console.log("📦 SERVICE DE TYPE PACK");
          rules = this.packRules;
          console.log(`📋 ${this.packRules.length} règles PACK chargées`);
          console.log("📋 RÈGLES PACK:", this.packRules);
          break;
        case ServiceType.SERVICE:
          console.log("🛠️ SERVICE DE TYPE SERVICE");
          rules = this.serviceRules;
          console.log(`📋 ${this.serviceRules.length} règles SERVICE chargées`);
          console.log("📋 RÈGLES SERVICE:", this.serviceRules);
          break;
        default:
          console.log("❌ TYPE DE SERVICE INVALIDE:", serviceType);
          throw new QuoteCalculationError(`Invalid service type: ${serviceType}`);
      }
      
      console.log("🧮 CALCUL DU PRIX DE BASE");
      try {
        // Calculer le prix de base
        const basePrice = this.getBasePrice(enrichedContext);
        console.log("✅ PRIX DE BASE CALCULÉ:", basePrice.getAmount());
        
        console.log("⚙️ CRÉATION D'UNE INSTANCE DE RULEENGINE");
        // Instancier un nouveau RuleEngine avec les règles appropriées
        // pour s'assurer que les bonnes règles sont utilisées
        const { RuleEngine } = require('../services/RuleEngine');
        const ruleEngine = new RuleEngine(rules);
        
        console.log("🔍 EXÉCUTION DES RÈGLES pour ajuster le prix");
        // Appliquer les règles spécifiques au type de service
        try {
          const result = ruleEngine.execute(enrichedContext, basePrice);
          console.log("✅ RÈGLES APPLIQUÉES AVEC SUCCÈS");
          console.log("💰 RÉSULTAT:", {
            basePrice: basePrice.getAmount(),
            finalPrice: result.finalPrice.getAmount(),
            discounts: result.discounts.length
          });
          
          const { finalPrice, discounts } = result;
          
          // Retourner le devis final
          const quote = new Quote(
            basePrice,
            finalPrice,
            discounts,
            serviceType // Passer directement le type de service au lieu du contexte
          );
          
          console.log("==== FIN QUOTEACLCULATOR.CALCULATE (SUCCÈS) ====\n");
          return quote;
        } catch (ruleError) {
          console.log("❌ ERREUR DANS L'EXÉCUTION DES RÈGLES:", ruleError);
          if (ruleError instanceof Error) {
            console.log("📋 TYPE D'ERREUR:", ruleError.constructor.name);
            console.log("📋 MESSAGE:", ruleError.message);
            console.log("📋 STACK:", ruleError.stack);
          }
          throw new QuoteCalculationError(`Error applying rules: ${ruleError instanceof Error ? ruleError.message : String(ruleError)}`);
        }
      } catch (basePriceError) {
        console.log("❌ ERREUR DANS LE CALCUL DU PRIX DE BASE:", basePriceError);
        if (basePriceError instanceof Error) {
          console.log("📋 TYPE D'ERREUR:", basePriceError.constructor.name);
          console.log("📋 MESSAGE:", basePriceError.message);
          console.log("📋 STACK:", basePriceError.stack);
        }
        throw basePriceError; // Propager l'erreur telle quelle
      }
    } catch (error) {
      console.log("❌ ERREUR GLOBALE DANS QUOTEACLCULATOR.CALCULATE:", error);
      if (error instanceof Error) {
        console.log("📋 TYPE D'ERREUR:", error.constructor.name);
        console.log("📋 MESSAGE:", error.message);
        console.log("📋 STACK:", error.stack);
      }
      console.log("==== FIN QUOTEACLCULATOR.CALCULATE (ERREUR) ====\n");
      throw error;
    }
  }
  
  /**
   * Vérifie si les valeurs du contexte ont été modifiées par rapport aux valeurs par défaut
   */
  private hasModifications(context: QuoteContext): boolean {
    const data = context.getAllData();
    
    // Vérifier si la durée et le nombre de travailleurs ont été modifiés
    const isDurationModified = data.duration !== undefined && 
                              data.defaultDuration !== undefined && 
                              data.duration !== data.defaultDuration;
                            
    const isWorkersModified = data.workers !== undefined && 
                             data.defaultWorkers !== undefined && 
                             data.workers !== data.defaultWorkers;
    
    // Pour les types spécifiques, vérifier d'autres modifications potentielles
    switch(context.getServiceType()) {
      case ServiceType.PACK:
        // Vérifier les options de monte-meuble et la distance
        const hasLiftOption = data.pickupNeedsLift === true || data.deliveryNeedsLift === true;
        const hasExtraDistance = (data.distance ?? 0) > (data.includedDistance || 20);
        return isDurationModified || isWorkersModified || hasLiftOption || hasExtraDistance;
        
      case ServiceType.MOVING:
        // Pour les déménagements, vérifier le volume et la distance
        const hasCustomVolume = data.volume !== undefined && data.defaultVolume !== undefined && 
                              data.volume !== data.defaultVolume;
        return isDurationModified || isWorkersModified || hasCustomVolume;
        
      case ServiceType.SERVICE:
        // Pour les services, seules la durée et le nombre de travailleurs comptent
        return isDurationModified || isWorkersModified;
        
      default:
        // Par défaut, considérer qu'il y a des modifications
        return true;
    }
  }
} 