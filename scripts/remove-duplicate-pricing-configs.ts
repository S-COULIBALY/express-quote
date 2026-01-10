/**
 * Script de suppression : Configurations PRICING dupliquées
 *
 * Objectif : Supprimer les configurations PRICING qui sont dupliquées dans MODULES_CONFIG
 * Ces valeurs ne sont plus utilisées car le nouveau système modulaire utilise MODULES_CONFIG comme source unique
 */

import { prisma } from "../src/lib/prisma";

// Liste des clés PRICING dupliquées dans MODULES_CONFIG
const DUPLICATED_KEYS = [
  "UNIT_PRICE_PER_KM", // → MODULES_CONFIG.distance (calculé dynamiquement)
  "EXTRA_WORKER_HOUR_RATE", // → MODULES_CONFIG.labor.BASE_HOURLY_RATE
  "FUEL_CONSUMPTION_PER_100KM", // → MODULES_CONFIG.fuel.VEHICLE_CONSUMPTION_L_PER_100KM
  "FUEL_PRICE_PER_LITER", // → MODULES_CONFIG.fuel.PRICE_PER_LITER
  "TOLL_COST_PER_KM", // → MODULES_CONFIG.tolls.COST_PER_KM
  "HIGHWAY_RATIO", // → MODULES_CONFIG.tolls.HIGHWAY_PERCENTAGE
  "HOURLY_RATE_MULTIPLIER", // → MODULES_CONFIG.labor (calculé dans les modules)
  "DAILY_RATE_MULTIPLIER", // → MODULES_CONFIG.labor (calculé dans les modules)
  "WEEKLY_RATE_MULTIPLIER", // → MODULES_CONFIG.labor (calculé dans les modules)
  "SERVICE_WORKER_PRICE_PER_HOUR", // → MODULES_CONFIG.labor.BASE_HOURLY_RATE
  "VAT_RATE", // → À garder si utilisé ailleurs (vérifier)
  "DEPOSIT_PERCENTAGE", // → À garder si utilisé ailleurs (vérifier)
];

async function removeDuplicatePricingConfigs() {
  console.log("🧹 Suppression des configurations PRICING dupliquées\n");

  try {
    // Vérifier d'abord quelles configurations existent
    const existingConfigs = await prisma.configuration.findMany({
      where: {
        category: "PRICING",
        key: { in: DUPLICATED_KEYS },
        isActive: true,
      },
      select: {
        key: true,
        value: true,
        description: true,
      },
    });

    console.log(
      `📋 ${existingConfigs.length} configurations dupliquées trouvées :\n`,
    );
    for (const config of existingConfigs) {
      console.log(`   - ${config.key} : ${JSON.stringify(config.value)}`);
      if (config.description) {
        console.log(`     Description : ${config.description}`);
      }
    }

    // Demander confirmation (en production, ajouter une vérification)
    console.log(
      "\n⚠️  ATTENTION : Ces configurations seront supprimées définitivement.",
    );
    console.log(
      "   Le nouveau système modulaire utilise MODULES_CONFIG comme source unique.\n",
    );

    // Supprimer les configurations
    const result = await prisma.configuration.deleteMany({
      where: {
        category: "PRICING",
        key: { in: DUPLICATED_KEYS },
        isActive: true,
      },
    });

    console.log(
      `✅ ${result.count} configurations PRICING dupliquées supprimées\n`,
    );

    // Statistiques finales
    const remainingPricing = await prisma.configuration.count({
      where: {
        category: "PRICING",
        isActive: true,
      },
    });

    console.log("📊 STATISTIQUES FINALES");
    console.log("=".repeat(80));
    console.log(`Configurations PRICING restantes : ${remainingPricing}`);
    console.log("\n✅ Suppression terminée avec succès !");
    console.log(
      "\n💡 Les valeurs sont maintenant uniquement dans MODULES_CONFIG (src/quotation-module/config/modules.config.ts)",
    );
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la suppression
removeDuplicatePricingConfigs().catch(console.error);
