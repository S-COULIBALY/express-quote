/**
 * Script d'analyse : Configuration vs MODULES_CONFIG
 *
 * Objectif : Identifier les incohérences entre :
 * - Table Configuration (BDD) : Paramètres système généraux
 * - MODULES_CONFIG (code) : Configuration des modules du nouveau système modulaire
 */

import { prisma } from "../src/lib/prisma";
import { MODULES_CONFIG } from "../src/quotation-module/config/modules.config";

interface ConfigAnalysis {
  category: string;
  count: number;
  keys: string[];
  status: "ACTIVE" | "OBSOLETE" | "DUPLICATE" | "UNKNOWN";
  description: string;
}

async function analyzeConfiguration() {
  console.log("🔍 Analyse de la table Configuration vs MODULES_CONFIG\n");

  // 1. Analyser les catégories dans la BDD
  const configs = await prisma.configuration.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });

  const categoriesMap = new Map<string, { count: number; keys: string[] }>();

  for (const config of configs) {
    const category = config.category;
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, { count: 0, keys: [] });
    }
    const entry = categoriesMap.get(category)!;
    entry.count++;
    entry.keys.push(config.key);
  }

  console.log("📊 CATÉGORIES DANS LA TABLE CONFIGURATION (BDD)");
  console.log("=".repeat(80));
  console.log(`Total : ${configs.length} configurations actives\n`);

  const analysis: ConfigAnalysis[] = [];

  // 2. Analyser chaque catégorie
  for (const [category, data] of categoriesMap.entries()) {
    let status: ConfigAnalysis["status"] = "UNKNOWN";
    let description = "";

    // Catégories système (doivent rester)
    if (
      [
        "EMAIL_CONFIG",
        "SERVICE_PARAMS",
        "TECHNICAL_LIMITS",
        "TIME_CONFIG",
        "TRANSPORT_CONFIG",
        "GEOGRAPHIC_CONFIG",
        "INSURANCE_CONFIG",
      ].includes(category)
    ) {
      status = "ACTIVE";
      description = "✅ Paramètre système - DOIT RESTER";
    }
    // Catégories pricing (peuvent être obsolètes si dupliquées dans MODULES_CONFIG)
    else if (
      category === "PRICING" ||
      category === "BUSINESS_TYPE_PRICING" ||
      category === "PRICING_FACTORS" ||
      category === "THRESHOLDS" ||
      category === "SYSTEM_METRICS"
    ) {
      // Vérifier si les clés sont dupliquées dans MODULES_CONFIG
      const duplicates = findDuplicatesInModulesConfig(data.keys);
      if (duplicates.length > 0) {
        status = "DUPLICATE";
        description = `⚠️ DUPLIQUÉ dans MODULES_CONFIG : ${duplicates.join(", ")}`;
      } else {
        status = "ACTIVE";
        description = "✅ Paramètre pricing - Vérifier si utilisé";
      }
    }
    // Catégories obsolètes
    else if (category === "BUSINESS_RULES" || category === "LIMITS") {
      status = "OBSOLETE";
      description =
        "❌ OBSOLÈTE - Remplacé par modules du nouveau système modulaire";
    } else {
      status = "UNKNOWN";
      description = "❓ À vérifier";
    }

    analysis.push({
      category,
      count: data.count,
      keys: data.keys,
      status,
      description,
    });
  }

  // 3. Afficher l'analyse
  console.log("📋 RÉSULTATS PAR CATÉGORIE\n");

  for (const item of analysis.sort((a, b) => {
    const order = { ACTIVE: 0, DUPLICATE: 1, OBSOLETE: 2, UNKNOWN: 3 };
    return order[a.status] - order[b.status];
  })) {
    console.log(
      `\n${item.status === "ACTIVE" ? "✅" : item.status === "DUPLICATE" ? "⚠️" : item.status === "OBSOLETE" ? "❌" : "❓"} ${item.category}`,
    );
    console.log(`   ${item.description}`);
    console.log(`   ${item.count} enregistrements`);
    if (item.keys.length <= 10) {
      console.log(`   Clés : ${item.keys.join(", ")}`);
    } else {
      console.log(
        `   Clés (${item.keys.length}) : ${item.keys.slice(0, 10).join(", ")}...`,
      );
    }
  }

  // 4. Comparer avec MODULES_CONFIG
  console.log("\n\n📦 COMPARAISON AVEC MODULES_CONFIG");
  console.log("=".repeat(80));

  const modulesConfigKeys = extractModulesConfigKeys();
  console.log(
    `\nMODULES_CONFIG contient ${modulesConfigKeys.length} valeurs configurables`,
  );
  console.log(`\nCatégories dans MODULES_CONFIG :`);
  for (const category of Object.keys(MODULES_CONFIG)) {
    console.log(`  - ${category}`);
  }

  // 5. Recommandations
  console.log("\n\n💡 RECOMMANDATIONS");
  console.log("=".repeat(80));

  const duplicates = analysis.filter((a) => a.status === "DUPLICATE");
  const obsolete = analysis.filter((a) => a.status === "OBSOLETE");
  const unknown = analysis.filter((a) => a.status === "UNKNOWN");

  if (duplicates.length > 0) {
    console.log("\n⚠️ DUPLICATIONS DÉTECTÉES :");
    for (const dup of duplicates) {
      console.log(`  - ${dup.category} : ${dup.description}`);
    }
    console.log(
      "\n  → ACTION : Migrer les valeurs de Configuration vers MODULES_CONFIG ou supprimer de Configuration",
    );
  }

  if (obsolete.length > 0) {
    console.log("\n❌ CATÉGORIES OBSOLÈTES :");
    for (const obs of obsolete) {
      console.log(`  - ${obs.category} : ${obs.count} enregistrements`);
    }
    console.log("\n  → ACTION : Supprimer ces enregistrements de la BDD");
  }

  if (unknown.length > 0) {
    console.log("\n❓ CATÉGORIES À VÉRIFIER :");
    for (const unk of unknown) {
      console.log(`  - ${unk.category} : ${unk.count} enregistrements`);
    }
    console.log("\n  → ACTION : Analyser l'utilisation dans le code");
  }

  console.log("\n✅ CATÉGORIES SYSTÈME (À CONSERVER) :");
  const active = analysis.filter(
    (a) => a.status === "ACTIVE" && !a.description.includes("pricing"),
  );
  for (const act of active) {
    console.log(`  - ${act.category} : ${act.count} enregistrements`);
  }

  await prisma.$disconnect();
}

function findDuplicatesInModulesConfig(configKeys: string[]): string[] {
  const modulesConfigKeys = extractModulesConfigKeys();
  const duplicates: string[] = [];

  for (const key of configKeys) {
    // Normaliser la clé pour la comparaison
    const normalizedKey = key.toLowerCase().replace(/_/g, "");

    // Chercher dans MODULES_CONFIG
    for (const moduleKey of modulesConfigKeys) {
      const normalizedModuleKey = moduleKey.toLowerCase().replace(/_/g, "");
      if (
        normalizedKey.includes(normalizedModuleKey) ||
        normalizedModuleKey.includes(normalizedKey)
      ) {
        duplicates.push(key);
        break;
      }
    }
  }

  return duplicates;
}

function extractModulesConfigKeys(): string[] {
  const keys: string[] = [];

  function traverse(obj: any, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        traverse(value, fullKey);
      } else {
        keys.push(fullKey);
      }
    }
  }

  traverse(MODULES_CONFIG);
  return keys;
}

// Exécuter l'analyse
analyzeConfiguration().catch(console.error);
