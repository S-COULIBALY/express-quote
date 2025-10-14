/**
 * ============================================================================
 * SCRIPT DE DÉMONSTRATION: STRUCTURE ENRICHIE PAR ADRESSE
 * ============================================================================
 *
 * 🎯 OBJECTIF:
 * Démontrer la nouvelle structure AddressCosts avec séparation claire par adresse
 *
 * Chaque adresse contient maintenant:
 * - surcharges (contraintes logistiques + services supplémentaires)
 * - equipment (équipements spécifiques)
 * - reductions (réductions appliquées localement)
 * - furnitureLiftRequired (détection monte-meuble par adresse)
 * - consumedConstraints (contraintes consommées par adresse)
 * - Sous-totaux calculés automatiquement
 */

import { PrismaClient } from "@prisma/client";
import { RuleEngine } from "../src/quotation/domain/services/RuleEngine";
import { Rule } from "../src/quotation/domain/valueObjects/Rule";
import { Money } from "../src/quotation/domain/valueObjects/Money";
import { QuoteContext } from "../src/quotation/domain/valueObjects/QuoteContext";

const prisma = new PrismaClient();

async function demonstrateEnhancedStructure() {
  console.log(
    "\n╔═══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║  DÉMONSTRATION: Structure enrichie RuleExecutionResult      ║",
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝\n",
  );

  try {
    // Charger les règles
    console.log("📋 Chargement des règles...");
    const rulesData = await prisma.rules.findMany({
      where: { isActive: true, serviceType: "MOVING" },
    });

    const rules = rulesData.map(
      (r) =>
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

    const ruleEngine = new RuleEngine(rules);
    console.log(`✅ ${rules.length} règles chargées\n`);

    // Créer un contexte complexe avec contraintes sur les deux adresses
    console.log("🎬 SCÉNARIO: Déménagement avec contraintes multiples");
    console.log("   Départ : Étage 5, sans ascenseur, escaliers difficiles");
    console.log("   Arrivée: Étage 3, sans ascenseur, parking difficile\n");

    const context = new QuoteContext("MOVING" as ServiceType);
    context.setValue("pickupFloor", "5");
    context.setValue("pickupElevator", "no");
    context.setValue("pickupLogisticsConstraints", [
      "difficult_stairs",
      "narrow_corridors",
    ]);
    context.setValue("deliveryFloor", "3");
    context.setValue("deliveryElevator", "no");
    context.setValue("deliveryLogisticsConstraints", ["difficult_parking"]);
    context.setValue("volume", 30);
    context.setValue("distance", 25);
    context.setValue("scheduledDate", new Date("2025-11-15T10:00:00"));

    // Exécuter le RuleEngine
    const basePrice = new Money(100);
    const result = ruleEngine.execute(context, basePrice);

    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log("📊 RÉSULTAT GLOBAL");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    console.log(`💰 Prix de base          : ${result.basePrice.getAmount()}€`);
    console.log(`💰 Prix final           : ${result.finalPrice.getAmount()}€`);
    console.log(
      `📉 Total réductions      : ${result.totalReductions.getAmount()}€`,
    );
    console.log(
      `📈 Total surcharges      : ${result.totalSurcharges.getAmount()}€`,
    );
    console.log(`📋 Règles appliquées     : ${result.appliedRules.length}`);

    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("📍 DÉTAILS PAR ADRESSE - PICKUP (Départ)");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    const pickup = result.pickupCosts;

    console.log("🔧 ÉQUIPEMENTS:");
    if (pickup.equipment.length > 0) {
      pickup.equipment.forEach((rule) => {
        console.log(`   • ${rule.name}: +${rule.impact.getAmount()}€`);
      });
      console.log(
        `   └─ Sous-total équipements: ${pickup.totalEquipment.getAmount()}€`,
      );
    } else {
      console.log("   (Aucun équipement)");
    }

    console.log("\n🚧 CONTRAINTES LOGISTIQUES:");
    if (pickup.constraints.length > 0) {
      pickup.constraints.forEach((rule) => {
        const status = rule.isConsumed ? " [CONSOMMÉE]" : "";
        console.log(`   • ${rule.name}: +${rule.impact.getAmount()}€${status}`);
      });
      console.log(
        `   └─ Sous-total contraintes: ${pickup.totalSurcharges.getAmount()}€`,
      );
    } else {
      console.log("   (Aucune contrainte)");
    }

    console.log("\n➕ SERVICES SUPPLÉMENTAIRES:");
    if (pickup.additionalServices.length > 0) {
      pickup.additionalServices.forEach((rule) => {
        console.log(`   • ${rule.name}: +${rule.impact.getAmount()}€`);
      });
    } else {
      console.log("   (Aucun service)");
    }

    console.log("\n📉 RÉDUCTIONS:");
    if (pickup.reductions.length > 0) {
      pickup.reductions.forEach((rule) => {
        console.log(`   • ${rule.name}: -${rule.impact.getAmount()}€`);
      });
      console.log(
        `   └─ Sous-total réductions: ${pickup.totalReductions.getAmount()}€`,
      );
    } else {
      console.log("   (Aucune réduction)");
    }

    console.log("\n🏗️ MONTE-MEUBLE:");
    console.log(
      `   Requis: ${pickup.furnitureLiftRequired ? "✅ OUI" : "❌ NON"}`,
    );
    if (pickup.furnitureLiftRequired && pickup.furnitureLiftReason) {
      console.log(`   Raison: ${pickup.furnitureLiftReason}`);
    }

    console.log("\n🔒 CONTRAINTES CONSOMMÉES:");
    if (pickup.consumedConstraints.length > 0) {
      console.log(`   ${pickup.consumptionReason || "Consommées"}`);
      pickup.consumedConstraints.forEach((constraint) => {
        console.log(`   • ${constraint}`);
      });
    } else {
      console.log("   (Aucune contrainte consommée)");
    }

    console.log(`\n💵 TOTAL PICKUP: ${pickup.total.getAmount()}€`);

    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("📍 DÉTAILS PAR ADRESSE - DELIVERY (Arrivée)");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    const delivery = result.deliveryCosts;

    console.log("🔧 ÉQUIPEMENTS:");
    if (delivery.equipment.length > 0) {
      delivery.equipment.forEach((rule) => {
        console.log(`   • ${rule.name}: +${rule.impact.getAmount()}€`);
      });
      console.log(
        `   └─ Sous-total équipements: ${delivery.totalEquipment.getAmount()}€`,
      );
    } else {
      console.log("   (Aucun équipement)");
    }

    console.log("\n🚧 CONTRAINTES LOGISTIQUES:");
    if (delivery.constraints.length > 0) {
      delivery.constraints.forEach((rule) => {
        const status = rule.isConsumed ? " [CONSOMMÉE]" : "";
        console.log(`   • ${rule.name}: +${rule.impact.getAmount()}€${status}`);
      });
      console.log(
        `   └─ Sous-total contraintes: ${delivery.totalSurcharges.getAmount()}€`,
      );
    } else {
      console.log("   (Aucune contrainte)");
    }

    console.log("\n➕ SERVICES SUPPLÉMENTAIRES:");
    if (delivery.additionalServices.length > 0) {
      delivery.additionalServices.forEach((rule) => {
        console.log(`   • ${rule.name}: +${rule.impact.getAmount()}€`);
      });
    } else {
      console.log("   (Aucun service)");
    }

    console.log("\n📉 RÉDUCTIONS:");
    if (delivery.reductions.length > 0) {
      delivery.reductions.forEach((rule) => {
        console.log(`   • ${rule.name}: -${rule.impact.getAmount()}€`);
      });
      console.log(
        `   └─ Sous-total réductions: ${delivery.totalReductions.getAmount()}€`,
      );
    } else {
      console.log("   (Aucune réduction)");
    }

    console.log("\n🏗️ MONTE-MEUBLE:");
    console.log(
      `   Requis: ${delivery.furnitureLiftRequired ? "✅ OUI" : "❌ NON"}`,
    );
    if (delivery.furnitureLiftRequired && delivery.furnitureLiftReason) {
      console.log(`   Raison: ${delivery.furnitureLiftReason}`);
    }

    console.log("\n🔒 CONTRAINTES CONSOMMÉES:");
    if (delivery.consumedConstraints.length > 0) {
      console.log(`   ${delivery.consumptionReason || "Consommées"}`);
      delivery.consumedConstraints.forEach((constraint) => {
        console.log(`   • ${constraint}`);
      });
    } else {
      console.log("   (Aucune contrainte consommée)");
    }

    console.log(`\n💵 TOTAL DELIVERY: ${delivery.total.getAmount()}€`);

    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("📍 DÉTAILS PAR ADRESSE - GLOBAL (Non spécifique)");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    const global = result.globalCosts;
    console.log(`💵 TOTAL GLOBAL: ${global.total.getAmount()}€`);

    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("✅ AVANTAGES DE LA NOUVELLE STRUCTURE");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    console.log("1. ✅ Séparation claire par adresse (pickup/delivery/global)");
    console.log("2. ✅ Chaque adresse contient TOUTES ses informations:");
    console.log("   • Surcharges (contraintes + services)");
    console.log("   • Équipements");
    console.log("   • Réductions");
    console.log("   • Monte-meuble (requis + raison)");
    console.log("   • Contraintes consommées");
    console.log("3. ✅ Sous-totaux calculés automatiquement");
    console.log(
      "4. ✅ Structure auto-suffisante (pas besoin de chercher ailleurs)",
    );
    console.log("5. ✅ Facilite l'affichage dans le frontend (par adresse)");
    console.log(
      "6. ✅ Backward compatible (propriétés globales toujours présentes)",
    );

    console.log(
      "\n╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║  ✅ DÉMONSTRATION TERMINÉE                                   ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝\n",
    );
  } catch (error) {
    console.error("\n❌ ERREUR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la démonstration
demonstrateEnhancedStructure().catch(console.error);
