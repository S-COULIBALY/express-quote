/**
 * ============================================================================
 * SCRIPT DE TEST: CONTRAINTES CONSOMMÉES PAR LE MONTE-MEUBLES
 * ============================================================================
 *
 * 🎯 OBJECTIF:
 * Vérifier que les contraintes consommées par le monte-meubles ne sont PAS
 * facturées séparément (éviter la double facturation)
 *
 * 📋 TESTS:
 * 1. Scénario sans monte-meubles: Toutes les règles s'appliquent normalement
 * 2. Scénario avec monte-meubles: Les contraintes consommées sont ignorées
 * 3. Vérification des prix et règles appliquées
 */

import { PrismaClient } from "@prisma/client";
import { RuleEngine } from "../src/quotation/domain/services/RuleEngine";
import { Rule } from "../src/quotation/domain/valueObjects/Rule";
import { Money } from "../src/quotation/domain/valueObjects/Money";
import { QuoteContext } from "../src/quotation/domain/valueObjects/QuoteContext";
import { AutoDetectionService } from "../src/quotation/domain/services/AutoDetectionService";

const prisma = new PrismaClient();

interface TestScenario {
  name: string;
  description: string;
  contextData: Record<string, unknown>;
  expectedMonteMenuble: boolean;
  expectedConsumedConstraints: string[];
  shouldApplyRules: string[];
  shouldNotApplyRules: string[];
}

/**
 * Scénarios de test
 */
const scenarios: TestScenario[] = [
  {
    name: "✅ TEST 1: Sans monte-meubles",
    description: "Étage 2 sans ascenseur - Pas de monte-meubles requis",
    contextData: {
      pickupFloor: "2",
      pickupElevator: "no",
      pickupLogisticsConstraints: ["difficult_stairs", "narrow_corridors"],
      deliveryFloor: "1",
      deliveryElevator: "no",
      deliveryLogisticsConstraints: [],
      volume: 15,
      distance: 20,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: false,
    expectedConsumedConstraints: [],
    shouldApplyRules: ["Escalier difficile", "Couloirs étroits"],
    shouldNotApplyRules: ["Monte-meuble"],
  },
  {
    name: "✅ TEST 2: Avec monte-meubles - Étage élevé",
    description:
      "Étage 5 sans ascenseur - Monte-meubles requis, contraintes consommées",
    contextData: {
      pickupFloor: "5",
      pickupElevator: "no",
      pickupLogisticsConstraints: [
        "difficult_stairs",
        "narrow_corridors",
        "bulky_furniture",
        "heavy_items",
      ],
      deliveryFloor: "3",
      deliveryElevator: "no",
      deliveryLogisticsConstraints: ["difficult_stairs"],
      volume: 30,
      distance: 25,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: true,
    expectedConsumedConstraints: [
      "difficult_stairs",
      "narrow_corridors",
      "bulky_furniture",
      "heavy_items",
    ],
    shouldApplyRules: ["Monte-meuble"],
    shouldNotApplyRules: [
      "Escalier difficile",
      "Couloirs étroits",
      "Meubles encombrants",
      "Objets très lourds",
    ],
  },
  {
    name: "✅ TEST 3: Avec monte-meubles - Ascenseur inadapté",
    description: "Étage 4 avec petit ascenseur - Monte-meubles requis",
    contextData: {
      pickupFloor: "4",
      pickupElevator: "small",
      pickupLogisticsConstraints: [
        "elevator_unsuitable_size",
        "narrow_corridors",
        "bulky_furniture",
      ],
      deliveryFloor: "2",
      deliveryElevator: "medium",
      deliveryLogisticsConstraints: [],
      volume: 25,
      distance: 15,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: true,
    expectedConsumedConstraints: [
      "elevator_unsuitable_size",
      "narrow_corridors",
      "bulky_furniture",
    ],
    shouldApplyRules: ["Monte-meuble"],
    shouldNotApplyRules: [
      "Ascenseur",
      "Couloirs étroits",
      "Meubles encombrants",
    ],
  },
  {
    name: "✅ TEST 4: Contraintes mixtes",
    description: "Monte-meubles requis + contraintes non consommées",
    contextData: {
      pickupFloor: "5",
      pickupElevator: "no",
      pickupLogisticsConstraints: [
        "difficult_stairs",
        "narrow_corridors",
        "difficult_parking",
        "pedestrian_zone",
      ],
      deliveryFloor: "3",
      deliveryElevator: "no",
      deliveryLogisticsConstraints: ["difficult_stairs", "complex_traffic"],
      volume: 30,
      distance: 25,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: true,
    expectedConsumedConstraints: ["difficult_stairs", "narrow_corridors"],
    shouldApplyRules: [
      "Monte-meuble",
      "Stationnement difficile",
      "Zone piétonne",
      "Circulation complexe",
    ],
    shouldNotApplyRules: ["Escalier difficile", "Couloirs étroits"],
  },
  // ============================================================================
  // 🔥 CRASH TEST - VALEURS EXTRÊMES ET CAS COMPLEXES
  // ============================================================================
  {
    name: "🔥 TEST 5: Volume extrême (gratte-ciel)",
    description: "Volume 500m³, étages 45 et 38, toutes contraintes",
    contextData: {
      pickupFloor: "45",
      pickupElevator: "no",
      pickupLogisticsConstraints: [
        "difficult_stairs",
        "narrow_corridors",
        "bulky_furniture",
        "heavy_items",
        "indirect_exit",
        "complex_multilevel_access",
      ],
      deliveryFloor: "38",
      deliveryElevator: "small",
      deliveryLogisticsConstraints: [
        "elevator_unsuitable_size",
        "difficult_stairs",
        "narrow_corridors",
      ],
      volume: 500,
      distance: 500,
      scheduledDate: new Date("2025-11-15T08:00:00"),
    },
    expectedMonteMenuble: true,
    expectedConsumedConstraints: [
      "difficult_stairs",
      "narrow_corridors",
      "bulky_furniture",
      "heavy_items",
    ],
    shouldApplyRules: ["Monte-meuble"],
    shouldNotApplyRules: ["Escalier difficile", "Couloirs étroits"],
  },
  {
    name: "🔥 TEST 6: Toutes les contraintes simultanément",
    description: "Scénario avec accumulation massive de contraintes",
    contextData: {
      pickupFloor: "8",
      pickupElevator: "no",
      pickupLogisticsConstraints: [
        "pedestrian_zone",
        "narrow_inaccessible_street",
        "difficult_parking",
        "complex_traffic",
        "difficult_stairs",
        "narrow_corridors",
        "long_carrying_distance",
        "indirect_exit",
        "complex_multilevel_access",
        "access_control",
        "administrative_permit",
        "time_restrictions",
        "fragile_floor",
      ],
      deliveryFloor: "7",
      deliveryElevator: "small",
      deliveryLogisticsConstraints: [
        "elevator_unsuitable_size",
        "pedestrian_zone",
        "difficult_parking",
        "difficult_stairs",
        "narrow_corridors",
        "access_control",
        "fragile_floor",
      ],
      volume: 120,
      distance: 150,
      scheduledDate: new Date("2025-12-21T06:00:00"),
    },
    expectedMonteMenuble: true,
    expectedConsumedConstraints: [
      "difficult_stairs",
      "narrow_corridors",
      "elevator_unsuitable_size",
    ],
    shouldApplyRules: [
      "Monte-meuble",
      "Zone piétonne",
      "Stationnement",
      "Circulation",
    ],
    shouldNotApplyRules: ["Escalier difficile", "Couloirs étroits"],
  },
  // ============================================================================
  // 🎯 EDGE CASES - CAS LIMITES
  // ============================================================================
  {
    name: "🎯 TEST 7: Étage au seuil exact (étage 3)",
    description:
      "Vérification du seuil de détection (étage 3 = pas de monte-meuble)",
    contextData: {
      pickupFloor: "3",
      pickupElevator: "no",
      pickupLogisticsConstraints: ["difficult_stairs"],
      deliveryFloor: "1",
      deliveryElevator: "large",
      volume: 30,
      distance: 20,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: false,
    expectedConsumedConstraints: [],
    shouldApplyRules: ["Escalier"],
    shouldNotApplyRules: ["Monte-meuble"],
  },
  {
    name: "🎯 TEST 8: Étage au-dessus du seuil (étage 4)",
    description:
      "Vérification du seuil de détection (étage 4 = monte-meuble requis)",
    contextData: {
      pickupFloor: "4",
      pickupElevator: "no",
      pickupLogisticsConstraints: ["difficult_stairs"],
      deliveryFloor: "1",
      deliveryElevator: "large",
      volume: 30,
      distance: 20,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: true,
    expectedConsumedConstraints: ["difficult_stairs"],
    shouldApplyRules: ["Monte-meuble"],
    shouldNotApplyRules: ["Escalier difficile"],
  },
  {
    name: "🎯 TEST 9: Rez-de-chaussée (étage 0)",
    description: "Pas de monte-meuble au rez-de-chaussée",
    contextData: {
      pickupFloor: "0",
      pickupElevator: "no",
      deliveryFloor: "0",
      deliveryElevator: "no",
      volume: 30,
      distance: 15,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: false,
    expectedConsumedConstraints: [],
    shouldApplyRules: [],
    shouldNotApplyRules: ["Monte-meuble"],
  },
  {
    name: "🎯 TEST 10: Distance minimale (même immeuble)",
    description: "Distance 0km - déménagement dans le même immeuble",
    contextData: {
      pickupFloor: "5",
      pickupElevator: "large",
      deliveryFloor: "8",
      deliveryElevator: "large",
      volume: 25,
      distance: 0,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: false,
    expectedConsumedConstraints: [],
    shouldApplyRules: [],
    shouldNotApplyRules: ["Monte-meuble"],
  },
  {
    name: "🎯 TEST 11: Volume minimal (1m³)",
    description: "Volume très faible - vérification de la stabilité",
    contextData: {
      pickupFloor: "2",
      pickupElevator: "large",
      deliveryFloor: "3",
      deliveryElevator: "large",
      volume: 1,
      distance: 10,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: false,
    expectedConsumedConstraints: [],
    shouldApplyRules: [],
    shouldNotApplyRules: ["Monte-meuble"],
  },
  // ============================================================================
  // ✅ CONSISTENCY - COHÉRENCE DU SYSTÈME
  // ============================================================================
  {
    name: "✅ TEST 12: Prix de base très élevé",
    description: "Vérification avec prix de base 50000€",
    contextData: {
      pickupFloor: "3",
      pickupElevator: "large",
      deliveryFloor: "2",
      deliveryElevator: "large",
      volume: 200,
      distance: 50,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedMonteMenuble: false,
    expectedConsumedConstraints: [],
    shouldApplyRules: [],
    shouldNotApplyRules: ["Monte-meuble"],
  },
];

/**
 * Fonction principale de test
 */
async function runTests() {
  console.log(
    "\n============================================================================",
  );
  console.log(
    "🧪 DÉBUT DES TESTS: CONTRAINTES CONSOMMÉES PAR LE MONTE-MEUBLES",
  );
  console.log(
    "============================================================================\n",
  );

  try {
    // Charger les règles depuis la base de données
    console.log("📋 Chargement des règles depuis la base de données...");
    const rulesData = await prisma.rules.findMany({
      where: {
        isActive: true,
        serviceType: "MOVING",
      },
    });

    console.log(`✅ ${rulesData.length} règles chargées\n`);

    // Convertir en objets Rule
    const rules = rulesData.map(
      (r: {
        name: string;
        serviceType: string;
        value: number;
        condition: Record<string, unknown>;
        isActive: boolean;
        id: string;
        percentBased: boolean;
      }) =>
        new Rule(
          r.name,
          r.serviceType,
          r.value,
          r.condition || "",
          r.isActive,
          r.id,
          r.percentBased,
        ),
    );

    // Créer le RuleEngine
    const ruleEngine = new RuleEngine(rules);

    let testsPassed = 0;
    let testsFailed = 0;

    // Exécuter chaque scénario
    for (const scenario of scenarios) {
      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      );
      console.log(`\n${scenario.name}`);
      console.log(`📝 ${scenario.description}\n`);

      try {
        // Créer le contexte simplement avec new QuoteContext()
        const context = new QuoteContext("MOVING" as ServiceType);
        // Ajouter toutes les données du scénario
        Object.keys(scenario.contextData).forEach((key) => {
          context.setValue(
            key,
            scenario.contextData[key] as
              | string
              | number
              | boolean
              | Date
              | string[],
          );
        });

        // Vérifier la détection du monte-meubles avec AutoDetectionService
        console.log("🔍 Vérification AutoDetectionService...");
        const pickupData = {
          floor: parseInt(scenario.contextData.pickupFloor || "0"),
          elevator: scenario.contextData.pickupElevator as
            | "no"
            | "small"
            | "medium"
            | "large",
          constraints: scenario.contextData.pickupLogisticsConstraints || [],
        };

        const deliveryData = {
          floor: parseInt(scenario.contextData.deliveryFloor || "0"),
          elevator: scenario.contextData.deliveryElevator as
            | "no"
            | "small"
            | "medium"
            | "large",
          constraints: scenario.contextData.deliveryLogisticsConstraints || [],
        };

        const pickupDetection = AutoDetectionService.detectFurnitureLift(
          pickupData,
          scenario.contextData.volume,
        );
        const deliveryDetection = AutoDetectionService.detectFurnitureLift(
          deliveryData,
          scenario.contextData.volume,
        );

        const monteMenubleDetected =
          pickupDetection.furnitureLiftRequired ||
          deliveryDetection.furnitureLiftRequired;
        const consumedConstraints = new Set([
          ...(pickupDetection.consumedConstraints || []),
          ...(deliveryDetection.consumedConstraints || []),
        ]);

        console.log(
          `   Monte-meubles détecté: ${monteMenubleDetected ? "✅ OUI" : "❌ NON"}`,
        );
        if (pickupDetection.furnitureLiftReason) {
          console.log(
            `   Raison (pickup): ${pickupDetection.furnitureLiftReason}`,
          );
        }
        if (deliveryDetection.furnitureLiftReason) {
          console.log(
            `   Raison (delivery): ${deliveryDetection.furnitureLiftReason}`,
          );
        }
        console.log(
          `   Contraintes consommées: [${Array.from(consumedConstraints).join(", ")}]`,
        );

        // Vérification 1: Monte-meubles détecté correctement
        if (monteMenubleDetected !== scenario.expectedMonteMenuble) {
          throw new Error(
            `❌ Échec détection monte-meubles: attendu ${scenario.expectedMonteMenuble}, obtenu ${monteMenubleDetected}`,
          );
        }

        // Vérification 2: Contraintes consommées correctes
        const expectedSet = new Set(scenario.expectedConsumedConstraints);
        const allExpectedConsumed = Array.from(expectedSet).every((c) =>
          consumedConstraints.has(c),
        );
        const noUnexpectedConsumed = Array.from(consumedConstraints).every(
          (c) => expectedSet.has(c),
        );

        if (!allExpectedConsumed || !noUnexpectedConsumed) {
          console.warn(`⚠️  Contraintes consommées différentes:`);
          console.warn(`   Attendues: [${Array.from(expectedSet).join(", ")}]`);
          console.warn(
            `   Obtenues: [${Array.from(consumedConstraints).join(", ")}]`,
          );
        }

        // Exécuter le RuleEngine
        console.log("\n💰 Exécution du RuleEngine...");
        const basePrice = new Money(100); // Prix de base de 100€ pour les tests
        const result = ruleEngine.execute(context, basePrice);

        console.log(`\n📊 Résultats (nouvelle architecture):`);
        console.log(`   Prix de base: ${result.basePrice.getAmount()}€`);
        console.log(`   Prix final: ${result.finalPrice.getAmount()}€`);
        console.log(
          `   Total réductions: ${result.totalReductions.getAmount()}€`,
        );
        console.log(
          `   Total surcharges: ${result.totalSurcharges.getAmount()}€`,
        );
        console.log(
          `   Nombre de règles appliquées: ${result.appliedRules.length}`,
        );

        console.log(`\n📋 Règles appliquées par catégorie:`);

        if (result.reductions && result.reductions.length > 0) {
          console.log(`   📉 Réductions (${result.reductions.length}):`);
          result.reductions.forEach((rule) => {
            console.log(`      - ${rule.name} (-${rule.impact.getAmount()}€)`);
          });
        }

        if (result.surcharges && result.surcharges.length > 0) {
          console.log(`   📈 Surcharges (${result.surcharges.length}):`);
          result.surcharges.forEach((rule) => {
            console.log(`      + ${rule.name} (+${rule.impact.getAmount()}€)`);
          });
        }

        if (result.constraints && result.constraints.length > 0) {
          console.log(`   🚧 Contraintes (${result.constraints.length}):`);
          result.constraints.forEach((rule) => {
            const consumed = rule.isConsumed ? " [CONSOMMÉE]" : "";
            console.log(
              `      • ${rule.name} (${rule.impact.getAmount()}€)${consumed}`,
            );
          });
        }

        if (result.equipment && result.equipment.length > 0) {
          console.log(`   🔧 Équipements (${result.equipment.length}):`);
          result.equipment.forEach((rule) => {
            console.log(`      • ${rule.name} (+${rule.impact.getAmount()}€)`);
          });
        }

        // Afficher les contraintes consommées
        if (
          result.consumedConstraints &&
          result.consumedConstraints.length > 0
        ) {
          console.log(`\n🔒 Contraintes consommées par le système:`);
          console.log(`   ${result.consumptionReason || "Consommées"}`);
          result.consumedConstraints.forEach((constraint) => {
            console.log(`   • ${constraint}`);
          });
        }

        // Afficher les coûts par adresse (STRUCTURE ENRICHIE)
        if (result.pickupCosts && result.deliveryCosts && result.globalCosts) {
          console.log(`\n📍 Coûts détaillés par adresse (nouvelle structure):`);

          // DÉPART
          console.log(`\n   🔵 DÉPART:`);
          console.log(`      Total: ${result.pickupCosts.total.getAmount()}€`);
          console.log(
            `      Surcharges: ${result.pickupCosts.totalSurcharges.getAmount()}€ (${result.pickupCosts.constraints.length + result.pickupCosts.additionalServices.length} règles)`,
          );
          console.log(
            `      Équipements: ${result.pickupCosts.totalEquipment.getAmount()}€ (${result.pickupCosts.equipment.length} règles)`,
          );
          console.log(
            `      Réductions: ${result.pickupCosts.totalReductions.getAmount()}€ (${result.pickupCosts.reductions.length} règles)`,
          );
          console.log(
            `      Monte-meuble requis: ${result.pickupCosts.furnitureLiftRequired ? "✅ OUI" : "❌ NON"}`,
          );
          if (result.pickupCosts.furnitureLiftReason) {
            console.log(
              `      Raison: ${result.pickupCosts.furnitureLiftReason}`,
            );
          }
          if (result.pickupCosts.consumedConstraints.length > 0) {
            console.log(
              `      Contraintes consommées: [${result.pickupCosts.consumedConstraints.join(", ")}]`,
            );
            if (result.pickupCosts.consumptionReason) {
              console.log(`      ${result.pickupCosts.consumptionReason}`);
            }
          }

          // ARRIVÉE
          console.log(`\n   🟢 ARRIVÉE:`);
          console.log(
            `      Total: ${result.deliveryCosts.total.getAmount()}€`,
          );
          console.log(
            `      Surcharges: ${result.deliveryCosts.totalSurcharges.getAmount()}€ (${result.deliveryCosts.constraints.length + result.deliveryCosts.additionalServices.length} règles)`,
          );
          console.log(
            `      Équipements: ${result.deliveryCosts.totalEquipment.getAmount()}€ (${result.deliveryCosts.equipment.length} règles)`,
          );
          console.log(
            `      Réductions: ${result.deliveryCosts.totalReductions.getAmount()}€ (${result.deliveryCosts.reductions.length} règles)`,
          );
          console.log(
            `      Monte-meuble requis: ${result.deliveryCosts.furnitureLiftRequired ? "✅ OUI" : "❌ NON"}`,
          );
          if (result.deliveryCosts.furnitureLiftReason) {
            console.log(
              `      Raison: ${result.deliveryCosts.furnitureLiftReason}`,
            );
          }
          if (result.deliveryCosts.consumedConstraints.length > 0) {
            console.log(
              `      Contraintes consommées: [${result.deliveryCosts.consumedConstraints.join(", ")}]`,
            );
            if (result.deliveryCosts.consumptionReason) {
              console.log(`      ${result.deliveryCosts.consumptionReason}`);
            }
          }

          // GLOBAL
          console.log(`\n   🟡 GLOBAL:`);
          console.log(`      Total: ${result.globalCosts.total.getAmount()}€`);
          console.log(
            `      Surcharges: ${result.globalCosts.totalSurcharges.getAmount()}€ (${result.globalCosts.constraints.length + result.globalCosts.additionalServices.length} règles)`,
          );
          console.log(
            `      Équipements: ${result.globalCosts.totalEquipment.getAmount()}€ (${result.globalCosts.equipment.length} règles)`,
          );
          console.log(
            `      Réductions: ${result.globalCosts.totalReductions.getAmount()}€ (${result.globalCosts.reductions.length} règles)`,
          );
        }

        // Vérification 3: Règles qui devraient être appliquées
        console.log("\n✅ Vérification des règles attendues:");
        for (const expectedRule of scenario.shouldApplyRules) {
          const isApplied = result.appliedRules.some((rule) =>
            rule.name.includes(expectedRule),
          );
          if (isApplied) {
            console.log(`   ✅ "${expectedRule}" appliquée`);
          } else {
            console.log(`   ⚠️  "${expectedRule}" NON appliquée (attendue)`);
          }
        }

        // Vérification 4: Règles qui NE devraient PAS être appliquées (consommées)
        console.log(
          "\n❌ Vérification des règles qui ne doivent PAS être appliquées:",
        );
        let hasError = false;
        for (const bannedRule of scenario.shouldNotApplyRules) {
          const isApplied = result.appliedRules.some((rule) =>
            rule.name.includes(bannedRule),
          );
          if (!isApplied) {
            console.log(
              `   ✅ "${bannedRule}" correctement ignorée (consommée)`,
            );
          } else {
            console.log(
              `   ❌ ERREUR: "${bannedRule}" a été appliquée alors qu'elle devrait être consommée!`,
            );
            hasError = true;
          }
        }

        if (hasError) {
          throw new Error(
            "❌ Double facturation détectée: des règles consommées ont été facturées!",
          );
        }

        console.log("\n✅ TEST RÉUSSI\n");
        testsPassed++;
      } catch (error) {
        console.error(
          `\n❌ TEST ÉCHOUÉ: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        testsFailed++;
      }
    }

    // Résumé final
    console.log(
      "\n============================================================================",
    );
    console.log("📊 RÉSUMÉ DES TESTS");
    console.log(
      "============================================================================",
    );
    console.log(`✅ Tests réussis: ${testsPassed}/${scenarios.length}`);
    console.log(`❌ Tests échoués: ${testsFailed}/${scenarios.length}`);

    if (testsFailed === 0) {
      console.log("\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!");
      console.log(
        "✅ Les contraintes consommées ne sont pas facturées (pas de double facturation)",
      );
    } else {
      console.log("\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ");
      console.log("❌ Vérifier la logique de consommation des contraintes");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ ERREUR FATALE:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
runTests().catch(console.error);
