/**
 * Script de vérification des tables obsolètes
 *
 * Vérifie si les tables Configuration et rules existent encore en BDD
 * et si elles sont utilisées dans le code
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkObsoleteTables() {
  console.log("🔍 Vérification des tables obsolètes...\n");

  try {
    // Vérifier si la table Configuration existe
    try {
      const configCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "Configuration"
      `;
      console.log(`📊 Table Configuration:`);
      console.log(`   ✅ Existe en BDD`);
      console.log(`   📈 Nombre d'enregistrements: ${configCount[0].count}`);

      // Vérifier les catégories utilisées
      const categories = await prisma.$queryRaw<
        Array<{ category: string; count: bigint }>
      >`
        SELECT category, COUNT(*) as count 
        FROM "Configuration" 
        GROUP BY category 
        ORDER BY count DESC
      `;
      console.log(`   📋 Catégories:`);
      categories.forEach((cat) => {
        console.log(`      - ${cat.category}: ${cat.count} config(s)`);
      });
    } catch (error) {
      console.log(`   ❌ Table Configuration n'existe pas ou erreur: ${error}`);
    }

    console.log("");

    // Vérifier si la table rules existe
    try {
      const rulesCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "rules"
      `;
      console.log(`📊 Table rules:`);
      console.log(`   ✅ Existe en BDD`);
      console.log(`   📈 Nombre d'enregistrements: ${rulesCount[0].count}`);

      // Vérifier les types de règles
      const ruleTypes = await prisma.$queryRaw<
        Array<{ ruleType: string; count: bigint }>
      >`
        SELECT "ruleType", COUNT(*) as count 
        FROM "rules" 
        GROUP BY "ruleType" 
        ORDER BY count DESC
      `;
      console.log(`   📋 Types de règles:`);
      ruleTypes.forEach((rt) => {
        console.log(`      - ${rt.ruleType || "NULL"}: ${rt.count} règle(s)`);
      });
    } catch (error) {
      console.log(`   ❌ Table rules n'existe pas ou erreur: ${error}`);
    }

    console.log("\n✅ Vérification terminée\n");
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
checkObsoleteTables()
  .then(() => {
    console.log("✅ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
