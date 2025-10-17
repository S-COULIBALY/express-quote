/**
 * ============================================================================
 * TEST: VÉRIFICATION DE L'ADDITION DES RÈGLES AUX DEUX ADRESSES
 * ============================================================================
 *
 * 🎯 OBJECTIF:
 * Vérifier que les règles s'appliquent DEUX FOIS quand la même contrainte
 * est présente à la fois au départ ET à l'arrivée.
 *
 * 📋 SCÉNARIOS:
 * 1. Contrainte unique au départ → Règle appliquée 1 fois
 * 2. Contrainte unique à l'arrivée → Règle appliquée 1 fois
 * 3. Contrainte aux DEUX adresses → Règle appliquée 2 fois (IMPORTANT!)
 */

import { PrismaClient } from "@prisma/client";
import { RuleEngine } from "../src/quotation/domain/services/RuleEngine";
import { Rule } from "../src/quotation/domain/valueObjects/Rule";
import { Money } from "../src/quotation/domain/valueObjects/Money";
import { QuoteContext } from "../src/quotation/domain/valueObjects/QuoteContext";

const prisma = new PrismaClient();

interface TestCase {
  name: string;
  description: string;
  contextData: Record<string, unknown>;
  expectedRuleCount: number;
  expectedTotalImpact: number;
  ruleName: string;
}

const testCases: TestCase[] = [
  {
    name: "📍 TEST 1: Escalier difficile SEULEMENT au départ",
    description: "La règle devrait s'appliquer 1 fois",
    contextData: {
      pickupFloor: "2",
      pickupElevator: "no",
      pickupLogisticsConstraints: ["difficult_stairs"],
      deliveryFloor: "1",
      deliveryElevator: "large",
      deliveryLogisticsConstraints: [],
      volume: 20,
      distance: 15,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedRuleCount: 1,
    expectedTotalImpact: 40, // 40% de 100€ = 40€
    ruleName: "Escalier difficile",
  },
  {
    name: "📍 TEST 2: Escalier difficile SEULEMENT à l'arrivée",
    description: "La règle devrait s'appliquer 1 fois",
    contextData: {
      pickupFloor: "1",
      pickupElevator: "large",
      pickupLogisticsConstraints: [],
      deliveryFloor: "3",
      deliveryElevator: "no",
      deliveryLogisticsConstraints: ["difficult_stairs"],
      volume: 20,
      distance: 15,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedRuleCount: 1,
    expectedTotalImpact: 40, // 40% de 100€ = 40€
    ruleName: "Escalier difficile",
  },
  {
    name: "🔥 TEST 3: Escalier difficile aux DEUX adresses (DÉPART + ARRIVÉE)",
    description:
      "La règle devrait s'appliquer 2 FOIS (une pour chaque adresse)",
    contextData: {
      pickupFloor: "2",
      pickupElevator: "no",
      pickupLogisticsConstraints: ["difficult_stairs"],
      deliveryFloor: "3",
      deliveryElevator: "no",
      deliveryLogisticsConstraints: ["difficult_stairs"],
      volume: 20,
      distance: 15,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedRuleCount: 2, // ⚠️ DEVRAIT ÊTRE 2
    expectedTotalImpact: 80, // 40% + 40% de 100€ = 80€ ⚠️ DEVRAIT ÊTRE 80€
    ruleName: "Escalier difficile",
  },
  {
    name: "🔥 TEST 4: Couloirs étroits aux DEUX adresses",
    description: "La règle devrait s'appliquer 2 FOIS",
    contextData: {
      pickupFloor: "2",
      pickupElevator: "no",
      pickupLogisticsConstraints: ["narrow_corridors"],
      deliveryFloor: "2",
      deliveryElevator: "no",
      deliveryLogisticsConstraints: ["narrow_corridors"],
      volume: 20,
      distance: 15,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedRuleCount: 2,
    expectedTotalImpact: 50, // 25% + 25% de 100€ = 50€
    ruleName: "Couloirs étroits",
  },
  {
    name: "🔥 TEST 5: Stationnement difficile aux DEUX adresses",
    description: "La règle devrait s'appliquer 2 FOIS",
    contextData: {
      pickupFloor: "0",
      pickupElevator: "no",
      pickupLogisticsConstraints: ["difficult_parking"],
      deliveryFloor: "0",
      deliveryElevator: "no",
      deliveryLogisticsConstraints: ["difficult_parking"],
      volume: 20,
      distance: 15,
      scheduledDate: new Date("2025-11-15T10:00:00"),
    },
    expectedRuleCount: 2,
    expectedTotalImpact: 60, // 30% + 30% de 100€ = 60€
    ruleName: "Stationnement",
  },
];

async function runTests() {
  console.log(
    "\n============================================================================",
  );
  console.log(
    "🧪 TEST: VÉRIFICATION DE L'ADDITION DES RÈGLES AUX DEUX ADRESSES",
  );
  console.log(
    "============================================================================\n",
  );

  try {
    // Charger les règles
    console.log("📋 Chargement des règles...");
    const rulesData = await prisma.rules.findMany({
      where: {
        isActive: true,
        serviceType: "MOVING",
      },
    });

    const rules = rulesData.map(
      (r) =>
        new Rule(
          r.name,
          r.serviceType,
          r.value,
          (typeof r.condition === "string"
            ? r.condition
            : (r.condition as any)) || "",
          r.isActive,
          r.id,
          r.percentBased,
        ),
    );

    const ruleEngine = new RuleEngine(rules);

    let testsPassed = 0;
    let testsFailed = 0;

    // Exécuter chaque test
    for (const testCase of testCases) {
      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      );
      console.log(`\n${testCase.name}`);
      console.log(`📝 ${testCase.description}\n`);

      try {
        const context = new QuoteContext("MOVING" as any);
        Object.keys(testCase.contextData).forEach((key) => {
          context.setValue(
            key,
            testCase.contextData[key] as
              | string
              | number
              | boolean
              | Date
              | string[],
          );
        });

        const basePrice = new Money(100);
        const result = ruleEngine.execute(context, basePrice);

        // Filtrer les règles qui correspondent au nom recherché
        const matchingRules = result.appliedRules.filter((rule) =>
          rule.name.toLowerCase().includes(testCase.ruleName.toLowerCase()),
        );

        console.log(`\n📊 Résultats:`);
        console.log(`   Prix de base: ${basePrice.getAmount()}€`);
        console.log(`   Prix final: ${result.finalPrice.getAmount()}€`);
        console.log(
          `   Total des règles appliquées: ${result.appliedRules.length}`,
        );
        console.log(
          `   Règles "${testCase.ruleName}" trouvées: ${matchingRules.length}`,
        );

        if (matchingRules.length > 0) {
          console.log(`\n   Détails des règles "${testCase.ruleName}":`);
          matchingRules.forEach((rule, index) => {
            console.log(
              `      ${index + 1}. ${rule.name} (${rule.impact.getAmount()}€) - Adresse: ${rule.address || "undefined"}`,
            );
          });
        }

        // Calculer l'impact total
        const totalImpact =
          result.finalPrice.getAmount() - basePrice.getAmount();

        console.log(`\n✅ Vérifications:`);

        // Vérification 1: Nombre de règles
        const ruleCountOk = matchingRules.length === testCase.expectedRuleCount;
        console.log(
          `   ${ruleCountOk ? "✅" : "❌"} Nombre de règles: ${matchingRules.length} (attendu: ${testCase.expectedRuleCount})`,
        );

        // Vérification 2: Impact total
        const impactOk = totalImpact === testCase.expectedTotalImpact;
        console.log(
          `   ${impactOk ? "✅" : "❌"} Impact total: ${totalImpact}€ (attendu: ${testCase.expectedTotalImpact}€)`,
        );

        // Afficher la répartition par adresse
        if (result.pickupCosts && result.deliveryCosts && result.globalCosts) {
          console.log(`\n📍 Répartition par adresse:`);
          console.log(
            `   🔵 DÉPART: ${result.pickupCosts.total.getAmount()}€ (${result.pickupCosts.constraints.length + result.pickupCosts.additionalServices.length + result.pickupCosts.equipment.length} règles)`,
          );
          console.log(
            `   🟢 ARRIVÉE: ${result.deliveryCosts.total.getAmount()}€ (${result.deliveryCosts.constraints.length + result.deliveryCosts.additionalServices.length + result.deliveryCosts.equipment.length} règles)`,
          );
          console.log(
            `   🟡 GLOBAL: ${result.globalCosts.total.getAmount()}€ (${result.globalCosts.constraints.length + result.globalCosts.additionalServices.length + result.globalCosts.equipment.length} règles)`,
          );
        }

        if (ruleCountOk && impactOk) {
          console.log(`\n✅ TEST RÉUSSI\n`);
          testsPassed++;
        } else {
          console.log(`\n❌ TEST ÉCHOUÉ\n`);
          testsFailed++;
        }
      } catch (error) {
        console.error(
          `\n❌ TEST ÉCHOUÉ: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        testsFailed++;
      }
    }

    // Résumé
    console.log(
      "\n============================================================================",
    );
    console.log("📊 RÉSUMÉ DES TESTS");
    console.log(
      "============================================================================",
    );
    console.log(`✅ Tests réussis: ${testsPassed}/${testCases.length}`);
    console.log(`❌ Tests échoués: ${testsFailed}/${testCases.length}`);

    if (testsFailed === 0) {
      console.log("\n🎉 TOUS LES TESTS SONT PASSÉS!");
      console.log(
        "✅ Les règles s'appliquent correctement aux deux adresses quand nécessaire",
      );
    } else {
      console.log("\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ");
      console.log(
        "❌ Les règles ne s'additionnent PAS correctement quand présentes aux deux adresses",
      );
      console.log(
        "💡 Il faut corriger la logique de determineAddress() dans RuleEngine",
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ ERREUR FATALE:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);
