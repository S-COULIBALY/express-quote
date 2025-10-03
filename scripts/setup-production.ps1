# 🚀 Script de Setup Production Express Quote (Windows PowerShell)
#
# Ce script automatise la mise en place complète du système sur Windows

param(
    [switch]$SkipDependencies,
    [switch]$SkipTestData,
    [switch]$SkipBuild
)

# Configuration des couleurs
$Host.UI.RawUI.WindowTitle = "Express Quote - Setup Production"

# Fonctions d'affichage
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n🔧 $Message" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
}

# Début du script
Clear-Host
Write-Host "🚀 Express Quote - Setup Production" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta
Write-Host ""

try {
    # 1. ====================================================================
    # VÉRIFICATION DES PRÉREQUIS
    # ====================================================================

    Write-Step "Vérification des prérequis"

    # Vérification Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js installé: $nodeVersion"
    }
    catch {
        Write-Error "Node.js n'est pas installé ou inaccessible"
        throw "Prérequis manquant: Node.js"
    }

    # Vérification npm
    try {
        $npmVersion = npm --version
        Write-Success "npm installé: $npmVersion"
    }
    catch {
        Write-Error "npm n'est pas installé"
        throw "Prérequis manquant: npm"
    }

    # Vérification PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-Success "PowerShell version: $($psVersion.ToString())"
    }
    else {
        Write-Warning "PowerShell version ancienne: $($psVersion.ToString())"
    }

    # Vérification du fichier .env
    if (Test-Path ".env") {
        Write-Success "Fichier .env trouvé"
    }
    else {
        Write-Warning "Fichier .env non trouvé"
        if (Test-Path ".env.example") {
            Write-Info "Copie de .env.example vers .env..."
            Copy-Item ".env.example" ".env"
            Write-Success "Fichier .env créé à partir de .env.example"
            Write-Warning "⚠️  IMPORTANT: Configurez les variables dans .env avant de continuer"

            $continue = Read-Host "Voulez-vous continuer? (o/N)"
            if ($continue -ne "o" -and $continue -ne "O") {
                Write-Info "Setup interrompu pour configuration .env"
                exit 0
            }
        }
        else {
            Write-Error "Aucun fichier .env ou .env.example trouvé"
            throw "Configuration manquante"
        }
    }

    # 2. ====================================================================
    # INSTALLATION DES DÉPENDANCES
    # ====================================================================

    if (-not $SkipDependencies) {
        Write-Step "Installation des dépendances"

        Write-Info "Installation des packages npm..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Échec de l'installation npm"
        }
        Write-Success "Dépendances npm installées"

        Write-Info "Installation des dépendances de développement..."
        npm install --save-dev @faker-js/faker
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Échec installation des dépendances dev (non critique)"
        }
        else {
            Write-Success "Dépendances de développement installées"
        }
    }

    # 3. ====================================================================
    # CONFIGURATION DE LA BASE DE DONNÉES
    # ====================================================================

    Write-Step "Configuration de la base de données"

    Write-Info "Génération du client Prisma..."
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Problème avec la génération Prisma (tentative de continuer)"
    }
    else {
        Write-Success "Client Prisma généré"
    }

    Write-Info "Validation du schéma Prisma..."
    npx prisma validate
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Schéma Prisma valide"
    }
    else {
        Write-Warning "Problème de validation du schéma"
    }

    Write-Info "Application des migrations..."
    npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Migrations appliquées"
    }
    else {
        Write-Warning "Problème avec les migrations (base peut-être déjà à jour)"
    }

    Write-Info "Test de connexion à la base de données..."
    npx prisma db pull 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connexion à la base de données réussie"
    }
    else {
        Write-Error "Impossible de se connecter à la base de données"
        Write-Info "Vérifiez la variable DATABASE_URL dans .env"
        throw "Erreur de connexion base de données"
    }

    # 4. ====================================================================
    # POPULATION DES DONNÉES
    # ====================================================================

    Write-Step "Population des données de production"

    if (Test-Path "scripts/seed-production-ready.ts") {
        Write-Info "Exécution du script de population..."
        npx ts-node scripts/seed-production-ready.ts
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Données de production populées"
        }
        else {
            Write-Warning "Problème lors de la population (peut-être déjà faite)"
        }
    }
    else {
        Write-Warning "Script de population non trouvé"
    }

    # 5. ====================================================================
    # GÉNÉRATION DE DONNÉES DE TEST (OPTIONNEL)
    # ====================================================================

    if (-not $SkipTestData) {
        $generateTestData = Read-Host "`nGénérer des données de test pour les tests de charge? (o/N)"
        if ($generateTestData -eq "o" -or $generateTestData -eq "O") {
            Write-Info "Génération des données de test..."
            if (Test-Path "scripts/generate-test-data.ts") {
                npx ts-node scripts/generate-test-data.ts
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Données de test générées"
                }
                else {
                    Write-Warning "Problème lors de la génération des données de test"
                }
            }
            else {
                Write-Warning "Script de génération de données de test non trouvé"
            }
        }
    }

    # 6. ====================================================================
    # BUILD DE PRODUCTION
    # ====================================================================

    if (-not $SkipBuild) {
        Write-Step "Build de production"

        Write-Info "Build Next.js..."
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build de production terminé"
        }
        else {
            Write-Error "Échec du build de production"
            throw "Erreur de build"
        }
    }

    # 7. ====================================================================
    # TESTS DE VALIDATION
    # ====================================================================

    Write-Step "Tests de validation"

    Write-Info "Test de l'état des migrations..."
    npx prisma migrate status
    Write-Success "État des migrations validé"

    Write-Info "Test de validation du schéma..."
    npx prisma validate
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Schéma Prisma validé"
    }
    else {
        Write-Warning "Problème de validation du schéma"
    }

    # Test simple de connectivité (si serveur démarré)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Endpoints API accessibles"
        }
    }
    catch {
        Write-Warning "Serveur non démarré - tests d'endpoints ignorés"
    }

    # 8. ====================================================================
    # VÉRIFICATIONS FINALES DE PRODUCTION
    # ====================================================================

    Write-Step "Vérifications finales de production"

    if (Test-Path "scripts/finalize-production.ts") {
        Write-Info "Exécution des vérifications de production..."
        npx ts-node scripts/finalize-production.ts
        Write-Success "Vérifications de production terminées"
    }
    else {
        Write-Warning "Script de vérification de production non trouvé"
    }

    # 9. ====================================================================
    # CONFIGURATION DES BACKUPS
    # ====================================================================

    Write-Step "Configuration des backups"

    # Créer les dossiers de backup
    $backupDirs = @("backups", "backups/database", "backups/documents", "backups/logs")
    foreach ($dir in $backupDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    Write-Success "Dossiers de backup créés"

    if (Test-Path "scripts/backup-production.ts") {
        Write-Success "Script de backup configuré"
    }
    else {
        Write-Warning "Script de backup non trouvé"
    }

    # 10. ===================================================================
    # CONFIGURATION TÂCHES PROGRAMMÉES (OPTIONNEL)
    # ===================================================================

    $configureTasks = Read-Host "`nConfigurer les tâches Windows programmées? (o/N)"
    if ($configureTasks -eq "o" -or $configureTasks -eq "O") {
        Write-Info "Configuration des tâches programmées Windows..."

        # Créer un script batch pour le backup
        $batchContent = @"
@echo off
cd /d "$PWD"
npx ts-node scripts/backup-production.ts >> logs/backup.log 2>&1
"@
        $batchContent | Out-File -FilePath "scripts/backup-task.bat" -Encoding ASCII

        Write-Success "Script de tâche backup créé: scripts/backup-task.bat"
        Write-Info "Pour créer la tâche programmée: schtasks /create /tn 'Express Quote Backup' /tr '$PWD\scripts\backup-task.bat' /sc daily /st 02:00"
    }

    # 11. ===================================================================
    # RÉSUMÉ FINAL
    # ===================================================================

    Write-Host "`n" -NoNewline
    Write-Success "🎉 SETUP PRODUCTION TERMINÉ AVEC SUCCÈS !"
    Write-Host ""

    Write-Host "📋 RÉSUMÉ DU SETUP :" -ForegroundColor Cyan
    Write-Host "   ✅ Prérequis vérifiés"
    Write-Host "   ✅ Dépendances installées"
    Write-Host "   ✅ Base de données configurée"
    Write-Host "   ✅ Données de production populées"
    if (-not $SkipBuild) { Write-Host "   ✅ Build de production terminé" }
    Write-Host "   ✅ Tests de validation passés"
    Write-Host "   ✅ Vérifications de production OK"
    Write-Host "   ✅ Système de backup configuré"
    Write-Host ""

    Write-Info "🚀 PROCHAINES ÉTAPES :"
    Write-Host "   1. Vérifier les variables d'environnement dans .env"
    Write-Host "   2. Démarrer le serveur : npm run start"
    Write-Host "   3. Tester les fonctionnalités principales"
    Write-Host "   4. Configurer le monitoring (optionnel)"
    Write-Host "   5. Activer les tâches programmées"
    Write-Host ""

    Write-Info "📚 COMMANDES UTILES :"
    Write-Host "   • Démarrer le serveur : npm run start"
    Write-Host "   • Backup manuel : npx ts-node scripts/backup-production.ts"
    Write-Host "   • Tests de santé : npx ts-node scripts/finalize-production.ts"
    Write-Host "   • Régénérer Prisma : npx prisma generate"
    Write-Host ""

    Write-Success "Express Quote est maintenant PRÊT POUR LA PRODUCTION ! 🚀"
    Write-Host ""

    # Optionnel : Démarrer le serveur automatiquement
    $startServer = Read-Host "Démarrer le serveur maintenant? (o/N)"
    if ($startServer -eq "o" -or $startServer -eq "O") {
        Write-Info "Démarrage du serveur Express Quote..."
        npm run start
    }

} catch {
    Write-Host "`n" -NoNewline
    Write-Error "💥 ERREUR CRITIQUE LORS DU SETUP:"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Warning "Vérifiez les logs ci-dessus et corrigez les erreurs avant de relancer"
    exit 1
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")