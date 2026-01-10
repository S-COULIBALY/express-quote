/**
 * Script de nettoyage : Suppression des configurations obsolètes
 *
 * Objectif : Supprimer les enregistrements obsolètes de la table Configuration
 * - BUSINESS_TYPE_PRICING pour services obsolètes (CLEANING, DELIVERY, PACKING, STORAGE)
 * - PRICING dupliquées dans MODULES_CONFIG (optionnel, selon plan d'alignement)
 */

import { prisma } from "../src/lib/prisma";

async function cleanupObsoleteConfigurations() {
  console.log("🧹 Nettoyage des configurations obsolètes\n");

  try {
    // 1. Supprimer BUSINESS_TYPE_PRICING pour services obsolètes
    console.log(
      "📋 Phase 1 : Suppression des configurations BUSINESS_TYPE_PRICING obsolètes...",
    );

    const obsoleteBusinessTypePricing = await prisma.configuration.deleteMany({
      where: {
        category: "BUSINESS_TYPE_PRICING",
        OR: [
          { key: { startsWith: "CLEANING_" } },
          { key: { startsWith: "DELIVERY_" } },
          { key: { startsWith: "PACKING_" } },
          { key: { startsWith: "STORAGE_" } },
        ],
      },
    });

    console.log(
      `✅ ${obsoleteBusinessTypePricing.count} configurations BUSINESS_TYPE_PRICING obsolètes supprimées\n`,
    );

    // 2. Identifier les configurations PRICING potentiellement dupliquées
    console.log(
      "📋 Phase 2 : Identification des configurations PRICING potentiellement dupliquées...",
    );

    const pricingConfigs = await prisma.configuration.findMany({
      where: {
        category: "PRICING",
        isActive: true,
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Liste des clés potentiellement dupliquées dans MODULES_CONFIG
    const potentiallyDuplicatedKeys = [
      "FUEL_PRICE_PER_LITER",
      "FUEL_CONSUMPTION_PER_100KM",
      "TOLL_COST_PER_KM",
      "HIGHWAY_RATIO",
      "UNIT_PRICE_PER_KM",
      "SERVICE_WORKER_PRICE_PER_HOUR",
      "EXTRA_WORKER_HOUR_RATE",
      "DAILY_RATE_MULTIPLIER",
      "WEEKLY_RATE_MULTIPLIER",
      "HOURLY_RATE_MULTIPLIER",
      "DEPOSIT_PERCENTAGE",
      "VAT_RATE",
    ];

    const duplicatedConfigs = pricingConfigs.filter((config) =>
      potentiallyDuplicatedKeys.includes(config.key),
    );

    console.log(
      `⚠️ ${duplicatedConfigs.length} configurations PRICING potentiellement dupliquées identifiées :`,
    );
    for (const config of duplicatedConfigs) {
      console.log(`   - ${config.key}`);
    }

    console.log("\n💡 RECOMMANDATION :");
    console.log("   Ces configurations sont dupliquées dans MODULES_CONFIG.");
    console.log(
      "   Le nouveau système modulaire utilise MODULES_CONFIG comme source unique.",
    );
    console.log(
      "   Vous pouvez supprimer ces configurations si vous choisissez l'Option A du plan d'alignement.",
    );
    console.log(
      "   (Voir docs/CLARIFICATION_CONFIGURATION_VS_MODULES_CONFIG.md)\n",
    );

    // 3. Statistiques finales
    const remainingConfigs = await prisma.configuration.count({
      where: { isActive: true },
    });

    const byCategory = await prisma.configuration.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { category: true },
    });

    console.log("📊 STATISTIQUES FINALES");
    console.log("=".repeat(80));
    console.log(`Total configurations actives : ${remainingConfigs}`);
    console.log("\nPar catégorie :");
    for (const cat of byCategory.sort(
      (a, b) => b._count.category - a._count.category,
    )) {
      console.log(`  - ${cat.category} : ${cat._count.category}`);
    }

    console.log("\n✅ Nettoyage terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le nettoyage
cleanupObsoleteConfigurations().catch(console.error);
