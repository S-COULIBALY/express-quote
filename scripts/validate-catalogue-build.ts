import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Configuration des tests
const CONFIG = {
  // Points d'entrée critiques à vérifier
  criticalFiles: [
    "src/components/form-generator/FormGenerator.tsx",
    "src/components/form-generator/presets/index.ts",
    "src/components/form-generator/presets/catalogueMovingItem-service/index.ts",
    "src/components/form-generator/presets/catalogueCleaningItem-service/index.ts",
    "src/components/form-generator/presets/demenagement-sur-mesure-service/index.ts",
    "src/components/form-generator/presets/menage-sur-mesure-service/index.ts",
  ],

  // Imports critiques à vérifier
  criticalImports: [
    "CatalogueMovingItemPreset",
    "CatalogueCleaningItemPreset",
    "DemenagementSurMesurePreset",
    "MenageSurMesurePreset",
  ],

  // Presets qui doivent être présents
  requiredPresets: [
    "catalogueMovingItem-service",
    "catalogueCleaningItem-service",
    "demenagement-sur-mesure-service",
    "menage-sur-mesure-service",
  ],
};

class CatalogueValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  // Vérifie que tous les fichiers critiques existent
  private validateCriticalFiles(): void {
    console.log("🔍 Vérification des fichiers critiques...");
    CONFIG.criticalFiles.forEach((file) => {
      if (!fs.existsSync(file)) {
        this.errors.push(`❌ Fichier critique manquant: ${file}`);
      } else {
        console.log(`✅ Fichier présent: ${file}`);
      }
    });
  }

  // Vérifie que les imports critiques sont disponibles
  private validateCriticalImports(): void {
    console.log("\n🔍 Vérification des imports critiques...");
    const indexContent = fs.readFileSync(
      "src/components/form-generator/presets/index.ts",
      "utf8",
    );

    CONFIG.criticalImports.forEach((importName) => {
      if (!indexContent.includes(importName)) {
        this.errors.push(`❌ Import critique manquant: ${importName}`);
      } else {
        console.log(`✅ Import disponible: ${importName}`);
      }
    });
  }

  // Vérifie que les presets requis sont présents et complets
  private validatePresets(): void {
    console.log("\n🔍 Vérification des presets...");
    CONFIG.requiredPresets.forEach((preset) => {
      const presetPath = `src/components/form-generator/presets/${preset}`;
      if (!fs.existsSync(presetPath)) {
        this.errors.push(`❌ Preset manquant: ${preset}`);
        return;
      }

      // Vérifier les fichiers essentiels du preset
      const requiredFiles = ["index.ts"];
      requiredFiles.forEach((file) => {
        if (!fs.existsSync(path.join(presetPath, file))) {
          this.errors.push(`❌ Fichier manquant dans ${preset}: ${file}`);
        }
      });

      console.log(`✅ Preset validé: ${preset}`);
    });
  }

  // Tente de faire un build du projet
  private async validateBuild(): Promise<void> {
    console.log("\n🔨 Test du build...");
    try {
      // Lancer le build sans gérer le backup de .next
      execSync("npm run build", { stdio: "inherit" });
      console.log("✅ Build réussi");
    } catch (error) {
      this.errors.push("❌ Échec du build");
      console.error("Erreur détaillée:", error);
    }
  }

  // Vérifie les imports obsolètes
  private checkObsoleteImports(): void {
    console.log("\n🔍 Vérification des imports obsolètes...");
    const obsoletePatterns = [
      "moving-service",
      "cleaning-service",
      "PackageLayout",
      "AuthLayout",
    ];

    const checkFile = (filePath: string) => {
      const content = fs.readFileSync(filePath, "utf8");
      obsoletePatterns.forEach((pattern) => {
        if (content.includes(pattern)) {
          this.warnings.push(
            `⚠️ Import obsolète trouvé dans ${filePath}: ${pattern}`,
          );
        }
      });
    };

    // Parcourir récursivement le dossier form-generator
    const walkDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          checkFile(filePath);
        }
      });
    };

    walkDir("src/components/form-generator");
  }

  // Exécute toutes les validations
  public async validate(): Promise<boolean> {
    console.log("🚀 Démarrage de la validation du catalogue...\n");

    this.validateCriticalFiles();
    this.validateCriticalImports();
    this.validatePresets();
    this.checkObsoleteImports();
    await this.validateBuild();

    // Afficher le rapport
    console.log("\n📊 Rapport de validation:");

    if (this.errors.length > 0) {
      console.log("\n❌ Erreurs:");
      this.errors.forEach((error) => console.log(error));
    }

    if (this.warnings.length > 0) {
      console.log("\n⚠️ Avertissements:");
      this.warnings.forEach((warning) => console.log(warning));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("\n✅ Validation réussie! Le catalogue est fonctionnel.");
      return true;
    }

    return this.errors.length === 0;
  }
}

// Exécution du script
const validator = new CatalogueValidator();
validator
  .validate()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Erreur lors de la validation:", error);
    process.exit(1);
  });
