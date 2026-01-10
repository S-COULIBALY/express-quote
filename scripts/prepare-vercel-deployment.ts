/**
 * Script de préparation au déploiement Vercel
 *
 * Vérifie que tous les prérequis sont en place avant le déploiement
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface CheckResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
}

const checks: CheckResult[] = [];

function addCheck(
  name: string,
  status: "success" | "error" | "warning",
  message: string,
) {
  checks.push({ name, status, message });
  const icon = status === "success" ? "✅" : status === "error" ? "❌" : "⚠️";
  console.log(`${icon} ${name}: ${message}`);
}

console.log("🔍 Vérification des prérequis pour le déploiement Vercel...\n");

// 1. Vérifier que vercel.json existe
if (fs.existsSync("vercel.json")) {
  addCheck("vercel.json", "success", "Fichier de configuration Vercel trouvé");
} else {
  addCheck("vercel.json", "error", "Fichier vercel.json manquant");
}

// 2. Vérifier que package.json contient postinstall
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
if (packageJson.scripts.postinstall) {
  addCheck("postinstall script", "success", "Script postinstall présent");
} else {
  addCheck(
    "postinstall script",
    "error",
    "Script postinstall manquant dans package.json",
  );
}

// 3. Vérifier que le build script inclut prisma generate
if (packageJson.scripts.build?.includes("prisma generate")) {
  addCheck("build script", "success", "Script build inclut prisma generate");
} else {
  addCheck(
    "build script",
    "warning",
    "Script build ne contient pas prisma generate",
  );
}

// 4. Vérifier que Prisma schema existe
if (fs.existsSync("prisma/schema.prisma")) {
  addCheck("Prisma schema", "success", "Schéma Prisma trouvé");
} else {
  addCheck("Prisma schema", "error", "Schéma Prisma manquant");
}

// 5. Vérifier que next.config.js existe
if (fs.existsSync("next.config.js") || fs.existsSync("next.config.ts")) {
  addCheck("Next.js config", "success", "Configuration Next.js trouvée");
} else {
  addCheck("Next.js config", "warning", "Configuration Next.js non trouvée");
}

// 6. Vérifier que .gitignore existe et ignore .env
if (fs.existsSync(".gitignore")) {
  const gitignore = fs.readFileSync(".gitignore", "utf-8");
  if (gitignore.includes(".env")) {
    addCheck(".gitignore", "success", ".env est ignoré");
  } else {
    addCheck(".gitignore", "warning", ".env n'est pas ignoré");
  }
} else {
  addCheck(".gitignore", "warning", "Fichier .gitignore manquant");
}

// 7. Vérifier que le projet compile
console.log("\n🔨 Test de compilation TypeScript...");
try {
  execSync("npm run type-check", { stdio: "pipe" });
  addCheck("TypeScript", "success", "Compilation TypeScript réussie");
} catch (error) {
  addCheck("TypeScript", "error", "Erreurs de compilation TypeScript");
}

// 8. Vérifier que Prisma génère correctement
console.log("\n🔨 Test de génération Prisma...");
try {
  execSync("npx prisma generate", { stdio: "pipe" });
  addCheck("Prisma generate", "success", "Génération Prisma réussie");
} catch (error) {
  addCheck("Prisma generate", "error", "Erreur lors de la génération Prisma");
}

// Résumé
console.log("\n📊 RÉSUMÉ\n");
const errors = checks.filter((c) => c.status === "error");
const warnings = checks.filter((c) => c.status === "warning");
const successes = checks.filter((c) => c.status === "success");

console.log(`✅ Succès : ${successes.length}`);
console.log(`⚠️  Avertissements : ${warnings.length}`);
console.log(`❌ Erreurs : ${errors.length}\n`);

if (errors.length > 0) {
  console.log("❌ Des erreurs doivent être corrigées avant le déploiement :\n");
  errors.forEach((e) => console.log(`  - ${e.name}: ${e.message}`));
  process.exit(1);
} else if (warnings.length > 0) {
  console.log("⚠️  Des avertissements ont été détectés (non bloquants) :\n");
  warnings.forEach((w) => console.log(`  - ${w.name}: ${w.message}`));
  console.log("\n✅ Le projet est prêt pour le déploiement !");
  console.log("\n📝 Prochaines étapes :");
  console.log("  1. Configurer les variables d'environnement dans Vercel");
  console.log("  2. Exécuter : vercel --prod");
  console.log("  3. Ou connecter le repository GitHub à Vercel");
} else {
  console.log("✅ Tous les vérifications sont passées !");
  console.log("\n📝 Prochaines étapes :");
  console.log("  1. Configurer les variables d'environnement dans Vercel");
  console.log("  2. Exécuter : vercel --prod");
  console.log("  3. Ou connecter le repository GitHub à Vercel");
}
