/**
 * Script de déploiement automatique sur Vercel
 *
 * Ce script prépare et déploie le projet sur Vercel
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Préparation du déploiement sur Vercel...\n");

// 1. Vérifier que vercel.json existe
if (!fs.existsSync("vercel.json")) {
  console.error("❌ vercel.json manquant");
  process.exit(1);
}

// 2. Vérifier que package.json contient les scripts nécessaires
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
if (!packageJson.scripts.postinstall) {
  console.error("❌ Script postinstall manquant dans package.json");
  process.exit(1);
}

// 3. Vérifier que Prisma schema existe
if (!fs.existsSync("prisma/schema.prisma")) {
  console.error("❌ Schéma Prisma manquant");
  process.exit(1);
}

console.log("✅ Tous les fichiers de configuration sont présents\n");

// 4. Instructions pour le déploiement
console.log("📋 INSTRUCTIONS POUR LE DÉPLOIEMENT :\n");
console.log("1. Se connecter à Vercel :");
console.log("   vercel login\n");
console.log("2. Lier le projet (si pas déjà fait) :");
console.log("   vercel link\n");
console.log("3. Configurer les variables d'environnement :");
console.log("   - Via dashboard Vercel : Settings > Environment Variables");
console.log("   - Ou via CLI : vercel env add <VARIABLE_NAME>\n");
console.log("4. Déployer :");
console.log("   vercel --prod\n");
console.log(
  "📚 Voir docs/GUIDE_DEPLOIEMENT_VERCEL_COMPLET.md pour plus de détails\n",
);

// 5. Vérifier si le projet est déjà lié
if (fs.existsSync(".vercel/project.json")) {
  const projectConfig = JSON.parse(
    fs.readFileSync(".vercel/project.json", "utf-8"),
  );
  console.log("✅ Projet déjà lié à Vercel :");
  console.log(`   - Project ID: ${projectConfig.projectId}`);
  console.log(`   - Org ID: ${projectConfig.orgId}\n`);
  console.log("💡 Vous pouvez maintenant déployer avec : vercel --prod\n");
} else {
  console.log("⚠️  Projet non encore lié à Vercel");
  console.log('💡 Exécutez "vercel link" pour lier le projet\n');
}

// 6. Liste des variables d'environnement requises
console.log("📝 VARIABLES D'ENVIRONNEMENT REQUISES :\n");
const requiredEnvVars = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "REDIS_URL",
];

console.log("Variables REQUISES :");
requiredEnvVars.forEach((v) => console.log(`  - ${v}`));
console.log(
  "\n📚 Voir docs/GUIDE_DEPLOIEMENT_VERCEL_COMPLET.md pour la liste complète\n",
);
